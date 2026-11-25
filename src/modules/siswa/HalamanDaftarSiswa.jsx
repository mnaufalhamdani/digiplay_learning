import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import { DAFTAR_STATUS_SISWA } from '@/enums';
import EmptyState from '@/modules/shared/ui/EmptyState';
import FormFilter from '@/modules/shared/ui/FormFilter';
import Paginasi from '@/modules/shared/ui/Paginasi';
import Select from '@/modules/shared/ui/Select';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import TextField from '@/modules/shared/ui/TextField';
import LencanaSiswa from './LencanaSiswa';
import TambahSiswa from './TambahSiswa';

/** Halaman daftar siswa (admin dan tutor): pencarian nama, filter status dan level, paginasi, dan tambah siswa. */
export default async function HalamanDaftarSiswa({ searchParams }) {
  await wajibPengguna();
  const dep = ambilDep();
  const [data, level, info] = await Promise.all([dep.siswaController.daftar(await searchParams), dep.siswaController.pilihanLevel(), infoPermintaan()]);
  const { filter } = data;
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const opsiLevel = level.map((l) => ({ nilai: l.id, label: `${l.kode} · ${l.nama}` }));
  const semua = { nilai: '', label: t('umum.semua') };
  const kolom = [
    { label: t('dataSiswa.nama'), isi: (s) => <Link href={href(`/data-siswa/${s.id}`)} className="font-semibold text-primary-text underline">{s.nama}</Link> },
    { label: t('dataSiswa.levelBerjalan'), isi: (s) => (s.level_nama ? `${s.level_kode} · ${s.level_nama}` : <span className="text-muted">{t('dataSiswa.tanpaLevel')}</span>) },
    { label: t('dataSiswa.statusLabel'), isi: (s) => <LencanaSiswa status={s.status} /> },
    { label: t('dataSiswa.tanggalDaftar'), isi: (s) => formatTanggal(s.tanggal_daftar) },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5em] font-bold">{t('dataSiswa.judul')}</h1>
        <TambahSiswa opsiLevel={opsiLevel} />
      </div>
      <FormFilter hrefReset={href('/data-siswa')}>
        <TextField label={t('dataSiswa.cariNama')} name="q" defaultValue={filter.q} />
        <Select label={t('dataSiswa.statusLabel')} name="status" defaultValue={filter.status ?? ''} opsi={[semua, ...DAFTAR_STATUS_SISWA.map((s) => ({ nilai: s, label: t(`dataSiswa.status.${s}`) }))]} />
        <Select label={t('dataSiswa.levelBerjalan')} name="levelId" defaultValue={filter.levelId ?? ''} opsi={[semua, ...opsiLevel]} />
      </FormFilter>
      {/* belum ada siswa atau hasil filter kosong */}
      {data.baris.length === 0 ? <EmptyState judul={t('dataSiswa.kosong')} ikon="siswa" /> : <TabelResponsif kolom={kolom} baris={data.baris} />}
      <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={(n) => href(jalurQuery('/data-siswa', { ...filter, halaman: n }))} />
    </div>
  );
}
