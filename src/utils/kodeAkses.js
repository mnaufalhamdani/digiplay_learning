import { randomInt } from 'node:crypto';
import { ALFABET_KODE, PANJANG_KODE_BAWAAN } from '../enums/index.js'; // relatif agar bisa dipakai skrip Node (siswa:uji)

/** Membuat kode akses acak dari alfabet tanpa karakter yang membingungkan (O, I, 0, 1). */
export function buatKode(panjang = PANJANG_KODE_BAWAAN) {
  let kode = '';
  for (let i = 0; i < panjang; i += 1) kode += ALFABET_KODE[randomInt(ALFABET_KODE.length)];
  return kode;
}

/** Merapikan masukan kode: buang spasi tepi, huruf besar, buang spasi dan tanda hubung di tengah. */
export function normalisasiKode(teks) {
  return String(teks ?? '').trim().toUpperCase().replace(/[\s-]/g, '');
}

/** Daftar karakter (unik) yang tidak ada di alfabet kode; kosong bila semua karakter boleh. */
export function karakterTerlarang(teks) {
  return [...new Set([...teks].filter((c) => !ALFABET_KODE.includes(c)))];
}

/** Kode valid bila panjangnya tepat dan semua karakternya ada di alfabet (tidak dikoreksi otomatis). */
export function kodeValid(teks, panjang = PANJANG_KODE_BAWAAN) {
  return teks.length === panjang && karakterTerlarang(teks).length === 0;
}
