import { validasi } from '@/utils/validasi';
import { MENU_GAME } from '@/enums';
import { simpanMengetikSchema } from './mengetik.schema';

/** Controller mengetik: validasi input lalu teruskan ke usecase. `sesi` adalah sesi siswa (siswaId). */
export function buatMengetikController({ mengetikUsecase, latihanUsecase }) {
  /** Penjaga aksi: menu Mengetik harus sudah terbuka (tugas mengetik pernah muncul atau post test dimulai); selain itu 403. */
  const jaga = (sesi) => latihanUsecase.wajibMenuTerbuka(sesi.siswaId, MENU_GAME.MENGETIK);
  return {
    /** Daftar pelajaran dan status terbukanya. */
    pelajaran: (_input, sesi) => mengetikUsecase.pelajaran(sesi.siswaId),
    /** Menyimpan hasil latihan. */
    simpan: async (input, sesi) => {
      await jaga(sesi);
      return mengetikUsecase.simpan(sesi.siswaId, validasi(simpanMengetikSchema, input));
    },
    /** Teks latihan adaptif. */
    adaptif: async (_input, sesi) => {
      await jaga(sesi);
      return mengetikUsecase.adaptif(sesi.siswaId);
    },
    /** Teks acak tes bebas. */
    teksAcak: async (_input, sesi) => {
      await jaga(sesi);
      return mengetikUsecase.teksAcak(sesi.siswaId);
    },
    /** Kata untuk game Hujan Kata. */
    kataGame: async (_input, sesi) => {
      await jaga(sesi);
      return mengetikUsecase.kataGame(sesi.siswaId);
    },
    /** Kemajuan siswa yang sedang login. */
    kemajuan: (_input, sesi) => mengetikUsecase.kemajuan(sesi.siswaId),
    /** Ringkasan mengetik seorang siswa untuk pengelola (ID sudah divalidasi halaman detail). */
    statistikSiswa: (siswaId) => mengetikUsecase.statistikSiswa(siswaId),
  };
}
