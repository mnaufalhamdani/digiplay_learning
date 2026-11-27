import 'server-only';

/** Kolom pembayaran beserta nama pencatat dan keterangan sesinya (kosong bila pembayaran tanpa sesi). */
const KOLOM = `pb.id, pb.siswa_id, pb.sesi_id, pb.tanggal, pb.jumlah, pb.keterangan, pb.dicatat_oleh, pb.created_at, p.nama AS dicatat_nama,
  se.tanggal AS sesi_tanggal, pt.nomor AS pertemuan_nomor, pt.judul AS pertemuan_judul, lv.urutan AS level_urutan`;
/** Tabel yang digabung: pencatat (wajib) dan sesi, pertemuan, level lewat LEFT JOIN agar pembayaran tanpa sesi tidak hilang. */
const DARI = 'pembayaran pb JOIN pengguna p ON p.id = pb.dicatat_oleh LEFT JOIN sesi se ON se.id = pb.sesi_id LEFT JOIN pertemuan pt ON pt.id = se.pertemuan_id LEFT JOIN level lv ON lv.id = pt.level_id';

/** Model pembayaran: catatan bayar manual (tabel pembayaran). */
export function buatPembayaranModel({ db }) {
  return {
    /** Menyisipkan satu catatan; `tanggal` null = hari ini (CURDATE database). */
    tambah({ id, siswaId, sesiId, tanggal, jumlah, keterangan, dicatatOleh }, conn) {
      return db.exec(
        'INSERT INTO pembayaran (id, siswa_id, sesi_id, tanggal, jumlah, keterangan, dicatat_oleh) VALUES (?, ?, ?, COALESCE(?, CURDATE()), ?, ?, ?)',
        [id, siswaId, sesiId, tanggal, jumlah, keterangan, dicatatOleh],
        conn,
      );
    },
    /** Semua pembayaran seorang siswa, terbaru lebih dulu. */
    daftarSiswa(siswaId) {
      return db.rows(`SELECT ${KOLOM} FROM ${DARI} WHERE pb.siswa_id = ? ORDER BY pb.tanggal DESC, pb.created_at DESC`, [siswaId]);
    },
    /** Satu halaman pembayaran seorang siswa (kolom, join, dan urutan sama dengan `daftarSiswa`). */
    halamanSiswa(siswaId, { batas, offset }) {
      return db.rows(`SELECT ${KOLOM} FROM ${DARI} WHERE pb.siswa_id = ? ORDER BY pb.tanggal DESC, pb.created_at DESC LIMIT ? OFFSET ?`, [siswaId, batas, offset]);
    },
    /** Banyaknya catatan pembayaran seorang siswa (untuk menghitung jumlah halaman). */
    async hitungSiswa(siswaId) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM pembayaran WHERE siswa_id = ?', [siswaId]);
      return Number(baris?.n ?? 0);
    },
    /** Total jumlah rupiah semua catatan pembayaran seorang siswa; catatan tanpa jumlah (hanya keterangan) dihitung 0. */
    async jumlahSiswa(siswaId) {
      const baris = await db.first('SELECT COALESCE(SUM(jumlah), 0) AS total FROM pembayaran WHERE siswa_id = ?', [siswaId]);
      return Number(baris?.total ?? 0);
    },
    /** Pembayaran yang dicatat pada satu sesi. */
    daftarSesi(sesiId) {
      return db.rows(`SELECT ${KOLOM} FROM ${DARI} WHERE pb.sesi_id = ? ORDER BY pb.created_at`, [sesiId]);
    },
    /** Satu pembayaran; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} FROM ${DARI} WHERE pb.id = ?`, [id], conn);
    },
    /** Total jumlah dan banyaknya catatan pembayaran bertanggal bulan berjalan (kartu beranda admin). */
    async totalBulanIni() {
      const baris = await db.first("SELECT COALESCE(SUM(jumlah), 0) AS total, COUNT(*) AS n FROM pembayaran WHERE tanggal >= DATE_FORMAT(CURDATE(), '%Y-%m-01')");
      return { total: Number(baris?.total ?? 0), jumlah: Number(baris?.n ?? 0) };
    },
    /**
     * Total dan banyaknya catatan pembayaran per bulan untuk 6 bulan yang berakhir di `awalBulan` (YYYY-MM-01); hanya bulan yang
     * punya catatan yang muncul. `levelId` memfilter level berjalan siswa (kosong = semua).
     */
    totalPerBulan(awalBulan, levelId = null) {
      const level = levelId ? "JOIN siswa_level sl ON sl.siswa_id = pb.siswa_id AND sl.status = 'berjalan' AND sl.level_id = ?" : '';
      return db.rows(
        `SELECT DATE_FORMAT(pb.tanggal, '%Y-%m') AS bulan, COALESCE(SUM(pb.jumlah), 0) AS total, COUNT(*) AS n
         FROM pembayaran pb ${level}
         WHERE pb.tanggal >= DATE_SUB(?, INTERVAL 5 MONTH) AND pb.tanggal < DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY bulan`,
        [...(levelId ? [levelId] : []), awalBulan, awalBulan],
      );
    },
    /**
     * Siswa aktif dan berapa di antaranya yang punya minimal satu catatan pembayaran pada satu bulan (`awalBulan` = YYYY-MM-01).
     * `levelId` memfilter level berjalan siswa (kosong = semua siswa aktif).
     */
    async statusSiswaBulan(awalBulan, levelId = null) {
      const level = levelId ? "JOIN siswa_level sl ON sl.siswa_id = s.id AND sl.status = 'berjalan' AND sl.level_id = ?" : '';
      const baris = await db.first(
        `SELECT COUNT(*) AS aktif,
           COALESCE(SUM(EXISTS (SELECT 1 FROM pembayaran pb WHERE pb.siswa_id = s.id AND pb.tanggal >= ? AND pb.tanggal < DATE_ADD(?, INTERVAL 1 MONTH))), 0) AS membayar
         FROM siswa s ${level} WHERE s.status = 'aktif'`,
        // urutan mengikuti kemunculan "?" di SQL: dua tanggal di subquery SELECT lebih dulu, baru level di JOIN
        [awalBulan, awalBulan, ...(levelId ? [levelId] : [])],
      );
      return { aktif: Number(baris?.aktif ?? 0), membayar: Number(baris?.membayar ?? 0) };
    },
    /** Menghapus satu pembayaran. */
    hapus(id, conn) {
      return db.exec('DELETE FROM pembayaran WHERE id = ?', [id], conn);
    },
  };
}
