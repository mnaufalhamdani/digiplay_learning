'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Toast from '@/modules/shared/ui/Toast';
import { ikutMenangani, tutupSesi } from './sesi.actions';

/**
 * Tombol aksi sesi berlangsung untuk tutor: Ikut menangani (bila belum tercatat) dan Tutup sesi (ConfirmDialog).
 * Dipakai di kartu Sesi berlangsung dan di detail sesi.
 */
export default function AksiSesi({ sesiId, namaSiswa, sudahMenangani }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** Menjalankan satu action lalu memuat ulang data halaman. */
  function jalankan(action, pesan) {
    mulai(async () => {
      const r = await action({ sesiId });
      setKonfirmasi(false);
      // ditolak (mis. sesi sudah ditutup tutor lain): tampilkan alasannya
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan, nada: 'sukses' });
      router.refresh();
    });
  }
  return (
    <>
      {!sudahMenangani && (
        <Button varian="secondary" ikon="tambah_pengguna" memuat={memuat} onClick={() => jalankan(ikutMenangani, t('absensi.berhasilIkut'))}>
          {t('absensi.ikutMenangani')}
        </Button>
      )}
      <Button varian="bahaya" ikon="pulang" disabled={memuat} onClick={() => setKonfirmasi(true)}>
        {t('absensi.tutupSesi')}
      </Button>
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t('absensi.tutupSesiJudul')}
        pesan={t('absensi.tutupSesiPesan', { nama: namaSiswa })}
        labelYa={t('absensi.tutupSesi')}
        memuat={memuat}
        onYa={() => jalankan(tutupSesi, t('absensi.berhasilTutup'))}
        onBatal={() => setKonfirmasi(false)}
      />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </>
  );
}
