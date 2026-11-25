'use client';
import { useEffect, useState } from 'react';
import { t } from '@/utils/i18n';
import Ikon from './Ikon';

/** Tombol ganti mode terang/gelap; pilihan disimpan di localStorage (otomatis terpisah per domain). */
export default function ThemeToggle() {
  const [gelap, setGelap] = useState(false);

  // sinkronkan state dengan class yang sudah dipasang skrip awal di <head>
  useEffect(() => {
    setGelap(document.documentElement.classList.contains('dark'));
  }, []);

  /** Membalik mode dan menyimpannya. */
  function ganti() {
    const baru = !gelap;
    document.documentElement.classList.toggle('dark', baru);
    try {
      localStorage.setItem('theme', baru ? 'dark' : 'light');
    } catch {
      // penyimpanan diblokir browser: mode tetap berlaku untuk sesi ini saja
    }
    setGelap(baru);
  }

  const label = gelap ? t('tema.terang') : t('tema.gelap');
  return (
    <button type="button" onClick={ganti} aria-pressed={gelap} aria-label={label} title={label} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-btn)] border-2 border-line bg-panel text-fg hover:bg-primary-soft">
      <Ikon nama={gelap ? 'tema_terang' : 'tema_gelap'} />
    </button>
  );
}
