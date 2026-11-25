/**
 * Mengurai nilai kolom JSON dari database. MariaDB mengembalikan kolom JSON sebagai teks,
 * sedangkan MySQL 8 sudah mengembalikan objek; helper ini menyamakan keduanya.
 * Teks yang bukan JSON valid dikembalikan apa adanya agar data lama tidak hilang diam-diam.
 */
export function uraiJson(nilai) {
  // NULL di database, atau sudah berupa objek/angka (MySQL 8)
  if (nilai == null || typeof nilai !== 'string') return nilai ?? null;
  try {
    return JSON.parse(nilai);
  } catch {
    // isi kolom bukan JSON valid (mis. diisi manual): kembalikan teks mentahnya
    return nilai;
  }
}

/** Mengubah nilai menjadi teks JSON untuk disimpan; null/undefined tetap NULL di database. */
export function teksJson(nilai) {
  return nilai == null ? null : JSON.stringify(nilai);
}
