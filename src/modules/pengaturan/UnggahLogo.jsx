'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { MAKS_UKURAN_LOGO, MIME_LOGO } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import Toast from '@/modules/shared/ui/Toast';
import { LATAR_KOTAK } from './UnggahTandaTangan';
import { kembalikanLogo } from './pengaturan.actions';

/**
 * Satu slot logo di Pengaturan: pratinjau (latar kotak-kotak agar transparansi terlihat di tema terang dan gelap), keterangan
 * fungsi, tombol Unggah/Ganti lewat POST /api/v1/pengaturan/logo (kolom `slot`), dan Kembalikan ke bawaan (ConfirmDialog).
 * `slot`: utama, ikon, persegiTeks, atau sertifikat; `url`: logo yang sedang dipakai slot itu; `urlGelap`: versi tema gelapnya (null bila tidak ada); `terunggah`: slot memakai unggahan admin;
 * `tanpaWebp`: slot hanya menerima PNG atau JPEG (logo sertifikat dibaca pdfkit).
 */
export default function UnggahLogo({ slot, url, urlGelap = null, terunggah, tanpaWebp = false }) {
  const router = useRouter();
  const input = useRef(null);
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, setMemuat] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [mengembalikan, mulaiKembali] = useTransition();
  // tipe yang boleh dipilih di dialog berkas: sertifikat tanpa WebP
  const tipeBoleh = Object.keys(MIME_LOGO).filter((tipe) => !(tanpaWebp && tipe === 'image/webp'));
  const judul = t(`pengaturan.logoSlot.${slot}.judul`);

  /** Memeriksa berkas di browser dulu (pesan cepat), lalu mengirimnya ke server yang memeriksa ulang isinya. */
  async function pilih(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    // dialog pilih berkas dibatalkan
    if (!berkas) return;
    // tipe dan ukuran dicek di sini hanya untuk kenyamanan; server tetap memeriksa isi berkas
    if (!tipeBoleh.includes(berkas.type)) return setGalat(t(tanpaWebp ? 'pengaturan.logoSertifikatTipeSalah' : 'pengaturan.logoTipeSalah'));
    if (berkas.size > MAKS_UKURAN_LOGO) return setGalat(t('pengaturan.logoTerlaluBesar'));
    setGalat('');
    setMemuat(true);
    try {
      const form = new FormData();
      form.append('slot', slot);
      form.append('logo', berkas);
      const res = await fetch('/api/v1/pengaturan/logo', { method: 'POST', body: form, credentials: 'same-origin' });
      const json = await res.json().catch(() => ({ success: false, message: t('umum.galatServer') }));
      // ditolak server (tipe/ukuran/akses): tampilkan alasannya
      if (!json.success) return setGalat(json.message);
      setToast({ pesan: t('pengaturan.logoTersimpan'), nada: 'sukses' });
      router.refresh();
    } catch {
      // jaringan putus saat mengunggah
      setGalat(t('umum.galatJaringan'));
    } finally {
      setMemuat(false);
    }
  }

  /** Mengembalikan slot ke logo bawaan setelah dikonfirmasi. */
  function jalankanKembali() {
    mulaiKembali(async () => {
      const r = await kembalikanLogo({ slot });
      setKonfirmasi(false);
      // gagal (mis. bukan admin atau sudah kosong): tampilkan alasannya
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan: t('pengaturan.logoDikembalikan'), nada: 'sukses' });
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-44">
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-line" style={LATAR_KOTAK}>
          {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau dari route berkas atau berkas bawaan statis */}
          <img src={url} alt={t('pengaturan.logoSaatIniSlot', { slot: judul })} className="max-h-20 max-w-full object-contain" />
        </div>
        {/* pratinjau tema gelap di atas warna panel gelap aplikasi: logo bawaan dan unggahan PNG/WebP punya versi gelap otomatis */}
        {urlGelap && (
          <div className="flex h-24 items-center justify-center rounded-md border border-line bg-nav-bg">
            {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau dari route berkas atau berkas bawaan statis */}
            <img src={urlGelap} alt={t('pengaturan.logoGelapAlt', { slot: judul })} className="max-h-20 max-w-full object-contain" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-[1.05em] font-bold">{judul}</h3>
        <p className="text-muted">{t(`pengaturan.logoSlot.${slot}.fungsi`)}</p>
        <p className="text-[0.9em] text-muted">{t(tanpaWebp ? 'pengaturan.logoFormatSertifikat' : 'pengaturan.logoFormatUmum')}</p>
        <p className="text-[0.9em] font-semibold">{terunggah ? t('pengaturan.logoDiunggah') : t(tanpaWebp ? 'pengaturan.logoBawaanSertifikat' : 'pengaturan.logoBawaanDipakai')}</p>
        {galat && (
          <p role="alert" className="flex items-start gap-1.5 font-semibold text-bad">
            <Ikon nama="peringatan" className="mt-0.5" />
            <span>{galat}</span>
          </p>
        )}
      </div>
      <input ref={input} type="file" accept={tipeBoleh.join(',')} className="sr-only" onChange={pilih} tabIndex={-1} aria-hidden="true" />
      <div className="flex flex-wrap gap-2 sm:flex-col">
        <Button varian="secondary" ikon="unggah" memuat={memuat} onClick={() => input.current?.click()}>
          {terunggah ? t('pengaturan.gantiLogo') : t('pengaturan.unggahLogoSlot')}
        </Button>
        {terunggah && (
          <Button varian="hantu" ikon="kembalikan" onClick={() => setKonfirmasi(true)}>
            {t('pengaturan.kembalikanLogo')}
          </Button>
        )}
      </div>
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t('pengaturan.kembalikanLogoJudul')}
        pesan={t('pengaturan.kembalikanLogoPesan')}
        labelYa={t('pengaturan.kembalikanLogo')}
        nada="bahaya"
        memuat={mengembalikan}
        onYa={jalankanKembali}
        onBatal={() => setKonfirmasi(false)}
      />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </Card>
  );
}
