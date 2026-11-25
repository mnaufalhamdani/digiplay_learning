import { z } from 'zod';
import { t } from '@/utils/i18n';
import { idSchema } from '@/utils/schemaDasar';

/** Teks wajib dengan batas panjang. */
const teksWajib = (maks) => z.string().trim().min(1, t('validasi.wajib')).max(maks, t('validasi.maksKarakter', { maks }));
/** Teks opsional: kosong disimpan sebagai NULL. */
const teksOpsional = (maks) =>
  z
    .string()
    .trim()
    .max(maks, t('validasi.maksKarakter', { maks }))
    .transform((s) => (s === '' ? null : s));

/** Schema ubah level (nama, deskripsi). */
export const ubahLevelSchema = z.object({ id: idSchema, nama: teksWajib(100), deskripsi: teksOpsional(2000) });

/** Schema ubah pertemuan (judul, tujuan). */
export const ubahPertemuanSchema = z.object({ id: idSchema, judul: teksWajib(200), tujuan: teksOpsional(2000) });

/** Schema ubah bagian post test: bobot 0-100 (2 desimal), jumlah butir bulat 1-50. */
export const ubahBagianSchema = z.object({
  id: idSchema,
  nama: teksWajib(100),
  bobot: z.coerce
    .number({ error: t('validasi.harusAngka') })
    .min(0, t('validasi.minimal', { min: 0 }))
    .max(100, t('validasi.maksimal', { maks: 100 }))
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, t('level.bobotDuaDesimal')),
  jumlahSoal: z.coerce
    .number({ error: t('validasi.harusAngka') })
    .int(t('validasi.harusBulat'))
    .min(1, t('validasi.minimal', { min: 1 }))
    .max(50, t('validasi.maksimal', { maks: 50 })),
});
