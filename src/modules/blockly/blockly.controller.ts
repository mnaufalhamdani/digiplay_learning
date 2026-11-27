import { validasi } from '@/utils/validasi';
import { MENU_GAME } from '@/enums';
import { kodeLabirinSchema, simpanBlocklySchema } from './blockly.schema';

/** Controller Coding Zippy: validasi input lalu teruskan ke usecase. `sesi` adalah sesi siswa (siswaId). */
export function buatBlocklyController({ blocklyUsecase, latihanUsecase }) {
  return {
    /** Daftar labirin berurutan beserta tanda sudah selesai. */
    daftar: (_input, sesi) => blocklyUsecase.daftar(sesi.siswaId),
    /** Satu labirin untuk halaman main. */
    detail: (input, sesi) => blocklyUsecase.detail(sesi.siswaId, validasi(kodeLabirinSchema, input).kode),
    /** Kode labirin dari nama (tugas bertipe blockly menyebut nama labirin). */
    kodeDariNama: (nama) => blocklyUsecase.kodeDariNama(String(nama ?? '')),
    /** Menilai dan menyimpan hasil program siswa. */
    simpan: async (input, sesi) => {
      // Coding Zippy harus sudah terbuka (tugas blockly pernah muncul); selain itu 403
      await latihanUsecase.wajibMenuTerbuka(sesi.siswaId, MENU_GAME.CODING_ZIPPY);
      return blocklyUsecase.simpan(sesi.siswaId, validasi(simpanBlocklySchema, input));
    },
  };
}
