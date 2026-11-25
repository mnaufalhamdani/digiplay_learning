'use client';
import { useId } from 'react';
import Ikon from './Ikon';

/**
 * Pilihan berbasis <select> bawaan (nyaman di HP). `opsi`: [{ nilai, label }] atau grup
 * [{ grup, opsi: [{ nilai, label }] }]. Label selalu tampak; galat berupa teks + ikon.
 * Props lain (name, value, defaultValue, onChange, ...) diteruskan ke <select>.
 */
export default function Select({ label, opsi = [], galat = null, petunjuk = null, id = null, className = '', ...sisa }) {
  const idOtomatis = useId();
  const idSelect = id ?? idOtomatis;
  const idKeterangan = `${idSelect}-ket`;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={idSelect} className="block font-semibold">
        {label}
      </label>
      <select
        id={idSelect}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat || petunjuk ? idKeterangan : undefined}
        className={`min-h-[max(2.75rem,var(--tap))] w-full rounded-[var(--r-btn)] border-2 bg-panel px-3 text-fg focus:border-primary focus:outline-none sm:min-h-[var(--tap)] ${galat ? 'border-bad' : 'border-line'}`}
        {...sisa}
      >
        {opsi.map((o) =>
          // grup opsi (mis. pertemuan per level) memakai <optgroup>
          o.grup ? (
            <optgroup key={o.grup} label={o.grup}>
              {o.opsi.map((x) => (
                <option key={x.nilai} value={x.nilai}>
                  {x.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ),
        )}
      </select>
      {(galat || petunjuk) && (
        <p id={idKeterangan} className={`flex items-start gap-1.5 text-[0.9em] ${galat ? 'font-semibold text-bad' : 'text-muted'}`}>
          {galat && <Ikon nama="peringatan" className="mt-0.5" />}
          <span>{galat ?? petunjuk}</span>
        </p>
      )}
    </div>
  );
}
