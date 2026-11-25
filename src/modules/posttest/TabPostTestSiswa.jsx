import Link from 'next/link';
import { t } from '@/utils/i18n';
import { formatTanggal } from '@/utils/format';
import EmptyState from '@/modules/shared/ui/EmptyState';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import BukaTesUlang from './BukaTesUlang';
import LencanaPostTest from './LencanaPostTest';

/** Tab Post test di detail siswa (D2.8): riwayat percobaan, nilai per bagian, total, keadaan, dan Buka tes ulang. */
export default function TabPostTestSiswa({ riwayat, hrefDetail }) {
  // belum pernah ikut post test
  if (riwayat.length === 0) return <EmptyState judul={t('posttest.belumPernah')} ikon="target" />;
  const kolom = [
    { label: t('riwayat.tanggal'), isi: (p) => <Link href={hrefDetail(p.id)} className="font-semibold text-primary-text underline">{formatTanggal(p.mulai_at)}</Link> },
    { label: t('posttest.levelPercobaan'), isi: (p) => t('posttest.percobaanKe', { level: p.level_kode, ke: p.percobaan_ke }) },
    { label: t('posttest.nilaiPerBagian'), isi: (p) => p.bagian.map((b) => `${b.kode}: ${b.nilai ?? '-'}`).join(' · ') },
    { label: t('posttest.total'), isi: (p) => p.nilai_total ?? '-' },
    { label: t('posttest.kolomKeadaan'), isi: (p) => <LencanaPostTest pt={p} /> },
    { label: t('pengguna.aksi'), isi: (p) => (p.bisaTesUlang ? <BukaTesUlang ptId={p.id} bagian={p.bagian} bawaan={p.bagianUlangBawaan} /> : '-') },
  ];
  return <TabelResponsif kolom={kolom} baris={riwayat} />;
}
