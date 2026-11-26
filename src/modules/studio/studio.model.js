import 'server-only';

/** Model Studio Zippy: proyek siswa (proyek_coding) dan salinan proyek yang dikirim ke tugas (proyek_kiriman). */
export function buatStudioModel({ db }) {
  return {
    /** Daftar proyek seorang siswa (tanpa isi), terbaru diubah lebih dulu. */
    daftar(siswaId) {
      return db.rows('SELECT id, nama, tingkat, dibuat_pada, diubah_pada FROM proyek_coding WHERE siswa_id = ? ORDER BY diubah_pada DESC, id DESC', [siswaId]);
    },
    /** Jumlah proyek seorang siswa (batas jumlah proyek). */
    async jumlah(siswaId, conn) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM proyek_coding WHERE siswa_id = ?', [siswaId], conn);
      return Number(baris?.n ?? 0);
    },
    /** Satu proyek milik siswa itu beserta isinya; null bila tidak ada atau milik siswa lain. */
    cariMilik(id, siswaId, conn) {
      return db.first('SELECT id, siswa_id, nama, tingkat, isi, diubah_pada FROM proyek_coding WHERE id = ? AND siswa_id = ?', [id, siswaId], conn);
    },
    /** Membuat proyek baru; `isi` sudah berupa teks JSON. */
    tambah({ id, siswaId, nama, tingkat, isi }, conn) {
      return db.exec('INSERT INTO proyek_coding (id, siswa_id, nama, tingkat, isi) VALUES (?, ?, ?, ?, ?)', [id, siswaId, nama, tingkat, isi], conn);
    },
    /** Memperbarui isi proyek milik siswa itu; hasilnya jumlah baris yang cocok. */
    async ubahIsi(id, siswaId, isi, conn) {
      const r = await db.exec('UPDATE proyek_coding SET isi = ?, diubah_pada = NOW() WHERE id = ? AND siswa_id = ?', [isi, id, siswaId], conn);
      return r.affectedRows;
    },
    /** Menghapus proyek milik siswa itu; hasilnya jumlah baris yang terhapus. */
    async hapus(id, siswaId, conn) {
      const r = await db.exec('DELETE FROM proyek_coding WHERE id = ? AND siswa_id = ?', [id, siswaId], conn);
      return r.affectedRows;
    },
    /** Menyimpan salinan proyek untuk satu tugas/butir; kirim ulang menimpa salinan lama (unik per tugas). */
    simpanKiriman({ id, tugasId, nama, tingkat, isi }, conn) {
      return db.exec(
        `INSERT INTO proyek_kiriman (id, tugas_id, nama, tingkat, isi) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nama = VALUES(nama), tingkat = VALUES(tingkat), isi = VALUES(isi), dikirim_pada = NOW()`,
        [id, tugasId, nama, tingkat, isi],
        conn,
      );
    },
    /** Salinan proyek sebuah tugas/butir beserta isinya (untuk tutor); null bila belum ada. */
    kiriman(tugasId) {
      return db.first('SELECT tugas_id, nama, tingkat, isi, dikirim_pada FROM proyek_kiriman WHERE tugas_id = ?', [tugasId]);
    },
    /** Menyimpan baris kostum unggahan (berkasnya sudah ditulis ke disk). */
    tambahKostum({ id, siswaId, berkasPath, ukuran }, conn) {
      return db.exec('INSERT INTO kostum_unggahan (id, siswa_id, berkas_path, ukuran) VALUES (?, ?, ?, ?)', [id, siswaId, berkasPath, ukuran], conn);
    },
    /** Jumlah kostum unggahan seorang siswa (batas per siswa). */
    async jumlahKostum(siswaId) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM kostum_unggahan WHERE siswa_id = ?', [siswaId]);
      return Number(baris?.n ?? 0);
    },
    /** Satu kostum unggahan menurut ID (pemilik dicek pemanggil); null bila tidak ada. */
    cariKostum(id, conn) {
      return db.first('SELECT id, siswa_id, berkas_path, ukuran FROM kostum_unggahan WHERE id = ?', [id], conn);
    },
    /** ID dari `daftarId` yang benar-benar milik siswa itu (untuk memeriksa rujukan kostum di proyek). */
    async kostumMilik(daftarId, siswaId) {
      // tanpa ID tidak ada yang perlu dicari (IN () kosong tidak sah)
      if (daftarId.length === 0) return [];
      const baris = await db.rows('SELECT id FROM kostum_unggahan WHERE siswa_id = ? AND id IN (?)', [siswaId, daftarId]);
      return baris.map((b) => b.id);
    },
    /** Menghapus baris kostum milik siswa itu. */
    hapusKostum(id, siswaId, conn) {
      return db.exec('DELETE FROM kostum_unggahan WHERE id = ? AND siswa_id = ?', [id, siswaId], conn);
    },
    /** Path berkas semua kostum seorang siswa; dibaca di dalam transaksi hapus siswa sebelum barisnya terhapus CASCADE. */
    async berkasKostumSiswa(siswaId, conn) {
      const baris = await db.rows('SELECT berkas_path FROM kostum_unggahan WHERE siswa_id = ?', [siswaId], conn);
      return baris.map((b) => b.berkas_path);
    },
    /** Berapa kiriman beku (proyek_kiriman) yang merujuk kostum ini; ID berupa angka sehingga pola `"<id>"` tidak ambigu. */
    async jumlahKirimanMerujuk(kostumId, conn) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM proyek_kiriman WHERE isi LIKE ?', [`%"${kostumId}"%`], conn);
      return Number(baris?.n ?? 0);
    },
    /** Proyek milik siswa itu yang merujuk kostum ini (beserta isinya), untuk dibersihkan saat kostum dihapus. */
    proyekMerujuk(kostumId, siswaId, conn) {
      return db.rows('SELECT id, isi FROM proyek_coding WHERE siswa_id = ? AND isi LIKE ?', [siswaId, `%"${kostumId}"%`], conn);
    },
    /** Ringkasan salinan (tanpa isi) milik siswa itu; kepemilikan dicek lewat sesi tugas atau post test. Null bila tidak ada. */
    kirimanMilik(tugasId, siswaId) {
      return db.first(
        `SELECT pk.nama, pk.dikirim_pada FROM proyek_kiriman pk
         JOIN tugas_siswa ts ON ts.id = pk.tugas_id
         JOIN sesi s ON s.id = ts.sesi_id
         WHERE pk.tugas_id = ? AND s.siswa_id = ?`,
        [tugasId, siswaId],
      );
    },
  };
}
