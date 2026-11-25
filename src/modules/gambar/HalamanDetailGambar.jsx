import Image from 'next/image';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import { PERAN } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import { TombolAktifGambar } from './AksiGambar';
import LencanaKelengkapan from './LencanaKelengkapan';

/** Ukuran asli berkas: mewarnai berupa potret (gambar + pita contoh warna), lainnya persegi. */
const UKURAN = { mewarnai: { width: 1024, height: 1334 }, bawaan: { width: 1024, height: 1024 } };

/** Detail subjek gambar: empat berkas (bila ada) dan tombol aktif/nonaktif untuk admin. */
export default async function HalamanDetailGambar({ params }) {
  const sesi = await wajibPengguna();
  const { id } = await params;
  const [g, info] = await Promise.all([atau404(() => ambilDep().gambarController.detail({ id })), infoPermintaan()]);
  return (
    <div className="space-y-4">
      <TautanTombol href={gabungJalur(info.basis, '/gambar')} varian="hantu" ikon="kembali">
        {t('gambar.kembali')}
      </TautanTombol>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[1.5em] font-bold">{g.nama}</h1>
          <p className="text-muted">
            {g.kode} · {t(`gambar.kategori.${g.kategori}`)}
            {g.namaEn ? ` · ${g.namaEn}` : ''}
          </p>
          <LencanaKelengkapan g={g} />
        </div>
        {sesi.peran === PERAN.ADMIN && <TombolAktifGambar id={g.id} aktif={g.aktif} />}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {g.berkas.map((b) => (
          <li key={b.jenis}>
            <Card className="space-y-2 p-3 sm:p-3">
              <p className="font-bold">{t(`gambar.berkas.${b.jenis}`)}</p>
              {/* berkas belum ada di folder: beri penanda berteks */}
              {b.ada ? (
                <Image src={b.url} alt={`${g.nama} - ${t(`gambar.berkas.${b.jenis}`)}`} {...(UKURAN[b.jenis] ?? UKURAN.bawaan)} sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw" className="h-auto w-full rounded-md bg-bg" />
              ) : (
                <p className="flex items-center gap-2 rounded-md bg-warn-soft p-3 font-semibold text-warn">
                  <Ikon nama="peringatan" />
                  {t('gambar.berkasBelumAda')}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
