import { t } from '@/utils/i18n';
import HalamanPengguna from '@/modules/pengguna/HalamanPengguna';

export const metadata = { title: t('judulHalaman.pengguna') };

/** Kelola akun admin dan tutor (admin). */
export default function Page({ searchParams }) {
  return <HalamanPengguna searchParams={searchParams} />;
}
