import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bukaKoneksi, NAMA_DB } from './_koneksi.mjs';

const lokasiSchema = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'schema.sql');

/** Mengecek apakah tabel `pengaturan` sudah ada (tanda skema sudah terpasang). */
async function skemaSudahAda(conn) {
  const [baris] = await conn.query(
    'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
    [NAMA_DB, 'pengaturan'],
  );
  return Number(baris[0].n) > 0;
}

/**
 * Perubahan skema setelah rilis awal schema.sql, untuk database yang sudah terpasang.
 * Tiap butir hanya menambah (tidak menghapus data) dan dilewati bila kolomnya sudah ada.
 */
const PEMBARUAN_KOLOM = [
  // Fase D2: bagian yang diulang pada tes ulang post test
  { tabel: 'post_test', kolom: 'bagian_ulang', definisi: 'JSON NULL AFTER dibuka_oleh' },
  // Coding Zippy: labirin yang diselesaikan (definisi memuat FK; tabel labirin_blockly dibuat lebih dulu oleh perbaruiTabel)
  { tabel: 'hasil_latihan', kolom: 'labirin_id', definisi: 'BIGINT UNSIGNED NULL AFTER gambar_id, ADD CONSTRAINT fk_hasil_latihan_labirin FOREIGN KEY (labirin_id) REFERENCES labirin_blockly (id) ON DELETE SET NULL' },
];

/**
 * Nilai ENUM baru pada kolom yang sudah ada (Coding Zippy). `definisi` adalah definisi kolom lengkap setelah perubahan;
 * dilewati bila `nilai` sudah ada di tipe kolom. Hanya menambah nilai, jadi data lama tetap sah.
 */
const PEMBARUAN_ENUM = [
  { tabel: 'template', kolom: 'tipe', nilai: 'blockly', definisi: "ENUM('mengetik','pilihan_ganda','excel','word','powerpoint','paint','scratch','coding','game_mouse','puzzle','blockly','lainnya') NOT NULL" },
  // Studio Zippy: tipe tugas proyek bebas yang dinilai tutor
  { tabel: 'template', kolom: 'tipe', nilai: 'coding_proyek', definisi: "ENUM('mengetik','pilihan_ganda','excel','word','powerpoint','paint','scratch','coding','game_mouse','puzzle','blockly','coding_proyek','lainnya') NOT NULL" },
  { tabel: 'hasil_latihan', kolom: 'jenis', nilai: 'blockly', definisi: "ENUM('mouse_klik','mouse_klik_ganda','mouse_drag','mouse_klik_kanan','mouse_scroll','puzzle','blockly') NOT NULL" },
];

/** Tabel baru setelah rilis awal (fitur materi, Coding Zippy, dan Studio Zippy); definisinya diambil dari blok CREATE TABLE di schema.sql. Dilewati bila sudah ada. */
const PEMBARUAN_TABEL = ['materi', 'materi_baca', 'labirin_blockly', 'proyek_coding', 'proyek_kiriman', 'kostum_unggahan'];

/** Indeks baru setelah rilis awal (Fase F, hasil EXPLAIN pada data uji besar); dilewati bila sudah ada. */
const PEMBARUAN_INDEKS = [
  { tabel: 'siswa', indeks: 'idx_siswa_dibuat', kolom: 'created_at' },
  { tabel: 'sesi', indeks: 'idx_sesi_status', kolom: 'status, jam_masuk' },
  { tabel: 'post_test', indeks: 'idx_post_test_status', kolom: 'status, nilai_total' },
  { tabel: 'sertifikat', indeks: 'idx_sertifikat_waktu', kolom: 'diterbitkan_at' },
  { tabel: 'sertifikat', indeks: 'idx_sertifikat_status_waktu', kolom: 'status, diterbitkan_at' },
  { tabel: 'karya', indeks: 'idx_karya_waktu', kolom: 'created_at' },
];

/** Menambahkan indeks dari PEMBARUAN_INDEKS yang belum ada; mengembalikan daftar indeks yang ditambahkan. */
async function perbaruiIndeks(conn) {
  const ditambah = [];
  for (const p of PEMBARUAN_INDEKS) {
    const [baris] = await conn.query('SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?', [NAMA_DB, p.tabel, p.indeks]);
    // indeks sudah ada (database baru dari schema.sql terbaru, atau pembaruan sudah pernah dijalankan)
    if (Number(baris[0].n) > 0) continue;
    await conn.query(`ALTER TABLE \`${NAMA_DB}\`.\`${p.tabel}\` ADD INDEX \`${p.indeks}\` (${p.kolom})`);
    ditambah.push(`${p.tabel}.${p.indeks}`);
  }
  return ditambah;
}

