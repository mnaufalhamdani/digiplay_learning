import 'dotenv/config';
import mysql from 'mysql2/promise';

/** Nama database dari .env (bawaan digiplay_learning, sama dengan schema.sql). */
export const NAMA_DB = process.env.DB_NAME ?? 'digiplay_learning';

/**
 * Membuka koneksi tunggal ke server MySQL dari .env.
 * - pakaiDb false: tanpa memilih database (dipakai db:init sebelum database ada).
 * - multi true: izinkan banyak pernyataan sekaligus; HANYA untuk db:init yang menjalankan schema.sql.
 * - barisBerubah true: affectedRows hanya menghitung baris yang benar-benar berubah (tanpa flag FOUND_ROWS),
 *   dipakai db:seed untuk membedakan baris baru, diperbarui, dan tetap pada INSERT ... ON DUPLICATE KEY UPDATE.
 * ID BIGINT dibaca sebagai string (bigNumberStrings) dan tanggal sebagai string.
 */
export async function bukaKoneksi({ pakaiDb = true, multi = false, barisBerubah = false } = {}) {
  return mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: pakaiDb ? NAMA_DB : undefined,
    charset: 'utf8mb4',
    multipleStatements: multi,
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    flags: barisBerubah ? ['-FOUND_ROWS'] : undefined,
  });
}
