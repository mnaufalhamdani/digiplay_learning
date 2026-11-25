import { t } from '@/utils/i18n';
import HalamanBerandaSiswa from '@/modules/sesi/HalamanBerandaSiswa';

export const metadata = { title: t('judulHalaman.beranda') };

/** Beranda siswa. */
export default function Page() {
  return <HalamanBerandaSiswa />;
}
