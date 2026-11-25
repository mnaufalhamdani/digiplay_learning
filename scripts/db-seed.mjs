import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { bukaKoneksi } from './_koneksi.mjs';
import { buatId } from './_idGen.mjs';
import { validasiTemplate } from '../src/utils/templateValidasi.js';
import { penandaBerkasGambar } from '../src/utils/berkasGambar.js';
import { teksJson } from '../src/utils/json.js';
import {
  DAFTAR_PENILAIAN,
  JENIS_GAMBAR,
  JENIS_PERTEMUAN,
  JUMLAH_PERTEMUAN,
  KATEGORI_GAMBAR,
  NOMOR_POST_TEST,
  SUMBER_BAGIAN,
  TIPE_TEMPLATE,
  TOTAL_BOBOT_POST_TEST,
  TOTAL_BUTIR_POST_TEST,
} from '../src/enums/index.js';

// npm run db:seed  -> memuat level, pertemuan, bagian post test, template, bank teks mengetik, dan gambar.
// Idempoten: baris dicocokkan dengan kunci uniknya, jadi aman dijalankan berulang tanpa duplikat.
// Upsert penuh: baris yang sudah ada diperbarui dari berkas seed (termasuk template.aktif = 1),
// sehingga perubahan admin lewat halaman Level/Template ikut tertimpa saat seed dijalankan lagi.
// Penanda punya_* gambar selalu mengikuti berkas di disk.
// Jalankan lewat package.json (memakai --import ./scripts/_alias.mjs untuk alias @/ di src/).

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOLDER_GAMBAR = path.join(AKAR, 'public', 'aset', 'gambar');
const BERKAS_TEMPLATE = [1, 2, 3].map((n) => path.join(AKAR, 'seed', `template-level-${n}.json`));

/** Membaca berkas JSON dari jalur relatif root project. */
async function bacaJson(jalur) {
  return JSON.parse(await readFile(path.isAbsolute(jalur) ? jalur : path.join(AKAR, jalur), 'utf8'));
}

/** Pengurai CSV sederhana (RFC 4180): kolom berkutip boleh berisi koma, baris baru, dan "" sebagai kutip. */
function uraiCsv(teks) {
  const baris = [];
  let kolom = [];
  let isi = '';
  let dalamKutip = false;
  for (let i = 0; i < teks.length; i += 1) {
    const c = teks[i];
    if (dalamKutip && c === '"' && teks[i + 1] === '"') {
      // "" di dalam kutip = satu karakter kutip
      isi += '"';
      i += 1;
    } else if (c === '"') {
      // kutip tunggal membuka atau menutup kolom berkutip
      dalamKutip = !dalamKutip;
    } else if (!dalamKutip && c === ',') {
      kolom.push(isi);
      isi = '';
    } else if (!dalamKutip && c === '\n') {
      // akhir baris (CRLF: \r dibuang)
      kolom.push(isi.replace(/\r$/, ''));
      baris.push(kolom);
      kolom = [];
      isi = '';
    } else isi += c;
  }
  // baris terakhir tanpa baris baru di akhir berkas
  if (isi !== '' || kolom.length > 0) baris.push([...kolom, isi.replace(/\r$/, '')]);
  const [kepala, ...data] = baris.filter((b) => b.some((k) => k.trim() !== ''));
  return data.map((b) => Object.fromEntries(kepala.map((k, i) => [k.trim(), (b[i] ?? '').trim()])));
}

/** Membaca semua berkas seed dan memindai folder gambar. Belum menulis apa pun. */
async function bacaSeed() {
  const levelPertemuan = await bacaJson('seed/level-pertemuan.json');
  const template = await Promise.all(BERKAS_TEMPLATE.map(bacaJson));
  const csv = uraiCsv(await readFile(path.join(AKAR, 'docs', 'aset', 'prompt-gambar.csv'), 'utf8'));
  const gambar = await Promise.all(
    csv.map(async (b) => {
      const kode = b.kode.toLowerCase();
      return { kode, kategori: b.kategori, nama: b.nama_id, nama_en: b.nama_en || null, ...(await penandaBerkasGambar(FOLDER_GAMBAR, kode)) };
    }),
  );
  const pelajaran = (await bacaJson('seed/pelajaran-mengetik.json')).pelajaran ?? [];
  return { level: levelPertemuan.level ?? [], template, gambar, pelajaran };
}

