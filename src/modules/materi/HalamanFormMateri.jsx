import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import FormMateri from './FormMateri';

/** Halaman ubah (atau isi pertama kali) materi sebuah pertemuan; khusus admin, tutor mendapat 404. */
export default async function HalamanFormMateri({ params }) {
  await wajibAdmin();
  const { pertemuanId } = await params;
  const [materi, info] = await Promise.all([atau404(() => ambilDep().materiController.detailPengelola({ pertemuanId })), infoPermintaan()]);
  return (
    <div className="space-y-4">
      <TautanTombol href={gabungJalur(info.basis, `/materi/${materi.pertemuanId}`)} varian="hantu" ikon="kembali">
        {t('umum.kembali')}
      </TautanTombol>
      <div className="space-y-1">
        <h1 className="text-[1.5em] font-bold">{t(materi.ada ? 'materi.ubahJudul' : 'materi.isiJudul', { nomor: materi.nomor })}</h1>
        <p className="text-muted">
          {materi.levelNama} ({materi.levelKode}) · {materi.pertemuanJudul}
        </p>
      </div>
      <FormMateri awal={materi} />
    </div>
  );
}
