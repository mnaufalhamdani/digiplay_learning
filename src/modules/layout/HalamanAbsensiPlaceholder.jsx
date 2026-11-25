import { wajibPengguna } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import EmptyState from '@/modules/shared/ui/EmptyState';

/** Halaman Absensi sementara (Fase B); diganti modul `sesi` di Fase C. */
export default async function HalamanAbsensiPlaceholder() {
  await wajibPengguna();
  return (
    <div className="space-y-4">
      <h1 className="text-[1.5em] font-bold">{t('menu.absensi')}</h1>
      <EmptyState judul={t('absensi.menyusul')} pesan={t('absensi.menyusulPesan')} ikon="absensi" />
    </div>
  );
}
