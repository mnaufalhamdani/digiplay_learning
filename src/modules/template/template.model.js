import 'server-only';

/** Kolom ringkas untuk daftar template beserta level, pertemuan, dan bagiannya. */
const KOLOM_DAFTAR = `t.id, t.kode, t.tipe, t.penilaian, t.kesulitan, t.aktif, t.teks, t.pertemuan_id, t.bagian_id,
  p.nomor AS pertemuan_nomor, p.judul AS pertemuan_judul, l.id AS level_id, l.kode AS level_kode, l.nama AS level_nama,
  b.kode AS bagian_kode, b.nama AS bagian_nama`;
/** Sumber data daftar/detail template. */
const DARI = `FROM template t
  JOIN pertemuan p ON p.id = t.pertemuan_id
  JOIN level l ON l.id = p.level_id
  LEFT JOIN bagian_post_test b ON b.id = t.bagian_id`;

/** Meloloskan karakter khusus LIKE agar pencarian "50%" mencari teks apa adanya. */
function polaLike(teks) {
  return `%${teks.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Klausa WHERE dan parameternya dari filter daftar template. */
function syaratDaftar(f) {
  const syarat = [];
  const params = [];
  /** Menambah satu syarat beserta nilainya. */
  const tambah = (sql, ...nilai) => {
    syarat.push(sql);
    params.push(...nilai);
  };
  if (f.levelId) tambah('l.id = ?', f.levelId);
  if (f.pertemuanId) tambah('t.pertemuan_id = ?', f.pertemuanId);
  // 'latihan' = template pertemuan biasa (tanpa bagian); selain itu ID bagian post test
  if (f.bagian === 'latihan') tambah('t.bagian_id IS NULL');
  else if (f.bagian) tambah('t.bagian_id = ?', f.bagian);
  if (f.tipe) tambah('t.tipe = ?', f.tipe);
  if (f.penilaian) tambah('t.penilaian = ?', f.penilaian);
  if (f.aktif) tambah('t.aktif = ?', Number(f.aktif));
  if (f.q) tambah('(t.kode LIKE ? OR t.teks LIKE ?)', polaLike(f.q), polaLike(f.q));
  return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', params };
}

/** Model template: daftar dengan filter, detail, tambah, dan ubah (tanpa hapus). */
export function buatTemplateModel({ db }) {
  return {
    /** Satu halaman daftar template sesuai filter. */
    daftar(filter, { batas, offset }) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(`SELECT ${KOLOM_DAFTAR} ${DARI} ${where} ORDER BY l.urutan, p.nomor, t.kode LIMIT ? OFFSET ?`, [...params, batas, offset]);
    },
    /** Jumlah template sesuai filter (untuk paginasi). */
    async hitung(filter) {
      const { where, params } = syaratDaftar(filter);
      const baris = await db.first(`SELECT COUNT(*) AS n ${DARI} ${where}`, params);
      return Number(baris?.n ?? 0);
    },
    /** Satu template lengkap (termasuk kolom JSON mentah); null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM_DAFTAR}, t.parameter, t.opsi, t.kunci, t.created_at, t.updated_at ${DARI} WHERE t.id = ?`, [id], conn);
    },
    /** Template latihan aktif satu pertemuan (tanpa bagian post test), lengkap dengan kolom JSON mentah. */
    aktifLatihan(pertemuanId, conn) {
      return db.rows(
        'SELECT id, kode, tipe, penilaian, kesulitan, teks, parameter, opsi, kunci FROM template WHERE pertemuan_id = ? AND aktif = 1 AND bagian_id IS NULL',
        [pertemuanId],
        conn,
      );
    },
    /** Menyisipkan template baru (kolom JSON sudah berupa teks JSON atau NULL). */
    tambah(d, conn) {
      return db.exec(
        `INSERT INTO template (id, pertemuan_id, bagian_id, kode, tipe, penilaian, kesulitan, teks, parameter, opsi, kunci, aktif)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.id, d.pertemuanId, d.bagianId, d.kode, d.tipe, d.penilaian, d.kesulitan, d.teks, d.parameter, d.opsi, d.kunci, d.aktif ? 1 : 0],
        conn,
      );
    },
    /** Mengubah isi template; kode, pertemuan, bagian, dan tipe tetap. */
    ubah(id, d, conn) {
      return db.exec(
        'UPDATE template SET penilaian = ?, kesulitan = ?, teks = ?, parameter = ?, opsi = ?, kunci = ?, aktif = ? WHERE id = ?',
        [d.penilaian, d.kesulitan, d.teks, d.parameter, d.opsi, d.kunci, d.aktif ? 1 : 0, id],
        conn,
      );
    },
  };
}
