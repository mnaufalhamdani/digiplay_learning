import { AKSES } from '@/enums';

/** Daftar endpoint modul pengaturan: sajikan logo (publik, tampil di halaman masuk), unggah logo (admin), serta pratinjau dan unggah tanda tangan sertifikat. */
export const pengaturanRoutes = [
  { metode: 'GET', path: '/pengaturan/logo', controller: 'pengaturanController', fungsi: 'logoSlot', schema: null, sumber: 'query', akses: AKSES.PUBLIK },
  { metode: 'POST', path: '/pengaturan/logo', controller: 'pengaturanController', fungsi: 'unggahLogo', schema: null, sumber: 'form', akses: AKSES.ADMIN },
  // logo per slot: kolom form `slot` pada POST (admin) dan query `slot` pada GET (publik, bawaan utama; slot kosong menyajikan berkas bawaan)
  // tanda tangan sertifikat: tidak publik; pratinjau untuk pengelola (admin dan tutor), unggah untuk admin
  { metode: 'GET', path: '/pengaturan/tanda-tangan', controller: 'pengaturanController', fungsi: 'tandaTangan', schema: null, sumber: null, akses: AKSES.PENGGUNA },
  { metode: 'POST', path: '/pengaturan/tanda-tangan', controller: 'pengaturanController', fungsi: 'unggahTandaTangan', schema: null, sumber: 'form', akses: AKSES.ADMIN },
];
