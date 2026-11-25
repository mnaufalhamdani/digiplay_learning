import { t } from '@/utils/i18n';
import { HalamanPuzzle } from '@/modules/latihan/HalamanLatihan';

export const metadata = { title: t('judulHalaman.puzzle') };

/** Puzzle. */
export default function Page({ searchParams }) {
  return <HalamanPuzzle searchParams={searchParams} />;
}
