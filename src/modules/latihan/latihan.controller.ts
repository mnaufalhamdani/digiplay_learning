import { validasi } from '@/utils/validasi';
import { gambarPuzzleSchema, simpanLatihanSchema } from './latihan.schema';

/** Controller latihan: validasi input lalu teruskan ke usecase. `sesi` adalah sesi siswa (siswaId). */
export function buatLatihanController({ latihanUsecase }) {
  return {
    /** Menyimpan hasil game mouse atau puzzle. */
    simpan: (input, sesi) => latihanUsecase.simpan(sesi.siswaId, validasi(simpanLatihanSchema, input)),
    /** Gambar puzzle acak (mode bebas). */
    gambarPuzzle: (input, sesi) => latihanUsecase.gambarPuzzle(sesi.siswaId, validasi(gambarPuzzleSchema, input ?? {}).kategori),
    /** Ringkasan latihan seorang siswa untuk pengelola. */
    statistikSiswa: (siswaId) => latihanUsecase.statistikSiswa(siswaId),
  };
}
