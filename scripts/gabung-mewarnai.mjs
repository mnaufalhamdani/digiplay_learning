#!/usr/bin/env node
// Penggabung gambar mewarnai DigiPlay Learning.
// Untuk tiap folder subjek di aset/gambar/<kode>/ skrip ini membuat mewarnai.png dari
// outline.png (besar) + berwarna.png (contoh kecil di pojok kiri bawah).
//
// Tata letak bawaan ("pita"): gambar outline utuh di atas, lalu pita putih di bawahnya yang
// berisi contoh berwarna di sisi kiri. Contoh TIDAK menimpa gambar sehingga aman untuk outline apa pun.
// Tata letak lama ("tumpuk", opsi --tumpuk): contoh ditempel di atas pojok kiri bawah outline;
// hanya cocok bila pojok itu memang kosong.
//
// Pemakaian (dari akar project):
//   npm i -D sharp
//   node scripts/gabung-mewarnai.mjs                  proses semua subjek yang belum punya mewarnai.png
//   node scripts/gabung-mewarnai.mjs --hanya hwn-01   hanya satu subjek
//   node scripts/gabung-mewarnai.mjs --paksa          timpa mewarnai.png yang sudah ada
//   node scripts/gabung-mewarnai.mjs --tumpuk         tata letak tumpuk (contoh menimpa pojok gambar)
//   node scripts/gabung-mewarnai.mjs --uji            hanya tampilkan rencana, tidak menulis file
//   node scripts/gabung-mewarnai.mjs --akar <folder>  ganti folder gambar (bawaan: public/aset/gambar)

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const AKAR_BAWAAN = 'public/aset/gambar';
const SKALA_CONTOH = 0.24; // lebar contoh berwarna terhadap lebar gambar mewarnai
const SKALA_JARAK = 0.02; // jarak kotak contoh dari tepi (dan tinggi ruang kosong di pita)
const SKALA_PADDING = 0.012; // ruang putih di dalam kotak contoh
const BATAS_UKURAN_KB = 500; // peringatan bila hasil lebih besar dari ini

/**
 * Membaca argumen baris perintah menjadi objek opsi.
 * @param {string[]} argv daftar argumen setelah nama skrip
 * @returns {{akar: string, hanya: string|null, paksa: boolean, uji: boolean, tumpuk: boolean}}
 */
export function bacaArgumen(argv) {
  const opsi = { akar: AKAR_BAWAAN, hanya: null, paksa: false, uji: false, tumpuk: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--paksa') {
      opsi.paksa = true; // timpa file hasil yang sudah ada
    } else if (a === '--uji') {
      opsi.uji = true; // simulasi saja
    } else if (a === '--tumpuk') {
      opsi.tumpuk = true; // pakai tata letak lama
    } else if (a === '--hanya' || a === '--akar') {
      const nilai = argv[++i];
      // opsi yang butuh nilai wajib diikuti nilai, jangan diam-diam memakai opsi berikutnya
      if (!nilai || nilai.startsWith('--')) throw new Error(`Opsi ${a} membutuhkan nilai.`);
      if (a === '--hanya') opsi.hanya = nilai;
      else opsi.akar = nilai;
    } else {
      throw new Error(`Argumen tidak dikenal: ${a}`);
    }
  }
  return opsi;
}

/**
 * Membuat penggabung dengan dependency yang disuntikkan (sharp, fs, path).
 * @param {{sharp: Function, fs: object, path: object}} deps
 */
