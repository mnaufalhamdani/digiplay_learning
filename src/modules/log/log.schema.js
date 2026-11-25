import { z } from 'zod';
import { queryHalaman, queryId, queryTanggal, queryTeks } from '@/utils/schemaDasar';

/** Teks aksi/entitas: hanya huruf kecil, angka, dan garis bawah (sesuai nilai yang dicatat aplikasi). */
const queryKode = queryTeks(60).transform((v) => (/^[a-z0-9_]+$/.test(v) ? v : undefined));

/** Filter halaman Log dari query string. */
export const daftarLogSchema = z.object({
  aksi: queryKode,
  entitas: queryKode,
  penggunaId: queryId,
  dari: queryTanggal,
  sampai: queryTanggal,
  halaman: queryHalaman,
});
