import 'server-only';

/** Kolom post test beserta siswa, level, sisa waktu (detik), dan sesi. */
const KOLOM = `pt.id, pt.siswa_level_id, pt.sesi_id, pt.percobaan_ke, pt.status, pt.durasi_detik, pt.terpakai_detik, pt.mulai_at,
  pt.terakhir_aktif_at, pt.selesai_at, pt.nilai_total, pt.lulus, pt.dibuka_oleh, pt.bagian_ulang, pt.created_at,
  sl.siswa_id, sl.level_id, s.nama AS siswa_nama, l.kode AS level_kode, l.nama AS level_nama`;
/** Post test digabung dengan siswa_level, siswa, dan level. */
const DARI = `FROM post_test pt
  JOIN siswa_level sl ON sl.id = pt.siswa_level_id
  JOIN siswa s ON s.id = sl.siswa_id
  JOIN level l ON l.id = sl.level_id`;
/** Syarat tab daftar pengelola. */
const SYARAT_TAB = {
  menunggu: "pt.status = 'selesai' AND pt.nilai_total IS NULL",
  berlangsung: "pt.status = 'berlangsung'",
  selesai: 'pt.nilai_total IS NOT NULL',
};
/** Kolom butir post test (tugas_siswa) beserta template dan bagiannya. */
const KOLOM_BUTIR = `ts.id, ts.post_test_id, ts.sesi_id, ts.template_id, ts.soal_teks, ts.parameter_hasil, ts.jawaban, ts.benar, ts.dinilai_oleh, ts.created_at,
  t.kode AS template_kode, t.tipe, t.penilaian, t.bagian_id`;

