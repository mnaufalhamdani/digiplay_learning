import { t } from '@/utils/i18n';
import HalamanMasukPengelola from '@/modules/auth/HalamanMasukPengelola';

export const metadata = { title: t('judulHalaman.masuk') };

/** Halaman masuk admin dan tutor. */
export default function Page() {
  return <HalamanMasukPengelola />;
}
