import 'server-only';

/** Kolom sertifikat beserta kode level, siswa, nomor sertifikat yang digantikan, dan nama pelaku. */
const KOLOM = `sr.id, sr.siswa_id, sr.level_id, sr.post_test_id, sr.nomor, sr.token_verifikasi, sr.status, sr.nama_siswa, sr.nama_level,
  sr.nilai_total, sr.diterbitkan_at, sr.diterbitkan_oleh, sr.dibatalkan_at, sr.dibatalkan_oleh, sr.alasan_batal, sr.menggantikan_id,
  l.kode AS level_kode, s.nama AS siswa_nama_kini, lama.nomor AS menggantikan_nomor,
  pn.nama AS diterbitkan_nama, pb.nama AS dibatalkan_nama, aktif.id AS aktif_id`;
/** Sertifikat digabung dengan level, siswa, sertifikat lama, pelaku, dan sertifikat terbit untuk pasangan (siswa, level) yang sama. */
const DARI = `FROM sertifikat sr
  JOIN level l ON l.id = sr.level_id
  JOIN siswa s ON s.id = sr.siswa_id
  LEFT JOIN sertifikat lama ON lama.id = sr.menggantikan_id
  LEFT JOIN pengguna pn ON pn.id = sr.diterbitkan_oleh
  LEFT JOIN pengguna pb ON pb.id = sr.dibatalkan_oleh
  LEFT JOIN sertifikat aktif ON aktif.siswa_id = sr.siswa_id AND aktif.level_id = sr.level_id AND aktif.status = 'terbit'`;

