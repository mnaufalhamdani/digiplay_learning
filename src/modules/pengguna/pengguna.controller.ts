import { validasi } from '@/utils/validasi';
import { tambahPenggunaSchema, ubahPenggunaSchema, ubahAktifSchema, resetPasswordSchema, ubahPasswordSendiriSchema } from './pengguna.schema';

/** Controller pengguna: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action. */
export function buatPenggunaController({ penggunaUsecase }) {
  return {
    /** Daftar semua akun. */
    daftar: () => penggunaUsecase.daftar(),
    /** Membuat akun baru. */
    tambah: (input, sesi) => penggunaUsecase.tambah(validasi(tambahPenggunaSchema, input), sesi.id),
    /** Mengubah nama/peran akun. */
    ubah(input, sesi) {
      const { id, ...data } = validasi(ubahPenggunaSchema, input);
      return penggunaUsecase.ubah(id, data, sesi.id);
    },
    /** Mengaktifkan/menonaktifkan akun. */
    ubahAktif(input, sesi) {
      const { id, aktif } = validasi(ubahAktifSchema, input);
      return penggunaUsecase.ubahAktif(id, aktif, sesi.id);
    },
    /** Mengatur ulang password akun lain. */
    resetPassword(input, sesi) {
      const { id, password } = validasi(resetPasswordSchema, input);
      return penggunaUsecase.resetPassword(id, password, sesi.id);
    },
    /** Mengganti password sendiri. */
    ubahPasswordSendiri(input, sesi) {
      const { passwordLama, passwordBaru } = validasi(ubahPasswordSendiriSchema, input);
      return penggunaUsecase.ubahPasswordSendiri(sesi.id, { passwordLama, passwordBaru });
    },
  };
}
