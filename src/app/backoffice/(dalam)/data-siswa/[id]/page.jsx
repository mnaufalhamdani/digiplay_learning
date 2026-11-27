import { t } from '@/utils/i18n';
import HalamanDetailSiswa from '@/modules/siswa/HalamanDetailSiswa';

export const metadata = { title: t('judulHalaman.detailSiswa') };

/** Detail siswa. */
export default function Page({ params, searchParams }) {
  return <HalamanDetailSiswa params={params} searchParams={searchParams} />;
}
