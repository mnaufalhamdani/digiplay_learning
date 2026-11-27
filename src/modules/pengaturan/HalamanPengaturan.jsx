import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import { DAFTAR_SLOT_LOGO, SLOT_LOGO } from '@/enums';
import FormPengaturan from './FormPengaturan';
import UnggahLogo from './UnggahLogo';
import UnggahTandaTangan from './UnggahTandaTangan';

/** Halaman Pengaturan (khusus admin): identitas, logo, batas sesi, aturan post test, dan tanda tangan sertifikat. */
export default async function HalamanPengaturan() {
  await wajibAdmin();
  const dep = ambilDep();
  const [nilai, branding, tandaTanganUrl] = await Promise.all([dep.pengaturanController.semua(), dep.pengaturanController.branding(), dep.pengaturanController.tandaTanganUrl()]);
  return (
    <div className="space-y-6">
      <h1 className="text-[1.5em] font-bold">{t('pengaturan.judul')}</h1>
      {/* kelompok Logo: satu slot per fungsi (utama, ikon, persegi dengan teks, sertifikat) */}
      <section className="space-y-3" aria-labelledby="judul-logo">
        <h2 id="judul-logo" className="text-[1.15em] font-bold">{t('pengaturan.logoKelompok')}</h2>
        <p className="text-muted">{t('pengaturan.logoKelompokPetunjuk')}</p>
        {DAFTAR_SLOT_LOGO.map((slot) => (
          <UnggahLogo key={slot} slot={slot} url={branding.logo[slot]} urlGelap={branding.logoGelap[slot]} terunggah={branding.logoTerunggah[slot]} tanpaWebp={SLOT_LOGO[slot].tanpaWebp} />
        ))}
      </section>
      <FormPengaturan awal={nilai} tandaTangan={<UnggahTandaTangan tandaTanganUrl={tandaTanganUrl} />} />
    </div>
  );
}