/** Validasi level dan 13 pertemuannya. */
function validasiLevel(daftarLevel, galat) {
  const kode = new Set();
  for (const lv of daftarLevel) {
    if (!lv.kode || !lv.nama) galat.push(`Level tanpa kode/nama: ${JSON.stringify(lv).slice(0, 80)}`);
    if (kode.has(lv.kode)) galat.push(`Kode level ganda: ${lv.kode}`);
    kode.add(lv.kode);
    const nomor = (lv.pertemuan ?? []).map((p) => p.nomor);
    // tiap level wajib tepat 13 pertemuan bernomor 1-13
    if (nomor.length !== JUMLAH_PERTEMUAN || new Set(nomor).size !== JUMLAH_PERTEMUAN || nomor.some((n) => !Number.isInteger(n) || n < 1 || n > JUMLAH_PERTEMUAN))
      galat.push(`Level ${lv.kode}: pertemuan harus bernomor 1-${JUMLAH_PERTEMUAN} tanpa ganda.`);
    for (const p of lv.pertemuan ?? []) if (!JENIS_PERTEMUAN.includes(p.jenis ?? 'materi')) galat.push(`Level ${lv.kode} pertemuan ${p.nomor}: jenis "${p.jenis}" tidak dikenal.`);
  }
}

/** Validasi bagian post test satu level: kode unik, sumber valid, total butir 15 dan total bobot 100. */
function validasiBagian(kodeLevel, bagian, galat) {
  const kode = new Set();
  for (const b of bagian) {
    if (kode.has(b.kode)) galat.push(`${kodeLevel}: kode bagian ganda ${b.kode}`);
    kode.add(b.kode);
    if (!SUMBER_BAGIAN.includes(b.sumber)) galat.push(`${kodeLevel} bagian ${b.kode}: sumber "${b.sumber}" tidak dikenal.`);
  }
  const butir = bagian.reduce((n, b) => n + Number(b.jumlah_soal), 0);
  const bobot = bagian.reduce((n, b) => n + Number(b.bobot), 0);
  if (butir !== TOTAL_BUTIR_POST_TEST) galat.push(`${kodeLevel}: total jumlah_soal bagian ${butir}, harus ${TOTAL_BUTIR_POST_TEST}.`);
  if (Math.abs(bobot - TOTAL_BOBOT_POST_TEST) > 1e-9) galat.push(`${kodeLevel}: total bobot bagian ${bobot}, harus ${TOTAL_BOBOT_POST_TEST}.`);
}

/** Validasi satu template: rujukan pertemuan/bagian, ENUM, lalu validasiTemplate (render 50 kali). */
function validasiSatuTemplate(tpl, kodeBagian, gambarTersedia, galat) {
  const label = `${tpl.kode}`;
  if (!Number.isInteger(tpl.pertemuan) || tpl.pertemuan < 1 || tpl.pertemuan > JUMLAH_PERTEMUAN) galat.push(`${label}: pertemuan ${tpl.pertemuan} tidak valid.`);
  // soal post test wajib menunjuk bagian; latihan biasa tidak boleh punya bagian
  if (tpl.pertemuan === NOMOR_POST_TEST && !tpl.bagian) galat.push(`${label}: template pertemuan ${NOMOR_POST_TEST} wajib punya bagian.`);
  if (tpl.bagian && tpl.pertemuan !== NOMOR_POST_TEST) galat.push(`${label}: bagian hanya untuk pertemuan ${NOMOR_POST_TEST}.`);
  if (tpl.bagian && !kodeBagian.has(tpl.bagian)) galat.push(`${label}: bagian "${tpl.bagian}" tidak ada.`);
  if (!TIPE_TEMPLATE.includes(tpl.tipe)) galat.push(`${label}: tipe "${tpl.tipe}" tidak dikenal.`);
  if (!DAFTAR_PENILAIAN.includes(tpl.penilaian)) galat.push(`${label}: penilaian "${tpl.penilaian}" tidak dikenal.`);
  for (const pesan of validasiTemplate(tpl, gambarTersedia, randomInt)) galat.push(`${label}: ${pesan}`);
}

