'use client';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/utils/i18n';
import { NOMOR_POST_TEST, STATUS_TUGAS } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import EmptyState from '@/modules/shared/ui/EmptyState';
import ProgressBar from '@/modules/shared/ui/ProgressBar';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import StatusSesi from '@/modules/shared/ui/domain/StatusSesi';
import KartuTugas from '@/modules/tugas/KartuTugas';
import KartuPostTest from '@/modules/posttest/KartuPostTest';

/**
 * Isi beranda saat sesi berlangsung: sapaan + Zippy, status sesi, kemajuan tugas, dan kartu tugas.
 * Konfeti dan Zippy merayakan muncul saat semua tugas selesai (sekali per perubahan menjadi lengkap).
 */
export default function DaftarTugasSiswa({ nama, sesi, postTest = null }) {
  // tugas yang diganti tidak ditampilkan; penggantinya sudah ada di daftar
  const tugas = sesi.tugas.filter((x) => x.status !== STATUS_TUGAS.DIGANTI);
  const selesai = tugas.filter((x) => x.status === STATUS_TUGAS.SELESAI).length;
  const semuaSelesai = tugas.length > 0 && selesai === tugas.length;
  const [rayakan, setRayakan] = useState(false);
  const sebelumnya = useRef(semuaSelesai);
  // rayakan hanya saat baru menjadi lengkap, bukan setiap kali halaman dibuka
  useEffect(() => {
    if (semuaSelesai && !sebelumnya.current) setRayakan(true);
    sebelumnya.current = semuaSelesai;
  }, [semuaSelesai]);
  return (
    <div className="space-y-6">
      <Card varian="berwarna" className="flex flex-col items-center gap-4 sm:flex-row">
        <Maskot suasana={semuaSelesai ? 'merayakan' : 'menunjuk'} ukuran={110} />
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="font-display text-[1.6em] font-bold">{t('siswa.halo', { nama })}</h1>
          <p className="font-semibold">{t('sesiSiswa.pertemuan', { nomor: sesi.pertemuanNomor, judul: sesi.pertemuanJudul })}</p>
          <StatusSesi jamMasuk={sesi.jamMasuk} lamaDetik={sesi.lamaDetik} />
        </div>
      </Card>
      {tugas.length > 0 && <ProgressBar nilai={selesai} maks={tugas.length} label={t('sesiSiswa.kemajuan', { selesai, total: tugas.length })} />}
      {semuaSelesai && <p className="text-center font-display text-[1.3em] font-bold text-ok">{t('sesiSiswa.semuaSelesai')}</p>}
      {/* pertemuan post test: kartu post test; pertemuan lain bisa kosong bila templatenya belum ada */}
      {postTest ? (
        <KartuPostTest status={postTest} />
      ) : tugas.length === 0 ? (
        <EmptyState judul={t(sesi.pertemuanNomor === NOMOR_POST_TEST ? 'sesiSiswa.postTestMenyusul' : 'sesiSiswa.tanpaTugas')} pesan={t('sesiSiswa.tanyaTutor')} />
      ) : (
        <div className="space-y-4">
          {tugas.map((x, i) => (
            <KartuTugas key={x.id} tugas={x} nomor={i + 1} />
          ))}
        </div>
      )}
      <Konfeti tampil={rayakan} />
    </div>
  );
}
