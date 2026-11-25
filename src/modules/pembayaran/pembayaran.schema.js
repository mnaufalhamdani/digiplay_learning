import { z } from 'zod';
import { t } from '@/utils/i18n';
import { idSchema, tanggalSchema } from '@/utils/schemaDasar';

/**
 * Jumlah rupiah opsional dari form: kosong -> null; titik/spasi pemisah ribuan dibuang ("15.000" -> 15000).
 * Dipakai juga oleh form absen masuk.
 */
export const jumlahRupiahSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    const teks = String(v ?? '').replace(/[\s.]/g, '').replace(/^Rp/i, '');
    // kolom jumlah dikosongkan
    if (teks === '') return null;
    // selain angka bulat (mis. huruf atau koma desimal) ditolak dengan pesan di kolomnya
    if (!/^\d{1,12}$/.test(teks)) {
      ctx.addIssue({ code: 'custom', message: t('pembayaran.jumlahTidakValid') });
      return z.NEVER;
    }
    return Number(teks);
  });

/** Keterangan opsional: kosong -> null. */
export const keteranganSchema = z
  .string()
  .trim()
  .max(255, t('validasi.maksKarakter', { maks: 255 }))
  .optional()
  .transform((v) => v || null);

/** Schema tambah pembayaran dari detail siswa/sesi. */
export const tambahPembayaranSchema = z.object({
  siswaId: idSchema,
  sesiId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{1,20}$/.test(v), t('validasi.idTidakValid')),
  tanggal: tanggalSchema.optional().or(z.literal('').transform(() => undefined)),
  jumlah: jumlahRupiahSchema,
  keterangan: keteranganSchema,
});

/** Schema hapus pembayaran. */
export const hapusPembayaranSchema = z.object({ id: idSchema });
