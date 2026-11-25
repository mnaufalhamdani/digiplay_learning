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
    /** Riwayat sesi seorang siswa (semua level), terbaru lebih dulu. */
    riwayatSiswa(siswaId) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE se.siswa_id = ? ORDER BY se.jam_masuk DESC`, [siswaId]);
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
