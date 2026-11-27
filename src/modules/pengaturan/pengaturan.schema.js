import { z } from 'zod';
import { t } from '@/utils/i18n';
import { ATURAN_SERTIFIKAT, BATAS_RUBRIK, DAFTAR_SLOT_LOGO } from '@/enums';

/** Teks boleh kosong dengan panjang maksimal; tidak dikirim = tidak diubah. */
function teksOpsional(maks) {
  return z.string().trim().max(maks, t('validasi.maksKarakter', { maks })).optional();
}

/** Bilangan bulat dari angka atau teks angka form, dengan batas bawah dan atas. */
function bilanganBulat(min, maks) {
  return z.coerce
    .number({ error: t('validasi.harusAngka') })
    .int(t('validasi.harusBulat'))
    .min(min, t('validasi.minimal', { min }))
    .max(maks, t('validasi.maksimal', { maks }));
}

/**
 * Rubrik bawaan: 1-10 kriteria, poin bulat, total tepat 100 (tutor menilai bagian praktik 0-100).
 * Disimpan sebagai teks JSON karena kolom pengaturan.nilai berupa teks.
 */
const rubrikSchema = z
  .array(
    z.object({
      kriteria: z.string().trim().min(1, t('validasi.wajib')).max(BATAS_RUBRIK.maksPanjang, t('validasi.maksKarakter', { maks: BATAS_RUBRIK.maksPanjang })),
      poin: bilanganBulat(1, BATAS_RUBRIK.totalPoin),
    }),
  )
  .min(1, t('pengaturan.rubrikKosong'))
  .max(BATAS_RUBRIK.maksKriteria, t('pengaturan.rubrikTerlaluBanyak', { maks: BATAS_RUBRIK.maksKriteria }))
  .refine((daftar) => daftar.reduce((n, r) => n + r.poin, 0) === BATAS_RUBRIK.totalPoin, t('pengaturan.rubrikTotal', { total: BATAS_RUBRIK.totalPoin }))
  .transform((daftar) => JSON.stringify(daftar));

/**
 * Schema perubahan pengaturan dari halaman Pengaturan. panjang_kode_akses sengaja tidak ada
 * (hanya ditampilkan), sehingga ikut terbuang bila dikirim.
 */
export const ubahPengaturanSchema = z.object({
  nama_pelatihan: z.string().trim().min(1, t('validasi.wajib')).max(150, t('validasi.maksKarakter', { maks: 150 })),
  nama_perusahaan: z.string().trim().max(150, t('validasi.maksKarakter', { maks: 150 })),
  batas_tidak_aktif_menit: bilanganBulat(1, 1440),
  jumlah_tugas_per_sesi: bilanganBulat(1, 20),
  nilai_lulus_total: bilanganBulat(0, 100),
  nilai_lulus_bagian: bilanganBulat(0, 100),
  kehadiran_min_post_test: bilanganBulat(1, 12),
  durasi_post_test_menit: bilanganBulat(1, 300),
  rubrik_bawaan: rubrikSchema,
  // penandatangan sertifikat (opsional); kosong = PDF hanya menampilkan garis dan nama pelatihan
  penandatangan_nama: teksOpsional(ATURAN_SERTIFIKAT.maksPenandatangan),
  penandatangan_jabatan: teksOpsional(ATURAN_SERTIFIKAT.maksPenandatangan),
});
/** Slot logo (utama, ikon, persegiTeks, sertifikat); tidak dikirim = utama (perilaku unggah logo yang lama). */
export const slotLogoSchema = z.object({ slot: z.enum(DAFTAR_SLOT_LOGO, { error: t('pengaturan.logoSlotTidakValid') }).default('utama') });
/** Query sajian logo: slot (lihat atas) dan tema (terang bawaan, atau gelap); tema tak dikenal dianggap terang. */
export const sajianLogoSchema = slotLogoSchema.extend({ tema: z.enum(['terang', 'gelap']).catch('terang') });
