'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';

/** Login admin/tutor; hasil berisi href tujuan. */
export async function masukPengelola(input) {
  return jalankanAction(() => ambilDep().authController.masukPengelola(input));
}

/** Keluar dari backoffice. */
export async function keluarPengelola() {
  return jalankanAction(() => ambilDep().authController.keluarPengelola());
}

/** Login kode siswa atau orang tua. */
export async function masukKode(input) {
  return jalankanAction(() => ambilDep().authController.masukKode(input));
}

/** Ganti device: akhiri login siswa di perangkat ini. */
export async function gantiDevice() {
  return jalankanAction(() => ambilDep().authController.gantiDevice());
}

/** Keluar dari area siswa. */
export async function keluarSiswa() {
  return jalankanAction(() => ambilDep().authController.keluarSiswa());
}

/** Keluar dari halaman orang tua. */
export async function keluarOrtu() {
  return jalankanAction(() => ambilDep().authController.keluarOrtu());
}
