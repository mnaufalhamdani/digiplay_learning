import { t } from '@/utils/i18n';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/** Tampilan lihat saja untuk halaman latihan saat siswa belum diabsen (Zippy tidur, pesan ramah). */
export default function LihatSaja({ judul }) {
  return (
    <Card varian="terangkat" className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <Maskot suasana="tidur" ukuran={140} />
      <h1 className="font-display text-[1.6em] font-bold">{judul}</h1>
      <Badge nada="peringatan">
        <Ikon nama="gembok" />
        {t('siswa.belumAbsen')}
      </Badge>
      <p className="max-w-md text-muted">{t('siswa.belumAbsenPesan')}</p>
    </Card>
  );
}
