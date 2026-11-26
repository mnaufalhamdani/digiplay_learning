import { t } from '@/utils/i18n';
import HalamanMateriSiswa from '@/modules/materi/HalamanMateriSiswa';

export const metadata = { title: t('judulHalaman.bacaMateri') };

/** Satu materi pertemuan untuk siswa. */
export default function Page({ params }) {
  return <HalamanMateriSiswa params={params} />;
}
