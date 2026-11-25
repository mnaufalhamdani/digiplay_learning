import { validasi } from '@/utils/validasi';
import { hasilBerkas } from '@/utils/responseHandler';
import { batalSertifikatSchema, daftarSertifikatSchema, idSertifikatSchema, terbitUlangSchema } from './sertifikat.schema';

/**
 * Controller sertifikat: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route;
 * `sesi` pengelola berisi id pengguna, `sesi` orang tua berisi siswaId dari cookie dp_ortu.
 */
export function buatSertifikatController({ sertifikatUsecase }) {
  return {
    /** Daftar sertifikat; `input` dari query string. */
    async daftar(input) {
      const filter = validasi(daftarSertifikatSchema, input ?? {});
      return { ...(await sertifikatUsecase.daftar(filter)), filter };
    },
    /** Riwayat sertifikat seorang siswa (ID sudah divalidasi halaman detail siswa). */
    riwayatSiswa: (siswaId) => sertifikatUsecase.riwayatSiswa(siswaId),
    /** Status sertifikat untuk detail post test (pt dari posttestController.detail). */
    statusPostTest: (pt) => sertifikatUsecase.statusPostTest(pt),
    /** Membatalkan sertifikat. */
    batalkan(input, sesi) {
      const { id, alasan } = validasi(batalSertifikatSchema, input);
      return sertifikatUsecase.batalkan(id, alasan, sesi.id);
    },
    /** Menerbitkan ulang sertifikat untuk (siswa, level). */
    terbitkanUlang(input, sesi) {
      const { siswaId, levelId } = validasi(terbitUlangSchema, input);
      return sertifikatUsecase.terbitkanUlang(siswaId, levelId, sesi.id);
    },
    /** Unduh PDF oleh pengelola (route HTTP); semua status, yang dibatalkan bertanda watermark. */
    async pdf(input) {
      const { buffer, namaFile } = await sertifikatUsecase.pdf(validasi(idSertifikatSchema, input).id);
      return hasilBerkas(buffer, 'application/pdf', namaFile);
    },
    /** Unduh PDF oleh orang tua (route HTTP); hanya sertifikat terbit milik anak pada cookie. */
    async pdfOrtu(input, sesi) {
      const { buffer, namaFile } = await sertifikatUsecase.pdf(validasi(idSertifikatSchema, input).id, sesi.siswaId);
      return hasilBerkas(buffer, 'application/pdf', namaFile);
    },
    /** Data halaman verifikasi publik; token mentah dari URL dinormalisasi di usecase. */
    verifikasi: (token) => sertifikatUsecase.verifikasi(String(token ?? '').slice(0, 64)),
  };
}
