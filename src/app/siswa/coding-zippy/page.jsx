import { t } from '@/utils/i18n';
import HalamanCodingZippy from '@/modules/blockly/HalamanCodingZippy';

export const metadata = { title: t('judulHalaman.codingZippy') };

/** Daftar labirin Coding Zippy. */
export default function Page({ searchParams }) {
  return <HalamanCodingZippy searchParams={searchParams} />;
}
