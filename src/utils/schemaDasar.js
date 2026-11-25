import { z } from 'zod';
import { t } from '@/utils/i18n';
/** ID BIGINT sebagai teks angka (17-18 digit); selalu string agar tidak kehilangan presisi. */
export const idSchema = z.string().trim().regex(/^\d{1,20}$/, t('validasi.idTidakValid'));
/** Password baru: minimal 8 karakter, maksimal 200 (mencegah input raksasa ke scrypt). */
export const passwordBaruSchema = z
  .string()
  .min(8, t('validasi.passwordMin', { min: 8 }))
  .max(200, t('validasi.maksKarakter', { maks: 200 }));

/** Tanggal YYYY-MM-DD yang benar-benar ada di kalender (mis. 2025-02-30 ditolak). */
export const tanggalSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, t('validasi.tanggalTidakValid'))
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, t('validasi.tanggalTidakValid'));

// Schema filter dari query string (halaman daftar). Nilai yang tidak sah diabaikan (.catch), bukan galat,
// agar tautan lama atau ketikan manual di alamat tidak membuat halaman gagal dibuka.

/** Parameter query bisa berupa array bila ditulis berulang: ambil yang pertama. */
const pertama = (v) => (Array.isArray(v) ? v[0] : v);
/** Teks pencarian dari query string; kosong bila tidak ada. */
export const queryTeks = (maks = 100) => z.preprocess(pertama, z.string().trim().max(maks)).catch('');
/** Salah satu pilihan dari daftar; undefined bila kosong/tidak dikenal. */
export const queryPilihan = (daftar) => z.preprocess(pertama, z.enum(daftar)).optional().catch(undefined);
/** ID dari query string; undefined bila kosong/tidak sah. */
export const queryId = z.preprocess(pertama, idSchema).optional().catch(undefined);
/** Tanggal dari query string; undefined bila kosong/tidak sah. */
export const queryTanggal = z.preprocess(pertama, tanggalSchema).optional().catch(undefined);
/** Nomor halaman (mulai 1). */
export const queryHalaman = z.preprocess(pertama, z.coerce.number().int().min(1).max(100000)).catch(1);
