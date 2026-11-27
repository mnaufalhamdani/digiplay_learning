import 'server-only';
import { AppError } from '@/utils/appError';
import { t } from '@/utils/i18n';
import { formatTanggal } from '@/utils/format';
import { hitungPaginasi } from '@/utils/paginasi';
import { AKSI_LOG, UKURAN_HALAMAN } from '@/enums';

/** Teks keterangan sesi pembayaran, mis. "Pertemuan 5 · Paint 1 (Level 1) · 12 November 2026"; null bila pembayaran tanpa sesi. */
function keteranganSesi(b) {
  // sesi_id kosong (atau sesinya sudah terhapus: FK SET NULL): tidak ada keterangan yang bisa ditampilkan
  if (b.pertemuan_nomor == null) return null;
  return t('pembayaran.keteranganSesi', { nomor: b.pertemuan_nomor, judul: b.pertemuan_judul, level: b.level_urutan, tanggal: formatTanggal(b.sesi_tanggal) });
}
/** Baris pembayaran untuk tampilan (DECIMAL jumlah kembali sebagai teks, jadi diubah ke angka) beserta teks keterangan sesi. */
function bentuk(b) {
  return { ...b, jumlah: b.jumlah == null ? null : Number(b.jumlah), keterangan_sesi: keteranganSesi(b) };
}

/** Usecase pembayaran: catat (dari absen masuk, detail sesi, atau detail siswa), daftar, dan hapus oleh admin. */
export function buatPembayaranUsecase({ pembayaranModel, sesiModel, siswaModel, db, idGen, catatAktivitas }) {
  /**
   * Menyimpan satu catatan pembayaran dan lognya. `conn` diisi bila dipanggil dari transaksi lain (absen masuk).
   * Minimal jumlah atau keterangan harus diisi agar catatan bermakna.
   */
  async function simpan({ siswaId, sesiId = null, tanggal = null, jumlah = null, keterangan = null }, pelakuId, conn) {
    if (jumlah == null && !keterangan) throw new AppError(t('pembayaran.isiSalahSatu'), 400, [{ kolom: 'jumlah', pesan: t('pembayaran.isiSalahSatu') }]);
    const id = idGen.generate();
    await pembayaranModel.tambah({ id, siswaId, sesiId, tanggal, jumlah, keterangan, dicatatOleh: pelakuId }, conn);
    await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.TAMBAH_PEMBAYARAN, entitas: 'pembayaran', entitasId: id, detail: { siswaId, sesiId, jumlah, keterangan } }, conn);
    return { id };
  }
  return {
    simpan,
    /** Tutor mencatat pembayaran dari detail sesi (absen masuk memakai `simpan`); sesi wajib dan harus milik siswa itu. */
    async tambah(data, pelakuId) {
      // pembayaran selalu terikat sesi (Absensi atau detail sesi, seperti catatan tutor): tanpa sesi tidak bisa dicatat
      if (!data.sesiId) throw new AppError(t('pembayaran.butuhSesi'), 400);
      return db.transaction(async (conn) => {
        const siswa = await siswaModel.cariId(data.siswaId, conn);
        if (!siswa) throw new AppError(t('dataSiswa.tidakAda'), 404);
        if (data.sesiId) {
          const sesi = await sesiModel.cariId(data.sesiId, conn);
          // sesi siswa lain tidak boleh ditautkan
          if (!sesi || sesi.siswa_id !== data.siswaId) throw new AppError(t('sesi.tidakAda'), 404);
        }
        return simpan(data, pelakuId, conn);
      });
    },
    /** Semua pembayaran seorang siswa. */
    daftarSiswa: async (siswaId) => (await pembayaranModel.daftarSiswa(siswaId)).map(bentuk),
    /**
     * Satu halaman pembayaran seorang siswa (UKURAN_HALAMAN per halaman) beserta info paginasi.
     * `jumlahTotal` dijumlah dari semua catatan siswa itu, bukan hanya halaman yang tampil.
     */
    async halamanSiswa(siswaId, nomorHalaman = 1) {
      const [total, jumlahTotal] = await Promise.all([pembayaranModel.hitungSiswa(siswaId), pembayaranModel.jumlahSiswa(siswaId)]);
      // halaman di luar rentang dibatasi ke halaman terakhir oleh hitungPaginasi
      const pg = hitungPaginasi(total, nomorHalaman, UKURAN_HALAMAN);
      const baris = (await pembayaranModel.halamanSiswa(siswaId, pg)).map(bentuk);
      return { baris, total, halaman: pg.halaman, totalHalaman: pg.totalHalaman, jumlahTotal };
    },
    /** Pembayaran satu sesi. */
    daftarSesi: async (sesiId) => (await pembayaranModel.daftarSesi(sesiId)).map(bentuk),
    /** Admin menghapus pembayaran (dicatat ke log beserta isinya). */
    async hapus(id, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await pembayaranModel.cariId(id, conn);
        if (!lama) throw new AppError(t('pembayaran.tidakAda'), 404);
        await pembayaranModel.hapus(id, conn);
        const detail = { siswaId: lama.siswa_id, sesiId: lama.sesi_id, tanggal: lama.tanggal, jumlah: bentuk(lama).jumlah, keterangan: lama.keterangan };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.HAPUS_PEMBAYARAN, entitas: 'pembayaran', entitasId: id, detail }, conn);
      });
      return { id };
    },
  };
}
