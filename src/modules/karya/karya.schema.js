import { z } from 'zod';
import { t } from '@/utils/i18n';
import { ATURAN_KARYA, JENIS_KARYA } from '@/enums';
import { idSchema, queryHalaman, queryId, queryPilihan, queryTeks } from '@/utils/schemaDasar';

/**
 * URL tautan karya yang aman: hanya http/https, tanpa kredensial (user:pass@), punya nama host.
 * Skema lain (javascript:, data:, file:) ditolak karena bisa menjalankan kode saat diklik.
 */
export function urlAman(teks) {
  let u;
  try {
    u = new URL(teks);
  } catch {
    // bukan URL lengkap
    return false;
  }
  return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password && Boolean(u.hostname);
}

/** Judul wajib dan deskripsi opsional (kosong -> null). */
const isiTeks = {
  judul: z.string().trim().min(1, t('validasi.wajib')).max(ATURAN_KARYA.maksJudul, t('validasi.maksKarakter', { maks: ATURAN_KARYA.maksJudul })),
  deskripsi: z
    .string()
    .trim()
    .max(ATURAN_KARYA.maksDeskripsi, t('validasi.maksKarakter', { maks: ATURAN_KARYA.maksDeskripsi }))
    .optional()
    .transform((v) => v || null),
};

/** Schema tambah karya dari form multipart; `url` wajib dan aman bila jenis tautan. */
export const tambahKaryaSchema = z
  .object({
    ...isiTeks,
    jenis: z.enum(Object.values(JENIS_KARYA)),
    url: z.string().trim().max(ATURAN_KARYA.maksUrl, t('validasi.maksKarakter', { maks: ATURAN_KARYA.maksUrl })).optional(),
  })
  .superRefine((d, ctx) => {
    // tautan: URL wajib dan harus lolos pemeriksaan keamanan
    if (d.jenis === JENIS_KARYA.TAUTAN && !urlAman(d.url ?? '')) ctx.addIssue({ code: 'custom', path: ['url'], message: t('karya.urlTidakSah') });
  });

/** Schema ubah karya (judul dan deskripsi). */
export const ubahKaryaSchema = z.object({ id: idSchema, ...isiTeks });

/** Schema satu karya (hapus, berkas). */
export const idKaryaSchema = z.object({ id: idSchema });

/** Filter galeri pengelola dari query string. */
export const daftarKaryaSchema = z.object({
  q: queryTeks(150),
  jenis: queryPilihan(Object.values(JENIS_KARYA)),
  siswaId: queryId,
  halaman: queryHalaman,
});

/** Nomor halaman galeri siswa/orang tua dari query string. */
export const halamanSchema = z.object({ halaman: queryHalaman });
