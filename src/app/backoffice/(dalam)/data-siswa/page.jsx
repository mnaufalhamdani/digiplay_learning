import { t } from '@/utils/i18n';
import HalamanDaftarSiswa from '@/modules/siswa/HalamanDaftarSiswa';

export const metadata = { title: t('judulHalaman.siswa') };

/** Daftar siswa (admin dan tutor). */
export default function Page({ searchParams }) {
  return <HalamanDaftarSiswa searchParams={searchParams} />;
}
