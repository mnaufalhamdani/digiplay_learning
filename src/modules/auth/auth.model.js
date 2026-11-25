import 'server-only';

/** Model auth: percobaan login, kode akses, dan login perangkat siswa. Waktu selalu dihitung dengan NOW() database. */
export function buatAuthModel({ db }) {
  return {
    /** Jumlah percobaan GAGAL dari satu IP pada area tertentu dalam N menit terakhir. */
    async hitungGagal(daftarArea, ip, menit) {
      const baris = await db.first(
        'SELECT COUNT(*) AS n FROM percobaan_login WHERE ip = ? AND area IN (?) AND berhasil = 0 AND created_at > NOW() - INTERVAL ? MINUTE',
        [ip, daftarArea, menit],
      );
      return Number(baris?.n ?? 0);
    },
    /** Mencatat satu percobaan login (kode yang dicoba tidak disimpan). */
    catatPercobaan({ id, area, ip, berhasil }) {
      return db.exec('INSERT INTO percobaan_login (id, area, ip, berhasil) VALUES (?, ?, ?, ?)', [id, area, ip, berhasil ? 1 : 0]);
    },
    /** Menghapus catatan percobaan yang lebih tua dari N jam. */
    bersihkanPercobaan(jam) {
      return db.exec('DELETE FROM percobaan_login WHERE created_at < NOW() - INTERVAL ? HOUR', [jam]);
    },
    /** Kode akses aktif beserta siswanya; null bila kode tidak dikenal. */
    cariKodeAktif(kode) {
      return db.first(
        `SELECT ka.id AS kode_id, ka.jenis, s.id AS siswa_id, s.nama, s.status
         FROM kode_akses ka JOIN siswa s ON s.id = ka.siswa_id
         WHERE ka.kode = ? AND ka.aktif = 1`,
        [kode],
      );
    },
    /** Siswa milik kode orang tua yang masih aktif (pembacaan sesi orang tua); null bila kode sudah diganti. */
    cariKodeOrtuAktif(kodeId, siswaId) {
      return db.first(
        `SELECT s.id AS siswa_id, s.nama, s.status
         FROM kode_akses ka JOIN siswa s ON s.id = ka.siswa_id
         WHERE ka.id = ? AND ka.siswa_id = ? AND ka.jenis = 'ortu' AND ka.aktif = 1`,
        [kodeId, siswaId],
      );
    },
    /** Login perangkat yang masih aktif untuk seorang siswa beserta lama diamnya (detik); null bila tidak ada. */
    loginAktifSiswa(siswaId) {
      return db.first(
        'SELECT id, TIMESTAMPDIFF(SECOND, terakhir_aktif_at, NOW()) AS diam_detik FROM login_perangkat WHERE siswa_id = ? AND berakhir_at IS NULL',
        [siswaId],
      );
    },
    /** Login aktif berdasarkan hash token cookie, beserta data siswa dan lama diamnya. */
    cariLoginToken(tokenHash) {
      return db.first(
        `SELECT lp.id, lp.siswa_id, TIMESTAMPDIFF(SECOND, lp.terakhir_aktif_at, NOW()) AS diam_detik, s.nama, s.status
         FROM login_perangkat lp JOIN siswa s ON s.id = lp.siswa_id
         WHERE lp.token_hash = ? AND lp.berakhir_at IS NULL`,
        [tokenHash],
      );
    },
    /** Membuat login perangkat baru (kolom aktif_kunci diisi otomatis oleh database). */
    tambahLogin({ id, siswaId, tokenHash, perangkat, ip }) {
      return db.exec('INSERT INTO login_perangkat (id, siswa_id, token_hash, perangkat, ip) VALUES (?, ?, ?, ?, ?)', [id, siswaId, tokenHash, perangkat, ip]);
    },
    /** Memperbarui waktu aktif terakhir sebuah login. */
    sentuhLogin(id) {
      return db.exec('UPDATE login_perangkat SET terakhir_aktif_at = NOW() WHERE id = ? AND berakhir_at IS NULL', [id]);
    },
    /** Mengakhiri satu login perangkat. */
    akhiriLogin(id, alasan) {
      return db.exec('UPDATE login_perangkat SET berakhir_at = NOW(), alasan_berakhir = ? WHERE id = ? AND berakhir_at IS NULL', [alasan, id]);
    },
    /** Mengakhiri login aktif seorang siswa (bila ada). `conn` opsional agar ikut transaksi pemanggil. */
    akhiriLoginSiswa(siswaId, alasan, conn) {
      return db.exec('UPDATE login_perangkat SET berakhir_at = NOW(), alasan_berakhir = ? WHERE siswa_id = ? AND berakhir_at IS NULL', [alasan, siswaId], conn);
    },
  };
}
