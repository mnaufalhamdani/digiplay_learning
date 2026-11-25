import { t } from '@/utils/i18n';
import Badge from '@/modules/shared/ui/Badge';

/** Nada lencana per keadaan sertifikat (status tabel, atau keadaan di detail post test). */
const NADA = { terbit: 'sukses', dibatalkan: 'bahaya', gagal: 'peringatan', belum: 'netral' };

/** Lencana keadaan sertifikat: terbit, dibatalkan, gagal terbit, atau belum terbit (selalu berteks). */
export default function LencanaSertifikat({ status }) {
  return <Badge nada={NADA[status] ?? 'netral'}>{t(`sertifikat.status.${status}`)}</Badge>;
}
