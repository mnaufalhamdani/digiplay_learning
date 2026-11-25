import { t } from '@/utils/i18n';
import HalamanFormTemplate from '@/modules/template/HalamanFormTemplate';

export const metadata = { title: t('judulHalaman.ubahTemplate') };

/** Ubah template (admin). */
export default function Page({ params }) {
  return <HalamanFormTemplate params={params} />;
}
