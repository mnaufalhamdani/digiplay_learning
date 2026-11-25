import { t } from '@/utils/i18n';
import TautanTombol from './TautanTombol';

/**
 * Navigasi halaman sebelumnya/berikutnya beserta posisi "Halaman x dari y (n data)".
 * `hrefHalaman(n)` membentuk tautan halaman ke-n (filter ikut terbawa). Tanpa hook: aman di server component.
 */
export default function Paginasi({ halaman, totalHalaman, total, hrefHalaman }) {
  // satu halaman saja: cukup tampilkan jumlah data
  if (totalHalaman <= 1) return <p className="text-muted">{t('paginasi.jumlah', { total })}</p>;
  return (
    <nav aria-label={t('paginasi.label')} className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted">{t('paginasi.posisi', { halaman, totalHalaman, total })}</p>
      <div className="flex gap-2">
        {/* halaman pertama/terakhir: tombol tetap tampil tetapi nonaktif agar tata letak tidak bergeser */}
        <TautanTombol href={hrefHalaman(halaman - 1)} varian="secondary" ikon="kiri" nonaktif={halaman <= 1}>
          {t('paginasi.sebelumnya')}
        </TautanTombol>
        <TautanTombol href={hrefHalaman(halaman + 1)} varian="secondary" ikonAkhir="kanan" nonaktif={halaman >= totalHalaman}>
          {t('paginasi.berikutnya')}
        </TautanTombol>
      </div>
    </nav>
  );
}
