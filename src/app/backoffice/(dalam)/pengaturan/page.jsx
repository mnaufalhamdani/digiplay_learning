import { t } from '@/utils/i18n';
import HalamanPengaturan from '@/modules/pengaturan/HalamanPengaturan';

export const metadata = { title: t('judulHalaman.pengaturan') };

/** Pengaturan aplikasi (admin). */
export default function Page() {
  return <HalamanPengaturan />;
}
