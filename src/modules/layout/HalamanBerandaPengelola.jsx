import { wajibPengguna } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import Card from '@/modules/shared/ui/Card';

/** Beranda backoffice (placeholder Fase A). */
export default async function HalamanBerandaPengelola() {
  const sesi = await wajibPengguna();
  return (
    <div className="space-y-4">
      <h1 className="text-[1.5em] font-bold">{t('beranda.halo', { nama: sesi.nama })}</h1>
      <Card>
        <p className="text-muted">{t('beranda.placeholder')}</p>
      </Card>
    </div>
  );
}