/** Validasi seluruh berkas template (kode unik lintas level, level ada, bagian, template, bank teks). */
function validasiTemplateSemua(data, gambarTersedia, galat) {
  const kodeLevel = new Set(data.level.map((l) => l.kode));
  const kodeTemplate = new Set();
  for (const berkas of data.template) {
    if (!kodeLevel.has(berkas.level)) galat.push(`Berkas template level "${berkas.level}" tidak ada di level-pertemuan.json.`);
    validasiBagian(berkas.level, berkas.bagian_post_test ?? [], galat);
    const kodeBagian = new Set((berkas.bagian_post_test ?? []).map((b) => b.kode));
    for (const tpl of berkas.template ?? []) {
      if (!tpl.kode || kodeTemplate.has(tpl.kode)) galat.push(`Kode template kosong atau ganda: ${tpl.kode}`);
      kodeTemplate.add(tpl.kode);
      validasiSatuTemplate(tpl, kodeBagian, gambarTersedia, galat);
    }
    for (const bt of berkas.bank_teks_mengetik ?? []) if (!bt.teks?.trim()) galat.push(`${berkas.level}: teks mengetik kosong.`);
  }
}

/** Validasi subjek gambar dari CSV. */
function validasiGambar(gambar, galat) {
  const kode = new Set();
  for (const g of gambar) {
    if (!g.kode || kode.has(g.kode)) galat.push(`Kode gambar kosong atau ganda: ${g.kode}`);
    kode.add(g.kode);
    if (!KATEGORI_GAMBAR.includes(g.kategori)) galat.push(`Gambar ${g.kode}: kategori "${g.kategori}" tidak dikenal.`);
    if (!g.nama) galat.push(`Gambar ${g.kode}: nama kosong.`);
  }
}

/** Bank gambar per jenis dari hasil pindai (dipakai validasi template ber-parameter gambar). */
function gambarTersediaDari(gambar) {
  return Object.fromEntries(JENIS_GAMBAR.map((jenis) => [jenis, gambar.filter((g) => g[`punya_${jenis}`]).map((g) => ({ kode: g.kode, nama: g.nama }))]));
}

/** Validasi pelajaran mengetik (Fase D1): kode unik, teks latihan ada, target masuk akal. */
function validasiPelajaran(pelajaran, galat) {
  const kode = new Set();
  for (const p of pelajaran) {
    if (!p.kode || kode.has(p.kode)) galat.push(`Kode pelajaran mengetik kosong atau ganda: ${p.kode}`);
    kode.add(p.kode);
    if (!p.nama || !p.teks_latihan?.trim()) galat.push(`Pelajaran ${p.kode}: nama dan teks_latihan wajib.`);
    if (!(Number(p.target_wpm) > 0) || !(Number(p.target_akurasi) > 0 && Number(p.target_akurasi) <= 100)) galat.push(`Pelajaran ${p.kode}: target_wpm/target_akurasi tidak valid.`);
  }
}

/** Menulis pelajaran mengetik (unik kode). */
async function tulisPelajaran(conn, pelajaran, statistik) {
  const kolom = ['kode', 'nama', 'urutan', 'tombol_fokus', 'teks_latihan', 'target_wpm', 'target_akurasi'];
  for (const p of pelajaran) await upsert(conn, statistik, 'pelajaran_mengetik', kolom, kolom.map((k) => p[k] ?? null), kolom.slice(1));
}

/** Menjalankan semua validasi; daftar galat kosong berarti aman ditulis. */
function validasiSemua(data) {
  const galat = [];
  validasiLevel(data.level, galat);
  validasiGambar(data.gambar, galat);
  validasiTemplateSemua(data, gambarTersediaDari(data.gambar), galat);
  validasiPelajaran(data.pelajaran, galat);
  return galat;
}

/** Bagian ON DUPLICATE KEY UPDATE: kolom yang diperbarui dari berkas seed bila barisnya sudah ada. */
function klausaTimpa(kolom) {
  return kolom.map((k) => `${k} = VALUES(${k})`).join(', ');
}

/** Upsert satu baris lalu mencatat statistiknya (affectedRows 1 = baru, 2 = diperbarui, 0 = tetap). */
async function upsert(conn, statistik, tabel, kolom, nilai, kolomTimpa) {
  const sql = `INSERT INTO ${tabel} (id, ${kolom.join(', ')}) VALUES (?${', ?'.repeat(kolom.length)}) ON DUPLICATE KEY UPDATE ${klausaTimpa(kolomTimpa)}`;
  const [hasil] = await conn.query(sql, [buatId(), ...nilai]);
  statistik[tabel] ??= { baru: 0, diperbarui: 0 };
  if (hasil.affectedRows === 1) statistik[tabel].baru += 1;
  else if (hasil.affectedRows === 2) statistik[tabel].diperbarui += 1;
}

