import 'server-only';

/** Model level: tabel level, pertemuan, dan bagian_post_test (dibaca pengelola, diubah admin). */
export function buatLevelModel({ db }) {
  return {
    /** Semua level urut `urutan`. */
    daftarLevel() {
      return db.rows('SELECT id, kode, nama, urutan, deskripsi, aktif FROM level ORDER BY urutan, kode');
    },
    /** Semua pertemuan beserta jumlah template (semua dan yang aktif). */
    daftarPertemuan() {
      return db.rows(
        `SELECT p.id, p.level_id, p.nomor, p.judul, p.jenis, p.tujuan,
                COUNT(t.id) AS jumlah_template, COALESCE(SUM(t.aktif), 0) AS jumlah_aktif
         FROM pertemuan p LEFT JOIN template t ON t.pertemuan_id = p.id
         GROUP BY p.id, p.level_id, p.nomor, p.judul, p.jenis, p.tujuan
         ORDER BY p.level_id, p.nomor`,
      );
    },
    /** Semua bagian post test urut level lalu `urutan`. */
    daftarBagian() {
      return db.rows('SELECT id, level_id, kode, nama, bobot, sumber, jumlah_soal, target_wpm, urutan FROM bagian_post_test ORDER BY level_id, urutan, kode');
    },
    /** Satu level; null bila tidak ada. */
    cariLevel(id, conn) {
      return db.first('SELECT id, kode, nama, deskripsi, aktif FROM level WHERE id = ?', [id], conn);
    },
    /** Satu pertemuan beserta level-nya; null bila tidak ada. */
    cariPertemuan(id, conn) {
      return db.first('SELECT id, level_id, nomor, judul, jenis, tujuan FROM pertemuan WHERE id = ?', [id], conn);
    },
    /** Satu bagian post test; null bila tidak ada. */
    cariBagian(id, conn) {
      return db.first('SELECT id, level_id, kode, nama, bobot, sumber, jumlah_soal FROM bagian_post_test WHERE id = ?', [id], conn);
    },
    /** Mengubah nama dan deskripsi level. */
    ubahLevel(id, { nama, deskripsi }, conn) {
      return db.exec('UPDATE level SET nama = ?, deskripsi = ? WHERE id = ?', [nama, deskripsi, id], conn);
    },
    /** Mengubah judul dan tujuan pertemuan. */
    ubahPertemuan(id, { judul, tujuan }, conn) {
      return db.exec('UPDATE pertemuan SET judul = ?, tujuan = ? WHERE id = ?', [judul, tujuan, id], conn);
    },
    /** Mengubah nama, bobot, dan jumlah butir bagian post test. */
    ubahBagian(id, { nama, bobot, jumlahSoal }, conn) {
      return db.exec('UPDATE bagian_post_test SET nama = ?, bobot = ?, jumlah_soal = ? WHERE id = ?', [nama, bobot, jumlahSoal, id], conn);
    },
  };
}
