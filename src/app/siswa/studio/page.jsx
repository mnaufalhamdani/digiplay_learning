import { t } from '@/utils/i18n';
import HalamanStudio from '@/modules/studio/HalamanStudio';

export const metadata = { title: t('judulHalaman.studio') };

/** Studio Zippy: panggung bebas dengan sprite dan blok kode (Level 2). */
export default function Page({ searchParams }) {
  return <HalamanStudio searchParams={searchParams} />;
}
