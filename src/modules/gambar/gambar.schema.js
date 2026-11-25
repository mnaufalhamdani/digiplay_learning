import { z } from 'zod';
import { KATEGORI_GAMBAR } from '@/enums';
import { idSchema, queryPilihan } from '@/utils/schemaDasar';

/** Filter halaman Gambar dari query string. */
export const daftarGambarSchema = z.object({
  kategori: queryPilihan(KATEGORI_GAMBAR),
  kelengkapan: queryPilihan(['lengkap', 'belum_lengkap']),
});

/** Schema detail subjek. */
export const idGambarSchema = z.object({ id: idSchema });

/** Schema aktif/nonaktif subjek. */
export const ubahAktifGambarSchema = z.object({ id: idSchema, aktif: z.boolean() });
