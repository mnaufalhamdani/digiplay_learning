import 'server-only';
import { uraiJson } from '@/utils/json';
import { hitungPaginasi } from '@/utils/paginasi';
import { UKURAN_HALAMAN } from '@/enums';

/** Usecase log: satu pintu pencatatan aktivitas untuk semua modul (lewat DI `catatAktivitas`) dan pembacaan halaman Log. */
export function buatLogUsecase({ logModel, penggunaModel, idGen }) {
  return {
    /**
     * Mencatat satu aktivitas: siapa (penggunaId), aksi apa, terhadap entitas apa, dan detail sebelum/sesudah.
     * Isi `conn` bila dipanggil di dalam transaksi agar log batal bersama aksinya.
     */
    async catatAktivitas({ penggunaId = null, aksi, entitas, entitasId = null, detail = null }, conn = null) {
      await logModel.tambah({ id: idGen.generate(), penggunaId, aksi, entitas, entitasId, detail }, conn);
    },
    /** Satu halaman log terbaru sesuai filter; kolom detail (JSON) diurai. */
    async daftar(filter) {
      const total = await logModel.hitung(filter);
      const pg = hitungPaginasi(total, filter.halaman, UKURAN_HALAMAN);
      const baris = (await logModel.daftar(filter, pg)).map((b) => ({ ...b, detail: uraiJson(b.detail) }));
      return { baris, total, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
    },
    /** Detail (sudah diurai) log terbaru satu aksi pada satu entitas; null bila tidak ada. */
    detailTerakhir: async (aksi, entitas, entitasId) => uraiJson(await logModel.detailTerakhir(aksi, entitas, entitasId)),
    /** Pilihan filter: aksi dan entitas yang pernah tercatat, serta semua akun pengelola. */
    async pilihanFilter() {
      const [dariLog, pengguna] = await Promise.all([logModel.pilihanFilter(), penggunaModel.daftar()]);
      return { ...dariLog, pengguna: pengguna.map((p) => ({ id: p.id, nama: p.nama })) };
    },
  };
}
