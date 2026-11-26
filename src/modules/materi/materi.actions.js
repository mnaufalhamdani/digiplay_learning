'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller materi setelah memastikan hak akses pemanggil. */
function jalankanMateri(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().materiController[fungsi](input, sesi);
  });
}

/** Siswa menekan "Saya sudah paham" pada materi pertemuan sesi yang sedang berlangsung. */
export async function tandaiPaham(input) {
  return jalankanMateri(AKSES.SISWA, 'tandaiPaham', input);
}

/** Admin menyimpan judul dan isi materi sebuah pertemuan. */
export async function simpanMateri(input) {
  return jalankanMateri(AKSES.ADMIN, 'simpan', input);
}
