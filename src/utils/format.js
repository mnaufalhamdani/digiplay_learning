/** Format tanggal Indonesia, mis. "5 Maret 2025", dari teks database "YYYY-MM-DD" (atau awalan DATETIME). */
export function formatTanggal(teks) {
  // tanggal kosong (mis. level belum selesai)
  if (!teks) return '-';
  const d = new Date(`${String(teks).slice(0, 10)}T00:00:00Z`);
  // teks bukan tanggal: tampilkan apa adanya daripada "Invalid Date"
  if (Number.isNaN(d.getTime())) return String(teks);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Format tanggal dan jam, mis. "5 Maret 2025 14.30", dari teks DATETIME database (waktu server, tanpa konversi zona). */
export function formatWaktu(teks) {
  // waktu kosong
  if (!teks) return '-';
  const jam = String(teks).slice(11, 16).replace(':', '.');
  return jam ? `${formatTanggal(teks)} ${jam}` : formatTanggal(teks);
}

/** Jam saja, mis. "14.30", dari teks DATETIME database. */
export function formatJam(teks) {
  // waktu kosong (mis. belum pulang)
  if (!teks) return '-';
  return String(teks).slice(11, 16).replace(':', '.');
}

/** Lama dari jumlah detik, mis. "1 jam 5 menit" atau "25 menit" (dibulatkan ke bawah per menit). */
export function formatDurasi(detik) {
  const menit = Math.max(0, Math.floor(Number(detik) / 60));
  const jam = Math.floor(menit / 60);
  // kurang dari satu jam: cukup menit
  if (jam === 0) return `${menit} menit`;
  return menit % 60 === 0 ? `${jam} jam` : `${jam} jam ${menit % 60} menit`;
}

/** Nilai angka gaya Indonesia dengan maksimal 2 desimal, mis. "85,5"; kosong menjadi "-". */
export function formatNilai(nilai) {
  // nilai belum ada (mis. belum dinilai)
  if (nilai == null || nilai === '') return '-';
  return Number(nilai).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/** Rupiah tanpa desimal, mis. "Rp15.000"; kosong menjadi "-". */
export function formatRupiah(nilai) {
  // jumlah tidak diisi (pembayaran hanya berisi keterangan)
  if (nilai == null || nilai === '') return '-';
  return `Rp${Math.round(Number(nilai)).toLocaleString('id-ID')}`;
}
