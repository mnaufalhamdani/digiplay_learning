import { z } from 'zod';
import { t } from '@/utils/i18n';
import { idSchema } from '@/utils/schemaDasar';
import { MAKS_RINGKASAN_POST_TEST } from '@/enums';
import { angkaMengetikSchema } from '@/modules/mengetik/mengetik.schema';

/** Schema jawaban butir post test (pilihan ganda: indeks asli opsi; isian: teks/angka; boleh dikosongkan). */
export const jawabSchema = z.object({
  tugasId: idSchema,
  jawaban: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .pipe(z.string().max(100, t('validasi.maksKarakter', { maks: 100 }))),
});

/** Schema satu butir post test (halaman Studio Zippy dari butir praktik). */
export const idButirSchema = z.object({ tugasId: idSchema });

/** Schema penanda siap dinilai butir praktik. */
export const siapDinilaiSchema = z.object({ tugasId: idSchema, siap: z.boolean() });

/** Schema hasil tes mengetik post test (angka mentah; dihitung ulang di server). */
export const tesMengetikSchema = z.object(angkaMengetikSchema);

/** Schema tab daftar post test pengelola. */
export const tabSchema = z.enum(['menunggu', 'berlangsung', 'selesai']).catch('menunggu');

/** Schema detail post test. */
export const idPostTestSchema = z.object({ id: idSchema });

/**
 * Schema penilaian satu butir praktik oleh tutor: skor 0-100 (2 desimal; batas sebenarnya skor maksimum rubrik butir
 * diperiksa di usecase) dan catatan opsional. Skor kosong ditolak, bukan dianggap 0.
 */
export const nilaiButirSchema = z.object({
  id: idSchema,
  tugasId: idSchema,
  skor: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? v.trim().replace(',', '.') : v))
    // kolom kosong akan terbaca 0 oleh coerce, jadi ditolak lebih dulu
    .refine((v) => v !== '', t('validasi.wajib'))
    .pipe(z.coerce.number({ error: t('validasi.harusAngka') }).min(0, t('validasi.minimal', { min: 0 })).max(100, t('validasi.maksimal', { maks: 100 })))
    .transform((n) => Math.round(n * 100) / 100),
  catatan: z.string().trim().max(500, t('validasi.maksKarakter', { maks: 500 })).default(''),
});

/** Schema ringkasan penilaian siswa dari tutor: teks bebas boleh kosong (menghapus), maksimal MAKS_RINGKASAN_POST_TEST karakter. */
export const ringkasanSchema = z.object({
  id: idSchema,
  ringkasan: z
    .string()
    .trim()
    .max(MAKS_RINGKASAN_POST_TEST, t('posttest.ringkasanTerlaluPanjang', { maks: MAKS_RINGKASAN_POST_TEST })),
});
/** Schema unduh bahan butir post test dari query string. */
export const unduhButirSchema = z.object({ tugasId: idSchema, kode: z.string().trim().max(10) });

/** Schema buka tes ulang: bagian yang diulang (minimal satu). */
export const tesUlangSchema = z.object({ id: idSchema, bagianIds: z.array(idSchema).min(1, t('posttest.pilihBagian')) });
