import { t } from '@/utils/i18n';
import Card from './Card';
import EmptyState from './EmptyState';
import Ikon from './Ikon';
import Skeleton from './Skeleton';

/**
 * Pembungkus satu grafik di dashboard: judul, keterangan kecil, aksi opsional di kanan atas, lalu isi grafik.
 * Tiga keadaan khusus: `galat` (query bagian ini gagal; kartu lain tetap tampil), `kosong` (tidak ada data pada periode;
 * kartu tidak disembunyikan), dan memuat (Skeleton muncul selama leluhur ber-`group/dash` bertanda `data-memuat="true"`,
 * mis. saat filter diganti). Komponen ini server component: keadaan memuat diatur murni dengan CSS.
 */
export default function KartuGrafik({ judul, keterangan = null, aksi = null, galat = false, kosong = false, tinggiSkeleton = 'h-36', className = '', children }) {
  let isi = children;
  // galat didahulukan: data tidak ada sama sekali, jangan menampilkan "belum ada data"
  if (galat) {
    isi = (
      <p role="alert" className="flex items-center gap-2 py-6 text-bad">
        <Ikon nama="peringatan" />
        {t('beranda.dashboard.galatKartu')}
      </p>
    );
  } else if (kosong) {
    isi = <EmptyState tersemat ikon="grafik" judul={t('beranda.dashboard.belumAdaData')} pesan={t('beranda.dashboard.belumAdaDataPesan')} />;
  }
  return (
    <Card as="section" aria-label={judul} className={`min-w-0 space-y-3 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold">{judul}</h2>
          {keterangan && <p className="text-[0.85em] text-muted">{keterangan}</p>}
        </div>
        {aksi && <div className="shrink-0">{aksi}</div>}
      </header>
      {/* isi disembunyikan, bukan dibuang, selama memuat agar susunan kartu tidak melompat */}
      <div className="group-data-[memuat=true]/dash:hidden">{isi}</div>
      <Skeleton className={`hidden w-full group-data-[memuat=true]/dash:block ${tinggiSkeleton}`} />
    </Card>
  );
}
