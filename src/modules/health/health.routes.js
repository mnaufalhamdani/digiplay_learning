import { AKSES } from '@/enums';

/** Daftar endpoint modul health. */
export const healthRoutes = [
  { metode: 'GET', path: '/health', controller: 'healthController', fungsi: 'cek', schema: null, sumber: null, akses: AKSES.PUBLIK },
];
