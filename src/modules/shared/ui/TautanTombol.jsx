'use client';
import Link from 'next/link';
import { kelasTombol } from './Button';
import Ikon from './Ikon';

/**
 * Tautan yang tampil seperti Button (dipakai untuk navigasi, mis. "Tambah template", "Detail").
 * Client component agar bisa memakai kelasTombol dari Button; `nonaktif` menampilkan tombol mati tanpa tautan.
 */
export default function TautanTombol({ href, varian = 'primary', ukuran = 'md', ikon = null, ikonAkhir = null, nonaktif = false, className = '', children, ...sisa }) {
  const kelas = `${kelasTombol({ varian, ukuran })} ${className}`;
  const isi = (
    <>
      {ikon && <Ikon nama={ikon} />}
      {children}
      {ikonAkhir && <Ikon nama={ikonAkhir} />}
    </>
  );
  // tidak ada tujuan (mis. sudah di halaman terakhir): tampil redup dan tidak bisa diklik
  if (nonaktif) {
    return (
      <span aria-disabled="true" className={`${kelas} pointer-events-none opacity-50`}>
        {isi}
      </span>
    );
  }
  return (
    <Link href={href} className={kelas} {...sisa}>
      {isi}
    </Link>
  );
}
