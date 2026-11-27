import { validasi } from '@/utils/validasi';
import { AppError } from '@/utils/appError';
import { hasilBerkas } from '@/utils/responseHandler';
import { t } from '@/utils/i18n';
import { MAKS_UKURAN_LOGO, MAKS_UKURAN_TANDA_TANGAN } from '@/enums';
import { sajianLogoSchema, slotLogoSchema, ubahPengaturanSchema } from './pengaturan.schema';

/** Controller pengaturan: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route. */
export function buatPengaturanController({ pengaturanUsecase }) {
  return {
    /** Semua pengaturan (teks) untuk halaman Pengaturan. */
    semua: () => pengaturanUsecase.ambilPengaturan(),
    /** Nama pelatihan, perusahaan, dan URL logo untuk header kedua area. */
    branding: () => pengaturanUsecase.branding(),
    /** Mengubah pengaturan setelah input divalidasi. */
    ubah: (input, sesi) => pengaturanUsecase.ubah(validasi(ubahPengaturanSchema, input), sesi.id),
    /** Menerima unggahan logo (multipart, kolom logo; kolom slot opsional, bawaan utama). */
    async unggahLogo(input, sesi) {
      const berkas = input?.logo;
      // kolom logo kosong atau bukan berkas
      if (!berkas || typeof berkas.arrayBuffer !== 'function' || berkas.size === 0) throw new AppError(t('pengaturan.logoWajib'), 400);
      // tolak sebelum membaca isi agar berkas besar tidak dimuat ke memori
      if (berkas.size > MAKS_UKURAN_LOGO) throw new AppError(t('pengaturan.logoTerlaluBesar'), 400);
      const buffer = Buffer.from(await berkas.arrayBuffer());
      const { slot } = validasi(slotLogoSchema, { slot: input?.slot });
      return pengaturanUsecase.ubahLogo(buffer, sesi.id, slot);
    },
    /** Menerima unggahan tanda tangan sertifikat (multipart, kolom `tandaTangan`; hanya PNG). */
    async unggahTandaTangan(input, sesi) {
      const berkas = input?.tandaTangan;
      // kolom kosong atau bukan berkas
      if (!berkas || typeof berkas.arrayBuffer !== 'function' || berkas.size === 0) throw new AppError(t('pengaturan.tandaTanganWajib'), 400);
      // tolak sebelum membaca isi agar berkas besar tidak dimuat ke memori
      if (berkas.size > MAKS_UKURAN_TANDA_TANGAN) throw new AppError(t('pengaturan.tandaTanganTerlaluBesar'), 400);
      const buffer = Buffer.from(await berkas.arrayBuffer());
      return pengaturanUsecase.ubahTandaTangan(buffer, sesi.id);
    },
    /** Menghapus tanda tangan sertifikat. */
    hapusTandaTangan: (sesi) => pengaturanUsecase.hapusTandaTangan(sesi.id),
    /** URL pratinjau tanda tangan untuk halaman Pengaturan. */
    tandaTanganUrl: () => pengaturanUsecase.tandaTanganUrl(),
    /** Menyajikan berkas tanda tangan (pratinjau pengelola). */
    async tandaTangan() {
      const { buffer, tipe } = await pengaturanUsecase.bacaTandaTangan();
      return hasilBerkas(buffer, tipe);
    },
    /** Mengembalikan logo sebuah slot ke bawaan (menghapus unggahan). */
    kembalikanLogo: (input, sesi) => pengaturanUsecase.kembalikanLogo(validasi(slotLogoSchema, input).slot, sesi.id),
    /** Menyajikan logo sebuah slot (query slot, bawaan utama; tema=gelap untuk versi gelap): unggahan atau berkas bawaan bila slot kosong. */
    async logoSlot(input) {
      const { slot, tema } = validasi(sajianLogoSchema, { slot: input?.slot, tema: input?.tema });
      const { buffer, tipe } = await pengaturanUsecase.bacaLogoSlot(slot, tema);
      return hasilBerkas(buffer, tipe);
    },
    /** Menyajikan berkas logo saat ini. */
    async logo() {
      const { buffer, tipe } = await pengaturanUsecase.bacaLogo();
      return hasilBerkas(buffer, tipe);
    },
  };
}
