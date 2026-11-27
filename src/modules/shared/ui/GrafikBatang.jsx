'use client';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import { rupiahRingkas } from '@/modules/rapor/dashboard.helper';

/** Pemformat angka yang boleh dipilih lewat prop 'format' (fungsi tidak bisa dikirim dari server component ke komponen client). */
const FORMAT = { angka: (n) => n.toLocaleString('id-ID'), rupiah: rupiahRingkas };

/** Seberapa jauh dua label sumbu harus terpisah (dalam jumlah batang) agar tidak bertumpuk. */
const JARAK_LABEL = 3;

/**
 * Menentukan label sumbu satu batang: 'selalu' (awal, tengah, akhir, atau semua bila batang sedikit), 'lebar' (tambahan tiap
 * kelipatan 5, hanya di layar lebar), atau null.
 */
function tampilanLabel(i, n) {
  // batang sedikit (mis. 6 bulan): semua label muat
  if (n <= 8) return 'selalu';
  const tengah = Math.floor((n - 1) / 2);
  if (i === 0 || i === n - 1 || i === tengah) return 'selalu';
  // tambahan hanya bila jauh dari awal, tengah, dan akhir agar tidak menumpuk
  const jauh = i >= JARAK_LABEL && n - 1 - i >= JARAK_LABEL && Math.abs(i - tengah) >= JARAK_LABEL;
  return jauh && (i + 1) % 5 === 0 ? 'lebar' : null;
}

/**
 * Grafik batang vertikal (HTML/CSS) yang mengisi lebar kartu. Tiap item: { label, nilai, teks, sorot, kosong }:
 * `teks` = kalimat pada pita saat batang dipilih, `sorot` = batang berwarna `sun` (mis. hari ini), `kosong` = belum terjadi
 * (tanpa batang). Interaksi: hover di desktop; ketuk atau geser jari di HP (ketuk lagi atau di luar menghapus pilihan);
 * panah/Home/End/Esc di keyboard. Batang tertinggi diberi label angka. Tabel data tersembunyi menyertai pembaca layar.
 */
export default function GrafikBatang({ data, ringkas, judul, pitaBawaan = '', format = 'angka', tinggi = 'h-28 sm:h-36' }) {
  const formatNilai = FORMAT[format];
  const [terpilih, setTerpilih] = useState(null);
  const area = useRef(null);
  const n = data.length;
  const maks = Math.max(1, ...data.map((d) => d.nilai));
  const indeksMaks = data.findIndex((d) => d.nilai === maks && d.nilai > 0);

  // ketuk di luar grafik menghapus pilihan (perilaku HP); pendengar dilepas saat komponen hilang
  useEffect(() => {
    const luar = (e) => {
      if (area.current && !area.current.contains(e.target)) setTerpilih(null);
    };
    document.addEventListener('pointerdown', luar);
    return () => document.removeEventListener('pointerdown', luar);
  }, []);

  /** Indeks batang di bawah titik X pointer (area batang dibagi rata, sehingga batang sempit tetap mudah dituju). */
  function indeksDari(e) {
    const kotak = area.current.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - kotak.left) / kotak.width) * n)));
  }
  /** Sentuhan/pena: menyentuh batang yang sama lagi menghapus pilihan; mouse hanya memakai hover. */
  function saatTekan(e) {
    // mouse sudah ditangani hover, klik tidak boleh membatalkan pilihan
    if (e.pointerType === 'mouse') return;
    const i = indeksDari(e);
    setTerpilih((lama) => (lama === i ? null : i));
  }
  /** Mouse: hover memilih batang; jari yang digeser (tombol tertekan) memilih batang di bawahnya. */
  function saatGeser(e) {
    if (e.pointerType === 'mouse' || e.buttons) setTerpilih(indeksDari(e));
  }
  /** Keyboard: panah menggeser pilihan, Home/End ke ujung, Esc menghapus. */
  function saatTombol(e) {
    const peta = {
      ArrowRight: () => (terpilih == null ? 0 : Math.min(n - 1, terpilih + 1)),
      ArrowLeft: () => (terpilih == null ? n - 1 : Math.max(0, terpilih - 1)),
      Home: () => 0,
      End: () => n - 1,
      Escape: () => null,
    };
    if (!peta[e.key]) return;
    e.preventDefault();
    setTerpilih(peta[e.key]());
  }

  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">{ringkas}</figcaption>
      {/* pita nilai: menggantikan tooltip yang tidak bisa dipakai di layar sentuh */}
      <p role="status" aria-live="polite" className="min-h-[1.5em] text-[0.9em] font-semibold angka-tabular">
        {terpilih == null ? <span className="font-normal text-muted">{pitaBawaan}</span> : data[terpilih].teks}
      </p>
      <div
        ref={area}
        role="group"
        tabIndex={0}
        aria-label={ringkas}
        onPointerDown={saatTekan}
        onPointerMove={saatGeser}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setTerpilih(null)}
        onKeyDown={saatTombol}
        onBlur={() => setTerpilih(null)}
        style={{ touchAction: 'pan-y' }}
        className={`flex items-end border-b border-line pt-5 ${tinggi} rounded-sm`}
      >
        {data.map((d, i) => (
          <div key={d.kunci ?? i} aria-hidden="true" className="relative flex h-full min-w-0 flex-1 items-end justify-center px-px">
            {d.kosong ? (
              // belum terjadi: garis putus halus agar tampak berbeda dari hari lampau bernilai 0
              <span className="h-0 w-full max-w-12 border-t-2 border-dotted border-line" />
            ) : (
              <span
                style={{ height: d.nilai > 0 ? `${(d.nilai / maks) * 100}%` : '2px' }}
                className={`batang-tumbuh relative w-full max-w-12 rounded-t-[6px] transition-opacity duration-[var(--dur-cepat)] ${d.nilai > 0 ? (d.sorot ? 'bg-sun' : 'bg-primary') : 'bg-line'} ${terpilih != null && terpilih !== i ? 'opacity-40' : ''}`}
              >
                {i === indeksMaks && <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.75em] font-bold angka-tabular text-fg">{formatNilai(d.nilai)}</span>}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* label sumbu minimalis: awal, tengah, akhir; kelipatan 5 tambahan hanya di layar lebar */}
      <div aria-hidden="true" className="relative h-4 text-[0.75em] text-muted angka-tabular">
        {data.map((d, i) => {
          const tampil = tampilanLabel(i, n);
          if (!tampil) return null;
          return (
            <span key={d.kunci ?? i} style={{ left: `${((i + 0.5) / n) * 100}%` }} className={`absolute -translate-x-1/2 whitespace-nowrap ${tampil === 'lebar' ? 'hidden sm:block' : ''}`}>
              {d.label}
            </span>
          );
        })}
      </div>
      <div className="sr-only">
        <table>
          <caption>{t('beranda.dashboard.grafik.ringkasTabel', { judul: judul ?? ringkas })}</caption>
          <thead>
            <tr>
              <th scope="col">{judul ?? ''}</th>
              <th scope="col">{t('beranda.dashboard.grafik.kolomNilai')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.kunci ?? i}>
                <th scope="row">{d.label}</th>
                <td>{d.kosong ? '-' : formatNilai(d.nilai)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
