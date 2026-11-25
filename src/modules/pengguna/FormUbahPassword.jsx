'use client';
import { useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import TextField from '@/modules/shared/ui/TextField';
import Button from '@/modules/shared/ui/Button';
import Toast from '@/modules/shared/ui/Toast';
import { ubahPasswordSendiri } from './pengguna.actions';

/** Isian kosong form ubah password. */
const KOSONG = { passwordLama: '', passwordBaru: '', konfirmasi: '' };

/** Form ubah password sendiri: password lama, password baru, dan konfirmasinya. */
export default function FormUbahPassword() {
  const [nilai, setNilai] = useState(KOSONG);
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [toast, setToast] = useState('');
  const [memuat, mulai] = useTransition();

  /** Mengubah satu kolom. */
  function ubah(nama, isi) {
    setNilai((n) => ({ ...n, [nama]: isi }));
  }

  /** Mengirim form; sukses mengosongkan isian. */
  function kirim(e) {
    e.preventDefault();
    setGalat({ umum: '', kolom: {} });
    mulai(async () => {
      const hasil = await ubahPasswordSendiri(nilai);
      // galat per kolom tampil di kolomnya; galat lain di atas tombol
      if (!hasil.ok) return setGalat({ umum: hasil.detail ? '' : hasil.error, kolom: petaGalat(hasil.detail) });
      setNilai(KOSONG);
      setToast(t('akun.berhasil'));
    });
  }

  return (
    <form onSubmit={kirim} className="space-y-4" noValidate>
      <TextField label={t('akun.passwordLama')} type="password" autoComplete="current-password" value={nilai.passwordLama} onChange={(e) => ubah('passwordLama', e.target.value)} galat={galat.kolom.passwordLama} />
      <TextField label={t('akun.passwordBaru')} type="password" autoComplete="new-password" petunjuk={t('pengguna.passwordPetunjuk')} value={nilai.passwordBaru} onChange={(e) => ubah('passwordBaru', e.target.value)} galat={galat.kolom.passwordBaru} />
      <TextField label={t('akun.konfirmasi')} type="password" autoComplete="new-password" value={nilai.konfirmasi} onChange={(e) => ubah('konfirmasi', e.target.value)} galat={galat.kolom.konfirmasi} />
      {galat.umum && (
        <p role="alert" className="font-semibold text-bad">
          {galat.umum}
        </p>
      )}
      <Button type="submit" memuat={memuat}>
        {t('akun.simpanPassword')}
      </Button>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </form>
  );
}
