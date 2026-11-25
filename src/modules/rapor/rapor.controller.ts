import { z } from 'zod';
import { validasi } from '@/utils/validasi';
import { queryHalaman } from '@/utils/schemaDasar';
import { PERAN } from '@/enums';

/** Nomor halaman tiap daftar rapor dari query string (`sesi`, `bayar`, `halaman` untuk karya); tidak sah = 1. */
const halamanRaporSchema = z.object({ sesi: queryHalaman, bayar: queryHalaman, halaman: queryHalaman }).transform((h) => ({ sesi: h.sesi, bayar: h.bayar, karya: h.halaman }));

/** Controller rapor: rapor orang tua (dibatasi siswaId dari cookie dp_ortu) dan kartu beranda pengelola. */
export function buatRaporController({ raporUsecase }) {
  return {
    /** Rapor untuk orang tua; `input` = query string (halaman daftar). */
    ortu: (input, sesi) => raporUsecase.ortu(sesi.siswaId, validasi(halamanRaporSchema, input ?? {})),
    /** Kartu ringkas beranda pengelola sesuai peran. */
    beranda: (_input, sesi) => raporUsecase.beranda(sesi.peran === PERAN.ADMIN),
  };
}
