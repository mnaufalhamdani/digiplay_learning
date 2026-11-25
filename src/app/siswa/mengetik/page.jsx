import { t } from '@/utils/i18n';
import { HalamanMengetik } from '@/modules/mengetik/HalamanMengetik';

export const metadata = { title: t('judulHalaman.mengetik') };

/** Mengetik: pelajaran, latihan, game. */
export default function Page({ searchParams }) {
  return <HalamanMengetik searchParams={searchParams} />;
}
