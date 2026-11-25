import { t } from '@/utils/i18n';
import HalamanKaryaPengelola from '@/modules/karya/HalamanKaryaPengelola';
export const metadata = { title: t('judulHalaman.karya') };
/** Galeri semua karya (admin dan tutor). */
export default function Page({ searchParams }) {
  return <HalamanKaryaPengelola searchParams={searchParams} />;
}
