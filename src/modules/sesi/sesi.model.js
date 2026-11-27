import 'server-only';

/** Jumlah tugas latihan per sesi (tanpa tugas diganti): total dan selesai. */
const SUBQUERY_TUGAS = `
  (SELECT COUNT(*) FROM tugas_siswa ts WHERE ts.sesi_id = se.id AND ts.post_test_id IS NULL AND ts.status <> 'diganti') AS tugas_total,
  (SELECT COUNT(*) FROM tugas_siswa ts WHERE ts.sesi_id = se.id AND ts.post_test_id IS NULL AND ts.status = 'selesai') AS tugas_selesai`;
/** Kolom sesi beserta siswa, level, pertemuan, lama berjalan (detik, waktu database), dan ringkasan tugas. */
const KOLOM = `se.id, se.siswa_id, se.siswa_level_id, se.pertemuan_id, se.tanggal, se.jam_masuk, se.jam_pulang, se.status,
  se.penuntasan_otomatis, se.penuntasan_tutor, se.penuntasan_diubah_oleh,
  TIMESTAMPDIFF(SECOND, se.jam_masuk, COALESCE(se.jam_pulang, NOW())) AS lama_detik,
  s.nama AS siswa_nama, p.nomor AS pertemuan_nomor, p.judul AS pertemuan_judul, l.id AS level_id, l.kode AS level_kode, l.nama AS level_nama,
  EXISTS (SELECT 1 FROM login_perangkat lp WHERE lp.siswa_id = se.siswa_id AND lp.berakhir_at IS NULL) AS login_aktif,
  ${SUBQUERY_TUGAS}`;
/** Sesi digabung dengan siswa, pertemuan, dan level. */
const DARI = `FROM sesi se
  JOIN siswa s ON s.id = se.siswa_id
  JOIN pertemuan p ON p.id = se.pertemuan_id
  JOIN level l ON l.id = p.level_id`;

