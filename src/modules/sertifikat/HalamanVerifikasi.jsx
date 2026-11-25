import { ambilDep } from '@/di/container';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { formatNilai, formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import BingkaiPengelola from '@/modules/layout/BingkaiPengelola';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';

/** Tampilan per keadaan verifikasi: nada lencana dan ikon (status tidak hanya bergantung warna). */
const KEADAAN = {
  sah: { nada: 'sukses', ikon: 'sukses' },
  dibatalkan: { nada: 'bahaya', ikon: 'salah' },
  tidakDitemukan: { nada: 'netral', ikon: 'peringatan' },
};

/** Metadata halaman verifikasi: judul dengan nama pelatihan dan larangan diindeks mesin pencari. */
export async function metadataVerifikasi() {
  const { namaPelatihan } = await ambilDep().pengaturanController.branding();
  return { title: `${t('judulHalaman.verifikasi')} · ${namaPelatihan}`, robots: { index: false, follow: false } };
}

/** Satu baris data sertifikat (label: isi). */
function Baris({ label, isi }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{isi}</dd>
    </div>
  );
}

/**
 * Halaman verifikasi sertifikat publik (E4), tanpa login, gaya area pengelola (netral). Hanya data yang diizinkan:
 * sah -> nomor, nama, level, nilai, tanggal, penerbit; dibatalkan -> nomor dan status; selain itu pesan netral.
 */
export default async function HalamanVerifikasi({ params }) {
  const { token } = await params;
  const dep = ambilDep();
  const [hasil, branding, info] = await Promise.all([dep.sertifikatController.verifikasi(token), dep.pengaturanController.branding(), infoPermintaan()]);
  const k = KEADAAN[hasil.status];
  return (
    <BingkaiPengelola branding={branding} basis={info.basis}>
      <Card varian="terangkat" className="w-full max-w-lg space-y-4">
        <h1 className="text-[1.4em] font-bold">{t('sertifikat.verifikasiJudul')}</h1>
        <Badge nada={k.nada} className="text-[1.1em]">
          <Ikon nama={k.ikon} />
          {t(`sertifikat.verifikasi.${hasil.status}`)}
        </Badge>
        <p className="text-muted">{t(`sertifikat.verifikasiPesan.${hasil.status}`)}</p>
        {/* tidak ditemukan: tanpa data apa pun */}
        {hasil.nomor && (
          <dl className="space-y-2">
            <Baris label={t('sertifikat.nomor')} isi={<span className="font-mono">{hasil.nomor}</span>} />
            {hasil.status === 'sah' && (
              <>
                <Baris label={t('sertifikat.namaSiswa')} isi={hasil.namaSiswa} />
                <Baris label={t('sertifikat.level')} isi={hasil.namaLevel} />
                <Baris label={t('sertifikat.nilai')} isi={formatNilai(hasil.nilaiTotal)} />
                <Baris label={t('sertifikat.tanggalTerbit')} isi={formatTanggal(hasil.diterbitkanAt)} />
                <Baris label={t('sertifikat.penerbit')} isi={hasil.penerbit} />
              </>
            )}
          </dl>
        )}
      </Card>
    </BingkaiPengelola>
  );
}
