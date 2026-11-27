import { redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import BingkaiPengelola from '@/modules/layout/BingkaiPengelola';
import LogoAplikasi from '@/modules/layout/LogoAplikasi';
import Card from '@/modules/shared/ui/Card';
import FormMasukPengelola from './FormMasukPengelola';

/** Halaman masuk backoffice untuk admin dan tutor. */
export default async function HalamanMasukPengelola() {
  const dep = ambilDep();
  const [sesi, branding, info] = await Promise.all([dep.authController.sesiPengguna(), dep.pengaturanController.branding(), infoPermintaan()]);
  // sudah login: tidak perlu masuk lagi
  if (sesi) redirect(gabungJalur(info.basis, '/'));

  return (
    <BingkaiPengelola branding={branding} basis={info.basis}>
      <Card varian="terangkat" className="w-full max-w-sm">
        <div className="mb-3 flex justify-center">
          <LogoAplikasi branding={branding} varian="persegiTeks" />
        </div>
        <h1 className="mb-1 text-[1.5em] font-bold">{t('auth.masukPengelolaJudul')}</h1>
        <p className="mb-5 text-muted">{t('auth.masukPengelolaPesan')}</p>
        <FormMasukPengelola />
      </Card>
    </BingkaiPengelola>
  );
}
