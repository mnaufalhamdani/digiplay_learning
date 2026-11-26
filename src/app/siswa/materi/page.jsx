import { t } from '@/utils/i18n';
import HalamanDaftarMateriSiswa from '@/modules/materi/HalamanDaftarMateriSiswa';

export const metadata = { title: t('judulHalaman.materi') };

/** Pustaka materi siswa. */
export default function Page() {
  return <HalamanDaftarMateriSiswa />;
}
