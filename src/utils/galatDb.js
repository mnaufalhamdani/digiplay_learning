/**
 * Mengecek apakah error database adalah pelanggaran UNIQUE (ER_DUP_ENTRY).
 * `namaKunci` opsional: bila diisi, hanya cocok untuk indeks unik dengan nama itu
 * (pesan MySQL/MariaDB memuat nama indeks, misal "for key 'uq_pengguna_email'").
 */
export function adalahDuplikat(error, namaKunci = null) {
  // bukan error duplikat sama sekali
  if (error?.code !== 'ER_DUP_ENTRY') return false;
  return namaKunci ? String(error.message ?? '').includes(namaKunci) : true;
}
