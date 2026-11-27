'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { AREA, PERAN } from '@/enums';
import { PenyediaArea } from '@/modules/shared/ui/AreaContext';
import ThemeToggle from '@/modules/shared/ui/ThemeToggle';
import Ikon from '@/modules/shared/ui/Ikon';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import { keluarPengelola } from '@/modules/auth/auth.actions';
import Merek from './Merek';

/** Daftar tautan menu samping; item aktif ditandai warna dan aria-current. */
function DaftarMenu({ menu, basis }) {
  const pathname = usePathname();
  return (
    <nav aria-label={t('menu.judul')}>
      <ul className="space-y-1 p-3">
        {menu.map((m) => {
          const href = gabungJalur(basis, m.jalur);
          // beranda hanya aktif bila persis; menu lain juga aktif untuk sub-halamannya
          const aktif = m.jalur === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={m.jalur}>
              <Link
                href={href}
                aria-current={aktif ? 'page' : undefined}
                // token nav-*: latar menu navy di kedua tema; garis fokus memakai warna teks menu karena biru utama kurang terlihat di atas navy (tema terang)
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold focus-visible:outline-nav-fg ${aktif ? 'bg-nav-active-bg text-nav-active-fg' : 'text-nav-fg hover:bg-nav-line'}`}
              >
                <Ikon nama={m.ikon} />
                {t(m.label)}
                {/* lencana jumlah (mis. sesi berlangsung) disertai teks untuk pembaca layar */}
                {m.lencana > 0 && (
                  <Badge nada="info" className="ml-auto">
                    {m.lencana}
                    <span className="sr-only"> {t('menu.lencanaSesi')}</span>
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Kerangka area pengelola: header (pengguna, peran, tema, keluar), menu samping yang menjadi drawer di layar sempit. */
export default function ShellPengelola({ branding, basis, pengguna, menu, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [keluarMemuat, mulai] = useTransition();

  // tutup drawer setelah berpindah halaman
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  /** Keluar lalu ke halaman masuk. */
  function keluar() {
    mulai(async () => {
      const hasil = await keluarPengelola();
      // keluar hanya menghapus cookie; bila gagal, tetap di halaman
      if (!hasil.ok) return;
      router.replace(hasil.data.href);
      router.refresh();
    });
  }

  return (
    <PenyediaArea area={AREA.PENGELOLA} basis={basis}>
      <div data-area="pengelola" className="flex min-h-dvh flex-col bg-bg font-body text-fg">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel px-3 py-2 sm:px-4">
          <button type="button" onClick={() => setDrawer((v) => !v)} aria-expanded={drawer} aria-controls="menu-samping" aria-label={t('menu.buka')} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-primary-soft md:hidden">
            <Ikon nama={drawer ? 'tutup' : 'menu'} />
          </button>
          <Merek branding={branding} />
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <p className="font-semibold">{pengguna.nama}</p>
            </div>
            <Badge nada={pengguna.peran === PERAN.ADMIN ? 'primer' : 'info'}>{t(`peran.${pengguna.peran}`)}</Badge>
            <ThemeToggle />
            <Button varian="hantu" ikon="keluar" memuat={keluarMemuat} onClick={keluar} aria-label={t('auth.keluar')}>
              <span className="hidden sm:inline">{t('auth.keluar')}</span>
            </Button>
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1">
          {/* lapisan gelap di belakang drawer (layar sempit); klik untuk menutup */}
          {drawer && <div className="fixed inset-0 z-20 bg-[color-mix(in_srgb,var(--fg)_35%,transparent)] md:hidden" onClick={() => setDrawer(false)} aria-hidden="true" />}
          <aside id="menu-samping" className={`${drawer ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-20 mt-[3.75rem] w-64 overflow-y-auto border-r border-nav-line bg-nav-bg md:static md:mt-0 md:block md:shrink-0`}>
            <DaftarMenu menu={menu} basis={basis} />
          </aside>
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </PenyediaArea>
  );
}
