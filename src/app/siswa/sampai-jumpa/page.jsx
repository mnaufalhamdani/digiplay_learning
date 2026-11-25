import { t } from '@/utils/i18n';
import HalamanSampaiJumpa from '@/modules/sesi/HalamanSampaiJumpa';

export const metadata = { title: t('judulHalaman.sampaiJumpa') };

/** Halaman setelah siswa menekan Pulang. */
export default function Page() {
  return <HalamanSampaiJumpa />;
}
