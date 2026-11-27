'use client';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from './Button';

/**
 * Tombol "Kembali" ke halaman sebelumnya di riwayat browser (bukan ke daftar tertentu).
 * `cadangan` adalah tujuan bila tidak ada halaman sebelumnya (mis. halaman dibuka langsung lewat tautan).
 */
export default function TombolKembali({ cadangan, varian = 'hantu', ukuran = 'md', ...sisa }) {
  const router = useRouter();
  /** Kembali satu langkah di riwayat; tanpa riwayat, pindah ke halaman cadangan. */
  function kembali() {
    // riwayat hanya berisi halaman ini (dibuka langsung): router.back() tidak akan ke mana-mana
    if (window.history.length > 1) router.back();
    else router.push(cadangan);
  }
  return (
    <Button varian={varian} ukuran={ukuran} ikon="kembali" onClick={kembali} {...sisa}>
      {t('umum.kembali')}
    </Button>
  );
}
