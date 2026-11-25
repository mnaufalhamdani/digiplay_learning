import { z } from 'zod';
import { t } from '@/utils/i18n';
import { idSchema } from '@/utils/schemaDasar';
import { angkaMengetikSchema } from '@/modules/mengetik/mengetik.schema';

/** Schema jawaban butir post test (pilihan ganda: indeks asli opsi; isian: teks/angka; boleh dikosongkan). */
export const jawabSchema = z.object({
  tugasId: idSchema,
  jawaban: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .pipe(z.string().max(100, t('validasi.maksKarakter', { maks: 100 }))),
});

/** Schema penanda siap dinilai butir praktik. */
export const siapDinilaiSchema = z.object({ tugasId: idSchema, siap: z.boolean() });

/** Schema hasil tes mengetik post test (angka mentah; dihitung ulang di server). */
export const tesMengetikSchema = z.object(angkaMengetikSchema);

/** Schema tab daftar post test pengelola. */
export const tabSchema = z.enum(['menunggu', 'berlangsung', 'selesai']).catch('menunggu');

/** Schema detail post test. */
export const idPostTestSchema = z.object({ id: idSchema });

/** Schema nilai bagian praktik oleh tutor (0-100, 2 desimal). */
export const nilaiTutorSchema = z.object({
  id: idSchema,
  bagianId: idSchema,
  nilai: z.coerce
    .number({ error: t('validasi.harusAngka') })
    .min(0, t('validasi.minimal', { min: 0 }))
    .max(100, t('validasi.maksimal', { maks: 100 }))
    .transform((n) => Math.round(n * 100) / 100),
});

/** Schema buka tes ulang: bagian yang diulang (minimal satu). */
export const tesUlangSchema = z.object({ id: idSchema, bagianIds: z.array(idSchema).min(1, t('posttest.pilihBagian')) });
