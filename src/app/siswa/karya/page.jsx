import { t } from '@/utils/i18n';
import HalamanKaryaSiswa from '@/modules/karya/HalamanKaryaSiswa';
export const metadata = { title: t('judulHalaman.karya') };
/** Galeri karya siswa. */
export default function Page({ searchParams }) {
  return <HalamanKaryaSiswa searchParams={searchParams} />;
}
