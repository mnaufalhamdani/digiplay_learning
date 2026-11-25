import { validasi } from '@/utils/validasi';
import { AppError } from '@/utils/appError';
import { hasilBerkas } from '@/utils/responseHandler';
import { t } from '@/utils/i18n';
import { ATURAN_KARYA, JENIS_KARYA } from '@/enums';
import { daftarKaryaSchema, halamanSchema, idKaryaSchema, tambahKaryaSchema, ubahKaryaSchema } from './karya.schema';

/** Membaca berkas unggahan dari form multipart; ditolak sebelum dibaca bila kosong atau terlalu besar. */
async function bacaUnggahan(berkas) {
  // kolom berkas kosong atau bukan berkas
  if (!berkas || typeof berkas.arrayBuffer !== 'function' || berkas.size === 0) throw new AppError(t('karya.berkasWajib'), 400, [{ kolom: 'berkas', pesan: t('karya.berkasWajib') }]);
  // tolak sebelum membaca isi agar berkas besar tidak dimuat ke memori
  if (berkas.size > ATURAN_KARYA.maksUkuran) throw new AppError(t('karya.berkasBesar'), 400, [{ kolom: 'berkas', pesan: t('karya.berkasBesar') }]);
  return Buffer.from(await berkas.arrayBuffer());
}

/**
 * Controller karya: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/route;
 * `sesi` siswa/orang tua berisi siswaId, `sesi` pengelola berisi id dan peran.
 */
export function buatKaryaController({ karyaUsecase }) {
  return {
    /** Siswa menambah karya (route HTTP multipart: judul, deskripsi, jenis, url atau berkas). */
    async tambah(input, sesi) {
      const data = validasi(tambahKaryaSchema, input ?? {});
      const buffer = data.jenis === JENIS_KARYA.BERKAS ? await bacaUnggahan(input.berkas) : null;
      return karyaUsecase.tambah(sesi.siswaId, data, buffer);
    },
    /** Siswa mengubah judul/deskripsi karyanya. */
    ubah(input, sesi) {
      const { id, ...data } = validasi(ubahKaryaSchema, input);
      return karyaUsecase.ubah(sesi.siswaId, id, data);
    },
    /** Siswa menghapus karyanya. */
    hapusOlehSiswa: (input, sesi) => karyaUsecase.hapusOlehSiswa(sesi.siswaId, validasi(idKaryaSchema, input).id),
    /** Pengelola menghapus karya. */
    hapusOlehPengelola: (input, sesi) => karyaUsecase.hapusOlehPengelola(validasi(idKaryaSchema, input).id, sesi.id),
    /** Galeri pengelola; `input` dari query string. */
    async daftar(input) {
      const filter = validasi(daftarKaryaSchema, input ?? {});
      return { ...(await karyaUsecase.daftar(filter)), filter };
    },
    /** Galeri milik siswa pada sesi (siswa sendiri atau orang tua); halaman dari query string. */
    galeriSaya: (input, sesi) => karyaUsecase.daftarSiswa(sesi.siswaId, validasi(halamanSchema, input ?? {}).halaman),
    /** Karya seorang siswa untuk tab detail siswa (ID sudah divalidasi halaman detail). */
    daftarSiswa: (siswaId) => karyaUsecase.daftarSiswa(siswaId),
    /** Menyajikan berkas karya (route HTTP); kepemilikan diperiksa usecase. */
    async berkas(input, sesi) {
      const { buffer, tipe } = await karyaUsecase.berkas(validasi(idKaryaSchema, input).id, sesi);
      return hasilBerkas(buffer, tipe);
    },
  };
}
