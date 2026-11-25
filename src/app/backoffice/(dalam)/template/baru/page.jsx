import { t } from '@/utils/i18n';
import HalamanFormTemplate from '@/modules/template/HalamanFormTemplate';

export const metadata = { title: t('judulHalaman.templateBaru') };

/** Tambah template (admin). */
export default function Page() {
  return <HalamanFormTemplate />;
}
