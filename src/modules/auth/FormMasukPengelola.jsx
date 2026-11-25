'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import Button from '@/modules/shared/ui/Button';
import TextField from '@/modules/shared/ui/TextField';
import Ikon from '@/modules/shared/ui/Ikon';
import { masukPengelola } from './auth.actions';

/** Form masuk admin/tutor dengan email dan password. */
export default function FormMasukPengelola() {
  const router = useRouter();
  const [nilai, setNilai] = useState({ email: '', password: '' });
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [memuat, mulai] = useTransition();

  /** Mengubah satu kolom. */
  function ubah(nama, isi) {
    setNilai((n) => ({ ...n, [nama]: isi }));
  }

  /** Mengirim form; sukses ke beranda backoffice. */
  function kirim(e) {
    e.preventDefault();
    setGalat({ umum: '', kolom: {} });
    mulai(async () => {
      const hasil = await masukPengelola(nilai);
      // galat per kolom (kosong) ditampilkan di kolomnya; galat lain (salah, batas) di atas tombol
      if (!hasil.ok) return setGalat({ umum: hasil.detail ? '' : hasil.error, kolom: petaGalat(hasil.detail) });
      router.replace(hasil.data.href);
      router.refresh();
    });
  }

  return (
    <form onSubmit={kirim} className="space-y-4" noValidate>
      <TextField label={t('auth.email')} type="email" autoComplete="username" value={nilai.email} onChange={(e) => ubah('email', e.target.value)} galat={galat.kolom.email} required />
      <TextField label={t('auth.password')} type="password" autoComplete="current-password" value={nilai.password} onChange={(e) => ubah('password', e.target.value)} galat={galat.kolom.password} required />
      {galat.umum && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-bad-soft px-3 py-2 font-semibold text-bad">
          <Ikon nama="peringatan" className="mt-0.5" />
          <span>{galat.umum}</span>
        </p>
      )}
      <Button type="submit" ikon="masuk" memuat={memuat} penuh>
        {t('auth.masuk')}
      </Button>
    </form>
  );
}
