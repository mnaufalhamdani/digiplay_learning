import { t } from '@/utils/i18n';
import { STATUS_SISWA } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';

/** Lencana status siswa (aktif/nonaktif), selalu berteks. */
export default function LencanaSiswa({ status }) {
  return <Badge nada={status === STATUS_SISWA.AKTIF ? 'sukses' : 'netral'}>{t(`dataSiswa.status.${status}`)}</Badge>;
}
