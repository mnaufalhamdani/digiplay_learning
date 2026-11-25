'use client';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';

// Lima game latihan mouse (DOM + CSS, Pointer Events, tanpa pustaka game). Tiap game menerima
// { aktif, tambah, gagal } dari AreaGame. Angka acak di sini hanya untuk tampilan (posisi), bukan penilaian.

/** Posisi acak dalam persen area (menyisakan tepi agar objek tidak terpotong). */
function posisiAcak() {
  return { x: 8 + Math.random() * 76, y: 10 + Math.random() * 70 };
}

/** Pecahkan Balon (mouse_klik): balon muncul acak dan hilang sendiri ±2,5 detik; makin lama makin cepat. */
export function GameBalon({ aktif, tambah }) {
  const [balon, setBalon] = useState([]);
  const jumlah = useRef(0);
  useEffect(() => {
    if (!aktif) return undefined;
    const timer = setInterval(() => {
      const umur = Math.max(1200, 2500 - jumlah.current * 40);
      const id = Date.now() + Math.random();
      setBalon((b) => [...b.slice(-5), { id, ...posisiAcak() }]);
      // balon yang tidak diklik hilang sendiri (tanpa pengurangan poin)
      setTimeout(() => setBalon((b) => b.filter((x) => x.id !== id)), umur);
    }, 900);
    return () => clearInterval(timer);
  }, [aktif]);
  /** Balon diklik: pecah dan +1. */
  function pecah(id) {
    jumlah.current += 1;
    setBalon((b) => b.filter((x) => x.id !== id));
    tambah();
  }
  return balon.map((b) => (
    <button key={b.id} type="button" aria-label={t('game.balon')} onPointerDown={() => pecah(b.id)} className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-primary-edge bg-primary text-[1.8em] shadow-lg motion-safe:animate-bounce" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
      🎈
    </button>
  ));
}

/** Buka Kotak Hadiah (mouse_klik_ganda): klik dua kali membuka (+1); satu klik hanya menggoyang kotak. */
export function GameKotak({ aktif, tambah }) {
  const [kotak, setKotak] = useState(() => [0, 1, 2].map((i) => ({ id: i, buka: false, goyang: false })));
  /** Ubah satu kotak. */
  function ubah(id, isi) {
    setKotak((k) => k.map((x) => (x.id === id ? { ...x, ...isi } : x)));
  }
  /** Klik tunggal: goyang sebagai petunjuk. */
  function klik(id) {
    if (!aktif) return;
    ubah(id, { goyang: true });
    setTimeout(() => ubah(id, { goyang: false }), 400);
  }
  /** Klik ganda: kotak terbuka, +1, lalu tertutup lagi. */
  function buka(id) {
    if (!aktif || kotak[id].buka) return;
    ubah(id, { buka: true });
    tambah();
    setTimeout(() => ubah(id, { buka: false }), 700);
  }
  return (
    <div className="absolute inset-0 flex items-center justify-around px-4">
      {kotak.map((k) => (
        <button key={k.id} type="button" aria-label={t(k.buka ? 'game.kotakTerbuka' : 'game.kotak')} onClick={() => klik(k.id)} onDoubleClick={() => buka(k.id)} className={`flex size-24 items-center justify-center rounded-lg border-4 border-sun-edge bg-sun text-[2.6em] shadow-lg sm:size-32 ${k.goyang ? 'motion-safe:animate-pulse' : ''}`}>
          {k.buka ? '⭐' : '🎁'}
        </button>
      ))}
    </div>
  );
}

/** Benda dan keranjang untuk game seret: tiap benda punya jenis yang sama dengan salah satu keranjang. */
const BENDA = [
  { teks: '🍎', jenis: 'buah' },
  { teks: '🍌', jenis: 'buah' },
  { teks: '🧸', jenis: 'mainan' },
  { teks: '🪀', jenis: 'mainan' },
  { teks: '🚗', jenis: 'kendaraan' },
  { teks: '🚲', jenis: 'kendaraan' },
];
const KERANJANG = ['buah', 'mainan', 'kendaraan'];

/** Masukkan ke Keranjang (mouse_drag): seret benda ke keranjang yang cocok (+1); salah kembali ke posisi awal. */
export function GameKeranjang({ aktif, tambah, gagal }) {
  const [benda, setBenda] = useState(() => BENDA[Math.floor(Math.random() * BENDA.length)]);
  const [geser, setGeser] = useState(null); // { dx, dy, x0, y0 } selama diseret
  /** Mulai menyeret (pointer ditangkap agar gerakan tetap terbaca di luar elemen). */
  function turun(e) {
    if (!aktif) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setGeser({ dx: 0, dy: 0, x0: e.clientX, y0: e.clientY });
  }
  /** Benda mengikuti pointer. */
  function gerak(e) {
    if (geser) setGeser((g) => ({ ...g, dx: e.clientX - g.x0, dy: e.clientY - g.y0 }));
  }
  /** Dilepas: cek keranjang di bawah pointer. */
  function naik(e) {
    if (!geser) return;
    const target = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.dataset?.keranjang)?.dataset.keranjang;
    setGeser(null);
    // dilepas di luar keranjang: kembali tanpa reaksi
    if (!target) return;
    if (target === benda.jenis) {
      tambah();
      setBenda(BENDA[Math.floor(Math.random() * BENDA.length)]);
    } else gagal();
  }
  return (
    <>
      <div
        role="button"
        tabIndex={-1}
        aria-label={t('game.bendaSeret')}
        onPointerDown={turun}
        onPointerMove={gerak}
        onPointerUp={naik}
        onPointerCancel={() => setGeser(null)}
        className="absolute top-[12%] left-1/2 z-10 flex size-20 cursor-grab items-center justify-center rounded-full bg-panel text-[2.6em] shadow-lg"
        style={{ transform: `translate(calc(-50% + ${geser?.dx ?? 0}px), ${geser?.dy ?? 0}px)` }}
      >
        {benda.teks}
      </div>
      <div className="absolute inset-x-2 bottom-2 flex justify-around gap-2">
        {KERANJANG.map((k) => (
          <div key={k} data-keranjang={k} className="flex h-24 flex-1 flex-col items-center justify-center rounded-lg border-4 border-dashed border-line bg-panel font-bold">
            <span className="text-[1.6em]" aria-hidden="true">
              🧺
            </span>
            {t(`game.keranjang.${k}`)}
          </div>
        ))}
      </div>
    </>
  );
}

