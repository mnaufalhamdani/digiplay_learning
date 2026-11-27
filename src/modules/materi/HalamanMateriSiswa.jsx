import { ambilDep } from '@/di/container';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';
import IsiMateri from './IsiMateri';
import PenutupMateri from './PenutupMateri';

/**
 * Halaman satu materi untuk siswa (`/materi/[pertemuanId]`). Server menolak (404) pertemuan yang belum dilalui,
 * jadi URL langsung ke materi yang belum diajarkan tidak membuka apa pun. Tombol "Saya sudah paham" hanya
 * muncul untuk materi pertemuan sesi yang sedang berlangsung.
 */
export default async function HalamanMateriSiswa({ params }) {
  const k = await konteksSiswa();
  const { pertemuanId } = await params;
  const materi = await atau404(() => ambilDep().materiController.untukSiswa({ pertemuanId }, k.sesiSiswa));
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null} menuTerbuka={k.menuTerbuka}>
      <article className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        <header className="flex items-center gap-3">
          <Maskot suasana="semangat" ukuran={88} />
          <div className="space-y-1">
            <p className="font-semibold text-muted">
              {materi.levelKode} · {t('materi.pertemuanNomor', { nomor: materi.nomor })}
            </p>
            <h1 className="font-display text-[1.8em] leading-tight font-bold">{materi.judul}</h1>
          </div>
        </header>
        <IsiMateri isi={materi.isi} />
        <PenutupMateri pertemuanId={materi.pertemuanId} bisaPaham={materi.bisaPaham} sudahPaham={materi.sudahPaham} pertemuanSesi={materi.pertemuanSesi} adaSesi={materi.adaSesi} />
      </article>
    </ShellSiswa>
  );
}
