'use client';
import { useId } from 'react';
import Ikon from './Ikon';

/**
 * Kolom teks banyak baris dengan label, petunjuk, dan galat (teks + ikon), sejalan dengan TextField.
 * `kode` true: huruf monospace dan tanpa koreksi ejaan (untuk editor JSON). Props lain diteruskan ke <textarea>.
 */
export default function TextArea({ label, petunjuk = null, galat = null, kode = false, id = null, className = '', rows = 4, ...sisa }) {
  const idOtomatis = useId();
  const idInput = id ?? idOtomatis;
  const idKeterangan = `${idInput}-ket`;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={idInput} className="block font-semibold">
        {label}
      </label>
      <textarea
        id={idInput}
        rows={rows}
        spellCheck={kode ? false : undefined}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat || petunjuk ? idKeterangan : undefined}
        className={`w-full rounded-[var(--r-btn)] border-2 bg-panel px-3 py-2 text-fg outline-none focus:border-primary ${kode ? 'font-mono text-[0.9em]' : ''} ${galat ? 'border-bad' : 'border-line'}`}
        {...sisa}
      />
      {(galat || petunjuk) && (
        <p id={idKeterangan} className={`flex items-start gap-1.5 text-[0.9em] ${galat ? 'font-semibold text-bad' : 'text-muted'}`}>
          {galat && <Ikon nama="peringatan" className="mt-0.5" />}
          <span>{galat ?? petunjuk}</span>
        </p>
      )}
    </div>
  );
}
