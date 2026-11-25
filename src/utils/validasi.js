import { AppError } from './appError';

/**
 * Validasi data memakai schema zod. Mengembalikan data yang sudah bersih,
 * atau melempar AppError 400 berisi pesan yang mudah dibaca beserta detail isu per kolom.
 */
export function validasi(schema, data) {
  const hasil = schema.safeParse(data);
  // data valid: langsung kembalikan hasil parse (sudah di-trim/di-coerce oleh schema)
  if (hasil.success) return hasil.data;
  // gabungkan semua isu agar user melihat seluruh kesalahan sekaligus
  const pesan = hasil.error.issues.map((isu) => isu.message).join(' ');
  const detail = hasil.error.issues.map((isu) => ({ kolom: isu.path.join('.'), pesan: isu.message }));
  throw new AppError(pesan, 400, detail);
}
