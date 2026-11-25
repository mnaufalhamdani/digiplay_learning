'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Admin/tutor membatalkan sertifikat (alasan wajib). */
export async function batalkanSertifikat(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.PENGGUNA);
    return ambilDep().sertifikatController.batalkan(input, sesi);
  });
}

/** Admin/tutor menerbitkan ulang sertifikat untuk (siswa, level). */
export async function terbitkanUlangSertifikat(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.PENGGUNA);
    return ambilDep().sertifikatController.terbitkanUlang(input, sesi);
  });
}
