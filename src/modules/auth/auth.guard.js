import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { PERAN } from '@/enums';

/** Mengarahkan ke halaman masuk area yang sedang dibuka (memperhitungkan awalan jalur cadangan dev). */
async function keMasuk() {
  redirect(gabungJalur((await infoPermintaan()).basis, '/masuk'));
}

/**
 * Guard halaman pengelola. Belum login -> halaman masuk backoffice.
 * `peranMinimal` ADMIN: tutor yang login mendapat 404 (halaman dianggap tidak ada baginya).
 */
export async function wajibPengguna(peranMinimal = null) {
  const sesi = await ambilDep().authController.sesiPengguna();
  if (!sesi) await keMasuk();
  // tutor membuka halaman admin: anggap halaman tidak ada
  if (peranMinimal === PERAN.ADMIN && sesi.peran !== PERAN.ADMIN) notFound();
  return sesi;
}

/** Guard halaman khusus admin. */
export function wajibAdmin() {
  return wajibPengguna(PERAN.ADMIN);
}

/** Guard halaman siswa: butuh login perangkat yang masih aktif. */
export async function wajibSiswa() {
  const sesi = await ambilDep().authController.sesiSiswa();
  if (!sesi) await keMasuk();
  return sesi;
}

/** Guard halaman orang tua. */
export async function wajibOrtu() {
  const sesi = await ambilDep().authController.sesiOrtu();
  if (!sesi) await keMasuk();
  return sesi;
}
