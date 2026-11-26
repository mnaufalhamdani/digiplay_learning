'use client';
import { useState } from 'react';
import { t } from '@/utils/i18n';
import { SPRITE_ZIPPY, jalurKostum } from '@/modules/shared/blockly/pustakaStudio';
import Modal from '@/modules/shared/ui/Modal';

/** Urutan kategori subjek di dialog. */
const KATEGORI = ['hewan', 'tanaman', 'kendaraan', 'benda_lain', 'benda_olahraga'];

/** Satu kartu sprite: gambar kostum 1 dan nama. */
function KartuSprite({ kode, nama, onPilih }) {
  return (
    <li>
      <button type="button" onClick={() => onPilih(kode)} className="flex min-h-11 w-full flex-col items-center gap-1 rounded-lg border-2 border-line bg-panel p-2 text-center font-semibold hover:border-primary hover:bg-primary-soft">
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar sprite statis dari public/aset, dimuat malas */}
        <img src={jalurKostum(kode)[0]} alt="" loading="lazy" draggable={false} className="size-16 object-contain" />
        <span className="text-[0.9em] leading-tight">{nama}</span>
      </button>
    </li>
  );
}

/**
 * Dialog memilih sprite dari pustaka: Zippy dan subjek gambar per kategori (satu kategori sekali tampil agar gambar
 * yang dimuat tidak terlalu banyak). `onPilih(kode)` dipanggil dengan kode subjek (atau 'zippy').
 */
export default function DialogSprite({ terbuka, pustaka, onPilih, onTutup }) {
  const [kategori, setKategori] = useState(KATEGORI[0]);
  const daftar = pustaka.filter((g) => g.kategori === kategori);
  return (
    <Modal terbuka={terbuka} judul={t('studio.pilihSprite')} tutup={onTutup}>
      <div className="space-y-4">
        <ul className="grid grid-cols-3 gap-2">
          <KartuSprite kode={SPRITE_ZIPPY} nama={t('studio.zippy')} onPilih={onPilih} />
        </ul>
        <div role="tablist" aria-label={t('studio.kategoriSprite')} className="flex flex-wrap gap-1.5">
          {KATEGORI.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={k === kategori} onClick={() => setKategori(k)} className={`min-h-11 rounded-full border-2 px-3 font-bold ${k === kategori ? 'border-primary bg-primary-soft text-primary-text' : 'border-line bg-panel'}`}>
              {t(`studio.kat.${k}`)}
            </button>
          ))}
        </div>
        <ul className="grid max-h-[40vh] grid-cols-3 gap-2 overflow-y-auto">
          {daftar.map((g) => (
            <KartuSprite key={g.kode} kode={g.kode} nama={g.nama} onPilih={onPilih} />
          ))}
        </ul>
      </div>
    </Modal>
  );
}
