/**
 * Mengubah `detail` hasil action gagal (daftar { kolom, pesan } dari validasi) menjadi objek
 * { namaKolom: pesan } agar galat tampil di dekat kolomnya. Isu pertama per kolom yang dipakai.
 */
export function petaGalat(detail) {
  // galat tanpa rincian per kolom (mis. 409, 429): tidak ada yang dipetakan
  if (!Array.isArray(detail)) return {};
  const peta = {};
  for (const isu of detail) if (isu?.kolom && !peta[isu.kolom]) peta[isu.kolom] = isu.pesan;
  return peta;
}
