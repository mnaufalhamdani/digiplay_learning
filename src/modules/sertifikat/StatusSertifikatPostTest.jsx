import { t } from '@/utils/i18n';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import { TombolTerbitkanUlang } from './AksiSertifikat';
import LencanaSertifikat from './LencanaSertifikat';

/**
 * Status sertifikat di detail post test (E5.3): terbit (nomor), dibatalkan, gagal terbit (peringatan), atau belum,
 * beserta tombol Terbitkan ulang. Tidak tampil bila post test tidak lulus (`status` null).
 */
export default function StatusSertifikatPostTest({ status, siswaId, levelId }) {
  if (!status) return null;
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[1.1em] font-bold">{t('sertifikat.judulStatus')}</h2>
        <LencanaSertifikat status={status.status} />
        {status.nomor && <span className="font-mono font-semibold">{status.nomor}</span>}
      </div>
      {/* penerbitan otomatis gagal: tutor perlu tahu dan bisa menerbitkan secara manual */}
      {status.status === 'gagal' && (
        <p role="alert" className="flex items-start gap-2 font-semibold text-warn">
          <Ikon nama="peringatan" className="mt-0.5" />
          {t('sertifikat.peringatanGagal')}
        </p>
      )}
      <TombolTerbitkanUlang siswaId={siswaId} levelId={levelId} ada={status.status === 'terbit'} />
    </Card>
  );
}
