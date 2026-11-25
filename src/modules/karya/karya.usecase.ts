import 'server-only';
import { AppError } from '@/utils/appError';
import { deteksiTipeGambar } from '@/utils/tipeBerkas';
import { tokenAcak } from '@/utils/kripto';
import { hitungPaginasi } from '@/utils/paginasi';
import { t } from '@/utils/i18n';
import { AKSI_LOG, ATURAN_KARYA, JENIS_KARYA, MIME_KARYA } from '@/enums';

/** Domain dari URL tautan untuk ditampilkan (server tidak pernah mengambil isi situsnya). */
function domainDari(url) {
  try {
    return new URL(url).hostname;
  } catch {
    // URL lama yang rusak: tampilkan tanpa domain
    return '';
  }
}

/** Baris karya untuk tampilan: domain tautan; path berkas di disk tidak dikirim ke tampilan. */
function bentuk(b) {
  const { berkas_path: _path, ...sisa } = b;
  return { ...sisa, domain: b.jenis === JENIS_KARYA.TAUTAN ? domainDari(b.url) : null };
}

/**
 * Usecase galeri karya (F2): siswa menambah/mengubah/menghapus karyanya saat sesi berlangsung, pengelola menghapus
 * karya mana pun, dan berkas disajikan hanya untuk pengelola, siswa pemilik, dan orang tua siswa pemilik.
 */
