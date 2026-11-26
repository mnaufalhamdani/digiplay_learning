'use client';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';

/**
 * Kotak isian untuk blok Tanya: tampil di bawah panggung selama ada pertanyaan yang menunggu. Jawaban dikirim dengan
 * tombol Kirim atau Enter, lalu skrip yang bertanya dilanjutkan. Dipakai editor siswa dan pratinjau tutor (tutor
 * boleh menjawab di pratinjau). `pertanyaan` null berarti tidak ada yang bertanya dan kotak tidak tampil.
 */
export default function KotakTanya({ pertanyaan, onJawab }) {
  const [isi, setIsi] = useState('');
  const kolom = useRef(null);
  // pertanyaan baru muncul: kolom dikosongkan dan langsung difokus agar siswa bisa mengetik
  useEffect(() => {
    if (pertanyaan === null) return;
    setIsi('');
    kolom.current?.focus();
  }, [pertanyaan]);
  // tidak ada pertanyaan yang menunggu
  if (pertanyaan === null) return null;
  return (
    <form
      role="group"
      aria-label={t('studio.kotakTanya')}
      className="space-y-2 rounded-lg border-2 border-primary bg-primary-soft p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onJawab(isi);
      }}
    >
      <label htmlFor="jawaban-studio" className="block font-bold">
        {pertanyaan}
      </label>
      <div className="flex gap-2">
        <input ref={kolom} id="jawaban-studio" value={isi} maxLength={100} autoComplete="off" onChange={(e) => setIsi(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-[var(--r-btn)] border-2 border-line bg-panel px-3 text-fg focus:border-primary focus:outline-none" />
        <Button type="submit" ikon="kirim">
          {t('studio.kirimJawaban')}
        </Button>
      </div>
    </form>
  );
}
