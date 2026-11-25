'use client';
import { useId, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import { ALFABET_KODE, PANJANG_KODE_BAWAAN } from '@/enums';
import Ikon from '../Ikon';

/** Merapikan teks tempelan: huruf besar, tanpa spasi dan tanda hubung (sama dengan normalisasi server). */
function rapikan(teks) {
  return String(teks ?? '').toUpperCase().replace(/[\s-]/g, '');
}

/** Karakter (unik) di luar alfabet kode. */
function terlarang(teks) {
  return [...new Set([...teks].filter((c) => !ALFABET_KODE.includes(c)))];
}

/**
 * Input kode unik: N kotak, huruf kapital otomatis, mendukung tempel, pindah kotak otomatis.
 * Karakter di luar alfabet (O, I, 0, 1, simbol) ditolak dengan pesan ramah, tidak dikoreksi otomatis.
 * Isi per kotak disimpan di komponen ini (kotak kosong di tengah tidak menggeser huruf lain);
 * `onUbah(teks)` menerima gabungan semua kotak setiap kali isi berubah.
 */
export default function KolomKode({ label, onUbah, panjang = PANJANG_KODE_BAWAAN, galat = null, disabled = false }) {
  const idLabel = useId();
  const idPesan = useId();
  const kotak = useRef([]);
  const [pesanLokal, setPesanLokal] = useState('');
  const [isi, setIsi] = useState(() => Array(panjang).fill(''));
  const pesan = pesanLokal || galat;

  /** Menyimpan isi kotak baru dan memberi tahu induk. */
  function simpan(baru) {
    setIsi(baru);
    onUbah(baru.join(''));
  }

  /** Memfokuskan kotak ke-i (dibatasi dalam rentang). */
  function fokus(i) {
    kotak.current[Math.max(0, Math.min(panjang - 1, i))]?.focus();
  }

  /** Menulis karakter-karakter mulai kotak ke-i lalu memindah fokus ke kotak setelahnya. */
  function tulisMulai(i, karakter) {
    const baru = [...isi];
    karakter.slice(0, panjang - i).split('').forEach((c, j) => {
      baru[i + j] = c;
    });
    simpan(baru);
    fokus(i + karakter.length);
  }

  /** Menolak karakter terlarang dengan pesan; mengembalikan true bila semua karakter boleh. */
  function periksa(teks) {
    const salah = terlarang(teks);
    // ada karakter di luar alfabet: tampilkan pesan, jangan ubah isi
    if (salah.length > 0) {
      setPesanLokal(t('kolomKode.karakterTerlarang', { karakter: salah.join(', ') }));
      return false;
    }
    setPesanLokal('');
    return true;
  }

  /** Ketikan di satu kotak: ambil karakter terakhir yang diketik. */
  function ubah(i, e) {
    const teks = rapikan(e.target.value);
    // kotak dikosongkan (mis. lewat potong/hapus pilihan)
    if (!teks) return simpan(isi.map((c, j) => (j === i ? '' : c)));
    const karakter = teks.slice(-1);
    // hanya karakter alfabet kode yang ditulis ke kotak
    if (periksa(karakter)) tulisMulai(i, karakter);
  }

  /** Tempel: seluruh teks diperiksa dulu; bila ada karakter terlarang, tempelan ditolak utuh. */
  function tempel(i, e) {
    e.preventDefault();
    const teks = rapikan(e.clipboardData.getData('text'));
    // tempelan kosong atau berisi karakter terlarang: tidak ada yang ditulis
    if (!teks || !periksa(teks)) return;
    // kode lengkap ditempel di kotak mana pun: isi dari kotak pertama
    tulisMulai(teks.length >= panjang ? 0 : i, teks);
  }

  /** Navigasi papan ketik: Backspace di kotak kosong mundur, panah kiri/kanan berpindah kotak. */
  function tombol(i, e) {
    if (e.key === 'Backspace' && !isi[i] && i > 0) {
      e.preventDefault();
      simpan(isi.map((c, j) => (j === i - 1 ? '' : c)));
      fokus(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      fokus(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      fokus(i + 1);
    }
  }

  return (
    <div className="space-y-3">
      <p id={idLabel} className="text-center font-display text-[1.1em] font-bold">
        {label}
      </p>
      <div role="group" aria-labelledby={idLabel} aria-describedby={pesan ? idPesan : undefined} className="mx-auto grid max-w-lg gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${panjang}, minmax(0, 1fr))` }}>
        {isi.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              kotak.current[i] = el;
            }}
            value={c}
            onChange={(e) => ubah(i, e)}
            onPaste={(e) => tempel(i, e)}
            onKeyDown={(e) => tombol(i, e)}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t('kolomKode.kotakKe', { ke: i + 1, total: panjang })}
            aria-invalid={pesan ? true : undefined}
            className={`h-14 w-full rounded-md border-2 bg-panel text-center font-display text-[1.6em] font-bold uppercase text-fg outline-none transition-colors focus:border-primary focus:bg-primary-soft sm:h-16 ${pesan ? 'border-bad' : 'border-line'}`}
          />
        ))}
      </div>
      {pesan && (
        <p id={idPesan} role="alert" className="flex items-start justify-center gap-1.5 text-center font-semibold text-bad">
          <Ikon nama="peringatan" className="mt-1" />
          <span>{pesan}</span>
        </p>
      )}
    </div>
  );
}
