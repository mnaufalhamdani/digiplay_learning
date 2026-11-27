'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { AREA } from '@/enums';
import { PenyediaArea } from '@/modules/shared/ui/AreaContext';
import ThemeToggle from '@/modules/shared/ui/ThemeToggle';
import Ikon from '@/modules/shared/ui/Ikon';
import Merek from './Merek';
import AksiSiswa from './AksiSiswa';
import AksiOrtu from './AksiOrtu';
import PingSesi from './PingSesi';

/**
 * Menu latihan siswa: jalur (null = belum tersedia), kunci teks, ikon; `bebas` = terbuka walau belum diabsen;
 * `game` = terbuka bertahap: hanya bila kuncinya ada di `menuTerbuka` (diturunkan dari tugas yang pernah muncul).
 */
const MENU_LATIHAN = [
  // pustaka materi bisa dibuka sebelum maupun sesudah absen (isinya hanya pertemuan yang sudah dilalui)
  { kunci: 'materi', jalur: '/materi', ikon: 'materi', bebas: true },
  // Menu game terbuka bertahap (tugasnya sudah muncul) dan setelah terbuka bisa dicoba tanpa sesi (hasil hanya tersimpan saat sesi berlangsung)
  { kunci: 'latihanMouse', jalur: '/latihan-mouse', ikon: 'mouse', bebas: true, game: true },
  { kunci: 'puzzle', jalur: '/puzzle', ikon: 'puzzle', bebas: true, game: true },
  { kunci: 'codingZippy', jalur: '/coding-zippy', ikon: 'coding', bebas: true, game: true },
  // Studio Zippy: proyek hanya bisa disimpan dan dikirim saat sesi berlangsung
  { kunci: 'studio', jalur: '/studio', ikon: 'studio', bebas: true, game: true },
  { kunci: 'mengetik', jalur: '/mengetik', ikon: 'keyboard', bebas: true, game: true },
  // galeri karya bisa dilihat kapan saja; menambah karya tetap hanya saat sesi berlangsung
  { kunci: 'karya', jalur: '/karya', ikon: 'gambar', bebas: true },
];

/** Satu item menu yang terkunci: ikon gembok dan keterangan sebabnya (tidak mengandalkan warna saja). */
function MenuTerkunci({ label, alasan }) {
  return (
    <span aria-disabled="true" title={alasan} className="inline-flex min-h-11 cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-[var(--r-btn)] px-3 font-bold text-muted">
      <Ikon nama="gembok" />
      {label}
      <span className="sr-only">({alasan})</span>
    </span>
  );
}

/** Tombol panah bulat di tepi menu (muncul hanya bila masih ada menu tersembunyi di sisi itu). */
function PanahMenu({ arah, onKlik }) {
  const kiri = arah === 'kiri';
  return (
    <button
      type="button"
      onClick={onKlik}
      aria-label={t(kiri ? 'siswa.menuKiri' : 'siswa.menuKanan')}
      className={`absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border-2 border-line bg-panel text-fg shadow-md hover:bg-primary-soft motion-safe:transition-transform motion-safe:active:scale-90 ${kiri ? 'left-0' : 'right-0'}`}
    >
      <Ikon nama={arah} bobot="bold" />
    </button>
  );
}

/**
 * Menu siswa satu baris yang bisa digeser: tanpa bilah gulung, tepi memudar, panah kiri/kanan, roda mouse
 * menggeser mendatar, geseran berhenti rapi di awal tiap menu, dan menu aktif otomatis ke tengah. Menu `game` terkunci
 * (gembok + keterangan) sampai kuncinya ada di `menuTerbuka`; `menuTerbuka` null berarti semua terbuka. Menu tanpa tanda
 * `bebas` (saat ini tidak ada) terkunci tanpa sesi ("minta absen dulu").
 */
