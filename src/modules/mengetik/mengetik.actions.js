'use server';
import { ambilDep } from '@/di/container';
import { jalankanAction } from '@/utils/responseHandler';
import { AKSES } from '@/enums';

/** Menjalankan satu fungsi controller mengetik untuk siswa yang sedang login. */
function jalankanMengetik(fungsi, input) {
  return jalankanAction(async () => {
    const sesi = await ambilDep().authController.wajibAkses(AKSES.SISWA);
    return ambilDep().mengetikController[fungsi](input, sesi);
  });
}

/** Menyimpan hasil latihan mengetik. */
export async function simpanHasilMengetik(input) {
  return jalankanMengetik('simpan', input);
}

/** Meminta teks latihan adaptif. */
export async function ambilTeksAdaptif() {
  return jalankanMengetik('adaptif', null);
}

/** Meminta teks acak untuk tes bebas. */
export async function ambilTeksAcak() {
  return jalankanMengetik('teksAcak', null);
}

/** Meminta kata untuk game Hujan Kata. */
export async function ambilKataGame() {
  return jalankanMengetik('kataGame', null);
}
