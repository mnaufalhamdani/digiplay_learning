'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { PENILAIAN, STATUS_TUGAS } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import EmptyState from '@/modules/shared/ui/EmptyState';
import Ikon from '@/modules/shared/ui/Ikon';
import Toast from '@/modules/shared/ui/Toast';
import PratinjauKiriman from '@/modules/studio/PratinjauKiriman';
import { gantiTugasTutor, ubahStatusTugas } from './tugas.actions';

/** Nada lencana per status tugas. */
const NADA_STATUS = { belum: 'netral', selesai: 'sukses', dilewati: 'peringatan', diganti: 'netral' };

/** Hasil jawaban tugas otomatis: jawaban siswa, benar/salah, jumlah percobaan, dan jawaban yang diharapkan. */
function HasilOtomatis({ tugas }) {
  return (
    <dl className="grid gap-1 text-[0.95em] sm:grid-cols-3">
      <div>
        <dt className="text-muted">{t('detailSesi.jawabanSiswa')}</dt>
        <dd className="flex items-center gap-1.5 font-semibold">
          {tugas.jawabanTampil ?? '-'}
          {/* benar/salah selalu berupa ikon + teks */}
          {tugas.benar != null && (
            <Badge nada={tugas.benar ? 'sukses' : 'bahaya'}>
              <Ikon nama={tugas.benar ? 'sukses' : 'salah'} />
              {t(tugas.benar ? 'detailSesi.benar' : 'detailSesi.salah')}
            </Badge>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-muted">{t('detailSesi.percobaan')}</dt>
        <dd className="font-semibold">{tugas.percobaan}</dd>
      </div>
      <div>
        <dt className="text-muted">{t('detailSesi.jawabanHarapan')}</dt>
        <dd className="font-semibold">{tugas.jawabanHarapan ?? '-'}</dd>
      </div>
    </dl>
  );
}

/** Rubrik tugas dicek tutor (kunci.rubrik template, atau rubrik bawaan dari pengaturan). */
function Rubrik({ rubrik }) {
  // rubrik tidak tersedia sama sekali: tidak ada yang ditampilkan
  if (!Array.isArray(rubrik) || rubrik.length === 0) return null;
  return (
    <details>
      <summary className="cursor-pointer font-semibold">{t('detailSesi.rubrik')}</summary>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        {rubrik.map((r) => (
          <li key={r.kriteria}>
            {r.kriteria} ({r.poin})
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Tombol perubahan status oleh tutor; status yang sedang berlaku tidak ditampilkan. Ganti tugas hanya saat sesi berlangsung. */
function AksiTugas({ tugas, berlangsung, jalankan, memuat }) {
  const aksi = [
    { status: STATUS_TUGAS.SELESAI, ikon: 'sukses', label: tugas.penilaian === PENILAIAN.TUTOR ? 'detailSesi.tandaiSelesai' : 'detailSesi.jadikanSelesai' },
    { status: STATUS_TUGAS.DILEWATI, ikon: 'lewati', label: 'detailSesi.jadikanDilewati' },
    { status: STATUS_TUGAS.BELUM, ikon: 'kembalikan', label: 'detailSesi.jadikanBelum' },
  ].filter((a) => a.status !== tugas.status);
  return (
    <div className="flex flex-wrap gap-2">
      {aksi.map((a) => (
        <Button key={a.status} varian={a.status === STATUS_TUGAS.SELESAI ? 'sukses' : 'secondary'} ikon={a.ikon} disabled={memuat} onClick={() => jalankan(ubahStatusTugas, { tugasId: tugas.id, status: a.status }, 'detailSesi.statusDiubah')}>
          {t(a.label)}
        </Button>
      ))}
      {/* tugas yang sudah selesai tidak perlu diganti; setelah sesi ditutup penggantian tidak bermakna */}
      {berlangsung && tugas.status !== STATUS_TUGAS.SELESAI && (
        <Button varian="hantu" ikon="acak" disabled={memuat} onClick={() => jalankan(gantiTugasTutor, { tugasId: tugas.id }, 'detailSesi.tugasDiganti')}>
          {t('detailSesi.gantiTugas')}
        </Button>
      )}
    </div>
  );
}

/** Satu kartu tugas di detail sesi. Tugas yang diganti tampil ringkas tanpa aksi. */
function KartuTugasTutor({ tugas, nomor, ...props }) {
  const diganti = tugas.status === STATUS_TUGAS.DIGANTI;
  return (
    <Card as="article" className={`space-y-3 ${diganti ? 'opacity-70' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">{nomor}.</span>
        <span className="break-all text-muted">{tugas.template_kode}</span>
        <Badge nada="primer">{t(`template.tipe.${tugas.tipe}`)}</Badge>
        <Badge nada={tugas.penilaian === PENILAIAN.OTOMATIS ? 'info' : 'peringatan'}>{t(`template.penilaianLabel.${tugas.penilaian}`)}</Badge>
        <Badge nada={NADA_STATUS[tugas.status]}>{t(`detailSesi.statusTugas.${tugas.status}`)}</Badge>
        {tugas.menggantikan_id && <Badge nada="netral">{t('detailSesi.pengganti')}</Badge>}
      </div>
      <p className="whitespace-pre-wrap">{tugas.soal_teks}</p>
      {tugas.gambar.length > 0 && <p className="text-muted">{t('detailSesi.gambar', { daftar: tugas.gambar.map((g) => `${g.nama} (${g.jenis})`).join(', ') })}</p>}
      {tugas.penilaian === PENILAIAN.OTOMATIS && !diganti && <HasilOtomatis tugas={tugas} />}
      {tugas.penilaian === PENILAIAN.TUTOR && <Rubrik rubrik={tugas.rubrik} />}
      {/* proyek Studio Zippy yang dikirim siswa: pratinjau panggung hanya-baca, dijalankan tutor */}
      {tugas.tipe === 'coding_proyek' && !diganti && <PratinjauKiriman tugasId={tugas.id} />}
      {tugas.dinilai_nama && tugas.status === STATUS_TUGAS.SELESAI && <p className="text-[0.9em] text-muted">{t('detailSesi.ditandaiOleh', { nama: tugas.dinilai_nama })}</p>}
      {!diganti && <AksiTugas tugas={tugas} {...props} />}
    </Card>
  );
}

/** Daftar tugas sesi untuk tutor (C4.1): tandai selesai, ubah status, dan Ganti tugas; setiap perubahan dicatat ke log. */
export default function DaftarTugasTutor({ tugas, berlangsung }) {
  const router = useRouter();
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** Menjalankan satu action tugas lalu memuat ulang data. */
  function jalankan(action, input, kunciPesan) {
    mulai(async () => {
      const r = await action(input);
      // ditolak (mis. tidak ada template pengganti): tampilkan alasannya
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan: t(kunciPesan), nada: 'sukses' });
      router.refresh();
    });
  }
  // sesi tanpa tugas (pertemuan post test atau belum ada template)
  if (tugas.length === 0) return <EmptyState judul={t('detailSesi.tanpaTugas')} ikon="template" />;
  return (
    <div className="space-y-3">
      {tugas.map((x, i) => (
        <KartuTugasTutor key={x.id} tugas={x} nomor={i + 1} berlangsung={berlangsung} jalankan={jalankan} memuat={memuat} />
      ))}
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </div>
  );
}
