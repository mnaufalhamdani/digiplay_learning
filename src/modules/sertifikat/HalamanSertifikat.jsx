import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { formatNilai, formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import { DAFTAR_STATUS_SERTIFIKAT } from '@/enums';
import EmptyState from '@/modules/shared/ui/EmptyState';
import FormFilter from '@/modules/shared/ui/FormFilter';
import Paginasi from '@/modules/shared/ui/Paginasi';
import Select from '@/modules/shared/ui/Select';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import TextField from '@/modules/shared/ui/TextField';
import AksiSertifikat from './AksiSertifikat';
import LencanaSertifikat from './LencanaSertifikat';

/** Halaman daftar sertifikat (admin dan tutor): filter status/level, cari nama atau nomor, paginasi, dan aksi per baris. */
export default async function HalamanSertifikat({ searchParams }) {
  await wajibPengguna();
  const dep = ambilDep();
  const [data, level, info] = await Promise.all([dep.sertifikatController.daftar(await searchParams), dep.siswaController.pilihanLevel(), infoPermintaan()]);
  const { filter } = data;
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const semua = { nilai: '', label: t('umum.semua') };
  const kolom = [
    { label: t('sertifikat.nomor'), isi: (s) => <span className="whitespace-nowrap font-mono font-semibold">{s.nomor}</span> },
    { label: t('sertifikat.siswa'), isi: (s) => <Link href={href(`/data-siswa/${s.siswa_id}`)} className="font-semibold text-primary-text underline">{s.nama_siswa}</Link> },
    { label: t('sertifikat.level'), isi: (s) => s.nama_level },
    { label: t('sertifikat.nilai'), isi: (s) => formatNilai(s.nilai_total) },
    { label: t('sertifikat.tanggalTerbit'), isi: (s) => formatTanggal(s.diterbitkan_at) },
    { label: t('sertifikat.statusLabel'), isi: (s) => <LencanaSertifikat status={s.status} /> },
    { label: t('pengguna.aksi'), isi: (s) => <AksiSertifikat s={s} /> },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-[1.5em] font-bold">{t('sertifikat.judul')}</h1>
      <FormFilter hrefReset={href('/sertifikat')}>
        <TextField label={t('sertifikat.cari')} name="q" defaultValue={filter.q} />
        <Select label={t('sertifikat.statusLabel')} name="status" defaultValue={filter.status ?? ''} opsi={[semua, ...DAFTAR_STATUS_SERTIFIKAT.map((s) => ({ nilai: s, label: t(`sertifikat.status.${s}`) }))]} />
        <Select label={t('sertifikat.level')} name="levelId" defaultValue={filter.levelId ?? ''} opsi={[semua, ...level.map((l) => ({ nilai: l.id, label: `${l.kode} · ${l.nama}` }))]} />
      </FormFilter>
      {/* belum ada sertifikat atau hasil filter kosong */}
      {data.baris.length === 0 ? <EmptyState judul={t('sertifikat.kosong')} ikon="sertifikat" /> : <TabelResponsif kolom={kolom} baris={data.baris} />}
      <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={(n) => href(jalurQuery('/sertifikat', { ...filter, halaman: n }))} />
    </div>
  );
}