export function buatPenggabung({ sharp, fs, path }) {
  /**
   * Mengecek apakah sebuah file ada.
   * @param {string} file path file
   * @returns {Promise<boolean>}
   */
  async function adaFile(file) {
    try {
      await fs.access(file);
      return true;
    } catch {
      return false; // file tidak ada atau tidak bisa dibaca
    }
  }

  /**
   * Mengambil waktu terakhir file diubah (milidetik).
   * @param {string} file path file
   * @returns {Promise<number>}
   */
  async function waktuUbah(file) {
    return (await fs.stat(file)).mtimeMs;
  }

  /**
   * Mendaftar kode subjek (nama folder) yang akan diproses.
   * @param {string} akar folder gambar
   * @param {string|null} hanya kode tunggal bila dibatasi
   * @returns {Promise<string[]>}
   */
  async function daftarSubjek(akar, hanya) {
    const isi = await fs.readdir(akar, { withFileTypes: true });
    const kode = isi.filter((e) => e.isDirectory()).map((e) => e.name).sort();
    if (!hanya) return kode;
    // bila dibatasi, pastikan kodenya benar-benar ada agar salah ketik langsung ketahuan
    if (!kode.includes(hanya)) throw new Error(`Folder subjek tidak ditemukan: ${hanya}`);
    return [hanya];
  }

  /**
   * Menentukan apa yang dilakukan pada satu subjek.
   * @param {string} folder folder subjek
   * @param {boolean} paksa timpa hasil yang sudah ada
   * @returns {Promise<'buat'|'lewati'|'tidak-lengkap'>}
   */
  async function tentukanAksi(folder, paksa) {
    const outline = path.join(folder, 'outline.png');
    const berwarna = path.join(folder, 'berwarna.png');
    const hasil = path.join(folder, 'mewarnai.png');

    // bahan belum lengkap: jangan gagal, cukup dilaporkan
    if (!(await adaFile(outline)) || !(await adaFile(berwarna))) return 'tidak-lengkap';

    if (paksa || !(await adaFile(hasil))) return 'buat';

    // hasil sudah ada: buat ulang hanya bila salah satu bahan lebih baru darinya
    const [tOutline, tBerwarna, tHasil] = await Promise.all([
      waktuUbah(outline),
      waktuUbah(berwarna),
      waktuUbah(hasil),
    ]);
    return tOutline > tHasil || tBerwarna > tHasil ? 'buat' : 'lewati';
  }

  /**
   * Membuat SVG kotak putih bersudut membulat dengan garis tepi tipis.
   * @param {number} sisi panjang sisi kotak persegi (px)
   * @param {number} radius lengkung sudut (px)
   * @returns {Buffer}
   */
  function svgKotak(sisi, radius) {
    const garis = 3;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${sisi}" height="${sisi}">` +
      `<rect x="${garis / 2}" y="${garis / 2}" width="${sisi - garis}" height="${sisi - garis}" ` +
      `rx="${radius}" ry="${radius}" fill="#ffffff" stroke="#9aa0a6" stroke-width="${garis}"/></svg>`;
    return Buffer.from(svg);
  }

  /**
   * Menghitung ukuran semua bagian tata letak dari ukuran outline.
   * @param {number} lebar lebar outline (px)
   * @param {number} tinggi tinggi outline (px)
   * @returns {{lebarContoh: number, padding: number, kotak: number, jarak: number, tinggi: number}}
   */
  function hitungUkuran(lebar, tinggi) {
    const lebarContoh = Math.round(lebar * SKALA_CONTOH);
    const padding = Math.round(lebar * SKALA_PADDING);
    return {
      lebarContoh,
      padding,
      kotak: lebarContoh + padding * 2,
      jarak: Math.round(lebar * SKALA_JARAK),
      tinggi,
    };
  }

  /**
   * Menyiapkan contoh berwarna: persegi dengan latar putih agar proporsinya tetap utuh.
   * @param {string} berwarna path berwarna.png
   * @param {number} sisi panjang sisi contoh (px)
   * @returns {Promise<Buffer>}
   */
  function siapkanContoh(berwarna, sisi) {
    return sharp(berwarna)
      .resize({ width: sisi, height: sisi, fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer();
  }

  /**
   * Menggabungkan outline.png dan berwarna.png dalam satu folder menjadi mewarnai.png.
   * @param {string} folder folder subjek
   * @param {boolean} tumpuk true = contoh menimpa pojok gambar, false = contoh di pita bawah
   * @returns {Promise<{ukuranKB: number}>}
   */
  async function gabungSatu(folder, tumpuk) {
    const outline = path.join(folder, 'outline.png');
    const hasil = path.join(folder, 'mewarnai.png');

    const meta = await sharp(outline).metadata();
    const u = hitungUkuran(meta.width, meta.height);
    const contoh = await siapkanContoh(path.join(folder, 'berwarna.png'), u.lebarContoh);
    // buang transparansi agar Fill di Paint tidak bocor
    const gambar = await sharp(outline).flatten({ background: '#ffffff' }).png().toBuffer();

    const kiri = u.jarak;
    // tumpuk: kotak menempel di atas pojok kiri bawah; pita: kotak di bawah gambar, di dalam pita baru
    const atas = tumpuk ? u.tinggi - u.jarak - u.kotak : u.tinggi + u.jarak;
    if (atas < 0) throw new Error(`gambar terlalu kecil (${meta.width}x${meta.height})`);

    const tinggiAkhir = tumpuk ? u.tinggi : u.tinggi + u.kotak + u.jarak * 2;
    await sharp({ create: { width: meta.width, height: tinggiAkhir, channels: 3, background: '#ffffff' } })
      .composite([
        { input: gambar, left: 0, top: 0 },
        { input: svgKotak(u.kotak, Math.round(u.padding * 1.5)), left: kiri, top: atas },
        { input: contoh, left: kiri + u.padding, top: atas + u.padding },
      ])
      .png({ compressionLevel: 9 })
      .toFile(hasil);

    const { size } = await fs.stat(hasil);
    return { ukuranKB: Math.round(size / 1024) };
  }

  return { daftarSubjek, tentukanAksi, gabungSatu };
}

/**
 * Menjalankan seluruh proses dan mencetak ringkasannya.
 * @param {string[]} argv argumen CLI
 * @param {{sharp: Function, fs: object, path: object, log: Function}} deps dependency
 * @returns {Promise<number>} kode keluar (0 = sukses, 1 = ada yang gagal)
 */
export async function jalankan(argv, deps) {
  const { log } = deps;
  const opsi = bacaArgumen(argv);
  const penggabung = buatPenggabung(deps);
  const kodeSubjek = await penggabung.daftarSubjek(opsi.akar, opsi.hanya);

  const ringkas = { dibuat: 0, dilewati: 0, tidakLengkap: [], gagal: [], besar: [] };
  for (const kode of kodeSubjek) {
    const folder = deps.path.join(opsi.akar, kode);
    const aksi = await penggabung.tentukanAksi(folder, opsi.paksa);

    if (aksi === 'tidak-lengkap') {
      ringkas.tidakLengkap.push(kode);
      continue;
    }
    if (aksi === 'lewati') {
      ringkas.dilewati++;
      continue;
    }
    if (opsi.uji) {
      log(`[uji] akan dibuat: ${kode}/mewarnai.png`);
      ringkas.dibuat++;
      continue;
    }

    try {
      const { ukuranKB } = await penggabung.gabungSatu(folder, opsi.tumpuk);
      ringkas.dibuat++;
      log(`dibuat: ${kode}/mewarnai.png (${ukuranKB} KB)`);
      // file besar memperlambat unduhan di kelas, cukup diberi peringatan
      if (ukuranKB > BATAS_UKURAN_KB) ringkas.besar.push(`${kode} (${ukuranKB} KB)`);
    } catch (err) {
      // satu subjek gagal tidak boleh menghentikan subjek lain
      ringkas.gagal.push(`${kode}: ${err.message}`);
    }
  }

  log('');
  log(`Selesai. Dibuat: ${ringkas.dibuat}, dilewati: ${ringkas.dilewati}, ` +
      `bahan tidak lengkap: ${ringkas.tidakLengkap.length}, gagal: ${ringkas.gagal.length}`);
  if (ringkas.tidakLengkap.length) log(`Tidak lengkap (butuh outline.png dan berwarna.png): ${ringkas.tidakLengkap.join(', ')}`);
  if (ringkas.besar.length) log(`Lebih dari ${BATAS_UKURAN_KB} KB, pertimbangkan dikompres: ${ringkas.besar.join(', ')}`);
  if (ringkas.gagal.length) log(`Gagal:\n  ${ringkas.gagal.join('\n  ')}`);
  return ringkas.gagal.length ? 1 : 0;
}

// Titik masuk: hanya berjalan saat file ini dieksekusi langsung (bukan saat di-import).
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  jalankan(process.argv.slice(2), { sharp, fs, path, log: console.log })
    .then((kode) => process.exit(kode))
    .catch((err) => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
}
