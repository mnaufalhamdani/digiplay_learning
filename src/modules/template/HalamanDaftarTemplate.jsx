import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import { PERAN } from '@/enums';
import EmptyState from '@/modules/shared/ui/EmptyState';
import FormFilter from '@/modules/shared/ui/FormFilter';
import Paginasi from '@/modules/shared/ui/Paginasi';
import Select from '@/modules/shared/ui/Select';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import TextField from '@/modules/shared/ui/TextField';
import LencanaTemplate from './LencanaTemplate';
import { opsiBagian, opsiLevel, opsiPenilaian, opsiPertemuan, opsiTipe } from './opsiTemplate';

/** Opsi "Semua" di awal setiap filter. */
const SEMUA = { nilai: '', label: t('umum.semua') };

/** Isian filter daftar template. */
function IsianFilter({ filter, pilihan }) {
  return (
    <>
      <TextField label={t('template.cari')} name="q" defaultValue={filter.q} placeholder={t('template.cariContoh')} />
      <Select label={t('template.level')} name="levelId" defaultValue={filter.levelId ?? ''} opsi={[SEMUA, ...opsiLevel(pilihan)]} />
      <Select label={t('template.pertemuan')} name="pertemuanId" defaultValue={filter.pertemuanId ?? ''} opsi={[SEMUA, ...opsiPertemuan(pilihan)]} />
      <Select label={t('template.bagian')} name="bagian" defaultValue={filter.bagian ?? ''} opsi={[SEMUA, { nilai: 'latihan', label: t('template.tanpaBagian') }, ...opsiBagian(pilihan)]} />
      <Select label={t('template.tipeLabel')} name="tipe" defaultValue={filter.tipe ?? ''} opsi={[SEMUA, ...opsiTipe()]} />
      <Select label={t('template.penilaian')} name="penilaian" defaultValue={filter.penilaian ?? ''} opsi={[SEMUA, ...opsiPenilaian()]} />
      <Select
        label={t('template.status')}
        name="aktif"
        defaultValue={filter.aktif ?? ''}
        opsi={[SEMUA, { nilai: '1', label: t('pengguna.aktif') }, { nilai: '0', label: t('pengguna.nonaktif') }]}
      />
    </>
  );
}

/** Letak template: level, pertemuan, dan bagian post test (bila ada). */
function Letak({ tpl }) {
  return (
    <span className="text-muted">
      {tpl.level_kode} · P{tpl.pertemuan_nomor}
      {tpl.bagian_kode ? ` · ${t('template.bagian')} ${tpl.bagian_kode}` : ''}
    </span>
  );
}

/** Halaman daftar template: filter, pencarian kode/teks, dan paginasi. Admin bisa menambah. */
export default async function HalamanDaftarTemplate({ searchParams }) {
  const sesi = await wajibPengguna();
  const dep = ambilDep();
  const [data, pilihan, info] = await Promise.all([dep.templateController.daftar(await searchParams), dep.templateController.pilihan(), infoPermintaan()]);
  const { filter } = data;
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const kolom = [
    { label: t('template.kode'), isi: (b) => <Link href={href(`/template/${b.id}`)} className="font-semibold text-primary-text underline">{b.kode}</Link> },
    { label: t('template.letak'), isi: (b) => <Letak tpl={b} /> },
    { label: t('template.jenis'), isi: (b) => <LencanaTemplate tpl={b} /> },
    { label: t('template.teks'), isi: (b) => <p className="line-clamp-2 max-w-md">{b.teks}</p> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5em] font-bold">{t('template.judul')}</h1>
        {sesi.peran === PERAN.ADMIN && (
          <TautanTombol href={href('/template/baru')} ikon="tambah">
            {t('template.tambah')}
          </TautanTombol>
        )}
      </div>
      <FormFilter hrefReset={href('/template')}>
        <IsianFilter filter={filter} pilihan={pilihan} />
      </FormFilter>
      {/* hasil filter kosong */}
      {data.baris.length === 0 ? <EmptyState judul={t('template.kosong')} ikon="template" /> : <TabelResponsif kolom={kolom} baris={data.baris} />}
      <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={(n) => href(jalurQuery('/template', { ...filter, halaman: n }))} />
    </div>
  );
}
