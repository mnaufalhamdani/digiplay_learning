import { redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import { KUNCI_PENGATURAN } from '@/enums';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Card from '@/modules/shared/ui/Card';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import FormMasukKode from './FormMasukKode';

/** Halaman masuk area siswa: Zippy menyapa dan kolom kode untuk siswa maupun orang tua. */
export default async function HalamanMasukKode() {
  const dep = ambilDep();
  const [sesiSiswa, branding, info, pengaturan] = await Promise.all([
    dep.authController.sesiSiswa(),
    dep.pengaturanController.branding(),
    infoPermintaan(),
    dep.pengaturanController.semua(),
  ]);
  // siswa yang masih login di perangkat ini langsung ke beranda (login ulang akan ditolak "sedang dipakai")
  if (sesiSiswa) redirect(gabungJalur(info.basis, '/'));

  return (
    <ShellSiswa branding={branding} basis={info.basis} mode="masuk">
      <Card varian="terangkat" className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
        <Maskot suasana="sapa" ukuran={110} />
        <h1 className="text-[1.8em] font-bold">{t('auth.sapaJudul')}</h1>
        <p className="mb-4 text-muted">{t('auth.sapaPesan')}</p>
        <FormMasukKode panjang={Number(pengaturan[KUNCI_PENGATURAN.PANJANG_KODE_AKSES])} />
      </Card>
    </ShellSiswa>
  );
}
