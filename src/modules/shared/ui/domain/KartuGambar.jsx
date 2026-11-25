import { t } from '@/utils/i18n';
import Card from '../Card';
import Ikon from '../Ikon';

/** Pratinjau satu bahan gambar dengan tombol Unduh (mewarnai.png atau berwarna.png) lewat rute unduh tugas. */
export default function KartuGambar({ nama, jenis, kode, hrefUnduh }) {
  return (
    <Card as="li" className="space-y-3 p-3 sm:p-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau berkas statis di public/aset */}
      <img src={`/aset/gambar/${kode}/${jenis}.png`} alt={nama} loading="lazy" className="aspect-square w-full rounded-md bg-bg object-contain" />
      <p className="font-bold">
        {nama} <span className="font-normal text-muted">({t(`gambar.berkas.${jenis}`)})</span>
      </p>
      <a href={hrefUnduh} download className="inline-flex min-h-[var(--tap)] w-full items-center justify-center gap-2 rounded-[var(--r-btn)] bg-primary px-4 font-bold text-on-primary">
        <Ikon nama="unduh" />
        {t('bahan.unduh')}
      </a>
    </Card>
  );
}
