import { ambilDep } from '@/di/container';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';
import { AksiKaryaSiswa } from './AksiKarya';
import FormKarya from './FormKarya';
import GaleriKarya from './GaleriKarya';

/** Keadaan kosong galeri siswa dengan Zippy. */
function Kosong({ sesiAktif }) {
  return (
    <Card className="flex flex-col items-center gap-2 text-center">
      <Maskot suasana={sesiAktif ? 'menunjuk' : 'tidur'} ukuran={110} />
      <p className="font-bold">{t('karya.kosongSiswa')}</p>
      <p className="text-muted">{t(sesiAktif ? 'karya.kosongSiswaPesan' : 'karya.kosongTanpaSesi')}</p>
    </Card>
  );
}

/**
 * Galeri karya siswa (F2): bisa dilihat kapan saja; tambah, ubah, dan hapus hanya saat sesi berlangsung
 * (di luar sesi tampil keterangan bergembok, dan server tetap menolak aksi tulis).
 */
export default async function HalamanKaryaSiswa({ searchParams }) {
  const k = await konteksSiswa();
  const data = await ambilDep().karyaController.galeriSaya(await searchParams, k.sesiSiswa);
  const sesiAktif = Boolean(k.sesi);
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null} menuTerbuka={k.menuTerbuka}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Maskot suasana="semangat" ukuran={96} />
          <h1 className="font-display text-[1.8em] font-bold">{t('sesiSiswa.menu.karya')}</h1>
          <div className="ml-auto">
            {/* menambah karya hanya saat sudah diabsen */}
            {sesiAktif ? (
              <FormKarya />
            ) : (
              <Badge nada="peringatan">
                <Ikon nama="gembok" />
                {t('karya.tambahTerkunci')}
              </Badge>
            )}
          </div>
        </div>
        <GaleriKarya
          data={data}
          aksi={sesiAktif ? (x) => <AksiKaryaSiswa k={x} /> : null}
          hrefHalaman={(n) => gabungJalur(k.basis, jalurQuery('/karya', { halaman: n }))}
          kosong={<Kosong sesiAktif={sesiAktif} />}
        />
      </div>
    </ShellSiswa>
  );
}
