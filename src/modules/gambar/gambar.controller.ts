import { validasi } from '@/utils/validasi';
import { daftarGambarSchema, idGambarSchema, ubahAktifGambarSchema } from './gambar.schema';

/** Controller gambar: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action. */
export function buatGambarController({ gambarUsecase }) {
  return {
    /** Daftar subjek; `input` dari query string (filter tidak sah diabaikan). */
    daftar(input) {
      const filter = validasi(daftarGambarSchema, input ?? {});
      return gambarUsecase.daftar(filter).then((baris) => ({ baris, filter }));
    },
    /** Detail satu subjek. */
    detail(input) {
      return gambarUsecase.detail(validasi(idGambarSchema, input).id);
    },
    /** Mengaktifkan/menonaktifkan subjek. */
    ubahAktif(input, sesi) {
      const { id, aktif } = validasi(ubahAktifGambarSchema, input);
      return gambarUsecase.ubahAktif(id, aktif, sesi.id);
    },
    /** Memindai ulang berkas semua subjek. */
    pindaiUlang: (_input, sesi) => gambarUsecase.pindaiUlang(sesi.id),
  };
}
