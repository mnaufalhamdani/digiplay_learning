'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller gambar setelah memastikan pemanggil adalah admin. */
function jalankanGambar(fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.ADMIN);
    return ambilDep().gambarController[fungsi](input, sesi);
  });
}

/** Admin mengaktifkan/menonaktifkan subjek gambar. */
export async function ubahAktifGambar(input) {
  return jalankanGambar('ubahAktif', input);
}

/** Admin memindai ulang berkas gambar. */
export async function pindaiUlangGambar() {
  return jalankanGambar('pindaiUlang', null);
}
