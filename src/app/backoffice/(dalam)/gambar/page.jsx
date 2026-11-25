import { t } from '@/utils/i18n';
import HalamanGambar from '@/modules/gambar/HalamanGambar';

export const metadata = { title: t('judulHalaman.gambar') };

/** Bank gambar. */
export default function Page({ searchParams }) {
  return <HalamanGambar searchParams={searchParams} />;
}
