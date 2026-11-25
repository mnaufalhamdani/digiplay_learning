import { t } from '@/utils/i18n';
import { formatNilai, formatTanggal } from '@/utils/format';
import EmptyState from '@/modules/shared/ui/EmptyState';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import AksiSertifikat from './AksiSertifikat';
import LencanaSertifikat from './LencanaSertifikat';

/** Keterangan tambahan: sertifikat yang digantikan dan alasan pembatalan (bila ada). */
function Keterangan({ s }) {
  // sertifikat pertama yang masih terbit tidak punya keterangan
  if (!s.menggantikan_nomor && !s.alasan_batal) return '-';
  return (
    <div className="space-y-1 text-[0.95em]">
      {s.menggantikan_nomor && <p>{t('sertifikat.menggantikan', { nomor: s.menggantikan_nomor })}</p>}
      {s.alasan_batal && (
        <p className="text-muted">
          {t('sertifikat.dibatalkanKarena', { alasan: s.alasan_batal, tanggal: formatTanggal(s.dibatalkan_at) })}
        </p>
      )}
    </div>
  );
}

/** Tab Sertifikat di detail siswa (E5.2): riwayat termasuk yang dibatalkan dan sertifikat penggantinya. */
export default function TabSertifikatSiswa({ riwayat }) {
  // siswa belum pernah lulus post test
  if (riwayat.length === 0) return <EmptyState judul={t('sertifikat.belumAda')} ikon="sertifikat" />;
  const kolom = [
    { label: t('sertifikat.nomor'), isi: (s) => <span className="whitespace-nowrap font-mono font-semibold">{s.nomor}</span> },
    { label: t('sertifikat.level'), isi: (s) => s.nama_level },
    { label: t('sertifikat.nilai'), isi: (s) => formatNilai(s.nilai_total) },
    { label: t('sertifikat.tanggalTerbit'), isi: (s) => formatTanggal(s.diterbitkan_at) },
    { label: t('sertifikat.statusLabel'), isi: (s) => <LencanaSertifikat status={s.status} /> },
    { label: t('sertifikat.keterangan'), isi: (s) => <Keterangan s={s} /> },
    { label: t('pengguna.aksi'), isi: (s) => <AksiSertifikat s={s} /> },
  ];
  return <TabelResponsif kolom={kolom} baris={riwayat} />;
}
