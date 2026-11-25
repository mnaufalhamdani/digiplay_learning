'use client';
import { useEffect, useId, useRef } from 'react';
import { t } from '@/utils/i18n';
import Ikon from './Ikon';

/** Elemen yang bisa difokus; dipakai untuk fokus awal bila tidak ditentukan. */
const BISA_FOKUS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Jendela modal berbasis <dialog> bawaan (showModal): isi di luar dialog menjadi inert sehingga fokus terkunci,
 * Esc menutup, dan fokus kembali ke elemen pemicu saat ditutup. Dialog tetap di dalam pembungkus area
 * sehingga token warna area ikut berlaku. `fokusAwalRef` menentukan elemen yang difokus pertama.
 */
export default function Modal({ terbuka, judul, tutup, fokusAwalRef = null, tutupSaatKlikLuar = true, children }) {
  const ref = useRef(null);
  const pemicu = useRef(null);
  const idJudul = useId();

  // sinkronkan state `terbuka` dengan dialog bawaan browser
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // baru dibuka: ingat pemicu, tampilkan sebagai modal, fokuskan elemen awal
    if (terbuka && !dialog.open) {
      pemicu.current = document.activeElement;
      dialog.showModal();
      (fokusAwalRef?.current ?? dialog.querySelector(BISA_FOKUS))?.focus();
    } else if (!terbuka && dialog.open) {
      dialog.close();
      // kembalikan fokus ke tombol yang membuka modal agar pengguna keyboard tidak tersesat
      pemicu.current?.focus?.();
    }
  }, [terbuka, fokusAwalRef]);

  /** Esc memicu event cancel: biarkan state induk yang menutup agar tetap satu sumber kebenaran. */
  function batal(e) {
    e.preventDefault();
    tutup?.();
  }

  /** Klik di latar (bukan di panel) menutup modal bila diizinkan. */
  function klikLatar(e) {
    if (tutupSaatKlikLuar && e.target === e.currentTarget) tutup?.();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={idJudul}
      onCancel={batal}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-transparent p-0 text-fg backdrop:bg-transparent"
    >
      <div className="flex min-h-full items-center justify-center bg-[color-mix(in_srgb,var(--fg)_45%,transparent)] p-4" onMouseDown={klikLatar}>
        <div className="w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-xl sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={idJudul} className="text-[1.25em] font-bold">
              {judul}
            </h2>
            {tutup && (
              <button type="button" onClick={tutup} aria-label={t('umum.tutup')} className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-btn)] text-muted hover:bg-primary-soft">
                <Ikon nama="tutup" />
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </dialog>
  );
}
