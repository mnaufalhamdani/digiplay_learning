import { t } from '@/utils/i18n';
import HalamanAbsensi from '@/modules/sesi/HalamanAbsensi';

export const metadata = { title: t('judulHalaman.absensi') };

/** Absensi: absen masuk dan sesi berlangsung. */
export default function Page() {
  return <HalamanAbsensi />;
}
