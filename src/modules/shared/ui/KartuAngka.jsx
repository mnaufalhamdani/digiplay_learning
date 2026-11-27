import Link from 'next/link';
import { t } from '@/utils/i18n';
import Ikon from './Ikon';

/** Warna teks keterangan per nada: `baik` untuk perubahan positif, `muted` bawaan. */
const NADA = { baik: 'text-ok', muted: 'text-muted' };

/**
 * Kartu angka besar di dashboard: ikon, label, angka, dan keterangan kecil; seluruh kartu menjadi tautan ke halaman terkait.
 * `galat` menampilkan strip dan pesan ringkas tanpa merusak kartu lain. Elemen `<li>` (dipakai di dalam daftar grid).
 */
export default function KartuAngka({ href, ikon, label, nilai, keterangan = null, nada = 'muted', galat = false }) {
  return (
    <li>
      <Link href={href} className="flex h-full flex-col gap-1 rounded-lg border border-line bg-panel p-3 hover:border-primary hover:bg-primary-soft sm:p-4">
        <span className="flex items-center gap-2 text-[0.9em] text-muted">
          <Ikon nama={ikon} ukuran="1.25em" className="shrink-0 text-primary-text" />
          <span className="min-w-0">{label}</span>
        </span>
        <span className="break-words text-[1.6em] font-bold leading-tight angka-tabular">{galat ? '-' : nilai}</span>
        {galat ? <span className="text-[0.85em] text-bad">{t('beranda.dashboard.galatKartu')}</span> : keterangan && <span className={`text-[0.85em] ${NADA[nada]}`}>{keterangan}</span>}
      </Link>
    </li>
  );
}
