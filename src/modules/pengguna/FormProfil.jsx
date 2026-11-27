'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import TextField from '@/modules/shared/ui/TextField';
import Button from '@/modules/shared/ui/Button';
import Toast from '@/modules/shared/ui/Toast';
import { ubahProfilSendiri } from './pengguna.actions';
/** Form ubah profil sendiri: nama dan email, terisi dari data akun saat ini. */
export default function FormProfil({ awal }) {
  const router = useRouter();
  const [nilai, setNilai] = useState({ nama: awal.nama, email: awal.email });
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [toast, setToast] = useState('');
  const [memuat, mulai] = useTransition();
  /** Mengubah satu kolom. */
  function ubah(nama, isi) {
    setNilai((n) => ({ ...n, [nama]: isi }));
  }
  /** Mengirim form; sukses memuat ulang halaman agar profil singkat ikut berubah. */
  function kirim(e) {
    e.preventDefault();
    setGalat({ umum: '', kolom: {} });
    mulai(async () => {
      const hasil = await ubahProfilSendiri(nilai);
      // galat per kolom tampil di kolomnya; galat lain di atas tombol
      if (!hasil.ok) return setGalat({ umum: hasil.detail ? '' : hasil.error, kolom: petaGalat(hasil.detail) });
      setToast(t('akun.berhasilProfil'));
      router.refresh();
    });
  }
  return (
    <form onSubmit={kirim} className="space-y-4" noValidate>
      <TextField label={t('pengguna.nama')} autoComplete="name" value={nilai.nama} onChange={(e) => ubah('nama', e.target.value)} galat={galat.kolom.nama} />
      <TextField label={t('pengguna.email')} type="email" autoComplete="email" petunjuk={t('akun.emailPetunjuk')} value={nilai.email} onChange={(e) => ubah('email', e.target.value)} galat={galat.kolom.email} />
      {galat.umum && (
        <p role="alert" className="font-semibold text-bad">
          {galat.umum}
        </p>
      )}
      <Button type="submit" memuat={memuat}>
        {t('akun.simpanProfil')}
      </Button>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </form>
  );
}
