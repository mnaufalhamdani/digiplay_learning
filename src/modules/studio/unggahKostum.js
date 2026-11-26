import { t } from '@/utils/i18n';
import { BATAS_STUDIO } from '@/modules/shared/blockly/pustakaStudio';

// Pembantu browser untuk kostum unggahan Level 3: gambar dari Paint diperkecil (sisi terpanjang maksimal 256 px) dan
// diubah menjadi PNG sebelum dikirim, sehingga berkasnya kecil. Pengiriman memakai route HTTP studio (multipart), sama
// seperti unggah karya; server tetap memeriksa tipe dari byte awal, ukuran, dan kepemilikan.

/** Tipe berkas yang boleh dipilih siswa (gambar Paint biasanya PNG atau JPEG). */
export const TIPE_KOSTUM = ['image/png', 'image/jpeg'];

/** Menggambar `bitmap` pada kanvas dengan sisi terpanjang `sisi` px (tidak diperbesar) dan mengubahnya menjadi Blob PNG. */
function keBlobPng(bitmap, sisi) {
  const skala = Math.min(1, sisi / Math.max(bitmap.width, bitmap.height));
  const kanvas = document.createElement('canvas');
  kanvas.width = Math.max(1, Math.round(bitmap.width * skala));
  kanvas.height = Math.max(1, Math.round(bitmap.height * skala));
  kanvas.getContext('2d').drawImage(bitmap, 0, 0, kanvas.width, kanvas.height);
  return new Promise((selesai) => kanvas.toBlob(selesai, 'image/png'));
}

/**
 * Memperkecil gambar pilihan siswa menjadi PNG yang muat dalam batas ukuran: dicoba 256 px, lalu lebih kecil bila
 * masih terlalu besar. Hasil: { blob } atau { galat } (bukan gambar yang bisa dibaca, atau tetap terlalu besar).
 */
export async function siapkanKostum(file) {
  // bukan PNG/JPEG: ditolak sebelum dibaca (server tetap memeriksa isinya)
  if (!TIPE_KOSTUM.includes(file.type)) return { galat: t('studio.kostumTipe') };
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // berkas berekstensi gambar tetapi isinya bukan gambar yang valid
    return { galat: t('studio.kostumTipe') };
  }
  try {
    for (const sisi of [BATAS_STUDIO.sisiKostum, 192, 128]) {
      const blob = await keBlobPng(bitmap, sisi);
      if (blob && blob.size <= BATAS_STUDIO.maksUkuranKostum) return { blob };
    }
    return { galat: t('studio.kostumBesar', { maks: BATAS_STUDIO.maksUkuranKostum / 1024 }) };
  } finally {
    bitmap.close?.();
  }
}

/** Mengirim kostum yang sudah disiapkan ke server. Hasil: { id } atau { galat } berisi pesan dari server. */
export async function kirimKostum(blob) {
  const form = new FormData();
  form.append('berkas', blob, 'kostum.png');
  try {
    const res = await fetch('/api/v1/studio/kostum', { method: 'POST', body: form, credentials: 'same-origin' });
    const json = await res.json().catch(() => ({ success: false, message: t('umum.galatServer') }));
    return json.success ? { id: json.data.id } : { galat: json.message };
  } catch {
    // jaringan putus saat mengunggah
    return { galat: t('umum.galatJaringan') };
  }
}
