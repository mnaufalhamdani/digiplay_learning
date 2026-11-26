import 'server-only';
import { AppError, adalahAppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { uraiJson, teksJson } from '@/utils/json';
import { hitungNilaiMengetik } from '@/utils/mengetik';
import { bacaBerkasGambar } from '@/utils/berkasGambar';
import { hasilBerkas } from '@/utils/responseHandler';
import { jawabanHarapan, periksaJawaban, renderTemplate } from '@/utils/templateRender';
import { t } from '@/utils/i18n';
import { namaUnduhan } from '@/modules/tugas/tugas.usecase';
import { AKSI_LOG, JENIS_GAMBAR_UNDUH, KUNCI_PENGATURAN, MODE_MENGETIK, NOMOR_POST_TEST, PENILAIAN, SUMBER_NILAI, STATUS_POST_TEST, WAKTU_POST_TEST } from '@/enums';

/** Pembulatan 2 desimal. */
const bulat2 = (n) => Math.round(Number(n) * 100) / 100;

/** Baris post test dengan angka/boolean dirapikan dan sisa waktu. */
function bentukPt(b) {
  // tes ulang yang belum dimulai ditandai terakhir_aktif_at NULL
  const dimulai = b.terakhir_aktif_at != null;
  return {
    ...b,
    percobaan_ke: Number(b.percobaan_ke),
    durasi_detik: Number(b.durasi_detik),
    terpakai_detik: Number(b.terpakai_detik),
    sisa_detik: Math.max(0, Number(b.durasi_detik) - Number(b.terpakai_detik)),
    nilai_total: b.nilai_total == null ? null : Number(b.nilai_total),
    lulus: b.lulus == null ? null : Boolean(b.lulus),
    bagian_ulang: uraiJson(b.bagian_ulang),
    dimulai,
  };
}

/** Bagian dengan angka dirapikan (DECIMAL kembali sebagai teks). */
function bentukBagian(b) {
  return { ...b, bobot: Number(b.bobot), jumlah_soal: Number(b.jumlah_soal), target_wpm: b.target_wpm == null ? null : Number(b.target_wpm) };
}

/** Skor maksimum satu butir praktik: jumlah poin rubrik, atau 100 bila rubrik kosong/rusak. */
function maksButir(rubrik) {
  const total = (Array.isArray(rubrik) ? rubrik : []).reduce((n, r) => n + (Number(r.poin) || 0), 0);
  // rubrik tanpa poin yang bisa dijumlahkan: skala bawaan 0-100
  return total > 0 ? total : 100;
}

/** Gambar bahan unduhan (mewarnai/berwarna) pada parameter_hasil sebuah butir: [{ kode, nama, jenis }]. */
function bahanButir(ph) {
  return (ph.gambar ?? []).filter((g) => JENIS_GAMBAR_UNDUH.includes(g.jenis));
}

/** Butir dengan parameter_hasil diurai. */
function bentukButir(b) {
  return { ...b, ph: uraiJson(b.parameter_hasil) ?? {}, benar: b.benar == null ? null : Boolean(b.benar) };
}

/**
 * Usecase post test (D2): mulai, waktu dijaga server (denyut), jawaban tanpa umpan balik, kumpul dan penilaian
 * otomatis, finalisasi kelulusan, penilaian bagian praktik oleh tutor, dan tes ulang per bagian.
 */
export function buatPosttestUsecase({ posttestModel, sesiModel, siswaModel, mengetikUsecase, mengetikModel, gambarUsecase, pengaturanUsecase, sertifikatUsecase, logUsecase, catatAktivitas, idGen, acak, folderGambar, db }) {
  /** Salinan array berurutan acak (Fisher-Yates, RNG disuntikkan). */
  function acakUrutan(daftar) {
    const hasil = [...daftar];
    for (let i = hasil.length - 1; i > 0; i -= 1) {
      const j = acak(i + 1);
      [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
    }
    return hasil;
  }
  /** ID bagian yang dikerjakan pada percobaan: percobaan pertama semua bagian; tes ulang sesuai pilihan tutor (kolom bagian_ulang). */
  async function bagianDiulang(pt, semuaBagian) {
    if (pt.percobaan_ke === 1) return semuaBagian.map((b) => b.id);
    // tes ulang mencatat bagian pilihan tutor di kolom bagian_ulang
    if (Array.isArray(pt.bagian_ulang) && pt.bagian_ulang.length > 0) return pt.bagian_ulang.map(String);
    // tes ulang yang dibuka sebelum kolom bagian_ulang ada: bagian dibaca dari detail log buka_tes_ulang
    const detail = await logUsecase.detailTerakhir(AKSI_LOG.BUKA_TES_ULANG, 'post_test', pt.id);
    return detail?.bagianIds ?? semuaBagian.map((b) => b.id);
  }
  /** Teks tes mengetik deterministik per percobaan: indeks = ID post test mod jumlah teks (sama saat dilanjutkan). */
  async function teksMengetik(pt, conn = null) {
    const bank = await mengetikModel.teksBank(pt.level_id, conn);
    if (bank.length === 0) return null;
    return bank[Number(BigInt(pt.id) % BigInt(bank.length))];
  }
  /** Render satu template; null bila gagal (mis. bank gambar kosong) sehingga diganti template lain. */
  function renderAman(tpl, gambarTersedia) {
    try {
      return renderTemplate({ ...tpl, parameter: uraiJson(tpl.parameter), opsi: uraiJson(tpl.opsi), kunci: uraiJson(tpl.kunci) }, { acak, gambarTersedia });
    } catch (error) {
      // galat render yang dikenal: lewati template ini; galat lain diteruskan
      if (!adalahAppError(error)) throw error;
      return null;
    }
  }
  /** Membuat butir untuk satu bagian (soal/praktik): `jumlah_soal` template acak tanpa pengulangan; bank kurang dicatat ke log. */
  async function buatButirBagian(pt, bagian, gambarTersedia, conn) {
    let dibuat = 0;
    for (const tpl of acakUrutan(await posttestModel.templateBagian(bagian.id, conn))) {
      // jumlah butir bagian ini sudah cukup
      if (dibuat >= bagian.jumlah_soal) break;
      const r = renderAman(tpl, gambarTersedia);
      if (!r) continue;
      const ph = { nilai: r.nilaiParameter, gambar: r.gambar, opsi: r.opsi ?? [], kunci: r.kunci, siapDinilai: false };
      await posttestModel.tambahButir({ id: idGen.generate(), sesiId: pt.sesi_id, postTestId: pt.id, templateId: tpl.id, soalTeks: r.teks, parameterHasil: teksJson(ph) }, conn);
      dibuat += 1;
    }
    // bank soal bagian ini kurang dari jumlah butir: semua dipakai dan dicatat sebagai peringatan
    if (dibuat < bagian.jumlah_soal) await catatAktivitas({ aksi: AKSI_LOG.BANK_SOAL_KURANG, entitas: 'post_test', entitasId: pt.id, detail: { bagian: bagian.kode, butuh: bagian.jumlah_soal, ada: dibuat } }, conn);
  }
  /** Membuat butir untuk bagian-bagian yang dikerjakan (tes mengetik tidak punya butir tugas_siswa). */
  async function buatButir(pt, daftarBagian, conn) {
    const gambarTersedia = await gambarUsecase.tersedia();
    for (const b of daftarBagian) if (b.sumber !== 'tes_mengetik') await buatButirBagian(pt, b, gambarTersedia, conn);
  }
  /** Post test berlangsung milik siswa pada level berjalannya; null bila tidak ada. */
  async function ptBerlangsungSiswa(siswaId, conn = null, kunci = false) {
    const siswa = await siswaModel.cariId(siswaId, conn);
    if (!siswa?.siswa_level_id) return null;
    const pt = await posttestModel.terakhir(siswa.siswa_level_id, conn, kunci);
    return pt && pt.status === STATUS_POST_TEST.BERLANGSUNG ? bentukPt(pt) : null;
  }
  /** Post test yang sedang dikerjakan (berlangsung dan sudah dimulai) atau 409. */
  async function wajibPtJalan(siswaId, conn = null, kunci = false) {
    const pt = await ptBerlangsungSiswa(siswaId, conn, kunci);
    if (!pt?.dimulai) throw new AppError(t('posttest.tidakBerjalan'), 409);
    return pt;
  }
  /** Keadaan post test untuk beranda siswa pada pertemuan 13 (atau null bila bukan). */
  async function keadaanBeranda(siswaId, conn = null) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId, conn);
    const siswa = await siswaModel.cariId(siswaId, conn);
    // hanya pada sesi pertemuan post test dari level yang sedang berjalan
    if (!sesi || Number(sesi.pertemuan_nomor) !== NOMOR_POST_TEST || siswa?.siswa_level_id !== sesi.siswa_level_id) return null;
    const terakhir = await posttestModel.terakhir(sesi.siswa_level_id, conn, Boolean(conn));
    const pt = terakhir ? bentukPt(terakhir) : null;
    if (!pt) return { sesi, pt, aksi: 'mulai' };
    if (pt.status === STATUS_POST_TEST.BERLANGSUNG) return { sesi, pt, aksi: pt.dimulai ? 'lanjutkan' : 'mulaiUlang' };
    // sudah selesai: lulus, belum lulus (menunggu tes ulang dari tutor), atau masih dinilai
    return { sesi, pt, aksi: null, keadaan: pt.lulus === true ? 'lulus' : pt.lulus === false ? 'belumLulus' : 'menunggu' };
  }
  /** Finalisasi (D2.5, idempoten): bila semua bagian bernilai, hitung total dan kelulusan; lulus memanggil titik sertifikat. */
  async function finalisasi(ptId, conn) {
    const pt = bentukPt(await posttestModel.cariId(ptId, conn));
    const [bagian, nilai] = await Promise.all([posttestModel.bagianLevel(pt.level_id, conn), posttestModel.nilai(ptId, conn)]);
    const per = new Map(nilai.map((n) => [n.bagian_id, Number(n.nilai)]));
    // masih ada bagian yang belum dinilai (biasanya praktik yang menunggu tutor)
    if (bagian.some((b) => !per.has(b.id))) return null;
    const [lulusTotal, lulusBagian] = await Promise.all([pengaturanUsecase.angka(KUNCI_PENGATURAN.NILAI_LULUS_TOTAL), pengaturanUsecase.angka(KUNCI_PENGATURAN.NILAI_LULUS_BAGIAN)]);
    const total = bulat2(bagian.map(bentukBagian).reduce((n, b) => n + (Number(per.get(b.id)) * b.bobot) / 100, 0));
    const lulus = total >= lulusTotal && bagian.every((b) => per.get(b.id) >= lulusBagian);
    await posttestModel.simpanFinal(ptId, total, lulus, conn);
    await catatAktivitas({ aksi: AKSI_LOG.FINALISASI_POST_TEST, entitas: 'post_test', entitasId: ptId, detail: { total, lulus } }, conn);
    // lulus: sertifikat terbit otomatis (idempoten; kegagalannya tidak menggagalkan finalisasi). Level tidak naik otomatis
    if (lulus) await sertifikatUsecase.terbitkanOtomatis(ptId, conn);
    return { total, lulus };
  }
  /** Mengumpulkan (D2.4, idempoten): nilai bagian soal dan tes mengetik dihitung, lalu finalisasi bila lengkap. */
  async function kumpulkan(ptId) {
    return db.transaction(async (conn) => {
      const pt = bentukPt(await posttestModel.cariId(ptId, conn, true));
      // sudah dikumpulkan: hasilnya tetap sama
      if (pt.status === STATUS_POST_TEST.SELESAI) return { id: ptId };
      const bagian = (await posttestModel.bagianLevel(pt.level_id, conn)).map(bentukBagian);
      const diulang = await bagianDiulang(pt, bagian);
      const [butir, nilai] = await Promise.all([posttestModel.butir(ptId, conn), posttestModel.nilai(ptId, conn)]);
      for (const b of bagian.filter((x) => diulang.includes(x.id))) {
        // soal: benar / jumlah butir bagian; belum dijawab dihitung salah
        if (b.sumber === 'soal') {
          const benar = butir.filter((x) => x.bagian_id === b.id && Number(x.benar) === 1).length;
          await posttestModel.simpanNilai({ id: idGen.generate(), postTestId: ptId, bagianId: b.id, nilai: bulat2((100 * benar) / b.jumlah_soal), sumber: SUMBER_NILAI.OTOMATIS }, conn);
        }
        // tes mengetik yang tidak dikerjakan bernilai 0
        if (b.sumber === 'tes_mengetik' && !nilai.some((n) => n.bagian_id === b.id)) await posttestModel.simpanNilai({ id: idGen.generate(), postTestId: ptId, bagianId: b.id, nilai: 0, sumber: SUMBER_NILAI.OTOMATIS }, conn);
      }
      await posttestModel.tutup(ptId, conn);
      await catatAktivitas({ aksi: AKSI_LOG.KUMPUL_POST_TEST, entitas: 'post_test', entitasId: ptId }, conn);
      await finalisasi(ptId, conn);
      return { id: ptId };
    });
  }
  /** Ringkasan hasil untuk siswa: nilai per bagian (angka saja, tanpa kunci), total, dan kelulusan. */
  async function hasilSiswa(pt) {
    const [bagian, nilai] = await Promise.all([posttestModel.bagianLevel(pt.level_id), posttestModel.nilai(pt.id)]);
    const per = new Map(nilai.map((n) => [n.bagian_id, Number(n.nilai)]));
    // lulus: beri tahu siswa bila sertifikatnya sudah terbit (unduhan lewat tutor atau orang tua)
    const sertifikatTerbit = pt.lulus === true && (await sertifikatUsecase.adaTerbit(pt.siswa_id, pt.level_id));
    return { id: pt.id, levelNama: pt.level_nama, bagian: bagian.map((b) => ({ kode: b.kode, nama: b.nama, nilai: per.get(b.id) ?? null })), total: pt.nilai_total, lulus: pt.lulus, sertifikatTerbit };
  }
  /** Butir untuk siswa (tanpa `benar` dan tanpa kunci), dikelompokkan per bagian, bernomor urut. */
  async function butirSiswa(pt) {
    const bagian = (await posttestModel.bagianLevel(pt.level_id)).map(bentukBagian);
    const [diulang, butir, nilai, teks] = await Promise.all([bagianDiulang(pt, bagian), posttestModel.butir(pt.id), posttestModel.nilai(pt.id), teksMengetik(pt)]);
    const daftar = [];
    for (const b of bagian.filter((x) => diulang.includes(x.id))) {
      const info = { kode: b.kode, nama: b.nama };
      // tes mengetik: satu butir virtual, sekali saja (sudah bila nilainya ada)
      if (b.sumber === 'tes_mengetik') {
        const sudah = nilai.some((n) => n.bagian_id === b.id);
        daftar.push({ id: `mengetik-${b.id}`, jenis: 'mengetik', bagian: info, teks, terjawab: sudah });
        continue;
      }
      for (const x of butir.map(bentukButir).filter((y) => y.bagian_id === b.id)) {
        const tutor = x.penilaian === PENILAIAN.TUTOR;
        // bahan unduhan hanya kode dan jenis (tanpa nama subjek); dinilai = tutor sudah menyimpan skor (skornya tidak dikirim)
        const dinilai = Boolean(x.ph.penilaianTutor);
        daftar.push({ id: x.id, jenis: tutor ? 'tutor' : x.tipe === 'pilihan_ganda' ? 'pilihan_ganda' : 'isian', tipe: x.tipe, bagian: info, soal: x.soal_teks, opsi: x.ph.opsi ?? [], jawaban: x.jawaban, siapDinilai: Boolean(x.ph.siapDinilai), dinilai, gambar: bahanButir(x.ph).map((g) => ({ kode: g.kode, jenis: g.jenis })), terjawab: tutor ? Boolean(x.ph.siapDinilai) || dinilai : x.jawaban != null });
      }
    }
    return daftar.map((x, i) => ({ ...x, nomor: i + 1 }));
  }
  /** Butir milik post test berjalan siswa (terkunci) atau 404/409. */
  async function wajibButir(tugasId, siswaId, conn) {
    const b = await posttestModel.cariButir(tugasId, conn);
    if (!b || b.siswa_id !== siswaId) throw new AppError(t('tugas.tidakAda'), 404);
    if (b.pt_status !== STATUS_POST_TEST.BERLANGSUNG || b.pt_mulai == null) throw new AppError(t('posttest.tidakBerjalan'), 409);
    return bentukButir(b);
  }
  /** Post test milik siswa (riwayat dan detail pengelola) dalam bentuk ringkas beserta nilai per bagian. */
  async function denganNilai(pt) {
    const [bagian, nilai] = await Promise.all([posttestModel.bagianLevel(pt.level_id), posttestModel.nilai(pt.id)]);
    const cari = (id) => nilai.find((n) => n.bagian_id === id) ?? null;
    return {
      ...pt,
      bagian: bagian.map(bentukBagian).map((b) => {
        const n = cari(b.id);
        return { ...b, nilai: n ? Number(n.nilai) : null, sumber_nilai: n?.sumber ?? null, dinilai_nama: n?.dinilai_nama ?? null };
      }),
    };
  }
  return {
    kumpulkan,
    /** Keadaan kartu post test di beranda siswa (pertemuan 13): mulai, lanjutkan, mulai tes ulang, atau hasil. */
    async statusBeranda(siswaId) {
      const k = await keadaanBeranda(siswaId);
      if (!k) return null;
      let bagianUlang = [];
      // tes ulang belum dimulai: jelaskan bagian apa saja yang diulang
      if (k.aksi === 'mulaiUlang') {
        const bagian = await posttestModel.bagianLevel(k.pt.level_id);
        const id = await bagianDiulang(k.pt, bagian);
        bagianUlang = bagian.filter((b) => id.includes(b.id)).map((b) => `${b.kode}. ${b.nama}`);
      }
      return { aksi: k.aksi, keadaan: k.keadaan ?? null, bagianUlang, durasiMenit: await pengaturanUsecase.angka(KUNCI_PENGATURAN.DURASI_POST_TEST_MENIT) };
    },
    /**
     * Mulai post test (D2.1) dalam satu transaksi: percobaan pertama dibuat beserta butir semua bagian; tes ulang
     * yang dibuka tutor mulai berjalan; percobaan berjalan cukup dilanjutkan.
     */
    async mulai(siswaId) {
      try {
        return await db.transaction(async (conn) => {
          const k = await keadaanBeranda(siswaId, conn);
          if (!k) throw new AppError(t('posttest.bukanPertemuan'), 409);
          // sudah selesai: percobaan berikutnya hanya lewat tes ulang dari tutor
          if (!k.aksi) throw new AppError(t(`posttest.keadaan.${k.keadaan}`), 409);
          if (k.aksi === 'lanjutkan') return { id: k.pt.id };
          if (k.aksi === 'mulaiUlang') {
            await posttestModel.mulaiTesUlang(k.pt.id, k.sesi.id, conn);
            return { id: k.pt.id };
          }
          const durasi = (await pengaturanUsecase.angka(KUNCI_PENGATURAN.DURASI_POST_TEST_MENIT)) * 60;
          const id = idGen.generate();
          await posttestModel.tambah({ id, siswaLevelId: k.sesi.siswa_level_id, sesiId: k.sesi.id, percobaanKe: 1, durasiDetik: durasi, mulaiSekarang: true }, conn);
          const pt = bentukPt(await posttestModel.cariId(id, conn));
          await buatButir(pt, (await posttestModel.bagianLevel(pt.level_id, conn)).map(bentukBagian), conn);
          await catatAktivitas({ aksi: AKSI_LOG.MULAI_POST_TEST, entitas: 'post_test', entitasId: id, detail: { siswaId, percobaan: 1 } }, conn);
          return { id };
        });
      } catch (error) {
        // dua kali tekan Mulai bersamaan: UNIQUE aktif_kunci menolak yang kedua
        if (adalahDuplikat(error, 'uq_post_test_aktif') || adalahDuplikat(error, 'uq_post_test_percobaan')) throw new AppError(t('posttest.sudahDimulai'), 409);
        throw error;
      }
    },
    /**
     * Data halaman post test siswa. Saat dibuka, titik acuan waktu diperbarui (waktu selama tidak login tidak dihitung).
     * Waktu habis -> dikumpulkan otomatis. Hasil: { jalan, ... } atau { hasil } percobaan terakhir.
     */
    async halaman(siswaId) {
      const pt = await ptBerlangsungSiswa(siswaId);
      if (pt?.dimulai) {
        // waktu sudah habis saat dibuka kembali: kumpulkan dulu
        if (pt.sisa_detik <= 0) await kumpulkan(pt.id);
        else {
          await posttestModel.sentuh(pt.id);
          return { jalan: { id: pt.id, levelKode: pt.level_kode, levelNama: pt.level_nama, sisaDetik: pt.sisa_detik, butir: await butirSiswa(pt) } };
        }
      }
      const siswa = await siswaModel.cariId(siswaId);
      const terakhir = siswa?.siswa_level_id ? await posttestModel.terakhir(siswa.siswa_level_id) : null;
      // belum pernah, atau tes ulang yang belum dimulai: tidak ada yang ditampilkan di halaman ini
      if (!terakhir || terakhir.status !== STATUS_POST_TEST.SELESAI) return { kosong: true };
      return { hasil: await hasilSiswa(bentukPt(terakhir)) };
    },
    /** Denyut waktu (D2.2): tambah waktu terpakai; habis -> dikumpulkan otomatis. Hasil: { sisaDetik, selesai }. */
    async denyut(siswaId) {
      const pt = await ptBerlangsungSiswa(siswaId);
      // tidak ada tes berjalan (mis. sudah dikumpulkan di perangkat lain)
      if (!pt?.dimulai) return { sisaDetik: 0, selesai: true };
      await posttestModel.denyut(pt.id, WAKTU_POST_TEST.maksTambahDetik);
      const baru = bentukPt(await posttestModel.cariId(pt.id));
      // butir praktik yang sudah dinilai tutor dikirim agar status di layar siswa berubah tanpa memuat ulang halaman
      if (baru.sisa_detik > 0) {
        const dinilai = (await posttestModel.butir(pt.id)).map(bentukButir).filter((x) => x.penilaian === PENILAIAN.TUTOR && x.ph.penilaianTutor).map((x) => x.id);
        return { sisaDetik: baru.sisa_detik, selesai: false, dinilai };
      }
      await kumpulkan(pt.id);
      return { sisaDetik: 0, selesai: true };
    },
    /** Menyimpan jawaban pilihan ganda/isian; `benar` dihitung server tetapi tidak dikembalikan. */
    async jawab(siswaId, tugasId, jawaban) {
      await db.transaction(async (conn) => {
        const b = await wajibButir(tugasId, siswaId, conn);
        // butir praktik tidak dijawab lewat kolom ini
        if (b.penilaian !== PENILAIAN.OTOMATIS) throw new AppError(t('tugas.bukanJawaban'), 400);
        const kosong = String(jawaban).trim() === '';
        const benar = kosong ? null : periksaJawaban({ tipe: b.tipe, kunci: b.ph.kunci }, b.ph.nilai ?? {}, jawaban);
        await posttestModel.simpanJawaban(tugasId, { jawaban: kosong ? null : jawaban, benar, parameterHasil: teksJson(b.ph) }, conn);
      });
      return { tersimpan: true };
    },
    /** Butir praktik: siswa menandai "Sudah selesai, panggil tutor" (atau membatalkannya) sebelum dikumpulkan. */
    async siapDinilai(siswaId, tugasId, siap) {
      await db.transaction(async (conn) => {
        const b = await wajibButir(tugasId, siswaId, conn);
        if (b.penilaian !== PENILAIAN.TUTOR) throw new AppError(t('tugas.bukanJawaban'), 400);
        // sudah dinilai tutor: penanda tidak bisa diubah lagi
        if (b.ph.penilaianTutor) throw new AppError(t('posttest.sudahDinilai'), 409);
        await posttestModel.simpanJawaban(tugasId, { jawaban: b.jawaban, benar: null, parameterHasil: teksJson({ ...b.ph, siapDinilai: siap }) }, conn);
      });
      return { tersimpan: true };
    },
    /**
     * Menerima proyek Studio Zippy yang dikirim siswa ke butir praktik bertipe coding_proyek (dipanggil studioUsecase
     * dalam transaksinya, yang menyimpan salinan proyeknya). Aturan sama dengan butir praktik lain: tes sedang berjalan
     * dan belum dinilai tutor. Mengirim proyek sekaligus menandai butir siap dinilai; nama proyek dicatat sebagai jawaban.
     */
    async terimaProyek(siswaId, tugasId, nama, conn) {
      const b = await wajibButir(tugasId, siswaId, conn);
      if (b.penilaian !== PENILAIAN.TUTOR || b.tipe !== 'coding_proyek') throw new AppError(t('tugas.bukanProyek'), 400);
      // sudah dinilai tutor: kiriman tidak bisa diubah lagi
      if (b.ph.penilaianTutor) throw new AppError(t('posttest.sudahDinilai'), 409);
      await posttestModel.simpanJawaban(tugasId, { jawaban: nama, benar: null, parameterHasil: teksJson({ ...b.ph, siapDinilai: true }) }, conn);
    },
    /**
     * Data halaman Studio Zippy untuk satu butir post test: instruksi, sisa waktu, dan nama proyek yang sudah dikirim.
     * Titik acuan waktu diperbarui (seperti membuka halaman post test) sehingga waktu di luar halaman tidak terhitung.
     * 404/409 bila butir bukan milik siswa, bukan butir proyek, atau tes tidak sedang berjalan.
     */
    async butirStudio(siswaId, tugasId) {
      const b = await wajibButir(tugasId, siswaId, null);
      if (b.penilaian !== PENILAIAN.TUTOR || b.tipe !== 'coding_proyek') throw new AppError(t('tugas.tidakAda'), 404);
      const pt = await wajibPtJalan(siswaId);
      // waktu sudah habis: tes dikumpulkan lewat halaman post test, bukan di sini
      if (pt.sisa_detik <= 0) throw new AppError(t('posttest.tidakBerjalan'), 409);
      await posttestModel.sentuh(pt.id);
      return { id: b.id, soal: b.soal_teks, sisaDetik: pt.sisa_detik, levelNama: pt.level_nama, terkirim: b.jawaban ?? null, dinilai: Boolean(b.ph.penilaianTutor) };
    },
    /** Tes mengetik post test (sekali per percobaan): hasil disimpan bermode tes, nilai bagian langsung dihitung (tidak dikirim ke siswa). */
    async tesMengetik(siswaId, data) {
      return db.transaction(async (conn) => {
        const pt = await wajibPtJalan(siswaId, conn, true);
        const bagian = (await posttestModel.bagianLevel(pt.level_id, conn)).map(bentukBagian).find((b) => b.sumber === 'tes_mengetik');
        const diulang = bagian ? await bagianDiulang(pt, [bagian]) : [];
        if (!bagian || !diulang.includes(bagian.id)) throw new AppError(t('posttest.tanpaMengetik'), 409);
        // sudah dikerjakan pada percobaan ini: tidak bisa diulang
        if ((await posttestModel.nilai(pt.id, conn)).some((n) => n.bagian_id === bagian.id)) throw new AppError(t('posttest.mengetikSudah'), 409);
        // teks harus teks deterministik percobaan ini, bukan teks pilihan sendiri
        if (data.teks.trim() !== String(await teksMengetik(pt, conn)).trim()) throw new AppError(t('latihan.hasilTidakWajar'), 400);
        const h = await mengetikUsecase.simpanHasilMengetik(siswaId, pt.sesi_id, { ...data, mode: MODE_MENGETIK.TES }, conn);
        const nilai = hitungNilaiMengetik(h.wpm, h.akurasi, bagian.target_wpm);
        await posttestModel.simpanNilai({ id: idGen.generate(), postTestId: pt.id, bagianId: bagian.id, nilai, sumber: SUMBER_NILAI.OTOMATIS, hasilMengetikId: h.id }, conn);
        return { tersimpan: true };
      });
    },
    /** Siswa menekan Selesai dan Kumpulkan. */
    async kumpulOlehSiswa(siswaId) {
      const pt = await wajibPtJalan(siswaId);
      return kumpulkan(pt.id);
    },
    /** Daftar pengelola per tab (menunggu, berlangsung, selesai). */
    daftar: async (tab) => (await posttestModel.daftar(tab)).map(bentukPt),
    /** Riwayat percobaan seorang siswa beserta nilai per bagian (tab Post test detail siswa). */
    async riwayatSiswa(siswaId) {
      const [baris, lulusBagian] = await Promise.all([posttestModel.riwayatSiswa(siswaId), pengaturanUsecase.angka(KUNCI_PENGATURAN.NILAI_LULUS_BAGIAN)]);
      const terakhirPerLevel = new Set();
      return Promise.all(
        baris.map(async (b) => {
          const pt = await denganNilai(bentukPt(b));
          // urutan terbaru lebih dulu: kemunculan pertama per siswa_level adalah percobaan terakhirnya
          const terakhir = !terakhirPerLevel.has(pt.siswa_level_id);
          terakhirPerLevel.add(pt.siswa_level_id);
          const gagal = pt.bagian.filter((x) => x.nilai != null && x.nilai < lulusBagian).map((x) => x.id);
          return { ...pt, bisaTesUlang: terakhir && pt.status === STATUS_POST_TEST.SELESAI && pt.lulus === false, bagianUlangBawaan: gagal.length > 0 ? gagal : pt.bagian.map((x) => x.id) };
        }),
      );
    },
    /** Detail pengelola: nilai per bagian, butir (jawaban, benar/salah, jawaban harapan, rubrik), dan kelayakan tes ulang. */
    async detail(ptId) {
      const b = await posttestModel.cariId(ptId);
      if (!b) throw new AppError(t('posttest.tidakAda'), 404);
      const pt = await denganNilai(bentukPt(b));
      const [butir, terakhir, lulusBagian, rubrikBawaan] = await Promise.all([posttestModel.butir(ptId), posttestModel.terakhir(pt.siswa_level_id), pengaturanUsecase.angka(KUNCI_PENGATURAN.NILAI_LULUS_BAGIAN), pengaturanUsecase.rubrikBawaan()]);
      const daftarButir = butir.map(bentukButir).map((x) => {
        const render = { opsi: x.ph.opsi, nilaiParameter: x.ph.nilai ?? {}, kunci: x.ph.kunci };
        const tampil = x.tipe === 'pilihan_ganda' ? (x.ph.opsi ?? []).find((o) => String(o.indeksAsli) === String(x.jawaban))?.teks ?? x.jawaban : x.jawaban;
        const nilaiTutor = x.ph.penilaianTutor ?? null;
        const rubrik = x.ph.kunci?.rubrik ?? rubrikBawaan;
        return {
          id: x.id,
          bagian_id: x.bagian_id,
          tipe: x.tipe,
          penilaian: x.penilaian,
          template_kode: x.template_kode,
          soal: x.soal_teks,
          jawaban: tampil,
          benar: x.benar,
          siapDinilai: Boolean(x.ph.siapDinilai),
          harapan: x.penilaian === PENILAIAN.OTOMATIS ? jawabanHarapan({ tipe: x.tipe, kunci: x.ph.kunci }, render) : null,
          rubrik,
          // penilaian tutor per butir: skor, skor maksimum (jumlah poin rubrik), catatan, dan nama penilai
          maks: maksButir(rubrik),
          dinilai: Boolean(nilaiTutor),
          skor: nilaiTutor ? Number(nilaiTutor.skor) : null,
          catatan: nilaiTutor?.catatan ?? '',
          dinilai_nama: nilaiTutor ? x.dinilai_nama ?? null : null,
          bahan: bahanButir(x.ph).map((g) => ({ nama: g.nama, jenis: g.jenis })),
        };
      });
      const gagal = pt.bagian.filter((x) => x.nilai != null && x.nilai < lulusBagian).map((x) => x.id);
      const bisaTesUlang = pt.status === STATUS_POST_TEST.SELESAI && pt.lulus === false && terakhir?.id === pt.id;
      const praktik = daftarButir.filter((x) => x.penilaian === PENILAIAN.TUTOR);
      const praktikMenunggu = praktik.filter((x) => !x.dinilai).length;
      // Finalisasi hanya setelah dikumpulkan dan semua butir praktik dinilai; tanpa butir praktik tidak ada yang perlu difinalisasi
      const bisaFinalisasi = pt.status === STATUS_POST_TEST.SELESAI && praktik.length > 0 && praktikMenunggu === 0;
      return { ...pt, butir: daftarButir, praktikMenunggu, bisaFinalisasi, bisaTesUlang, bagianUlangBawaan: gagal.length > 0 ? gagal : pt.bagian.map((x) => x.id) };
    },
    /**
     * Tutor menilai satu butir praktik (skor 0 sampai skor maksimum rubrik, catatan opsional). Boleh saat siswa sudah
     * menandai siap dinilai (tes masih berjalan) atau setelah dikumpulkan; bisa direvisi. Dicatat ke log.
     */
    async nilaiButir(ptId, tugasId, { skor, catatan }, penggunaId) {
      return db.transaction(async (conn) => {
        const pt = bentukPt((await posttestModel.cariId(ptId, conn, true)) ?? {});
        if (!pt.id) throw new AppError(t('posttest.tidakAda'), 404);
        const baris = await posttestModel.cariButir(tugasId, conn);
        // butir milik post test lain diperlakukan sama dengan tidak ada
        if (!baris || baris.post_test_id !== ptId) throw new AppError(t('posttest.butirTidakAda'), 404);
        const butir = bentukButir(baris);
        if (butir.penilaian !== PENILAIAN.TUTOR) throw new AppError(t('posttest.bukanButirPraktik'), 400);
        // tes masih berjalan dan siswa belum memanggil tutor: karyanya belum final
        if (pt.status === STATUS_POST_TEST.BERLANGSUNG && !butir.ph.siapDinilai) throw new AppError(t('posttest.belumBisaDinilai'), 409);
        const maks = maksButir(butir.ph.kunci?.rubrik ?? (await pengaturanUsecase.rubrikBawaan()));
        if (skor > maks) throw new AppError(t('posttest.skorDiLuar', { maks }), 400);
        const lama = butir.ph.penilaianTutor ?? null;
        const ph = { ...butir.ph, penilaianTutor: { skor, maks, catatan, dinilaiAt: new Date().toISOString() } };
        await posttestModel.simpanPenilaianButir(tugasId, { parameterHasil: teksJson(ph), dinilaiOleh: penggunaId }, conn);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.NILAI_BUTIR_POST_TEST, entitas: 'post_test', entitasId: ptId, detail: { template: baris.template_kode, sebelum: lama ? Number(lama.skor) : null, sesudah: skor, maks } }, conn);
        return { id: tugasId };
      });
    },
    /**
     * Finalisasi oleh tutor: semua butir praktik harus sudah dinilai. Nilai tiap bagian praktik = rata-rata skor butir
     * (dalam skala 0-100), lalu nilai total dan kelulusan dihitung lewat finalisasi bersama (sertifikat terbit bila lulus).
     * Boleh diulang setelah skor direvisi. Hasil: { id, final } (final null bila ada bagian lain yang belum bernilai).
     */
    async finalisasiTutor(ptId, penggunaId) {
      return db.transaction(async (conn) => {
        const pt = bentukPt((await posttestModel.cariId(ptId, conn, true)) ?? {});
        if (!pt.id) throw new AppError(t('posttest.tidakAda'), 404);
        // nilai praktik hanya final setelah siswa mengumpulkan
        if (pt.status !== STATUS_POST_TEST.SELESAI) throw new AppError(t('posttest.belumDikumpulkan'), 409);
        const [butir, bagian] = await Promise.all([posttestModel.butir(ptId, conn), posttestModel.bagianLevel(pt.level_id, conn)]);
        const praktik = butir.map(bentukButir).filter((x) => x.penilaian === PENILAIAN.TUTOR);
        const belum = praktik.filter((x) => !x.ph.penilaianTutor).length;
        if (belum > 0) throw new AppError(t('posttest.belumSemuaDinilai', { jumlah: belum }), 409);
        for (const b of bagian.filter((x) => x.sumber === 'praktik_tutor')) {
          const milik = praktik.filter((x) => x.bagian_id === b.id);
          // bagian praktik tanpa butir di percobaan ini (tes ulang bagian lain): nilai salinan percobaan sebelumnya tetap dipakai
          if (milik.length === 0) continue;
          const rata = milik.reduce((n, x) => n + (100 * Number(x.ph.penilaianTutor.skor)) / Number(x.ph.penilaianTutor.maks), 0) / milik.length;
          await posttestModel.simpanNilai({ id: idGen.generate(), postTestId: ptId, bagianId: b.id, nilai: bulat2(rata), sumber: SUMBER_NILAI.TUTOR, dinilaiOleh: penggunaId }, conn);
        }
        return { id: ptId, final: await finalisasi(ptId, conn) };
      });
    },
    /**
     * Unduh bahan butir post test: subjek `kode` harus tercantum di parameter_hasil butir milik siswa itu dengan jenis
     * mewarnai atau berwarna, dan post test harus sedang berjalan. Hasilnya berkas PNG sebagai attachment.
     */
    async unduh(siswaId, tugasId, kode) {
      const b = await wajibButir(tugasId, siswaId, null);
      const gambar = bahanButir(b.ph).find((g) => g.kode === kode);
      if (!gambar) throw new AppError(t('tugas.bahanTidakAda'), 404);
      const buffer = await bacaBerkasGambar(folderGambar, gambar.kode, gambar.jenis);
      // berkas dihapus dari folder setelah butir dibuat
      if (!buffer) throw new AppError(t('tugas.bahanTidakAda'), 404);
      return hasilBerkas(buffer, 'image/png', namaUnduhan(gambar.jenis, gambar.nama));
    },
    /**
     * Tutor membuka tes ulang (D2.7) untuk bagian terpilih: percobaan baru belum dimulai (terakhir_aktif_at NULL),
     * nilai bagian lain disalin dari percobaan sebelumnya, butir dibuat hanya untuk bagian yang diulang.
     */
    async bukaTesUlang(ptId, bagianIds, penggunaId) {
      try {
        return await db.transaction(async (conn) => {
          const lama = bentukPt((await posttestModel.cariId(ptId, conn, true)) ?? {});
          const terakhir = lama.id ? await posttestModel.terakhir(lama.siswa_level_id, conn, true) : null;
          // hanya percobaan terakhir yang sudah dinilai dan belum lulus
          if (!lama.id || terakhir?.id !== lama.id || lama.status !== STATUS_POST_TEST.SELESAI || lama.lulus !== false) throw new AppError(t('posttest.tidakBisaTesUlang'), 409);
          const bagian = (await posttestModel.bagianLevel(lama.level_id, conn)).map(bentukBagian);
          const dipilih = bagian.filter((b) => bagianIds.includes(b.id));
          if (dipilih.length === 0) throw new AppError(t('posttest.pilihBagian'), 400);
          const id = idGen.generate();
          const durasi = (await pengaturanUsecase.angka(KUNCI_PENGATURAN.DURASI_POST_TEST_MENIT)) * 60;
          await posttestModel.tambah({ id, siswaLevelId: lama.siswa_level_id, sesiId: lama.sesi_id, percobaanKe: lama.percobaan_ke + 1, durasiDetik: durasi, dibukaOleh: penggunaId, bagianUlang: teksJson(dipilih.map((b) => b.id)), mulaiSekarang: false }, conn);
          for (const n of (await posttestModel.nilai(ptId, conn)).filter((x) => !bagianIds.includes(x.bagian_id))) {
            await posttestModel.simpanNilai({ id: idGen.generate(), postTestId: id, bagianId: n.bagian_id, nilai: Number(n.nilai), sumber: n.sumber, hasilMengetikId: n.hasil_mengetik_id, dinilaiOleh: n.dinilai_oleh }, conn);
          }
          await buatButir(bentukPt(await posttestModel.cariId(id, conn)), dipilih, conn);
          await catatAktivitas({ penggunaId, aksi: AKSI_LOG.BUKA_TES_ULANG, entitas: 'post_test', entitasId: id, detail: { dari: ptId, bagianIds: dipilih.map((b) => b.id), bagian: dipilih.map((b) => b.kode) } }, conn);
          return { id };
        });
      } catch (error) {
        // sudah ada percobaan berlangsung untuk level ini
        if (adalahDuplikat(error, 'uq_post_test_aktif') || adalahDuplikat(error, 'uq_post_test_percobaan')) throw new AppError(t('posttest.tidakBisaTesUlang'), 409);
        throw error;
      }
    },
  };
}
