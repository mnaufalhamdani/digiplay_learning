'use client';
import { AREA } from '@/enums';
import { PenyediaArea } from '@/modules/shared/ui/AreaContext';
import ThemeToggle from '@/modules/shared/ui/ThemeToggle';
import Merek from './Merek';

/** Bingkai polos area pengelola untuk halaman tanpa login (masuk): merek, tombol tema, isi di tengah. */
export default function BingkaiPengelola({ branding, basis, children }) {
  return (
    <PenyediaArea area={AREA.PENGELOLA} basis={basis}>
      <div data-area="pengelola" className="flex min-h-dvh flex-col bg-bg font-body text-fg">
        <header className="flex items-center gap-3 px-4 py-3">
          <Merek branding={branding} keBeranda={false} />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">{children}</main>
      </div>
    </PenyediaArea>
  );
}
