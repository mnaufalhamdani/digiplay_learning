import { BARIS_KEYBOARD } from '@/utils/tataLetakKeyboard';

/** Ukuran satu tombol dan jarak antartombol (satuan SVG). */
const UKURAN = 40;
const JARAK = 4;

/**
 * Gambar keyboard QWERTY (SVG) yang dipakai KeyboardVisual dan PetaPanasKeyboard. `isiTombol(tombol)` mengembalikan
 * { isi, opasitas, tebal } untuk mewarnai tiap tombol; `judulTombol(tombol)` teks <title> (dibacakan pembaca layar).
 */
export default function KeyboardSvg({ isiTombol, judulTombol = null, label }) {
  const lebarBaris = Math.max(...BARIS_KEYBOARD.map((b) => b.geser + b.tombol.reduce((n, x) => n + x.lebar, 0)));
  const lebar = lebarBaris * (UKURAN + JARAK);
  const tinggi = BARIS_KEYBOARD.length * (UKURAN + JARAK);
  return (
    <svg viewBox={`0 0 ${lebar} ${tinggi}`} role="img" aria-label={label} className="h-auto w-full max-w-2xl select-none">
      {BARIS_KEYBOARD.map((b, i) => {
        let x = b.geser * (UKURAN + JARAK);
        return b.tombol.map((tb) => {
          const w = tb.lebar * UKURAN + (tb.lebar - 1) * JARAK;
          const gaya = isiTombol(tb);
          const kotak = (
            <g key={tb.kunci}>
              {judulTombol && <title>{judulTombol(tb)}</title>}
              <rect x={x} y={i * (UKURAN + JARAK)} width={w} height={UKURAN} rx={8} fill={gaya.isi} fillOpacity={gaya.opasitas ?? 1} stroke="var(--line)" strokeWidth={gaya.tebal ? 3 : 1.5} />
              <text x={x + w / 2} y={i * (UKURAN + JARAK) + UKURAN / 2 + 5} textAnchor="middle" fontSize={tb.lebar > 1 ? 12 : 15} fontWeight="700" fill="var(--fg)">
                {tb.label}
              </text>
            </g>
          );
          x += w + JARAK;
          return kotak;
        });
      })}
    </svg>
  );
}
