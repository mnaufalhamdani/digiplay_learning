import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';

/** Pesan ramah dari Zippy bila belum ada materi yang bisa dibuka (siswa baru, belum absen). */
function Kosong() {
  return (
    <Card varian="terangkat" className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <Maskot suasana="tidur" ukuran={140} />
      <p className="font-display text-[1.4em] font-bold">{t('materi.daftarKosong')}</p>
      <p className="max-w-md text-muted">{t('materi.daftarKosongPesan')}</p>
    </Card>
  );
}

/** Satu level beserta materi yang sudah dilalui, berurutan menurut nomor pertemuan. */
function KelompokLevel({ level, basis }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[1.4em] font-bold">
        {level.levelKode} · {level.levelNama}
      </h2>
      <ul className="space-y-3">
        {level.materi.map((m) => (
          <li key={m.pertemuanId}>
            <Link href={gabungJalur(basis, `/materi/${m.pertemuanId}`)} className="flex min-h-14 items-center gap-3 rounded-lg border-2 border-line bg-panel p-3 hover:bg-primary-soft sm:p-4">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-[1.3em] font-bold text-on-primary">
                {m.nomor}
              </span>
              <span className="min-w-0 flex-1 text-[1.1em] font-bold">
                <span className="sr-only">{t('materi.pertemuanNomor', { nomor: m.nomor })}: </span>
                {m.judul}
              </span>
              {m.sudahPaham && (
                <Badge nada="sukses">
                  <Ikon nama="sukses" />
                  {t('materi.sudahPaham')}
                </Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Menu Materi siswa: pustaka materi yang sudah dilalui (semua level, urut level lalu pertemuan). Bisa dibuka sebelum
 * maupun sesudah absen. Pertemuan yang belum diajarkan tidak ikut dikirim dari server, jadi tidak ada di HTML maupun data.
 */
export default async function HalamanDaftarMateriSiswa() {
  const k = await konteksSiswa();
  const daftar = await ambilDep().materiController.daftarSiswa(null, k.sesiSiswa);
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Maskot suasana="semangat" ukuran={88} />
          <h1 className="font-display text-[1.8em] font-bold">{t('materi.judul')}</h1>
        </div>
        {daftar.length === 0 ? <Kosong /> : daftar.map((level) => <KelompokLevel key={level.levelId} level={level} basis={k.basis} />)}
      </div>
    </ShellSiswa>
  );
}
