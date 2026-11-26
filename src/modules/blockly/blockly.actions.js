'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menilai program Coding Zippy siswa yang sedang login di server dan menyimpan hasilnya bila berhasil. */
export async function simpanHasilBlockly(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.SISWA);
    return ambilDep().blocklyController.simpan(input, sesi);
  });
}
