import 'server-only';

/** Kolom tugas beserta template, sesi, dan penilai (untuk daftar dan pemeriksaan kepemilikan). */
const KOLOM = `ts.id, ts.sesi_id, ts.template_id, ts.menggantikan_id, ts.soal_teks, ts.parameter_hasil, ts.status, ts.jawaban, ts.benar,
  ts.dinilai_oleh, ts.selesai_at, ts.created_at, t.kode AS template_kode, t.tipe, t.penilaian, t.kesulitan,
  s.siswa_id, s.status AS sesi_status, s.pertemuan_id, p.nama AS dinilai_nama`;
/** Tugas latihan (bukan butir post test) digabung dengan template, sesi, dan penilai. */
const DARI = `FROM tugas_siswa ts
  JOIN template t ON t.id = ts.template_id
  JOIN sesi s ON s.id = ts.sesi_id
  LEFT JOIN pengguna p ON p.id = ts.dinilai_oleh`;

/** Model tugas: tabel tugas_siswa untuk tugas latihan per sesi (butir post test menyusul di Fase D2). */
export function buatTugasModel({ db }) {
  return {
    /** Menyisipkan satu tugas berstatus belum. */
    tambah({ id, sesiId, templateId, menggantikanId = null, soalTeks, parameterHasil }, conn) {
      return db.exec(
        "INSERT INTO tugas_siswa (id, sesi_id, template_id, menggantikan_id, soal_teks, parameter_hasil, status) VALUES (?, ?, ?, ?, ?, ?, 'belum')",
        [id, sesiId, templateId, menggantikanId, soalTeks, parameterHasil],
        conn,
      );
    },
    /** Semua tugas latihan satu sesi, urut dibuat. */
    daftarSesi(sesiId, conn) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE ts.sesi_id = ? AND ts.post_test_id IS NULL ORDER BY ts.created_at, ts.id`, [sesiId], conn);
    },
    /** Satu tugas latihan; `kunci` true menguncinya (FOR UPDATE) agar dua aksi bersamaan bergiliran. */
    cariId(id, conn, kunci = false) {
      return db.first(`SELECT ${KOLOM} ${DARI} WHERE ts.id = ? AND ts.post_test_id IS NULL${kunci ? ' FOR UPDATE' : ''}`, [id], conn);
    },
    /** ID template yang sudah pernah dipakai di sesi ini (termasuk tugas yang diganti). */
    async templateTerpakai(sesiId, conn) {
      const baris = await db.rows('SELECT DISTINCT template_id FROM tugas_siswa WHERE sesi_id = ? AND post_test_id IS NULL', [sesiId], conn);
      return baris.map((b) => b.template_id);
    },
    /** Status semua tugas latihan satu sesi (bahan penuntasan otomatis). */
    async statusSesi(sesiId, conn) {
      const baris = await db.rows('SELECT status FROM tugas_siswa WHERE sesi_id = ? AND post_test_id IS NULL', [sesiId], conn);
      return baris.map((b) => b.status);
    },
    /** Menyimpan hasil pemeriksaan jawaban; bila benar sekaligus menandai selesai. */
    simpanJawaban(id, { jawaban, benar, parameterHasil }, conn) {
      return db.exec(
        `UPDATE tugas_siswa SET jawaban = ?, benar = ?, parameter_hasil = ?,
           status = IF(? = 1, 'selesai', status), selesai_at = IF(? = 1, NOW(), selesai_at)
         WHERE id = ?`,
        [jawaban, benar ? 1 : 0, parameterHasil, benar ? 1 : 0, benar ? 1 : 0, id],
        conn,
      );
    },
    /** Mencatat nama proyek Studio Zippy yang dikirim siswa sebagai jawaban tugas (status tidak berubah; tutor yang menilai). */
    simpanKiriman(id, nama, conn) {
      return db.exec('UPDATE tugas_siswa SET jawaban = ? WHERE id = ?', [nama, id], conn);
    },
    /** Tugas latihan berstatus belum dengan tipe tertentu pada satu sesi, dikunci untuk penyelesaian otomatis. */
    belumTipe(sesiId, tipe, conn) {
      return db.rows(`SELECT ${KOLOM} ${DARI} WHERE ts.sesi_id = ? AND ts.post_test_id IS NULL AND ts.status = 'belum' AND t.tipe = ? FOR UPDATE`, [sesiId, tipe], conn);
    },
    /** Menandai tugas selesai karena target latihan web tercapai (benar = 1, tanpa penilai). */
    tandaiSelesaiOtomatis(id, conn) {
      return db.exec("UPDATE tugas_siswa SET status = 'selesai', benar = 1, selesai_at = NOW() WHERE id = ? AND status = 'belum'", [id], conn);
    },
    /**
     * Mengubah status tugas. selesai: selesai_at sekarang dan `dinilaiOleh` (tutor, atau null bila oleh sistem);
     * belum/dilewati/diganti: selesai_at dan penilai dikosongkan.
     */
    ubahStatus(id, status, dinilaiOleh, conn) {
      const selesai = status === 'selesai';
      return db.exec(
        'UPDATE tugas_siswa SET status = ?, selesai_at = IF(?, NOW(), NULL), dinilai_oleh = ? WHERE id = ?',
        [status, selesai, selesai ? dinilaiOleh : null, id],
        conn,
      );
    },
  };
}
