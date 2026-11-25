import { bukaKoneksi } from './_koneksi.mjs';
import { buatId } from './_idGen.mjs';
import { buatKode } from '../src/utils/kodeAkses.js';

// Data uji besar untuk memeriksa performa kueri daftar (F5): 2.000 siswa, 20.000 sesi, 1.000 post test dan
// sertifikat, 20.000 log. Semua siswa bernama "Uji Besar NNNN" agar mudah dikenali dan dihapus lagi.
// Pemakaian: npm run data:uji-besar            -> membuat data (dilewati bila sudah ada)
//            npm run data:uji-besar '--' --hapus -> menghapus semua data uji besar
// HANYA untuk database pengembangan.

/** Jumlah data yang dibuat. */
const JUMLAH = Object.freeze({ siswa: 2000, sesiPerSiswa: 10, log: 20000 });
/** Awalan nama siswa uji besar (penanda idempoten dan penghapusan). */
const AWALAN = 'Uji Besar ';
/** Banyaknya baris per INSERT. */
const UKURAN_BATCH = 1000;

/** Menyisipkan banyak baris sekaligus per batch (INSERT ... VALUES ?). */
async function sisipBanyak(conn, sql, baris) {
  for (let i = 0; i < baris.length; i += UKURAN_BATCH) await conn.query(sql, [baris.slice(i, i + UKURAN_BATCH)]);
}

/** Data acuan: level pertama beserta pertemuan 1-13, dan satu akun pengelola sebagai tutor/pencatat. */
async function acuan(conn) {
  const [[level]] = await conn.query('SELECT id, kode, nama FROM level ORDER BY urutan, kode LIMIT 1');
  const [[pengguna]] = await conn.query('SELECT id FROM pengguna ORDER BY created_at LIMIT 1');
  // tanpa level atau akun, data sesi tidak bisa dibuat
  if (!level || !pengguna) throw new Error('Jalankan npm run db:seed dan npm run admin:buat dulu.');
  const [pertemuan] = await conn.query('SELECT id, nomor FROM pertemuan WHERE level_id = ? ORDER BY nomor', [level.id]);
  return { level, pengguna, pertemuan };
}

/** Baris siswa, kode akses (siswa dan ortu), dan siswa_level berjalan. */
function barisSiswa(level) {
  const siswa = [];
  const kode = [];
  const sl = [];
  const terpakai = new Set();
  /** Kode acak yang belum dipakai di data ini (bentrok dengan data lama ditangkap UNIQUE saat INSERT). */
  const kodeBaru = () => {
    let k = buatKode();
    while (terpakai.has(k)) k = buatKode();
    terpakai.add(k);
    return k;
  };
  for (let i = 1; i <= JUMLAH.siswa; i += 1) {
    const id = buatId();
    siswa.push([id, `${AWALAN}${String(i).padStart(4, '0')}`, i % 10 === 0 ? 'nonaktif' : 'aktif']);
    kode.push([buatId(), id, 'siswa', kodeBaru()], [buatId(), id, 'ortu', kodeBaru()]);
    sl.push([buatId(), id, level.id]);
  }
  return { siswa, kode, sl };
}

/** Baris sesi selesai (pertemuan 1..n per siswa, tanggal mundur) dan tutornya. */
function barisSesi(siswa, sl, pertemuan, penggunaId) {
  const sesi = [];
  const tutor = [];
  siswa.forEach(([siswaId], i) => {
    for (let n = 0; n < JUMLAH.sesiPerSiswa; n += 1) {
      const id = buatId();
      const hari = (i + n * 7) % 365;
      sesi.push([id, siswaId, sl[i][0], pertemuan[n].id, hari, hari, hari, 'tuntas']);
      tutor.push([buatId(), id, penggunaId, n % 3 === 0 ? 'Catatan uji performa' : null]);
    }
  });
  return { sesi, tutor };
}

