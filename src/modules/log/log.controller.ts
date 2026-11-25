import { validasi } from '@/utils/validasi';
import { daftarLogSchema } from './log.schema';

/** Controller log: validasi filter halaman Log lalu teruskan ke usecase. Hak akses (admin) ditegakkan di halaman. */
export function buatLogController({ logUsecase }) {
  return {
    /** Daftar log; `input` dari query string (filter tidak sah diabaikan). */
    async daftar(input) {
      const filter = validasi(daftarLogSchema, input ?? {});
      return { ...(await logUsecase.daftar(filter)), filter };
    },
    /** Pilihan isian filter. */
    pilihanFilter: () => logUsecase.pilihanFilter(),
  };
}
