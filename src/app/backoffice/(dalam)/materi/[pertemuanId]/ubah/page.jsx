import { t } from '@/utils/i18n';
import HalamanFormMateri from '@/modules/materi/HalamanFormMateri';

export const metadata = { title: t('judulHalaman.ubahMateri') };

/** Ubah materi sebuah pertemuan (admin). */
export default function Page({ params }) {
  return <HalamanFormMateri params={params} />;
}
