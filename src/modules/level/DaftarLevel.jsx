'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import Toast from '@/modules/shared/ui/Toast';
import FormUbahLevel from './FormUbahLevel';

/** Peringatan (bukan penolakan) bila total bobot bagian bukan 100 atau total butir bukan 15. */
function PeringatanBagian({ ringkasan }) {
  // aturan terpenuhi: cukup tampilkan totalnya
  if (ringkasan.bobotSesuai && ringkasan.butirSesuai) {
    return <Badge nada="sukses">{t('level.totalSesuai', { bobot: ringkasan.totalBobot, butir: ringkasan.totalButir })}</Badge>;
  }
  return (
    <p role="status" className="flex items-start gap-2 rounded-md bg-warn-soft p-3 font-semibold text-warn">
      <Ikon nama="peringatan" className="mt-0.5" />
      <span>{t('level.totalTidakSesuai', { bobot: ringkasan.totalBobot, butir: ringkasan.totalButir })}</span>
    </p>
  );
}

/** Tabel 13 pertemuan satu level beserta jumlah template dan tautan ke daftar template. */
function TabelPertemuan({ pertemuan, bolehUbah, buka, basis }) {
  const kolom = [
    { label: t('level.nomor'), isi: (p) => <span className="font-bold">{p.nomor}</span>, kelas: 'w-16' },
    {
      label: t('level.kolom.judul'),
      isi: (p) => (
        <div className="space-y-1">
          <p className="font-semibold">{p.judul}</p>
          {p.jenis === 'post_test' && <Badge nada="primer">{t('level.postTest')}</Badge>}
          {p.tujuan && <p className="text-muted">{p.tujuan}</p>}
        </div>
      ),
    },
    {
      label: t('level.jumlahTemplate'),
      isi: (p) => (
        <Link href={gabungJalur(basis, jalurQuery('/template', { pertemuanId: p.id }))} className="font-semibold text-primary-text underline">
          {t('level.templateAktif', { aktif: p.jumlah_aktif, total: p.jumlah_template })}
        </Link>
      ),
    },
  ];
  // kolom aksi hanya untuk admin
  if (bolehUbah) kolom.push({ label: t('pengguna.aksi'), isi: (p) => <Button varian="secondary" ikon="ubah" onClick={() => buka('pertemuan', p)}>{t('umum.ubah')}</Button> });
  return <TabelResponsif kolom={kolom} baris={pertemuan} />;
}

/** Tabel bagian post test satu level. */
function TabelBagian({ bagian, bolehUbah, buka }) {
  const kolom = [
    { label: t('level.bagian'), isi: (b) => <span className="font-semibold">{b.kode}. {b.nama}</span> },
    { label: t('level.sumber'), isi: (b) => t(`level.sumberNilai.${b.sumber}`) },
    { label: t('level.kolom.bobot'), isi: (b) => `${b.bobot}%` },
    { label: t('level.kolom.jumlahSoal'), isi: (b) => b.jumlah_soal },
  ];
  // kolom aksi hanya untuk admin
  if (bolehUbah) kolom.push({ label: t('pengguna.aksi'), isi: (b) => <Button varian="secondary" ikon="ubah" onClick={() => buka('bagian', b)}>{t('umum.ubah')}</Button> });
  return <TabelResponsif kolom={kolom} baris={bagian} />;
}

/** Daftar level: kartu per level berisi pertemuan dan bagian post test. Tutor hanya melihat. */
export default function DaftarLevel({ struktur, bolehUbah }) {
  const router = useRouter();
  const { basis } = useArea();
  const [pilihan, setPilihan] = useState(null);
  const [toast, setToast] = useState('');
  /** Membuka form ubah untuk satu data. */
  function buka(jenis, data) {
    setPilihan({ jenis, data });
  }
  /** Menutup form; pesan terisi berarti tersimpan sehingga data dimuat ulang. */
  function selesai(pesan = '') {
    setPilihan(null);
    // ditutup tanpa menyimpan: tidak perlu memuat ulang
    if (!pesan) return;
    setToast(pesan);
    router.refresh();
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.5em] font-bold">{t('level.judul')}</h1>
        {!bolehUbah && <p className="text-muted">{t('level.hanyaLihat')}</p>}
      </div>
      {struktur.map((lv) => (
        <Card key={lv.id} className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[1.25em] font-bold">
                {lv.nama} <span className="text-muted">({lv.kode})</span>
              </h2>
              {lv.deskripsi && <p className="text-muted">{lv.deskripsi}</p>}
            </div>
            {bolehUbah && (
              <Button varian="secondary" ikon="ubah" onClick={() => buka('level', lv)}>
                {t('level.ubahLevel')}
              </Button>
            )}
          </div>
          <section className="space-y-3">
            <h3 className="font-bold">{t('level.pertemuan')}</h3>
            <TabelPertemuan pertemuan={lv.pertemuan} bolehUbah={bolehUbah} buka={buka} basis={basis} />
          </section>
          <section className="space-y-3">
            <h3 className="font-bold">{t('level.bagianPostTest')}</h3>
            <PeringatanBagian ringkasan={lv.ringkasan} />
            <TabelBagian bagian={lv.bagian} bolehUbah={bolehUbah} buka={buka} />
          </section>
        </Card>
      ))}
      <FormUbahLevel pilihan={pilihan} selesai={selesai} />
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </div>
  );
}
