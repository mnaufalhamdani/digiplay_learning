import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import { PERAN, STATUS_SISWA_LEVEL } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Tabs from '@/modules/shared/ui/Tabs';
import BagianPembayaran from '@/modules/pembayaran/BagianPembayaran';
import RiwayatSesiSiswa from '@/modules/sesi/RiwayatSesiSiswa';
import TabLatihanSiswa from '@/modules/latihan/TabLatihanSiswa';
import TabPostTestSiswa from '@/modules/posttest/TabPostTestSiswa';
import TabSertifikatSiswa from '@/modules/sertifikat/TabSertifikatSiswa';
import GaleriKarya from '@/modules/karya/GaleriKarya';
import { AksiKaryaPengelola } from '@/modules/karya/AksiKarya';
import EmptyState from '@/modules/shared/ui/EmptyState';
import AksiSiswa from './AksiSiswa';
import LencanaSiswa from './LencanaSiswa';

/** Nada lencana per status keikutsertaan level. */
const NADA_LEVEL = { [STATUS_SISWA_LEVEL.BERJALAN]: 'info', [STATUS_SISWA_LEVEL.LULUS]: 'sukses', [STATUS_SISWA_LEVEL.BERHENTI]: 'netral' };

/** Kartu level berjalan dan riwayat level siswa. */
function KartuLevel({ siswa }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-[1.15em] font-bold">{t('dataSiswa.level')}</h2>
      <p>
        {t('dataSiswa.levelBerjalan')}:{' '}
        {/* siswa lama (mis. data uji Fase A) bisa belum punya level berjalan */}
        <strong>{siswa.level_nama ? `${siswa.level_kode} · ${siswa.level_nama}` : t('dataSiswa.tanpaLevel')}</strong>
      </p>
      <h3 className="font-semibold">{t('dataSiswa.riwayatLevel')}</h3>
      {siswa.riwayatLevel.length === 0 ? (
        <p className="text-muted">{t('dataSiswa.belumAdaRiwayat')}</p>
      ) : (
        <ul className="space-y-2">
          {siswa.riwayatLevel.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {r.level_kode} · {r.level_nama}
              </span>
              <Badge nada={NADA_LEVEL[r.status]}>{t(`dataSiswa.statusLevel.${r.status}`)}</Badge>
              <span className="text-muted">
                {formatTanggal(r.mulai_at)} – {r.selesai_at ? formatTanggal(r.selesai_at) : t('dataSiswa.sekarang')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Detail siswa: profil, level, kode akses, riwayat sesi (menyusul di Fase C), dan aksi. */
export default async function HalamanDetailSiswa({ params }) {
  const sesi = await wajibPengguna();
  const { id } = await params;
  const dep = ambilDep();
  const [siswa, level, info] = await Promise.all([atau404(() => dep.siswaController.detail({ id })), dep.siswaController.pilihanLevel(), infoPermintaan()]);
  const [riwayat, pembayaran, mengetik, latihan, postTest, sertifikat, karya] = await Promise.all([
    dep.sesiController.riwayatSiswa(siswa.id),
    dep.pembayaranController.daftarSiswa(siswa.id),
    dep.mengetikController.statistikSiswa(siswa.id),
    dep.latihanController.statistikSiswa(siswa.id),
    dep.posttestController.riwayatSiswa(siswa.id),
    dep.sertifikatController.riwayatSiswa(siswa.id),
    dep.karyaController.daftarSiswa(siswa.id),
  ]);
  const adminkah = sesi.peran === PERAN.ADMIN;
  const opsiLevel = level.map((l) => ({ nilai: l.id, label: `${l.kode} · ${l.nama}` }));
  return (
    <div className="space-y-4">
      <TautanTombol href={gabungJalur(info.basis, '/data-siswa')} varian="hantu" ikon="kembali">
        {t('dataSiswa.kembali')}
      </TautanTombol>
      <div className="space-y-1">
        <h1 className="text-[1.5em] font-bold">{siswa.nama}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <LencanaSiswa status={siswa.status} />
          <span className="text-muted">{t('dataSiswa.terdaftar', { tanggal: formatTanggal(siswa.tanggal_daftar) })}</span>
        </div>
      </div>
      <KartuLevel siswa={siswa} />
      <Card>
        <Tabs
          tab={[
            { id: 'riwayat', label: t('dataSiswa.tabRiwayat'), isi: <RiwayatSesiSiswa riwayat={riwayat} hrefSesi={(sesiId) => gabungJalur(info.basis, `/absensi/${sesiId}`)} /> },
            { id: 'pembayaran', label: t('dataSiswa.tabPembayaran'), isi: <BagianPembayaran siswaId={siswa.id} daftar={pembayaran} adminkah={adminkah} denganTanggal /> },
            { id: 'latihan', label: t('dataSiswa.tabLatihan'), isi: <TabLatihanSiswa mengetik={mengetik} latihan={latihan} /> },
            { id: 'posttest', label: t('dataSiswa.tabPostTest'), isi: <TabPostTestSiswa riwayat={postTest} hrefDetail={(id) => gabungJalur(info.basis, `/post-test/${id}`)} /> },
            { id: 'sertifikat', label: t('dataSiswa.tabSertifikat'), isi: <TabSertifikatSiswa riwayat={sertifikat} /> },
            {
              id: 'karya',
              label: t('dataSiswa.tabKarya'),
              // tab hanya memuat halaman pertama; selebihnya di halaman Karya dengan filter siswa ini
              isi: <GaleriKarya data={karya} aksi={(k) => <AksiKaryaPengelola k={k} />} hrefHalaman={(n) => gabungJalur(info.basis, jalurQuery('/karya', { siswaId: siswa.id, halaman: n }))} kosong={<EmptyState judul={t('karya.kosong')} ikon="gambar" />} />,
            },
          ]}
        />
      </Card>
      <AksiSiswa siswa={siswa} opsiLevel={opsiLevel} adminkah={adminkah} />
    </div>
  );
}
