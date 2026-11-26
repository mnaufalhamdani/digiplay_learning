import { z } from 'zod';
import { t } from '@/utils/i18n';
import { idSchema } from '@/utils/schemaDasar';
import { BATAS_STUDIO } from '@/modules/shared/blockly/pustakaStudio';
import { TINGKAT_BAWAAN, TINGKAT_STUDIO, blokTersedia, periksaProyek } from '@/modules/shared/blockly/daftarBlokStudio';

/** Nama proyek: 1 sampai 60 karakter. */
export const namaProyekSchema = z
  .string({ error: t('studio.namaWajib') })
  .trim()
  .min(1, t('studio.namaWajib'))
  .max(BATAS_STUDIO.maksNamaProyek, t('validasi.maksKarakter', { maks: BATAS_STUDIO.maksNamaProyek }));

/**
 * Isi proyek dari browser. Bentuk dan isi tiap blok diperiksa periksaProyek (tanpa rekursi, jadi proyek yang bersarang
 * sangat dalam tidak membuat server kehabisan tumpukan); pesannya menyebut letak galat. Di sini blok diperiksa terhadap
 * kumpulan blok paling lengkap (tingkat terakhir); usecase mempersempitnya ke tingkat proyek yang sebenarnya. Ukuran
 * teks JSON dibatasi setelah bentuknya sah (kedalamannya sudah terbatas, jadi aman diubah menjadi teks).
 */
export const isiProyekSchema = z.unknown().superRefine((isi, ctx) => {
  const galat = periksaProyek(isi, { tersedia: blokTersedia(TINGKAT_STUDIO.at(-1)) });
  for (const g of galat) ctx.addIssue({ code: 'custom', message: g.pesan, path: g.jalur });
  // bentuk salah: ukuran tidak perlu dihitung
  if (galat.length > 0) return;
  if (JSON.stringify(isi).length > BATAS_STUDIO.maksUkuranByte) ctx.addIssue({ code: 'custom', message: t('studio.galat.ukuranBesar', { maks: BATAS_STUDIO.maksUkuranByte / 1024 }) });
});

/**
 * Schema simpan proyek: tanpa `id` membuat proyek baru bernama `nama` pada `tingkat` (bawaan l2); dengan `id` memperbarui
 * isi proyek itu (tingkat proyek tidak berubah).
 */
export const simpanProyekSchema = z.object({ id: idSchema.nullish(), nama: namaProyekSchema, isi: isiProyekSchema, tingkat: z.enum(TINGKAT_STUDIO).default(TINGKAT_BAWAAN) });

/** Schema satu proyek (buka, hapus). */
export const idProyekSchema = z.object({ id: idSchema });

/** Schema satu kostum unggahan (hapus, berkas). */
export const idKostumSchema = z.object({ id: idSchema });

/** Schema kirim proyek ke tugas latihan (`tugas`) atau butir post test (`butir`). */
export const kirimProyekSchema = z.object({ proyekId: idSchema, tugasId: idSchema, jenis: z.enum(['tugas', 'butir']) });

/** Schema satu tugas/butir (melihat kiriman proyek). */
export const idKirimanSchema = z.object({ tugasId: idSchema });
