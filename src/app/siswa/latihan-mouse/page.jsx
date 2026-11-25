import { t } from '@/utils/i18n';
import { HalamanLatihanMouse } from '@/modules/latihan/HalamanLatihan';

export const metadata = { title: t('judulHalaman.latihanMouse') };

/** Game latihan mouse. */
export default function Page({ searchParams }) {
  return <HalamanLatihanMouse searchParams={searchParams} />;
}
