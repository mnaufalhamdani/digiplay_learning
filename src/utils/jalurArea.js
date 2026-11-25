/**
 * Menggabungkan awalan jalur area dengan jalur halaman. Di host asli awalannya kosong ('/masuk'),
 * di cadangan dev (localhost/IP) awalannya folder area ('/siswa/masuk').
 */
export function gabungJalur(basis, jalur) {
  // beranda area di cadangan dev: '/siswa', bukan '/siswa/'
  if (jalur === '/' && basis) return basis;
  return `${basis}${jalur}`;
}

/** Menambahkan query string pada jalur; nilai kosong (undefined, null, '') tidak ikut ditulis. */
export function jalurQuery(jalur, query = {}) {
  const isi = Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '');
  // tanpa filter apa pun: jalur polos tanpa tanda tanya
  if (isi.length === 0) return jalur;
  return `${jalur}?${new URLSearchParams(isi.map(([k, v]) => [k, String(v)])).toString()}`;
}
