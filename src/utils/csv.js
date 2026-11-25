/** Awalan yang membuat sel dianggap rumus oleh Excel/LibreOffice (CSV injection). */
const AWALAN_RUMUS = /^[=+\-@\t\r]/;

/**
 * Satu sel CSV. Angka ditulis apa adanya; teks yang diawali =, +, -, @ (juga tab/CR) diberi awalan apostrof agar tidak
 * dijalankan sebagai rumus; sel yang memuat koma, kutip, atau baris baru dibungkus kutip ganda.
 */
export function selCsv(nilai) {
  // kosong
  if (nilai == null) return '';
  // angka bukan teks: aman dan tetap terbaca sebagai angka
  if (typeof nilai === 'number') return Number.isFinite(nilai) ? String(nilai) : '';
  let teks = String(nilai);
  if (AWALAN_RUMUS.test(teks)) teks = `'${teks}`;
  return /[",\r\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks;
}

/**
 * Isi berkas CSV UTF-8 dengan BOM (agar Excel membaca huruf Indonesia dengan benar), pemisah koma, baris CRLF.
 * `judul` = judul kolom, `baris` = array of array nilai.
 */
export function buatCsv(judul, baris) {
  const semua = [judul, ...baris].map((b) => b.map(selCsv).join(','));
  return Buffer.from(`\uFEFF${semua.join('\r\n')}\r\n`, 'utf8');
}
