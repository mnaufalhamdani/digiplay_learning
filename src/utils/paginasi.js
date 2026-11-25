/**
 * Menghitung paginasi dari jumlah total baris. Halaman yang melewati akhir dibatasi ke halaman terakhir.
 * Hasil: { halaman, totalHalaman, batas, offset } untuk LIMIT/OFFSET di model.
 */
export function hitungPaginasi(total, halaman, ukuran) {
  const totalHalaman = Math.max(1, Math.ceil(Number(total) / ukuran));
  const aman = Math.min(Math.max(1, halaman), totalHalaman);
  return { halaman: aman, totalHalaman, batas: ukuran, offset: (aman - 1) * ukuran };
}
