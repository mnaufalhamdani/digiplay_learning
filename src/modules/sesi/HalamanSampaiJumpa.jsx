import { ambilDep } from '@/di/container';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Card from '@/modules/shared/ui/Card';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/** Halaman "Sampai jumpa" setelah siswa menekan Pulang (tanpa login; cookie siswa sudah dihapus). */
export default async function HalamanSampaiJumpa() {
  const [branding, info] = await Promise.all([ambilDep().pengaturanController.branding(), infoPermintaan()]);
  return (
    <ShellSiswa branding={branding} basis={info.basis} mode="masuk">
      <Card varian="terangkat" className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <Maskot suasana="sapa" ukuran={150} />
        <h1 className="font-display text-[1.8em] font-bold">{t('sesiSiswa.sampaiJumpa')}</h1>
        <p className="text-muted">{t('sesiSiswa.sampaiJumpaPesan')}</p>
        <TautanTombol href={gabungJalur(info.basis, '/masuk')} ukuran="lg" ikon="masuk">
          {t('sesiSiswa.keMasuk')}
        </TautanTombol>
      </Card>
    </ShellSiswa>
  );
}
