import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import { JENIS_KARYA } from '@/enums';
import EmptyState from '@/modules/shared/ui/EmptyState';
import FormFilter from '@/modules/shared/ui/FormFilter';
import Select from '@/modules/shared/ui/Select';
import TextField from '@/modules/shared/ui/TextField';
import { AksiKaryaPengelola } from './AksiKarya';
import GaleriKarya from './GaleriKarya';

/** Halaman Karya pengelola (F2.5): semua karya, cari nama siswa/judul, filter jenis, hapus. */
export default async function HalamanKaryaPengelola({ searchParams }) {
  await wajibPengguna();
  const [data, info] = await Promise.all([ambilDep().karyaController.daftar(await searchParams), infoPermintaan()]);
  const { filter } = data;
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const opsiJenis = [{ nilai: '', label: t('umum.semua') }, ...Object.values(JENIS_KARYA).map((j) => ({ nilai: j, label: t(`karya.jenisNama.${j}`) }))];
  return (
    <div className="space-y-4">
      <h1 className="text-[1.5em] font-bold">{t('karya.judulPengelola')}</h1>
      <FormFilter hrefReset={href('/karya')}>
        <TextField label={t('karya.cari')} name="q" defaultValue={filter.q} />
        <Select label={t('karya.jenis')} name="jenis" defaultValue={filter.jenis ?? ''} opsi={opsiJenis} />
        {/* filter satu siswa (dari tab Karya detail siswa) ikut terbawa saat filter lain diterapkan */}
        {filter.siswaId && <input type="hidden" name="siswaId" value={filter.siswaId} />}
      </FormFilter>
      <GaleriKarya
        data={data}
        tampilSiswa
        aksi={(k) => <AksiKaryaPengelola k={k} />}
        hrefHalaman={(n) => href(jalurQuery('/karya', { ...filter, halaman: n }))}
        kosong={<EmptyState judul={t('karya.kosong')} ikon="gambar" />}
      />
    </div>
  );
}
