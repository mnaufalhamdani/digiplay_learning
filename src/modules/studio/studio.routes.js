import { AKSES } from '@/enums';

/**
 * Daftar endpoint modul studio, memakai mekanisme yang sama dengan unggah karya: unggah kostum (multipart, siswa) dan
 * sajikan berkas kostum (siswa pemilik, orang tua, atau pengelola yang melihat kiriman proyek).
 */
export const studioRoutes = [
  { metode: 'POST', path: '/studio/kostum', controller: 'studioController', fungsi: 'unggahKostum', schema: null, sumber: 'form', akses: AKSES.SISWA },
  { metode: 'GET', path: '/studio/kostum/berkas', controller: 'studioController', fungsi: 'berkasKostum', schema: null, sumber: 'query', akses: AKSES.LOGIN },
];
