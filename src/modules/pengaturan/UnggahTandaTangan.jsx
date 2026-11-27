'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { MAKS_UKURAN_TANDA_TANGAN } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import Toast from '@/modules/shared/ui/Toast';
import { hapusTandaTangan } from './pengaturan.actions';

/** Latar kotak-kotak abu-abu muda (warna tetap, tidak ikut tema) agar transparansi PNG terlihat di tema terang dan gelap. */
export const LATAR_KOTAK = {
  backgroundColor: '#ffffff',
  backgroundImage: 'conic-gradient(#d9d9d9 25%, #ffffff 0 50%, #d9d9d9 0 75%, #ffffff 0)',
  backgroundSize: '16px 16px',
};

/**
 * Unggah, ganti, dan hapus gambar tanda tangan sertifikat (PNG transparan, maksimal 500 KB) lewat
 * POST /api/v1/pengaturan/tanda-tangan. `tandaTanganUrl` = route pratinjau pengelola (null bila belum ada).
 */
export default function UnggahTandaTangan({ tandaTanganUrl }) {
  const router = useRouter();
  const input = useRef(null);
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, setMemuat] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [menghapus, mulaiHapus] = useTransition();

  /** Memeriksa berkas di browser dulu (pesan cepat), lalu mengirimnya ke server yang memeriksa ulang isinya. */
  async function pilih(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    // dialog pilih berkas dibatalkan
    if (!berkas) return;
    // tipe dan ukuran dicek di sini hanya untuk kenyamanan; server tetap memeriksa isi berkas
    if (berkas.type !== 'image/png') return setGalat(t('pengaturan.tandaTanganTipeSalah'));
    if (berkas.size > MAKS_UKURAN_TANDA_TANGAN) return setGalat(t('pengaturan.tandaTanganTerlaluBesar'));
    setGalat('');
    setMemuat(true);
    try {
      const form = new FormData();
      form.append('tandaTangan', berkas);
      const res = await fetch('/api/v1/pengaturan/tanda-tangan', { method: 'POST', body: form, credentials: 'same-origin' });
      const json = await res.json().catch(() => ({ success: false, message: t('umum.galatServer') }));
      // ditolak server (tipe/ukuran/akses): tampilkan alasannya
      if (!json.success) return setGalat(json.message);
      setToast({ pesan: t('pengaturan.tandaTanganTersimpan'), nada: 'sukses' });
      router.refresh();
    } catch {
      // jaringan putus saat mengunggah
      setGalat(t('umum.galatJaringan'));
    } finally {
      setMemuat(false);
    }
  }

  /** Menghapus tanda tangan setelah dikonfirmasi. */
  function jalankanHapus() {
    mulaiHapus(async () => {
      const r = await hapusTandaTangan();
      setKonfirmasi(false);
      // gagal (mis. bukan admin atau sudah terhapus): tampilkan alasannya
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan: t('pengaturan.tandaTanganTerhapus'), nada: 'sukses' });
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-md border border-dashed border-line sm:w-48" style={tandaTanganUrl ? LATAR_KOTAK : undefined}>
        {tandaTanganUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau dari route berkas khusus pengelola
          <img src={tandaTanganUrl} alt={t('pengaturan.tandaTanganSaatIni')} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-[0.9em] text-muted">{t('pengaturan.belumAdaTandaTangan')}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-[1.15em] font-bold">{t('pengaturan.tandaTangan')}</h2>
        <p className="text-muted">{t('pengaturan.tandaTanganPetunjuk')}</p>
        {galat && (
          <p role="alert" className="flex items-start gap-1.5 font-semibold text-bad">
            <Ikon nama="peringatan" className="mt-0.5" />
            <span>{galat}</span>
          </p>
        )}
      </div>
      <input ref={input} type="file" accept="image/png" className="sr-only" onChange={pilih} tabIndex={-1} aria-hidden="true" />
      <div className="flex flex-wrap gap-2 sm:flex-col">
        <Button varian="secondary" ikon="unggah" memuat={memuat} onClick={() => input.current?.click()}>
          {tandaTanganUrl ? t('pengaturan.gantiTandaTangan') : t('pengaturan.unggahTandaTangan')}
        </Button>
        {tandaTanganUrl && (
          <Button varian="hantu" ikon="hapus" onClick={() => setKonfirmasi(true)}>
            {t('pengaturan.hapusTandaTangan')}
          </Button>
        )}
      </div>
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t('pengaturan.hapusTandaTanganJudul')}
        pesan={t('pengaturan.hapusTandaTanganPesan')}
        labelYa={t('pengaturan.hapusTandaTangan')}
        nada="bahaya"
        memuat={menghapus}
        onYa={jalankanHapus}
        onBatal={() => setKonfirmasi(false)}
      />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </Card>
  );
}
