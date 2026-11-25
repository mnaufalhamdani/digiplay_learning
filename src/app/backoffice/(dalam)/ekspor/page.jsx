import { t } from '@/utils/i18n';
import HalamanEkspor from '@/modules/ekspor/HalamanEkspor';
export const metadata = { title: t('judulHalaman.ekspor') };
/** Ekspor CSV (admin dan tutor). */
export default function Page() {
  return <HalamanEkspor />;
}
