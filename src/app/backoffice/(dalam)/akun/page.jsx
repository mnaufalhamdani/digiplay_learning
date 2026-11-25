import { t } from '@/utils/i18n';
import HalamanAkun from '@/modules/pengguna/HalamanAkun';

export const metadata = { title: t('judulHalaman.akun') };

/** Akun sendiri: ubah password. */
export default function Page() {
  return <HalamanAkun />;
}
