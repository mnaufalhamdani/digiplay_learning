import { validasi } from '@/utils/validasi';
import { daftarSiswaSchema, gantiKodeSchema, gantiLevelSchema, hapusSiswaSchema, idSiswaSchema, tambahSiswaSchema, ubahStatusSiswaSchema } from './siswa.schema';

/** Controller siswa: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/halaman. */
export function buatSiswaController({ siswaUsecase }) {
  return {
    /** Daftar siswa; `input` dari query string (filter tidak sah diabaikan). */
    async daftar(input) {
      const filter = validasi(daftarSiswaSchema, input ?? {});
      return { ...(await siswaUsecase.daftar(filter)), filter };
    },
    /** Detail siswa. */
    detail: (input) => siswaUsecase.detail(validasi(idSiswaSchema, input).id),
    /** Data kartu kode untuk dicetak. */
    kartuKode: (input) => siswaUsecase.kartuKode(validasi(idSiswaSchema, input).id),
    /** Pilihan level aktif. */
    pilihanLevel: () => siswaUsecase.pilihanLevel(),
    /** Mendaftarkan siswa baru. */
    tambah: (input, sesi) => siswaUsecase.tambah(validasi(tambahSiswaSchema, input), sesi.id),
    /** Mengganti kode siswa atau orang tua. */
    gantiKode(input, sesi) {
      const { id, jenis } = validasi(gantiKodeSchema, input);
      return siswaUsecase.gantiKode(id, jenis, sesi.id);
    },
    /** Mengganti level berjalan. */
    gantiLevel(input, sesi) {
      const { id, levelId } = validasi(gantiLevelSchema, input);
      return siswaUsecase.gantiLevel(id, levelId, sesi.id);
    },
    /** Mengaktifkan/menonaktifkan siswa. */
    ubahStatus(input, sesi) {
      const { id, aktif } = validasi(ubahStatusSiswaSchema, input);
      return siswaUsecase.ubahStatus(id, aktif, sesi.id);
    },
    /** Menghapus siswa (admin). */
    hapus(input, sesi) {
      const { id, konfirmasiNama } = validasi(hapusSiswaSchema, input);
      return siswaUsecase.hapus(id, konfirmasiNama, sesi.id);
    },
  };
}
