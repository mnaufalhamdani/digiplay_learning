import { t } from '@/utils/i18n';
import HalamanDetailTemplate from '@/modules/template/HalamanDetailTemplate';

export const metadata = { title: t('judulHalaman.detailTemplate') };

/** Detail dan pratinjau template. */
export default function Page({ params }) {
  return <HalamanDetailTemplate params={params} />;
}