function MenuSiswa({ basis, sesiAktif, menuTerbuka }) {
  const pathname = usePathname();
  const nav = useRef(null);
  const [tepi, setTepi] = useState({ kiri: false, kanan: false }); // masih ada menu tersembunyi di sisi itu
  /** Membaca posisi gulungan untuk menampilkan pudar dan panah di tepi yang masih punya menu tersembunyi. */
  const bacaTepi = useCallback(() => {
    const el = nav.current;
    if (!el) return;
    const kiri = el.scrollLeft > 4;
    const kanan = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setTepi((s) => (s.kiri === kiri && s.kanan === kanan ? s : { kiri, kanan }));
  }, []);
  /** Menggeser menu satu "layar" ke kiri atau kanan (panah). */
  function geser(arah) {
    const el = nav.current;
    el.scrollBy({ left: (arah === 'kiri' ? -1 : 1) * el.clientWidth * 0.7, behavior: 'smooth' });
  }
  // menu yang sedang dibuka digulung ke tengah (hanya mengubah gulungan menu, bukan halaman), lalu tepi dihitung ulang
  useEffect(() => {
    const el = nav.current;
    const aktif = el?.querySelector('[aria-current="page"]');
    if (aktif) el.scrollTo({ left: aktif.offsetLeft - (el.clientWidth - aktif.offsetWidth) / 2, behavior: 'smooth' });
    bacaTepi();
    window.addEventListener('resize', bacaTepi);
    return () => window.removeEventListener('resize', bacaTepi);
  }, [pathname, bacaTepi]);
  // roda mouse vertikal di atas menu menggeser menu mendatar; listener non-pasif agar halaman tidak ikut bergulir
  useEffect(() => {
    const el = nav.current;
    /** Roda: hanya diambil alih bila menu memang bisa digeser ke arah itu, selain itu halaman bergulir seperti biasa. */
    function roda(e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const bisaKiri = el.scrollLeft > 0;
      const bisaKanan = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      if ((e.deltaY < 0 && !bisaKiri) || (e.deltaY > 0 && !bisaKanan)) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY });
    }
    el.addEventListener('wheel', roda, { passive: false });
    return () => el.removeEventListener('wheel', roda);
  }, []);
  // pudar hanya di tepi yang masih punya menu tersembunyi, agar siswa tahu menu bisa digeser
  const pudar = `linear-gradient(to right, ${tepi.kiri ? 'transparent, #000 3rem' : '#000, #000'}, ${tepi.kanan ? '#000 calc(100% - 3rem), transparent' : '#000, #000'})`;
  const kelas = (aktif) => `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--r-btn)] px-3 font-bold hover:bg-primary-soft ${aktif ? 'bg-primary-soft text-primary-text' : 'text-fg'}`;
  const item = [{ kunci: 'beranda', jalur: '/', ikon: 'beranda', label: t('siswa.beranda') }, ...MENU_LATIHAN.map((m) => ({ ...m, label: t(`sesiSiswa.menu.${m.kunci}`) }))];
  // order-last + w-full: menu selalu di baris kedua; baris pertama berisi merek di kiri dan aksi (Ganti device, Keluar, tema) di kanan
  return (
    <div className="relative order-last w-full">
      {tepi.kiri && <PanahMenu arah="kiri" onKlik={() => geser('kiri')} />}
      <nav ref={nav} onScroll={bacaTepi} aria-label={t('siswa.menu')} style={{ '--pudar': pudar }} className="relative snap-x snap-proximity overflow-x-auto overscroll-x-contain [mask-image:var(--pudar)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex gap-1">
          {item.map((m) => {
            const href = m.jalur ? gabungJalur(basis, m.jalur) : null;
            // tanpa sesi: hanya Beranda dan menu `bebas` yang terbuka; menu tanpa jalur belum tersedia
            const gameTerkunci = Boolean(m.game && menuTerbuka && !menuTerbuka.includes(m.kunci));
            const terkunci = !href || gameTerkunci || (m.jalur !== '/' && !m.bebas && !sesiAktif);
            const aktif = href && (m.jalur === '/' ? pathname === href : pathname.startsWith(href));
            return (
              <li key={m.kunci} className="snap-start">
                {terkunci ? (
                  <MenuTerkunci label={m.label} alasan={t(!href ? 'sesiSiswa.segeraHadir' : gameTerkunci ? 'sesiSiswa.terkunciGame' : 'sesiSiswa.terkunciAbsen')} />
                ) : (
                  <Link href={href} aria-current={aktif ? 'page' : undefined} className={kelas(aktif)}>
                    <Ikon nama={m.ikon} />
                    {m.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {tepi.kanan && <PanahMenu arah="kanan" onKlik={() => geser('kanan')} />}
    </div>
  );
}
/**
 * Kerangka area siswa (data-area="siswa"). `mode`:
 * - 'masuk': hanya merek dan tombol tema;
 * - 'siswa': menu, Ganti device, Keluar (atau Pulang saat sesi aktif), dan ping sesi berkala;
 * - 'ortu' : tampilan orang tua yang lebih tenang (data-mode="ortu") dengan tombol Keluar;
 * - 'fokus': layar post test tanpa menu biasa; `kepalaFokus` (judul dan pewaktu) tampil di header, ping tetap jalan.
 * `sesiAktifId`: ID sesi berlangsung saat halaman dirender (null bila belum absen), dipakai sinkron otomatis.
 * `menuTerbuka`: larik kunci menu game yang sudah terbuka (dari konteksSiswa); null = semua terbuka.
 */
export default function ShellSiswa({ branding, basis, mode, intervalPingMs = 15000, sesiAktifId = null, menuTerbuka = null, kepalaFokus = null, children }) {
  return (
    <PenyediaArea area={AREA.SISWA} basis={basis}>
      <div data-area="siswa" data-mode={mode === 'ortu' ? 'ortu' : undefined} className="min-h-dvh bg-bg font-body text-fg">
        <header className="border-b-2 border-line bg-panel">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
            <Merek branding={branding} keBeranda={mode !== 'masuk'} />
            {mode === 'siswa' && <MenuSiswa basis={basis} sesiAktif={Boolean(sesiAktifId)} menuTerbuka={menuTerbuka} />}
            {mode === 'fokus' && kepalaFokus}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {mode === 'siswa' && <AksiSiswa sesiAktif={Boolean(sesiAktifId)} />}
              {mode === 'ortu' && <AksiOrtu />}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>
        {/* layar fokus (post test) tetap menjaga login lewat ping, tanpa menu dan tombol biasa */}
        {(mode === 'siswa' || mode === 'fokus') && <PingSesi intervalMs={intervalPingMs} basis={basis} sesiAktifId={sesiAktifId} />}
      </div>
    </PenyediaArea>
  );
}
