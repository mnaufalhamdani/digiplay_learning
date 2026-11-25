'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import { BATAS_LATIHAN } from '@/enums';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/**
 * Wadah game latihan mouse (D1.4): HUD skor dan waktu, Mulai/Jeda/Ulang, layar hasil, dan Zippy yang bereaksi.
 * Mode tugas (`target` terisi): tanpa batas waktu sampai skor mencapai target. Mode bebas: 60 detik.
 * `children({ aktif, tambah, gagal })` merender isi game; `tambah()` = +1 poin, `gagal()` = Zippy menyemangati.
 * `onSelesai({ skor, durasiDetik, selesai })` dipanggil sekali saat game berakhir.
 */
export default function AreaGame({ judul, petunjuk, target = null, onSelesai, children }) {
  const [status, setStatus] = useState('awal'); // awal | jalan | jeda | selesai
  const [skor, setSkor] = useState(0);
  const [detik, setDetik] = useState(0);
  const [reaksi, setReaksi] = useState(null); // 'semangat' sesaat setelah gagal
  const batas = target ? null : BATAS_LATIHAN.durasiBebasDetik;
  const kirim = useRef(onSelesai);
  kirim.current = onSelesai;
  /** Mengakhiri game dan mengirim hasil. */
  const akhiri = useCallback((skorAkhir, durasi, selesai) => {
    setStatus('selesai');
    kirim.current({ skor: skorAkhir, durasiDetik: Math.max(1, durasi), selesai });
  }, []);
  // waktu berjalan hanya saat status jalan; mode bebas berakhir di 60 detik
  useEffect(() => {
    if (status !== 'jalan') return undefined;
    const timer = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);
  // game berakhir: waktu mode bebas habis, atau target mode tugas tercapai
  useEffect(() => {
    if (status !== 'jalan') return;
    if ((batas && detik >= batas) || (target && skor >= target)) akhiri(skor, detik, true);
  }, [status, batas, target, detik, skor, akhiri]);
  /** +1 poin (tanpa pengurangan poin untuk aksi salah). */
  const tambah = useCallback(() => setSkor((s) => s + 1), []);
  /** Zippy menyemangati sebentar (aksi salah, tanpa pengurangan poin). */
  const gagal = useCallback(() => {
    setReaksi('menyemangati');
    setTimeout(() => setReaksi(null), 1200);
  }, []);
  /** Mulai dari awal. */
  function mulai() {
    setSkor(0);
    setDetik(0);
    setStatus('jalan');
  }
  const aktif = status === 'jalan';
  return (
    <div className="space-y-3">
      <div className="angka-tabular flex flex-wrap items-center gap-3 font-bold">
        <span className="flex items-center gap-1">
          <Ikon nama="bintang" />
          {target ? t('game.skorTarget', { skor, target }) : t('game.skor', { skor })}
        </span>
        <span className="flex items-center gap-1">
          <Ikon nama="pewaktu" />
          {batas ? t('game.sisaWaktu', { detik: Math.max(0, batas - detik) }) : t('game.waktu', { detik })}
        </span>
        <div className="ml-auto flex gap-2">
          {aktif && (
            <Button varian="secondary" ikon="jeda" onClick={() => setStatus('jeda')}>
              {t('game.jeda')}
            </Button>
          )}
          {status === 'jeda' && (
            <Button ikon="main" onClick={() => setStatus('jalan')}>
              {t('game.lanjut')}
            </Button>
          )}
          {status !== 'awal' && (
            <Button varian="hantu" ikon="acak" onClick={mulai}>
              {t('game.ulang')}
            </Button>
          )}
        </div>
      </div>
      <div className="relative aspect-[16/10] min-w-[300px] touch-none overflow-hidden rounded-lg border-2 border-line bg-primary-soft select-none" style={{ overscrollBehavior: 'contain' }}>
        {children({ aktif, tambah, gagal })}
        {status !== 'jalan' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] p-4 text-center">
            <Maskot suasana={status === 'selesai' ? 'merayakan' : 'semangat'} ukuran={100} />
            <p className="font-display text-[1.3em] font-bold">{status === 'selesai' ? t('game.hasil', { skor }) : status === 'jeda' ? t('game.dijeda') : judul}</p>
            {status === 'awal' && <p className="max-w-md font-semibold">{petunjuk}</p>}
            {status !== 'jeda' && (
              <Button ukuran="lg" ikon="main" onClick={mulai}>
                {t(status === 'selesai' ? 'game.mainLagi' : 'game.mulai')}
              </Button>
            )}
          </div>
        )}
        {reaksi && (
          <div className="pointer-events-none absolute right-2 bottom-2 z-10">
            <Maskot suasana={reaksi} ukuran={96} />
          </div>
        )}
      </div>
      <Konfeti tampil={status === 'selesai' && skor > 0} />
    </div>
  );
}
