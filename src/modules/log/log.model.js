import 'server-only';

/** Klausa WHERE dan parameternya dari filter halaman Log. Tanggal `sampai` ikut dihitung sampai akhir harinya. */
function syaratDaftar({ aksi, entitas, penggunaId, dari, sampai }) {
  const syarat = [];
  const params = [];
  /** Menambah satu syarat beserta nilainya. */
  const tambah = (sql, nilai) => {
    syarat.push(sql);
    params.push(nilai);
  };
  if (aksi) tambah('la.aksi = ?', aksi);
  if (entitas) tambah('la.entitas = ?', entitas);
  if (penggunaId) tambah('la.pengguna_id = ?', penggunaId);
  if (dari) tambah('la.created_at >= ?', dari);
  // batas atas eksklusif: awal hari berikutnya, agar seluruh hari `sampai` ikut
  if (sampai) tambah('la.created_at < ? + INTERVAL 1 DAY', sampai);
  return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', params };
}

/** Model log: menulis jejak aksi penting ke tabel log_aktivitas dan membacanya untuk halaman Log. */
export function buatLogModel({ db }) {
  return {
    /** Menyisipkan satu baris log. `conn` opsional agar log ikut transaksi aksi yang dicatat. */
    tambah({ id, penggunaId, aksi, entitas, entitasId, detail }, conn) {
      return db.exec(
        'INSERT INTO log_aktivitas (id, pengguna_id, aksi, entitas, entitas_id, detail) VALUES (?, ?, ?, ?, ?, ?)',
        [id, penggunaId ?? null, aksi, entitas, entitasId ?? null, detail == null ? null : JSON.stringify(detail)],
        conn,
      );
    },
    /** Satu halaman log terbaru sesuai filter, beserta nama pelaku. */
    daftar(filter, { batas, offset }) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(
        `SELECT la.id, la.aksi, la.entitas, la.entitas_id, la.detail, la.created_at, la.pengguna_id, p.nama AS pengguna_nama
         FROM log_aktivitas la LEFT JOIN pengguna p ON p.id = la.pengguna_id
         ${where} ORDER BY la.created_at DESC, la.id DESC LIMIT ? OFFSET ?`,
        [...params, batas, offset],
      );
    },
    /** Jumlah log sesuai filter. */
    async hitung(filter) {
      const { where, params } = syaratDaftar(filter);
      const baris = await db.first(`SELECT COUNT(*) AS n FROM log_aktivitas la ${where}`, params);
      return Number(baris?.n ?? 0);
    },
    /** Kolom detail (JSON mentah) log terbaru untuk satu aksi pada satu entitas; null bila tidak ada. */
    async detailTerakhir(aksi, entitas, entitasId) {
      const baris = await db.first('SELECT detail FROM log_aktivitas WHERE aksi = ? AND entitas = ? AND entitas_id = ? ORDER BY created_at DESC, id DESC LIMIT 1', [aksi, entitas, entitasId]);
      return baris?.detail ?? null;
    },
    /** Daftar aksi dan entitas yang pernah tercatat (untuk pilihan filter). */
    async pilihanFilter() {
      const [aksi, entitas] = await Promise.all([db.rows('SELECT DISTINCT aksi FROM log_aktivitas ORDER BY aksi'), db.rows('SELECT DISTINCT entitas FROM log_aktivitas ORDER BY entitas')]);
      return { aksi: aksi.map((b) => b.aksi), entitas: entitas.map((b) => b.entitas) };
    },
  };
}
