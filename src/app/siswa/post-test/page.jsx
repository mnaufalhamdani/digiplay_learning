import { t } from '@/utils/i18n';
import HalamanPostTestSiswa from '@/modules/posttest/HalamanPostTestSiswa';

export const metadata = { title: t('judulHalaman.postTestSiswa') };

/** Post test siswa (layar fokus). */
export default function Page() {
  return <HalamanPostTestSiswa />;
}
