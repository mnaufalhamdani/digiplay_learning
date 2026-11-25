'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller pengguna setelah memastikan hak akses pemanggil. */
function jalankanPengguna(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().penggunaController[fungsi](input, sesi);
  });
}

/** Admin membuat akun baru. */
export async function tambahPengguna(input) {
  return jalankanPengguna(AKSES.ADMIN, 'tambah', input);
}

/** Admin mengubah nama/peran akun. */
export async function ubahPengguna(input) {
  return jalankanPengguna(AKSES.ADMIN, 'ubah', input);
}

/** Admin mengaktifkan/menonaktifkan akun. */
export async function ubahAktifPengguna(input) {
  return jalankanPengguna(AKSES.ADMIN, 'ubahAktif', input);
}

/** Admin mengatur ulang password akun. */
export async function resetPasswordPengguna(input) {
  return jalankanPengguna(AKSES.ADMIN, 'resetPassword', input);
}

/** Pengguna (admin atau tutor) mengganti password sendiri. */
export async function ubahPasswordSendiri(input) {
  return jalankanPengguna(AKSES.PENGGUNA, 'ubahPasswordSendiri', input);
}
