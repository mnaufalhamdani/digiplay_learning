import { AKSES } from '@/enums';

/** Daftar endpoint modul auth: ping sesi siswa dari browser (tiap 15 detik saat tab terlihat, lihat keamanan.config). */
export const authRoutes = [
  { metode: 'POST', path: '/auth/ping', controller: 'authController', fungsi: 'ping', schema: null, sumber: null, akses: AKSES.SISWA },
];
