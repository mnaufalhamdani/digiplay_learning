import { validasi } from '@/utils/validasi';
import { AppError } from '@/utils/appError';
import { hasilBerkas } from '@/utils/responseHandler';
import { t } from '@/utils/i18n';
import { BATAS_STUDIO } from '@/modules/shared/blockly/pustakaStudio';
import { idKirimanSchema, idKostumSchema, idProyekSchema, kirimProyekSchema, simpanProyekSchema } from './studio.schema';

/** Membaca berkas kostum dari form multipart; ditolak sebelum dibaca bila kosong atau terlalu besar. */
async function bacaUnggahan(berkas) {
  // kolom berkas kosong atau bukan berkas
  if (!berkas || typeof berkas.arrayBuffer !== 'function' || berkas.size === 0) throw new AppError(t('studio.kostumWajib'), 400, [{ kolom: 'berkas', pesan: t('studio.kostumWajib') }]);
  // tolak sebelum membaca isi agar berkas besar tidak dimuat ke memori
  if (berkas.size > BATAS_STUDIO.maksUkuranKostum) throw new AppError(t('studio.kostumBesar', { maks: BATAS_STUDIO.maksUkuranKostum / 1024 }), 400, [{ kolom: 'berkas', pesan: t('studio.kostumBesar', { maks: BATAS_STUDIO.maksUkuranKostum / 1024 }) }]);
  return Buffer.from(await berkas.arrayBuffer());
}

/**
 * Controller Studio Zippy: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route; `sesi` siswa
 * berisi siswaId (fungsi siswa), sedangkan fungsi pengelola tidak memakai `sesi`.
 */
export function buatStudioController({ studioUsecase }) {
  return {
    /** Pustaka sprite (subjek gambar yang bisa dipakai). */
    pustaka: () => studioUsecase.pustaka(),
    /** Tingkat proyek yang boleh dibuat siswa ini. */
    konteksTingkat: (_input, sesi) => studioUsecase.konteksTingkat(sesi.siswaId),
    /** Daftar proyek siswa. */
    daftar: (_input, sesi) => studioUsecase.daftar(sesi.siswaId),
    /** Satu proyek siswa beserta isinya. */
    buka: (input, sesi) => studioUsecase.buka(sesi.siswaId, validasi(idProyekSchema, input).id),
    /** Menyimpan proyek (baru atau memperbarui). */
    simpan: (input, sesi) => studioUsecase.simpan(sesi.siswaId, validasi(simpanProyekSchema, input)),
    /** Menghapus proyek. */
    hapus: (input, sesi) => studioUsecase.hapus(sesi.siswaId, validasi(idProyekSchema, input).id),
    /** Mengirim proyek ke tugas atau butir post test. */
    kirim: (input, sesi) => studioUsecase.kirim(sesi.siswaId, validasi(kirimProyekSchema, input)),
    /** Ringkasan kiriman milik siswa untuk satu tugas/butir. */
    ringkasanKiriman: (input, sesi) => studioUsecase.ringkasanKiriman(sesi.siswaId, validasi(idKirimanSchema, input).tugasId),
    /** Salinan proyek yang dikirim ke satu tugas/butir, untuk tutor dan admin. */
    kiriman: (input) => studioUsecase.kiriman(validasi(idKirimanSchema, input).tugasId),
    /** Siswa mengunggah kostum (route HTTP multipart, kolom `berkas`). */
    async unggahKostum(input, sesi) {
      return studioUsecase.unggahKostum(sesi.siswaId, await bacaUnggahan(input?.berkas));
    },
    /** Siswa menghapus kostum unggahannya. */
    hapusKostum: (input, sesi) => studioUsecase.hapusKostum(sesi.siswaId, validasi(idKostumSchema, input).id),
    /** Menyajikan berkas kostum (route HTTP); kepemilikan diperiksa usecase. */
    async berkasKostum(input, sesi) {
      const { buffer, tipe } = await studioUsecase.berkasKostum(validasi(idKostumSchema, input).id, sesi);
      return hasilBerkas(buffer, tipe);
    },
  };
}
