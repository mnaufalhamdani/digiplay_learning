import { t } from '@/utils/i18n';
import HalamanBahan from '@/modules/sesi/HalamanBahan';

export const metadata = { title: t('judulHalaman.bahan') };

/** Bahan unduhan dari tugas sesi ini. */
export default function Page() {
  return <HalamanBahan />;
}
