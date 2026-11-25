'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Toast from '@/modules/shared/ui/Toast';
import { gantiDevice, keluarSiswa } from '@/modules/auth/auth.actions';
import { pulang } from '@/modules/sesi/sesi.actions';

/** Isi dialog per aksi: action yang dijalankan, teks, dan suasana maskot. */
const AKSI = {
  ganti: { action: gantiDevice, judul: 'siswa.gantiDeviceJudul', pesan: 'siswa.gantiDevicePesan', ya: 'siswa.gantiDeviceYa', maskot: 'menunjuk' },
  keluar: { action: keluarSiswa, judul: 'siswa.keluarJudul', pesan: 'siswa.keluarPesan', ya: 'siswa.keluarYa', maskot: 'sapa' },
  pulang: { action: pulang, judul: 'sesiSiswa.pulangJudul', pesan: 'sesiSiswa.pulangPesan', ya: 'sesiSiswa.pulangYa', maskot: 'sapa' },
};

/**
 * Tombol di header siswa, masing-masing dengan ConfirmDialog: Ganti device selalu; saat sesi aktif tampil Pulang
 * (mengakhiri absensi), selain itu Keluar.
 */
export default function AksiSiswa({ sesiAktif = false }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(null); // 'ganti' | 'keluar' | 'pulang' | null
  const [galat, setGalat] = useState('');
  const [memuat, mulai] = useTransition();
  const aksi = dialog ? AKSI[dialog] : null;
  /** Menjalankan aksi yang dikonfirmasi lalu pindah ke halaman tujuan (masuk atau sampai jumpa). */
  function jalankan() {
    mulai(async () => {
      const hasil = await aksi.action();
      // gagal (jarang terjadi): tutup dialog dan tampilkan pesan
      if (!hasil.ok) {
        setDialog(null);
        setGalat(hasil.error);
        return;
      }
      router.replace(hasil.data.href);
      router.refresh();
    });
  }
  return (
    <>
      <Button varian="secondary" ikon="ganti_device" onClick={() => setDialog('ganti')}>
        {t('siswa.gantiDevice')}
      </Button>
      {/* saat sesi aktif, pulang yang mengakhiri absensi; keluar biasa hanya di luar sesi */}
      {sesiAktif ? (
        <Button varian="sukses" ikon="pulang" onClick={() => setDialog('pulang')}>
          {t('sesiSiswa.pulang')}
        </Button>
      ) : (
        <Button varian="hantu" ikon="keluar" onClick={() => setDialog('keluar')}>
          {t('siswa.keluar')}
        </Button>
      )}
      <ConfirmDialog
        terbuka={Boolean(aksi)}
        judul={aksi ? t(aksi.judul) : ''}
        pesan={aksi ? t(aksi.pesan) : ''}
        labelYa={aksi ? t(aksi.ya) : ''}
        labelBatal={t('siswa.tidakJadi')}
        maskot={aksi?.maskot}
        memuat={memuat}
        onYa={jalankan}
        onBatal={() => setDialog(null)}
      />
      <Toast pesan={galat} nada="bahaya" onTutup={() => setGalat('')} />
    </>
  );
}
