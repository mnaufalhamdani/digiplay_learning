import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

// Pemindai berkas subjek gambar di public/aset/gambar/<kode>/. Dipakai seed dan tombol "Pindai ulang berkas".
// Memakai import relatif agar bisa dipakai skrip Node.

/** Apakah sebuah berkas ada dan bisa dibaca. */
async function ada(pathBerkas) {
  try {
    await access(pathBerkas);
    return true;
  } catch {
    // berkas tidak ada (atau folder subjek belum dibuat)
    return false;
  }
}

/** Penanda kelengkapan berkas satu subjek: punya_mewarnai, punya_berwarna, punya_puzzle (0/1). */
export async function penandaBerkasGambar(folderAkar, kode) {
  const folder = path.join(folderAkar, kode);
  const [mewarnai, berwarna, puzzle] = await Promise.all(['mewarnai', 'berwarna', 'puzzle'].map((jenis) => ada(path.join(folder, `${jenis}.png`))));
  return { punya_mewarnai: mewarnai ? 1 : 0, punya_berwarna: berwarna ? 1 : 0, punya_puzzle: puzzle ? 1 : 0 };
}

/** Kode subjek yang sah (mis. hwn-01); mencegah jalur berkas keluar dari folder gambar. */
const POLA_KODE = /^[a-z]{3}-\d{2}$/;

/** Membaca isi berkas <jenis>.png milik satu subjek; null bila kode tidak sah atau berkas tidak ada. */
export async function bacaBerkasGambar(folderAkar, kode, jenis) {
  // kode di luar pola tidak pernah dibaca dari disk
  if (!POLA_KODE.test(String(kode))) return null;
  try {
    return await readFile(path.join(folderAkar, kode, `${jenis}.png`));
  } catch {
    // berkas belum ada di folder subjek
    return null;
  }
}

/** Apakah berkas outline.png sebuah subjek ada (hanya untuk ditampilkan, tidak punya penanda di tabel). */
export function adaOutline(folderAkar, kode) {
  return ada(path.join(folderAkar, kode, 'outline.png'));
}
