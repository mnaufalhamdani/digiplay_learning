import 'server-only';
import { AppError } from '@/utils/appError';
import { uraiJson, teksJson } from '@/utils/json';
import { gabungDetailTombol, hitungAkurasi, hitungBintang, hitungWpm, susunTeksAdaptif, tombolLemah } from '@/utils/mengetik';
import { t } from '@/utils/i18n';
import { BATAS_LATIHAN, MODE_MENGETIK } from '@/enums';

/** Jumlah hasil terakhir untuk latihan adaptif, grafik kemajuan, dan peta panas. */
const JUMLAH = Object.freeze({ adaptif: 10, grafik: 20, petaPanas: 30 });

/** Baris pelajaran dengan angka yang dirapikan (DECIMAL kembali sebagai teks). */
function bentukPelajaran(p) {
  return { ...p, urutan: Number(p.urutan), target_wpm: Number(p.target_wpm), target_akurasi: Number(p.target_akurasi) };
}

/**
 * Usecase mengetik (D1): pelajaran bertahap, latihan adaptif, tes bebas, game Hujan Kata, kemajuan,
 * dan penyimpanan hasil yang dihitung ulang di server. Menyimpan hasil hanya saat sesi berlangsung; mencoba latihan boleh tanpa sesi.
 */
export function buatMengetikUsecase({ mengetikModel, sesiModel, tugasUsecase, idGen, acak }) {
  /** Sesi berlangsung siswa atau 403 (di luar sesi latihan hanya mode lihat saja). */
  async function wajibSesi(siswaId) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId);
    if (!sesi) throw new AppError(t('latihan.butuhSesi'), 403);
    return sesi;
  }
  /** Level bank teks: dari sesi berlangsung bila ada, selain itu dari level berjalan siswa (null bila tidak ada). */
  async function levelBank(siswaId) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId);
    // di luar sesi (belum absen / sudah pulang) level diambil dari level berjalan siswa
    return sesi ? sesi.level_id : mengetikModel.levelBerjalan(siswaId);
  }
  /** Pelajaran beserta status terbuka, hasil terbaik, dan bintang untuk seorang siswa. */
  async function pelajaranSiswa(siswaId) {
    const [daftar, hasil] = await Promise.all([mengetikModel.daftarPelajaran(), mengetikModel.hasilPelajaran(siswaId)]);
    let sebelumnyaTercapai = true; // pelajaran pertama selalu terbuka
    return daftar.map(bentukPelajaran).map((p) => {
      const milik = hasil.filter((h) => h.pelajaran_id === p.id).map((h) => ({ wpm: Number(h.wpm), akurasi: Number(h.akurasi) }));
      const bintang = Math.max(0, ...milik.map((h) => hitungBintang(h.wpm, h.akurasi, p.target_wpm, p.target_akurasi)));
      const terbaik = milik.sort((a, b) => b.wpm - a.wpm)[0] ?? null;
      const terbuka = sebelumnyaTercapai;
      // pelajaran berikutnya terbuka hanya bila target pelajaran ini pernah tercapai
      sebelumnyaTercapai = bintang > 0;
      return { ...p, terbuka, bintang, terbaik };
    });
  }
  /**
   * Validasi kewajaran lalu hitung ulang WPM dan akurasi dari jumlah karakter (angka dari browser tidak dipercaya).
   * Menolak durasi < 3 detik, WPM > 250, dan ketikan benar melebihi seluruh ketikan (akurasi di luar 0-100).
   */
  function hitungUlang({ jumlahKarakterBenar: benar, jumlahKarakterDiketik: diketik, durasiDetik }) {
    if (durasiDetik < BATAS_LATIHAN.minDurasiMengetik || benar > diketik) throw new AppError(t('latihan.hasilTidakWajar'), 400);
    const wpm = hitungWpm(benar, durasiDetik);
    if (wpm > BATAS_LATIHAN.maksWpm) throw new AppError(t('latihan.hasilTidakWajar'), 400);
    return { wpm, akurasi: hitungAkurasi(benar, diketik) };
  }
  /** Menyimpan satu hasil (semua mode, termasuk tes post test). Hasil: { id, wpm, akurasi }. */
  async function simpanHasilMengetik(siswaId, sesiId, data, conn = null) {
    const { wpm, akurasi } = hitungUlang(data);
    const id = idGen.generate();
    const baris = { id, siswaId, sesiId, pelajaranId: data.pelajaranId ?? null, mode: data.mode, wpm, akurasi, konsistensi: data.konsistensi, durasiDetik: Math.round(data.durasiDetik), detailTombol: teksJson(data.detailTombol) };
    await mengetikModel.tambahHasil(baris, conn);
    return { id, wpm, akurasi };
  }
  /** Kemajuan: 20 hasil terakhir untuk grafik (lama ke baru) dan gabungan detail tombol 30 hasil terakhir untuk peta panas. */
  async function kemajuanSiswa(siswaId) {
    const terakhir = await mengetikModel.hasilTerakhir(siswaId, JUMLAH.petaPanas);
    const grafik = terakhir.slice(0, JUMLAH.grafik).reverse().map((h) => ({ wpm: Number(h.wpm), akurasi: Number(h.akurasi), waktu: h.created_at, mode: h.mode }));
    return { grafik, petaPanas: gabungDetailTombol(terakhir.map((h) => uraiJson(h.detail_tombol))) };
  }
  return {
    simpanHasilMengetik,
    /** Daftar pelajaran untuk halaman Mengetik. */
    pelajaran: (siswaId) => pelajaranSiswa(siswaId),
    /**
     * Siswa menyimpan hasil latihan (pelajaran/latihan/game) pada sesi berlangsung. Pelajaran yang masih terkunci ditolak.
     * Setelah tersimpan, tugas mengetik yang cocok otomatis diselesaikan.
     */
    async simpan(siswaId, data) {
      const sesi = await wajibSesi(siswaId);
      if (data.mode === MODE_MENGETIK.PELAJARAN) {
        const p = (await pelajaranSiswa(siswaId)).find((x) => x.id === data.pelajaranId);
        // pelajaran tidak dikenal atau belum terbuka (target sebelumnya belum tercapai)
        if (!p?.terbuka) throw new AppError(t('mengetik.pelajaranTerkunci'), 403);
      }
      const hasil = await simpanHasilMengetik(siswaId, sesi.id, data);
      const tugas = await tugasUsecase.selesaikanOtomatis(siswaId, { tipe: 'mengetik', mode: data.mode, teks: data.teks, wpm: hasil.wpm, akurasi: hasil.akurasi });
      return { wpm: hasil.wpm, akurasi: hasil.akurasi, ...tugas };
    },
    /** Teks latihan adaptif dari tombol yang paling sering salah pada 10 hasil terakhir; null bila belum ada data. */
    async adaptif(siswaId) {
      const terakhir = await mengetikModel.hasilTerakhir(siswaId, JUMLAH.adaptif);
      const tombol = tombolLemah(gabungDetailTombol(terakhir.map((h) => uraiJson(h.detail_tombol))));
      // belum ada tombol yang cukup sering salah
      if (tombol.length === 0) return { tombol, teks: null };
      const [bank, pelajaran] = await Promise.all([levelBank(siswaId).then((levelId) => mengetikModel.teksBank(levelId)), mengetikModel.daftarPelajaran()]);
      return { tombol, teks: susunTeksAdaptif(tombol, [...bank, ...pelajaran.map((p) => p.teks_latihan)], acak) };
    },
    /** Satu teks acak dari bank level siswa (tes bebas). */
    async teksAcak(siswaId) {
      const bank = await mengetikModel.teksBank(await levelBank(siswaId));
      if (bank.length === 0) throw new AppError(t('mengetik.bankKosong'), 404);
      return { teks: bank[acak(bank.length)] };
    },
    /** Kata-kata sederhana (huruf saja, 2-8 karakter) dari bank untuk game Hujan Kata. */
    async kataGame(siswaId) {
      const bank = await mengetikModel.teksBank(await levelBank(siswaId));
      const kata = [...new Set(bank.flatMap((tk) => tk.toLowerCase().split(/[^a-z]+/)))].filter((k) => String(k).length >= 2 && String(k).length <= 8);
      return { kata };
    },
    kemajuan: kemajuanSiswa,
    /** Ringkasan untuk tab Latihan di detail siswa (pengelola). */
    async statistikSiswa(siswaId) {
      const [s, kemajuan] = await Promise.all([mengetikModel.statistik(siswaId), kemajuanSiswa(siswaId)]);
      return { wpmTerbaik: s?.wpm_terbaik == null ? null : Number(s.wpm_terbaik), akurasiRata: s?.akurasi_rata == null ? null : Math.round(Number(s.akurasi_rata) * 100) / 100, jumlah: Number(s?.jumlah ?? 0), grafik: kemajuan.grafik };
    },
  };
}