/** Klik Kanan Ajaib (mouse_klik_kanan): klik kanan membuka menu buatan sendiri (hanya di area game); pilih "Buka" = +1. */
export function GameKlikKanan({ aktif, tambah }) {
  const [menu, setMenu] = useState(null); // { x, y } relatif area
  const [terbuka, setTerbuka] = useState(false);
  /** Menu bawaan browser dicegah hanya di dalam area ini; posisi menu mengikuti pointer. */
  function konteks(e) {
    e.preventDefault();
    if (!aktif) return;
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ x: e.clientX - r.left, y: e.clientY - r.top });
  }
  /** Memilih "Buka": peti terbuka sebentar lalu terkunci lagi. */
  function buka() {
    setMenu(null);
    setTerbuka(true);
    tambah();
    setTimeout(() => setTerbuka(false), 700);
  }
  return (
    <div className="absolute inset-0" onContextMenu={konteks} onPointerDown={(e) => e.button === 0 && setMenu(null)}>
      <div className="absolute top-1/2 left-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-panel text-[3em] shadow-lg">{terbuka ? '💎' : '🔒'}</div>
      <p className="absolute inset-x-0 top-3 text-center font-semibold">{t('game.klikKananPetunjuk')}</p>
      {menu && (
        <div role="menu" className="absolute z-10 min-w-36 rounded-md border-2 border-line bg-panel p-1 shadow-xl" style={{ left: menu.x, top: menu.y }}>
          <button type="button" role="menuitem" onClick={buka} className="block min-h-11 w-full rounded px-3 text-left font-bold hover:bg-primary-soft">
            {t('game.menuBuka')}
          </button>
          <button type="button" role="menuitem" onClick={() => setMenu(null)} className="block min-h-11 w-full rounded px-3 text-left hover:bg-primary-soft">
            {t('game.menuBatal')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Jumlah gulungan (deltaY) untuk satu tahap tumbuh penuh. */
const GULUNG_PER_TAHAP = 1200;

/** Kebun Gulung (mouse_scroll): gulung roda mouse (atau seret naik-turun di layar sentuh) untuk menumbuhkan tanaman; tiap tahap penuh = +1. */
export function GameGulung({ aktif, tambah }) {
  const [tumbuh, setTumbuh] = useState(0); // 0..1
  const area = useRef(null);
  const sentuh = useRef(null);
  const tambahRef = useRef(tambah);
  tambahRef.current = tambah;
  // listener wheel non-pasif agar halaman tidak ikut bergulir saat menggulung di area game
  useEffect(() => {
    const el = area.current;
    /** Menambah pertumbuhan; tahap penuh memberi poin lalu mulai dari awal. */
    function maju(jarak) {
      setTumbuh((g) => {
        const baru = g + Math.abs(jarak) / GULUNG_PER_TAHAP;
        if (baru < 1) return baru;
        tambahRef.current();
        return 0;
      });
    }
    /** Roda mouse. */
    function roda(e) {
      e.preventDefault();
      if (aktif) maju(e.deltaY || e.deltaX);
    }
    el.addEventListener('wheel', roda, { passive: false });
    el.ontouchstart = (e) => (sentuh.current = e.touches[0].clientY);
    el.ontouchmove = (e) => {
      // seret jari naik-turun sebagai pengganti roda di layar sentuh
      if (!aktif || sentuh.current == null) return;
      maju((e.touches[0].clientY - sentuh.current) * 4);
      sentuh.current = e.touches[0].clientY;
    };
    return () => el.removeEventListener('wheel', roda);
  }, [aktif]);
  return (
    <div ref={area} className="absolute inset-0 flex flex-col items-center justify-end" style={{ overscrollBehavior: 'contain' }}>
      <p className="absolute inset-x-0 top-3 text-center font-semibold">{t('game.gulungPetunjuk')}</p>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tumbuh * 100)} aria-label={t('game.tumbuh')} className="mb-2 flex flex-col items-center">
        <span className="text-[3em] leading-none" style={{ transform: `scale(${0.6 + tumbuh * 1.4})`, transformOrigin: 'bottom' }}>
          {tumbuh < 0.5 ? '🌱' : '🌻'}
        </span>
        <span className="mt-1 text-[2em]" aria-hidden="true">
          🪴
        </span>
      </div>
      <div className="absolute top-1/4 right-6 text-[2em]" style={{ transform: `translateY(${-tumbuh * 60}px)` }} aria-hidden="true">
        🪣
      </div>
    </div>
  );
}
