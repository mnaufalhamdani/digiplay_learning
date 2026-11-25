'use client';
import { useId } from 'react';
import { t } from '@/utils/i18n';
import Ikon from '../Ikon';

/** Huruf penanda opsi A-D. */
const HURUF = ['A', 'B', 'C', 'D'];

/** Gaya kartu opsi sesuai keadaannya; status benar/salah selalu disertai ikon dan teks. */
function gaya(terpilih, hasil) {
  if (terpilih && hasil === 'benar') return 'border-ok bg-ok-soft';
  if (terpilih && hasil === 'salah') return 'border-bad bg-bad-soft';
  if (terpilih) return 'border-primary bg-primary-soft';
  return 'border-line bg-panel hover:border-primary';
}

/**
 * Empat kartu besar untuk soal pilihan ganda (radio). `hasil` ('benar' | 'salah' | null) hanya untuk opsi yang dipilih;
 * mode latihan saja (post test di Fase D2 tidak mengirim hasil). `opsi`: [{ teks, indeksAsli }].
 */
export default function OpsiJawaban({ opsi, terpilih, onPilih, hasil = null, nonaktif = false }) {
  const nama = useId();
  return (
    <div role="radiogroup" aria-label={t('sesiSiswa.pilihJawaban')} className="grid gap-3 sm:grid-cols-2">
      {opsi.map((o, i) => {
        const dipilih = String(terpilih) === String(o.indeksAsli);
        return (
          <label key={o.indeksAsli} className={`flex min-h-[var(--tap-lg)] cursor-pointer items-center gap-3 rounded-lg border-2 p-3 font-semibold transition-colors ${gaya(dipilih, hasil)} ${nonaktif ? 'cursor-not-allowed opacity-70' : ''}`}>
            <input type="radio" name={nama} className="sr-only" checked={dipilih} disabled={nonaktif} onChange={() => onPilih(o.indeksAsli)} />
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg font-display font-bold">{HURUF[i] ?? i + 1}</span>
            <span className="flex-1">{o.teks}</span>
            {/* penanda hasil di opsi yang dipilih: ikon + teks untuk pembaca layar */}
            {dipilih && hasil === 'benar' && <Ikon nama="sukses" className="text-ok" label={t('sesiSiswa.benar')} />}
            {dipilih && hasil === 'salah' && <Ikon nama="salah" className="text-bad" label={t('sesiSiswa.salah')} />}
          </label>
        );
      })}
    </div>
  );
}
