import { t } from '@/utils/i18n';

/** Ukuran area gambar grafik (satuan SVG). */
const L = 600;
const T = 220;
const TEPI = 30;

/** Titik polyline untuk satu deret nilai dengan skala 0..maks. */
function titik(nilai, maks) {
  const langkah = nilai.length > 1 ? (L - 2 * TEPI) / (nilai.length - 1) : 0;
  return nilai.map((v, i) => `${TEPI + i * langkah},${T - TEPI - (Math.min(v, maks) / maks) * (T - 2 * TEPI)}`).join(' ');
}

/**
 * Grafik garis sederhana (SVG) untuk WPM dan akurasi beberapa hasil terakhir. Garis dibedakan warna dan pola
 * (akurasi putus-putus) serta legenda berteks; ringkasan angka tersedia untuk pembaca layar.
 */
export default function GrafikKemajuan({ data }) {
  // belum ada hasil
  if (data.length === 0) return <p className="text-muted">{t('mengetik.belumAdaHasil')}</p>;
  const maksWpm = Math.max(10, ...data.map((d) => d.wpm));
  const ringkas = t('mengetik.grafikRingkas', { n: data.length, wpm: data[data.length - 1].wpm, akurasi: data[data.length - 1].akurasi });
  return (
    <figure className="space-y-2">
      <svg viewBox={`0 0 ${L} ${T}`} role="img" aria-label={ringkas} className="h-auto w-full rounded-lg border border-line bg-panel">
        <line x1={TEPI} y1={T - TEPI} x2={L - TEPI} y2={T - TEPI} stroke="var(--line)" strokeWidth="2" />
        <polyline points={titik(data.map((d) => d.wpm), maksWpm)} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinejoin="round" />
        <polyline points={titik(data.map((d) => d.akurasi), 100)} fill="none" stroke="var(--ok)" strokeWidth="3" strokeDasharray="8 6" strokeLinejoin="round" />
        <text x={TEPI} y={18} fontSize="13" fill="var(--muted)">
          {t('mengetik.grafikSkala', { maks: Math.round(maksWpm) })}
        </text>
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-[0.9em] font-semibold">
        <span className="flex items-center gap-2">
          <span className="inline-block h-1 w-6 bg-primary" aria-hidden="true" />
          {t('mengetik.wpm')}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0 w-6 border-t-[3px] border-dashed border-ok" aria-hidden="true" />
          {t('mengetik.akurasiPersen')}
        </span>
      </figcaption>
    </figure>
  );
}
