import { t } from '@/utils/i18n';
import Button from './Button';
import Card from './Card';
import TautanTombol from './TautanTombol';

/**
 * Form filter daftar berbasis GET (tanpa JavaScript pun berfungsi): isian dikirim sebagai query string ke
 * halaman yang sama, sehingga halaman kembali ke nomor 1. `hrefReset` menuju halaman tanpa filter.
 */
export default function FormFilter({ hrefReset, children }) {
  return (
    <Card as="form" method="get" role="search" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" ikon="filter">
          {t('umum.terapkan')}
        </Button>
        <TautanTombol href={hrefReset} varian="hantu">
          {t('umum.reset')}
        </TautanTombol>
      </div>
    </Card>
  );
}
