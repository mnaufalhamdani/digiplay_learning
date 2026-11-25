'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import { keluarOrtu } from '@/modules/auth/auth.actions';

/** Tombol Keluar di halaman orang tua (tanpa konfirmasi: tidak ada data yang hilang). */
export default function AksiOrtu() {
  const router = useRouter();
  const [memuat, mulai] = useTransition();

  /** Keluar lalu kembali ke halaman masuk. */
  function keluar() {
    mulai(async () => {
      const hasil = await keluarOrtu();
      // keluar hanya menghapus cookie; bila gagal tetap tidak ada yang perlu ditampilkan selain tetap di halaman
      if (!hasil.ok) return;
      router.replace(hasil.data.href);
      router.refresh();
    });
  }

  return (
    <Button varian="hantu" ikon="keluar" memuat={memuat} onClick={keluar}>
      {t('ortu.keluar')}
    </Button>
  );
}
