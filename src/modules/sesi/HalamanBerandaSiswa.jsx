import { redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { wajibSiswa } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import { keamananConfig } from '@/config/keamanan.config';
import { NOMOR_POST_TEST } from '@/enums';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Card from '@/modules/shared/ui/Card';
import Badge from '@/modules/shared/ui/Badge';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import DaftarTugasSiswa from './DaftarTugasSiswa';

/** Tampilan lihat saja saat siswa belum diabsen tutor (Zippy tidur). */
function BelumAbsen({ nama }) {
  return (
    <Card varian="terangkat" className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <Maskot suasana="tidur" ukuran={150} />
      <h1 className="font-display text-[1.8em] font-bold">{t('siswa.halo', { nama })}</h1>
      <Badge nada="peringatan">
        <Ikon nama="gembok" />
        {t('siswa.belumAbsen')}
      </Badge>
      <p className="max-w-md text-muted">{t('siswa.belumAbsenPesan')}</p>
    </Card>
  );
}

/**
 * Beranda siswa (modul sesi, C6): saat sesi berlangsung tampil status sesi, kemajuan, dan daftar tugas;
 * selain itu mode lihat saja. Halaman ikut berubah sendiri lewat ping saat tutor mengabsen/menutup sesi.
 * Bila materi pertemuan ini belum ditandai paham, siswa diarahkan ke materi lebih dulu (tugas terkunci di server).
 */
export default async function HalamanBerandaSiswa() {
  const sesiSiswa = await wajibSiswa();
  const dep = ambilDep();
  const [branding, info, sesi] = await Promise.all([dep.pengaturanController.branding(), infoPermintaan(), dep.sesiController.berandaSiswa(null, sesiSiswa)]);
  // materi tampil lebih dulu sebelum daftar tugas
  if (sesi?.materi.terkunci) redirect(gabungJalur(info.basis, `/materi/${sesi.pertemuanId}`));
  // pertemuan post test: kartu Mulai/Lanjutkan Post Test (D2)
  const postTest = sesi?.pertemuanNomor === NOMOR_POST_TEST ? await dep.posttestController.statusBeranda(null, sesiSiswa) : null;
  return (
    <ShellSiswa branding={branding} basis={info.basis} mode="siswa" intervalPingMs={keamananConfig.intervalPingDetik * 1000} sesiAktifId={sesi?.id ?? null}>
      {sesi ? <DaftarTugasSiswa nama={sesiSiswa.nama} sesi={sesi} postTest={postTest} /> : <BelumAbsen nama={sesiSiswa.nama} />}
    </ShellSiswa>
  );
}
