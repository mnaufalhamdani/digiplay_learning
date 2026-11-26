import { redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';

/**
 * Tugas bertipe blockly milik siswa dari `?tugas=` (hanya saat sesi berlangsung, belum selesai, dan tidak terkunci
 * materi); selain itu null. Dipakai untuk meneruskan tombol di kartu tugas langsung ke labirin yang diminta.
 */
async function tugasBlockly(searchParams, k) {
  const { tugas } = await searchParams;
  const data = k.sesi && tugas ? await ambilDep().tugasController.untukLatihan(String(tugas), k.sesiSiswa) : null;
  return data?.tipe === 'blockly' ? data : null;
}

/** Satu kartu labirin: nomor, nama, batas blok, tanda sudah selesai, dan tombol Main. */
function KartuLabirin({ labirin, nomor, basis }) {
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-[1.3em] font-bold text-on-primary">
          {nomor}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[1.2em] font-bold">{labirin.nama}</p>
          <p className="text-muted">{t('blockly.batasKartu', { batas: labirin.batas_blok })}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TautanTombol href={gabungJalur(basis, `/coding-zippy/${labirin.kode}`)} ukuran="lg" ikon="main">
          {t('blockly.main')}
        </TautanTombol>
        {labirin.sudahSelesai && (
          <Badge nada="sukses">
            <Ikon nama="sukses" />
            {t('blockly.sudahSelesai')}
          </Badge>
        )}
      </div>
    </Card>
  );
}

/**
 * Menu Coding Zippy (siswa): daftar labirin berurutan beserta tanda sudah selesai. Bisa dibuka tanpa sesi (mencoba saja).
 * Dari tombol di kartu tugas (`?tugas=`) siswa langsung diteruskan ke labirin yang diminta tugas itu.
 */
export default async function HalamanCodingZippy({ searchParams }) {
  const k = await konteksSiswa();
  const dep = ambilDep();
  const tugas = await tugasBlockly(searchParams, k);
  const kode = tugas ? await dep.blocklyController.kodeDariNama(tugas.kunci.labirin) : null;
  // labirin yang diminta tugas ketemu: langsung ke sana (tanpa lewat daftar)
  if (kode) redirect(gabungJalur(k.basis, `/coding-zippy/${kode}?tugas=${tugas.id}`));
  const daftar = await dep.blocklyController.daftar(null, k.sesiSiswa);
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Maskot suasana="menunjuk" ukuran={96} />
          <div className="space-y-1">
            <h1 className="font-display text-[1.8em] font-bold">{t('blockly.judul')}</h1>
            <p className="text-muted">{t('blockly.pengantar')}</p>
          </div>
        </div>
        {daftar.length === 0 ? (
          <Card className="text-center font-semibold">{t('blockly.kosong')}</Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {daftar.map((l, i) => (
              <KartuLabirin key={l.kode} labirin={l} nomor={i + 1} basis={k.basis} />
            ))}
          </ul>
        )}
      </div>
    </ShellSiswa>
  );
}