/** Model post test: post_test, post_test_nilai, dan butir post test di tugas_siswa. */
export function buatPosttestModel({ db }) {
  return {
    /** Satu post test; `kunci` true menguncinya (FOR UPDATE). */
    cariId(id, conn, kunci = false) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE pt.id = ?${kunci ? ' FOR UPDATE' : ''}`, [id], conn);
    },
    /** Percobaan terakhir pada satu keikutsertaan level; null bila belum pernah. */
    terakhir(siswaLevelId, conn, kunci = false) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE pt.siswa_level_id = ? ORDER BY pt.percobaan_ke DESC LIMIT 1${kunci ? ' FOR UPDATE' : ''}`, [siswaLevelId], conn);
    },
    /** Jumlah post test pada satu tab pengelola (kartu beranda). */
    async jumlahTab(tab) {
      const baris = await db.first(`SELECT COUNT(*) AS n FROM post_test pt WHERE ${SYARAT_TAB[tab]}`);
      return Number(baris?.n ?? 0);
    },
    /** Post test menunggu penilaian (sama dengan tab `menunggu`): jumlahnya dan usia tertua dalam hari sejak dikumpulkan (null bila tidak ada). */
    async ringkasMenunggu() {
      const baris = await db.first(`SELECT COUNT(*) AS n, DATEDIFF(CURDATE(), MIN(pt.selesai_at)) AS usia FROM post_test pt WHERE ${SYARAT_TAB.menunggu}`);
      return { jumlah: Number(baris?.n ?? 0), usiaTertuaHari: baris?.usia == null ? null : Number(baris.usia) };
    },
    /**
     * Post test yang dikumpulkan pada satu bulan (`awalBulan` = YYYY-MM-01, dasar `selesai_at`), dibagi: sudah difinalisasi
     * (lulus / belum lulus) dan menunggu penilaian. `levelId` memfilter level post test (kosong = semua).
     */
    async statusBulan(awalBulan, levelId = null) {
      const level = levelId ? 'JOIN siswa_level sl ON sl.id = pt.siswa_level_id AND sl.level_id = ?' : '';
      const baris = await db.first(
        `SELECT COALESCE(SUM(pt.nilai_total IS NOT NULL), 0) AS selesai, COALESCE(SUM(pt.lulus = 1), 0) AS lulus,
           COALESCE(SUM(pt.nilai_total IS NOT NULL AND pt.lulus = 0), 0) AS belum_lulus, COALESCE(SUM(pt.nilai_total IS NULL), 0) AS menunggu
         FROM post_test pt ${level}
         WHERE pt.status = 'selesai' AND pt.selesai_at >= ? AND pt.selesai_at < DATE_ADD(?, INTERVAL 1 MONTH)`,
        [...(levelId ? [levelId] : []), awalBulan, awalBulan],
      );
      return { selesai: Number(baris?.selesai ?? 0), lulus: Number(baris?.lulus ?? 0), belumLulus: Number(baris?.belum_lulus ?? 0), menunggu: Number(baris?.menunggu ?? 0) };
    },
    /**
     * Jumlah siswa aktif (level berjalan) yang sudah memenuhi syarat kehadiran post test (atau diberi pengecualian) tetapi belum
     * punya satu pun percobaan. Syarat kehadiran sama dengan `sesiModel.hitungHadir`: pertemuan bernomor 1..maksNomor yang berbeda.
     */
    async jumlahBelumTes({ levelId = null, minHadir, maksNomor }) {
      const baris = await db.first(
        `SELECT COUNT(*) AS n FROM siswa_level sl JOIN siswa s ON s.id = sl.siswa_id AND s.status = 'aktif'
         WHERE sl.status = 'berjalan' ${levelId ? 'AND sl.level_id = ?' : ''}
           AND NOT EXISTS (SELECT 1 FROM post_test pt WHERE pt.siswa_level_id = sl.id)
           AND (sl.pengecualian_kehadiran = 1 OR
                (SELECT COUNT(DISTINCT p.nomor) FROM sesi se JOIN pertemuan p ON p.id = se.pertemuan_id WHERE se.siswa_level_id = sl.id AND p.nomor <= ?) >= ?)`,
        [...(levelId ? [levelId] : []), maksNomor, minHadir],
      );
      return Number(baris?.n ?? 0);
    },
    /** Satu halaman post test untuk satu tab pengelola (terbaru lebih dulu; `pt.id` sebagai pemisah agar urutan antar halaman stabil). */
    daftar(tab, { batas, offset }) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE ${SYARAT_TAB[tab]} ORDER BY pt.updated_at DESC, pt.id DESC LIMIT ? OFFSET ?`, [batas, offset]);
    },
    /** Semua percobaan seorang siswa (semua level), terbaru lebih dulu. */
    riwayatSiswa(siswaId) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE sl.siswa_id = ? ORDER BY pt.created_at DESC, pt.percobaan_ke DESC`, [siswaId]);
    },
    /** Satu halaman percobaan seorang siswa (urutan sama dengan `riwayatSiswa`, ditambah `pt.id` agar stabil antar halaman). */
    riwayatSiswaHalaman(siswaId, { batas, offset }) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE sl.siswa_id = ? ORDER BY pt.created_at DESC, pt.percobaan_ke DESC, pt.id DESC LIMIT ? OFFSET ?`, [siswaId, batas, offset]);
    },
    /** Jumlah seluruh percobaan seorang siswa (semua level). */
    async hitungRiwayatSiswa(siswaId) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id WHERE sl.siswa_id = ?', [siswaId]);
      return Number(baris?.n ?? 0);
    },
    /** ID percobaan terakhir (percobaan_ke terbesar) pada tiap keikutsertaan level seorang siswa; dipakai menentukan `bisaTesUlang` di luar daftar penuh. */
    async idTerakhirSiswa(siswaId) {
      const baris = await db.rows(
        `SELECT pt.id FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id
         WHERE sl.siswa_id = ? AND pt.percobaan_ke = (SELECT MAX(p2.percobaan_ke) FROM post_test p2 WHERE p2.siswa_level_id = pt.siswa_level_id)`,
        [siswaId],
      );
      return baris.map((b) => b.id);
    },
    /**
     * Membuat percobaan; `mulaiSekarang` false = tes ulang yang belum dimulai (terakhir_aktif_at NULL).
     * `bagianUlang` = teks JSON daftar id bagian yang diulang (NULL untuk percobaan penuh).
     */
    tambah({ id, siswaLevelId, sesiId, percobaanKe, durasiDetik, dibukaOleh = null, bagianUlang = null, mulaiSekarang }, conn) {
      return db.exec(
        `INSERT INTO post_test (id, siswa_level_id, sesi_id, percobaan_ke, status, durasi_detik, terpakai_detik, mulai_at, terakhir_aktif_at, dibuka_oleh, bagian_ulang)
         VALUES (?, ?, ?, ?, 'berlangsung', ?, 0, NOW(), IF(?, NOW(), NULL), ?, ?)`,
        [id, siswaLevelId, sesiId, percobaanKe, durasiDetik, mulaiSekarang, dibukaOleh, bagianUlang],
        conn,
      );
    },
    /** Memulai tes ulang: waktu mulai berjalan dan butir dipindah ke sesi saat ini. */
    async mulaiTesUlang(id, sesiId, conn) {
      await db.exec("UPDATE post_test SET terakhir_aktif_at = NOW(), mulai_at = NOW(), sesi_id = ? WHERE id = ? AND status = 'berlangsung' AND terakhir_aktif_at IS NULL", [sesiId, id], conn);
      return db.exec('UPDATE tugas_siswa SET sesi_id = ? WHERE post_test_id = ?', [sesiId, id], conn);
    },
    /** Halaman dibuka lagi (lanjutkan): titik acuan waktu diperbarui tanpa menambah waktu terpakai. */
    sentuh(id) {
      return db.exec("UPDATE post_test SET terakhir_aktif_at = NOW() WHERE id = ? AND status = 'berlangsung' AND terakhir_aktif_at IS NOT NULL", [id]);
    },
    /** Denyut: tambah waktu terpakai sejak denyut terakhir (maksimal `maksDetik`), tanpa melewati durasi. */
    denyut(id, maksDetik) {
      return db.exec(
        `UPDATE post_test SET terpakai_detik = LEAST(durasi_detik, terpakai_detik + LEAST(GREATEST(TIMESTAMPDIFF(SECOND, terakhir_aktif_at, NOW()), 0), ?)),
           terakhir_aktif_at = NOW()
         WHERE id = ? AND status = 'berlangsung' AND terakhir_aktif_at IS NOT NULL`,
        [maksDetik, id],
      );
    },
    /** Menutup percobaan (dikumpulkan). */
    tutup(id, conn) {
      return db.exec("UPDATE post_test SET status = 'selesai', selesai_at = NOW() WHERE id = ? AND status = 'berlangsung'", [id], conn);
    },
    /** Menyimpan hasil finalisasi. */
    simpanFinal(id, nilaiTotal, lulus, conn) {
      return db.exec('UPDATE post_test SET nilai_total = ?, lulus = ? WHERE id = ?', [nilaiTotal, lulus ? 1 : 0, id], conn);
    },
    /** Ringkasan penilaian siswa satu post test beserta nama pengubah terakhir (kolom kosong bila belum pernah diisi). */
    ringkasan(id, conn) {
      return db.first('SELECT pt.ringkasan_tutor, pt.ringkasan_at, p.nama AS ringkasan_nama FROM post_test pt LEFT JOIN pengguna p ON p.id = pt.ringkasan_oleh WHERE pt.id = ?', [id], conn);
    },
    /** Menyimpan ringkasan (teks kosong = NULL) beserta pengubah dan waktunya (NOW database). */
    simpanRingkasan(id, teks, penggunaId, conn) {
      return db.exec('UPDATE post_test SET ringkasan_tutor = ?, ringkasan_oleh = ?, ringkasan_at = NOW() WHERE id = ?', [teks, penggunaId, id], conn);
    },
    /**
     * Ringkasan untuk orang tua: hanya post test yang sudah difinalisasi (nilai_total terisi) dan berteks, urut level
     * lalu percobaan terbaru lebih dulu (usecase mengambil yang pertama per level). Kolom dibatasi pada yang boleh dilihat orang tua.
     */
    ringkasanOrtu(siswaId) {
      return db.rows(
        `SELECT pt.id, pt.ringkasan_tutor, pt.selesai_at, l.id AS level_id, l.kode AS level_kode, l.nama AS level_nama
         FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id JOIN level l ON l.id = sl.level_id
         WHERE sl.siswa_id = ? AND pt.nilai_total IS NOT NULL AND pt.ringkasan_tutor IS NOT NULL AND TRIM(pt.ringkasan_tutor) <> ''
         ORDER BY l.urutan, pt.percobaan_ke DESC, pt.created_at DESC`,
        [siswaId],
      );
    },
    /** Bagian post test sebuah level urut `urutan`. */
    bagianLevel(levelId, conn) {
      return db.rows('SELECT id, kode, nama, bobot, sumber, jumlah_soal, target_wpm, urutan FROM bagian_post_test WHERE level_id = ? ORDER BY urutan, kode', [levelId], conn);
    },
    /** Template aktif sebuah bagian (kolom JSON mentah). */
    templateBagian(bagianId, conn) {
      return db.rows('SELECT id, kode, tipe, penilaian, kesulitan, teks, parameter, opsi, kunci FROM template WHERE bagian_id = ? AND aktif = 1', [bagianId], conn);
    },
    /** Nilai per bagian satu percobaan beserta nama penilai. */
    nilai(postTestId, conn) {
      return db.rows(
        `SELECT ptn.id, ptn.bagian_id, ptn.nilai, ptn.sumber, ptn.hasil_mengetik_id, ptn.dinilai_oleh, ptn.updated_at, p.nama AS dinilai_nama
         FROM post_test_nilai ptn LEFT JOIN pengguna p ON p.id = ptn.dinilai_oleh WHERE ptn.post_test_id = ?`,
        [postTestId],
        conn,
      );
    },
    /** Menyimpan (sisip atau timpa) nilai satu bagian (unik post_test_id + bagian_id). */
    simpanNilai({ id, postTestId, bagianId, nilai, sumber, hasilMengetikId = null, dinilaiOleh = null }, conn) {
      return db.exec(
        `INSERT INTO post_test_nilai (id, post_test_id, bagian_id, nilai, sumber, hasil_mengetik_id, dinilai_oleh) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), sumber = VALUES(sumber), hasil_mengetik_id = VALUES(hasil_mengetik_id), dinilai_oleh = VALUES(dinilai_oleh)`,
        [id, postTestId, bagianId, nilai, sumber, hasilMengetikId, dinilaiOleh],
        conn,
      );
    },
    /** Menyisipkan satu butir post test. */
    tambahButir({ id, sesiId, postTestId, templateId, soalTeks, parameterHasil }, conn) {
      return db.exec("INSERT INTO tugas_siswa (id, sesi_id, post_test_id, template_id, soal_teks, parameter_hasil, status) VALUES (?, ?, ?, ?, ?, ?, 'belum')", [id, sesiId, postTestId, templateId, soalTeks, parameterHasil], conn);
    },
    /** Semua butir satu percobaan urut dibuat. */
    butir(postTestId, conn) {
      return db.rows(`SELECT ${KOLOM_BUTIR}, p.nama AS dinilai_nama FROM tugas_siswa ts JOIN template t ON t.id = ts.template_id LEFT JOIN pengguna p ON p.id = ts.dinilai_oleh WHERE ts.post_test_id = ? ORDER BY ts.created_at, ts.id`, [postTestId], conn);
    },
    /** Satu butir beserta pemilik dan status percobaannya, dikunci untuk penyimpanan jawaban. */
    cariButir(tugasId, conn) {
      return db.first(
        `SELECT ${KOLOM_BUTIR}, pt.status AS pt_status, pt.terakhir_aktif_at AS pt_mulai, sl.siswa_id
         FROM tugas_siswa ts JOIN template t ON t.id = ts.template_id JOIN post_test pt ON pt.id = ts.post_test_id
         JOIN siswa_level sl ON sl.id = pt.siswa_level_id WHERE ts.id = ? FOR UPDATE`,
        [tugasId],
        conn,
      );
    },
    /** Menyimpan penilaian tutor satu butir praktik: skor dan catatan ada di parameter_hasil, penilainya di dinilai_oleh. */
    simpanPenilaianButir(tugasId, { parameterHasil, dinilaiOleh }, conn) {
      return db.exec('UPDATE tugas_siswa SET parameter_hasil = ?, dinilai_oleh = ? WHERE id = ?', [parameterHasil, dinilaiOleh, tugasId], conn);
    },
    /** Menyimpan jawaban butir dan hasil pemeriksaannya (`benar` tidak pernah dikirim ke siswa selama tes). */
    simpanJawaban(tugasId, { jawaban, benar, parameterHasil }, conn) {
      return db.exec('UPDATE tugas_siswa SET jawaban = ?, benar = ?, parameter_hasil = ? WHERE id = ?', [jawaban, benar === null ? null : benar ? 1 : 0, parameterHasil, tugasId], conn);
    },
  };
}
