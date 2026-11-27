import { ambilDep } from '@/di/container';
import { KATEGORI_GAMBAR, MENU_GAME } from '@/enums';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import { konteksSiswa, wajibMenuTerbuka } from '@/modules/sesi/konteksSiswa';
import KlienLatihanMouse from './KlienLatihanMouse';
import KlienPuzzle from './KlienPuzzle';

/** Tugas dari `?tugas=` bila milik siswa, masih belum, dan bertipe sesuai; selain itu null (mode bebas). */
async function tugasDariQuery(searchParams, sesiSiswa, tipe) {
  const { tugas } = await searchParams;
  const data = await ambilDep().tugasController.untukLatihan(String(tugas ?? ''), sesiSiswa);
  return data?.tipe === tipe ? data : null;
}

/** Halaman Latihan Mouse (siswa); tetap bisa dimainkan tanpa sesi berlangsung, tetapi hasilnya tidak disimpan. */
export async function HalamanLatihanMouse({ searchParams }) {
  const k = await konteksSiswa();
  // game mouse terbuka setelah tugas game_mouse pertama muncul (satu tugas membuka kelima game)
  wajibMenuTerbuka(k, MENU_GAME.LATIHAN_MOUSE);
  // tugas hanya relevan saat sesi berlangsung; tanpa sesi dimainkan sebagai mode bebas
  const tugas = k.sesi ? await tugasDariQuery(searchParams, k.sesiSiswa, 'game_mouse') : null;
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null} menuTerbuka={k.menuTerbuka}>
      <KlienLatihanMouse tugas={tugas} sesiAktif={Boolean(k.sesi)} />
    </ShellSiswa>
  );
}

/** Halaman Puzzle (siswa); tetap bisa dimainkan tanpa sesi berlangsung, tetapi hasilnya tidak disimpan. `?tugas=` memakai gambar dan keping dari tugas. */
export async function HalamanPuzzle({ searchParams }) {
  const k = await konteksSiswa();
  // tugas hanya relevan saat sesi berlangsung; tanpa sesi dimainkan sebagai mode bebas
  const tugas = k.sesi ? await tugasDariQuery(searchParams, k.sesiSiswa, 'puzzle') : null;
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null} menuTerbuka={k.menuTerbuka}>
      <KlienPuzzle tugas={tugas} kategori={KATEGORI_GAMBAR} sesiAktif={Boolean(k.sesi)} />
    </ShellSiswa>
  );
}