/** Menambah nilai ENUM dari PEMBARUAN_ENUM yang belum ada pada tipe kolomnya; mengembalikan daftar kolom yang diubah. */
async function perbaruiEnum(conn) {
  const diubah = [];
  for (const p of PEMBARUAN_ENUM) {
    const [baris] = await conn.query('SELECT column_type AS tipe FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [NAMA_DB, p.tabel, p.kolom]);
    // nilai sudah ada (database baru dari schema.sql terbaru, atau pembaruan sudah pernah dijalankan)
    if (baris[0]?.tipe?.includes(`'${p.nilai}'`)) continue;
    await conn.query(`ALTER TABLE \`${NAMA_DB}\`.\`${p.tabel}\` MODIFY COLUMN \`${p.kolom}\` ${p.definisi}`);
    diubah.push(`${p.tabel}.${p.kolom}='${p.nilai}'`);
  }
  return diubah;
}

/** Menambahkan kolom baru dari PEMBARUAN_KOLOM yang belum ada; mengembalikan daftar kolom yang ditambahkan. */
async function perbaruiSkema(conn) {
  const ditambah = [];
  for (const p of PEMBARUAN_KOLOM) {
    const [baris] = await conn.query(
      'SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?',
      [NAMA_DB, p.tabel, p.kolom],
    );
    // kolom sudah ada (database baru dari schema.sql terbaru, atau pembaruan sudah pernah dijalankan)
    if (Number(baris[0].n) > 0) continue;
    await conn.query(`ALTER TABLE \`${NAMA_DB}\`.\`${p.tabel}\` ADD COLUMN \`${p.kolom}\` ${p.definisi}`);
    ditambah.push(`${p.tabel}.${p.kolom}`);
  }
  return ditambah;
}

/** Membuat tabel dari PEMBARUAN_TABEL yang belum ada, memakai blok CREATE TABLE-nya di schema.sql; mengembalikan daftar tabel yang dibuat. */
async function perbaruiTabel(conn) {
  const sql = await readFile(lokasiSchema, 'utf8');
  const dibuat = [];
  for (const nama of PEMBARUAN_TABEL) {
    const [baris] = await conn.query('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?', [NAMA_DB, nama]);
    // tabel sudah ada (database baru dari schema.sql terbaru, atau pembaruan sudah pernah dijalankan)
    if (Number(baris[0].n) > 0) continue;
    // blok dari "CREATE TABLE <nama> (" sampai penutup ") ENGINE=InnoDB;" pertama setelahnya
    const awal = sql.indexOf(`CREATE TABLE ${nama} (`);
    const akhir = awal < 0 ? -1 : sql.indexOf(') ENGINE=InnoDB;', awal);
    if (akhir < 0) throw new Error(`Definisi tabel ${nama} tidak ditemukan di schema.sql.`);
    await conn.query(`USE \`${NAMA_DB}\``);
    await conn.query(sql.slice(awal, akhir + ') ENGINE=InnoDB;'.length));
    dibuat.push(nama);
  }
  return dibuat;
}

/** Menjalankan schema.sql apa adanya (membuat database dan 31 tabel), atau menambah tabel/kolom/indeks baru bila skema sudah terpasang. */
async function main() {
  // schema.sql memakai nama database tetap; DB_NAME lain akan membuat aplikasi membaca database kosong
  if (NAMA_DB !== 'digiplay_learning') console.warn(`Peringatan: schema.sql membuat database "digiplay_learning", sedangkan DB_NAME="${NAMA_DB}".`);
  const conn = await bukaKoneksi({ pakaiDb: false, multi: true });
  try {
    // skema sudah ada: jangan dijalankan lagi (CREATE TABLE tanpa IF NOT EXISTS akan gagal), cukup tambahkan kolom baru
    if (await skemaSudahAda(conn)) {
      // tabel dibuat lebih dulu (kolom/indeks baru bisa saja menyentuh tabel baru di masa depan)
      const ditambah = [...(await perbaruiTabel(conn)), ...(await perbaruiSkema(conn)), ...(await perbaruiEnum(conn)), ...(await perbaruiIndeks(conn))];
      // tidak ada tabel/kolom/indeks baru: database sudah sesuai schema.sql terbaru
      if (ditambah.length === 0) console.log(`Skema ${NAMA_DB} sudah terpasang dan terbaru, db:init dilewati. Data tidak diubah.`);
      else console.log(`Skema ${NAMA_DB} diperbarui, tabel/kolom/indeks baru: ${ditambah.join(', ')}. Data lama tidak diubah.`);
      return;
    }
    await conn.query(await readFile(lokasiSchema, 'utf8'));
    const [tabel] = await conn.query('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?', [NAMA_DB]);
    console.log(`Skema ${NAMA_DB} berhasil dibuat dari schema.sql (${tabel[0].n} tabel).`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('db:init gagal:', error.message);
  process.exit(1);
});
