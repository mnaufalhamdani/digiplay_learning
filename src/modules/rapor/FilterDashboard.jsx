'use client';
import { t } from '@/utils/i18n';
import { jalurQuery } from '@/utils/jalurArea';
import Ikon from '@/modules/shared/ui/Ikon';
import { namaBulan, tambahBulan } from './dashboard.helper';
import { useDashboard } from './PembungkusDashboard';

/** Kelas tombol bulat kecil (panah bulan); area sentuh minimal 44 px. */
const KELAS_PANAH = 'inline-flex size-11 items-center justify-center rounded-full text-primary-text enabled:hover:bg-primary-soft disabled:opacity-40';

/**
 * Bar filter dashboard: pengatur bulan, pilihan level, dan Atur ulang. Keadaan disimpan di query URL (`?bulan=&level=`);
 * mengganti filter memuat ulang halaman di server lewat PembungkusDashboard. Di HP berupa chip yang bisa digulir mendatar.
 */
export default function FilterDashboard({ filter, level, jalurDasar }) {
  const { memuat, pindah } = useDashboard();
  const adaMundur = filter.bulan > filter.bulanMin;
  const adaMaju = filter.bulan < filter.bulanBerjalan;
  /** Membangun alamat halaman untuk bulan dan level tertentu; bulan berjalan tidak perlu ditulis (itu bawaan). */
  const alamat = (bulan, levelId) => jalurQuery(jalurDasar, { bulan: bulan === filter.bulanBerjalan ? undefined : bulan, level: levelId });
  return (
    <div role="group" aria-label={t('beranda.dashboard.filter.label')} className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      <div className="inline-flex shrink-0 items-center rounded-full border border-line bg-panel">
        <button type="button" disabled={!adaMundur || memuat} onClick={() => pindah(alamat(tambahBulan(filter.bulan, -1), filter.levelId))} aria-label={t('beranda.dashboard.filter.bulanSebelumnya')} className={KELAS_PANAH}>
          <Ikon nama="kiri" />
        </button>
        <span role="status" aria-live="polite" className="min-w-[8.5rem] px-1 text-center font-semibold">
          <span className="sr-only">{t('beranda.dashboard.filter.periode')}: </span>
          {namaBulan(filter.bulan)}
        </span>
        <button type="button" disabled={!adaMaju || memuat} onClick={() => pindah(alamat(tambahBulan(filter.bulan, 1), filter.levelId))} aria-label={t('beranda.dashboard.filter.bulanBerikutnya')} className={KELAS_PANAH}>
          <Ikon nama="kanan" />
        </button>
      </div>
      <div className="shrink-0">
        <label htmlFor="filter-level-dashboard" className="sr-only">
          {t('beranda.dashboard.filter.level')}
        </label>
        <select
          id="filter-level-dashboard"
          value={filter.levelId ?? ''}
          disabled={memuat}
          onChange={(e) => pindah(alamat(filter.bulan, e.target.value || undefined))}
          className="min-h-11 rounded-full border border-line bg-panel px-4 font-semibold text-fg focus:border-primary focus:outline-none"
        >
          <option value="">{t('beranda.dashboard.filter.semuaLevel')}</option>
          {level.map((l) => (
            <option key={l.id} value={l.id}>
              {t('beranda.dashboard.filter.opsiLevel', { urutan: l.urutan, nama: l.nama })}
            </option>
          ))}
        </select>
      </div>
      {/* Atur ulang hanya bila filter bukan bawaan */}
      {!filter.bawaan && (
        <button type="button" disabled={memuat} onClick={() => pindah(jalurDasar)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 font-bold text-primary-text hover:bg-primary-soft disabled:opacity-60">
          <Ikon nama="kembalikan" />
          {t('beranda.dashboard.filter.aturUlang')}
        </button>
      )}
    </div>
  );
}
