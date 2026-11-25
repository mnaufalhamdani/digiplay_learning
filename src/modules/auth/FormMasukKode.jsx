'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import KolomKode from '@/modules/shared/ui/domain/KolomKode';
import { masukKode } from './auth.actions';

/** Form masuk dengan kode unik (satu form untuk siswa dan orang tua). */
export default function FormMasukKode({ panjang }) {
  const router = useRouter();
  const [kode, setKode] = useState('');
  const [galat, setGalat] = useState(null);
  const [memuat, mulai] = useTransition();

  /** Kotak berubah: simpan kode dan hapus galat lama. */
  function ubah(teks) {
    setKode(teks);
    setGalat(null);
  }

  /** Mengirim kode; sukses pindah ke beranda siswa atau halaman orang tua. */
  function kirim(e) {
    e.preventDefault();
    // kotak belum terisi semua: beri tahu tanpa memanggil server
    if (kode.length !== panjang) return setGalat(t('auth.kodeBelumLengkap', { panjang }));
    mulai(async () => {
      const hasil = await masukKode({ kode });
      // kode ditolak: pesan ramah dari server tampil di bawah kotak kode
      if (!hasil.ok) return setGalat(hasil.error);
      router.replace(hasil.data.href);
      router.refresh();
    });
  }

  return (
    <form onSubmit={kirim} className="w-full space-y-6" noValidate>
      <KolomKode label={t('auth.kodeLabel')} onUbah={ubah} panjang={panjang} galat={galat} disabled={memuat} />
      <Button type="submit" ukuran="lg" ikon="masuk" memuat={memuat} penuh>
        {t('auth.masuk')}
      </Button>
    </form>
  );
}
