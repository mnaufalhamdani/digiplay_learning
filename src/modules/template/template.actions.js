'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller template setelah memastikan hak akses pemanggil. */
function jalankanTemplate(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().templateController[fungsi](input, sesi);
  });
}

/** Pratinjau 5 contoh render (admin dan tutor; tidak pernah untuk siswa). */
export async function pratinjauTemplate(input) {
  return jalankanTemplate(AKSES.PENGGUNA, 'pratinjau', input);
}

/** Admin membuat template. */
export async function tambahTemplate(input) {
  return jalankanTemplate(AKSES.ADMIN, 'tambah', input);
}

/** Admin mengubah template. */
export async function ubahTemplate(input) {
  return jalankanTemplate(AKSES.ADMIN, 'ubah', input);
}
