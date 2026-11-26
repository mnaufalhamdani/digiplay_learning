import { t } from '@/utils/i18n';
import HalamanDaftarMateri from '@/modules/materi/HalamanDaftarMateri';

export const metadata = { title: t('judulHalaman.materi') };

/** Daftar materi pertemuan (pengelola). */
export default function Page() {
  return <HalamanDaftarMateri />;
}
