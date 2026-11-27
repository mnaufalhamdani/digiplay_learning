import { validasi } from '@/utils/validasi';
import { halamanPenggunaSchema, tambahPenggunaSchema, ubahPenggunaSchema, ubahAktifSchema, resetPasswordSchema, ubahPasswordSendiriSchema, ubahProfilSchema } from './pengguna.schema';

/** Controller pengguna: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action. */
export function buatPenggunaController({ penggunaUsecase }) {
  return {
    /** Daftar semua akun. */
    daftar: () => penggunaUsecase.daftar(),
    /** Satu halaman akun; input dari query string (nomor halaman tidak sah menjadi 1). */
    halaman(input) {
      const { halaman } = validasi(halamanPenggunaSchema, input ?? {});
      return penggunaUsecase.halaman(halaman);
    },
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
    /** Mengubah nama/email sendiri. */
    ubahProfil(input, sesi) {
      return penggunaUsecase.ubahProfil(sesi.id, validasi(ubahProfilSchema, input));
    },
    /** Mengganti password sendiri. */
    ubahPasswordSendiri(input, sesi) {
      const { passwordLama, passwordBaru } = validasi(ubahPasswordSendiriSchema, input);
      return penggunaUsecase.ubahPasswordSendiri(sesi.id, { passwordLama, passwordBaru });
    },
  };
}
