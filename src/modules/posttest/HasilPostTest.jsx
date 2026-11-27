import { t } from '@/utils/i18n';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/**
 * Layar hasil post test siswa (D2.4): nilai per bagian (angka saja, tanpa kunci jawaban), lulus atau belum.
 * Bila bagian praktik belum dinilai: "Hasilmu sedang diperiksa tutor" (Zippy berpikir).
 */
export default function HasilPostTest({ hasil, hrefBeranda }) {
  const menunggu = hasil.lulus == null;
  const suasana = menunggu ? 'berpikir' : hasil.lulus ? 'merayakan' : 'menyemangati';
  return (
    <Card varian="terangkat" className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <Maskot suasana={suasana} ukuran={140} />
      <h1 className="font-display text-[1.6em] font-bold">{t(menunggu ? 'posttest.diperiksa' : hasil.lulus ? 'posttest.lulus' : 'posttest.belumLulus')}</h1>
      <ul className="w-full space-y-2 text-left">
        {hasil.bagian.map((b) => (
          <li key={b.kode} className="flex items-center justify-between gap-2 rounded-md bg-bg p-3">
            <span className="font-semibold">
              {b.kode}. {b.nama}
            </span>
            {b.nilai == null ? <Badge nada="info">{t('posttest.menungguNilai')}</Badge> : <span className="font-display text-[1.2em] font-bold">{b.nilai}</span>}
          </li>
        ))}
      </ul>
      {!menunggu && <p className="font-display text-[1.3em] font-bold">{t('posttest.nilaiTotal', { total: hasil.total })}</p>}
      {/* tanpa tombol unduh: sertifikat diunduh lewat tutor atau orang tua */}
      {hasil.sertifikatTerbit && (
        <Badge nada="sukses" className="text-[1em]">
          <Ikon nama="sertifikat" />
          {t('posttest.sertifikatTerbit')}
        </Badge>
      )}
      <p className="text-muted">{t('posttest.bolehPulang')}</p>
      <TautanTombol href={hrefBeranda} ukuran="lg" ikon="beranda">
        {t('siswa.beranda')}
      </TautanTombol>
      <Konfeti tampil={hasil.lulus === true} />
    </Card>
  );
}
