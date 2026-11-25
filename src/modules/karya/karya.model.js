import 'server-only';

/** Kolom karya beserta nama siswa. */
const KOLOM = `k.id, k.siswa_id, k.sesi_id, k.judul, k.deskripsi, k.jenis, k.url, k.berkas_path, k.created_at, k.updated_at, s.nama AS siswa_nama`;

/** Meloloskan karakter khusus LIKE agar pencarian dicari apa adanya. */
function polaLike(teks) {
  return `%${teks.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Klausa WHERE dan parameternya dari filter galeri (siswa, cari nama siswa/judul, jenis). */
function syaratDaftar({ siswaId, q, jenis }) {
  const syarat = [];
  const params = [];
  if (siswaId) {
    syarat.push('k.siswa_id = ?');
    params.push(siswaId);
  }
  if (q) {
    syarat.push('(s.nama LIKE ? OR k.judul LIKE ?)');
    params.push(polaLike(q), polaLike(q));
  }
  if (jenis) {
    syarat.push('k.jenis = ?');
    params.push(jenis);
  }
  return { where: syarat.length ? `WHERE ${syarat.join(' AND ')}` : '', params };
}

/** Model karya: galeri karya siswa (tabel karya). */
export function buatKaryaModel({ db }) {
  return {
    /** Satu halaman karya sesuai filter, terbaru lebih dulu. */
    daftar(filter, { batas, offset }) {
      const { where, params } = syaratDaftar(filter);
      return db.rows(`SELECT ${KOLOM} FROM karya k JOIN siswa s ON s.id = k.siswa_id ${where} ORDER BY k.created_at DESC, k.id DESC LIMIT ? OFFSET ?`, [...params, batas, offset]);
    },
    /** Jumlah karya sesuai filter. */
    async hitung(filter) {
      const { where, params } = syaratDaftar(filter);
      const baris = await db.first(`SELECT COUNT(*) AS n FROM karya k JOIN siswa s ON s.id = k.siswa_id ${where}`, params);
      return Number(baris?.n ?? 0);
    },
    /** Satu karya; null bila tidak ada. */
    cariId(id, conn) {
      return db.first(`SELECT ${KOLOM} FROM karya k JOIN siswa s ON s.id = k.siswa_id WHERE k.id = ?`, [id], conn);
    },
    /** Menyisipkan karya baru. */
    tambah({ id, siswaId, sesiId, judul, deskripsi, jenis, url, berkasPath }, conn) {
      return db.exec('INSERT INTO karya (id, siswa_id, sesi_id, judul, deskripsi, jenis, url, berkas_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, siswaId, sesiId, judul, deskripsi, jenis, url, berkasPath], conn);
    },
    /** Mengubah judul dan deskripsi karya. */
    ubah(id, { judul, deskripsi }, conn) {
      return db.exec('UPDATE karya SET judul = ?, deskripsi = ? WHERE id = ?', [judul, deskripsi, id], conn);
    },
    /** Path semua berkas karya seorang siswa (dipakai sebelum siswa dihapus). */
    async berkasSiswa(siswaId, conn) {
      const baris = await db.rows("SELECT berkas_path FROM karya WHERE siswa_id = ? AND jenis = 'berkas' AND berkas_path IS NOT NULL", [siswaId], conn);
      return baris.map((b) => b.berkas_path);
    },
    /** Menghapus satu karya. */
    hapus(id, conn) {
      return db.exec('DELETE FROM karya WHERE id = ?', [id], conn);
    },
  };
}
