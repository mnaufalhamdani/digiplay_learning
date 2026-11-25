'use client';
import { useEffect, useRef } from 'react';
import { t } from '@/utils/i18n';
import Ikon from './Ikon';

/** Gaya dan ikon per nada. */
const NADA = {
  sukses: { kelas: 'border-ok bg-ok-soft text-ok', ikon: 'sukses' },
  bahaya: { kelas: 'border-bad bg-bad-soft text-bad', ikon: 'peringatan' },
  info: { kelas: 'border-info bg-info-soft text-info', ikon: 'info' },
};

/**
 * Pesan singkat yang hilang sendiri. Wadah aria-live selalu ada di DOM agar pesan baru dibacakan pembaca layar.
 * `pesan` kosong = tidak tampil; `onTutup` dipanggil saat waktunya habis atau tombol tutup ditekan.
 */
export default function Toast({ pesan, nada = 'sukses', onTutup, durasiMs = 4000 }) {
  // fungsi penutup terbaru disimpan di ref agar render ulang induk tidak mengulang hitung mundur
  const penutup = useRef(onTutup);
  penutup.current = onTutup;

  // pesan baru: mulai hitung mundur untuk menghilangkannya
  useEffect(() => {
    // tidak ada pesan: tidak ada yang perlu dihitung mundur
    if (!pesan) return undefined;
    const timer = setTimeout(() => penutup.current?.(), durasiMs);
    return () => clearTimeout(timer);
  }, [pesan, durasiMs]);

  const gaya = NADA[nada] ?? NADA.info;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {pesan && (
        <div className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-md border-2 py-2 pl-4 pr-2 font-semibold shadow-lg ${gaya.kelas}`}>
          <Ikon nama={gaya.ikon} />
          <span className="flex-1">{pesan}</span>
          <button type="button" onClick={onTutup} aria-label={t('umum.tutup')} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--r-btn)]">
            <Ikon nama="tutup" />
          </button>
        </div>
      )}
    </div>
  );
}
