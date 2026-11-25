import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { formatRupiah } from '@/utils/format';
import { t } from '@/utils/i18n';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';

/** Satu kartu ringkas beranda: angka besar, label, dan tautan ke halaman terkait (seluruh kartu bisa diklik). */
function KartuRingkas({ href, ikon, label, nilai, keterangan = null }) {
  return (
    <li>
      <Link href={href} className="flex h-full items-start gap-3 rounded-lg border border-line bg-panel p-4 hover:border-primary hover:bg-primary-soft">
        <Ikon nama={ikon} ukuran="1.75em" className="mt-1 text-primary-text" />
        <span className="min-w-0 space-y-0.5">
          <span className="block text-muted">{label}</span>
          <span className="block break-words text-[1.6em] font-bold">{nilai}</span>
          {keterangan && <span className="block text-[0.9em] text-muted">{keterangan}</span>}
        </span>
      </Link>
    </li>
  );
}

/**
 * Beranda backoffice (F4): sapaan dan kartu ringkas (siswa aktif, sesi berlangsung, post test menunggu penilaian,
 * sertifikat terbit bulan ini); kartu total pembayaran bulan ini hanya untuk admin.
 */
export default async function HalamanBerandaPengelola() {
  const sesi = await wajibPengguna();
  const [r, info] = await Promise.all([ambilDep().raporController.beranda(null, sesi), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5em] font-bold">{t('beranda.halo', { nama: sesi.nama })}</h1>
        <TautanTombol href={href('/absensi')} ikon="absensi">
          {t('beranda.keAbsensi')}
        </TautanTombol>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KartuRingkas href={href('/data-siswa?status=aktif')} ikon="siswa" label={t('beranda.kartu.siswaAktif')} nilai={r.siswaAktif} />
        <KartuRingkas href={href('/absensi')} ikon="absensi" label={t('beranda.kartu.sesiBerlangsung')} nilai={r.sesiBerlangsung} />
        <KartuRingkas href={href('/post-test?tab=menunggu')} ikon="target" label={t('beranda.kartu.postTestMenunggu')} nilai={r.postTestMenunggu} />
        <KartuRingkas href={href('/sertifikat?status=terbit')} ikon="sertifikat" label={t('beranda.kartu.sertifikatBulanIni')} nilai={r.sertifikatBulanIni} />
        {/* rekap keuangan hanya dihitung dan ditampilkan untuk admin */}
        {r.pembayaran && <KartuRingkas href={href('/ekspor')} ikon="bayar" label={t('beranda.kartu.pembayaranBulanIni')} nilai={formatRupiah(r.pembayaran.total)} keterangan={t('beranda.kartu.jumlahCatatan', { jumlah: r.pembayaran.jumlah })} />}
      </ul>
    </div>
  );
}
