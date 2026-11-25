import { PERAN } from '@/enums';

/** Menu samping area pengelola. `hanyaAdmin` tidak tampil bagi tutor. Item fase berikutnya ditambahkan di sini. */
// Catatan jalur: halaman siswa di backoffice memakai /data-siswa, karena /siswa/* di host backoffice
// dianggap akses silang ke area siswa dan dijawab 404 oleh src/proxy.js.
const MENU = [
  { jalur: '/', label: 'menu.beranda', ikon: 'beranda', hanyaAdmin: false },
  { jalur: '/absensi', label: 'menu.absensi', ikon: 'absensi', hanyaAdmin: false },
  { jalur: '/data-siswa', label: 'menu.siswa', ikon: 'siswa', hanyaAdmin: false },
  { jalur: '/level', label: 'menu.level', ikon: 'level', hanyaAdmin: false },
  { jalur: '/template', label: 'menu.template', ikon: 'template', hanyaAdmin: false },
  { jalur: '/gambar', label: 'menu.gambar', ikon: 'gambar', hanyaAdmin: false },
  { jalur: '/post-test', label: 'menu.postTest', ikon: 'target', hanyaAdmin: false },
  { jalur: '/sertifikat', label: 'menu.sertifikat', ikon: 'sertifikat', hanyaAdmin: false },
  { jalur: '/karya', label: 'menu.karya', ikon: 'gambar', hanyaAdmin: false },
  { jalur: '/ekspor', label: 'menu.ekspor', ikon: 'unduh', hanyaAdmin: false },
  { jalur: '/pengaturan', label: 'menu.pengaturan', ikon: 'pengaturan', hanyaAdmin: true },
  { jalur: '/pengguna', label: 'menu.pengguna', ikon: 'pengguna', hanyaAdmin: true },
  { jalur: '/log', label: 'menu.log', ikon: 'log', hanyaAdmin: true },
  { jalur: '/akun', label: 'menu.akun', ikon: 'akun', hanyaAdmin: false },
];

/** Menu yang boleh dilihat sebuah peran. */
export function menuUntukPeran(peran) {
  return MENU.filter((m) => !m.hanyaAdmin || peran === PERAN.ADMIN);
}
