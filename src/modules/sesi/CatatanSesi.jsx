'use client';
import { useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import { formatWaktu } from '@/utils/format';
import Button from '@/modules/shared/ui/Button';
import TextArea from '@/modules/shared/ui/TextArea';
import Toast from '@/modules/shared/ui/Toast';
import { simpanCatatan } from './sesi.actions';

/**
 * Catatan sesi (C4.2): tutor yang sedang login mengubah catatannya sendiri (bila sudah tercatat di sesi);
 * catatan tutor lain tampil dengan nama penulisnya.
 */
export default function CatatanSesi({ sesiId, tutor, idSaya }) {
  const milikSaya = tutor.find((x) => x.id === idSaya);
  const [catatan, setCatatan] = useState(milikSaya?.catatan ?? '');
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** Menyimpan catatan tutor ini. */
  function simpan(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await simpanCatatan({ sesiId, catatan });
      setToast(r.ok ? { pesan: t('detailSesi.catatanTersimpan'), nada: 'sukses' } : { pesan: r.error, nada: 'bahaya' });
    });
  }
  const lain = tutor.filter((x) => x.id !== idSaya);
  return (
    <div className="space-y-4">
      {/* tutor yang belum ikut menangani tidak bisa menulis catatan */}
      {milikSaya ? (
        <form onSubmit={simpan} className="space-y-2">
          <TextArea label={t('detailSesi.catatanSaya')} rows={4} value={catatan} onChange={(e) => setCatatan(e.target.value)} petunjuk={t('detailSesi.catatanDibacaOrtu')} />
          <Button type="submit" ikon="catatan" memuat={memuat}>
            {t('detailSesi.simpanCatatan')}
          </Button>
        </form>
      ) : (
        <p className="text-muted">{t('detailSesi.belumMenangani')}</p>
      )}
      {lain.length > 0 && (
        <ul className="space-y-2">
          {lain.map((x) => (
            <li key={x.id} className="rounded-md border border-line bg-bg p-3">
              <p className="font-semibold">{x.nama}</p>
              <p className="whitespace-pre-wrap">{x.catatan || <span className="text-muted">{t('detailSesi.tanpaCatatan')}</span>}</p>
              {x.catatan && <p className="text-[0.85em] text-muted">{formatWaktu(x.updated_at)}</p>}
            </li>
          ))}
        </ul>
      )}
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </div>
  );
}
