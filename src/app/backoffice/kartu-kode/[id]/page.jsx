import { t } from '@/utils/i18n';
import HalamanKartuKode from '@/modules/siswa/HalamanKartuKode';

export const metadata = { title: t('judulHalaman.kartuKode') };

/** Kartu kode siswa untuk dicetak (tanpa kerangka pengelola). */
export default function Page({ params }) {
  return <HalamanKartuKode params={params} />;
}
