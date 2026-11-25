'use client';
import { useId } from 'react';
import Ikon from './Ikon';

/** Tinggi kontrol per ukuran (token area). */
const UKURAN = {
  md: 'min-h-[max(2.75rem,var(--tap))] sm:min-h-[var(--tap)]',
  lg: 'min-h-[max(2.75rem,var(--tap-lg))] text-[1.1em] sm:min-h-[var(--tap-lg)]',
};

/**
 * Kolom teks dengan label yang selalu tampak, petunjuk, dan galat (teks + ikon, bukan hanya warna).
 * `awalan`/`akhiran` berupa teks atau elemen kecil di dalam kotak. Props lain diteruskan ke <input>.
 */
export default function TextField({ label, petunjuk = null, galat = null, awalan = null, akhiran = null, ukuran = 'md', id = null, className = '', ...sisa }) {
  const idOtomatis = useId();
  const idInput = id ?? idOtomatis;
  const idPetunjuk = `${idInput}-petunjuk`;
  const idGalat = `${idInput}-galat`;
  // pembaca layar membacakan petunjuk dan galat setelah label
  const terkait = [petunjuk && idPetunjuk, galat && idGalat].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={idInput} className="block font-semibold">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-[var(--r-btn)] border-2 bg-panel px-3 focus-within:border-primary ${galat ? 'border-bad' : 'border-line'} ${UKURAN[ukuran] ?? UKURAN.md}`}
      >
        {awalan && <span className="text-muted">{awalan}</span>}
        <input id={idInput} aria-invalid={galat ? true : undefined} aria-describedby={terkait} className="min-w-0 flex-1 bg-transparent py-2 text-fg outline-none placeholder:text-muted" {...sisa} />
        {akhiran && <span className="text-muted">{akhiran}</span>}
      </div>
      {petunjuk && (
        <p id={idPetunjuk} className="text-[0.9em] text-muted">
          {petunjuk}
        </p>
      )}
      {galat && (
        <p id={idGalat} className="flex items-start gap-1.5 text-[0.9em] font-semibold text-bad">
          <Ikon nama="peringatan" className="mt-0.5" />
          <span>{galat}</span>
        </p>
      )}
    </div>
  );
}
