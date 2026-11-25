'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller siswa setelah memastikan hak akses pemanggil. */
function jalankanSiswa(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().siswaController[fungsi](input, sesi);
  });
}

/** Admin/tutor mendaftarkan siswa baru (hasilnya berisi kedua kode). */
export async function tambahSiswa(input) {
  return jalankanSiswa(AKSES.PENGGUNA, 'tambah', input);
}

/** Admin/tutor mengganti kode siswa atau kode orang tua. */
export async function gantiKodeSiswa(input) {
  return jalankanSiswa(AKSES.PENGGUNA, 'gantiKode', input);
}

/** Admin/tutor mengganti level berjalan. */
export async function gantiLevelSiswa(input) {
  return jalankanSiswa(AKSES.PENGGUNA, 'gantiLevel', input);
}

/** Admin/tutor mengaktifkan/menonaktifkan siswa. */
export async function ubahStatusSiswa(input) {
  return jalankanSiswa(AKSES.PENGGUNA, 'ubahStatus', input);
}

/** Hanya admin: menghapus siswa beserta seluruh datanya. */
export async function hapusSiswa(input) {
  return jalankanSiswa(AKSES.ADMIN, 'hapus', input);
}
