import { validasi } from '@/utils/validasi';
import { hapusPembayaranSchema, tambahPembayaranSchema } from './pembayaran.schema';

/** Controller pembayaran: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/halaman. */
export function buatPembayaranController({ pembayaranUsecase }) {
  return {
    /** Mencatat pembayaran. */
    tambah(input, sesi) {
      const data = validasi(tambahPembayaranSchema, input);
      return pembayaranUsecase.tambah({ ...data, tanggal: data.tanggal ?? null }, sesi.id);
    },
    /** Daftar pembayaran seorang siswa (ID sudah divalidasi oleh pemanggil halaman). */
    daftarSiswa: (siswaId) => pembayaranUsecase.daftarSiswa(siswaId),
    /** Daftar pembayaran satu sesi. */
    daftarSesi: (sesiId) => pembayaranUsecase.daftarSesi(sesiId),
    /** Admin menghapus pembayaran. */
    hapus: (input, sesi) => pembayaranUsecase.hapus(validasi(hapusPembayaranSchema, input).id, sesi.id),
  };
}
