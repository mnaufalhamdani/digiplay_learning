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
