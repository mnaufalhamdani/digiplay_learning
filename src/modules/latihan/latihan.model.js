import 'server-only';

/** Model latihan: hasil game latihan mouse dan puzzle (tabel hasil_latihan). */
export function buatLatihanModel({ db }) {
  return {
    /** Menyimpan satu hasil latihan. */
    tambah(d, conn) {
      return db.exec(
        'INSERT INTO hasil_latihan (id, siswa_id, sesi_id, jenis, gambar_id, keping, skor, selesai, durasi_detik, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.siswaId, d.sesiId, d.jenis, d.gambarId, d.keping, d.skor, d.selesai ? 1 : 0, d.durasiDetik, d.detail],
        conn,
      );
    },
    /** Ringkasan per jenis untuk pengelola: jumlah main, skor terbaik, dan jumlah selesai. */
    statistik(siswaId) {
      return db.rows('SELECT jenis, COUNT(*) AS jumlah, MAX(skor) AS skor_terbaik, SUM(selesai) AS jumlah_selesai FROM hasil_latihan WHERE siswa_id = ? GROUP BY jenis', [siswaId]);
    },
  };
}
