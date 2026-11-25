// Tanpa 'server-only' dan alias @/ agar bisa dipakai juga oleh skrip Node (admin:buat).
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { keamananConfig } from '../config/keamanan.config.js';

const scryptAsync = promisify(scrypt);

/** Parameter scrypt (bawaan Node, setara rekomendasi OWASP untuk hash password). */
const SCRYPT = Object.freeze({ N: 16384, r: 8, p: 1, panjang: 64, panjangSalt: 16 });

/** Membandingkan dua Buffer dengan waktu konstan; panjang berbeda langsung dianggap tidak sama. */
function samaAman(a, b) {
  // timingSafeEqual melempar error bila panjang berbeda; panjang bukan rahasia jadi boleh dicek dulu
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Membuat hash password: format `scrypt$N$r$p$salt$hash` (base64url) agar parameter tersimpan bersama hash. */
export async function hashPassword(password) {
  const salt = randomBytes(SCRYPT.panjangSalt);
  const hash = await scryptAsync(password, salt, SCRYPT.panjang, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

/** Memeriksa password terhadap hash tersimpan; format tidak dikenal dianggap tidak cocok. */
export async function cocokPassword(password, hashTersimpan) {
  const bagian = String(hashTersimpan ?? '').split('$');
  // hash rusak atau algoritma lain: tolak tanpa melempar error
  if (bagian.length !== 6 || bagian[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = bagian;
  const harapan = Buffer.from(hashB64, 'base64url');
  const hasil = await scryptAsync(password, Buffer.from(saltB64, 'base64url'), harapan.length, { N: Number(N), r: Number(r), p: Number(p) });
  return samaAman(hasil, harapan);
}

/** Hash SHA-256 dalam hex (64 karakter), dipakai untuk menyimpan token login siswa. */
export function sha256(teks) {
  return createHash('sha256').update(teks).digest('hex');
}

/** Token acak (hex) dengan panjang byte dari konfigurasi keamanan. */
export function tokenAcak(panjangByte = keamananConfig.panjangTokenByte) {
  return randomBytes(panjangByte).toString('hex');
}

/** Mengambil SESSION_SECRET; melempar error bila kosong/pendek agar cookie tidak pernah ditandatangani dengan rahasia lemah. */
function ambilSecret() {
  const secret = process.env.SESSION_SECRET ?? '';
  // pemeriksaan ganda selain di next.config.mjs, untuk berjaga bila env berubah saat runtime
  if (secret.length < keamananConfig.minPanjangSecret) throw new Error('SESSION_SECRET belum diatur dengan benar.');
  return secret;
}

/** Tanda tangan HMAC-SHA256 (base64url) untuk sebuah teks. */
function tandaTangan(teks) {
  return createHmac('sha256', ambilSecret()).update(teks).digest('base64url');
}

/** Membuat nilai cookie bertanda tangan: `<payload base64url>.<hmac>`. */
export function tandatanganiPayload(payload) {
  const isi = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${isi}.${tandaTangan(isi)}`;
}

/**
 * Membaca nilai cookie bertanda tangan. Mengembalikan payload bila tanda tangan cocok dan
 * belum kedaluwarsa (`exp` dalam milidetik); selain itu null.
 */
export function bacaPayloadBertanda(nilai) {
  const [isi, ttd] = String(nilai ?? '').split('.');
  // format tidak lengkap: bukan cookie buatan aplikasi ini
  if (!isi || !ttd) return null;
  // tanda tangan tidak cocok: isi cookie diubah atau dibuat pihak lain
  if (!samaAman(Buffer.from(ttd), Buffer.from(tandaTangan(isi)))) return null;
  try {
    const payload = JSON.parse(Buffer.from(isi, 'base64url').toString('utf8'));
    // cookie kedaluwarsa tetap ditolak walau browser masih mengirimnya
    return typeof payload?.exp === 'number' && payload.exp > Date.now() ? payload : null;
  } catch {
    // isi bukan JSON walau tanda tangan cocok (seharusnya tidak terjadi): anggap tidak sah
    return null;
  }
}
