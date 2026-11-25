import { t } from '@/utils/i18n';
import HalamanSertifikat from '@/modules/sertifikat/HalamanSertifikat';
export const metadata = { title: t('judulHalaman.sertifikat') };
/** Daftar sertifikat (admin dan tutor). */
export default function Page({ searchParams }) {
  return <HalamanSertifikat searchParams={searchParams} />;
}
