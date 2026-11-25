import { validasi } from '@/utils/validasi';
import { daftarTemplateSchema, idTemplateSchema, tambahTemplateSchema, ubahTemplateSchema } from './template.schema';

/** Controller template: validasi input lalu teruskan ke usecase. Hak akses ditegakkan di action/halaman. */
export function buatTemplateController({ templateUsecase }) {
  return {
    /** Daftar template; `input` dari query string (filter tidak sah diabaikan). */
    async daftar(input) {
      const filter = validasi(daftarTemplateSchema, input ?? {});
      return { ...(await templateUsecase.daftar(filter)), filter };
    },
    /** Detail satu template. */
    detail: (input) => templateUsecase.detail(validasi(idTemplateSchema, input).id),
    /** Pilihan level/pertemuan/bagian untuk filter dan form. */
    pilihan: () => templateUsecase.pilihan(),
    /** Lima contoh render template. */
    pratinjau: (input) => templateUsecase.pratinjau(validasi(idTemplateSchema, input).id),
    /** Membuat template baru. */
    tambah: (input, sesi) => templateUsecase.tambah(validasi(tambahTemplateSchema, input), sesi.id),
    /** Mengubah template. */
    ubah(input, sesi) {
      const { id, ...data } = validasi(ubahTemplateSchema, input);
      return templateUsecase.ubah(id, data, sesi.id);
    },
  };
}
