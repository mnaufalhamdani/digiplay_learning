import { ambilDep } from '@/di/container';
import { wajibSiswa } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { t } from '@/utils/i18n';
import { keamananConfig } from '@/config/keamanan.config';
import ShellSiswa from './ShellSiswa';
import Card from '@/modules/shared/ui/Card';
import Badge from '@/modules/shared/ui/Badge';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/** Beranda siswa (placeholder Fase A): sapaan dan status "belum absen" sebagai tampilan lihat saja. */
export default async function HalamanBerandaSiswa() {
  const sesi = await wajibSiswa();
  const [branding, info] = await Promise.all([ambilDep().pengaturanController.branding(), infoPermintaan()]);
  return (
    <ShellSiswa branding={branding} basis={info.basis} mode="siswa" intervalPingMs={keamananConfig.intervalPingDetik * 1000}>
      <Card varian="terangkat" className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <Maskot suasana="tidur" ukuran={150} />
        <h1 className="text-[1.8em] font-bold">{t('siswa.halo', { nama: sesi.nama })}</h1>
        <Badge nada="peringatan">
          <Ikon nama="info" />
          {t('siswa.belumAbsen')}
        </Badge>
        <p className="max-w-md text-muted">{t('siswa.belumAbsenPesan')}</p>
      </Card>
    </ShellSiswa>
  );
}
