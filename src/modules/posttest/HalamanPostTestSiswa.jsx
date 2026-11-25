import { redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';
import HasilPostTest from './HasilPostTest';
import KlienPostTest from './KlienPostTest';

/**
 * Halaman post test siswa (layar fokus tanpa menu biasa). Tes berjalan -> butir dan pewaktu; sudah dikumpulkan ->
 * layar hasil; selain itu kembali ke beranda (tombol Mulai ada di sana).
 */
export default async function HalamanPostTestSiswa() {
  const k = await konteksSiswa();
  const data = await ambilDep().posttestController.halaman(null, k.sesiSiswa);
  // belum ada percobaan yang bisa ditampilkan
  if (data.kosong) redirect(gabungJalur(k.basis, '/'));
  const judul = data.jalan ? t('posttest.judul', { level: data.jalan.levelNama }) : t('posttest.hasilJudul');
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="fokus" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null} kepalaFokus={<p className="font-display text-[1.1em] font-bold">{judul}</p>}>
      {data.jalan ? <KlienPostTest data={data.jalan} /> : <HasilPostTest hasil={data.hasil} hrefBeranda={gabungJalur(k.basis, '/')} />}
    </ShellSiswa>
  );
}
