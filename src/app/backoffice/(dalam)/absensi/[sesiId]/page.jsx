import { t } from '@/utils/i18n';
import HalamanDetailSesi from '@/modules/sesi/HalamanDetailSesi';

export const metadata = { title: t('judulHalaman.detailSesi') };

/** Detail sesi (berlangsung maupun selesai). */
export default function Page({ params }) {
  return <HalamanDetailSesi params={params} />;
}
