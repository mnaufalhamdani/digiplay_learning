'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { gabungJalur } from '@/utils/jalurArea';
import { NOMOR_POST_TEST, PENILAIAN } from '@/enums';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Select from '@/modules/shared/ui/Select';
import TextArea from '@/modules/shared/ui/TextArea';
import TextField from '@/modules/shared/ui/TextField';
import { tambahTemplate, ubahTemplate } from './template.actions';
import { opsiPenilaian, opsiPertemuan, opsiTipe } from './opsiTemplate';

/** JSON rapi untuk editor; null menjadi kolom kosong. */
function teksEditor(nilai) {
  return nilai == null ? '' : JSON.stringify(nilai, null, 2);
}

/** Nilai awal form: kosong untuk tambah, isi template untuk ubah. */
function nilaiAwal(awal, pilihan) {
  return {
    kode: awal?.kode ?? '',
    pertemuanId: awal?.pertemuan_id ?? pilihan.pertemuan[0]?.id ?? '',
    bagianId: awal?.bagian_id ?? '',
    tipe: awal?.tipe ?? 'pilihan_ganda',
    penilaian: awal?.penilaian ?? PENILAIAN.OTOMATIS,
    kesulitan: String(awal?.kesulitan ?? 1),
    teks: awal?.teks ?? '',
    parameter: teksEditor(awal?.parameter),
    opsi: teksEditor(awal?.opsi),
    kunci: teksEditor(awal?.kunci),
    aktif: awal?.aktif ?? true,
  };
}

/** Daftar galat validasi template (hasil render 50 kali) yang ditolak server. */
function DaftarGalat({ umum, daftar }) {
  // tidak ada galat umum maupun galat validasi template
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
            <li key={g}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Kolom letak template (hanya saat tambah): kode, pertemuan, bagian (khusus pertemuan 13), dan tipe. */
function KolomLetak({ nilai, ubah, galat, pilihan }) {
  const pertemuan = pilihan.pertemuan.find((p) => p.id === nilai.pertemuanId);
  const opsiBagian = pilihan.bagian.filter((b) => b.levelId === pertemuan?.levelId).map((b) => ({ nilai: b.id, label: `${b.kode} · ${b.nama}` }));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label={t('template.kode')} petunjuk={t('template.kodePetunjuk')} value={nilai.kode} onChange={(e) => ubah('kode', e.target.value)} galat={galat.kode} />
      <Select label={t('template.tipeLabel')} value={nilai.tipe} onChange={(e) => ubah('tipe', e.target.value)} opsi={opsiTipe()} galat={galat.tipe} />
      <Select label={t('template.pertemuan')} value={nilai.pertemuanId} onChange={(e) => ubah('pertemuanId', e.target.value)} opsi={opsiPertemuan(pilihan)} galat={galat.pertemuanId} />
      {/* bagian post test hanya relevan untuk pertemuan 13 */}
      {pertemuan?.nomor === NOMOR_POST_TEST && (
        <Select label={t('template.bagian')} value={nilai.bagianId} onChange={(e) => ubah('bagianId', e.target.value)} opsi={[{ nilai: '', label: t('template.pilihBagian') }, ...opsiBagian]} galat={galat.bagianId} />
      )}
    </div>
  );
}

/** Form tambah/ubah template (admin). Disimpan hanya bila validasi server lulus; galat ditampilkan sebagai daftar. */
export default function FormTemplate({ awal = null, pilihan }) {
  const router = useRouter();
  const { basis } = useArea();
  const mode = awal ? 'ubah' : 'tambah';
  const [nilai, setNilai] = useState(() => nilaiAwal(awal, pilihan));
  const [galat, setGalat] = useState({ umum: '', kolom: {}, template: [] });
  const [memuat, mulai] = useTransition();
  const pertemuanNomor = useMemo(() => pilihan.pertemuan.find((p) => p.id === nilai.pertemuanId)?.nomor, [pilihan, nilai.pertemuanId]);
  /** Mengubah satu kolom. */
  function ubah(nama, isi) {
    setNilai((n) => ({ ...n, [nama]: isi }));
  }
  /** Mengirim form; sukses menuju halaman detail template. */
  function kirim(e) {
    e.preventDefault();
    const data = { ...nilai, bagianId: pertemuanNomor === NOMOR_POST_TEST ? nilai.bagianId : '' };
    mulai(async () => {
      // mode ubah: kode, pertemuan, bagian, dan tipe ikut terkirim tetapi dibuang schema (tidak bisa diubah)
      const hasil = mode === 'ubah' ? await ubahTemplate({ id: awal.id, ...data }) : await tambahTemplate(data);
      if (!hasil.ok) {
        const detail = Array.isArray(hasil.detail) ? hasil.detail : [];
        // galat validasi template (kolom 'template') tampil sebagai daftar; galat kolom tampil di kolomnya
        setGalat({ umum: hasil.error, kolom: petaGalat(detail), template: detail.filter((d) => d.kolom === 'template').map((d) => d.pesan) });
        return window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      router.push(gabungJalur(basis, `/template/${hasil.data.id}`));
      router.refresh();
    });
  }
  return (
    <form onSubmit={kirim} className="space-y-4" noValidate>
      <DaftarGalat umum={galat.umum} daftar={galat.template} />
      <Card className="space-y-4">
        {mode === 'tambah' && <KolomLetak nilai={nilai} ubah={ubah} galat={galat.kolom} pilihan={pilihan} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('template.penilaian')} value={nilai.penilaian} onChange={(e) => ubah('penilaian', e.target.value)} opsi={opsiPenilaian()} galat={galat.kolom.penilaian} />
          <TextField label={t('template.kesulitan')} inputMode="numeric" petunjuk={t('template.kesulitanPetunjuk')} value={nilai.kesulitan} onChange={(e) => ubah('kesulitan', e.target.value)} galat={galat.kolom.kesulitan} />
        </div>
        <TextArea label={t('template.teks')} petunjuk={t('template.teksPetunjuk')} rows={4} value={nilai.teks} onChange={(e) => ubah('teks', e.target.value)} galat={galat.kolom.teks} />
        <TextArea label={t('template.parameter')} kode rows={6} petunjuk={t('template.parameterPetunjuk')} value={nilai.parameter} onChange={(e) => ubah('parameter', e.target.value)} galat={galat.kolom.parameter} />
        <TextArea label={t('template.opsi')} kode rows={4} petunjuk={t('template.opsiPetunjuk')} value={nilai.opsi} onChange={(e) => ubah('opsi', e.target.value)} galat={galat.kolom.opsi} />
        <TextArea label={t('template.kunci')} kode rows={5} petunjuk={t('template.kunciPetunjuk')} value={nilai.kunci} onChange={(e) => ubah('kunci', e.target.value)} galat={galat.kolom.kunci} />
        <label className="flex min-h-11 items-center gap-3 font-semibold">
          <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={nilai.aktif} onChange={(e) => ubah('aktif', e.target.checked)} />
          {t('template.aktifLabel')}
        </label>
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
