'use client';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';

/** Grid per jumlah keping: kolom x baris (2x2, 3x2, 3x3). */
const GRID = { 4: [2, 2], 6: [3, 2], 9: [3, 3] };
/** Jarak snap: dalam 25% ukuran keping dari pusat slot. */
const SNAP = 0.25;

/**
 * Susunan awal acak tanpa satu pun keping di tempat benar (algoritma Sattolo: satu siklus penuh, jadi tidak ada titik tetap).
 * `susun[slot] = keping` yang sedang menempati slot itu.
 */
function acakTanpaBenar(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Papan puzzle (D1.5): memotong puzzle.png memakai background-position. Keping diseret dengan Pointer Events
 * (mouse dan sentuh), dilepas dekat slot lain -> bertukar tempat; keping di tempat benar terkunci.
 * `onSelesai({ durasiDetik })` dipanggil sekali saat semua keping benar.
 */
export default function PapanPuzzle({ src, keping, onSelesai }) {
  const [kol, bar] = GRID[keping];
  const [susun, setSusun] = useState(() => acakTanpaBenar(keping));
  const [seret, setSeret] = useState(null); // { slot, dx, dy, x0, y0 }
  const [contoh, setContoh] = useState(false);
  const papan = useRef(null);
  const mulai = useRef(Date.now());
  const selesai = susun.every((k, slot) => k === slot);
  // semua keping benar: kirim hasil sekali
  useEffect(() => {
    if (selesai) onSelesai({ durasiDetik: Math.max(1, (Date.now() - mulai.current) / 1000) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat berubah menjadi selesai
  }, [selesai]);
  /** Mulai menyeret keping di `slot` (keping terkunci tidak bisa diseret). */
  function turun(e, slot) {
    if (susun[slot] === slot || selesai) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSeret({ slot, dx: 0, dy: 0, x0: e.clientX, y0: e.clientY });
  }
  /** Keping mengikuti pointer. */
  function gerak(e) {
    if (seret) setSeret((s) => ({ ...s, dx: e.clientX - s.x0, dy: e.clientY - s.y0 }));
  }
  /** Dilepas: cari slot terdekat dari pusat keping; bila dalam jarak snap dan slot itu belum terkunci, tukar. */
  function naik() {
    if (!seret) return;
    const r = papan.current.getBoundingClientRect();
    const w = r.width / kol;
    const h = r.height / bar;
    const cx = (seret.slot % kol) * w + w / 2 + seret.dx;
    const cy = Math.floor(seret.slot / kol) * h + h / 2 + seret.dy;
    const tujuan = Math.min(bar - 1, Math.max(0, Math.floor(cy / h))) * kol + Math.min(kol - 1, Math.max(0, Math.floor(cx / w)));
    const pusatX = (tujuan % kol) * w + w / 2;
    const pusatY = Math.floor(tujuan / kol) * h + h / 2;
    const dekat = Math.abs(cx - pusatX) <= w * SNAP && Math.abs(cy - pusatY) <= h * SNAP;
    // terlalu jauh dari slot, slot yang sama, atau slot sudah terisi keping benar: kembali ke tempat semula
    if (dekat && tujuan !== seret.slot && susun[tujuan] !== tujuan) {
      setSusun((s) => {
        const baru = [...s];
        [baru[seret.slot], baru[tujuan]] = [baru[tujuan], baru[seret.slot]];
        return baru;
      });
    }
    setSeret(null);
  }
  /** Tampilkan gambar utuh selama 3 detik. */
  function lihatContoh() {
    setContoh(true);
    setTimeout(() => setContoh(false), 3000);
  }
  return (
    <div className="space-y-3">
      <div ref={papan} className="relative mx-auto aspect-square w-full max-w-lg touch-none rounded-lg border-2 border-line bg-bg select-none">
        {susun.map((k, slot) => {
          const benar = k === slot;
          const diseret = seret?.slot === slot;
          return (
            <div
              key={k}
              role="img"
              aria-label={t(benar ? 'puzzle.kepingBenar' : 'puzzle.keping', { nomor: k + 1 })}
              onPointerDown={(e) => turun(e, slot)}
              onPointerMove={gerak}
              onPointerUp={naik}
              onPointerCancel={() => setSeret(null)}
              className={`absolute border border-panel ${benar ? 'cursor-default ring-2 ring-ok ring-inset' : 'cursor-grab'} ${diseret ? 'z-10 shadow-2xl' : 'motion-safe:transition-transform'}`}
              style={{
                width: `${100 / kol}%`,
                height: `${100 / bar}%`,
                left: `${(slot % kol) * (100 / kol)}%`,
                top: `${Math.floor(slot / kol) * (100 / bar)}%`,
                backgroundImage: `url(${src})`,
                backgroundSize: `${kol * 100}% ${bar * 100}%`,
                backgroundPosition: `${((k % kol) / (kol - 1)) * 100}% ${(Math.floor(k / kol) / (bar - 1)) * 100}%`,
                transform: diseret ? `translate(${seret.dx}px, ${seret.dy}px)` : undefined,
              }}
            />
          );
        })}
        {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau gambar utuh sementara */}
        {contoh && <img src={src} alt={t('puzzle.contohAlt')} className="absolute inset-0 z-20 h-full w-full rounded-lg object-cover" />}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button varian="secondary" ikon="lihat" onClick={lihatContoh} disabled={contoh}>
          {t('puzzle.lihatContoh')}
        </Button>
        <span className="flex items-center gap-1 font-semibold">
          <Ikon nama="puzzle" />
          {t('puzzle.benarDari', { benar: susun.filter((x, i) => x === i).length, total: keping })}
        </span>
      </div>
    </div>
  );
}
