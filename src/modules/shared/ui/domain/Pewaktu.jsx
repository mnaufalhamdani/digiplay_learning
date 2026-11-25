'use client';
import { t } from '@/utils/i18n';
import { WAKTU_POST_TEST } from '@/enums';
import Ikon from '../Ikon';

/** mm:ss dari jumlah detik. */
function format(detik) {
  const d = Math.max(0, Math.floor(detik));
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
}

/**
 * Hitung mundur post test. Nilai `sisaDetik` berasal dari server (disinkronkan tiap denyut). Pada 5 menit terakhir
 * berubah ke nada warn dengan teks "Sisa waktu 5 menit", bukan hanya warna.
 */
export default function Pewaktu({ sisaDetik }) {
  const hampir = sisaDetik <= WAKTU_POST_TEST.peringatanDetik;
  return (
    <div role="timer" aria-live="off" className={`angka-tabular flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-[1.2em] font-bold ${hampir ? 'bg-warn-soft text-warn' : 'bg-primary-soft text-primary-text'}`}>
      <Ikon nama="pewaktu" />
      <span>{format(sisaDetik)}</span>
      {hampir && <span className="text-[0.75em]">{t('posttest.sisaLimaMenit')}</span>}
    </div>
  );
}
