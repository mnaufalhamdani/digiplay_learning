import { z } from 'zod';
import { t } from '@/utils/i18n';
import { DAFTAR_PERAN } from '@/enums';
import { idSchema, passwordBaruSchema } from '@/utils/schemaDasar';

/** Nama tampilan akun. */
const namaSchema = z.string().trim().min(1, t('validasi.wajib')).max(150, t('validasi.maksKarakter', { maks: 150 }));
/** Peran akun. */
const peranSchema = z.enum(DAFTAR_PERAN, { error: t('pengguna.peranTidakValid') });

/** Schema tambah akun. Email disimpan huruf kecil agar keunikan tidak bergantung pada huruf besar. */
export const tambahPenggunaSchema = z.object({
  nama: namaSchema,
  email: z.string().trim().toLowerCase().max(190, t('validasi.maksKarakter', { maks: 190 })).email(t('validasi.emailTidakValid')),
  peran: peranSchema,
  password: passwordBaruSchema,
});

/** Schema ubah nama/peran. */
export const ubahPenggunaSchema = z.object({ id: idSchema, nama: namaSchema, peran: peranSchema });

/** Schema aktif/nonaktif akun. */
export const ubahAktifSchema = z.object({ id: idSchema, aktif: z.boolean() });

/** Schema reset password oleh admin. */
export const resetPasswordSchema = z.object({ id: idSchema, password: passwordBaruSchema });

/** Schema ubah password sendiri: password lama wajib, password baru diketik dua kali. */
export const ubahPasswordSendiriSchema = z
  .object({
    passwordLama: z.string().min(1, t('validasi.wajib')).max(200),
    passwordBaru: passwordBaruSchema,
    konfirmasi: z.string(),
  })
  .refine((d) => d.passwordBaru === d.konfirmasi, { message: t('akun.konfirmasiBeda'), path: ['konfirmasi'] });
