import 'server-only';

/**
 * Menyusun klausa WHERE dari filter ekspor. `kolomLevel` = kolom level yang difilter, `kolomTanggal` = kolom tanggal
 * (DATE atau DATETIME); batas `sampai` eksklusif awal hari berikutnya agar seluruh hari ikut.
 */
function syarat({ levelId, dari, sampai }, kolomLevel, kolomTanggal) {
  const isi = [];
  const params = [];
  if (levelId) {
    isi.push(`${kolomLevel} = ?`);
    params.push(levelId);
  }
  if (dari) {
    isi.push(`${kolomTanggal} >= ?`);
    params.push(dari);
  }
  if (sampai) {
    isi.push(`${kolomTanggal} < ? + INTERVAL 1 DAY`);
    params.push(sampai);
  }
  return { where: isi.length ? `WHERE ${isi.join(' AND ')}` : '', params };
}

/** Siswa digabung level yang sedang berjalan. */
const SISWA_LEVEL = `LEFT JOIN siswa_level sl ON sl.siswa_id = s.id AND sl.status = 'berjalan' LEFT JOIN level l ON l.id = sl.level_id`;

/** Model ekspor: kueri baca untuk berkas CSV (tanpa kode akses), dibatasi `batas` baris. */
export function buatEksporModel({ db }) {
  return {
    /** Siswa beserta level berjalan; filter level berjalan dan tanggal daftar. */
    siswa(filter, batas) {
      const { where, params } = syarat(filter, 'l.id', 's.tanggal_daftar');
      return db.rows(`SELECT s.nama, s.status, s.tanggal_daftar, l.kode AS level_kode, l.nama AS level_nama, sl.mulai_at FROM siswa s ${SISWA_LEVEL} ${where} ORDER BY s.nama, s.id LIMIT ?`, [...params, batas]);
    },
    /** Sesi (kehadiran) beserta pertemuan, tutor, penuntasan, dan ringkasan tugas; filter level pertemuan dan tanggal sesi. */
    kehadiran(filter, batas) {
      const { where, params } = syarat(filter, 'l.id', 'se.tanggal');
      return db.rows(
        `SELECT se.tanggal, se.jam_masuk, se.jam_pulang, se.status, se.penuntasan_otomatis, se.penuntasan_tutor,
           TIMESTAMPDIFF(MINUTE, se.jam_masuk, se.jam_pulang) AS lama_menit, s.nama AS siswa_nama, l.kode AS level_kode, p.nomor AS pertemuan_nomor, p.judul AS pertemuan_judul,
           (SELECT GROUP_CONCAT(pg.nama ORDER BY pg.nama SEPARATOR ', ') FROM sesi_tutor st JOIN pengguna pg ON pg.id = st.pengguna_id WHERE st.sesi_id = se.id) AS tutor,
           (SELECT COUNT(*) FROM tugas_siswa ts WHERE ts.sesi_id = se.id AND ts.post_test_id IS NULL AND ts.status <> 'diganti') AS tugas_total,
           (SELECT COUNT(*) FROM tugas_siswa ts WHERE ts.sesi_id = se.id AND ts.post_test_id IS NULL AND ts.status = 'selesai') AS tugas_selesai
         FROM sesi se JOIN siswa s ON s.id = se.siswa_id JOIN pertemuan p ON p.id = se.pertemuan_id JOIN level l ON l.id = p.level_id
         ${where} ORDER BY se.tanggal DESC, se.jam_masuk DESC LIMIT ?`,
        [...params, batas],
      );
    },
    /** Percobaan post test beserta nilai per bagian (teks "A: 90; B: 80"); filter level dan tanggal mulai. */
    postTest(filter, batas) {
      const { where, params } = syarat(filter, 'l.id', 'pt.mulai_at');
      return db.rows(
        `SELECT s.nama AS siswa_nama, l.kode AS level_kode, pt.percobaan_ke, pt.status, pt.mulai_at, pt.selesai_at, pt.nilai_total, pt.lulus,
           (SELECT GROUP_CONCAT(CONCAT(b.kode, ': ', n.nilai) ORDER BY b.urutan SEPARATOR '; ') FROM post_test_nilai n JOIN bagian_post_test b ON b.id = n.bagian_id WHERE n.post_test_id = pt.id) AS nilai_bagian
         FROM post_test pt JOIN siswa_level sl ON sl.id = pt.siswa_level_id JOIN siswa s ON s.id = sl.siswa_id JOIN level l ON l.id = sl.level_id
         ${where} ORDER BY pt.mulai_at DESC, pt.id DESC LIMIT ?`,
        [...params, batas],
      );
    },
    /** Pembayaran beserta siswa dan pencatat; filter level berjalan siswa dan tanggal bayar. */
    pembayaran(filter, batas) {
      const { where, params } = syarat(filter, 'l.id', 'pb.tanggal');
      return db.rows(
        `SELECT pb.tanggal, pb.jumlah, pb.keterangan, s.nama AS siswa_nama, l.kode AS level_kode, pg.nama AS dicatat_nama
         FROM pembayaran pb JOIN siswa s ON s.id = pb.siswa_id JOIN pengguna pg ON pg.id = pb.dicatat_oleh ${SISWA_LEVEL}
         ${where} ORDER BY pb.tanggal DESC, pb.created_at DESC LIMIT ?`,
        [...params, batas],
      );
    },
  };
}