/** Meloloskan karakter khusus LIKE agar pencarian dicari apa adanya. */
function polaLike(teks) {
  return `%${teks.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Klausa WHERE dan parameternya dari filter daftar sertifikat (status, level, cari nama atau nomor). */
function syaratDaftar({ q, status, levelId }) {
  const syarat = [];
  const params = [];
  if (q) {
    syarat.push('(sr.nama_siswa LIKE ? OR s.nama LIKE ? OR sr.nomor LIKE ?)');
    params.push(polaLike(q), polaLike(q), polaLike(q));
  }
  if (status) {
    syarat.push('sr.status = ?');
    params.push(status);
  }
  if (levelId) {
    syarat.push('sr.level_id = ?');
    params.push(levelId);
  }
  return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', params };
}

/** Model sertifikat: penerbitan, pembatalan, pencarian, dan data post test lulus sebagai sumber snapshot. */
export function buatSertifikatModel({ db }) {
  return {
    /** Satu halaman daftar sertifikat sesuai filter, terbaru lebih dulu. */
    daftar(filter, { batas, offset }) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(`SELECT ${KOLOM} ${DARI} ${where} ORDER BY sr.diterbitkan_at DESC, sr.id DESC LIMIT ? OFFSET ?`, [...params, batas, offset]);
    },
    /** Jumlah sertifikat sesuai filter. */
    async hitung(filter) {
      const { where, params } = syaratDaftar(filter);
      const baris = await db.first(`SELECT COUNT(*) AS n FROM sertifikat sr JOIN siswa s ON s.id = sr.siswa_id ${where}`, params);
      return Number(baris?.n ?? 0);
    },
    /** Satu sertifikat; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE sr.id = ?`, [id], conn);
    },
    /** Sertifikat berdasarkan token verifikasi (sudah dinormalisasi huruf besar); null bila tidak ada. */
    cariToken(token) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE sr.token_verifikasi = ?`, [token]);
    },
    /** Semua sertifikat seorang siswa (termasuk yang dibatalkan), terbaru lebih dulu. */
    riwayatSiswa(siswaId) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE sr.siswa_id = ? ORDER BY sr.diterbitkan_at DESC, sr.id DESC`, [siswaId]);
    },
    /** Sertifikat berstatus terbit untuk (siswa, level), dikunci bila `kunci`; null bila tidak ada. */
    aktif(siswaId, levelId, conn, kunci = false) {
      return db.first(`SELECT id, nomor FROM sertifikat WHERE siswa_id = ? AND level_id = ? AND status = 'terbit' LIMIT 1${kunci ? ' FOR UPDATE' : ''}`, [siswaId, levelId], conn);
    },
    /** Sertifikat terbaru (status apa pun) untuk (siswa, level); dipakai sebagai `menggantikan_id` saat terbit ulang. */
    terbaru(siswaId, levelId, conn) {
      return db.first('SELECT id, status FROM sertifikat WHERE siswa_id = ? AND level_id = ? ORDER BY diterbitkan_at DESC, id DESC LIMIT 1', [siswaId, levelId], conn);
    },
    /** Jumlah sertifikat yang pernah dibuat dari satu post test. */
    async jumlahDariPostTest(postTestId, conn) {
      const baris = await db.first('SELECT COUNT(*) AS n FROM sertifikat WHERE post_test_id = ?', [postTestId], conn);
      return Number(baris?.n ?? 0);
    },
    /**
     * Data post test untuk snapshot: kelulusan, nilai total, siswa (nama saat ini), dan level.
     * `nilai_total` NULL berarti belum final.
     */
    postTest(postTestId, conn) {
      return db.first(
        `SELECT pt.id, pt.lulus, pt.nilai_total, sl.siswa_id, sl.level_id, s.nama AS siswa_nama, l.kode AS level_kode, l.nama AS level_nama, l.urutan AS level_urutan
         FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id JOIN siswa s ON s.id = sl.siswa_id JOIN level l ON l.id = sl.level_id
         WHERE pt.id = ?`,
        [postTestId],
        conn,
      );
    },
    /** Post test lulus terbaru seorang siswa pada satu level (semua keikutsertaan level itu); null bila belum pernah lulus. */
    lulusTerbaru(siswaId, levelId, conn) {
      return db.first(
        `SELECT pt.id FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id
         WHERE sl.siswa_id = ? AND sl.level_id = ? AND pt.lulus = 1 AND pt.nilai_total IS NOT NULL
         ORDER BY pt.selesai_at DESC, pt.percobaan_ke DESC LIMIT 1`,
        [siswaId, levelId],
        conn,
      );
    },
    /** Jumlah sertifikat berstatus terbit yang diterbitkan pada bulan berjalan (kartu beranda). */
    async jumlahTerbitBulanIni() {
      const baris = await db.first("SELECT COUNT(*) AS n FROM sertifikat WHERE status = 'terbit' AND diterbitkan_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')");
      return Number(baris?.n ?? 0);
    },
    /** Bulan berjalan menurut database (YYYYMM) untuk nomor sertifikat. */
    async bulanIni(conn) {
      return (await db.first("SELECT DATE_FORMAT(NOW(), '%Y%m') AS bulan", [], conn)).bulan;
    },
    /** Nomor terbesar dengan awalan tertentu (mis. "DPL-L1-202611-"); null bila belum ada. */
    async nomorTerakhir(awalan, conn) {
      const baris = await db.first('SELECT nomor FROM sertifikat WHERE nomor LIKE ? ORDER BY nomor DESC LIMIT 1', [`${awalan}%`], conn);
      return baris?.nomor ?? null;
    },
    /** Menyisipkan sertifikat terbit (kolom aktif_kunci diisi otomatis oleh database). */
    tambah({ id, siswaId, levelId, postTestId, nomor, token, namaSiswa, namaLevel, nilaiTotal, diterbitkanOleh, menggantikanId }, conn) {
      return db.exec(
        `INSERT INTO sertifikat (id, siswa_id, level_id, post_test_id, nomor, token_verifikasi, status, nama_siswa, nama_level, nilai_total, diterbitkan_at, diterbitkan_oleh, menggantikan_id)
         VALUES (?, ?, ?, ?, ?, ?, 'terbit', ?, ?, ?, NOW(), ?, ?)`,
        [id, siswaId, levelId, postTestId, nomor, token, namaSiswa, namaLevel, nilaiTotal, diterbitkanOleh, menggantikanId],
        conn,
      );
    },
    /** Membatalkan sertifikat yang masih terbit; affectedRows 0 bila sudah dibatalkan. */
    batalkan(id, alasan, penggunaId, conn) {
      return db.exec("UPDATE sertifikat SET status = 'dibatalkan', dibatalkan_at = NOW(), dibatalkan_oleh = ?, alasan_batal = ? WHERE id = ? AND status = 'terbit'", [penggunaId, alasan, id], conn);
    },
  };
}
