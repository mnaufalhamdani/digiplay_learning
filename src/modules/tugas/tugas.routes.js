import { AKSES } from '@/enums';

/** Daftar endpoint modul tugas: unduh bahan gambar tugas siswa (attachment PNG). */
export const tugasRoutes = [
  { metode: 'GET', path: '/tugas/unduh', controller: 'tugasController', fungsi: 'unduh', schema: null, sumber: 'query', akses: AKSES.SISWA },
];
