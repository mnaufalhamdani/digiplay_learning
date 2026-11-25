'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { MAKS_UKURAN_LOGO, MIME_LOGO } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import Toast from '@/modules/shared/ui/Toast';

/** Unggah logo (PNG/JPEG/WebP, maksimal 1 MB) lewat endpoint POST /api/v1/pengaturan/logo. */
export default function UnggahLogo({ logoUrl }) {
  const router = useRouter();
  const input = useRef(null);
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState('');
  const [memuat, setMemuat] = useState(false);

  /** Memeriksa berkas di browser dulu (pesan cepat), lalu mengirimnya ke server yang memeriksa ulang isinya. */
  async function pilih(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    // dialog pilih berkas dibatalkan
    if (!berkas) return;
    // tipe dan ukuran dicek di sini hanya untuk kenyamanan; server tetap memeriksa isi berkas
    if (!MIME_LOGO[berkas.type]) return setGalat(t('pengaturan.logoTipeSalah'));
    if (berkas.size > MAKS_UKURAN_LOGO) return setGalat(t('pengaturan.logoTerlaluBesar'));
    setGalat('');
    setMemuat(true);
    try {
      const form = new FormData();
      form.append('logo', berkas);
      const res = await fetch('/api/v1/pengaturan/logo', { method: 'POST', body: form, credentials: 'same-origin' });
      const json = await res.json().catch(() => ({ success: false, message: t('umum.galatServer') }));
      // ditolak server (tipe/ukuran/akses): tampilkan alasannya
      if (!json.success) return setGalat(json.message);
      setToast(t('pengaturan.logoTersimpan'));
      router.refresh();
    } catch {
      // jaringan putus saat mengunggah
      setGalat(t('umum.galatJaringan'));
    } finally {
      setMemuat(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border border-dashed border-line bg-bg">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau logo dari route berkas
          <img src={logoUrl} alt={t('pengaturan.logoSaatIni')} className="max-h-16 max-w-28 object-contain" />
        ) : (
          <span className="text-[0.9em] text-muted">{t('pengaturan.belumAdaLogo')}</span>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <h2 className="text-[1.15em] font-bold">{t('pengaturan.logo')}</h2>
        <p className="text-muted">{t('pengaturan.logoPetunjuk')}</p>
        {galat && (
          <p role="alert" className="flex items-start gap-1.5 font-semibold text-bad">
            <Ikon nama="peringatan" className="mt-0.5" />
            <span>{galat}</span>
          </p>
        )}
      </div>
      <input ref={input} type="file" accept={Object.keys(MIME_LOGO).join(',')} className="sr-only" onChange={pilih} tabIndex={-1} aria-hidden="true" />
      <Button varian="secondary" ikon="unggah" memuat={memuat} onClick={() => input.current?.click()}>
        {t('pengaturan.unggahLogo')}
      </Button>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </Card>
  );
}
