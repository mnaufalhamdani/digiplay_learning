'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller studio setelah memastikan hak akses pemanggil. */
function jalankanStudio(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().studioController[fungsi](input, sesi);
  });
}

/** Siswa melihat daftar proyeknya. */
export async function daftarProyekStudio() {
  return jalankanStudio(AKSES.SISWA, 'daftar', null);
}

/** Siswa membuka satu proyeknya (beserta isi). */
export async function bukaProyekStudio(input) {
  return jalankanStudio(AKSES.SISWA, 'buka', input);
}

/** Siswa menyimpan proyek (baru atau memperbarui); hanya saat sesi berlangsung. */
export async function simpanProyekStudio(input) {
  return jalankanStudio(AKSES.SISWA, 'simpan', input);
}

/** Siswa menghapus proyek; hanya saat sesi berlangsung. */
export async function hapusProyekStudio(input) {
  return jalankanStudio(AKSES.SISWA, 'hapus', input);
}

/** Siswa mengirim proyek ke tugas atau butir post test. */
export async function kirimProyekStudio(input) {
  return jalankanStudio(AKSES.SISWA, 'kirim', input);
}

/** Siswa melihat ringkasan kiriman proyek untuk satu tugas/butirnya. */
export async function ringkasanKirimanStudio(input) {
  return jalankanStudio(AKSES.SISWA, 'ringkasanKiriman', input);
}

/** Siswa menghapus kostum unggahannya; ditolak bila sudah dirujuk kiriman tugas (unggah lewat route HTTP, bukan action). */
export async function hapusKostumStudio(input) {
  return jalankanStudio(AKSES.SISWA, 'hapusKostum', input);
}

/** Tutor/admin mengambil salinan proyek yang dikirim siswa ke satu tugas/butir. */
export async function ambilKirimanStudio(input) {
  return jalankanStudio(AKSES.PENGGUNA, 'kiriman', input);
}
