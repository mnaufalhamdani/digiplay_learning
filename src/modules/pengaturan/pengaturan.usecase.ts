import 'server-only';
import path from 'node:path';
import { AppError } from '@/utils/appError';
import { deteksiTipeGambar } from '@/utils/tipeBerkas';
import { t } from '@/utils/i18n';
import { uraiJson } from '@/utils/json';
import { AKSI_LOG, KUNCI_PENGATURAN, MAKS_UKURAN_LOGO, MIME_LOGO, RUBRIK_BAWAAN } from '@/enums';

/** Nilai bawaan bila baris pengaturan belum ada di database (sama dengan seed di schema.sql). */
const BAWAAN = Object.freeze({
  nama_pelatihan: 'DigiPlay Learning',
  nama_perusahaan: '',
  logo_path: '',
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
});

/** Folder logo di dalam folder unggahan. */
const FOLDER_LOGO = 'logo';

/** Usecase pengaturan: baca dengan cache memori singkat, ubah dengan log, dan kelola berkas logo. */
export function buatPengaturanUsecase({ pengaturanModel, db, catatAktivitas, penyimpananFile, idGen, cachePengaturanMs }) {
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

  /** Menyimpan berkas logo baru dan mengembalikan path relatifnya (di dalam folder unggahan). */
  async function simpanBerkasLogo(buffer) {
    // ukuran dicek ulang di sini walau controller sudah memeriksa, karena ini aturan bisnis
    if (buffer.length > MAKS_UKURAN_LOGO) throw new AppError(t('pengaturan.logoTerlaluBesar'), 400);
    const tipe = deteksiTipeGambar(buffer);
    // tipe dibaca dari isi berkas, bukan nama; SVG dan format lain ditolak
    if (!tipe || !MIME_LOGO[tipe]) throw new AppError(t('pengaturan.logoTipeSalah'), 400);
    const pathRelatif = `${FOLDER_LOGO}/${idGen.generate()}.${MIME_LOGO[tipe]}`;
    await penyimpananFile.simpanDi(pathRelatif, buffer);
    return pathRelatif;
  }

  return {
    ambilPengaturan,
    angka,
    rubrikBawaan,
    /** Nama pelatihan, nama perusahaan, dan URL logo untuk header dan judul tab. */
    async branding() {
      const p = await ambilPengaturan();
      return {
        namaPelatihan: p.nama_pelatihan || BAWAAN.nama_pelatihan,
        namaPerusahaan: p.nama_perusahaan,
        // nama berkas ikut di query agar browser memuat ulang saat logo diganti
        logoUrl: p.logo_path ? `/api/v1/pengaturan/logo?v=${encodeURIComponent(path.basename(p.logo_path))}` : null,
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
    /** Mengganti logo: simpan berkas baru, perbarui logo_path, catat log, lalu hapus berkas lama. */
    async ubahLogo(buffer, penggunaId) {
      const lama = (await ambilPengaturan()).logo_path;
      const baru = await simpanBerkasLogo(buffer);
      await db.transaction(async (conn) => {
        await pengaturanModel.simpan(KUNCI_PENGATURAN.LOGO_PATH, baru, conn);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_LOGO, entitas: 'pengaturan', detail: { sebelum: lama, sesudah: baru } }, conn);
      });
      bersihkanCache();
      // berkas lama tidak dirujuk lagi; dihapus setelah database berhasil diperbarui
      if (lama) await penyimpananFile.hapus(lama);
      return { logoPath: baru };
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
  };
}
