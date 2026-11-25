import { z } from 'zod';
import { t } from '@/utils/i18n';
import { STATUS_TUGAS_TUTOR } from '@/enums';
import { idSchema } from '@/utils/schemaDasar';

/** Schema satu tugas (Lewati, Ganti tugas). */
export const idTugasSchema = z.object({ tugasId: idSchema });

/** Schema jawaban siswa: teks angka/kata atau indeks opsi pilihan ganda (sebagai teks). */
export const kirimJawabanSchema = z.object({
  tugasId: idSchema,
  jawaban: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .pipe(z.string().min(1, t('tugas.jawabanWajib')).max(100, t('validasi.maksKarakter', { maks: 100 }))),
});

/** Schema perubahan status tugas oleh tutor. */
export const ubahStatusTugasSchema = z.object({ tugasId: idSchema, status: z.enum(STATUS_TUGAS_TUTOR) });

/** Schema unduh bahan dari query string. */
export const unduhSchema = z.object({ tugasId: idSchema, kode: z.string().trim().max(10) });
