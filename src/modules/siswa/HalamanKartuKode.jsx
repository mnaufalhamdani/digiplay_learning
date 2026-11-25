import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import TombolCetak from './TombolCetak';

/** Kode dipisah per 4 karakter agar mudah dibaca dari kertas. */
function kelompokkan(kode) {
  return String(kode ?? '-').replace(/(.{4})(?=.)/g, '$1 ');
}

/** Satu baris kode di kartu cetak. */
function BarisKode({ label, kode, petunjuk }) {
  return (
    <div className="rounded-md border-2 border-dashed border-line p-3">
      <p className="text-[0.9em] text-muted">{label}</p>
      <p className="font-mono text-[1.75em] font-bold tracking-widest">{kelompokkan(kode)}</p>
      <p className="text-[0.85em] text-muted">{petunjuk}</p>
    </div>
  );
}

/**
 * Halaman cetak kartu kode (di luar kerangka pengelola agar kertas bersih): nama siswa, kode siswa,
 * kode orang tua, dan alamat situs siswa. Hanya untuk admin/tutor yang login.
 */
export default async function HalamanKartuKode({ params }) {
  await wajibPengguna();
  const { id } = await params;
  const dep = ambilDep();
  const [kartu, branding] = await Promise.all([atau404(() => dep.siswaController.kartuKode({ id })), dep.pengaturanController.branding()]);
  return (
    <div data-area="pengelola" className="min-h-dvh bg-bg p-4 font-body text-fg print:bg-transparent print:p-0">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex justify-end print:hidden">
          <TombolCetak />
        </div>
        <section className="space-y-4 rounded-lg border-2 border-line bg-panel p-6 print:border-fg">
          <div>
            <p className="font-bold">{branding.namaPelatihan}</p>
            <h1 className="text-[1.5em] font-bold">{kartu.nama}</h1>
          </div>
          <BarisKode label={t('dataSiswa.kodeSiswa')} kode={kartu.kode.siswa} petunjuk={t('dataSiswa.kartuPetunjukSiswa')} />
          <BarisKode label={t('dataSiswa.kodeOrtu')} kode={kartu.kode.ortu} petunjuk={t('dataSiswa.kartuPetunjukOrtu')} />
          <p>
            {t('dataSiswa.kartuAlamat')} <strong className="break-all">{kartu.urlSiswa}</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
