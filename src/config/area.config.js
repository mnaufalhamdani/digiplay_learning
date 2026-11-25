// Pemetaan host ke area. Dipakai oleh src/proxy.js (pengarah domain) dan pembaca jalur di server.

/** Header internal yang diisi proxy: awalan jalur area untuk tautan (kosong di host asli, '/siswa' atau '/backoffice' di cadangan dev). */
export const HEADER_BASIS = 'x-dp-basis';

/** Folder rute tiap area di src/app. */
export const FOLDER_AREA = Object.freeze({ siswa: '/siswa', pengelola: '/backoffice' });

/** Hostname area dari .env (tanpa port). */
export function hostArea() {
  return { siswa: process.env.HOST_SISWA ?? 'siswa.localhost', pengelola: process.env.HOST_BACKOFFICE ?? 'backoffice.localhost' };
}

/** Alamat lengkap situs siswa yang dicetak di kartu kode (.env URL_SISWA). */
export function urlSiswa() {
  return process.env.URL_SISWA || 'http://siswa.localhost:3000';
}
/** Menentukan area dari hostname: 'siswa', 'pengelola', atau null bila host tidak dikenal (cadangan dev). */
export function areaDariHost(hostname) {
  const host = hostArea();
  // host cocok dengan salah satu area; selain itu null = cadangan dev (localhost/IP)
  if (hostname === host.siswa) return 'siswa';
  if (hostname === host.pengelola) return 'pengelola';
  return null;
}
