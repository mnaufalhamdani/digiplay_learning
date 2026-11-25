import { t } from '@/utils/i18n';
import HalamanLevel from '@/modules/level/HalamanLevel';

export const metadata = { title: t('judulHalaman.level') };

/** Level dan Materi. */
export default function Page() {
  return <HalamanLevel />;
}
