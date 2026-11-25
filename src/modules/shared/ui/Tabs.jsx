'use client';
import { useId, useRef, useState } from 'react';

/**
 * Tab sederhana yang aksesibel (role tablist, panah kiri/kanan berpindah tab). Daftar tab bisa digulir
 * mendatar di HP. `tab`: [{ id, label, isi }]; isi boleh berupa elemen dari server component.
 */
export default function Tabs({ tab, awal = null }) {
  const dasar = useId();
  const [aktif, setAktif] = useState(awal ?? tab[0]?.id);
  const tombol = useRef({});
  /** Panah kiri/kanan memindah fokus dan pilihan ke tab tetangga. */
  function tekan(e, i) {
    const arah = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    // tombol lain tidak mengubah tab
    if (!arah) return;
    e.preventDefault();
    const tujuan = tab[(i + arah + tab.length) % tab.length];
    setAktif(tujuan.id);
    tombol.current[tujuan.id]?.focus();
  }
  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b-2 border-line">
        {tab.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              tombol.current[x.id] = el;
            }}
            type="button"
            role="tab"
            id={`${dasar}-tab-${x.id}`}
            aria-selected={aktif === x.id}
            aria-controls={`${dasar}-panel-${x.id}`}
            tabIndex={aktif === x.id ? 0 : -1}
            onClick={() => setAktif(x.id)}
            onKeyDown={(e) => tekan(e, i)}
            className={`-mb-0.5 min-h-11 shrink-0 border-b-2 px-4 font-bold ${aktif === x.id ? 'border-primary text-primary-text' : 'border-transparent text-muted hover:text-fg'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {tab.map((x) => (
        <div key={x.id} role="tabpanel" id={`${dasar}-panel-${x.id}`} aria-labelledby={`${dasar}-tab-${x.id}`} hidden={aktif !== x.id}>
          {x.isi}
        </div>
      ))}
    </div>
  );
}
