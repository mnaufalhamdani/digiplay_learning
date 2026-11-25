'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { uraiJson } from '@/utils/json';
import { BATAS_RUBRIK, RUBRIK_BAWAAN } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import TextField from '@/modules/shared/ui/TextField';
import Button from '@/modules/shared/ui/Button';
import Toast from '@/modules/shared/ui/Toast';
import { simpanPengaturan } from './pengaturan.actions';

/** Kelompok kolom pengaturan; `angka` = input bilangan bulat beserta satuannya. */
const KELOMPOK = [
  { judul: 'pengaturan.identitas', kolom: [{ kunci: 'nama_pelatihan' }, { kunci: 'nama_perusahaan' }] },
  {
    judul: 'pengaturan.sesi',
    kolom: [
      { kunci: 'batas_tidak_aktif_menit', angka: true, satuan: 'pengaturan.menit' },
      { kunci: 'jumlah_tugas_per_sesi', angka: true, satuan: 'pengaturan.tugas' },
    ],
  },
  {
    judul: 'pengaturan.postTest',
    kolom: [
      { kunci: 'nilai_lulus_total', angka: true },
      { kunci: 'nilai_lulus_bagian', angka: true },
      { kunci: 'kehadiran_min_post_test', angka: true, satuan: 'pengaturan.pertemuan' },
      { kunci: 'durasi_post_test_menit', angka: true, satuan: 'pengaturan.menit' },
    ],
  },
  { judul: 'pengaturan.sertifikat', kolom: [{ kunci: 'penandatangan_nama' }, { kunci: 'penandatangan_jabatan' }] },
];

/** Semua kunci yang bisa diubah lewat form ini. */
const KUNCI_FORM = KELOMPOK.flatMap((k) => k.kolom.map((c) => c.kunci));

/** Rubrik awal form dari teks JSON pengaturan; poin dijadikan teks agar bisa diedit di kolom. */
function rubrikAwal(teks) {
  const daftar = uraiJson(teks);
  // isi pengaturan rusak atau kosong: mulai dari rubrik bawaan aplikasi
  const sumber = Array.isArray(daftar) && daftar.length > 0 ? daftar : RUBRIK_BAWAAN;
  return sumber.map((r) => ({ kriteria: String(r.kriteria ?? ''), poin: String(r.poin ?? '') }));
}

/** Editor rubrik bawaan: daftar kriteria + poin, tambah/hapus baris, dan total poin berjalan. */
function EditorRubrik({ rubrik, onUbah, galat }) {
  const total = rubrik.reduce((n, r) => n + (Number(r.poin) || 0), 0);
  /** Mengubah satu kolom pada baris ke-i. */
  const ubahBaris = (i, kolom, nilai) => onUbah(rubrik.map((r, j) => (j === i ? { ...r, [kolom]: nilai } : r)));
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[1.15em] font-bold">{t('pengaturan.rubrik')}</h2>
        <p className="text-muted">{t('pengaturan.rubrikPetunjuk', { total: BATAS_RUBRIK.totalPoin })}</p>
      </div>
      {rubrik.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_4.5rem_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:gap-3">
          <TextField label={t('pengaturan.kriteria', { nomor: i + 1 })} value={r.kriteria} onChange={(e) => ubahBaris(i, 'kriteria', e.target.value)} galat={galat[`rubrik_bawaan.${i}.kriteria`]} />
          <TextField label={t('pengaturan.poin')} inputMode="numeric" value={r.poin} onChange={(e) => ubahBaris(i, 'poin', e.target.value)} galat={galat[`rubrik_bawaan.${i}.poin`]} />
          <Button
            varian="hantu"
            ikon="hapus"
            className="mt-7"
            aria-label={t('pengaturan.hapusKriteria', { nomor: i + 1 })}
            disabled={rubrik.length <= 1}
            onClick={() => onUbah(rubrik.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button varian="secondary" ikon="tambah" disabled={rubrik.length >= BATAS_RUBRIK.maksKriteria} onClick={() => onUbah([...rubrik, { kriteria: '', poin: '' }])}>
          {t('pengaturan.tambahKriteria')}
        </Button>
        {/* total berwarna merah bila belum tepat, supaya admin tahu sebelum menyimpan */}
        <p className={`font-bold ${total === BATAS_RUBRIK.totalPoin ? '' : 'text-bad'}`}>{t('pengaturan.totalPoin', { total, harus: BATAS_RUBRIK.totalPoin })}</p>
      </div>
      {galat.rubrik_bawaan && (
        <p role="alert" className="font-semibold text-bad">
          {galat.rubrik_bawaan}
        </p>
      )}
    </Card>
  );
}

/** Form pengaturan admin. panjang_kode_akses hanya ditampilkan (tidak bisa diubah). */
export default function FormPengaturan({ awal }) {
  const router = useRouter();
  const [nilai, setNilai] = useState(() => Object.fromEntries(KUNCI_FORM.map((k) => [k, awal[k] ?? ''])));
  const [rubrik, setRubrik] = useState(() => rubrikAwal(awal.rubrik_bawaan));
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [toast, setToast] = useState('');
  const [memuat, mulai] = useTransition();

  /** Mengirim seluruh kolom; sukses memuat ulang data (header ikut berubah). */
  function kirim(e) {
    e.preventDefault();
    setGalat({ umum: '', kolom: {} });
    mulai(async () => {
      const hasil = await simpanPengaturan({ ...nilai, rubrik_bawaan: rubrik });
      // galat validasi per kolom ditampilkan di kolomnya; galat lain di bawah form
      if (!hasil.ok) return setGalat({ umum: hasil.detail ? t('umum.periksaIsian') : hasil.error, kolom: petaGalat(hasil.detail) });
      setToast(t('pengaturan.tersimpan'));
      router.refresh();
    });
  }

  return (
    <form onSubmit={kirim} className="space-y-6" noValidate>
      {KELOMPOK.map((k) => (
        <Card key={k.judul} className="space-y-4">
          <h2 className="text-[1.15em] font-bold">{t(k.judul)}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {k.kolom.map((c) => (
              <TextField
                key={c.kunci}
                label={t(`pengaturan.kolom.${c.kunci}`)}
                petunjuk={t(`pengaturan.petunjuk.${c.kunci}`)}
                inputMode={c.angka ? 'numeric' : undefined}
                akhiran={c.satuan ? t(c.satuan) : null}
                value={nilai[c.kunci]}
                onChange={(e) => setNilai((n) => ({ ...n, [c.kunci]: e.target.value }))}
                galat={galat.kolom[c.kunci]}
              />
            ))}
          </div>
        </Card>
      ))}
      <EditorRubrik rubrik={rubrik} onUbah={setRubrik} galat={galat.kolom} />
      <Card className="space-y-1">
        <h2 className="text-[1.15em] font-bold">{t('pengaturan.kodeAkses')}</h2>
        <p>
          {t('pengaturan.kolom.panjang_kode_akses')}: <strong>{awal.panjang_kode_akses}</strong>
        </p>
        <p className="text-muted">{t('pengaturan.petunjuk.panjang_kode_akses')}</p>
      </Card>
      {galat.umum && (
        <p role="alert" className="font-semibold text-bad">
          {galat.umum}
        </p>
      )}
      <Button type="submit" ikon="sukses" memuat={memuat}>
        {t('umum.simpan')}
      </Button>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </form>
  );
}
