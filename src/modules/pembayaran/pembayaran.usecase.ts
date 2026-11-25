import 'server-only';
import { AppError } from '@/utils/appError';
import { t } from '@/utils/i18n';
import { AKSI_LOG } from '@/enums';

/** Baris pembayaran untuk tampilan (DECIMAL jumlah kembali sebagai teks, jadi diubah ke angka). */
function bentuk(b) {
  return { ...b, jumlah: b.jumlah == null ? null : Number(b.jumlah) };
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
    /** Tutor mencatat pembayaran dari detail siswa/sesi; sesi (bila diisi) harus milik siswa itu. */
    async tambah(data, pelakuId) {
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
