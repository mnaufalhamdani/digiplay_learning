import 'server-only';

/** Kolom pengguna yang aman ditampilkan (tanpa password_hash). */
const KOLOM_AMAN = 'id, nama, email, peran, aktif, terakhir_login_at, created_at';

/** Model pengguna: akses tabel `pengguna` (akun admin dan tutor). */
export function buatPenggunaModel({ db }) {
  return {
    /** Semua akun, yang aktif lebih dulu lalu urut nama. */
    daftar() {
      return db.rows(`SELECT ${KOLOM_AMAN} FROM pengguna ORDER BY aktif DESC, nama`);
    },
    /** Satu halaman akun dengan urutan sama seperti daftar (id sebagai pembeda agar urutan stabil antar halaman). */
    halaman({ batas, offset }) {
      return db.rows(`SELECT ${KOLOM_AMAN} FROM pengguna ORDER BY aktif DESC, nama, id LIMIT ? OFFSET ?`, [batas, offset]);
    },
    /** Jumlah seluruh akun. */
    async hitung() {
      const baris = await db.first('SELECT COUNT(*) AS n FROM pengguna');
      return Number(baris.n);
    },
    /** Satu akun berdasarkan ID; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM_AMAN} FROM pengguna WHERE id = ?`, [id], conn);
    },
    /** Akun aktif berdasarkan ID (pembacaan sesi); null bila tidak ada atau nonaktif. */
    cariAktif(id) {
      return db.first('SELECT id, nama, email, peran FROM pengguna WHERE id = ? AND aktif = 1', [id]);
    },
    /** Data login berdasarkan email, termasuk hash password; null bila tidak ada. */
    cariUntukLogin(email) {
      return db.first('SELECT id, nama, peran, aktif, password_hash FROM pengguna WHERE email = ?', [email]);
    },
    /** Hash password sebuah akun. */
    async ambilHash(id) {
      const baris = await db.first('SELECT password_hash FROM pengguna WHERE id = ?', [id]);
      return baris?.password_hash ?? null;
    },
    /** Membuat akun baru. */
    tambah({ id, nama, email, passwordHash, peran }) {
      return db.exec('INSERT INTO pengguna (id, nama, email, password_hash, peran) VALUES (?, ?, ?, ?, ?)', [id, nama, email, passwordHash, peran]);
    },
    /** Mengubah nama dan peran. */
    ubah(id, { nama, peran }, conn) {
      return db.exec('UPDATE pengguna SET nama = ?, peran = ? WHERE id = ?', [nama, peran, id], conn);
    },
    /** Mengubah nama dan email (profil sendiri). */
    ubahProfil(id, { nama, email }, conn) {
      return db.exec('UPDATE pengguna SET nama = ?, email = ? WHERE id = ?', [nama, email, id], conn);
    },
    /** Mengaktifkan atau menonaktifkan akun. */
    ubahAktif(id, aktif, conn) {
      return db.exec('UPDATE pengguna SET aktif = ? WHERE id = ?', [aktif ? 1 : 0, id], conn);
    },
    /** Mengganti hash password. */
    ubahPassword(id, passwordHash) {
      return db.exec('UPDATE pengguna SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    },
    /** Mencatat waktu login terakhir. */
    catatLogin(id) {
      return db.exec('UPDATE pengguna SET terakhir_login_at = NOW() WHERE id = ?', [id]);
    },
    /** ID semua admin aktif, dikunci (FOR UPDATE) agar dua perubahan bersamaan tidak menghabiskan admin. */
    adminAktifDikunci(conn) {
      return db.rows("SELECT id FROM pengguna WHERE peran = 'admin' AND aktif = 1 FOR UPDATE", [], conn);
    },
  };
}
