import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import FormPengaturan from './FormPengaturan';
import UnggahLogo from './UnggahLogo';

/** Halaman Pengaturan (khusus admin): identitas, logo, batas sesi, dan aturan post test. */
export default async function HalamanPengaturan() {
  await wajibAdmin();
  const dep = ambilDep();
  const [nilai, branding] = await Promise.all([dep.pengaturanController.semua(), dep.pengaturanController.branding()]);
  return (
    <div className="space-y-6">
      <h1 className="text-[1.5em] font-bold">{t('pengaturan.judul')}</h1>
      <UnggahLogo logoUrl={branding.logoUrl} />
      <FormPengaturan awal={nilai} />
    </div>
  );
}
