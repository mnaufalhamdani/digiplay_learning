'use client';
import { memo, useRef } from 'react';
import { t } from '@/utils/i18n';
import { DAFTAR_TOMBOL, JENIS_SPRITE, PANGGUNG, TOMBOL, UKURAN_TEKS, WARNA_TEKS, jalurKostumSprite } from '@/modules/shared/blockly/pustakaStudio';
import LatarStudio from './LatarStudio';

/** Kode tombol blok (spasi, kanan, ...) dari nilai KeyboardEvent.key; undefined bila bukan tombol blok. */
const KODE_DARI_KEY = Object.fromEntries(DAFTAR_TOMBOL.map((kode) => [TOMBOL[kode], kode]));

/** Posisi (persen) pusat sprite di panggung dari koordinat panggung (pusat di tengah, y ke atas). */
const persenX = (x) => ((x + PANGGUNG.lebar / 2) / PANGGUNG.lebar) * 100;
const persenY = (y) => ((PANGGUNG.tinggi / 2 - y) / PANGGUNG.tinggi) * 100;
/** Lebar gambar sprite sebagai persen lebar panggung. */
const LEBAR_SPRITE = (PANGGUNG.ukuranSprite / PANGGUNG.lebar) * 100;
/** Tinggi huruf sprite teks (px panggung) dalam satuan lebar panggung (cqw). */
const cqwTeks = (ukuran) => ((UKURAN_TEKS[ukuran] ?? UKURAN_TEKS.sedang) / PANGGUNG.lebar) * 100;

/** Nilai monitor variabel untuk ditampilkan: angka dirapikan, teks apa adanya. */
const teksNilai = (nilai) => (typeof nilai === 'number' ? String(Math.round(nilai * 1000) / 1000) : String(nilai));

/**
 * Panggung 480:360 yang menyesuaikan lebar wadahnya (semua ukuran memakai persen, teks balon memakai satuan wadah).
 * `tampilan`: { latar, variabel, tampilSkor, monitor, sprite[] } (keadaan awal proyek saat mengedit, atau keadaan mesin saat berjalan).
 * `onGeser(id, x, y)`: bila diberikan, sprite bisa diseret untuk mengatur posisi awal; `terpilih`/`onPilih` menandai sprite aktif.
 * `onKlik(id)`: sprite diklik saat program berjalan (blok "Ketika sprite ini diklik").
 * `idPanggung`: id elemen panggung (agar bisa difokus dari tombol bendera). `onTombol(kode)`: tombol keyboard yang ditekan
 * saat panggung difokus (hanya bermakna saat program berjalan).
 */
