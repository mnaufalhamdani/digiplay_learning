'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { gabungJalur } from '@/utils/jalurArea';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Button from '@/modules/shared/ui/Button';
import Modal from '@/modules/shared/ui/Modal';
import Select from '@/modules/shared/ui/Select';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import TextField from '@/modules/shared/ui/TextField';
import TampilanKode from './TampilanKode';
import { tambahSiswa } from './siswa.actions';

/** Tanggal hari ini menurut jam perangkat (YYYY-MM-DD), bawaan tanggal daftar. */
function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Hasil pendaftaran: kedua kode dengan tombol Salin, tautan cetak kartu dan detail siswa. */
function HasilDaftar({ hasil, tutup }) {
  const { basis } = useArea();
  return (
    <div className="space-y-5">
      <p>{t('dataSiswa.berhasilTambah', { nama: hasil.nama })}</p>
      <TampilanKode label={t('dataSiswa.kodeSiswa')} kode={hasil.kode.siswa} />
      <TampilanKode label={t('dataSiswa.kodeOrtu')} kode={hasil.kode.ortu} />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <TautanTombol href={gabungJalur(basis, `/kartu-kode/${hasil.id}`)} target="_blank" rel="noopener" varian="secondary" ikon="cetak">
          {t('dataSiswa.cetakKartu')}
        </TautanTombol>
        <TautanTombol href={gabungJalur(basis, `/data-siswa/${hasil.id}`)} varian="secondary">
          {t('dataSiswa.lihatDetail')}
        </TautanTombol>
        <Button onClick={tutup}>{t('umum.selesai')}</Button>
      </div>
    </div>
  );
}

/** Tombol "Tambah siswa" beserta modal pendaftaran (nama, tanggal daftar, level awal) dan tampilan kode hasilnya. */
export default function TambahSiswa({ opsiLevel }) {
  const router = useRouter();
  const kosong = () => ({ nama: '', tanggalDaftar: hariIni(), levelId: opsiLevel[0]?.nilai ?? '' });
  const [terbuka, setTerbuka] = useState(false);
  const [nilai, setNilai] = useState(kosong);
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [hasil, setHasil] = useState(null);
  const [memuat, mulai] = useTransition();
  /** Membuka modal dengan isian bersih. */
  function buka() {
    setNilai(kosong());
    setGalat({ umum: '', kolom: {} });
    setHasil(null);
    setTerbuka(true);
  }
  /** Menutup modal; bila siswa sudah terdaftar, daftar dimuat ulang. */
  function tutup() {
    setTerbuka(false);
    if (hasil) router.refresh();
  }
  /** Mengirim pendaftaran. */
  function kirim(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await tambahSiswa(nilai);
      // galat per kolom tampil di kolomnya; galat lain di atas tombol
      if (!r.ok) return setGalat({ umum: r.detail ? '' : r.error, kolom: petaGalat(r.detail) });
      setHasil(r.data);
    });
  }
  const ubah = (nama) => (e) => setNilai((n) => ({ ...n, [nama]: e.target.value }));
  return (
    <>
      <Button ikon="tambah" onClick={buka}>
        {t('dataSiswa.tambah')}
      </Button>
      <Modal terbuka={terbuka} judul={t(hasil ? 'dataSiswa.kodeJudul' : 'dataSiswa.tambah')} tutup={memuat ? null : tutup} tutupSaatKlikLuar={!hasil}>
        {hasil ? (
          <HasilDaftar hasil={hasil} tutup={tutup} />
        ) : (
          <form onSubmit={kirim} className="space-y-4" noValidate>
            <TextField label={t('dataSiswa.nama')} value={nilai.nama} onChange={ubah('nama')} galat={galat.kolom.nama} autoComplete="off" />
            <TextField label={t('dataSiswa.tanggalDaftar')} type="date" value={nilai.tanggalDaftar} onChange={ubah('tanggalDaftar')} galat={galat.kolom.tanggalDaftar} />
            <Select label={t('dataSiswa.levelAwal')} value={nilai.levelId} onChange={ubah('levelId')} opsi={opsiLevel} galat={galat.kolom.levelId} />
            {galat.umum && (
              <p role="alert" className="font-semibold text-bad">
                {galat.umum}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button varian="secondary" onClick={tutup} disabled={memuat}>
                {t('umum.batal')}
              </Button>
              <Button type="submit" memuat={memuat}>
                {t('dataSiswa.daftarkan')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
