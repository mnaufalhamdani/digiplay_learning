import 'server-only';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { AppError } from '@/utils/appError';
import { deteksiTipeGambar } from '@/utils/tipeBerkas';
import { t } from '@/utils/i18n';
import { uraiJson } from '@/utils/json';
import { buatLogoGelap } from '@/utils/logoGelap';
import { AKSI_LOG, KUNCI_PENGATURAN, MAKS_UKURAN_LOGO, MAKS_UKURAN_TANDA_TANGAN, MIME_LOGO, RUBRIK_BAWAAN, SLOT_LOGO } from '@/enums';

/** Nilai bawaan bila baris pengaturan belum ada di database (sama dengan seed di schema.sql). */
const BAWAAN = Object.freeze({
  nama_pelatihan: 'DigiPlay Learning',
  nama_perusahaan: '',
  logo_path: '',
  logo_ikon: '',
  logo_persegi_teks: '',
  logo_sertifikat: '',
  batas_tidak_aktif_menit: '5',
  nilai_lulus_total: '70',
  nilai_lulus_bagian: '50',
  kehadiran_min_post_test: '9',
  durasi_post_test_menit: '45',
  panjang_kode_akses: '8',
  jumlah_tugas_per_sesi: '6',
  rubrik_bawaan: JSON.stringify(RUBRIK_BAWAAN),
  penandatangan_nama: '',
  penandatangan_jabatan: '',
  tanda_tangan_path: '',
});

/** Folder logo di dalam folder unggahan. */
const FOLDER_LOGO = 'logo';

/** Folder gambar tanda tangan sertifikat di dalam folder unggahan (tidak disajikan publik). */
const FOLDER_TANDA_TANGAN = 'tandatangan';

/** Satu-satunya tipe tanda tangan yang diterima: PNG, agar latar transparan terjaga. */
const TIPE_TANDA_TANGAN = 'image/png';

