import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import { PERAN } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import EmptyState from '@/modules/shared/ui/EmptyState';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import IsiMateri from './IsiMateri';

/**
 * Pratinjau materi untuk pengelola dalam tampilan siswa (palet area siswa). Admin mendapat tombol ubah;
 * tutor hanya melihat. Pertemuan yang belum punya materi menampilkan keadaan kosong.
 */
export default async function HalamanDetailMateri({ params }) {
  const sesi = await wajibPengguna();
  const { pertemuanId } = await params;
  const [materi, info] = await Promise.all([atau404(() => ambilDep().materiController.detailPengelola({ pertemuanId })), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const admin = sesi.peran === PERAN.ADMIN;
  const tombolUbah = admin && (
    <TautanTombol href={href(`/materi/${materi.pertemuanId}/ubah`)} varian="secondary" ikon="ubah">
      {t(materi.ada ? 'materi.ubah' : 'materi.isi')}
    </TautanTombol>
  );
  return (
    <div className="space-y-4">
      <TautanTombol href={href('/materi')} varian="hantu" ikon="kembali">
        {t('materi.kembali')}
      </TautanTombol>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-[1.5em] font-bold">{materi.judul}</h1>
          <p className="text-muted">
            {materi.levelNama} ({materi.levelKode}) · {t('materi.pertemuanNomor', { nomor: materi.nomor })}: {materi.pertemuanJudul}
          </p>
          {materi.ada && <Badge nada={materi.aktif ? 'sukses' : 'netral'}>{t(materi.aktif ? 'materi.aktif' : 'materi.nonaktif')}</Badge>}
        </div>
        {tombolUbah}
      </div>
      {materi.ada ? (
        <>
          <p className="font-semibold text-muted">{t('materi.pratinjau')}</p>
          {/* palet area siswa dipasang di sini agar pratinjau sama dengan yang dilihat siswa */}
          <div data-area="siswa" className="rounded-lg border border-line bg-bg p-4 font-body text-fg sm:p-6">
            <div className="mx-auto max-w-3xl">
              <IsiMateri isi={materi.isi} />
            </div>
          </div>
        </>
      ) : (
        <EmptyState judul={t('materi.belumDiisi')} pesan={t(admin ? 'materi.belumDiisiAdmin' : 'materi.belumDiisiTutor')} ikon="materi" />
      )}
    </div>
  );
}
