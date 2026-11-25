'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Maskot Zippy dari /aset/maskot/zippy-<suasana>.png (potret 3:4; `wajah` persegi 1:1).
 * Bila berkas tidak ada, gambar disembunyikan tanpa error. Dekoratif kecuali `alt` diisi.
 */
export default function Maskot({ suasana = 'sapa', ukuran = 160, alt = '', className = '' }) {
  const [gagal, setGagal] = useState(false);
  const ref = useRef(null);
  const tinggi = suasana === 'wajah' ? ukuran : Math.round((ukuran * 4) / 3);

  // gambar bisa sudah gagal dimuat sebelum React terpasang (onError terlewat): periksa sekali saat mount
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setGagal(true);
  }, [suasana]);

  // berkas maskot belum ada: sembunyikan tanpa ikon gambar rusak
  if (gagal) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- PNG lokal kecil, tidak perlu optimasi next/image
    <img
      ref={ref}
      src={`/aset/maskot/zippy-${suasana}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={ukuran}
      height={tinggi}
      onError={() => setGagal(true)}
      className={`m-3 h-auto select-none object-contain ${className}`}
      style={{ width: ukuran, minWidth: Math.min(ukuran, 96) }}
      draggable={false}
    />
  );
}
