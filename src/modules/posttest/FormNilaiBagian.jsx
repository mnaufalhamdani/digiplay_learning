'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import TextField from '@/modules/shared/ui/TextField';
import Toast from '@/modules/shared/ui/Toast';
import { simpanNilaiPostTest } from './posttest.actions';

/** Satu kolom nilai bagian praktik 0-100 (tutor menilai semua butir bagian itu dengan rubrik); bisa direvisi. */
export default function FormNilaiBagian({ ptId, bagianId, awal, nonaktif }) {
  const router = useRouter();
  const [nilai, setNilai] = useState(awal == null ? '' : String(awal));
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState('');
  const [memuat, mulai] = useTransition();
  /** Menyimpan nilai; bila semua bagian sudah bernilai, total dan kelulusan dihitung server. */
  function simpan(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await simpanNilaiPostTest({ id: ptId, bagianId, nilai });
      if (!r.ok) return setGalat(r.error);
      setGalat('');
      setToast(t(r.data.final ? 'posttest.nilaiFinal' : 'posttest.nilaiTersimpan'));
      router.refresh();
    });
  }
  return (
    <form onSubmit={simpan} className="flex flex-wrap items-end gap-2" noValidate>
      <TextField label={t('posttest.nilaiBagian')} inputMode="decimal" value={nilai} onChange={(e) => setNilai(e.target.value)} galat={galat} disabled={nonaktif} className="w-40" />
      <Button type="submit" ikon="sukses" memuat={memuat} disabled={nonaktif || nilai.trim() === ''}>
        {t('umum.simpan')}
      </Button>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </form>
  );
}
