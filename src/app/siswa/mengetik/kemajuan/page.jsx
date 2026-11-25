import { t } from '@/utils/i18n';
import { HalamanKemajuanMengetik } from '@/modules/mengetik/HalamanMengetik';

export const metadata = { title: t('judulHalaman.kemajuanMengetik') };

/** Kemajuan mengetik. */
export default function Page() {
  return <HalamanKemajuanMengetik />;
}
