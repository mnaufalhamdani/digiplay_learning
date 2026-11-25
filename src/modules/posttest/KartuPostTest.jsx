'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { mulaiPostTest } from './posttest.actions';

/** Label tombol per aksi. */
const LABEL = { mulai: 'posttest.mulai', lanjutkan: 'posttest.lanjutkan', mulaiUlang: 'posttest.mulaiUlang' };

/**
 * Kartu post test di beranda siswa (D2.1): Mulai (ConfirmDialog "45 menit dan hanya sekali"), Lanjutkan, atau Mulai tes ulang
 * (dengan daftar bagian yang diulang); bila sudah selesai, keadaannya (lulus, belum lulus, sedang diperiksa) dan tautan hasil.
 */
export default function KartuPostTest({ status }) {
  const router = useRouter();
  const { basis } = useArea();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState('');
  const [memuat, mulai] = useTransition();
  /** Memulai (atau melanjutkan) lalu membuka halaman post test. */
  function jalankan() {
    mulai(async () => {
      const r = await mulaiPostTest();
      if (!r.ok) {
        setKonfirmasi(false);
        return setGalat(r.error);
      }
      router.push(gabungJalur(basis, '/post-test'));
    });
  }
  return (
    <Card varian="berwarna" className="flex flex-col items-center gap-3 text-center">
      <Maskot suasana={status.keadaan === 'lulus' ? 'merayakan' : 'semangat'} ukuran={110} />
      <h2 className="font-display text-[1.4em] font-bold">{t('posttest.kartuJudul')}</h2>
      {status.aksi ? (
        <>
          {status.bagianUlang.length > 0 && <p className="font-semibold">{t('posttest.bagianUlang', { daftar: status.bagianUlang.join(', ') })}</p>}
          {/* lanjutkan tidak perlu konfirmasi; mulai dan tes ulang perlu */}
          <Button ukuran="lg" ikon="main" memuat={memuat} onClick={() => (status.aksi === 'lanjutkan' ? jalankan() : setKonfirmasi(true))}>
            {t(LABEL[status.aksi])}
          </Button>
        </>
      ) : (
        <>
          <p className="font-semibold">{t(`posttest.keadaan.${status.keadaan}`)}</p>
          <TautanTombol href={gabungJalur(basis, '/post-test')} varian="secondary">
            {t('posttest.lihatHasil')}
          </TautanTombol>
        </>
      )}
      {galat && (
        <p role="alert" className="font-semibold text-bad">
          {galat}
        </p>
      )}
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t('posttest.siapJudul')}
        pesan={t('posttest.siapPesan', { menit: status.durasiMenit })}
        labelYa={t('posttest.siapYa')}
        labelBatal={t('siswa.tidakJadi')}
        maskot="semangat"
        memuat={memuat}
        onYa={jalankan}
        onBatal={() => setKonfirmasi(false)}
      />
    </Card>
  );
}
