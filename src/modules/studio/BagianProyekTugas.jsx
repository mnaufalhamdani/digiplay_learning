'use client';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@/utils/i18n';
import { formatWaktu } from '@/utils/format';
import { gabungJalur } from '@/utils/jalurArea';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import { useArea } from '@/modules/shared/ui/AreaContext';
import { DialogKirimProyek } from './DialogProyek';
import { ringkasanKirimanStudio } from './studio.actions';

/**
 * Bagian kerja kartu tugas bertipe coding_proyek (siswa): tombol Buka Studio Zippy langsung dari instruksi (tanpa
 * lewat menu), tombol Kirim proyek yang membuka pilihan proyek tersimpan, dan keterangan proyek yang sudah dikirim
 * (boleh dikirim ulang sebelum tutor menilai). Penilaian dilakukan tutor, jadi kartu hanya menunggu.
 */
export default function BagianProyekTugas({ tugas }) {
  const { basis } = useArea();
  const [kiriman, setKiriman] = useState(null);
  const [dialog, setDialog] = useState(false);
  /** Memuat ringkasan kiriman (nama dan waktu) proyek untuk tugas ini. */
  const muat = useCallback(async () => {
    const r = await ringkasanKirimanStudio({ tugasId: tugas.id });
    // gagal memuat ringkasan: kartu tetap bisa dipakai, hanya keterangan kiriman yang tidak tampil
    if (r.ok) setKiriman(r.data);
  }, [tugas.id]);
  useEffect(() => {
    muat();
  }, [muat]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <TautanTombol href={gabungJalur(basis, `/studio?tugas=${tugas.id}`)} ukuran="lg" ikon="studio">
          {t('studio.bukaStudio')}
        </TautanTombol>
        <Button ukuran="lg" varian="secondary" ikon="kirim" onClick={() => setDialog(true)}>
          {t('studio.kirimProyek')}
        </Button>
      </div>
      {kiriman && (
        <p className="flex flex-wrap items-center gap-2 font-semibold text-ok">
          <Ikon nama="sukses" />
          {t('studio.sudahTerkirim', { nama: kiriman.nama, waktu: formatWaktu(kiriman.dikirimPada) })}
        </p>
      )}
      <Badge nada="info">
        <Ikon nama="jam" />
        {t('sesiSiswa.menungguTutor')}
      </Badge>
      <DialogKirimProyek
        terbuka={dialog}
        tugasId={tugas.id}
        jenis="tugas"
        onTerkirim={() => {
          setDialog(false);
          muat();
        }}
        onTutup={() => setDialog(false)}
      />
    </div>
  );
}
