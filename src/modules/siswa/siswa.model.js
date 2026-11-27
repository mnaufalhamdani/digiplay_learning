import 'server-only';

/** Kolom siswa beserta level yang sedang berjalan (bila ada). */
const KOLOM = `s.id, s.nama, s.status, s.tanggal_daftar, s.created_at,
  sl.id AS siswa_level_id, sl.mulai_at AS level_mulai_at, l.id AS level_id, l.kode AS level_kode, l.nama AS level_nama`;
/** Siswa digabung dengan siswa_level berstatus berjalan (maksimal satu per siswa, dijaga UNIQUE aktif_kunci). */
const DARI = `FROM siswa s
  LEFT JOIN siswa_level sl ON sl.siswa_id = s.id AND sl.status = 'berjalan'
  LEFT JOIN level l ON l.id = sl.level_id`;

/** Meloloskan karakter khusus LIKE agar pencarian nama dicari apa adanya. */
function polaLike(teks) {
  return `%${teks.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Klausa WHERE dan parameternya dari filter daftar siswa. */
function syaratDaftar({ q, status, levelId }) {
  const syarat = [];
  const params = [];
  if (q) {
    syarat.push('s.nama LIKE ?');
    params.push(polaLike(q));
  }
  if (status) {
    syarat.push('s.status = ?');
    params.push(status);
  }
  // filter level: level yang sedang berjalan
  if (levelId) {
    syarat.push('l.id = ?');
    params.push(levelId);
  }
  return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', params };
}

/** Model siswa: tabel siswa, kode_akses, dan siswa_level, termasuk penghapusan berantai. */
export function buatSiswaModel({ db }) {
  return {
    /** Satu halaman daftar siswa sesuai filter, terbaru lebih dulu. */
    daftar(filter, { batas, offset }) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(`SELECT ${KOLOM} ${DARI} ${where} ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?`, [...params, batas, offset]);
    },
    /** Jumlah siswa sesuai filter. */
    async hitung(filter) {
      const { where, params } = syaratDaftar(filter);
      const baris = await db.first(`SELECT COUNT(*) AS n ${DARI} ${where}`, params);
      return Number(baris?.n ?? 0);
    },
    /** Jumlah siswa aktif dan berapa yang tanggal daftarnya jatuh pada bulan berjalan (CURDATE database), dalam satu query. */
    async ringkasanAktif() {
      const baris = await db.first(
        "SELECT COUNT(*) AS total, COALESCE(SUM(tanggal_daftar >= DATE_FORMAT(CURDATE(), '%Y-%m-01')), 0) AS baru FROM siswa WHERE status = 'aktif'",
      );
      return { total: Number(baris?.total ?? 0), baru: Number(baris?.baru ?? 0) };
    },
    /** Jumlah siswa aktif per level yang sedang berjalan untuk tiap level aktif (level tanpa siswa bernilai 0). */
    perLevel() {
      return db.rows(
        `SELECT l.id, l.kode, l.nama, l.urutan, COUNT(s.id) AS n
         FROM level l
         LEFT JOIN siswa_level sl ON sl.level_id = l.id AND sl.status = 'berjalan'
         LEFT JOIN siswa s ON s.id = sl.siswa_id AND s.status = 'aktif'
         WHERE l.aktif = 1 GROUP BY l.id, l.kode, l.nama, l.urutan ORDER BY l.urutan, l.kode`,
      );
    },
    /**
     * Jumlah siswa aktif yang tidak punya sesi dalam `hari` hari terakhir (jam masuk dibandingkan agar indeks siswa+waktu
     * terpakai). Siswa yang mendaftar kurang dari `hari` hari lalu dikecualikan: mereka belum sempat absen, bukan menghilang.
     */
    async jumlahTanpaSesi(hari) {
      const baris = await db.first(
        `SELECT COUNT(*) AS n FROM siswa s
         WHERE s.status = 'aktif' AND s.tanggal_daftar <= CURDATE() - INTERVAL ? DAY
           AND NOT EXISTS (SELECT 1 FROM sesi se WHERE se.siswa_id = s.id AND se.jam_masuk >= CURDATE() - INTERVAL ? DAY)`,
        [hari, hari],
      );
      return Number(baris?.n ?? 0);
    },
    /** Satu siswa beserta level berjalan; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE s.id = ?`, [id], conn);
    },
    /** Mengunci baris siswa (FOR UPDATE) agar dua aksi bersamaan pada siswa yang sama berjalan bergiliran. */
    kunci(id, conn) {
      return db.first('SELECT id, nama, status FROM siswa WHERE id = ? FOR UPDATE', [id], conn);
    },
    /** Kode akses yang sedang aktif (siswa dan ortu). */
    kodeAktif(siswaId, conn) {
      return db.rows('SELECT id, jenis, kode, created_at FROM kode_akses WHERE siswa_id = ? AND aktif = 1', [siswaId], conn);
    },
    /** Riwayat keikutsertaan level, terbaru lebih dulu. */
    riwayatLevel(siswaId) {
      return db.rows(
        `SELECT sl.id, sl.status, sl.mulai_at, sl.selesai_at, l.kode AS level_kode, l.nama AS level_nama
         FROM siswa_level sl JOIN level l ON l.id = sl.level_id
         WHERE sl.siswa_id = ? ORDER BY sl.mulai_at DESC, sl.created_at DESC`,
        [siswaId],
      );
    },
    /** Menyisipkan siswa baru. */
    tambah({ id, nama, tanggalDaftar, dibuatOleh }, conn) {
      return db.exec("INSERT INTO siswa (id, nama, status, tanggal_daftar, dibuat_oleh) VALUES (?, ?, 'aktif', ?, ?)", [id, nama, tanggalDaftar, dibuatOleh], conn);
    },
    /** Menyisipkan satu kode akses aktif (kolom aktif_kunci diisi otomatis oleh database). */
    tambahKode({ id, siswaId, jenis, kode }, conn) {
      return db.exec('INSERT INTO kode_akses (id, siswa_id, jenis, kode) VALUES (?, ?, ?, ?)', [id, siswaId, jenis, kode], conn);
    },
    /** Menonaktifkan kode aktif satu jenis (kode lama tidak dihapus). */
    nonaktifkanKode(siswaId, jenis, conn) {
      return db.exec('UPDATE kode_akses SET aktif = 0 WHERE siswa_id = ? AND jenis = ? AND aktif = 1', [siswaId, jenis], conn);
    },
    /** Membuka keikutsertaan level baru berstatus berjalan; `mulai` null = hari ini (CURDATE database). */
    tambahSiswaLevel({ id, siswaId, levelId, mulai }, conn) {
      return db.exec("INSERT INTO siswa_level (id, siswa_id, level_id, status, mulai_at) VALUES (?, ?, ?, 'berjalan', COALESCE(?, CURDATE()))", [id, siswaId, levelId, mulai], conn);
    },
    /** Mengakhiri level yang sedang berjalan (selesai hari ini) dengan status `berhenti` atau `lulus`. */
    hentikanSiswaLevel(siswaLevelId, conn, status = 'berhenti') {
      return db.exec("UPDATE siswa_level SET status = ?, selesai_at = CURDATE() WHERE id = ? AND status = 'berjalan'", [status, siswaLevelId], conn);
    },
    /** True bila keikutsertaan level ini punya percobaan post test yang lulus. */
    async sudahLulusPostTest(siswaLevelId, conn) {
      return Boolean(await db.first('SELECT 1 AS ada FROM post_test WHERE siswa_level_id = ? AND lulus = 1 LIMIT 1', [siswaLevelId], conn));
    },
    /** Mengubah status siswa (aktif/nonaktif). */
    ubahStatus(id, status, conn) {
      return db.exec('UPDATE siswa SET status = ? WHERE id = ?', [status, id], conn);
    },
    /**
     * Menghapus siswa beserta semua datanya dengan urutan di komentar kepala schema.sql
     * (FK berbasis kolom generated memakai RESTRICT, jadi tabel anak dihapus lebih dulu):
     * sertifikat -> post_test (+ post_test_nilai, tugas post test) -> login_perangkat -> sesi (+ tugas_siswa, sesi_tutor)
     * -> siswa_level -> kode_akses -> siswa (hasil_mengetik, hasil_latihan, pembayaran, karya ikut terhapus lewat CASCADE).
     * Wajib dipanggil di dalam transaksi (`conn`).
     */
    async hapusBerantai(siswaId, conn) {
      await db.exec('DELETE FROM sertifikat WHERE siswa_id = ?', [siswaId], conn);
      await db.exec('DELETE FROM post_test WHERE siswa_level_id IN (SELECT id FROM siswa_level WHERE siswa_id = ?)', [siswaId], conn);
      await db.exec('DELETE FROM login_perangkat WHERE siswa_id = ?', [siswaId], conn);
      await db.exec('DELETE FROM sesi WHERE siswa_id = ?', [siswaId], conn);
      await db.exec('DELETE FROM siswa_level WHERE siswa_id = ?', [siswaId], conn);
      await db.exec('DELETE FROM kode_akses WHERE siswa_id = ?', [siswaId], conn);
      return db.exec('DELETE FROM siswa WHERE id = ?', [siswaId], conn);
    },
  };
}
