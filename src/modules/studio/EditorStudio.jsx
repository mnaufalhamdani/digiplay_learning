'use client';
import { memo, useEffect, useRef } from 'react';
import { t } from '@/utils/i18n';
import { ambilTemaStudio, aturSumberStudio, muatSkrip, pasangWorkspaceStudio, sesuaikanUkuran, skripDariWorkspace } from './integrasiStudio';

/** Lebar wadah (px) di bawahnya toolbox dipindah ke atas agar area kerja tetap lega di HP. */
const LEBAR_HORIZONTAL = 640;

/** Apakah mode gelap sedang aktif (class `dark` di <html>, diatur ThemeToggle). */
const modeGelap = () => document.documentElement.classList.contains('dark');

/**
 * Editor blok Studio Zippy (dimuat dinamis tanpa SSR). Satu ruang kerja dipakai bergantian: `kunciSprite` menentukan
 * sprite yang sedang tampil, dan setiap kunci berganti ruang kerja memuat `skrip` sprite itu. `onGanti(skrip, kunci)`
 * dipanggil dengan skrip JSON setiap susunan blok berubah (`kunci` = sprite yang isinya sedang diubah). `terkunci`
 * menahan sentuhan saat program berjalan; `bacaSaja` menampilkan susunan blok tanpa toolbox dan tanpa bisa diubah.
 * `variabel` (daftar nama) dan `spriteLain` (daftar { id, label }) mengisi pilihan dropdown blok variabel dan blok
 * "Menyentuh sprite"; `onBuatVariabel` dipanggil tombol Buat variabel di kategori Variabel. Tema mengikuti terang/gelap
 * dan berganti sendiri saat tombol tema ditekan.
 */
function EditorStudio({ blokTersedia, skrip, kunciSprite, variabel = ['skor'], spriteLain = [], onGanti = null, onBuatVariabel = null, terkunci = false, bacaSaja = false }) {
  const wadah = useRef(null);
  const inti = useRef(null);
  const ruang = useRef(null);
  // nilai terbaru dipegang di ref agar workspace tidak dibuat ulang tiap render
  const skripTerbaru = useRef(skrip);
  skripTerbaru.current = skrip;
  const pendengar = useRef(onGanti);
  pendengar.current = onGanti;
  const bukaVariabel = useRef(onBuatVariabel);
  bukaVariabel.current = onBuatVariabel;
  // pilihan dropdown dinamis dibaca dari data proyek terbaru (diatur sebelum ruang kerja memuat skrip)
  aturSumberStudio({ variabel, sprite: spriteLain });
  /** Kunci sprite yang isinya sedang dimuat di ruang kerja. */
  const kunciMuat = useRef(kunciSprite);

  // kunci isi toolbox: workspace hanya dibuat ulang bila daftar blok benar-benar berubah, bukan saat props dimuat ulang
  const kunciBlok = blokTersedia.join('|');

  useEffect(() => {
    const ws = pasangWorkspaceStudio(inti.current, { blokTersedia: kunciBlok.split('|'), gelap: modeGelap(), horizontal: wadah.current.clientWidth < LEBAR_HORIZONTAL, bacaSaja, onBuatVariabel: () => bukaVariabel.current?.() });
    ruang.current = ws;
    kunciMuat.current = kunciSprite;
    muatSkrip(ws, skripTerbaru.current);
    /** Memberi tahu pemanggil skrip terbaru; peristiwa tampilan (geser, zoom, pilih) diabaikan. */
    const laporkan = (e) => {
      if (!e?.isUiEvent) pendengar.current?.(skripDariWorkspace(ws), kunciMuat.current);
    };
    if (!bacaSaja) ws.addChangeListener(laporkan);
    // ukuran wadah berubah (putar layar, jendela diubah): sesuaikan area kerja
    const ukuran = new ResizeObserver(() => sesuaikanUkuran(ws));
    ukuran.observe(wadah.current);
    // tombol tema mengganti class <html>: pasang tema Blockly yang sesuai
    const tema = new MutationObserver(() => ws.setTheme(ambilTemaStudio(modeGelap())));
    tema.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      ukuran.disconnect();
      tema.disconnect();
      ws.dispose();
      ruang.current = null;
    };
    // kunciSprite sengaja tidak jadi dependensi: berganti sprite hanya memuat ulang isi (efek di bawah), bukan membuat ulang ruang kerja
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciBlok, bacaSaja]);

  // berganti sprite: muat skrip sprite itu ke ruang kerja yang sama
  useEffect(() => {
    // belum ada ruang kerja, atau sprite yang sama sudah termuat (mis. tepat setelah ruang kerja dibuat)
    if (!ruang.current || kunciMuat.current === kunciSprite) return;
    kunciMuat.current = kunciSprite;
    muatSkrip(ruang.current, skripTerbaru.current);
  }, [kunciSprite]);

  return (
    <div ref={wadah} className={`relative h-[26rem] w-full overflow-hidden rounded-lg border-2 border-line sm:h-[32rem] ${terkunci ? 'pointer-events-none opacity-70' : ''}`}>
      <div ref={inti} role="group" aria-label={t('studio.editor')} className="absolute inset-0" />
    </div>
  );
}

export default memo(EditorStudio);
