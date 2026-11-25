import { t } from '@/utils/i18n';
import HalamanRapor from '@/modules/rapor/HalamanRapor';
export const metadata = { title: t('judulHalaman.ortu') };
/** Rapor orang tua (lihat saja). */
export default function Page({ searchParams }) {
  return <HalamanRapor searchParams={searchParams} />;
}
