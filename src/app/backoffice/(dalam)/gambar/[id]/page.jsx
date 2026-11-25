import { t } from '@/utils/i18n';
import HalamanDetailGambar from '@/modules/gambar/HalamanDetailGambar';

export const metadata = { title: t('judulHalaman.detailGambar') };

/** Detail subjek gambar. */
export default function Page({ params }) {
  return <HalamanDetailGambar params={params} />;
}
