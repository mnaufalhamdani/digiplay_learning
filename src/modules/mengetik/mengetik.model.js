import 'server-only';

/** Model mengetik: pelajaran_mengetik, bank_teks_mengetik, dan hasil_mengetik. */
export function buatMengetikModel({ db }) {
  return {
    /** Semua pelajaran urut `urutan`. */
    daftarPelajaran() {
      return db.rows('SELECT id, kode, nama, urutan, tombol_fokus, teks_latihan, target_wpm, target_akurasi FROM pelajaran_mengetik ORDER BY urutan, kode');
    },
    /** Hasil mode pelajaran seorang siswa (bahan kunci-buka, hasil terbaik, dan bintang). */
    hasilPelajaran(siswaId) {
      return db.rows("SELECT pelajaran_id, wpm, akurasi FROM hasil_mengetik WHERE siswa_id = ? AND mode = 'pelajaran' AND pelajaran_id IS NOT NULL", [siswaId]);
    },
    /** N hasil terakhir seorang siswa (semua mode), terbaru lebih dulu. */
    hasilTerakhir(siswaId, n) {
      return db.rows('SELECT id, mode, wpm, akurasi, konsistensi, durasi_detik, detail_tombol, created_at FROM hasil_mengetik WHERE siswa_id = ? ORDER BY created_at DESC, id DESC LIMIT ?', [siswaId, n]);
    },
    /** Teks bank aktif untuk satu level (termasuk teks umum tanpa level), urut ID agar pilihan deterministik stabil. */
    async teksBank(levelId, conn) {
      const baris = await db.rows('SELECT id, teks FROM bank_teks_mengetik WHERE aktif = 1 AND (level_id = ? OR level_id IS NULL) ORDER BY id', [levelId], conn);
      return baris.map((b) => b.teks);
    },
    /** ID level yang sedang berjalan untuk seorang siswa; null bila tidak punya level berjalan. */
    async levelBerjalan(siswaId, conn) {
      const baris = await db.first("SELECT level_id FROM siswa_level WHERE siswa_id = ? AND status = 'berjalan' LIMIT 1", [siswaId], conn);
      // siswa belum punya level berjalan: bank teks hanya memakai teks tanpa level
      return baris?.level_id ?? null;
    },
    /** Menyimpan satu hasil mengetik. */
    tambahHasil(d, conn) {
      return db.exec(
        'INSERT INTO hasil_mengetik (id, siswa_id, sesi_id, pelajaran_id, mode, wpm, akurasi, konsistensi, durasi_detik, detail_tombol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.siswaId, d.sesiId, d.pelajaranId, d.mode, d.wpm, d.akurasi, d.konsistensi, d.durasiDetik, d.detailTombol],
        conn,
      );
    },
    /** Ringkasan untuk pengelola: WPM terbaik, rata-rata akurasi, jumlah hasil. */
    statistik(siswaId) {
      return db.first('SELECT MAX(wpm) AS wpm_terbaik, AVG(akurasi) AS akurasi_rata, COUNT(*) AS jumlah FROM hasil_mengetik WHERE siswa_id = ?', [siswaId]);
    },
  };
}
