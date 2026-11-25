import { t } from '@/utils/i18n';
import { STATUS_POST_TEST } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';

/** Lencana keadaan percobaan: berlangsung / belum dimulai, menunggu penilaian, lulus, atau belum lulus (selalu berteks). */
export default function LencanaPostTest({ pt }) {
  if (pt.status === STATUS_POST_TEST.BERLANGSUNG) return <Badge nada="info">{t(pt.dimulai ? 'posttest.status.berlangsung' : 'posttest.status.belumDimulai')}</Badge>;
  if (pt.lulus == null) return <Badge nada="peringatan">{t('posttest.status.menunggu')}</Badge>;
  return <Badge nada={pt.lulus ? 'sukses' : 'bahaya'}>{t(pt.lulus ? 'posttest.status.lulus' : 'posttest.status.belumLulus')}</Badge>;
}
