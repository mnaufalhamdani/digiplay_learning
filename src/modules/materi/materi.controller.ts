import { validasi } from '@/utils/validasi';
import { idSchema } from '@/utils/schemaDasar';
import { idPertemuanSchema, simpanMateriSchema } from './materi.schema';

/**
 * Controller materi: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/halaman;
 * `sesi` siswa berisi siswaId, `sesi` pengelola berisi id pengguna.
 */
export function buatMateriController({ materiUsecase }) {
  return {
    /** Pustaka materi siswa (hanya yang sudah dilalui). */
    daftarSiswa: (_input, sesi) => materiUsecase.daftarSiswa(sesi.siswaId),
    /** Satu materi untuk halaman siswa. */
    untukSiswa: (input, sesi) => materiUsecase.untukSiswa(sesi.siswaId, validasi(idPertemuanSchema, input).pertemuanId),
    /** Siswa menekan "Saya sudah paham". */
    tandaiPaham: (input, sesi) => materiUsecase.tandaiPaham(sesi.siswaId, validasi(idPertemuanSchema, input).pertemuanId),
    /** Daftar materi untuk pengelola. */
    daftarPengelola: () => materiUsecase.daftarPengelola(),
    /** Pratinjau dan editor materi untuk pengelola. */
    detailPengelola: (input) => materiUsecase.detailPengelola(validasi(idPertemuanSchema, input).pertemuanId),
    /** Admin menyimpan materi. */
    simpan: (input, sesi) => materiUsecase.simpan(validasi(simpanMateriSchema, input), sesi.id),
    /** Status baca materi seorang siswa (detail siswa di backoffice). */
    statusBacaSiswa: (siswaId) => materiUsecase.statusBacaSiswa(validasi(idSchema, siswaId)),
  };
}
