import { z } from 'zod';
import { t } from '@/utils/i18n';
import { idSchema } from '@/utils/schemaDasar';

/**
 * Opsi objek ketat: kunci yang tidak dikenal ditolak dengan menyebut nama kuncinya (mis. salah ketik "gambr"),
 * dan nilai yang bukan objek mendapat pesan Indonesia.
 */
const OPSI_KETAT = {
  error: (isu) => {
    // kunci asing biasanya salah ketik: sebut namanya
    if (isu.code === 'unrecognized_keys') return t('materi.galat.kunciTidakDikenal', { kunci: isu.keys.join(', ') });
    // nilai ada tetapi bukan objek JSON (mis. teks atau angka)
    if (isu.code === 'invalid_type') return t('materi.galat.harusObjek');
    return undefined;
  },
};

/** Teks wajib dengan batas panjang. */
const teks = (maks) => z.string().trim().min(1, t('validasi.wajib')).max(maks, t('validasi.maksKarakter', { maks }));

/** Teks opsional: boleh tidak ada; bila ada tidak boleh kosong. */
const teksOpsional = (maks) => z.string().trim().min(1, t('validasi.wajib')).max(maks, t('validasi.maksKarakter', { maks })).optional();

/** Jalur gambar relatif terhadap public/ (hanya di bawah aset/, tanpa ".." agar tidak keluar folder). */
const jalurGambar = z
  .string()
  .trim()
  .max(200, t('validasi.maksKarakter', { maks: 200 }))
  // satu aturan saja agar galatnya tidak dobel: awalan aset/, karakter aman, dan tanpa ".." atau "//"
  .refine((v) => /^aset\/[A-Za-z0-9_\-./]+$/.test(v) && !v.split('/').includes('..') && !v.includes('//'), t('materi.galat.jalurGambar'));

/** Satu bagian materi, dibedakan lewat `tipe`; tipe yang tidak dikenal ditolak dengan pesan yang menyebut tipenya. */
const bagianSchema = z.discriminatedUnion(
  'tipe',
  [
    z.strictObject({ tipe: z.literal('paragraf'), judul: teksOpsional(150), teks: teks(3000) }, OPSI_KETAT),
    z.strictObject(
      {
        tipe: z.literal('langkah'),
        judul: teksOpsional(150),
        langkah: z.array(z.strictObject({ teks: teks(1000), gambar: jalurGambar.optional() }, OPSI_KETAT)).min(1, t('materi.galat.langkahKosong')).max(30, t('materi.galat.maks', { maks: 30 })),
      },
      OPSI_KETAT,
    ),
    z.strictObject({ tipe: z.literal('zippy'), teks: teks(1000) }, OPSI_KETAT),
    z.strictObject({ tipe: z.literal('gambar'), src: jalurGambar, keterangan: teksOpsional(300) }, OPSI_KETAT),
  ],
  {
    error: (isu) => {
      const tipe = isu.input?.tipe;
      // bagian tanpa kunci "tipe" sama sekali
      if (tipe == null || tipe === '') return t('materi.galat.tipeKosong');
      return t('materi.galat.tipeTidakDikenal', { tipe: String(tipe) });
    },
  },
);

/** Isi materi (kolom JSON `isi`): kotak tujuan belajar dan bagian-bagiannya. */
export const isiMateriSchema = z.strictObject(
  {
    tujuan: z.array(teks(300)).min(1, t('materi.galat.tujuanKosong')).max(10, t('materi.galat.maks', { maks: 10 })),
    bagian: z.array(bagianSchema).min(1, t('materi.galat.bagianKosong')).max(60, t('materi.galat.maks', { maks: 60 })),
  },
  OPSI_KETAT,
);

/** Schema yang memuat satu ID pertemuan (halaman materi, tombol Saya sudah paham, detail pengelola). */
export const idPertemuanSchema = z.object({ pertemuanId: idSchema });

/** Teks JSON dari editor menjadi objek; teks bukan JSON ditandai pada kolomnya. */
const jsonEditor = z
  .string()
  .max(60000, t('validasi.maksKarakter', { maks: 60000 }))
  .transform((isi, ctx) => {
    // editor dikosongkan: isi wajib ada
    if (isi.trim() === '') {
      ctx.addIssue({ code: 'custom', message: t('validasi.wajib') });
      return z.NEVER;
    }
    try {
      return JSON.parse(isi);
    } catch {
      // teks bukan JSON: tandai kolomnya agar admin tahu letak salahnya
      ctx.addIssue({ code: 'custom', message: t('validasi.jsonTidakValid') });
      return z.NEVER;
    }
  })
  .pipe(isiMateriSchema);

/** Schema simpan materi oleh admin: pertemuan, judul, isi (teks JSON dari editor), dan status aktif. */
export const simpanMateriSchema = z.object({
  pertemuanId: idSchema,
  judul: teks(200),
  isi: jsonEditor,
  aktif: z.boolean(),
});
