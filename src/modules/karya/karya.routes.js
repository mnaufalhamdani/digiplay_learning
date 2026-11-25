import { AKSES } from '@/enums';

/** Daftar endpoint modul karya: unggah karya siswa (multipart) dan sajikan berkas karya. */
export const karyaRoutes = [
  { metode: 'POST', path: '/karya', controller: 'karyaController', fungsi: 'tambah', schema: null, sumber: 'form', akses: AKSES.SISWA },
  { metode: 'GET', path: '/karya/berkas', controller: 'karyaController', fungsi: 'berkas', schema: null, sumber: 'query', akses: AKSES.LOGIN },
];
