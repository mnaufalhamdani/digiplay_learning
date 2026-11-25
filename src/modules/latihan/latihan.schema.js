import { z } from 'zod';
import { JENIS_LATIHAN, KATEGORI_GAMBAR, KEPING_PUZZLE } from '@/enums';

/** Schema hasil game mouse atau puzzle dari browser. */
export const simpanLatihanSchema = z
  .object({
    jenis: z.enum(JENIS_LATIHAN),
    skor: z.number().int().min(0).max(100000).optional(),
    selesai: z.boolean().default(false),
    durasiDetik: z.number().min(0).max(65535),
    keping: z.number().int().optional(),
    kode: z.string().trim().max(10).optional(),
    detail: z.record(z.string().max(40), z.union([z.number(), z.string().max(100), z.boolean()])).optional(),
  })
  // puzzle wajib keping (4/6/9) dan kode gambar; game mouse wajib skor
  .refine((d) => (d.jenis === 'puzzle' ? KEPING_PUZZLE.includes(d.keping) && Boolean(d.kode) : d.skor !== undefined), { message: 'Data latihan tidak lengkap.' });

/** Schema permintaan gambar puzzle mode bebas. */
export const gambarPuzzleSchema = z.object({ kategori: z.enum(KATEGORI_GAMBAR).optional() });
