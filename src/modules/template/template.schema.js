import { z } from 'zod';
import { t } from '@/utils/i18n';
import { DAFTAR_PENILAIAN, TIPE_TEMPLATE } from '@/enums';
import { idSchema, queryHalaman, queryId, queryPilihan, queryTeks } from '@/utils/schemaDasar';

/** Filter daftar template dari query string. `bagian`: 'latihan' (tanpa bagian) atau ID bagian post test. */
export const daftarTemplateSchema = z.object({
  levelId: queryId,
  pertemuanId: queryId,
  bagian: queryTeks(20).transform((v) => (v === 'latihan' || /^\d{1,20}$/.test(v) ? v : undefined)),
  tipe: queryPilihan(TIPE_TEMPLATE),
  penilaian: queryPilihan(DAFTAR_PENILAIAN),
  aktif: queryPilihan(['1', '0']),
  q: queryTeks(100),
  halaman: queryHalaman,
});

/** Schema detail/pratinjau template. */
export const idTemplateSchema = z.object({ id: idSchema });

/** Teks JSON dari editor: kosong -> null, selain itu harus JSON valid (pesan galat di kolomnya). */
const jsonEditor = z
  .string()
  .max(20000, t('validasi.maksKarakter', { maks: 20000 }))
  .transform((teks, ctx) => {
    const isi = teks.trim();
    // kolom dikosongkan: simpan NULL
    if (isi === '') return null;
    try {
      return JSON.parse(isi);
    } catch {
      // teks bukan JSON: tandai kolomnya agar admin tahu letak salahnya
      ctx.addIssue({ code: 'custom', message: t('validasi.jsonTidakValid') });
      return z.NEVER;
    }
  });

/** Isi template yang bisa diubah admin. */
const isiTemplate = {
  penilaian: z.enum(DAFTAR_PENILAIAN, { error: t('template.galat.penilaian', { penilaian: '' }) }),
  kesulitan: z.coerce
    .number({ error: t('validasi.harusAngka') })
    .int(t('validasi.harusBulat'))
    .min(1, t('validasi.minimal', { min: 1 }))
    .max(5, t('validasi.maksimal', { maks: 5 })),
  teks: z.string().trim().min(1, t('validasi.wajib')).max(5000, t('validasi.maksKarakter', { maks: 5000 })),
  parameter: jsonEditor,
  opsi: jsonEditor,
  kunci: jsonEditor,
  aktif: z.boolean(),
};

/** Schema tambah template: kode unik (huruf besar, angka, tanda hubung), pertemuan, bagian (khusus pertemuan 13), tipe. */
export const tambahTemplateSchema = z.object({
  kode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, t('template.kodeFormat')),
  pertemuanId: idSchema,
  bagianId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{1,20}$/.test(v), t('validasi.idTidakValid')),
  tipe: z.enum(TIPE_TEMPLATE, { error: t('template.galat.tipe', { tipe: '' }) }),
  ...isiTemplate,
});

/** Schema ubah template (kode, pertemuan, bagian, dan tipe tidak berubah). */
export const ubahTemplateSchema = z.object({ id: idSchema, ...isiTemplate });
