import { t } from '@/utils/i18n';
import { HalamanDaftarPostTest } from '@/modules/posttest/HalamanPostTestPengelola';

export const metadata = { title: t('judulHalaman.postTest') };

/** Daftar post test (pengelola). */
export default function Page({ searchParams }) {
  return <HalamanDaftarPostTest searchParams={searchParams} />;
}
