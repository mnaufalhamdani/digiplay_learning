import { ambilDep } from '@/di/container';
import { t } from '@/utils/i18n';
import { KATEGORI_GAMBAR } from '@/enums';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';
import LihatSaja from '@/modules/sesi/LihatSaja';
import KlienLatihanMouse from './KlienLatihanMouse';
import KlienPuzzle from './KlienPuzzle';

/** Tugas dari `?tugas=` bila milik siswa, masih belum, dan bertipe sesuai; selain itu null (mode bebas). */
async function tugasDariQuery(searchParams, sesiSiswa, tipe) {
  const { tugas } = await searchParams;
  const data = await ambilDep().tugasController.untukLatihan(String(tugas ?? ''), sesiSiswa);
  return data?.tipe === tipe ? data : null;
}

/** Halaman Latihan Mouse (siswa); di luar sesi berlangsung mode lihat saja. */
export async function HalamanLatihanMouse({ searchParams }) {
  const k = await konteksSiswa();
  const tugas = k.sesi ? await tugasDariQuery(searchParams, k.sesiSiswa, 'game_mouse') : null;
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      {k.sesi ? <KlienLatihanMouse tugas={tugas} /> : <LihatSaja judul={t('sesiSiswa.menu.latihanMouse')} />}
    </ShellSiswa>
  );
}

/** Halaman Puzzle (siswa); di luar sesi berlangsung mode lihat saja. `?tugas=` memakai gambar dan keping dari tugas. */
export async function HalamanPuzzle({ searchParams }) {
  const k = await konteksSiswa();
  const tugas = k.sesi ? await tugasDariQuery(searchParams, k.sesiSiswa, 'puzzle') : null;
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      {k.sesi ? <KlienPuzzle tugas={tugas} kategori={KATEGORI_GAMBAR} /> : <LihatSaja judul={t('sesiSiswa.menu.puzzle')} />}
    </ShellSiswa>
  );
}
