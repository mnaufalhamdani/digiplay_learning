import { z } from 'zod';
import { t } from '@/utils/i18n';
import { DAFTAR_PENUNTASAN } from '@/enums';
import { idSchema } from '@/utils/schemaDasar';
import { jumlahRupiahSchema, keteranganSchema } from '@/modules/pembayaran/pembayaran.schema';

/** Kode siswa dari KolomKode; format rinci (karakter, panjang) diperiksa usecase agar pesannya tepat. */
const kodeSchema = z.string({ error: t('auth.kodeWajib') }).trim().min(1, t('auth.kodeWajib')).max(40, t('sesi.kodeTidakDikenal'));

/** Schema langkah cek kode di form absen. */
export const cekKodeSchema = z.object({ kode: kodeSchema });

/** Schema absen masuk: kode, pertemuan, tutor tambahan (opsional), dan pembayaran (opsional). */
export const absenMasukSchema = z.object({
  kode: kodeSchema,
  pertemuanId: idSchema,
  tutorTambahan: z.array(idSchema).max(20).default([]),
  jumlah: jumlahRupiahSchema,
  keterangan: keteranganSchema,
});

/** Schema aksi pada satu sesi (detail, tutup, ikut menangani). */
export const idSesiSchema = z.object({ sesiId: idSchema });

/** Schema izinkan pengecualian kehadiran. */
export const pengecualianSchema = z.object({ siswaLevelId: idSchema });

/** Schema penuntasan: salah satu status, atau null untuk kembali ke otomatis. */
export const penuntasanSchema = z.object({ sesiId: idSchema, penuntasan: z.enum(DAFTAR_PENUNTASAN).nullable() });

/** Schema catatan tutor (boleh dikosongkan). */
export const catatanSchema = z.object({
  sesiId: idSchema,
  catatan: z
    .string()
    .trim()
    .max(5000, t('validasi.maksKarakter', { maks: 5000 }))
    .transform((v) => v || null),
});
