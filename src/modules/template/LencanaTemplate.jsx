import { t } from '@/utils/i18n';
import { PENILAIAN } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';

/** Lencana tipe, mode penilaian, dan status aktif template (selalu berteks). */
export default function LencanaTemplate({ tpl }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge nada="primer">{t(`template.tipe.${tpl.tipe}`)}</Badge>
      <Badge nada={tpl.penilaian === PENILAIAN.OTOMATIS ? 'info' : 'peringatan'}>{t(`template.penilaianLabel.${tpl.penilaian}`)}</Badge>
      {!tpl.aktif && <Badge nada="netral">{t('pengguna.nonaktif')}</Badge>}
    </span>
  );
}
