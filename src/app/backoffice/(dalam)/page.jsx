import { t } from '@/utils/i18n';
import HalamanBerandaPengelola from '@/modules/sesi/HalamanBerandaPengelola';

export const metadata = { title: t('judulHalaman.beranda') };

/** Beranda backoffice. */
export default function Page() {
  return <HalamanBerandaPengelola />;
}
