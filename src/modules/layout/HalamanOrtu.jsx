import { ambilDep } from '@/di/container';
import { wajibOrtu } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { t } from '@/utils/i18n';
import ShellSiswa from './ShellSiswa';
import Card from '@/modules/shared/ui/Card';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/** Halaman orang tua (placeholder Fase A): nama siswa; rapor menyusul di Fase F. */
export default async function HalamanOrtu() {
  const sesi = await wajibOrtu();
  const [branding, info] = await Promise.all([ambilDep().pengaturanController.branding(), infoPermintaan()]);
  return (
    <ShellSiswa branding={branding} basis={info.basis} mode="ortu">
      <Card className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
        <Maskot suasana="menunjuk" ukuran={110} />
        <p className="text-muted">{t('ortu.pantauan')}</p>
        <h1 className="text-[1.6em] font-bold">{sesi.nama}</h1>
        <p className="text-muted">{t('ortu.raporMenyusul')}</p>
      </Card>
    </ShellSiswa>
  );
}
