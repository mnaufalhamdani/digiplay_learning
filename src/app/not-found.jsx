import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { t } from '@/utils/i18n';
import LayarPesan from '@/modules/layout/LayarPesan';
import { BRANDING_LOGO_BAWAAN } from '@/modules/layout/LogoAplikasi';
import { kelasTombol } from '@/modules/shared/ui/kelasTombol';

/** Halaman 404 (alamat tidak ada atau notFound() dari halaman): logo persegi dengan teks dan tautan ke beranda. */
export default async function TidakDitemukan() {
  // pengaturan tidak terbaca (mis. database mati): tetap tampil dengan logo bawaan
  const branding = await ambilDep().pengaturanController.branding().catch(() => BRANDING_LOGO_BAWAAN);
  return (
    <LayarPesan
      branding={branding}
      judul={t('app.tidakDitemukanJudul')}
      pesan={t('app.tidakDitemukanPesan')}
      aksi={
        <Link href="/" className={kelasTombol({ ukuran: 'lg' })}>
          {t('app.kembaliBeranda')}
        </Link>
      }
    />
  );
}
