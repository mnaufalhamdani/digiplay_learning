import { validasi } from '@/utils/validasi';
import { idSchema } from '@/utils/schemaDasar';
import { absenMasukSchema, catatanSchema, cekKodeSchema, idSesiSchema, penuntasanSchema, pengecualianSchema } from './sesi.schema';

/**
 * Controller sesi: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/halaman;
 * `sesi` pengelola berisi id pengguna, `sesi` siswa berisi siswaId.
 */
export function buatSesiController({ sesiUsecase }) {
  return {
    /** Langkah cek kode di form absen. */
    cekKode: (input) => sesiUsecase.cekKode(validasi(cekKodeSchema, input).kode),
    /** Absen masuk. */
    absenMasuk: (input, sesi) => sesiUsecase.absenMasuk(validasi(absenMasukSchema, input), sesi.id),
    /** Izinkan pengecualian kehadiran post test. */
    izinkanPengecualian: (input, sesi) => sesiUsecase.izinkanPengecualian(validasi(pengecualianSchema, input).siswaLevelId, sesi.id),
    /** Tutor bergabung ke sesi. */
    ikutMenangani: (input, sesi) => sesiUsecase.ikutMenangani(validasi(idSesiSchema, input).sesiId, sesi.id),
    /** Tutor menutup sesi. */
    tutup: (input, sesi) => sesiUsecase.tutupOlehTutor(validasi(idSesiSchema, input).sesiId, sesi.id),
    /** Siswa pulang. */
    pulang: (_input, sesi) => sesiUsecase.pulang(sesi.siswaId),
    /** Tutor mengubah penuntasan. */
    ubahPenuntasan(input, sesi) {
      const { sesiId, penuntasan } = validasi(penuntasanSchema, input);
      return sesiUsecase.ubahPenuntasan(sesiId, penuntasan, sesi.id);
    },
    /** Tutor menyimpan catatan. */
    simpanCatatan(input, sesi) {
      const { sesiId, catatan } = validasi(catatanSchema, input);
      return sesiUsecase.simpanCatatan(sesiId, catatan, sesi.id);
    },
    /** Detail sesi (halaman pengelola). */
    detail: (input) => sesiUsecase.detail(validasi(idSesiSchema, input).sesiId),
    /** Sesi berlangsung (halaman Absensi). */
    daftarBerlangsung: () => sesiUsecase.daftarBerlangsung(),
    /** Jumlah sesi berlangsung (lencana menu). */
    jumlahBerlangsung: () => sesiUsecase.jumlahBerlangsung(),
    /** Pilihan tutor tambahan untuk form absen. */
    pilihanTutor: (_input, sesi) => sesiUsecase.pilihanTutor(sesi.id),
    /** Beranda siswa. */
    berandaSiswa: (_input, sesi) => sesiUsecase.berandaSiswa(sesi.siswaId),
    /** ID sesi berlangsung siswa (dipakai ping). */
    sesiAktifId: (siswaId) => sesiUsecase.sesiAktifId(siswaId),
    /** Riwayat sesi dan kehadiran seorang siswa. */
    riwayatSiswa: (siswaId) => sesiUsecase.riwayatSiswa(validasi(idSchema, siswaId)),
  };
}
