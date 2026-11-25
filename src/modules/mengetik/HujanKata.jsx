'use client';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import { hitungAkurasi, hitungWpm, kunciTombol } from '@/utils/mengetik';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';

/** Aturan game: nyawa awal, jeda munculnya kata, dan kecepatan jatuh (persen tinggi area per detik). */
const ATURAN = Object.freeze({ nyawa: 3, jedaMs: 2200, jedaMinMs: 900, kecepatan: 8, kecepatanGerakKurang: 5 });

/** Apakah pengguna memilih kurangi gerakan (kata jatuh lebih lambat). */
function kurangiGerak() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Game "Hujan Kata" (D1.3): kata jatuh dari atas; ketik kata lalu Spasi/Enter untuk menghilangkannya.
 * Kata yang menyentuh dasar mengurangi nyawa; game berakhir saat nyawa habis. Ketikan yang membentuk awalan
 * kata yang sedang jatuh dihitung benar (bahan WPM dan akurasi).
 */
export default function HujanKata({ kata, onSelesai }) {
  const [jalan, setJalan] = useState(false);
  const [layar, setLayar] = useState({ kata: [], ketik: '', skor: 0, nyawa: ATURAN.nyawa });
  const data = useRef(null); // angka yang tidak perlu memicu render: waktu, ketikan, detail tombol
  const area = useRef(null);
  /** Mulai permainan baru. */
  function mulai() {
    data.current = { mulai: Date.now(), terakhirMuncul: 0, benar: 0, diketik: 0, detail: {}, id: 0, selesai: false };
    setLayar({ kata: [], ketik: '', skor: 0, nyawa: ATURAN.nyawa });
    setJalan(true);
    setTimeout(() => area.current?.focus(), 0);
  }
  // putaran animasi: munculkan kata baru dan jatuhkan kata yang ada
  useEffect(() => {
    if (!jalan) return undefined;
    let bingkai;
    let sebelum = performance.now();
    const laju = kurangiGerak() ? ATURAN.kecepatanGerakKurang : ATURAN.kecepatan;
    /** Satu langkah animasi. */
    function langkah(kini) {
      const dt = (kini - sebelum) / 1000;
      sebelum = kini;
      const d = data.current;
      const lewat = Date.now() - d.mulai;
      const jeda = Math.max(ATURAN.jedaMinMs, ATURAN.jedaMs - lewat / 30);
      setLayar((s) => {
        let daftar = s.kata.map((x) => ({ ...x, y: x.y + laju * dt }));
        const jatuh = daftar.filter((x) => x.y >= 100).length;
        daftar = daftar.filter((x) => x.y < 100);
        // saatnya kata baru muncul (makin lama makin sering)
        if (Date.now() - d.terakhirMuncul > jeda && kata.length > 0) {
          d.terakhirMuncul = Date.now();
          daftar.push({ id: (d.id += 1), teks: kata[Math.floor(Math.random() * kata.length)], x: 5 + Math.random() * 70, y: 0 });
        }
        return { ...s, kata: daftar, nyawa: s.nyawa - jatuh };
      });
      bingkai = requestAnimationFrame(langkah);
    }
    bingkai = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(bingkai);
  }, [jalan, kata]);
  // nyawa habis: hentikan dan kirim hasil sekali saja
  useEffect(() => {
    const d = data.current;
    if (!jalan || layar.nyawa > 0 || d.selesai) return;
    d.selesai = true;
    setJalan(false);
    const durasiDetik = (Date.now() - d.mulai) / 1000;
    onSelesai({ teks: '', jumlahKarakterBenar: d.benar, jumlahKarakterDiketik: Math.max(1, d.diketik), durasiDetik, detailTombol: d.detail, konsistensi: null, skor: layar.skor, wpm: hitungWpm(d.benar, durasiDetik), akurasi: hitungAkurasi(d.benar, d.diketik) });
  }, [jalan, layar.nyawa, layar.skor, onSelesai]);
  /** Ketikan: huruf menambah isian, Backspace menghapus, Spasi/Enter mencoba menghapus kata yang sama. */
  function tekan(e) {
    if (!jalan) return;
    const d = data.current;
    if (e.key === 'Backspace') {
      e.preventDefault();
      return setLayar((s) => ({ ...s, ketik: s.ketik.slice(0, -1) }));
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      // kata yang cocok hilang dan menambah skor; tidak cocok hanya mengosongkan isian
      return setLayar((s) => {
        const cocok = s.kata.find((x) => x.teks === s.ketik);
        return { ...s, ketik: '', kata: cocok ? s.kata.filter((x) => x.id !== cocok.id) : s.kata, skor: s.skor + (cocok ? 1 : 0) };
      });
    }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const calon = layar.ketik + e.key.toLowerCase();
    const benar = layar.kata.some((x) => x.teks.startsWith(calon));
    d.diketik += 1;
    d.benar += benar ? 1 : 0;
    const k = kunciTombol(e.key);
    d.detail[k] = { ketik: (d.detail[k]?.ketik ?? 0) + 1, salah: (d.detail[k]?.salah ?? 0) + (benar ? 0 : 1) };
    setLayar((s) => ({ ...s, ketik: calon }));
  }
  return (
    <div className="space-y-3">
      <div className="angka-tabular flex flex-wrap items-center gap-4 font-bold">
        <span className="flex items-center gap-1">
          <Ikon nama="bintang" />
          {t('mengetik.skor', { skor: layar.skor })}
        </span>
        <span className="flex items-center gap-1" aria-label={t('mengetik.nyawa', { nyawa: layar.nyawa })}>
          {Array.from({ length: Math.max(0, layar.nyawa) }, (_, i) => (
            <Ikon key={i} nama="nyawa" className="text-bad" />
          ))}
          <span className="sr-only">{t('mengetik.nyawa', { nyawa: layar.nyawa })}</span>
        </span>
      </div>
      <div ref={area} tabIndex={0} onKeyDown={tekan} onPaste={(e) => e.preventDefault()} role="application" aria-label={t('mengetik.hujanKataLabel')} className="relative aspect-[16/10] min-w-[280px] overflow-hidden rounded-lg border-2 border-line bg-primary-soft focus:border-primary focus:outline-none">
        {layar.kata.map((x) => (
          <span key={x.id} className="absolute rounded-md bg-panel px-2 py-1 font-mono text-[1.2em] font-bold shadow" style={{ left: `${x.x}%`, top: `${x.y}%` }}>
            {x.teks}
          </span>
        ))}
        {!jalan && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] p-4 text-center">
            <p className="font-semibold">{t('mengetik.hujanKataPetunjuk')}</p>
            <Button ukuran="lg" ikon="main" onClick={mulai} disabled={kata.length === 0}>
              {t('mengetik.mulaiGame')}
            </Button>
          </div>
        )}
      </div>
      <p className="font-mono text-[1.3em]" aria-live="polite">
        {t('mengetik.ketikanmu')}: <strong>{layar.ketik || '…'}</strong>
      </p>
    </div>
  );
}
