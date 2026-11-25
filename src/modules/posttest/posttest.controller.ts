import { validasi } from '@/utils/validasi';
import { idPostTestSchema, jawabSchema, nilaiTutorSchema, siapDinilaiSchema, tabSchema, tesMengetikSchema, tesUlangSchema } from './posttest.schema';

/**
 * Controller post test: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route;
 * `sesi` siswa berisi siswaId, `sesi` pengelola berisi id pengguna.
 */
export function buatPosttestController({ posttestUsecase }) {
  return {
    /** Kartu post test di beranda siswa. */
    statusBeranda: (_input, sesi) => posttestUsecase.statusBeranda(sesi.siswaId),
    /** Siswa memulai/melanjutkan post test. */
    mulai: (_input, sesi) => posttestUsecase.mulai(sesi.siswaId),
    /** Data halaman post test siswa. */
    halaman: (_input, sesi) => posttestUsecase.halaman(sesi.siswaId),
    /** Denyut waktu (route HTTP). */
    denyut: (_input, sesi) => posttestUsecase.denyut(sesi.siswaId),
    /** Menyimpan jawaban butir. */
    jawab(input, sesi) {
      const { tugasId, jawaban } = validasi(jawabSchema, input);
      return posttestUsecase.jawab(sesi.siswaId, tugasId, jawaban);
    },
    /** Penanda siap dinilai butir praktik. */
    siapDinilai(input, sesi) {
      const { tugasId, siap } = validasi(siapDinilaiSchema, input);
      return posttestUsecase.siapDinilai(sesi.siswaId, tugasId, siap);
    },
    /** Hasil tes mengetik post test. */
    tesMengetik: (input, sesi) => posttestUsecase.tesMengetik(sesi.siswaId, validasi(tesMengetikSchema, input)),
    /** Siswa mengumpulkan. */
    kumpul: (_input, sesi) => posttestUsecase.kumpulOlehSiswa(sesi.siswaId),
    /** Daftar pengelola per tab (`tab` dari query string; tidak sah -> menunggu). */
    daftar: (tab) => posttestUsecase.daftar(tabSchema.parse(tab)),
    /** Detail pengelola. */
    detail: (input) => posttestUsecase.detail(validasi(idPostTestSchema, input).id),
    /** Riwayat post test seorang siswa (ID sudah divalidasi halaman detail siswa). */
    riwayatSiswa: (siswaId) => posttestUsecase.riwayatSiswa(siswaId),
    /** Tutor mengisi/merevisi nilai bagian praktik. */
    simpanNilai(input, sesi) {
      const { id, bagianId, nilai } = validasi(nilaiTutorSchema, input);
      return posttestUsecase.simpanNilaiTutor(id, bagianId, nilai, sesi.id);
    },
    /** Tutor membuka tes ulang. */
    bukaTesUlang(input, sesi) {
      const { id, bagianIds } = validasi(tesUlangSchema, input);
      return posttestUsecase.bukaTesUlang(id, bagianIds, sesi.id);
    },
  };
}
