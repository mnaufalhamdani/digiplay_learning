import { AKSES } from '@/enums';

/** Daftar endpoint modul post test: denyut waktu (tiap 15 detik saat terlihat) dan unduh bahan butir dari halaman post test siswa. */
export const posttestRoutes = [
  { metode: 'POST', path: '/posttest/denyut', controller: 'posttestController', fungsi: 'denyut', schema: null, sumber: null, akses: AKSES.SISWA },
  { metode: 'GET', path: '/posttest/unduh', controller: 'posttestController', fungsi: 'unduh', schema: null, sumber: 'query', akses: AKSES.SISWA },
];
