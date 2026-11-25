import { validasi } from '@/utils/validasi';
import { AppError } from '@/utils/appError';
import { hasilBerkas } from '@/utils/responseHandler';
import { t } from '@/utils/i18n';
import { MAKS_UKURAN_LOGO } from '@/enums';
import { ubahPengaturanSchema } from './pengaturan.schema';

/** Controller pengaturan: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route. */
export function buatPengaturanController({ pengaturanUsecase }) {
  return {
    /** Semua pengaturan (teks) untuk halaman Pengaturan. */
    semua: () => pengaturanUsecase.ambilPengaturan(),
    /** Nama pelatihan, perusahaan, dan URL logo untuk header kedua area. */
    branding: () => pengaturanUsecase.branding(),
    /** Mengubah pengaturan setelah input divalidasi. */
    ubah: (input, sesi) => pengaturanUsecase.ubah(validasi(ubahPengaturanSchema, input), sesi.id),
    /** Menerima unggahan logo (multipart, kolom `logo`). */
    async unggahLogo(input, sesi) {
      const berkas = input?.logo;
      // kolom logo kosong atau bukan berkas
      if (!berkas || typeof berkas.arrayBuffer !== 'function' || berkas.size === 0) throw new AppError(t('pengaturan.logoWajib'), 400);
      // tolak sebelum membaca isi agar berkas besar tidak dimuat ke memori
      if (berkas.size > MAKS_UKURAN_LOGO) throw new AppError(t('pengaturan.logoTerlaluBesar'), 400);
      const buffer = Buffer.from(await berkas.arrayBuffer());
      return pengaturanUsecase.ubahLogo(buffer, sesi.id);
    },
    /** Menyajikan berkas logo saat ini. */
    async logo() {
      const { buffer, tipe } = await pengaturanUsecase.bacaLogo();
      return hasilBerkas(buffer, tipe);
    },
  };
}
