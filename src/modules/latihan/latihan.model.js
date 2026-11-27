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
    /**
     * Jenis tugas yang pernah muncul untuk siswa (lintas level, semua status tugas), terbatas pada template.tipe yang memetakan
     * ke menu game, ditambah 'mengetik' bila siswa pernah punya post test (bagian tes mengetik tidak berupa baris tugas),
     * dan 'level:N' dengan N = urutan level tertinggi yang pernah diikuti siswa (null bila belum punya level).
     * Satu query ringan; hasil: larik teks tipe tanpa duplikat (elemen 'level:N' diurai usecase). Kolom tipe di-CAST ke teks
     * karena UNION memakai tipe kolom ENUM dari SELECT pertama, yang akan mengosongkan nilai 'level:N'.
     */
    async tipeGameSiswa(siswaId, daftarTipe) {
      const penanda = daftarTipe.map(() => '?').join(', ');
      const baris = await db.rows(
        `SELECT DISTINCT CAST(t.tipe AS CHAR) AS tipe FROM tugas_siswa ts JOIN sesi se ON se.id = ts.sesi_id JOIN template t ON t.id = ts.template_id WHERE se.siswa_id = ? AND t.tipe IN (${penanda})
         UNION
         SELECT 'mengetik' AS tipe FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id JOIN bagian_post_test b ON b.level_id = sl.level_id AND b.sumber = 'tes_mengetik' WHERE sl.siswa_id = ?
         UNION
         SELECT CONCAT('level:', MAX(l.urutan)) AS tipe FROM siswa_level sl JOIN level l ON l.id = sl.level_id WHERE sl.siswa_id = ?`,
        [siswaId, ...daftarTipe, siswaId, siswaId],
      );
      return baris.map((b) => b.tipe);
    },
    /** Ringkasan per jenis untuk pengelola: jumlah main, skor terbaik, dan jumlah selesai. */
    statistik(siswaId) {
      return db.rows('SELECT jenis, COUNT(*) AS jumlah, MAX(skor) AS skor_terbaik, SUM(selesai) AS jumlah_selesai FROM hasil_latihan WHERE siswa_id = ? GROUP BY jenis', [siswaId]);
    },
  };
}
