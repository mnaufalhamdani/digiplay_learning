import { t } from '@/utils/i18n';
import HalamanMasukKode from '@/modules/auth/HalamanMasukKode';

export const metadata = { title: t('judulHalaman.masuk') };

/** Halaman masuk dengan kode siswa atau orang tua. */
export default function Page() {
  return <HalamanMasukKode />;
}
