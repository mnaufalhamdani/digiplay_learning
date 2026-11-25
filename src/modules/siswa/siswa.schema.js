import { z } from 'zod';
import { t } from '@/utils/i18n';
import { DAFTAR_STATUS_SISWA, JENIS_KODE } from '@/enums';
import { idSchema, queryHalaman, queryId, queryPilihan, queryTeks, tanggalSchema } from '@/utils/schemaDasar';

/** Filter daftar siswa dari query string. */
export const daftarSiswaSchema = z.object({
  q: queryTeks(150),
  status: queryPilihan(DAFTAR_STATUS_SISWA),
  levelId: queryId,
  halaman: queryHalaman,
});

/** Schema detail/kartu kode siswa. */
export const idSiswaSchema = z.object({ id: idSchema });

/** Schema pendaftaran siswa baru. */
export const tambahSiswaSchema = z.object({
  nama: z.string().trim().min(1, t('validasi.wajib')).max(150, t('validasi.maksKarakter', { maks: 150 })),
  tanggalDaftar: tanggalSchema,
  levelId: idSchema,
});

/** Schema ganti kode (siswa atau orang tua). */
export const gantiKodeSchema = z.object({ id: idSchema, jenis: z.enum(Object.values(JENIS_KODE)) });

/** Schema ganti level. */
export const gantiLevelSchema = z.object({ id: idSchema, levelId: idSchema });

/** Schema aktif/nonaktif siswa. */
export const ubahStatusSiswaSchema = z.object({ id: idSchema, aktif: z.boolean() });

/** Schema hapus siswa: nama diketik ulang sebagai konfirmasi. */
export const hapusSiswaSchema = z.object({ id: idSchema, konfirmasiNama: z.string().max(150).default('') });
