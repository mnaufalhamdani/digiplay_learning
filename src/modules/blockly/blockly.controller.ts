import { validasi } from '@/utils/validasi';
import { kodeLabirinSchema, simpanBlocklySchema } from './blockly.schema';

/** Controller Coding Zippy: validasi input lalu teruskan ke usecase. `sesi` adalah sesi siswa (siswaId). */
export function buatBlocklyController({ blocklyUsecase }) {
  return {
    /** Daftar labirin berurutan beserta tanda sudah selesai. */
    daftar: (_input, sesi) => blocklyUsecase.daftar(sesi.siswaId),
    /** Satu labirin untuk halaman main. */
    detail: (input, sesi) => blocklyUsecase.detail(sesi.siswaId, validasi(kodeLabirinSchema, input).kode),
    /** Kode labirin dari nama (tugas bertipe blockly menyebut nama labirin). */
    kodeDariNama: (nama) => blocklyUsecase.kodeDariNama(String(nama ?? '')),
    /** Menilai dan menyimpan hasil program siswa. */
    simpan: (input, sesi) => blocklyUsecase.simpan(sesi.siswaId, validasi(simpanBlocklySchema, input)),
  };
}
