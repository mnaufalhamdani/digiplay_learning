import { t } from '@/utils/i18n';
import HalamanLabirin from '@/modules/blockly/HalamanLabirin';

export const metadata = { title: t('judulHalaman.labirinBlockly') };

/** Satu labirin Coding Zippy. */
export default function Page({ params, searchParams }) {
  return <HalamanLabirin params={params} searchParams={searchParams} />;
}
