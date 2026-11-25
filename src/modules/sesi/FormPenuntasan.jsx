'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { DAFTAR_PENUNTASAN } from '@/enums';
import Button from '@/modules/shared/ui/Button';
import Toast from '@/modules/shared/ui/Toast';
import { LencanaPenuntasan } from './LencanaSesi';
import { ubahPenuntasan } from './sesi.actions';

/**
 * Penuntasan pertemuan (C4.3): pilihan terisi awal dari status akhir (pilihan tutor, atau hasil otomatis).
 * Simpan mengisi pilihan tutor; Kembali ke otomatis mengosongkannya. Sumber status akhir selalu ditampilkan.
 */
export default function FormPenuntasan({ sesiId, otomatis, tutor, akhir, sumber }) {
  const router = useRouter();
  const [pilihan, setPilihan] = useState(akhir ?? '');
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** Menyimpan pilihan (atau null = kembali ke otomatis). */
  function simpan(nilai, kunciPesan) {
    mulai(async () => {
      const r = await ubahPenuntasan({ sesiId, penuntasan: nilai });
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      // kembali ke otomatis: pilihan di form ikut kembali ke hasil otomatis
      if (nilai === null) setPilihan(otomatis ?? '');
      setToast({ pesan: t(kunciPesan), nada: 'sukses' });
      router.refresh();
    });
  }
  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-2">
        {t('detailSesi.statusAkhir')}: <LencanaPenuntasan nilai={akhir} sumber={sumber} />
      </p>
      <p className="text-muted">
        {t('detailSesi.hasilOtomatis')}: {otomatis ? t(`absensi.penuntasan.${otomatis}`) : '-'}
      </p>
      <fieldset className="space-y-1">
        <legend className="font-semibold">{t('detailSesi.pilihPenuntasan')}</legend>
        {DAFTAR_PENUNTASAN.map((p) => (
          <label key={p} className="flex min-h-11 items-center gap-3">
            <input type="radio" name={`penuntasan-${sesiId}`} className="size-5 accent-[var(--primary)]" checked={pilihan === p} onChange={() => setPilihan(p)} />
            {t(`absensi.penuntasan.${p}`)}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button ikon="sukses" memuat={memuat} disabled={!pilihan} onClick={() => simpan(pilihan, 'detailSesi.penuntasanTersimpan')}>
          {t('umum.simpan')}
        </Button>
        {/* tombol kembali ke otomatis hanya bermakna bila tutor pernah memilih */}
        {tutor && (
          <Button varian="secondary" ikon="kembalikan" disabled={memuat} onClick={() => simpan(null, 'detailSesi.kembaliOtomatisBerhasil')}>
            {t('detailSesi.kembaliOtomatis')}
          </Button>
        )}
      </div>
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </div>
  );
}
