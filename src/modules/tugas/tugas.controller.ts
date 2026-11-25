import { validasi } from '@/utils/validasi';
import { idTugasSchema, kirimJawabanSchema, ubahStatusTugasSchema, unduhSchema } from './tugas.schema';

/**
 * Controller tugas: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route;
 * `sesi` siswa berisi siswaId, `sesi` pengelola berisi id pengguna.
 */
export function buatTugasController({ tugasUsecase }) {
  return {
    /** Siswa mengirim jawaban. */
    kirimJawaban(input, sesi) {
      const { tugasId, jawaban } = validasi(kirimJawabanSchema, input);
      return tugasUsecase.kirimJawaban(tugasId, jawaban, sesi.siswaId);
    },
    /** Siswa melewati tugas. */
    lewati: (input, sesi) => tugasUsecase.lewati(validasi(idTugasSchema, input).tugasId, sesi.siswaId),
    /** Siswa mengganti tugas. */
    gantiOlehSiswa: (input, sesi) => tugasUsecase.gantiTugas(validasi(idTugasSchema, input).tugasId, { siswaId: sesi.siswaId }),
    /** Tutor mengganti tugas siswa. */
    gantiOlehTutor: (input, sesi) => tugasUsecase.gantiTugas(validasi(idTugasSchema, input).tugasId, { penggunaId: sesi.id }),
    /** Tutor mengubah status tugas. */
    ubahStatus(input, sesi) {
      const { tugasId, status } = validasi(ubahStatusTugasSchema, input);
      return tugasUsecase.ubahStatusTutor(tugasId, status, sesi.id);
    },
    /** Tugas latihan web milik siswa untuk membuka game/puzzle/mengetik; ID tidak sah dianggap tidak ada. */
    untukLatihan(tugasId, sesi) {
      const sah = idTugasSchema.safeParse({ tugasId });
      return sah.success ? tugasUsecase.untukLatihan(sah.data.tugasId, sesi.siswaId) : null;
    },
    /** Siswa mengunduh bahan gambar tugasnya (route HTTP). */
    unduh(input, sesi) {
      const { tugasId, kode } = validasi(unduhSchema, input);
      return tugasUsecase.unduh(tugasId, kode, sesi.siswaId);
    },
  };
}
