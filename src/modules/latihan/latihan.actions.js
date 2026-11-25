'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menyimpan hasil game mouse atau puzzle siswa yang sedang login. */
export async function simpanHasilLatihan(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.SISWA);
    return ambilDep().latihanController.simpan(input, sesi);
  });
}

/** Meminta gambar puzzle acak untuk mode bebas. */
export async function ambilGambarPuzzle(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.SISWA);
    return ambilDep().latihanController.gambarPuzzle(input, sesi);
  });
}
