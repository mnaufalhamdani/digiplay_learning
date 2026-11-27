import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { formatWaktu } from '@/utils/format';
import { t } from '@/utils/i18n';
import EmptyState from '@/modules/shared/ui/EmptyState';
import FormFilter from '@/modules/shared/ui/FormFilter';
import Paginasi from '@/modules/shared/ui/Paginasi';
import Select from '@/modules/shared/ui/Select';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import TextField from '@/modules/shared/ui/TextField';
import TabelLog from './TabelLog';

/** Label ramah untuk kode aksi; kode yang belum punya terjemahan ditampilkan apa adanya. */
function labelAksi(aksi) {
  const label = t(`log.aksiLabel.${aksi}`);
  // t() mengembalikan kuncinya sendiri bila terjemahan tidak ada
  return label.startsWith('log.aksiLabel.') ? aksi : label;
}

/** Isi kolom detail (JSON) yang bisa dibuka-tutup. Tidak dipakai lagi: tabel kini memakai TabelLog (detail tampil selebar tabel di bawah baris). */
function Detail({ detail }) {
  // aksi tanpa detail (mis. reset password)
  if (detail == null) return <span className="text-muted">-</span>;
  return (
    <details>
      <summary className="cursor-pointer font-semibold text-primary-text">{t('log.lihatDetail')}</summary>
      <pre className="mt-2 max-w-md overflow-x-auto rounded-md border border-line bg-bg p-2 font-mono text-[0.8em] whitespace-pre-wrap break-words">{JSON.stringify(detail, null, 2)}</pre>
    </details>
  );
}

/** Halaman Log (khusus admin): log_aktivitas terbaru dengan filter aksi, entitas, pengguna, tanggal, dan paginasi. */
export default async function HalamanLog({ searchParams }) {
  await wajibAdmin();
  const dep = ambilDep();
  const [data, pilihan, info] = await Promise.all([dep.logController.daftar(await searchParams), dep.logController.pilihanFilter(), infoPermintaan()]);
  const { filter } = data;
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const semua = { nilai: '', label: t('umum.semua') };
  // definisi kolom lama untuk TabelResponsif; tidak dipakai lagi karena tabel kini memakai TabelLog
  const kolom = [
    { label: t('log.waktu'), isi: (b) => <span className="whitespace-nowrap">{formatWaktu(b.created_at)}</span> },
    { label: t('log.pengguna'), isi: (b) => b.pengguna_nama ?? <span className="text-muted">{t('log.sistem')}</span> },
    { label: t('log.aksi'), isi: (b) => <span className="font-semibold">{labelAksi(b.aksi)}</span> },
    { label: t('log.entitas'), isi: (b) => <span className="break-all">{b.entitas}{b.entitas_id ? ` #${b.entitas_id}` : ''}</span> },
    { label: t('log.detail'), isi: (b) => <Detail detail={b.detail} /> },
  ];
  // TabelLog (client component) hanya menerima data murni, jadi label dan format waktu disiapkan di sini
  const barisTabel = data.baris.map((b) => ({ id: b.id, waktu: formatWaktu(b.created_at), pengguna_nama: b.pengguna_nama ?? null, aksi_label: labelAksi(b.aksi), entitas: b.entitas, entitas_id: b.entitas_id ?? null, detail: b.detail ?? null }));
  return (
    <div className="space-y-4">
      <h1 className="text-[1.5em] font-bold">{t('log.judul')}</h1>
      <FormFilter hrefReset={href('/log')}>
        <Select label={t('log.aksi')} name="aksi" defaultValue={filter.aksi ?? ''} opsi={[semua, ...pilihan.aksi.map((a) => ({ nilai: a, label: labelAksi(a) }))]} />
        <Select label={t('log.entitas')} name="entitas" defaultValue={filter.entitas ?? ''} opsi={[semua, ...pilihan.entitas.map((e) => ({ nilai: e, label: e }))]} />
        <Select label={t('log.pengguna')} name="penggunaId" defaultValue={filter.penggunaId ?? ''} opsi={[semua, ...pilihan.pengguna.map((p) => ({ nilai: p.id, label: p.nama }))]} />
        <TextField label={t('log.dari')} name="dari" type="date" defaultValue={filter.dari ?? ''} />
        <TextField label={t('log.sampai')} name="sampai" type="date" defaultValue={filter.sampai ?? ''} />
      </FormFilter>
      {/* belum ada log atau hasil filter kosong */}
      {data.baris.length === 0 ? <EmptyState judul={t('log.kosong')} ikon="log" /> : <TabelLog baris={barisTabel} />}
      <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={(n) => href(jalurQuery('/log', { ...filter, halaman: n }))} />
    </div>
  );
}
