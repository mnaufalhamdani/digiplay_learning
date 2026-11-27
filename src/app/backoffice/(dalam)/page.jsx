import { t } from '@/utils/i18n';
import HalamanDashboard from '@/modules/rapor/HalamanDashboard';
export const metadata = { title: t('judulHalaman.beranda') };
/** Beranda backoffice: dashboard ringkasan dan grafik; filter bulan/level dibaca dari query URL. */
export default function Page({ searchParams }) {
  return <HalamanDashboard searchParams={searchParams} />;
}
