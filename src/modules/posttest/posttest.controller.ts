import { validasi } from '@/utils/validasi';
import { idButirSchema, idPostTestSchema, jawabSchema, nilaiButirSchema, siapDinilaiSchema, tabSchema, tesMengetikSchema, tesUlangSchema, unduhButirSchema } from './posttest.schema';

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
    /** Data halaman Studio Zippy untuk satu butir post test (dipanggil halaman server, bukan action). */
    butirStudio: (input, sesi) => posttestUsecase.butirStudio(sesi.siswaId, validasi(idButirSchema, input).tugasId),
    /** Siswa mengumpulkan. */
    kumpul: (_input, sesi) => posttestUsecase.kumpulOlehSiswa(sesi.siswaId),
    /** Daftar pengelola per tab (`tab` dari query string; tidak sah -> menunggu). */
    daftar: (tab) => posttestUsecase.daftar(tabSchema.parse(tab)),
    /** Detail pengelola. */
    detail: (input) => posttestUsecase.detail(validasi(idPostTestSchema, input).id),
    /** Riwayat post test seorang siswa (ID sudah divalidasi halaman detail siswa). */
    riwayatSiswa: (siswaId) => posttestUsecase.riwayatSiswa(siswaId),
    /** Tutor menilai (atau merevisi) satu butir praktik: skor dan catatan. */
    nilaiButir(input, sesi) {
      const { id, tugasId, skor, catatan } = validasi(nilaiButirSchema, input);
      return posttestUsecase.nilaiButir(id, tugasId, { skor, catatan }, sesi.id);
    },
    /** Tutor memfinalisasi post test setelah semua butir praktik dinilai. */
    finalisasi: (input, sesi) => posttestUsecase.finalisasiTutor(validasi(idPostTestSchema, input).id, sesi.id),
    /** Siswa mengunduh bahan butir post test (route HTTP). */
    unduh(input, sesi) {
      const { tugasId, kode } = validasi(unduhButirSchema, input);
      return posttestUsecase.unduh(sesi.siswaId, tugasId, kode);
    },
    /** Tutor membuka tes ulang. */
    bukaTesUlang(input, sesi) {
      const { id, bagianIds } = validasi(tesUlangSchema, input);
      return posttestUsecase.bukaTesUlang(id, bagianIds, sesi.id);
    },
  };
}
