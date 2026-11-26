'use client';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import Pewaktu from '@/modules/shared/ui/domain/Pewaktu';
import { useWaktu } from '@/modules/posttest/useWaktuPostTest';

/**
 * Kepala halaman Studio Zippy saat dibuka dari butir post test (layar fokus): judul dan pewaktu yang tetap berdenyut
 * ke server seperti di halaman post test, sehingga waktu tes terus berjalan selama siswa di Studio. Waktu habis atau
 * tes sudah dikumpulkan -> kembali ke halaman post test (server yang mengumpulkan dan menampilkan hasil).
 */
export default function KepalaButirStudio({ sisaDetik, levelNama, basis }) {
  const router = useRouter();
  const sisa = useWaktu(sisaDetik, () => router.replace(gabungJalur(basis, '/post-test')));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="font-display text-[1.1em] font-bold">{t('posttest.judul', { level: levelNama })}</p>
      <Pewaktu sisaDetik={sisa} />
    </div>
  );
}
