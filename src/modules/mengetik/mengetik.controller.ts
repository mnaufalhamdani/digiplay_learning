import { validasi } from '@/utils/validasi';
import { simpanMengetikSchema } from './mengetik.schema';

/** Controller mengetik: validasi input lalu teruskan ke usecase. `sesi` adalah sesi siswa (siswaId). */
export function buatMengetikController({ mengetikUsecase }) {
  return {
    /** Daftar pelajaran dan status terbukanya. */
    pelajaran: (_input, sesi) => mengetikUsecase.pelajaran(sesi.siswaId),
    /** Menyimpan hasil latihan. */
    simpan: (input, sesi) => mengetikUsecase.simpan(sesi.siswaId, validasi(simpanMengetikSchema, input)),
    /** Teks latihan adaptif. */
    adaptif: (_input, sesi) => mengetikUsecase.adaptif(sesi.siswaId),
    /** Teks acak tes bebas. */
    teksAcak: (_input, sesi) => mengetikUsecase.teksAcak(sesi.siswaId),
    /** Kata untuk game Hujan Kata. */
    kataGame: (_input, sesi) => mengetikUsecase.kataGame(sesi.siswaId),
    /** Kemajuan siswa yang sedang login. */
    kemajuan: (_input, sesi) => mengetikUsecase.kemajuan(sesi.siswaId),
    /** Ringkasan mengetik seorang siswa untuk pengelola (ID sudah divalidasi halaman detail). */
    statistikSiswa: (siswaId) => mengetikUsecase.statistikSiswa(siswaId),
  };
}