/** Model sesi: tabel sesi dan sesi_tutor, serta hitungan kehadiran. */
export function buatSesiModel({ db }) {
  return {
    /** Satu sesi lengkap; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE se.id = ?`, [id], conn);
    },
    /** Mengunci baris sesi (FOR UPDATE) agar penutupan dan perubahan bersamaan berjalan bergiliran. */
    kunci(id, conn) {
      return db.first('SELECT id, siswa_id, status FROM sesi WHERE id = ? FOR UPDATE', [id], conn);
    },
    /** Sesi berlangsung seorang siswa (maksimal satu, dijaga UNIQUE aktif_kunci); null bila tidak ada. */
    berlangsungSiswa(siswaId, conn) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE se.siswa_id = ? AND se.status = 'berlangsung'`, [siswaId], conn);
    },
    /** ID sesi berlangsung seorang siswa (ringan, untuk ping); null bila tidak ada. */
    async idBerlangsung(siswaId) {
      const baris = await db.first("SELECT id FROM sesi WHERE siswa_id = ? AND status = 'berlangsung'", [siswaId]);
      return baris?.id ?? null;
    },
    /** Semua sesi berlangsung, terlama lebih dulu. */
    daftarBerlangsung() {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE se.status = 'berlangsung' ORDER BY se.jam_masuk`);
    },
    /** Jumlah sesi berlangsung (lencana menu Absensi). */
    async jumlahBerlangsung() {
      const baris = await db.first("SELECT COUNT(*) AS n FROM sesi WHERE status = 'berlangsung'");
      return Number(baris?.n ?? 0);
    },
    /** Tanggal hari ini menurut database dan tanggal sesi tertua (null bila belum ada sesi); dasar batas filter bulan dashboard. */
    async batasWaktu() {
      const baris = await db.first('SELECT CURDATE() AS hari, (SELECT MIN(tanggal) FROM sesi) AS tertua');
      return { hari: baris.hari, tertua: baris.tertua ?? null };
    },
    /** Sesi berlangsung hari ini untuk kartu dashboard: jumlah siswa, jumlah tutor berbeda, dan tiga siswa terlama beserta pertemuannya. */
    async ringkasBerlangsungHariIni() {
      const [hitung, contoh] = await Promise.all([
        // DISTINCT se.id karena join sesi_tutor menggandakan baris per tutor
        db.first(
          `SELECT COUNT(DISTINCT se.id) AS siswa, COUNT(DISTINCT st.pengguna_id) AS tutor
           FROM sesi se LEFT JOIN sesi_tutor st ON st.sesi_id = se.id WHERE se.status = 'berlangsung' AND se.tanggal = CURDATE()`,
        ),
        db.rows(
          `SELECT se.id, s.nama AS siswa_nama, p.nomor AS pertemuan_nomor, l.kode AS level_kode ${DARI}
           WHERE se.status = 'berlangsung' AND se.tanggal = CURDATE() ORDER BY se.jam_masuk, se.id LIMIT 3`,
        ),
      ]);
      return { siswa: Number(hitung?.siswa ?? 0), tutor: Number(hitung?.tutor ?? 0), contoh };
    },
    /** Jumlah baris sesi 7 hari terakhir (hari ini dan 6 hari sebelumnya) dan 7 hari sebelum itu, dalam satu query. */
    async perbandingan7Hari() {
      const baris = await db.first(
        `SELECT COALESCE(SUM(tanggal > CURDATE() - INTERVAL 7 DAY), 0) AS ini, COALESCE(SUM(tanggal <= CURDATE() - INTERVAL 7 DAY), 0) AS sebelumnya
         FROM sesi WHERE tanggal > CURDATE() - INTERVAL 14 DAY AND tanggal <= CURDATE()`,
      );
      return { ini: Number(baris?.ini ?? 0), sebelumnya: Number(baris?.sebelumnya ?? 0) };
    },
    /** Jumlah baris sesi per tanggal pada satu bulan (`awalBulan` = YYYY-MM-01); `levelId` memfilter level pertemuan (kosong = semua). */
    sesiPerHari(awalBulan, levelId = null) {
      // join pertemuan hanya bila level difilter agar query tanpa filter tetap memakai indeks tanggal saja
      const level = levelId ? 'JOIN pertemuan p ON p.id = se.pertemuan_id AND p.level_id = ?' : '';
      return db.rows(
        `SELECT se.tanggal, COUNT(*) AS n FROM sesi se ${level}
         WHERE se.tanggal >= ? AND se.tanggal < DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY se.tanggal`,
        [...(levelId ? [levelId] : []), awalBulan, awalBulan],
      );
    },
    /**
     * Jumlah sesi per minggu (1 = tanggal 1-7 ... 5 = 29-akhir bulan) dan hasil penuntasan (pilihan tutor, bila tidak ada
     * hasil otomatis) pada satu bulan; sesi tanpa penuntasan (masih berlangsung atau tanpa tugas) tidak dihitung.
     */
    penuntasanPerMinggu(awalBulan, levelId = null) {
      const level = levelId ? 'JOIN pertemuan p ON p.id = se.pertemuan_id AND p.level_id = ?' : '';
      return db.rows(
        `SELECT (DAYOFMONTH(se.tanggal) - 1) DIV 7 + 1 AS minggu, COALESCE(se.penuntasan_tutor, se.penuntasan_otomatis) AS hasil, COUNT(*) AS n
         FROM sesi se ${level}
         WHERE se.tanggal >= ? AND se.tanggal < DATE_ADD(?, INTERVAL 1 MONTH) AND COALESCE(se.penuntasan_tutor, se.penuntasan_otomatis) IS NOT NULL
         GROUP BY minggu, hasil`,
        [...(levelId ? [levelId] : []), awalBulan, awalBulan],
      );
    },
    /** Jumlah sesi yang masih berlangsung padahal tanggalnya sebelum hari ini (lupa ditutup). */
    async jumlahBerlangsungLama() {
      const baris = await db.first("SELECT COUNT(*) AS n FROM sesi WHERE status = 'berlangsung' AND tanggal < CURDATE()");
      return Number(baris?.n ?? 0);
    },
    /** Riwayat sesi seorang siswa (semua level), terbaru lebih dulu. */
    riwayatSiswa(siswaId) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE se.siswa_id = ? ORDER BY se.jam_masuk DESC`, [siswaId]);
    },
    /** Satu halaman riwayat sesi seorang siswa (kolom, join, dan urutan sama dengan riwayatSiswa; id sebagai pemisah agar halaman stabil). */
    riwayatSiswaHalaman(siswaId, { batas, offset }) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE se.siswa_id = ? ORDER BY se.jam_masuk DESC, se.id DESC LIMIT ? OFFSET ?`, [siswaId, batas, offset]);
    },
    /** Jumlah seluruh sesi seorang siswa (semua level) untuk paginasi riwayat. */
    async hitungRiwayatSiswa(siswaId) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM sesi WHERE siswa_id = ?', [siswaId]);
      return Number(baris?.n ?? 0);
    },
    /** Pertemuan satu level beserta jumlah sesi siswa pada keikutsertaan level itu. */
    pertemuanLevel(levelId, siswaLevelId, conn) {
      return db.rows(
        `SELECT p.id, p.nomor, p.judul, p.jenis,
           (SELECT COUNT(*) FROM sesi se WHERE se.siswa_level_id = ? AND se.pertemuan_id = p.id) AS jumlah_sesi
         FROM pertemuan p WHERE p.level_id = ? ORDER BY p.nomor`,
        [siswaLevelId, levelId],
        conn,
      );
    },
    /** Jumlah pertemuan bernomor 1..maksNomor yang punya sesi pada sebuah keikutsertaan level (kehadiran). */
    async hitungHadir(siswaLevelId, maksNomor, conn) {
      const baris = await db.first(
        'SELECT COUNT(DISTINCT p.nomor) AS n FROM sesi se JOIN pertemuan p ON p.id = se.pertemuan_id WHERE se.siswa_level_id = ? AND p.nomor <= ?',
        [siswaLevelId, maksNomor],
        conn,
      );
      return Number(baris?.n ?? 0);
    },
    /** Membuat sesi berlangsung (tanggal hari ini, jam masuk sekarang; aktif_kunci diisi database). */
    tambah({ id, siswaId, siswaLevelId, pertemuanId }, conn) {
      return db.exec(
        "INSERT INTO sesi (id, siswa_id, siswa_level_id, pertemuan_id, tanggal, jam_masuk, status) VALUES (?, ?, ?, ?, CURDATE(), NOW(), 'berlangsung')",
        [id, siswaId, siswaLevelId, pertemuanId],
        conn,
      );
    },
    /** Mencatat tutor pada sesi; tutor yang sudah tercatat diabaikan (UNIQUE sesi_id + pengguna_id). */
    tambahTutor({ id, sesiId, penggunaId }, conn) {
      return db.exec('INSERT IGNORE INTO sesi_tutor (id, sesi_id, pengguna_id) VALUES (?, ?, ?)', [id, sesiId, penggunaId], conn);
    },
    /** Tutor beserta catatannya untuk beberapa sesi sekaligus. */
    tutorSesi(sesiIds) {
      // tanpa sesi: hindari "IN ()" yang tidak sah
      if (sesiIds.length === 0) return [];
      return db.rows(
        `SELECT st.sesi_id, st.pengguna_id, st.catatan, st.updated_at, p.nama
         FROM sesi_tutor st JOIN pengguna p ON p.id = st.pengguna_id WHERE st.sesi_id IN (?) ORDER BY st.created_at`,
        [sesiIds],
      );
    },
    /** Menyimpan catatan seorang tutor; affectedRows 0 berarti tutor belum tercatat di sesi. */
    simpanCatatan(sesiId, penggunaId, catatan, conn) {
      return db.exec('UPDATE sesi_tutor SET catatan = ? WHERE sesi_id = ? AND pengguna_id = ?', [catatan, sesiId, penggunaId], conn);
    },
    /** Menutup sesi berlangsung: jam pulang sekarang dan penuntasan otomatis disimpan. */
    tutup(id, penuntasanOtomatis, conn) {
      return db.exec("UPDATE sesi SET status = 'selesai', jam_pulang = NOW(), penuntasan_otomatis = ? WHERE id = ? AND status = 'berlangsung'", [penuntasanOtomatis, id], conn);
    },
    /** Memperbarui penuntasan otomatis (sesi selesai yang tugasnya diubah tutor). */
    ubahPenuntasanOtomatis(id, nilai, conn) {
      return db.exec('UPDATE sesi SET penuntasan_otomatis = ? WHERE id = ?', [nilai, id], conn);
    },
    /** Mengisi atau mengosongkan (null) pilihan penuntasan tutor. */
    ubahPenuntasanTutor(id, nilai, penggunaId, conn) {
      return db.exec('UPDATE sesi SET penuntasan_tutor = ?, penuntasan_diubah_oleh = ? WHERE id = ?', [nilai, nilai ? penggunaId : null, id], conn);
    },
    /** Mengizinkan siswa ikut post test walau kehadiran kurang. */
    izinkanPengecualian(siswaLevelId, conn) {
      return db.exec('UPDATE siswa_level SET pengecualian_kehadiran = 1 WHERE id = ?', [siswaLevelId], conn);
    },
    /** Status pengecualian kehadiran sebuah keikutsertaan level. */
    async pengecualian(siswaLevelId, conn) {
      const baris = await db.first('SELECT pengecualian_kehadiran FROM siswa_level WHERE id = ?', [siswaLevelId], conn);
      return Boolean(baris?.pengecualian_kehadiran);
    },
  };
}
