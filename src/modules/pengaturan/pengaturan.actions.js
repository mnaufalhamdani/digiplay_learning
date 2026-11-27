'use server';
import { revalidatePath } from 'next/cache';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menyimpan pengaturan dari form (hanya admin). */
export async function simpanPengaturan(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.ADMIN);
    await ambilDep().pengaturanController.ubah(input, sesi);
    // nama pelatihan tampil di header dan judul tab semua halaman
    revalidatePath('/', 'layout');
    return null;
  });
}

/** Menghapus gambar tanda tangan sertifikat (hanya admin). */
export async function hapusTandaTangan() {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.ADMIN);
    return ambilDep().pengaturanController.hapusTandaTangan(sesi);
  });
}

/** Mengembalikan logo sebuah slot ke bawaan (hanya admin). */
export async function kembalikanLogo(input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.ADMIN);
    const hasil = await ambilDep().pengaturanController.kembalikanLogo(input, sesi);
    // logo tampil di header semua halaman
    revalidatePath('/', 'layout');
    return hasil;
  });
}
