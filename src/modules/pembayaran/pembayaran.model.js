import 'server-only';

/** Kolom pembayaran beserta nama pencatat. */
const KOLOM = `pb.id, pb.siswa_id, pb.sesi_id, pb.tanggal, pb.jumlah, pb.keterangan, pb.dicatat_oleh, pb.created_at, p.nama AS dicatat_nama`;

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
      return db.rows(`SELECT ${KOLOM} FROM pembayaran pb JOIN pengguna p ON p.id = pb.dicatat_oleh WHERE pb.siswa_id = ? ORDER BY pb.tanggal DESC, pb.created_at DESC`, [siswaId]);
    },
    /** Pembayaran yang dicatat pada satu sesi. */
    daftarSesi(sesiId) {
      return db.rows(`SELECT ${KOLOM} FROM pembayaran pb JOIN pengguna p ON p.id = pb.dicatat_oleh WHERE pb.sesi_id = ? ORDER BY pb.created_at`, [sesiId]);
    },
    /** Satu pembayaran; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} FROM pembayaran pb JOIN pengguna p ON p.id = pb.dicatat_oleh WHERE pb.id = ?`, [id], conn);
    },
    /** Total jumlah dan banyaknya catatan pembayaran bertanggal bulan berjalan (kartu beranda admin). */
    async totalBulanIni() {
      const baris = await db.first("SELECT COALESCE(SUM(jumlah), 0) AS total, COUNT(*) AS n FROM pembayaran WHERE tanggal >= DATE_FORMAT(CURDATE(), '%Y-%m-01')");
      return { total: Number(baris?.total ?? 0), jumlah: Number(baris?.n ?? 0) };
    },
    /** Menghapus satu pembayaran. */
    hapus(id, conn) {
      return db.exec('DELETE FROM pembayaran WHERE id = ?', [id], conn);
    },
  };
}
