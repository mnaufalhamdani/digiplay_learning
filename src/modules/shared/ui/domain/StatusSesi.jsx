'use client';
import { useEffect, useState } from 'react';
import { t } from '@/utils/i18n';
import { formatDurasi, formatJam } from '@/utils/format';
import Badge from '../Badge';
import Ikon from '../Ikon';

/**
 * Status sesi siswa: "Sesi aktif" dengan jam mulai dan lama berjalan. `lamaDetik` dihitung server (jam database),
 * lalu ditambah waktu sejak halaman dibuka agar tidak bergantung pada jam perangkat siswa.
 */
export default function StatusSesi({ jamMasuk, lamaDetik }) {
  const [tambahan, setTambahan] = useState(0);
  // perbarui tampilan lama berjalan tiap 30 detik
  useEffect(() => {
    const awal = Date.now();
    setTambahan(0);
    const timer = setInterval(() => setTambahan(Math.floor((Date.now() - awal) / 1000)), 30_000);
    return () => clearInterval(timer);
  }, [lamaDetik]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge nada="sukses">
        <Ikon nama="sukses" />
        {t('sesiSiswa.aktif')}
      </Badge>
      <span className="flex items-center gap-1 font-semibold text-muted">
        <Ikon nama="jam" />
        {t('sesiSiswa.mulaiLama', { jam: formatJam(jamMasuk), lama: formatDurasi(lamaDetik + tambahan) })}
      </span>
    </div>
  );
}
