import { AKSES } from '@/enums';

/** Daftar endpoint modul sertifikat: unduh PDF oleh pengelola dan oleh orang tua (hanya milik anaknya). */
export const sertifikatRoutes = [
  { metode: 'GET', path: '/sertifikat/pdf', controller: 'sertifikatController', fungsi: 'pdf', schema: null, sumber: 'query', akses: AKSES.PENGGUNA },
  { metode: 'GET', path: '/sertifikat/pdf-ortu', controller: 'sertifikatController', fungsi: 'pdfOrtu', schema: null, sumber: 'query', akses: AKSES.ORTU },
];
