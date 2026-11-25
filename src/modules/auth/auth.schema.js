import { z } from 'zod';
import { t } from '@/utils/i18n';

/** Schema login pengelola. Email dirapikan huruf kecil seperti saat akun dibuat. */
export const masukPengelolaSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, t('validasi.wajib')).max(190),
  password: z.string().min(1, t('validasi.wajib')).max(200),
});

/** Schema login kode; format kode diperiksa usecase agar pesannya tepat (karakter terlarang / panjang). */
export const masukKodeSchema = z.object({
  kode: z.string({ error: t('auth.kodeWajib') }).max(40, t('auth.kodeTidakDikenal')),
});