/** Membuat seluruh data uji besar dalam satu transaksi. */
async function buat(conn) {
  const [[ada]] = await conn.query('SELECT COUNT(*) AS n FROM siswa WHERE nama LIKE ?', [`${AWALAN}%`]);
  // sudah pernah dibuat: jangan menggandakan
  if (Number(ada.n) > 0) return console.log(`Data uji besar sudah ada (${ada.n} siswa). Hapus dulu dengan --hapus bila ingin membuat ulang.`);
  const { level, pengguna, pertemuan } = await acuan(conn);
  const { siswa, kode, sl } = barisSiswa(level);
  const { sesi, tutor } = barisSesi(siswa, sl, pertemuan, pengguna.id);
  await conn.beginTransaction();
  await sisipBanyak(conn, 'INSERT INTO siswa (id, nama, status, tanggal_daftar) VALUES ?', siswa.map(([id, nama, status]) => [id, nama, status, '2026-01-01']));
  await sisipBanyak(conn, 'INSERT INTO kode_akses (id, siswa_id, jenis, kode) VALUES ?', kode);
  await sisipBanyak(conn, "INSERT INTO siswa_level (id, siswa_id, level_id, status, mulai_at) VALUES ?", sl.map(([id, s, l]) => [id, s, l, 'berjalan', '2026-01-01']));
  // tanggal sesi: hari ke-n mundur dari hari ini; jam masuk 15.00, pulang 16.30
  await sisipBanyak(
    conn,
    'INSERT INTO sesi (id, siswa_id, siswa_level_id, pertemuan_id, tanggal, jam_masuk, jam_pulang, status, penuntasan_otomatis) VALUES ?',
    sesi.map(([id, s, slId, p, h1, h2, h3, pen]) => [id, s, slId, p, new Date(Date.now() - h1 * 864e5).toISOString().slice(0, 10), `${new Date(Date.now() - h2 * 864e5).toISOString().slice(0, 10)} 15:00:00`, `${new Date(Date.now() - h3 * 864e5).toISOString().slice(0, 10)} 16:30:00`, 'selesai', pen]),
  );
  await sisipBanyak(conn, 'INSERT INTO sesi_tutor (id, sesi_id, pengguna_id, catatan) VALUES ?', tutor);
  await buatPostTestSertifikat(conn, siswa, sl, sesi, level);
  const log = Array.from({ length: JUMLAH.log }, (_, i) => [buatId(), pengguna.id, i % 2 ? 'absen_masuk' : 'tutup_sesi', 'uji_besar', null, null]);
  await sisipBanyak(conn, 'INSERT INTO log_aktivitas (id, pengguna_id, aksi, entitas, entitas_id, detail) VALUES ?', log);
  await conn.commit();
  console.log(`Dibuat: ${siswa.length} siswa, ${sesi.length} sesi, ${log.length} log, post test dan sertifikat untuk separuh siswa.`);
}

/** Post test lulus dan sertifikat terbit untuk setiap siswa bernomor genap. */
async function buatPostTestSertifikat(conn, siswa, sl, sesi, level) {
  const pt = [];
  const sr = [];
  siswa.forEach(([siswaId, nama], i) => {
    if (i % 2) return;
    const id = buatId();
    const sesiId = sesi[i * JUMLAH.sesiPerSiswa][0];
    pt.push([id, sl[i][0], sesiId, 1, 'selesai', 2700, 2000, 80, 1]);
    sr.push([buatId(), siswaId, level.id, id, `UJI-${level.kode}-${String(i).padStart(6, '0')}`, buatKode(16), nama, `Level 1 - ${level.nama}`, 80]);
  });
  await sisipBanyak(conn, 'INSERT INTO post_test (id, siswa_level_id, sesi_id, percobaan_ke, status, durasi_detik, terpakai_detik, mulai_at, selesai_at, nilai_total, lulus) VALUES ?', pt.map((b) => [...b.slice(0, 7), '2026-06-01 10:00:00', '2026-06-01 10:40:00', b[7], b[8]]));
  await sisipBanyak(conn, 'INSERT INTO sertifikat (id, siswa_id, level_id, post_test_id, nomor, token_verifikasi, nama_siswa, nama_level, nilai_total) VALUES ?', sr);
}

/** Menghapus semua data uji besar (urutan sesuai komentar kepala schema.sql). */
async function hapus(conn) {
  const pilih = 'SELECT id FROM siswa WHERE nama LIKE ?';
  const p = [`${AWALAN}%`];
  await conn.beginTransaction();
  await conn.query(`DELETE FROM sertifikat WHERE siswa_id IN (${pilih})`, p);
  await conn.query(`DELETE FROM post_test WHERE siswa_level_id IN (SELECT id FROM siswa_level WHERE siswa_id IN (${pilih}))`, p);
  await conn.query(`DELETE FROM sesi WHERE siswa_id IN (${pilih})`, p);
  await conn.query(`DELETE FROM siswa_level WHERE siswa_id IN (${pilih})`, p);
  await conn.query(`DELETE FROM kode_akses WHERE siswa_id IN (${pilih})`, p);
  const [hasil] = await conn.query('DELETE FROM siswa WHERE nama LIKE ?', p);
  await conn.query("DELETE FROM log_aktivitas WHERE entitas = 'uji_besar'");
  await conn.commit();
  console.log(`Data uji besar dihapus (${hasil.affectedRows} siswa).`);
}

/** Membuat atau menghapus data uji besar sesuai argumen. */
async function main() {
  const conn = await bukaKoneksi();
  try {
    // --hapus: bersihkan data uji besar; tanpa argumen: buat
    if (process.argv.includes('--hapus')) await hapus(conn);
    else await buat(conn);
  } catch (error) {
    // gagal di tengah: batalkan agar tidak ada data setengah jadi
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('data:uji-besar gagal:', error.message);
  process.exit(1);
});
