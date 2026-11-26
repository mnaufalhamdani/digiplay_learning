import { access } from 'node:fs/promises';
import path from 'node:path';
import { ambilDep } from '@/di/container';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Card from '@/modules/shared/ui/Card';
import GrafikKemajuan from '@/modules/shared/ui/domain/GrafikKemajuan';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import { gabungJalur } from '@/utils/jalurArea';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';
import LihatSaja from '@/modules/sesi/LihatSaja';
import KlienMengetik from './KlienMengetik';
import PetaPanasKeyboard from './PetaPanasKeyboard';

/** URL gambar posisi jari bila berkasnya ada di public/aset/mengetik; null bila belum disediakan. */
async function urlPosisiJari(folderAset) {
  try {
    await access(path.join(folderAset, 'mengetik', 'posisi-jari.png'));
    return '/aset/mengetik/posisi-jari.png';
  } catch {
    // berkas belum disediakan pemilik: gambar tidak ditampilkan (bukan galat)
    return null;
  }
}

/** Halaman Mengetik (siswa). Di luar sesi berlangsung: mode lihat saja. `?tugas=` membuka teks tugas mengetik. */
export async function HalamanMengetik({ searchParams }) {
  const k = await konteksSiswa();
  const dep = ambilDep();
  const { tugas: tugasId } = await searchParams;
  const [pelajaran, tugas, gambarJari] = k.sesi ? await Promise.all([dep.mengetikController.pelajaran(null, k.sesiSiswa), dep.tugasController.untukLatihan(String(tugasId ?? ''), k.sesiSiswa), urlPosisiJari(dep.folderAset)]) : [[], null, null];
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      {k.sesi ? <KlienMengetik pelajaran={pelajaran} tugas={tugas?.tipe === 'mengetik' ? tugas : null} gambarJari={gambarJari} /> : <LihatSaja judul={t('sesiSiswa.menu.mengetik')} />}
    </ShellSiswa>
  );
}

/** Halaman Kemajuan mengetik: grafik WPM/akurasi 20 hasil terakhir dan peta panas tombol 30 hasil terakhir. */
export async function HalamanKemajuanMengetik() {
  const k = await konteksSiswa();
  const kemajuan = await ambilDep().mengetikController.kemajuan(null, k.sesiSiswa);
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      <div className="space-y-6">
        <TautanTombol href={gabungJalur(k.basis, '/mengetik')} varian="hantu" ikon="kembali">
          {t('sesiSiswa.menu.mengetik')}
        </TautanTombol>
        <h1 className="font-display text-[1.8em] font-bold">{t('mengetik.kemajuan')}</h1>
        <Card className="space-y-3">
          <h2 className="text-[1.2em] font-bold">{t('mengetik.grafikJudul')}</h2>
          <GrafikKemajuan data={kemajuan.grafik} />
        </Card>
        <Card className="space-y-3">
          <h2 className="text-[1.2em] font-bold">{t('mengetik.petaPanas')}</h2>
          <PetaPanasKeyboard detail={kemajuan.petaPanas} />
        </Card>
      </div>
    </ShellSiswa>
  );
}