/** Usecase pengaturan: baca dengan cache memori singkat, ubah dengan log, dan kelola berkas logo. */
export function buatPengaturanUsecase({ pengaturanModel, db, catatAktivitas, penyimpananFile, idGen, cachePengaturanMs, folderAset }) {
  let cache = null; // { nilai, sampai }: hasil baca terakhir beserta batas berlakunya

  /** Semua pengaturan sebagai objek { kunci: nilai(teks) }, memakai cache bila masih berlaku. */
  async function ambilPengaturan() {
    // cache masih segar: hindari query ke database pada setiap render halaman
    if (cache && cache.sampai > Date.now()) return cache.nilai;
    const baris = await pengaturanModel.semua();
    const nilai = { ...BAWAAN, ...Object.fromEntries(baris.map((b) => [b.kunci, b.nilai])) };
    cache = { nilai, sampai: Date.now() + cachePengaturanMs };
    return nilai;
  }

  /** Mengosongkan cache agar perubahan langsung terbaca. */
  function bersihkanCache() {
    cache = null;
  }

  /** Mengambil satu pengaturan sebagai angka. */
  async function angka(kunci) {
    return Number((await ambilPengaturan())[kunci]);
  }

  /** Rubrik bawaan tugas dicek tutor (daftar { kriteria, poin }) dari pengaturan `rubrik_bawaan`. */
  async function rubrikBawaan() {
    const rubrik = uraiJson((await ambilPengaturan())[KUNCI_PENGATURAN.RUBRIK_BAWAAN]);
    // isi baris rusak/kosong (mis. diubah langsung di database): pakai rubrik awal agar tutor tetap punya panduan
    return Array.isArray(rubrik) && rubrik.length > 0 ? rubrik : RUBRIK_BAWAAN;
  }

  /** Definisi slot logo (kunci pengaturan dan bawaan); 400 bila nama slot tidak dikenal. */
  function infoSlot(slot) {
    const info = Object.hasOwn(SLOT_LOGO, slot) ? SLOT_LOGO[slot] : null;
    if (!info) throw new AppError(t('pengaturan.logoSlotTidakValid'), 400);
    return info;
  }

  /** URL logo sebuah slot: unggahan (nama berkas ikut di query sebagai pembatal cache) atau berkas bawaan statis. */
  function urlLogo(p, slot) {
    const info = SLOT_LOGO[slot];
    const unggahan = p[info.kunci];
    if (unggahan) return `/api/v1/pengaturan/logo?slot=${slot}&v=${encodeURIComponent(path.basename(unggahan))}`;
    // slot sertifikat kosong ikut Logo utama; slot lain memakai berkas bawaan di public/aset/logo
    return info.bawaan ? `/aset/logo/${info.bawaan}` : urlLogo(p, 'utama');
  }

  /** Berkas bawaan sebuah slot dari public/aset/logo (slot sertifikat tidak punya bawaan sendiri: memakai logo landscape). */
  async function bacaLogoBawaan(slot) {
    const nama = SLOT_LOGO[slot].bawaan ?? SLOT_LOGO.utama.bawaan;
    const buffer = await fs.readFile(path.join(folderAset, 'logo', nama));
    return { buffer, tipe: 'image/png' };
  }

  /** Berkas unggahan sebuah slot beserta tipenya; null bila slot kosong atau berkasnya hilang dari disk. */
  async function bacaLogoUnggahan(p, slot) {
    const lokasi = p[SLOT_LOGO[slot].kunci];
    if (!lokasi) return null;
    try {
      const buffer = await penyimpananFile.baca(lokasi);
      return { buffer, tipe: deteksiTipeGambar(buffer) ?? 'application/octet-stream' };
    } catch {
      // berkas hilang dari disk walau pengaturan masih menunjuk ke sana: perlakukan seperti slot kosong
      return null;
    }
  }

  /** Logo unggahan boleh punya versi gelap hanya bila bertransparansi (PNG atau WebP); JPEG berlatar opak tidak bisa diperbaiki. */
  const bisaGelap = (lokasi) => /\.(png|webp)$/i.test(lokasi);

  /** Path versi gelap sebuah logo unggahan: berkas yang sama berakhiran -gelap.png di folder yang sama. */
  const pathGelap = (lokasi) => lokasi.replace(/\.[^./]+$/, '-gelap.png');

  /**
   * Logo versi tema gelap sebuah slot: untuk unggahan, dibuat dari berkas aslinya saat pertama diminta lalu disimpan di
   * sebelahnya (jadi logo yang diunggah sebelum fitur ini juga mendapat versi gelap); untuk slot kosong, berkas bawaan -gelap.
   * null bila slot tidak punya versi gelap (JPEG, slot sertifikat), sehingga pemanggil memakai logo biasa.
   */
  async function bacaLogoGelap(p, slot) {
    const info = SLOT_LOGO[slot];
    const lokasi = p[info.kunci];
    if (lokasi && bisaGelap(lokasi)) {
      const tujuan = pathGelap(lokasi);
      try {
        return { buffer: await penyimpananFile.baca(tujuan), tipe: 'image/png' };
      } catch {
        // versi gelap belum pernah dibuat: buat dari berkas asli
      }
      const asli = await bacaLogoUnggahan(p, slot);
      if (!asli) return null;
      const buffer = await buatLogoGelap(asli.buffer);
      await penyimpananFile.simpanDi(tujuan, buffer);
      return { buffer, tipe: 'image/png' };
    }
    // slot kosong: berkas bawaan versi gelap (bila ada)
    if (!lokasi && info.bawaanGelap) return { buffer: await fs.readFile(path.join(folderAset, 'logo', info.bawaanGelap)), tipe: 'image/png' };
    return null;
  }

  /** URL versi tema gelap sebuah slot, atau null bila tidak ada (JPEG, slot sertifikat). */
  function urlLogoGelap(p, slot) {
    const info = SLOT_LOGO[slot];
    const unggahan = p[info.kunci];
    if (unggahan) return slot !== 'sertifikat' && bisaGelap(unggahan) ? `/api/v1/pengaturan/logo?slot=${slot}&tema=gelap&v=${encodeURIComponent(path.basename(unggahan))}` : null;
    return info.bawaanGelap ? `/aset/logo/${info.bawaanGelap}` : null;
  }

  /** Menghapus berkas logo unggahan beserta versi gelapnya (berkas yang tidak ada diabaikan). */
  async function hapusBerkasLogo(lokasi) {
    await penyimpananFile.hapus(lokasi);
    await penyimpananFile.hapus(pathGelap(lokasi));
  }

  /** Menyimpan berkas logo baru sebuah slot dan mengembalikan path relatifnya (di dalam folder unggahan). */
  async function simpanBerkasLogo(buffer, slot = 'utama') {
    // ukuran dicek ulang di sini walau controller sudah memeriksa, karena ini aturan bisnis
    if (buffer.length > MAKS_UKURAN_LOGO) throw new AppError(t('pengaturan.logoTerlaluBesar'), 400);
    const tipe = deteksiTipeGambar(buffer);
    // tipe dibaca dari isi berkas, bukan nama; SVG dan format lain ditolak
    if (!tipe || !MIME_LOGO[tipe]) throw new AppError(t('pengaturan.logoTipeSalah'), 400);
    // logo sertifikat dibaca pdfkit, yang tidak mendukung WebP
    if (SLOT_LOGO[slot].tanpaWebp && tipe === 'image/webp') throw new AppError(t('pengaturan.logoSertifikatTipeSalah'), 400);
    const pathRelatif = `${FOLDER_LOGO}/${idGen.generate()}.${MIME_LOGO[tipe]}`;
    await penyimpananFile.simpanDi(pathRelatif, buffer);
    return pathRelatif;
  }

  /** Menyimpan gambar tanda tangan baru (hanya PNG) dan mengembalikan path relatifnya. */
  async function simpanBerkasTandaTangan(buffer) {
    // ukuran dicek ulang di sini walau controller sudah memeriksa, karena ini aturan bisnis
    if (buffer.length > MAKS_UKURAN_TANDA_TANGAN) throw new AppError(t('pengaturan.tandaTanganTerlaluBesar'), 400);
    // tipe dibaca dari isi berkas; JPEG/WebP ditolak karena tidak menjamin latar transparan
    if (deteksiTipeGambar(buffer) !== TIPE_TANDA_TANGAN) throw new AppError(t('pengaturan.tandaTanganTipeSalah'), 400);
    const pathRelatif = `${FOLDER_TANDA_TANGAN}/${idGen.generate()}.png`;
    await penyimpananFile.simpanDi(pathRelatif, buffer);
    return pathRelatif;
  }

  return {
    ambilPengaturan,
    angka,
    rubrikBawaan,
    /**
     * Nama pelatihan, nama perusahaan, dan logo untuk header dan judul tab. `logo` = URL tiap slot (unggahan atau bawaan,
     * selalu terisi); `logoGelap` = URL versi tema gelap untuk logo bawaan (null bila slot memakai unggahan); `logoTerunggah` = slot mana yang memakai unggahan admin (untuk tombol Kembalikan ke bawaan);
     * `logoUrl` (lama) = URL Logo utama unggahan atau null.
     */
    async branding() {
      const p = await ambilPengaturan();
      const slot = Object.keys(SLOT_LOGO);
      return {
        namaPelatihan: p.nama_pelatihan || BAWAAN.nama_pelatihan,
        namaPerusahaan: p.nama_perusahaan,
        // nama berkas ikut di query agar browser memuat ulang saat logo diganti
        logoUrl: p.logo_path ? urlLogo(p, 'utama') : null,
        logo: Object.fromEntries(slot.map((s) => [s, urlLogo(p, s)])),
        // versi tema gelap: logo bawaan memakai berkas -gelap; unggahan PNG/WebP memakai versi gelap yang dibuat otomatis; null = tanpa versi gelap
        logoGelap: Object.fromEntries(slot.map((s) => [s, urlLogoGelap(p, s)])),
        logoTerunggah: Object.fromEntries(slot.map((s) => [s, Boolean(p[SLOT_LOGO[s].kunci])])),
      };
    },
    /** Menyimpan pengaturan yang berubah dalam satu transaksi beserta lognya, lalu mengembalikan nilai terbaru. */
    async ubah(input, penggunaId) {
      const lama = await ambilPengaturan();
      // hanya kunci yang nilainya benar-benar berubah yang disimpan dan dicatat
      const berubah = Object.entries(input).filter(([kunci, nilai]) => nilai !== undefined && String(nilai) !== lama[kunci]);
      // tidak ada yang berubah: tidak perlu transaksi maupun log
      if (berubah.length === 0) return lama;
      await db.transaction(async (conn) => {
        for (const [kunci, nilai] of berubah) await pengaturanModel.simpan(kunci, nilai, conn);
        const detail = Object.fromEntries(berubah.map(([kunci, nilai]) => [kunci, { sebelum: lama[kunci], sesudah: String(nilai) }]));
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_PENGATURAN, entitas: 'pengaturan', detail }, conn);
      });
      bersihkanCache();
      return ambilPengaturan();
    },
    /** Mengganti logo sebuah slot (bawaan: utama): simpan berkas baru, perbarui pengaturan slot, catat log, lalu hapus berkas lama. */
    async ubahLogo(buffer, penggunaId, slot = 'utama') {
      const { kunci } = infoSlot(slot);
      const lama = (await ambilPengaturan())[kunci];
      const baru = await simpanBerkasLogo(buffer, slot);
      await db.transaction(async (conn) => {
        await pengaturanModel.simpan(kunci, baru, conn);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_LOGO, entitas: 'pengaturan', detail: { slot, sebelum: lama, sesudah: baru } }, conn);
      });
      bersihkanCache();
      // berkas lama tidak dirujuk lagi; dihapus setelah database berhasil diperbarui (beserta versi gelapnya bila ada)
      if (lama) await hapusBerkasLogo(lama);
      return { logoPath: baru };
    },
    /** Mengembalikan logo sebuah slot ke bawaan: kosongkan pengaturan, catat log, hapus berkas unggahan; 404 bila memang belum diunggah. */
    async kembalikanLogo(slot, penggunaId) {
      const { kunci } = infoSlot(slot);
      const lama = (await ambilPengaturan())[kunci];
      // slot sudah memakai bawaan: tidak ada yang dikembalikan
      if (!lama) throw new AppError(t('pengaturan.logoTidakAda'), 404);
      await db.transaction(async (conn) => {
        await pengaturanModel.simpan(kunci, '', conn);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.KEMBALIKAN_LOGO, entitas: 'pengaturan', detail: { slot, sebelum: lama } }, conn);
      });
      bersihkanCache();
      await hapusBerkasLogo(lama);
      return null;
    },
    /** Berkas logo sebuah slot untuk disajikan (tema terang atau gelap): unggahan, atau bawaan di public/aset/logo bila slot kosong (sertifikat: ikut Logo utama). */
    async bacaLogoSlot(slot, tema = 'terang') {
      infoSlot(slot);
      const p = await ambilPengaturan();
      // tema gelap: versi gelap bila slot punya; selain itu jatuh ke logo biasa
      if (tema === 'gelap') {
        const gelap = await bacaLogoGelap(p, slot);
        if (gelap) return gelap;
      }
      const sendiri = await bacaLogoUnggahan(p, slot);
      if (sendiri) return sendiri;
      // slot sertifikat kosong ikut Logo utama unggahan (bila ada) sebelum jatuh ke bawaan
      if (slot === 'sertifikat') return (await bacaLogoUnggahan(p, 'utama')) ?? bacaLogoBawaan(slot);
      return bacaLogoBawaan(slot);
    },
    /**
     * Logo untuk PDF sertifikat: Logo sertifikat; bila kosong Logo utama; bila itu WebP atau tidak terbaca, logo landscape
     * bawaan. pdfkit hanya membaca PNG dan JPEG, jadi WebP dilewati. Selalu mengembalikan berkas yang bisa dipakai pdfkit.
     */
    async logoSertifikat() {
      const p = await ambilPengaturan();
      for (const slot of ['sertifikat', 'utama']) {
        const u = await bacaLogoUnggahan(p, slot);
        // hanya PNG/JPEG yang bisa dibaca pdfkit
        if (u && (u.tipe === 'image/png' || u.tipe === 'image/jpeg')) return u;
      }
      return bacaLogoBawaan('utama');
    },
    /** Membaca berkas logo saat ini beserta tipe MIME-nya; 404 bila belum ada logo. */
    async bacaLogo() {
      const logoPath = (await ambilPengaturan()).logo_path;
      // belum pernah mengunggah logo
      if (!logoPath) throw new AppError(t('pengaturan.logoTidakAda'), 404);
      let buffer;
      try {
        buffer = await penyimpananFile.baca(logoPath);
      } catch {
        // berkas hilang dari disk walau pengaturan masih menunjuk ke sana
        throw new AppError(t('pengaturan.logoTidakAda'), 404);
      }
      return { buffer, tipe: deteksiTipeGambar(buffer) ?? 'application/octet-stream' };
    },
    /** Mengganti gambar tanda tangan sertifikat: simpan berkas baru, perbarui pengaturan, catat log, lalu hapus berkas lama. */
    async ubahTandaTangan(buffer, penggunaId) {
      const lama = (await ambilPengaturan()).tanda_tangan_path;
      const baru = await simpanBerkasTandaTangan(buffer);
      await db.transaction(async (conn) => {
        await pengaturanModel.simpan(KUNCI_PENGATURAN.TANDA_TANGAN_PATH, baru, conn);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_TANDA_TANGAN, entitas: 'pengaturan', detail: { sebelum: lama, sesudah: baru } }, conn);
      });
      bersihkanCache();
      // berkas lama tidak dirujuk lagi; dihapus setelah database berhasil diperbarui
      if (lama) await penyimpananFile.hapus(lama);
      return { tandaTanganPath: baru };
    },
    /** Menghapus gambar tanda tangan: kosongkan pengaturan, catat log, lalu hapus berkasnya; 404 bila belum ada. */
    async hapusTandaTangan(penggunaId) {
      const lama = (await ambilPengaturan()).tanda_tangan_path;
      // tidak ada tanda tangan yang bisa dihapus
      if (!lama) throw new AppError(t('pengaturan.tandaTanganTidakAda'), 404);
      await db.transaction(async (conn) => {
        await pengaturanModel.simpan(KUNCI_PENGATURAN.TANDA_TANGAN_PATH, '', conn);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.HAPUS_TANDA_TANGAN, entitas: 'pengaturan', detail: { sebelum: lama } }, conn);
      });
      bersihkanCache();
      await penyimpananFile.hapus(lama);
      return null;
    },
    /** URL pratinjau tanda tangan (route khusus pengelola); null bila belum ada. Nama berkas di query agar cache browser ikut berganti. */
    async tandaTanganUrl() {
      const p = (await ambilPengaturan()).tanda_tangan_path;
      return p ? `/api/v1/pengaturan/tanda-tangan?v=${encodeURIComponent(path.basename(p))}` : null;
    },
    /** Membaca berkas tanda tangan saat ini; 404 bila belum diunggah atau berkasnya hilang dari disk. */
    async bacaTandaTangan() {
      const tandaPath = (await ambilPengaturan()).tanda_tangan_path;
      // belum pernah mengunggah tanda tangan
      if (!tandaPath) throw new AppError(t('pengaturan.tandaTanganTidakAda'), 404);
      let buffer;
      try {
        buffer = await penyimpananFile.baca(tandaPath);
      } catch {
        // berkas hilang dari disk walau pengaturan masih menunjuk ke sana
        throw new AppError(t('pengaturan.tandaTanganTidakAda'), 404);
      }
      return { buffer, tipe: TIPE_TANDA_TANGAN };
    },
  };
}