function PanggungStudio({ tampilan, idPanggung = undefined, onGeser = null, terpilih = null, onPilih = null, onKlik = null, onTombol = null }) {
  const wadah = useRef(null);
  const geser = useRef(null);

  /** Mengubah posisi pointer menjadi koordinat panggung. */
  function koordinat(e) {
    const kotak = wadah.current.getBoundingClientRect();
    return { x: ((e.clientX - kotak.left) / kotak.width) * PANGGUNG.lebar - PANGGUNG.lebar / 2, y: PANGGUNG.tinggi / 2 - ((e.clientY - kotak.top) / kotak.height) * PANGGUNG.tinggi };
  }
  /** Mulai menyeret sprite (pointer ditangkap agar tetap mengikuti walau keluar dari gambar), atau mengklik saat program berjalan. */
  function mulaiGeser(e, sp) {
    onPilih?.(sp.id);
    onKlik?.(sp.id);
    if (!onGeser) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = koordinat(e);
    geser.current = { id: sp.id, dx: sp.x - p.x, dy: sp.y - p.y };
  }
  /** Sprite mengikuti pointer, dibatasi ke dalam panggung. */
  function gerakGeser(e) {
    if (!geser.current) return;
    const p = koordinat(e);
    const x = Math.round(Math.max(-PANGGUNG.lebar / 2, Math.min(PANGGUNG.lebar / 2, p.x + geser.current.dx)));
    const y = Math.round(Math.max(-PANGGUNG.tinggi / 2, Math.min(PANGGUNG.tinggi / 2, p.y + geser.current.dy)));
    onGeser(geser.current.id, x, y);
  }
  /** Tombol keyboard blok ditekan saat panggung difokus; tombol panah dan spasi tidak menggulung halaman. */
  function tekan(e) {
    const kode = KODE_DARI_KEY[e.key];
    if (!kode || !onTombol) return;
    e.preventDefault();
    onTombol(kode);
  }

  return (
    <div
      ref={wadah}
      id={idPanggung}
      tabIndex={0}
      role="group"
      aria-label={t('studio.panggung')}
      onKeyDown={tekan}
      style={{ containerType: 'inline-size' }}
      className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-lg border-2 border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <LatarStudio latar={tampilan.latar} />
      {tampilan.sprite.map((sp) => {
        if (!sp.tampil) return null;
        const dipilih = terpilih === sp.id;
        const teks = sp.jenis === JENIS_SPRITE.TEKS;
        const cincin = dipilih && onPilih ? 'rounded-md outline-2 outline-dashed outline-primary' : '';
        const aksi = { onPointerDown: (e) => mulaiGeser(e, sp), onPointerMove: gerakGeser, onPointerUp: () => (geser.current = null), onPointerCancel: () => (geser.current = null) };
        const kursor = onGeser ? 'cursor-grab active:cursor-grabbing' : onKlik ? 'cursor-pointer' : '';
        const jalur = teks ? null : jalurKostumSprite(sp);
        const warna = WARNA_TEKS[sp.warna] ?? WARNA_TEKS.putih;
        return (
          <div key={sp.id}>
            {teks ? (
              // sprite teks: tulisan bergaris tepi tipis agar terbaca di latar apa pun
              <div
                {...aksi}
                style={{ left: `${persenX(sp.x)}%`, top: `${persenY(sp.y)}%`, transform: 'translate(-50%, -50%)', fontSize: `${cqwTeks(sp.ukuran)}cqw`, color: warna.isi, WebkitTextStroke: `0.5cqw ${warna.tepi}`, paintOrder: 'stroke fill' }}
                className={`absolute whitespace-nowrap px-[1cqw] font-display font-bold leading-tight ${kursor} ${cincin}`}
              >
                {sp.teks}
              </div>
            ) : (
              <div
                {...aksi}
                style={{ left: `${persenX(sp.x)}%`, top: `${persenY(sp.y)}%`, width: `${LEBAR_SPRITE}%`, transform: `translate(-50%, -50%) rotate(${sp.arah - 90}deg)` }}
                className={`absolute aspect-square ${kursor} ${cincin}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar sprite statis dari public/aset atau berkas unggahan, tanpa optimasi */}
                <img src={jalur[sp.kostum] ?? jalur[0]} alt="" draggable={false} className={`pointer-events-none size-full object-contain ${tampilan.latar === 'luar angkasa' ? '' : 'mix-blend-multiply'}`} />
              </div>
            )}
            {sp.kata && (
              <div
                style={{ left: `${persenX(sp.x)}%`, top: `${persenY(sp.y)}%`, fontSize: '3.4cqw', transform: 'translate(-50%, calc(-100% - 6cqw))' }}
                className="pointer-events-none absolute max-w-[60%] rounded-2xl border-2 border-line bg-white px-[1.6cqw] py-[0.8cqw] text-center font-bold leading-tight text-on-sun shadow"
              >
                {sp.kata}
              </div>
            )}
          </div>
        );
      })}
      {/* monitor variabel: skor (Level 2) dan variabel buatan sendiri yang ditampilkan blok Tampilkan variabel */}
      <div style={{ fontSize: '3.4cqw' }} className="pointer-events-none absolute left-[2%] top-[2%] flex flex-col items-start gap-[0.6cqw]">
        {tampilan.tampilSkor && <span className="rounded-full bg-white/90 px-[2cqw] py-[0.5cqw] font-display font-bold text-on-sun">{t('studio.skor', { nilai: teksNilai(tampilan.variabel.skor) })}</span>}
        {(tampilan.monitor ?? []).map((m) => (
          <span key={m.nama} className="rounded-full bg-white/90 px-[2cqw] py-[0.5cqw] font-display font-bold text-on-sun">
            {m.nama}: {teksNilai(m.nilai)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default memo(PanggungStudio);
