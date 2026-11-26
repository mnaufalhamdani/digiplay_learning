import Link from 'next/link';
import { t } from '@/utils/i18n';
import { formatDurasi, formatJam, formatTanggal, formatWaktu } from '@/utils/format';
import { STATUS_SESI } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import EmptyState from '@/modules/shared/ui/EmptyState';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import { LencanaPenuntasan, LencanaStatusSesi } from './LencanaSesi';

/** Ringkasan kehadiran level berjalan dan status syarat post test. */
function RingkasanKehadiran({ k }) {
  // siswa belum punya level berjalan
  if (!k) return null;
  const nada = k.memenuhi ? 'sukses' : 'peringatan';
  const label = k.pengecualian ? 'riwayat.syaratPengecualian' : k.memenuhi ? 'riwayat.syaratTerpenuhi' : 'riwayat.syaratBelum';
  return (
    <p className="flex flex-wrap items-center gap-2 font-semibold">
      {t('riwayat.kehadiran', { hadir: k.hadir, dari: k.dari })}
      <Badge nada={nada}>{t(label, { butuh: k.butuh })}</Badge>
    </p>
  );
}

/** Keterangan materi per pertemuan: waktu "Saya sudah paham", "belum dibaca", atau "-" bila pertemuan tidak punya materi. */
function KeteranganMateri({ dibacaAt }) {
  // undefined: pertemuan ini tidak punya materi aktif (mis. post test atau belum diisi)
  if (dibacaAt === undefined) return '-';
  // materi ada tetapi siswa belum menekan "Saya sudah paham"
  if (dibacaAt === null) return <Badge nada="peringatan">{t('riwayat.materiBelum')}</Badge>;
  return <Badge nada="sukses">{t('riwayat.materiDibaca', { waktu: formatWaktu(dibacaAt) })}</Badge>;
}

/** Tab Riwayat di detail siswa (C9): tabel sesi semua level beserta ringkasan kehadiran level berjalan. */
export default function RiwayatSesiSiswa({ riwayat, hrefSesi, materiBaca = {} }) {
  const kolom = [
    { label: t('riwayat.tanggal'), isi: (s) => <Link href={hrefSesi(s.id)} className="font-semibold text-primary-text underline">{formatTanggal(s.tanggal)}</Link> },
    { label: t('riwayat.pertemuan'), isi: (s) => `${s.level_kode} · P${s.pertemuan_nomor} ${s.pertemuan_judul}` },
    {
      label: t('riwayat.jam'),
      // sesi berlangsung belum punya jam pulang
      isi: (s) => (s.status === STATUS_SESI.BERLANGSUNG ? <LencanaStatusSesi status={s.status} /> : `${formatJam(s.jam_masuk)}–${formatJam(s.jam_pulang)} (${formatDurasi(s.lama_detik)})`),
    },
    { label: t('riwayat.tutor'), isi: (s) => s.tutor.map((x) => x.nama).join(', ') || '-' },
    { label: t('riwayat.penuntasan'), isi: (s) => <LencanaPenuntasan nilai={s.penuntasan_akhir} sumber={s.penuntasan_sumber} /> },
    { label: t('riwayat.tugas'), isi: (s) => `${s.tugas_selesai}/${s.tugas_total}` },
    { label: t('riwayat.materi'), isi: (s) => <KeteranganMateri dibacaAt={materiBaca[s.pertemuan_id]} /> },
  ];
  return (
    <div className="space-y-4">
      <RingkasanKehadiran k={riwayat.kehadiran} />
      {riwayat.sesi.length === 0 ? <EmptyState judul={t('riwayat.kosong')} ikon="absensi" /> : <TabelResponsif kolom={kolom} baris={riwayat.sesi} />}
    </div>
  );
}
