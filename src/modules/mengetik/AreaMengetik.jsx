'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import { hitungAkurasi, hitungKonsistensi, hitungWpm, kunciTombol } from '@/utils/mengetik';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import KeyboardVisual from './KeyboardVisual';

/** Panjang segmen untuk konsistensi (detik). */
const SEGMEN_DETIK = 5;

/** Keadaan awal satu putaran mengetik. */
function keadaanAwal() {
  return { status: [], diketik: 0, benar: 0, mulai: null, segmen: [], detail: {}, selesai: false };
}

/** Mencatat satu ketikan ke detail_tombol (per karakter yang seharusnya diketik). */
function catatTombol(detail, karakter, benar) {
  const k = kunciTombol(karakter);
  const lama = detail[k] ?? { ketik: 0, salah: 0 };
  return { ...detail, [k]: { ketik: lama.ketik + 1, salah: lama.salah + (benar ? 0 : 1) } };
}

/** Hasil akhir yang dikirim ke induk (server menghitung ulang WPM dan akurasi). */
function bentukHasil(k, teks) {
  const durasiDetik = Math.max(0, (Date.now() - k.mulai) / 1000);
  const penuh = Math.floor(durasiDetik / SEGMEN_DETIK);
  const wpmSegmen = k.segmen.slice(0, penuh).map((n) => hitungWpm(n ?? 0, SEGMEN_DETIK));
  return {
    teks,
    jumlahKarakterBenar: k.benar,
    jumlahKarakterDiketik: k.diketik,
    durasiDetik: Math.round(durasiDetik * 10) / 10,
    detailTombol: k.detail,
    konsistensi: hitungKonsistensi(wpmSegmen, durasiDetik),
    wpm: hitungWpm(k.benar, durasiDetik),
    akurasi: hitungAkurasi(k.benar, k.diketik),
  };
}

/** Teks target dengan status tiap karakter: benar, salah (ditandai garis bawah), kursor, dan belum. */
function TeksTarget({ teks, status }) {
  return (
    <p className="font-mono text-[1.4em] leading-relaxed break-words whitespace-pre-wrap sm:text-[1.7em]" aria-hidden="true">
      {[...teks].map((c, i) => {
        const s = status[i];
        let kelas = 'text-muted';
        if (s === true) kelas = 'text-ok';
        // salah: warna + garis bawah + spasi terlihat, agar tidak bergantung pada warna saja
        else if (s === false) kelas = 'bg-bad-soft text-bad underline decoration-2';
        else if (i === status.length) kelas = 'border-b-4 border-primary text-fg';
        return (
          <span key={i} className={kelas}>
            {s === false && c === ' ' ? '·' : c}
          </span>
        );
      })}
    </p>
  );
}

/** HUD: WPM langsung, akurasi, dan waktu berjalan. */
function Hud({ k }) {
  const [, setDetak] = useState(0);
  // segarkan angka dua kali per detik selama mengetik
  useEffect(() => {
    if (!k.mulai || k.selesai) return undefined;
    const timer = setInterval(() => setDetak((n) => n + 1), 500);
    return () => clearInterval(timer);
  }, [k.mulai, k.selesai]);
  const detik = k.mulai ? (Date.now() - k.mulai) / 1000 : 0;
  return (
    <dl className="angka-tabular grid grid-cols-3 gap-2 text-center">
      {[
        ['mengetik.wpm', hitungWpm(k.benar, detik)],
        ['mengetik.akurasi', `${hitungAkurasi(k.benar, k.diketik)}%`],
        ['mengetik.waktu', `${Math.floor(detik)} dtk`],
      ].map(([kunci, nilai]) => (
        <div key={kunci} className="rounded-lg bg-bg p-2">
          <dt className="text-[0.85em] font-semibold text-muted">{t(kunci)}</dt>
          <dd className="font-display text-[1.4em] font-bold">{nilai}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Mesin mengetik (D1.2). Masukan lewat keydown pada area yang terfokus; tempel dicegah; Backspace menghapus
 * karakter terakhir tanpa menghapus catatan salah. Selesai saat jumlah karakter sama dengan panjang teks.
 * `mode` hanya diteruskan ke induk; `onSelesai(hasil)` menerima angka mentah untuk dikirim ke server.
 */
export default function AreaMengetik({ teks, onSelesai, bolehUlang = true, nonaktif = false }) {
  const [k, setK] = useState(keadaanAwal);
  const [sentuh, setSentuh] = useState(false);
  const area = useRef(null);
  // layar sentuh tanpa mouse/trackpad: kemungkinan tidak ada keyboard fisik
  useEffect(() => {
    setSentuh(window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches);
    area.current?.focus();
  }, []);
  /** Mengulang dari awal. */
  const ulang = useCallback(() => {
    setK(keadaanAwal());
    area.current?.focus();
  }, []);
  /** Satu ketikan: karakter biasa atau Backspace; kombinasi Ctrl/Meta (termasuk tempel) diabaikan. */
  function tekan(e) {
    if (k.selesai || nonaktif || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      // hapus karakter terakhir; ketikan salah yang sudah terjadi tetap tercatat
      return setK((s) => ({ ...s, status: s.status.slice(0, -1) }));
    }
    // tombol khusus (Shift, Tab, panah) tidak dihitung sebagai ketikan
    if (e.key.length !== 1) return;
    e.preventDefault();
    const sekarang = Date.now();
    const mulai = k.mulai ?? sekarang;
    const target = teks[k.status.length];
    const benar = e.key === target;
    const idx = Math.floor((sekarang - mulai) / 1000 / SEGMEN_DETIK);
    const segmen = [...k.segmen];
    segmen[idx] = (segmen[idx] ?? 0) + (benar ? 1 : 0);
    const baru = { ...k, mulai, status: [...k.status, benar], diketik: k.diketik + 1, benar: k.benar + (benar ? 1 : 0), segmen, detail: catatTombol(k.detail, target, benar) };
    // karakter terakhir sudah diketik: putaran selesai
    if (baru.status.length >= teks.length) {
      baru.selesai = true;
      onSelesai(bentukHasil(baru, teks));
    }
    setK(baru);
  }
  return (
    <div className="space-y-4">
      {sentuh && (
        <p role="note" className="flex items-start gap-2 rounded-lg bg-warn-soft p-3 font-semibold text-warn">
          <Ikon nama="keyboard" className="mt-0.5" />
          {t('mengetik.butuhKeyboard')}
        </p>
      )}
      <Hud k={k} />
      <div
        ref={area}
        tabIndex={0}
        role="textbox"
        aria-label={t('mengetik.areaLabel')}
        aria-description={teks}
        onKeyDown={tekan}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        className="cursor-text rounded-lg border-2 border-line bg-panel p-4 focus:border-primary focus:outline-none sm:p-6"
      >
        <TeksTarget teks={teks} status={k.status} />
        {!k.mulai && <p className="mt-2 text-muted">{t('mengetik.mulaiKetik')}</p>}
      </div>
      {!k.selesai && <KeyboardVisual karakter={teks[k.status.length]} />}
      {bolehUlang && (
        <Button varian="secondary" ikon="acak" onClick={ulang} disabled={nonaktif}>
          {t('mengetik.ulang')}
        </Button>
      )}
    </div>
  );
}
