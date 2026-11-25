import { t } from '@/utils/i18n';
import { formatTanggal } from '@/utils/format';
import { JENIS_KARYA } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Paginasi from '@/modules/shared/ui/Paginasi';

/** Pratinjau karya: thumbnail untuk berkas, ikon dan domain untuk tautan (isi situs tidak pernah diambil server). */
function Pratinjau({ k }) {
  // berkas gambar disajikan lewat rute berkas yang memeriksa kepemilikan
  if (k.jenis === JENIS_KARYA.BERKAS) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- berkas privat dari rute API, bukan aset publik
      <img src={`/api/v1/karya/berkas?id=${encodeURIComponent(k.id)}`} alt={k.judul} loading="lazy" className="aspect-[4/3] w-full rounded-md border border-line bg-bg object-contain" />
    );
  }
  return (
    <a href={k.url} target="_blank" rel="noopener noreferrer nofollow" className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-md border border-line bg-primary-soft p-3 text-center font-bold text-primary-text">
      <Ikon nama="tautan" ukuran="2em" />
      <span className="break-all">{k.domain || t('karya.tautan')}</span>
      <span className="sr-only">{t('karya.bukaTab')}</span>
    </a>
  );
}

/**
 * Grid kartu karya (terbaru dahulu) dengan paginasi. `aksi(k)` opsional untuk tombol per kartu (ubah/hapus);
 * tanpa itu galeri hanya untuk dilihat (orang tua). `tampilSiswa` menampilkan nama siswa (halaman pengelola).
 */
export default function GaleriKarya({ data, aksi = null, tampilSiswa = false, hrefHalaman = null, kosong }) {
  // belum ada karya: pemanggil menentukan keadaan kosongnya (dengan Zippy di area siswa)
  if (data.baris.length === 0) return kosong;
  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.baris.map((k) => (
          <li key={k.id}>
            <Card className="flex h-full flex-col gap-3">
              <Pratinjau k={k} />
              <div className="flex-1 space-y-1">
                <p className="break-words font-bold">{k.judul}</p>
                {tampilSiswa && <p className="text-[0.9em] font-semibold text-primary-text">{k.siswa_nama}</p>}
                {k.deskripsi && <p className="whitespace-pre-wrap break-words text-[0.95em] text-muted">{k.deskripsi}</p>}
                <p className="text-[0.85em] text-muted">{formatTanggal(k.created_at)}</p>
              </div>
              {aksi && aksi(k)}
            </Card>
          </li>
        ))}
      </ul>
      {hrefHalaman && <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={hrefHalaman} />}
    </div>
  );
}
