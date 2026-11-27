'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { formatWaktu } from '@/utils/format';
import { MAKS_RINGKASAN_POST_TEST } from '@/enums';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import TextArea from '@/modules/shared/ui/TextArea';
import Toast from '@/modules/shared/ui/Toast';
import { simpanRingkasanPostTest } from './posttest.actions';

/**
 * Kartu "Ringkasan penilaian siswa" di bagian bawah detail post test: teks bebas dari tutor tentang siswa selama
 * level itu. Boleh disimpan sebelum maupun sesudah Finalisasi; tampil di rapor orang tua setelah post test difinalisasi.
 * `ringkasan`: { teks, nama, at } (nama dan waktu pengubah terakhir, kosong bila belum pernah diisi).
 */
export default function FormRingkasan({ ptId, ringkasan }) {
  const router = useRouter();
  const [teks, setTeks] = useState(ringkasan.teks ?? '');
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState('');
  const [memuat, mulai] = useTransition();

  /** Menyimpan ringkasan; galat server (mis. terlalu panjang) tampil di bawah kolom. */
  function simpan(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await simpanRingkasanPostTest({ id: ptId, ringkasan: teks });
      if (!r.ok) return setGalat(r.error);
      setGalat('');
      setToast(t('posttest.ringkasanTersimpan'));
      router.refresh();
    });
  }

  return (
    <Card as="section" className="space-y-3" aria-label={t('posttest.ringkasanJudul')}>
      <h2 className="text-[1.2em] font-bold">{t('posttest.ringkasanJudul')}</h2>
      <p className="text-muted">{t('posttest.ringkasanPetunjuk')}</p>
      <form onSubmit={simpan} className="space-y-3" noValidate>
        <TextArea label={t('posttest.ringkasanLabel')} rows={6} value={teks} onChange={(e) => setTeks(e.target.value)} maxLength={MAKS_RINGKASAN_POST_TEST} galat={galat || null} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* penghitung karakter; berubah merah saat mencapai batas */}
          <p role="status" className={`text-[0.9em] ${teks.length >= MAKS_RINGKASAN_POST_TEST ? 'font-semibold text-bad' : 'text-muted'}`}>
            {t('posttest.ringkasanHitung', { jumlah: teks.length, maks: MAKS_RINGKASAN_POST_TEST })}
          </p>
          <Button type="submit" ikon="simpan" memuat={memuat}>
            {t('posttest.ringkasanSimpan')}
          </Button>
        </div>
      </form>
      {/* pengubah terakhir hanya ada bila ringkasan pernah disimpan */}
      <p className="text-[0.9em] text-muted">{ringkasan.at ? t('posttest.ringkasanTerakhir', { nama: ringkasan.nama ?? '-', tanggal: formatWaktu(ringkasan.at) }) : t('posttest.ringkasanBelumAda')}</p>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </Card>
  );
}
