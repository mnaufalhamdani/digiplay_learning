import { t } from '@/utils/i18n';
import GrafikKemajuan from '@/modules/shared/ui/domain/GrafikKemajuan';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';

/**
 * Tab Latihan di detail siswa (pengelola, D1.6): WPM terbaik dan rata-rata akurasi beserta grafik,
 * jumlah main dan skor terbaik tiap game mouse, serta jumlah puzzle selesai.
 */
export default function TabLatihanSiswa({ mengetik, latihan }) {
  const kolom = [
    { label: t('game.kolomGame'), isi: (g) => t(`game.nama.${g.jenis}`) },
    { label: t('game.kolomJumlah'), isi: (g) => g.jumlah },
    { label: t('game.kolomSkor'), isi: (g) => g.skorTerbaik ?? '-' },
  ];
  return (
    <div className="space-y-5">
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ['mengetik.wpmTerbaik', mengetik.wpmTerbaik ?? '-'],
          ['mengetik.akurasiRata', mengetik.akurasiRata == null ? '-' : `${mengetik.akurasiRata}%`],
          ['puzzle.jumlahSelesai', latihan.puzzleSelesai],
        ].map(([kunci, nilai]) => (
          <div key={kunci} className="rounded-lg border border-line bg-bg p-3">
            <dt className="text-muted">{t(kunci)}</dt>
            <dd className="text-[1.4em] font-bold">{nilai}</dd>
          </div>
        ))}
      </dl>
      <GrafikKemajuan data={mengetik.grafik} />
      <TabelResponsif kolom={kolom} baris={latihan.game} kunciBaris={(g) => g.jenis} />
    </div>
  );
}
