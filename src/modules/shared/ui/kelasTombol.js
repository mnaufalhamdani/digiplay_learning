// Kelas tombol tanpa 'use client', agar server component (mis. tautan unduh) bisa tampil sama dengan Button.

/**
 * Dasar tombol. Tinggi minimum dari token area (--tap), minimal 44 px di layar sempit.
 * Bibir 3D memakai --edge: area siswa 5 px (tombol "gemuk" yang turun saat ditekan), pengelola 0 (datar).
 */
const DASAR =
  'inline-flex select-none items-center justify-center gap-2 rounded-[var(--r-btn)] font-bold transition-[transform,box-shadow,background-color] duration-[var(--dur-cepat)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 enabled:active:translate-y-[var(--edge)] enabled:active:shadow-none';

/** Warna per varian beserta warna bibir 3D-nya. */
const VARIAN = {
  primary: 'bg-primary text-on-primary shadow-[0_var(--edge)_0_0_var(--primary-edge)] enabled:hover:brightness-110',
  secondary: 'border-2 border-line bg-panel text-fg shadow-[0_var(--edge)_0_0_var(--line)] enabled:hover:bg-primary-soft',
  sukses: 'bg-ok text-on-ok shadow-[0_var(--edge)_0_0_var(--ok-edge)] enabled:hover:brightness-110',
  bahaya: 'bg-bad text-on-bad shadow-[0_var(--edge)_0_0_var(--bad-edge)] enabled:hover:brightness-110',
  hantu: 'bg-transparent text-primary-text enabled:hover:bg-primary-soft',
};

/** Ukuran: md mengikuti --tap, lg mengikuti --tap-lg. */
const UKURAN = {
  md: 'min-h-[max(2.75rem,var(--tap))] px-4 sm:min-h-[var(--tap)]',
  lg: 'min-h-[max(2.75rem,var(--tap-lg))] px-6 text-[1.1em] sm:min-h-[var(--tap-lg)]',
};

/** Kelas tombol agar tautan (<a>, <Link>) bisa tampil sama dengan Button. */
export function kelasTombol({ varian = 'primary', ukuran = 'md', penuh = false } = {}) {
  return `${DASAR} ${VARIAN[varian] ?? VARIAN.primary} ${UKURAN[ukuran] ?? UKURAN.md} ${penuh ? 'w-full' : ''}`;
}
