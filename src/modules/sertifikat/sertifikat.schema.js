import { z } from 'zod';
import { t } from '@/utils/i18n';
import { ATURAN_SERTIFIKAT, DAFTAR_STATUS_SERTIFIKAT } from '@/enums';
import { idSchema, queryHalaman, queryId, queryPilihan, queryTeks } from '@/utils/schemaDasar';

/** Filter daftar sertifikat dari query string (nilai tidak sah diabaikan). */
export const daftarSertifikatSchema = z.object({
  q: queryTeks(150),
  status: queryPilihan(DAFTAR_STATUS_SERTIFIKAT),
  levelId: queryId,
  halaman: queryHalaman,
});

/** Schema satu sertifikat (unduh PDF). */
export const idSertifikatSchema = z.object({ id: idSchema });

/** Schema batalkan: alasan wajib, maksimal 255 karakter. */
export const batalSertifikatSchema = z.object({
  id: idSchema,
  alasan: z
    .string()
    .trim()
    .min(1, t('sertifikat.alasanWajib'))
    .max(ATURAN_SERTIFIKAT.maksAlasan, t('validasi.maksKarakter', { maks: ATURAN_SERTIFIKAT.maksAlasan })),
});

/** Schema terbitkan ulang untuk pasangan (siswa, level). */
export const terbitUlangSchema = z.object({ siswaId: idSchema, levelId: idSchema });
