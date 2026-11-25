'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller karya setelah memastikan hak akses pemanggil. */
function jalankanKarya(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().karyaController[fungsi](input, sesi);
  });
}

/** Siswa mengubah judul/deskripsi karyanya. */
export async function ubahKarya(input) {
  return jalankanKarya(AKSES.SISWA, 'ubah', input);
}

/** Siswa menghapus karyanya sendiri. */
export async function hapusKaryaSiswa(input) {
  return jalankanKarya(AKSES.SISWA, 'hapusOlehSiswa', input);
}

/** Admin/tutor menghapus karya mana pun. */
export async function hapusKaryaPengelola(input) {
  return jalankanKarya(AKSES.PENGGUNA, 'hapusOlehPengelola', input);
}
