import { z } from 'zod';
import { t } from '@/utils/i18n';
import { BATAS_LATIHAN } from '@/enums';
import { idSchema } from '@/utils/schemaDasar';

/** Detail tombol { "<tombol>": { ketik, salah } }: dibatasi ukuran agar data dari browser tidak membengkak. */
export const detailTombolSchema = z
  .record(z.string().max(10), z.object({ ketik: z.number().int().min(0).max(10000), salah: z.number().int().min(0).max(10000) }))
  .refine((d) => Object.keys(d).length <= 120, t('latihan.hasilTidakWajar'));

/** Angka mentah hasil mengetik dari browser; WPM dan akurasi dihitung ulang di server. */
export const angkaMengetikSchema = {
  jumlahKarakterBenar: z.number().int().min(0).max(100000),
  jumlahKarakterDiketik: z.number().int().min(1).max(100000),
  durasiDetik: z.number().min(0).max(3600),
  detailTombol: detailTombolSchema,
  konsistensi: z.number().min(0).max(100).nullable().default(null),
  teks: z.string().max(BATAS_LATIHAN.maksPanjangTeks),
};

/** Schema hasil latihan mengetik siswa (mode tes hanya lewat post test). */
export const simpanMengetikSchema = z.object({
  ...angkaMengetikSchema,
  mode: z.enum(['pelajaran', 'latihan', 'game']),
  pelajaranId: idSchema.optional(),
});
