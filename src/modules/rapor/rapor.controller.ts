import { z } from 'zod';
import { validasi } from '@/utils/validasi';
import { queryHalaman, queryId } from '@/utils/schemaDasar';
import { PERAN } from '@/enums';

/** Nomor halaman tiap daftar rapor dari query string (`sesi`, `bayar`, `halaman` untuk karya); tidak sah = 1. */
const halamanRaporSchema = z.object({ sesi: queryHalaman, bayar: queryHalaman, halaman: queryHalaman }).transform((h) => ({ sesi: h.sesi, bayar: h.bayar, karya: h.halaman }));

/** Pembungkus nilai query yang bisa berupa array bila ditulis berulang: ambil yang pertama. */
const pertama = (v) => (Array.isArray(v) ? v[0] : v);
/**
 * Filter dashboard dari query (`?bulan=YYYY-MM&level=<id>`): nilai tidak sah diam-diam menjadi kosong (= bawaan), bukan galat,
 * agar tautan lama atau ketikan manual tidak membuat beranda gagal dibuka. Rentang bulan diperiksa di usecase.
 */
const filterDashboardSchema = z
  .object({
    bulan: z.preprocess(pertama, z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)).optional().catch(undefined),
    level: queryId,
  })
  .transform((f) => ({ bulan: f.bulan, levelId: f.level }));

/** Controller rapor: rapor orang tua (dibatasi siswaId dari cookie dp_ortu) dan kartu beranda pengelola. */
export function buatRaporController({ raporUsecase }) {
  return {
    /** Rapor untuk orang tua; `input` = query string (halaman daftar). */
    ortu: (input, sesi) => raporUsecase.ortu(sesi.siswaId, validasi(halamanRaporSchema, input ?? {})),
    /** Kartu ringkas beranda pengelola sesuai peran. */
    beranda: (_input, sesi) => raporUsecase.beranda(sesi.peran === PERAN.ADMIN),
    /** Dashboard beranda pengelola; `input` = query string (`bulan`, `level`). Data uang hanya untuk admin. */
    dashboard: (input, sesi) => raporUsecase.dashboard(sesi.peran === PERAN.ADMIN, validasi(filterDashboardSchema, input ?? {})),
  };
}
