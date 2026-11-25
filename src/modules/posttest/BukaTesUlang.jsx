'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Toast from '@/modules/shared/ui/Toast';
import { bukaTesUlang } from './posttest.actions';

/**
 * Tombol Buka tes ulang (D2.7): pilih bagian yang diulang (bawaan: bagian di bawah nilai minimal; bila tidak ada,
 * semua bagian), lalu ConfirmDialog. Nilai bagian lain ikut terbawa ke percobaan baru.
 */
export default function BukaTesUlang({ ptId, bagian, bawaan }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [pilih, setPilih] = useState(bawaan);
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** Membuka tes ulang untuk bagian terpilih. */
  function jalankan() {
    mulai(async () => {
      const r = await bukaTesUlang({ id: ptId, bagianIds: pilih });
      setTerbuka(false);
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan: t('posttest.tesUlangDibuka'), nada: 'sukses' });
      router.refresh();
    });
  }
  return (
    <>
      <Button varian="secondary" ikon="acak" onClick={() => setTerbuka(true)}>
        {t('posttest.bukaTesUlang')}
      </Button>
      <ConfirmDialog terbuka={terbuka} judul={t('posttest.bukaTesUlangJudul')} pesan={t('posttest.bukaTesUlangPesan')} labelYa={t('posttest.bukaTesUlang')} memuat={memuat} yaNonaktif={pilih.length === 0} onYa={jalankan} onBatal={() => setTerbuka(false)}>
        <fieldset className="space-y-1">
          <legend className="font-semibold">{t('posttest.bagianDiulang')}</legend>
          {bagian.map((b) => (
            <label key={b.id} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={pilih.includes(b.id)} onChange={(e) => setPilih((p) => (e.target.checked ? [...p, b.id] : p.filter((x) => x !== b.id)))} />
              {b.kode}. {b.nama} ({b.nilai ?? '-'})
            </label>
          ))}
        </fieldset>
      </ConfirmDialog>
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </>
  );
}
