import { AKSES } from '@/enums';

/** Daftar endpoint modul pengaturan: sajikan logo (publik, tampil di halaman masuk) dan unggah logo (admin). */
export const pengaturanRoutes = [
  { metode: 'GET', path: '/pengaturan/logo', controller: 'pengaturanController', fungsi: 'logo', schema: null, sumber: null, akses: AKSES.PUBLIK },
  { metode: 'POST', path: '/pengaturan/logo', controller: 'pengaturanController', fungsi: 'unggahLogo', schema: null, sumber: 'form', akses: AKSES.ADMIN },
];