/** Peta id: kunci gabungan -> id, dari hasil SELECT. */
async function petaId(conn, sql, kunci) {
  const [baris] = await conn.query(sql);
  return new Map(baris.map((b) => [kunci(b), b.id]));
}

/** Menulis level dan pertemuan. */
async function tulisLevel(conn, daftarLevel, statistik) {
  for (const lv of daftarLevel) await upsert(conn, statistik, 'level', ['kode', 'nama', 'urutan', 'deskripsi'], [lv.kode, lv.nama, lv.urutan ?? 0, lv.deskripsi ?? null], ['nama', 'urutan', 'deskripsi']);
  const idLevel = await petaId(conn, 'SELECT id, kode FROM level', (b) => b.kode);
  for (const lv of daftarLevel) {
    for (const p of lv.pertemuan) {
      const nilai = [idLevel.get(lv.kode), p.nomor, p.judul ?? '', p.jenis ?? 'materi', p.tujuan ?? null];
      await upsert(conn, statistik, 'pertemuan', ['level_id', 'nomor', 'judul', 'jenis', 'tujuan'], nilai, ['judul', 'jenis', 'tujuan']);
    }
  }
  return idLevel;
}

/** Menulis bagian post test semua level. */
async function tulisBagian(conn, berkasTemplate, idLevel, statistik) {
  const kolom = ['level_id', 'kode', 'nama', 'bobot', 'sumber', 'jumlah_soal', 'target_wpm', 'urutan'];
  for (const berkas of berkasTemplate) {
    for (const b of berkas.bagian_post_test ?? []) {
      const nilai = [idLevel.get(berkas.level), b.kode, b.nama, b.bobot, b.sumber, b.jumlah_soal, b.target_wpm ?? null, b.urutan ?? 0];
      await upsert(conn, statistik, 'bagian_post_test', kolom, nilai, kolom.slice(2));
    }
  }
}

/** Menulis template dan bank teks mengetik semua level. */
async function tulisTemplate(conn, berkasTemplate, idLevel, statistik) {
  const idPertemuan = await petaId(conn, 'SELECT id, level_id, nomor FROM pertemuan', (b) => `${b.level_id}-${b.nomor}`);
  const idBagian = await petaId(conn, 'SELECT id, level_id, kode FROM bagian_post_test', (b) => `${b.level_id}-${b.kode}`);
  const kolom = ['pertemuan_id', 'bagian_id', 'kode', 'tipe', 'penilaian', 'kesulitan', 'teks', 'parameter', 'opsi', 'kunci', 'aktif'];
  for (const berkas of berkasTemplate) {
    const levelId = idLevel.get(berkas.level);
    for (const tpl of berkas.template) {
      const bagianId = tpl.bagian ? idBagian.get(`${levelId}-${tpl.bagian}`) : null;
      const nilai = [idPertemuan.get(`${levelId}-${tpl.pertemuan}`), bagianId, tpl.kode, tpl.tipe, tpl.penilaian, tpl.kesulitan ?? 1, tpl.teks, teksJson(tpl.parameter), teksJson(tpl.opsi), teksJson(tpl.kunci), 1];
      await upsert(conn, statistik, 'template', kolom, nilai, kolom.filter((k) => k !== 'kode'));
    }
    await tulisBankTeks(conn, levelId, berkas.bank_teks_mengetik ?? [], statistik);
  }
}

/** Menyisipkan teks mengetik bila pasangan level_id + teks belum ada (tabel ini tanpa kunci unik). */
async function tulisBankTeks(conn, levelId, daftar, statistik) {
  statistik.bank_teks_mengetik ??= { baru: 0, diperbarui: 0 };
  for (const bt of daftar) {
    const [ada] = await conn.query('SELECT id FROM bank_teks_mengetik WHERE level_id = ? AND teks = ? LIMIT 1', [levelId, bt.teks]);
    // teks yang sama sudah ada di level ini: lewati agar tidak dobel
    if (ada.length > 0) continue;
    const jumlahKata = bt.jumlah_kata ?? bt.teks.trim().split(/\s+/).length;
    await conn.query('INSERT INTO bank_teks_mengetik (id, level_id, teks, jumlah_kata, kesulitan) VALUES (?, ?, ?, ?, ?)', [buatId(), levelId, bt.teks, jumlahKata, bt.kesulitan ?? 1]);
    statistik.bank_teks_mengetik.baru += 1;
  }
}

