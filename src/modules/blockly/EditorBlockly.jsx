'use client';
import { useEffect, useRef } from 'react';
import { t } from '@/utils/i18n';
import { ambilTema, pasangWorkspace, programDariWorkspace, sesuaikanUkuran } from './integrasiBlockly';

/** Lebar wadah (px) di bawahnya toolbox dipindah ke atas agar area kerja tetap lega di HP. */
const LEBAR_HORIZONTAL = 560;

/** Apakah mode gelap sedang aktif (class `dark` di <html>, diatur ThemeToggle). */
const modeGelap = () => document.documentElement.classList.contains('dark');

/**
 * Editor blok Blockly (dimuat dinamis tanpa SSR oleh KlienLabirin). `blokTersedia` menentukan isi toolbox;
 * `onGanti(program)` dipanggil dengan program JSON setiap susunan blok berubah. `terkunci` menahan sentuhan
 * saat Zippy sedang berjalan. Tema mengikuti terang/gelap dan berganti sendiri saat tombol tema ditekan.
 */
export default function EditorBlockly({ blokTersedia, onGanti, terkunci = false }) {
  const wadah = useRef(null);
  const inti = useRef(null);
  // callback terbaru dipegang di ref agar workspace tidak dibuat ulang tiap render
  const pendengar = useRef(onGanti);
  pendengar.current = onGanti;

  // kunci isi toolbox: workspace hanya dibuat ulang bila daftar blok benar-benar berubah, bukan saat props dimuat ulang
  // (router.refresh setelah menyimpan hasil menghasilkan array baru yang isinya sama, dan blok siswa tidak boleh hilang)
  const kunciBlok = blokTersedia.join('|');

  useEffect(() => {
    const ws = pasangWorkspace(inti.current, { blokTersedia: kunciBlok.split('|'), gelap: modeGelap(), horizontal: wadah.current.clientWidth < LEBAR_HORIZONTAL });
    /** Memberi tahu pemanggil program terbaru; peristiwa tampilan (geser, zoom, pilih) diabaikan. */
    const laporkan = (e) => {
      if (!e?.isUiEvent) pendengar.current(programDariWorkspace(ws));
    };
    ws.addChangeListener(laporkan);
    pendengar.current(programDariWorkspace(ws));
    // ukuran wadah berubah (putar layar, jendela diubah): sesuaikan area kerja
    const ukuran = new ResizeObserver(() => sesuaikanUkuran(ws));
    ukuran.observe(wadah.current);
    // tombol tema mengganti class <html>: pasang tema Blockly yang sesuai
    const tema = new MutationObserver(() => ws.setTheme(ambilTema(modeGelap())));
    tema.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      ukuran.disconnect();
      tema.disconnect();
      ws.dispose();
    };
  }, [kunciBlok]);

  return (
    <div ref={wadah} className={`relative h-[24rem] w-full overflow-hidden rounded-lg border-2 border-line sm:h-[28rem] ${terkunci ? 'pointer-events-none opacity-70' : ''}`}>
      <div ref={inti} role="group" aria-label={t('blockly.editor')} className="absolute inset-0" />
    </div>
  );
}
