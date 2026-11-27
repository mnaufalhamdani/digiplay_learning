'use client';
import { t } from '@/utils/i18n';
import LayarPesan from '@/modules/layout/LayarPesan';
import { BRANDING_LOGO_BAWAAN } from '@/modules/layout/LogoAplikasi';
import { kelasTombol } from '@/modules/shared/ui/kelasTombol';

/**
 * Halaman galat tak terduga (error boundary): logo persegi dengan teks, tombol muat ulang, dan tautan ke beranda. Berupa client
 * component sehingga memakai logo bawaan statis (pengaturan tidak bisa dibaca dari sini).
 */
export default function Galat({ reset }) {
  return (
    <LayarPesan
      branding={BRANDING_LOGO_BAWAAN}
      judul={t('app.galatJudul')}
      pesan={t('app.galatPesan')}
      aksi={
        <>
          <button type="button" onClick={() => reset()} className={kelasTombol({ ukuran: 'lg' })}>
            {t('app.muatUlang')}
          </button>
          {/* tautan biasa agar tetap berfungsi bila state aplikasi rusak */}
          <a href="/" className={kelasTombol({ varian: 'secondary', ukuran: 'lg' })}>
            {t('app.kembaliBeranda')}
          </a>
        </>
      }
    />
  );
}
