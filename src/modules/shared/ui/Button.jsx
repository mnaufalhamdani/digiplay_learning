'use client';
import Ikon from './Ikon';
import { kelasTombol } from './kelasTombol';

// Kelas dasar, varian, dan ukuran tombol dipindah ke ./kelasTombol.js (tanpa 'use client') agar server component
// juga bisa memakainya; diekspor ulang di sini supaya impor lama `import { kelasTombol } from './Button'` tetap jalan.
export { kelasTombol };

/**
 * Tombol bersama kedua area. `memuat` menampilkan spinner dan menonaktifkan klik;
 * `ikon` adalah nama ikon pada komponen Ikon.
 */
export default function Button({ varian = 'primary', ukuran = 'md', ikon = null, memuat = false, penuh = false, type = 'button', disabled = false, className = '', children, ...sisa }) {
  return (
    <button type={type} disabled={disabled || memuat} aria-busy={memuat || undefined} className={`${kelasTombol({ varian, ukuran, penuh })} ${className}`} {...sisa}>
      {/* saat memuat ikon diganti spinner agar lebar tombol tidak berubah */}
      {memuat ? <Ikon nama="memuat" className="animate-spin" /> : ikon && <Ikon nama={ikon} />}
      {children}
    </button>
  );
}
