import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { bukaKoneksi } from './_koneksi.mjs';
import { buatId } from './_idGen.mjs';
import { hashPassword } from '../src/utils/kripto.js';

/** Pola email sederhana (validasi lengkap ada di aplikasi). */
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Membaca argumen --email, --nama, --password; yang kosong ditanyakan secara interaktif. */
async function bacaMasukan() {
  const { values } = parseArgs({ options: { email: { type: 'string' }, nama: { type: 'string' }, password: { type: 'string' } } });
  const kurang = ['email', 'nama', 'password'].filter((k) => !values[k]);
  // semua argumen sudah ada: tidak perlu bertanya
  if (kurang.length === 0) return values;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (const k of kurang) values[k] = await rl.question(`${k}: `);
  } finally {
    rl.close();
  }
  return values;
}

/** Memeriksa masukan; mengembalikan pesan galat pertama atau null bila valid. */
function periksa({ email, nama, password }) {
  if (!POLA_EMAIL.test(email)) return 'Email tidak valid.';
  if (!nama.trim()) return 'Nama wajib diisi.';
  if (password.length < 8) return 'Password minimal 8 karakter.';
  return null;
}

/** Membuat akun admin pertama; menolak bila email sudah dipakai. */
async function main() {
  const masukan = await bacaMasukan();
  const email = masukan.email.trim().toLowerCase();
  const galat = periksa({ ...masukan, email });
  if (galat) throw new Error(galat);
  const conn = await bukaKoneksi();
  try {
    const [ada] = await conn.query('SELECT id FROM pengguna WHERE email = ?', [email]);
    // email unik: jangan menimpa akun yang sudah ada
    if (ada.length > 0) throw new Error(`Email ${email} sudah terdaftar.`);
    await conn.query("INSERT INTO pengguna (id, nama, email, password_hash, peran) VALUES (?, ?, ?, ?, 'admin')", [
      buatId(),
      masukan.nama.trim(),
      email,
      await hashPassword(masukan.password),
    ]);
    console.log(`Admin ${email} berhasil dibuat.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('admin:buat gagal:', error.message);
  process.exit(1);
});
