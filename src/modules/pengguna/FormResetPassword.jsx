'use client';
import { useEffect, useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import Modal from '@/modules/shared/ui/Modal';
import TextField from '@/modules/shared/ui/TextField';
import Button from '@/modules/shared/ui/Button';
import { resetPasswordPengguna } from './pengguna.actions';

/** Modal admin mengatur ulang password akun lain. */
export default function FormResetPassword({ terbuka, akun, selesai }) {
  const [password, setPassword] = useState('');
  const [galat, setGalat] = useState('');
  const [memuat, mulai] = useTransition();

  // dibuka ulang: kosongkan isian dan galat
  useEffect(() => {
    // modal tertutup: tidak ada yang perlu dikosongkan
    if (!terbuka) return;
    setPassword('');
    setGalat('');
  }, [terbuka]);

  /** Mengirim password baru. */
  function kirim(e) {
    e.preventDefault();
    mulai(async () => {
      const hasil = await resetPasswordPengguna({ id: akun.id, password });
      // galat validasi password diutamakan; selain itu pesan umum
      if (!hasil.ok) return setGalat(petaGalat(hasil.detail).password ?? hasil.error);
      selesai(t('pengguna.berhasilReset'));
    });
  }

  return (
    <Modal terbuka={terbuka} judul={t('pengguna.resetJudul', { nama: akun?.nama ?? '' })} tutup={() => selesai()}>
      <form onSubmit={kirim} className="space-y-4" noValidate>
        <TextField label={t('pengguna.passwordBaru')} type="password" autoComplete="new-password" petunjuk={t('pengguna.passwordPetunjuk')} value={password} onChange={(e) => setPassword(e.target.value)} galat={galat} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={() => selesai()} disabled={memuat}>
            {t('umum.batal')}
          </Button>
          <Button type="submit" memuat={memuat}>
            {t('umum.simpan')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
