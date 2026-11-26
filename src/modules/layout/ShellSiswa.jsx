'use client';
import Link from 'next/link';
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

/** Menu latihan siswa: jalur (null = belum tersedia), kunci teks, ikon; `bebas` = terbuka walau belum diabsen. */
const MENU_LATIHAN = [
  // pustaka materi bisa dibuka sebelum maupun sesudah absen (isinya hanya pertemuan yang sudah dilalui)
  { kunci: 'materi', jalur: '/materi', ikon: 'materi', bebas: true },
  { kunci: 'latihanMouse', jalur: '/latihan-mouse', ikon: 'mouse' },
  { kunci: 'puzzle', jalur: '/puzzle', ikon: 'puzzle' },
  // Coding Zippy bisa dicoba tanpa sesi (hasil hanya tersimpan saat sesi berlangsung)
  { kunci: 'codingZippy', jalur: '/coding-zippy', ikon: 'coding', bebas: true },
  // Studio Zippy (Level 2) juga bisa dicoba tanpa sesi; proyek hanya bisa disimpan dan dikirim saat sesi berlangsung
  { kunci: 'studio', jalur: '/studio', ikon: 'studio', bebas: true },
  { kunci: 'mengetik', jalur: '/mengetik', ikon: 'keyboard' },
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

/**
 * Menu siswa: Beranda selalu aktif; menu latihan aktif selama sesi berlangsung, selain itu terkunci
 * ("minta absen dulu"). Materi, Coding Zippy, dan Karya selalu terbuka.
 */
function MenuSiswa({ basis, sesiAktif }) {
  const pathname = usePathname();
  const kelas = (aktif) => `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--r-btn)] px-3 font-bold hover:bg-primary-soft ${aktif ? 'bg-primary-soft text-primary-text' : 'text-fg'}`;
  const item = [{ kunci: 'beranda', jalur: '/', ikon: 'beranda', label: t('siswa.beranda') }, ...MENU_LATIHAN.map((m) => ({ ...m, label: t(`sesiSiswa.menu.${m.kunci}`) }))];
  return (
    <nav aria-label={t('siswa.menu')} className="relative order-last w-full overflow-x-auto sm:order-none sm:w-auto">
      <ul className="flex gap-1">
        {item.map((m) => {
          const href = m.jalur ? gabungJalur(basis, m.jalur) : null;
          // tanpa sesi: hanya Beranda dan menu `bebas` (Karya) yang terbuka; menu tanpa jalur belum tersedia
          const terkunci = !href || (m.jalur !== '/' && !m.bebas && !sesiAktif);
          const aktif = href && (m.jalur === '/' ? pathname === href : pathname.startsWith(href));
          return (
            <li key={m.kunci}>
              {terkunci ? (
                <MenuTerkunci label={m.label} alasan={t(href ? 'sesiSiswa.terkunciAbsen' : 'sesiSiswa.segeraHadir')} />
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
  );
}

/**
 * Kerangka area siswa (data-area="siswa"). `mode`:
 * - 'masuk': hanya merek dan tombol tema;
 * - 'siswa': menu, Ganti device, Keluar (atau Pulang saat sesi aktif), dan ping sesi berkala;
 * - 'ortu' : tampilan orang tua yang lebih tenang (data-mode="ortu") dengan tombol Keluar;
 * - 'fokus': layar post test tanpa menu biasa; `kepalaFokus` (judul dan pewaktu) tampil di header, ping tetap jalan.
 * `sesiAktifId`: ID sesi berlangsung saat halaman dirender (null bila belum absen), dipakai sinkron otomatis.
 */
export default function ShellSiswa({ branding, basis, mode, intervalPingMs = 15000, sesiAktifId = null, kepalaFokus = null, children }) {
  return (
    <PenyediaArea area={AREA.SISWA} basis={basis}>
      <div data-area="siswa" data-mode={mode === 'ortu' ? 'ortu' : undefined} className="min-h-dvh bg-bg font-body text-fg">
        <header className="border-b-2 border-line bg-panel">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
            <Merek branding={branding} keBeranda={mode !== 'masuk'} />
            {mode === 'siswa' && <MenuSiswa basis={basis} sesiAktif={Boolean(sesiAktifId)} />}
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
