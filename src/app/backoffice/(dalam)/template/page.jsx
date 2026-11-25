import { t } from '@/utils/i18n';
import HalamanDaftarTemplate from '@/modules/template/HalamanDaftarTemplate';

export const metadata = { title: t('judulHalaman.template') };

/** Daftar template. */
export default function Page({ searchParams }) {
  return <HalamanDaftarTemplate searchParams={searchParams} />;
}
