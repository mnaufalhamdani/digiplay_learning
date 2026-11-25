import 'server-only';
import { AppError } from '@/utils/appError';
import { t } from '@/utils/i18n';
import { AKSI_LOG, TOTAL_BOBOT_POST_TEST, TOTAL_BUTIR_POST_TEST } from '@/enums';

/** Mengubah baris bagian dari database ke bentuk tampilan (DECIMAL bobot kembali sebagai teks, jadi diubah ke angka). */
function bentukBagian(b) {
  return { ...b, bobot: Number(b.bobot), jumlah_soal: Number(b.jumlah_soal) };
}

/** Total bobot dan butir bagian satu level beserta tanda apakah sudah sesuai aturan (100 dan 15). */
function ringkasBagian(bagian) {
  const totalBobot = Math.round(bagian.reduce((n, b) => n + b.bobot, 0) * 100) / 100;
  const totalButir = bagian.reduce((n, b) => n + b.jumlah_soal, 0);
  return { totalBobot, totalButir, bobotSesuai: totalBobot === TOTAL_BOBOT_POST_TEST, butirSesuai: totalButir === TOTAL_BUTIR_POST_TEST };
}

/** Usecase level: struktur level -> 13 pertemuan -> jumlah template, dan perubahan oleh admin (dicatat ke log). */
export function buatLevelUsecase({ levelModel, db, catatAktivitas }) {
  /** Mengambil data dengan fungsi `cari` atau melempar 404 dengan pesan `kunciPesan`. */
  async function wajibAda(cari, id, kunciPesan, conn) {
    const data = await cari(id, conn);
    if (!data) throw new AppError(t(kunciPesan), 404);
    return data;
  }
  return {
    /** Semua level lengkap dengan pertemuan (dan jumlah template) serta bagian post test dan ringkasan bobotnya. */
    async struktur() {
      const [level, pertemuan, bagian] = await Promise.all([levelModel.daftarLevel(), levelModel.daftarPertemuan(), levelModel.daftarBagian()]);
      return level.map((lv) => {
        const bagianLevel = bagian.filter((b) => b.level_id === lv.id).map(bentukBagian);
        const pertemuanLevel = pertemuan
          .filter((p) => p.level_id === lv.id)
          .map((p) => ({ ...p, jumlah_template: Number(p.jumlah_template), jumlah_aktif: Number(p.jumlah_aktif) }));
        return { ...lv, pertemuan: pertemuanLevel, bagian: bagianLevel, ringkasan: ringkasBagian(bagianLevel) };
      });
    },
    /** Daftar ringkas untuk pilihan di form/filter modul lain: level, pertemuan, dan bagian. */
    async pilihan() {
      const [level, pertemuan, bagian] = await Promise.all([levelModel.daftarLevel(), levelModel.daftarPertemuan(), levelModel.daftarBagian()]);
      return {
        level: level.map((l) => ({ id: l.id, kode: l.kode, nama: l.nama, aktif: Boolean(l.aktif) })),
        pertemuan: pertemuan.map((p) => ({ id: p.id, levelId: p.level_id, nomor: Number(p.nomor), judul: p.judul })),
        bagian: bagian.map((b) => ({ id: b.id, levelId: b.level_id, kode: b.kode, nama: b.nama })),
      };
    },
    /** Satu level; null bila tidak ada (dipakai modul siswa untuk memeriksa level tujuan). */
    cariLevel: (id, conn = null) => levelModel.cariLevel(id, conn),
    /** Admin mengubah nama/deskripsi level. */
    async ubahLevel(id, { nama, deskripsi }, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await wajibAda(levelModel.cariLevel, id, 'level.tidakAda', conn);
        await levelModel.ubahLevel(id, { nama, deskripsi }, conn);
        const detail = { sebelum: { nama: lama.nama, deskripsi: lama.deskripsi }, sesudah: { nama, deskripsi } };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.UBAH_LEVEL, entitas: 'level', entitasId: id, detail }, conn);
      });
      return { id };
    },
    /** Admin mengubah judul/tujuan pertemuan. */
    async ubahPertemuan(id, { judul, tujuan }, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await wajibAda(levelModel.cariPertemuan, id, 'level.pertemuanTidakAda', conn);
        await levelModel.ubahPertemuan(id, { judul, tujuan }, conn);
        const detail = { sebelum: { judul: lama.judul, tujuan: lama.tujuan }, sesudah: { judul, tujuan } };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.UBAH_PERTEMUAN, entitas: 'pertemuan', entitasId: id, detail }, conn);
      });
      return { id };
    },
    /**
     * Admin mengubah nama, bobot, dan jumlah butir bagian post test. Total bobot/butir yang tidak 100/15
     * TIDAK ditolak (admin bisa mengubah bertahap); halaman menampilkan peringatan dari ringkasan.
     */
    async ubahBagian(id, { nama, bobot, jumlahSoal }, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = bentukBagian(await wajibAda(levelModel.cariBagian, id, 'level.bagianTidakAda', conn));
        await levelModel.ubahBagian(id, { nama, bobot, jumlahSoal }, conn);
        const detail = { sebelum: { nama: lama.nama, bobot: lama.bobot, jumlah_soal: lama.jumlah_soal }, sesudah: { nama, bobot, jumlah_soal: jumlahSoal } };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.UBAH_BAGIAN_POST_TEST, entitas: 'bagian_post_test', entitasId: id, detail }, conn);
      });
      return { id };
    },
  };
}
