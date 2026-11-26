import { z } from 'zod';
import { periksaProgram } from '@/modules/shared/blockly/daftarBlok';

/** Schema kode labirin (URL halaman satu labirin). */
export const kodeLabirinSchema = z.object({ kode: z.string().trim().min(1).max(40) });

/**
 * Schema program dari browser. Bentuk dan isi tiap blok diperiksa periksaProgram (tanpa rekursi, jadi program yang
 * bersarang sangat dalam tidak membuat server kehabisan tumpukan); pesannya menyebut letak galat di program.
 */
const programSchema = z
  .array(z.unknown())
  .max(300)
  .superRefine((program, ctx) => {
    for (const g of periksaProgram(program)) ctx.addIssue({ code: 'custom', message: g.pesan, path: g.jalur });
  });

/** Schema simpan hasil Coding Zippy: HANYA kode labirin dan program; "berhasil" tidak pernah diterima dari browser. */
export const simpanBlocklySchema = z.object({
  kode: z.string().trim().min(1).max(40),
  program: programSchema,
  durasiDetik: z.number().min(0).max(65535).optional(),
});
