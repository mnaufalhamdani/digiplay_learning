import { AKSES } from '@/enums';

/** Daftar endpoint modul post test: denyut waktu dari halaman post test siswa (tiap 15 detik saat terlihat). */
export const posttestRoutes = [
  { metode: 'POST', path: '/posttest/denyut', controller: 'posttestController', fungsi: 'denyut', schema: null, sumber: null, akses: AKSES.SISWA },
];