/** Menulis subjek gambar; penanda punya_* selalu diperbarui dari hasil pindai berkas. */
async function tulisGambar(conn, gambar, statistik) {
  const kolom = ['kode', 'kategori', 'nama', 'nama_en', 'punya_mewarnai', 'punya_berwarna', 'punya_puzzle'];
  const penanda = ['punya_mewarnai', 'punya_berwarna', 'punya_puzzle'];
  statistik.gambar ??= { baru: 0, diperbarui: 0 };
  for (const g of gambar) {
    const sql = `INSERT INTO gambar (id, ${kolom.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ${klausaTimpa(['kategori', 'nama', 'nama_en', ...penanda])}`;
    const [hasil] = await conn.query(sql, [buatId(), ...kolom.map((k) => g[k])]);
    if (hasil.affectedRows === 1) statistik.gambar.baru += 1;
    else if (hasil.affectedRows === 2) statistik.gambar.diperbarui += 1;
  }
}

/** Pengaturan yang ditambahkan setelah schema.sql awal (Fase C dan E). INSERT IGNORE: nilai yang sudah diubah admin tidak ditimpa. */
const PENGATURAN_TAMBAHAN = [
  ['jumlah_tugas_per_sesi', '6'],
  ['penandatangan_nama', ''],
  ['penandatangan_jabatan', ''],
];

/** Menyisipkan kunci pengaturan tambahan bila belum ada, termasuk rubrik_bawaan dari rubrik_default berkas seed template. */
async function tulisPengaturan(conn, berkasTemplate) {
  const rubrik = berkasTemplate.find((b) => Array.isArray(b.rubrik_default))?.rubrik_default;
  // berkas seed tanpa rubrik_default: lewati, aplikasi memakai konstanta RUBRIK_BAWAAN
  const daftar = rubrik ? [...PENGATURAN_TAMBAHAN, ['rubrik_bawaan', JSON.stringify(rubrik)]] : PENGATURAN_TAMBAHAN;
  for (const [kunci, nilai] of daftar) await conn.query('INSERT IGNORE INTO pengaturan (kunci, nilai) VALUES (?, ?)', [kunci, nilai]);
}

/** Mencetak ringkasan isi tabel setelah seed beserta angka yang diharapkan. */
async function cetakRingkasan(conn, statistik) {
  const harapan = { level: 3, pertemuan: 39, bagian_post_test: 14, template: 407, bank_teks_mengetik: 48, gambar: 75, pelajaran_mengetik: 12 };
  console.log('\nRingkasan seed:');
  for (const [tabel, n] of Object.entries(harapan)) {
    const [[baris]] = await conn.query(`SELECT COUNT(*) AS n FROM ${tabel}`);
    const s = statistik[tabel] ?? { baru: 0, diperbarui: 0 };
    const tanda = Number(baris.n) === n ? 'OK' : `diharapkan ${n}`;
    console.log(`  ${tabel.padEnd(20)} ${String(baris.n).padStart(4)}  (baru ${s.baru}, diperbarui ${s.diperbarui})  ${tanda}`);
  }
}

/** Alur utama: baca, validasi semua (tanpa menulis bila ada galat), lalu tulis dalam satu transaksi. */
async function main() {
  const data = await bacaSeed();
  const galat = validasiSemua(data);
  // jangan menulis sebagian: hentikan sebelum menyentuh database
  if (galat.length > 0) {
    console.error(`Seed dibatalkan, ${galat.length} galat:`);
    for (const g of galat) console.error(`  - ${g}`);
    process.exit(1);
  }
  const conn = await bukaKoneksi({ barisBerubah: true });
  const statistik = {};
  try {
    await conn.beginTransaction();
    const idLevel = await tulisLevel(conn, data.level, statistik);
    await tulisBagian(conn, data.template, idLevel, statistik);
    await tulisTemplate(conn, data.template, idLevel, statistik);
    await tulisGambar(conn, data.gambar, statistik);
    await tulisPengaturan(conn, data.template);
    await tulisPelajaran(conn, data.pelajaran, statistik);
    await conn.commit();
    await cetakRingkasan(conn, statistik);
  } catch (error) {
    // satu gagal: batalkan semua agar database tidak setengah terisi
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('db:seed gagal:', error.message);
  process.exit(1);
});
