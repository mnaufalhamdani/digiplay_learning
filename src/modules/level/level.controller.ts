import { validasi } from '@/utils/validasi';
import { ubahBagianSchema, ubahLevelSchema, ubahPertemuanSchema } from './level.schema';

/** Controller level: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action. */
export function buatLevelController({ levelUsecase }) {
  return {
    /** Struktur lengkap untuk halaman Level dan Materi. */
    struktur: () => levelUsecase.struktur(),
    /** Daftar level, pertemuan, dan bagian untuk pilihan form/filter. */
    pilihan: () => levelUsecase.pilihan(),
    /** Mengubah nama/deskripsi level. */
    ubahLevel(input, sesi) {
      const { id, ...data } = validasi(ubahLevelSchema, input);
      return levelUsecase.ubahLevel(id, data, sesi.id);
    },
    /** Mengubah judul/tujuan pertemuan. */
    ubahPertemuan(input, sesi) {
      const { id, ...data } = validasi(ubahPertemuanSchema, input);
      return levelUsecase.ubahPertemuan(id, data, sesi.id);
    },
    /** Mengubah nama/bobot/jumlah butir bagian post test. */
    ubahBagian(input, sesi) {
      const { id, ...data } = validasi(ubahBagianSchema, input);
      return levelUsecase.ubahBagian(id, data, sesi.id);
    },
  };
}
