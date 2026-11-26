'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Gambar materi dari `src` (jalur relatif terhadap public/). Bila berkasnya tidak ada gambar disembunyikan,
 * jadi tidak pernah tampil ikon gambar rusak. `alt` kosong berarti gambar dekoratif.
 */
export default function GambarMateri({ src, alt = '', className = '' }) {
  const [gagal, setGagal] = useState(false);
  const ref = useRef(null);

  // gambar bisa sudah gagal dimuat sebelum React terpasang (onError terlewat): periksa sekali saat mount
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setGagal(true);
  }, [src]);

  // berkas gambar belum ada: sembunyikan tanpa ikon gambar rusak
  if (gagal) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- gambar lokal dari public/, ukuran bervariasi
    <img ref={ref} src={`/${src}`} alt={alt} aria-hidden={alt ? undefined : true} loading="lazy" onError={() => setGagal(true)} className={`h-auto max-w-full rounded-md border border-line bg-panel ${className}`} draggable={false} />
  );
}
