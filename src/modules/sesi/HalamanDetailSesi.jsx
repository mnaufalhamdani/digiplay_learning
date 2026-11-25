import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { formatDurasi, formatJam, formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import { PERAN, STATUS_SESI } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import BagianPembayaran from '@/modules/pembayaran/BagianPembayaran';
import DaftarTugasTutor from '@/modules/tugas/DaftarTugasTutor';
import AksiSesi from './AksiSesi';
import CatatanSesi from './CatatanSesi';
import FormPenuntasan from './FormPenuntasan';
import { LencanaLogin, LencanaStatusSesi } from './LencanaSesi';

/** Kepala detail sesi: siswa, level, pertemuan, status, jam, dan aksi sesi berlangsung. */
function KepalaSesi({ s, idSaya, hrefSiswa }) {
  const berlangsung = s.status === STATUS_SESI.BERLANGSUNG;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[1.5em] font-bold">
            <Link href={hrefSiswa} className="underline">
              {s.siswa_nama}
            </Link>
          </h1>
          <p className="text-muted">
            {s.level_kode} {s.level_nama} · P{s.pertemuan_nomor} {s.pertemuan_judul}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <LencanaStatusSesi status={s.status} />
            {berlangsung && <LencanaLogin aktif={s.login_aktif} />}
            <span className="text-muted">
              {formatTanggal(s.tanggal)} · {formatJam(s.jam_masuk)}–{formatJam(s.jam_pulang)} ({formatDurasi(s.lama_detik)})
            </span>
          </div>
        </div>
        {berlangsung && (
          <div className="flex flex-wrap gap-2">
            <AksiSesi sesiId={s.id} namaSiswa={s.siswa_nama} sudahMenangani={s.tutor.some((x) => x.id === idSaya)} />
          </div>
        )}
      </div>
      {/* sebagian template dilewati saat generate karena bank gambarnya kosong */}
      {s.templateDilewati.length > 0 && (
        <p role="status" className="flex items-start gap-2 rounded-md bg-warn-soft p-3 font-semibold text-warn">
          <Ikon nama="peringatan" className="mt-0.5" />
          {t('absensi.peringatanGambar', { daftar: s.templateDilewati.join(', ') })}
        </p>
      )}
    </div>
  );
}

/** Detail sesi (C4), juga untuk sesi yang sudah selesai: tugas, penuntasan, catatan, dan pembayaran. */
export default async function HalamanDetailSesi({ params }) {
  const sesi = await wajibPengguna();
  const { sesiId } = await params;
  const [s, info] = await Promise.all([atau404(() => ambilDep().sesiController.detail({ sesiId })), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  return (
    <div className="space-y-4">
      <TautanTombol href={href('/absensi')} varian="hantu" ikon="kembali">
        {t('detailSesi.kembali')}
      </TautanTombol>
      <KepalaSesi s={s} idSaya={sesi.id} hrefSiswa={href(`/data-siswa/${s.siswa_id}`)} />
      <section className="space-y-3">
        <h2 className="text-[1.15em] font-bold">{t('detailSesi.tugas', { selesai: s.tugas_selesai, total: s.tugas_total })}</h2>
        <DaftarTugasTutor tugas={s.tugas} berlangsung={s.status === STATUS_SESI.BERLANGSUNG} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-[1.15em] font-bold">{t('detailSesi.penuntasan')}</h2>
          <FormPenuntasan sesiId={s.id} otomatis={s.penuntasan_otomatis} tutor={s.penuntasan_tutor} akhir={s.penuntasan_akhir} sumber={s.penuntasan_sumber} />
        </Card>
        <Card className="space-y-3">
          <h2 className="text-[1.15em] font-bold">{t('detailSesi.catatan')}</h2>
          <CatatanSesi sesiId={s.id} tutor={s.tutor} idSaya={sesi.id} />
        </Card>
      </div>
      <Card className="space-y-3">
        <h2 className="text-[1.15em] font-bold">{t('detailSesi.pembayaran')}</h2>
        <BagianPembayaran siswaId={s.siswa_id} sesiId={s.id} daftar={s.pembayaran} adminkah={sesi.peran === PERAN.ADMIN} />
      </Card>
    </div>
  );
}
