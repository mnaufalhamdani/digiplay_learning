import { t } from '@/utils/i18n';
import HalamanLog from '@/modules/log/HalamanLog';

export const metadata = { title: t('judulHalaman.log') };

/** Log aktivitas (admin). */
export default function Page({ searchParams }) {
  return <HalamanLog searchParams={searchParams} />;
}
