import { t } from '@/utils/i18n';
import HalamanDetailMateri from '@/modules/materi/HalamanDetailMateri';

export const metadata = { title: t('judulHalaman.detailMateri') };

/** Pratinjau materi sebuah pertemuan (pengelola). */
export default function Page({ params }) {
  return <HalamanDetailMateri params={params} />;
}
