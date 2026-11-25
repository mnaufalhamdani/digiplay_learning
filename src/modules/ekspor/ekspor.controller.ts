import { validasi } from '@/utils/validasi';
import { hasilBerkas } from '@/utils/responseHandler';
import { filterEksporSchema } from './ekspor.schema';

/** Controller ekspor CSV: satu fungsi per jenis (route HTTP GET, akses pengelola). */
export function buatEksporController({ eksporUsecase }) {
  /** Membuat berkas CSV jenis tertentu dari filter query string. */
  async function unduh(jenis, input, sesi) {
    const { buffer, namaFile } = await eksporUsecase.ekspor(jenis, validasi(filterEksporSchema, input ?? {}), sesi.id);
    return hasilBerkas(buffer, 'text/csv; charset=utf-8', namaFile);
  }
  return {
    /** CSV data siswa. */
    siswa: (input, sesi) => unduh('siswa', input, sesi),
    /** CSV kehadiran (sesi). */
    kehadiran: (input, sesi) => unduh('kehadiran', input, sesi),
    /** CSV post test. */
    postTest: (input, sesi) => unduh('post-test', input, sesi),
    /** CSV pembayaran. */
    pembayaran: (input, sesi) => unduh('pembayaran', input, sesi),
  };
}
