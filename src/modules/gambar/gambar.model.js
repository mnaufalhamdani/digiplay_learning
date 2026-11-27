import 'server-only';

/** Kolom gambar yang ditampilkan. */
const KOLOM = 'id, kode, kategori, nama, nama_en, punya_mewarnai, punya_berwarna, punya_puzzle, aktif';
/** Syarat SQL "lengkap": ketiga berkas yang dipakai tugas tersedia. */
const SYARAT_LENGKAP = 'punya_mewarnai = 1 AND punya_berwarna = 1 AND punya_puzzle = 1';

/** Klausa WHERE dan parameternya dari filter kategori dan kelengkapan ('lengkap' / 'belum_lengkap'). */
function syaratDaftar({ kategori, kelengkapan }) {
  const syarat = [];
  const params = [];
  if (kategori) {
    syarat.push('kategori = ?');
    params.push(kategori);
  }
  // kelengkapan dihitung dari tiga penanda berkas
  if (kelengkapan === 'lengkap') syarat.push(`(${SYARAT_LENGKAP})`);
  if (kelengkapan === 'belum_lengkap') syarat.push(`NOT (${SYARAT_LENGKAP})`);
  return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', params };
}
/** Model gambar: bank subjek gambar (tabel gambar). */
export function buatGambarModel({ db }) {
  return {
    /** Daftar seluruh subjek sesuai filter tanpa LIMIT (dipakai modul lain, mis. studio). */
    daftar(filter) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(`SELECT ${KOLOM} FROM gambar ${where} ORDER BY kategori, kode`, params);
    },
    /** Satu halaman subjek sesuai filter, urutan tetap kategori lalu kode (halaman Bank gambar). */
    halaman(filter, { batas, offset }) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(`SELECT ${KOLOM} FROM gambar ${where} ORDER BY kategori, kode LIMIT ? OFFSET ?`, [...params, batas, offset]);
    },
    /** Jumlah subjek sesuai filter yang sama dengan `halaman`. */
    async hitung(filter) {
      const { where, params } = syaratDaftar(filter);
      const baris = await db.first(`SELECT COUNT(*) AS n FROM gambar ${where}`, params);
      return Number(baris?.n ?? 0);
    },
    /** Semua subjek (untuk pindai ulang berkas). */
    semua(conn) {
      return db.rows(`SELECT ${KOLOM} FROM gambar ORDER BY kode`, [], conn);
    },
    /** Satu subjek; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} FROM gambar WHERE id = ?`, [id], conn);
    },
    /** Subjek aktif yang punya minimal satu berkas tugas (bahan bank gambar per jenis). */
    tersedia() {
      return db.rows('SELECT kode, nama, punya_mewarnai, punya_berwarna, punya_puzzle FROM gambar WHERE aktif = 1 AND (punya_mewarnai = 1 OR punya_berwarna = 1 OR punya_puzzle = 1) ORDER BY kode');
    },
    /** Subjek aktif yang punya puzzle.png, opsional per kategori (puzzle mode bebas). */
    puzzleAktif(kategori) {
      return db.rows(`SELECT ${KOLOM} FROM gambar WHERE aktif = 1 AND punya_puzzle = 1${kategori ? ' AND kategori = ?' : ''} ORDER BY kode`, kategori ? [kategori] : []);
    },
    /** Satu subjek berdasarkan kode; null bila tidak ada. */
    cariKode(kode, conn) {
      return db.first(`SELECT ${KOLOM} FROM gambar WHERE kode = ?`, [kode], conn);
    },
    /** Mengaktifkan atau menonaktifkan subjek. */
    ubahAktif(id, aktif, conn) {
      return db.exec('UPDATE gambar SET aktif = ? WHERE id = ?', [aktif ? 1 : 0, id], conn);
    },
    /** Memperbarui penanda punya_* hasil pindai berkas. */
    ubahPenanda(id, { punya_mewarnai, punya_berwarna, punya_puzzle }, conn) {
      return db.exec('UPDATE gambar SET punya_mewarnai = ?, punya_berwarna = ?, punya_puzzle = ? WHERE id = ?', [punya_mewarnai, punya_berwarna, punya_puzzle, id], conn);
    },
  };
}
