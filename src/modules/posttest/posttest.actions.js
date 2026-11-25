'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller post test setelah memastikan hak akses pemanggil. */
function jalankanPostTest(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().posttestController[fungsi](input, sesi);
  });
}

/** Siswa memulai/melanjutkan post test. */
export async function mulaiPostTest() {
  return jalankanPostTest(AKSES.SISWA, 'mulai', null);
}

/** Siswa menyimpan jawaban butir (balasan tidak memuat benar/salah). */
export async function jawabPostTest(input) {
  return jalankanPostTest(AKSES.SISWA, 'jawab', input);
}

/** Siswa menandai butir praktik siap dinilai (atau membatalkannya). */
export async function siapDinilaiPostTest(input) {
  return jalankanPostTest(AKSES.SISWA, 'siapDinilai', input);
}

/** Siswa mengirim hasil tes mengetik post test. */
export async function tesMengetikPostTest(input) {
  return jalankanPostTest(AKSES.SISWA, 'tesMengetik', input);
}

/** Siswa mengumpulkan post test. */
export async function kumpulPostTest() {
  return jalankanPostTest(AKSES.SISWA, 'kumpul', null);
}

/** Tutor/admin mengisi nilai bagian praktik. */
export async function simpanNilaiPostTest(input) {
  return jalankanPostTest(AKSES.PENGGUNA, 'simpanNilai', input);
}

/** Tutor/admin membuka tes ulang. */
export async function bukaTesUlang(input) {
  return jalankanPostTest(AKSES.PENGGUNA, 'bukaTesUlang', input);
}
