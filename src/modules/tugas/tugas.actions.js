'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller tugas setelah memastikan hak akses pemanggil. */
function jalankanTugas(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().tugasController[fungsi](input, sesi);
  });
}

/** Siswa mengirim jawaban tugas. */
export async function kirimJawaban(input) {
  return jalankanTugas(AKSES.SISWA, 'kirimJawaban', input);
}

/** Siswa melewati tugas. */
export async function lewatiTugas(input) {
  return jalankanTugas(AKSES.SISWA, 'lewati', input);
}

/** Siswa mengganti tugas. */
export async function gantiTugasSiswa(input) {
  return jalankanTugas(AKSES.SISWA, 'gantiOlehSiswa', input);
}

/** Tutor/admin mengganti tugas siswa. */
export async function gantiTugasTutor(input) {
  return jalankanTugas(AKSES.PENGGUNA, 'gantiOlehTutor', input);
}

/** Tutor/admin mengubah status tugas. */
export async function ubahStatusTugas(input) {
  return jalankanTugas(AKSES.PENGGUNA, 'ubahStatus', input);
}
