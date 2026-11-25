import { t } from '@/utils/i18n';
import { HalamanDetailPostTest } from '@/modules/posttest/HalamanPostTestPengelola';

export const metadata = { title: t('judulHalaman.detailPostTest') };

/** Detail dan penilaian post test. */
export default function Page({ params }) {
  return <HalamanDetailPostTest params={params} />;
}
