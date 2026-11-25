import 'dotenv/config';

/**
 * Pembuat ID untuk skrip memakai IdGenerator yang sama dengan aplikasi.
 * SERVER_ID skrip dibedakan dari aplikasi (SCRIPT_SERVER_ID, bawaan 99)
 * agar ID hasil skrip tidak pernah bentrok dengan ID yang dibuat aplikasi.
 * SERVER_ID dibaca generator saat kelas dimuat, jadi harus diatur SEBELUM import.
 */
process.env.SERVER_ID = process.env.SCRIPT_SERVER_ID ?? '99';
const { default: IdGenerator } = await import('../src/utils/idGenerator.js');

/** Batas counter yang dianggap aman; di atas 99 panjang ID bertambah satu digit. */
const BATAS_COUNTER = 90;

/**
 * Membuat satu ID baru (string). Skrip bisa membuat banyak ID dalam satu milidetik, jadi
 * bila counter hampir 100 kita tunggu milidetik berikutnya agar panjang dan urutan ID tetap rapi.
 */
export function buatId() {
  // masih milidetik yang sama dan counter hampir penuh: tunggu sampai milidetik berganti
  if (IdGenerator.counter >= BATAS_COUNTER && Date.now() === IdGenerator.lastTimestamp) {
    while (Date.now() === IdGenerator.lastTimestamp);
  }
  return IdGenerator.generate();
}
