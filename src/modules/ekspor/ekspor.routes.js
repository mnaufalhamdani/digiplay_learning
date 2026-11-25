import { AKSES } from '@/enums';

/** Daftar endpoint ekspor CSV (admin dan tutor), filter lewat query `level`, `dari`, `sampai`. */
export const eksporRoutes = [
  { metode: 'GET', path: '/ekspor/siswa', controller: 'eksporController', fungsi: 'siswa', schema: null, sumber: 'query', akses: AKSES.PENGGUNA },
  { metode: 'GET', path: '/ekspor/kehadiran', controller: 'eksporController', fungsi: 'kehadiran', schema: null, sumber: 'query', akses: AKSES.PENGGUNA },
  { metode: 'GET', path: '/ekspor/post-test', controller: 'eksporController', fungsi: 'postTest', schema: null, sumber: 'query', akses: AKSES.PENGGUNA },
  { metode: 'GET', path: '/ekspor/pembayaran', controller: 'eksporController', fungsi: 'pembayaran', schema: null, sumber: 'query', akses: AKSES.PENGGUNA },
];
