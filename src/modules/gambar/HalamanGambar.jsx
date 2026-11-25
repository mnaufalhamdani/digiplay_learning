import Image from 'next/image';
import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import { KATEGORI_GAMBAR, PERAN } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import EmptyState from '@/modules/shared/ui/EmptyState';
import FormFilter from '@/modules/shared/ui/FormFilter';
import Ikon from '@/modules/shared/ui/Ikon';
import Select from '@/modules/shared/ui/Select';
import { TombolPindaiGambar } from './AksiGambar';
import LencanaKelengkapan from './LencanaKelengkapan';

/** Satu kartu subjek: pratinjau berwarna.png (bila ada), nama, kategori, dan penanda kelengkapan. */
function KartuGambar({ g, href }) {
  return (
    <Link href={href} className="block rounded-lg focus-visible:outline-2">
      <Card className="h-full space-y-3 p-3 sm:p-3 hover:border-primary">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-bg">
          {/* belum ada berwarna.png: tampilkan ikon pengganti, bukan gambar rusak */}
          {g.urlPratinjau ? (
            <Image src={g.urlPratinjau} alt={g.nama} width={1024} height={1024} sizes="(min-width: 1024px) 200px, 45vw" className="h-full w-full object-contain" />
          ) : (
            <Ikon nama="gambar" ukuran="3em" className="text-muted" label={t('gambar.belumAdaPratinjau')} />
          )}
        </div>
        <div>
          <p className="font-bold">{g.nama}</p>
          <p className="text-[0.9em] text-muted">
            {g.kode} · {t(`gambar.kategori.${g.kategori}`)}
          </p>
        </div>
        <LencanaKelengkapan g={g} />
      </Card>
    </Link>
  );
}

/** Halaman Gambar: kartu subjek dengan filter kategori dan kelengkapan; admin bisa memindai ulang berkas. */
export default async function HalamanGambar({ searchParams }) {
  const sesi = await wajibPengguna();
  const [{ baris, filter }, info] = await Promise.all([ambilDep().gambarController.daftar(await searchParams), infoPermintaan()]);
  const opsiKategori = [{ nilai: '', label: t('umum.semua') }, ...KATEGORI_GAMBAR.map((k) => ({ nilai: k, label: t(`gambar.kategori.${k}`) }))];
  const opsiKelengkapan = [
    { nilai: '', label: t('umum.semua') },
    { nilai: 'lengkap', label: t('gambar.lengkap') },
    { nilai: 'belum_lengkap', label: t('gambar.belumLengkap') },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5em] font-bold">{t('gambar.judul')}</h1>
        {sesi.peran === PERAN.ADMIN && <TombolPindaiGambar />}
      </div>
      <FormFilter hrefReset={gabungJalur(info.basis, '/gambar')}>
        <Select label={t('gambar.filterKategori')} name="kategori" defaultValue={filter.kategori ?? ''} opsi={opsiKategori} />
        <Select label={t('gambar.filterKelengkapan')} name="kelengkapan" defaultValue={filter.kelengkapan ?? ''} opsi={opsiKelengkapan} />
      </FormFilter>
      {/* hasil filter kosong */}
      {baris.length === 0 ? (
        <EmptyState judul={t('gambar.kosong')} ikon="gambar" />
      ) : (
        <>
          <p className="text-muted">{t('paginasi.jumlah', { total: baris.length })}</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {baris.map((g) => (
              <li key={g.id}>
                <KartuGambar g={g} href={gabungJalur(info.basis, `/gambar/${g.id}`)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
