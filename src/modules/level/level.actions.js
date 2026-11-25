'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller level setelah memastikan pemanggil adalah admin. */
function jalankanLevel(fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.ADMIN);
    return ambilDep().levelController[fungsi](input, sesi);
  });
}

/** Admin mengubah nama/deskripsi level. */
export async function ubahLevel(input) {
  return jalankanLevel('ubahLevel', input);
}

/** Admin mengubah judul/tujuan pertemuan. */
export async function ubahPertemuan(input) {
  return jalankanLevel('ubahPertemuan', input);
}

/** Admin mengubah bagian post test. */
export async function ubahBagian(input) {
  return jalankanLevel('ubahBagian', input);
}
