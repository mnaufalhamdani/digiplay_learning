'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Tutor/admin mencatat pembayaran. */
export async function tambahPembayaran(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.PENGGUNA);
    return ambilDep().pembayaranController.tambah(input, sesi);
  });
}

/** Hanya admin: menghapus catatan pembayaran. */
export async function hapusPembayaran(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.ADMIN);
    return ambilDep().pembayaranController.hapus(input, sesi);
  });
}
