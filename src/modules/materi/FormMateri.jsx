'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TextArea from '@/modules/shared/ui/TextArea';
import TextField from '@/modules/shared/ui/TextField';
import { simpanMateri } from './materi.actions';

/** Kerangka isi untuk pertemuan yang belum punya materi: satu tujuan dan satu paragraf contoh. */
const KERANGKA_ISI = { tujuan: ['Kamu bisa ...'], bagian: [{ tipe: 'paragraf', judul: 'Judul bagian', teks: 'Isi paragraf.' }] };

/** Daftar galat validasi isi (tiap baris: letak di JSON dan pesannya) yang ditolak server. */
function DaftarGalat({ umum, daftar }) {
  // tidak ada galat umum maupun galat isi
  if (!umum && daftar.length === 0) return null;
  return (
    <div role="alert" className="space-y-2 rounded-md border-2 border-bad bg-bad-soft p-3 text-bad">
      <p className="flex items-center gap-2 font-bold">
        <Ikon nama="peringatan" />
        {umum}
      </p>
      {daftar.length > 0 && (
        <ul className="list-disc space-y-1 pl-6 font-semibold">
          {daftar.map((g) => (
            <li key={`${g.kolom}-${g.pesan}`}>
              <span className="font-mono text-[0.9em]">{g.kolom}</span>: {g.pesan}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Form ubah materi (admin): judul, isi sebagai JSON, dan status aktif. Disimpan hanya bila lolos validasi server. */
export default function FormMateri({ awal }) {
  const router = useRouter();
  const { basis } = useArea();
  const [judul, setJudul] = useState(awal.judul);
  const [isi, setIsi] = useState(() => JSON.stringify(awal.isi ?? KERANGKA_ISI, null, 2));
  const [aktif, setAktif] = useState(awal.aktif);
  const [galat, setGalat] = useState({ umum: '', judul: '', isi: [] });
  const [memuat, mulai] = useTransition();

  /** Mengirim form; sukses menuju pratinjau materi. */
  function kirim(e) {
    e.preventDefault();
    mulai(async () => {
      const hasil = await simpanMateri({ pertemuanId: awal.pertemuanId, judul, isi, aktif });
      if (!hasil.ok) {
        const detail = Array.isArray(hasil.detail) ? hasil.detail : [];
        // galat judul tampil di kolomnya; galat isi tampil sebagai daftar beserta letaknya di JSON
        setGalat({ umum: hasil.error, judul: detail.find((d) => d.kolom === 'judul')?.pesan ?? '', isi: detail.filter((d) => d.kolom.startsWith('isi')) });
        return window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      router.push(gabungJalur(basis, `/materi/${awal.pertemuanId}`));
      router.refresh();
    });
  }
  return (
    <form onSubmit={kirim} className="space-y-4" noValidate>
      <DaftarGalat umum={galat.umum} daftar={galat.isi} />
      <Card className="space-y-4">
        <TextField label={t('materi.formJudul')} value={judul} onChange={(e) => setJudul(e.target.value)} galat={galat.judul || null} />
        <TextArea label={t('materi.formIsi')} kode rows={28} petunjuk={t('materi.formIsiPetunjuk')} value={isi} onChange={(e) => setIsi(e.target.value)} />
        <label className="flex min-h-11 items-center gap-3 font-semibold">
          <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          {t('materi.aktifLabel')}
        </label>
        {/* perubahan di sini ditimpa lagi saat db:seed dijalankan */}
        <p className="flex items-start gap-2 rounded-md bg-warn-soft p-3 font-semibold text-warn">
          <Ikon nama="peringatan" className="mt-0.5" />
          <span>{t('materi.peringatanSeed')}</span>
        </p>
      </Card>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button varian="secondary" onClick={() => router.back()} disabled={memuat}>
          {t('umum.batal')}
        </Button>
        <Button type="submit" ikon="sukses" memuat={memuat}>
          {t('umum.simpan')}
        </Button>
      </div>
    </form>
  );
}
