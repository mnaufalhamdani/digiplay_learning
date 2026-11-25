import { t } from '@/utils/i18n';
import { JENIS_GAMBAR_UNDUH, STATUS_TUGAS } from '@/enums';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import EmptyState from '@/modules/shared/ui/EmptyState';
import KartuGambar from '@/modules/shared/ui/domain/KartuGambar';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { konteksSiswa } from './konteksSiswa';
import LihatSaja from './LihatSaja';

/** Bahan unduhan dari tugas sesi berlangsung (tanpa tugas yang diganti), satu kartu per gambar per tugas. */
function daftarBahan(sesi) {
  return sesi.tugas
    .filter((x) => x.status !== STATUS_TUGAS.DIGANTI)
    .flatMap((x) => x.gambar.filter((g) => JENIS_GAMBAR_UNDUH.includes(g.jenis)).map((g) => ({ ...g, tugasId: x.id })));
}

/** Halaman Bahan (siswa, D1.6): gambar mewarnai/berwarna dari tugas sesi ini; di luar sesi mode lihat saja. */
export default async function HalamanBahan() {
  const k = await konteksSiswa();
  const bahan = k.sesi ? daftarBahan(k.sesi) : [];
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      {!k.sesi ? (
        <LihatSaja judul={t('sesiSiswa.menu.bahan')} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Maskot suasana="menunjuk" ukuran={96} />
            <h1 className="font-display text-[1.8em] font-bold">{t('sesiSiswa.menu.bahan')}</h1>
          </div>
          {/* tugas sesi ini tidak memakai gambar */}
          {bahan.length === 0 ? (
            <EmptyState judul={t('bahan.kosong')} pesan={t('bahan.kosongPesan')} ikon="gambar" />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {bahan.map((g) => (
                <KartuGambar key={`${g.tugasId}-${g.kode}`} nama={g.nama} jenis={g.jenis} kode={g.kode} hrefUnduh={`/api/v1/tugas/unduh?tugasId=${g.tugasId}&kode=${encodeURIComponent(g.kode)}`} />
              ))}
            </ul>
          )}
        </div>
      )}
    </ShellSiswa>
  );
}
