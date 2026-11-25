'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller sesi setelah memastikan hak akses pemanggil. */
function jalankanSesi(akses, fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(akses);
    return ambilDep().sesiController[fungsi](input, sesi);
  });
}

/** Tutor memeriksa kode siswa sebelum absen (nama, level, pertemuan bawaan). */
export async function cekKodeAbsen(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'cekKode', input);
}

/** Tutor mencatat absen masuk. */
export async function absenMasuk(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'absenMasuk', input);
}

/** Tutor mengizinkan pengecualian kehadiran post test. */
export async function izinkanPengecualian(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'izinkanPengecualian', input);
}

/** Tutor bergabung ke sesi berlangsung. */
export async function ikutMenangani(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'ikutMenangani', input);
}

/** Tutor menutup sesi. */
export async function tutupSesi(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'tutup', input);
}

/** Tutor mengubah penuntasan (null = kembali ke otomatis). */
export async function ubahPenuntasan(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'ubahPenuntasan', input);
}

/** Tutor menyimpan catatan sesi. */
export async function simpanCatatan(input) {
  return jalankanSesi(AKSES.PENGGUNA, 'simpanCatatan', input);
}

/** Siswa menekan Pulang: sesi ditutup, login diakhiri, cookie dihapus, lalu ke halaman "Sampai jumpa". */
export async function pulang() {
  return jalankanAction(async () => {
    const dep = ambilDep();
    const sesi = await dep.authController.wajibAkses(AKSES.SISWA);
    await dep.sesiController.pulang(null, sesi);
    return dep.authController.keluarkanSiswa('/sampai-jumpa');
  });
}