export function buatKaryaUsecase({ karyaModel, sesiModel, penyimpananFile, catatAktivitas, idGen, db, logger }) {
  /** Satu halaman karya sesuai filter beserta info paginasi. */
  async function halaman(filter, ukuran) {
    const total = await karyaModel.hitung(filter);
    const pg = hitungPaginasi(total, filter.halaman ?? 1, ukuran);
    return { baris: (await karyaModel.daftar(filter, pg)).map(bentuk), total, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
  }
  /** Sesi berlangsung siswa atau 409: aksi tulis siswa hanya saat sudah diabsen. */
  async function wajibSesi(siswaId, conn = null) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId, conn);
    if (!sesi) throw new AppError(t('karya.harusSesi'), 409);
    return sesi;
  }
  /** Karya milik siswa atau 404 (karya siswa lain dianggap tidak ada). */
  async function wajibMilik(id, siswaId, conn = null) {
    const k = await karyaModel.cariId(id, conn);
    if (!k || k.siswa_id !== siswaId) throw new AppError(t('karya.tidakAda'), 404);
    return k;
  }
  /** Memeriksa isi berkas (byte awal, bukan ekstensi) lalu menyimpannya; hasil path relatif di folder unggahan. */
  async function simpanBerkas(siswaId, buffer) {
    // ukuran dicek ulang di sini walau controller sudah memeriksa, karena ini aturan bisnis
    if (buffer.length > ATURAN_KARYA.maksUkuran) throw new AppError(t('karya.berkasBesar'), 400);
    const ext = MIME_KARYA[deteksiTipeGambar(buffer)];
    // SVG, berkas palsu berekstensi gambar, dan format lain ditolak
    if (!ext) throw new AppError(t('karya.berkasTipe'), 400);
    const pathRelatif = `karya/${siswaId}/${tokenAcak()}.${ext}`;
    await penyimpananFile.simpanDi(pathRelatif, buffer);
    return pathRelatif;
  }
  /** Menghapus baris karya lalu berkasnya; pelaku pengelola atau siswa (penggunaId null) dicatat ke log. */
  async function hapusKarya(k, penggunaId) {
    await db.transaction(async (conn) => {
      await karyaModel.hapus(k.id, conn);
      await catatAktivitas({ penggunaId, aksi: AKSI_LOG.HAPUS_KARYA, entitas: 'karya', entitasId: k.id, detail: { siswaId: k.siswa_id, judul: k.judul, jenis: k.jenis } }, conn);
    });
    // berkas dihapus setelah baris terhapus, agar tidak ada karya yang menunjuk berkas hilang
    if (k.berkas_path) await penyimpananFile.hapus(k.berkas_path);
    return { id: k.id };
  }

  return {
    /** Path berkas karya seorang siswa; dibaca di dalam transaksi hapus siswa sebelum barisnya terhapus CASCADE. */
    berkasSiswa: (siswaId, conn) => karyaModel.berkasSiswa(siswaId, conn),
    /**
     * Menghapus berkas karya dari disk setelah siswa terhapus, lalu folder `karya/<siswaId>` bila sudah kosong.
     * Kegagalan per berkas dicatat saja: data di database sudah terhapus dan tidak boleh dibatalkan karena berkas.
     */
    async hapusBerkasSiswa(siswaId, daftarPath) {
      for (const p of daftarPath) {
        try {
          await penyimpananFile.hapus(p);
        } catch (error) {
          // berkas terkunci/izin ditolak: lanjutkan berkas lain, catat agar bisa dibersihkan manual
          logger.error(`Gagal menghapus berkas karya ${p}`, error);
        }
      }
      await penyimpananFile.hapusFolderKosong(`karya/${siswaId}`);
    },
    /** Galeri pengelola (semua karya, filter siswa/nama/jenis). */
    daftar: (filter) => halaman(filter, ATURAN_KARYA.perHalaman),
    /** Galeri seorang siswa (siswa sendiri, rapor orang tua, tab detail siswa). */
    daftarSiswa: (siswaId, nomorHalaman = 1) => halaman({ siswaId, halaman: nomorHalaman }, ATURAN_KARYA.perHalaman),
    /** Siswa menambah karya (tautan atau berkas) saat sesi berlangsung; sesi_id diisi sesi itu. */
    async tambah(siswaId, { judul, deskripsi, jenis, url }, buffer) {
      const sesi = await wajibSesi(siswaId);
      const berkasPath = jenis === JENIS_KARYA.BERKAS ? await simpanBerkas(siswaId, buffer) : null;
      const id = idGen.generate();
      try {
        await db.transaction(async (conn) => {
          await karyaModel.tambah({ id, siswaId, sesiId: sesi.id, judul, deskripsi, jenis, url: jenis === JENIS_KARYA.TAUTAN ? url : null, berkasPath }, conn);
          await catatAktivitas({ aksi: AKSI_LOG.TAMBAH_KARYA, entitas: 'karya', entitasId: id, detail: { siswaId, jenis } }, conn);
        });
      } catch (error) {
        // penyimpanan database gagal: buang berkas yang terlanjur ditulis agar tidak menjadi sampah
        if (berkasPath) await penyimpananFile.hapus(berkasPath);
        throw error;
      }
      return { id };
    },
    /** Siswa mengubah judul/deskripsi karyanya sendiri saat sesi berlangsung. */
    async ubah(siswaId, id, data) {
      await wajibSesi(siswaId);
      await wajibMilik(id, siswaId);
      await db.transaction(async (conn) => {
        await karyaModel.ubah(id, data, conn);
        await catatAktivitas({ aksi: AKSI_LOG.UBAH_KARYA, entitas: 'karya', entitasId: id, detail: { siswaId } }, conn);
      });
      return { id };
    },
    /** Siswa menghapus karyanya sendiri saat sesi berlangsung. */
    async hapusOlehSiswa(siswaId, id) {
      await wajibSesi(siswaId);
      return hapusKarya(await wajibMilik(id, siswaId), null);
    },
    /** Admin/tutor menghapus karya mana pun (dicatat ke log). */
    async hapusOlehPengelola(id, penggunaId) {
      const k = await karyaModel.cariId(id);
      if (!k) throw new AppError(t('karya.tidakAda'), 404);
      return hapusKarya(k, penggunaId);
    },
    /**
     * Berkas karya: pengelola boleh semua; siswa dan orang tua hanya milik siswa pada sesinya. Selain itu 404,
     * termasuk karya tautan, sehingga keberadaan karya siswa lain tidak bocor.
     */
    async berkas(id, sesi) {
      const k = await karyaModel.cariId(id);
      const boleh = k && k.berkas_path && (sesi.peran || k.siswa_id === sesi.siswaId);
      if (!boleh) throw new AppError(t('karya.tidakAda'), 404);
      let buffer;
      try {
        buffer = await penyimpananFile.baca(k.berkas_path);
      } catch {
        // berkas hilang dari disk walau barisnya masih ada
        throw new AppError(t('karya.tidakAda'), 404);
      }
      return { buffer, tipe: deteksiTipeGambar(buffer) ?? 'application/octet-stream' };
    },
  };
}
