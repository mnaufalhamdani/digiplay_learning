'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import Toast from '@/modules/shared/ui/Toast';
import { pindaiUlangGambar, ubahAktifGambar } from './gambar.actions';

/** Menjalankan satu action, menampilkan hasilnya sebagai toast, lalu memuat ulang data bila berhasil. */
function useAksi() {
  const router = useRouter();
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** `pesanSukses(data)` membentuk teks toast dari hasil action. */
  function jalankan(action, pesanSukses) {
    mulai(async () => {
      const hasil = await action();
      // gagal (mis. bukan admin): tampilkan alasannya tanpa memuat ulang
      if (!hasil.ok) return setToast({ pesan: hasil.error, nada: 'bahaya' });
      setToast({ pesan: pesanSukses(hasil.data), nada: 'sukses' });
      router.refresh();
    });
  }
  const elemenToast = <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />;
  return { jalankan, memuat, elemenToast };
}

/** Tombol admin "Pindai ulang berkas": memperbarui penanda punya_* dari folder public/aset/gambar. */
export function TombolPindaiGambar() {
  const { jalankan, memuat, elemenToast } = useAksi();
  return (
    <>
      <Button varian="secondary" ikon="acak" memuat={memuat} onClick={() => jalankan(pindaiUlangGambar, (d) => t('gambar.hasilPindai', { diperiksa: d.diperiksa, diperbarui: d.diperbarui }))}>
        {t('gambar.pindaiUlang')}
      </Button>
      {elemenToast}
    </>
  );
}

/** Tombol admin aktifkan/nonaktifkan subjek gambar. */
export function TombolAktifGambar({ id, aktif }) {
  const { jalankan, memuat, elemenToast } = useAksi();
  return (
    <>
      <Button varian={aktif ? 'hantu' : 'secondary'} ikon={aktif ? 'nonaktifkan' : 'aktifkan'} memuat={memuat} onClick={() => jalankan(() => ubahAktifGambar({ id, aktif: !aktif }), () => t(aktif ? 'gambar.berhasilNonaktif' : 'gambar.berhasilAktif'))}>
        {t(aktif ? 'pengguna.nonaktifkan' : 'pengguna.aktifkan')}
      </Button>
      {elemenToast}
    </>
  );
}
