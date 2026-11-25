import { bukaKoneksi } from './_koneksi.mjs';
import { buatId } from './_idGen.mjs';
import { buatKode } from '../src/utils/kodeAkses.js';

/** Nama siswa data uji; dipakai juga sebagai penanda idempoten. */
const NAMA_SISWA_UJI = 'Siswa Uji';
/** Batas percobaan membuat kode bila kebetulan bentrok dengan kode lain. */
const MAKS_ULANG = 5;

/** Mengambil ID Siswa Uji, membuatnya bila belum ada. Status selalu dipastikan aktif. */
async function pastikanSiswa(conn) {
  const [ada] = await conn.query('SELECT id FROM siswa WHERE nama = ? ORDER BY created_at LIMIT 1', [NAMA_SISWA_UJI]);
  if (ada.length > 0) {
    await conn.query("UPDATE siswa SET status = 'aktif' WHERE id = ?", [ada[0].id]);
    return ada[0].id;
  }
  const id = buatId();
  await conn.query("INSERT INTO siswa (id, nama, status, tanggal_daftar) VALUES (?, ?, 'aktif', CURDATE())", [id, NAMA_SISWA_UJI]);
  return id;
}

/** Mengambil kode aktif jenis tertentu, membuatnya bila belum ada (ulang bila kode bentrok). */
async function pastikanKode(conn, siswaId, jenis, panjang) {
  const [ada] = await conn.query('SELECT kode FROM kode_akses WHERE siswa_id = ? AND jenis = ? AND aktif = 1', [siswaId, jenis]);
  if (ada.length > 0) return ada[0].kode;
  for (let i = 0; i < MAKS_ULANG; i += 1) {
    const kode = buatKode(panjang);
    try {
      await conn.query('INSERT INTO kode_akses (id, siswa_id, jenis, kode) VALUES (?, ?, ?, ?)', [buatId(), siswaId, jenis, kode]);
      return kode;
    } catch (error) {
      // kode kebetulan sudah dipakai siswa lain: coba kode acak berikutnya
      if (error.code !== 'ER_DUP_ENTRY') throw error;
    }
  }
  throw new Error('Gagal membuat kode unik, coba jalankan ulang.');
}

/**
 * Memastikan Siswa Uji punya level berjalan (Level 1) agar bisa diabsen (Fase C). Dilewati bila level
 * belum di-seed (jalankan npm run db:seed dulu). Mengembalikan kode level berjalan atau null.
 */
async function pastikanLevel(conn, siswaId) {
  const [ada] = await conn.query("SELECT l.kode FROM siswa_level sl JOIN level l ON l.id = sl.level_id WHERE sl.siswa_id = ? AND sl.status = 'berjalan'", [siswaId]);
  if (ada.length > 0) return ada[0].kode;
  const [level] = await conn.query('SELECT id, kode FROM level ORDER BY urutan, kode LIMIT 1');
  // level belum di-seed: siswa tetap bisa login, tetapi belum bisa diabsen
  if (level.length === 0) return null;
  await conn.query("INSERT INTO siswa_level (id, siswa_id, level_id, status, mulai_at) VALUES (?, ?, ?, 'berjalan', CURDATE())", [buatId(), siswaId, level[0].id]);
  return level[0].kode;
}

/** Membuat (idempoten) satu Siswa Uji beserta kode siswa dan kode orang tua, lalu mencetak keduanya. */
async function main() {
  const conn = await bukaKoneksi();
  try {
    const [p] = await conn.query("SELECT nilai FROM pengaturan WHERE kunci = 'panjang_kode_akses'");
    const panjang = Number(p[0]?.nilai ?? 8);
    const siswaId = await pastikanSiswa(conn);
    const kodeSiswa = await pastikanKode(conn, siswaId, 'siswa', panjang);
    const kodeOrtu = await pastikanKode(conn, siswaId, 'ortu', panjang);
    const level = await pastikanLevel(conn, siswaId);
    console.log(`${NAMA_SISWA_UJI} (id ${siswaId})`);
    console.log(`  Level berjalan : ${level ?? '- (jalankan npm run db:seed lalu ulangi)'}`);
    console.log(`  Kode siswa     : ${kodeSiswa}`);
    console.log(`  Kode orang tua : ${kodeOrtu}`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('siswa:uji gagal:', error.message);
  process.exit(1);
});
