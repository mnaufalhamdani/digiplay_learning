import { t } from '@/utils/i18n';
import { PENUNTASAN, STATUS_SESI } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';

/** Nada lencana per penuntasan. */
const NADA_PENUNTASAN = { [PENUNTASAN.TUNTAS]: 'sukses', [PENUNTASAN.SEBAGIAN]: 'peringatan', [PENUNTASAN.TIDAK]: 'bahaya' };

/** Lencana status sesi (berlangsung/selesai). */
export function LencanaStatusSesi({ status }) {
  return <Badge nada={status === STATUS_SESI.BERLANGSUNG ? 'info' : 'netral'}>{t(`absensi.statusSesi.${status}`)}</Badge>;
}

/** Lencana penuntasan beserta sumbernya (otomatis/tutor); "-" bila belum ada. */
export function LencanaPenuntasan({ nilai, sumber }) {
  // belum bisa dinilai (mis. pertemuan post test tanpa tugas)
  if (!nilai) return <span className="text-muted">-</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge nada={NADA_PENUNTASAN[nilai]}>{t(`absensi.penuntasan.${nilai}`)}</Badge>
      {sumber && <span className="text-[0.85em] text-muted">({t(`absensi.sumber.${sumber}`)})</span>}
    </span>
  );
}

/** Lencana login perangkat siswa (aktif/tidak). */
export function LencanaLogin({ aktif }) {
  return <Badge nada={aktif ? 'sukses' : 'netral'}>{t(aktif ? 'absensi.loginAktif' : 'absensi.loginTidakAktif')}</Badge>;
}
