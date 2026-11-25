import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { formatDurasi, formatJam } from '@/utils/format';
import { t } from '@/utils/i18n';
import { KUNCI_PENGATURAN } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import EmptyState from '@/modules/shared/ui/EmptyState';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import AksiSesi from './AksiSesi';
import FormAbsen from './FormAbsen';
import { LencanaLogin } from './LencanaSesi';

/** Satu kartu sesi berlangsung (C3.2): siswa, level, pertemuan, jam masuk, lama, login, progres, tutor, dan aksi. */
function KartuSesi({ s, idSaya, href }) {
  const sudah = s.tutor.some((x) => x.id === idSaya);
  return (
    <Card as="article" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={href} className="text-[1.1em] font-bold text-primary-text underline">
            {s.siswa_nama}
          </Link>
          <p className="text-muted">
            {s.level_kode} · P{s.pertemuan_nomor} {s.pertemuan_judul}
          </p>
        </div>
        <LencanaLogin aktif={s.login_aktif} />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-[0.95em] sm:grid-cols-4">
        <div>
          <dt className="text-muted">{t('absensi.jamMasuk')}</dt>
          <dd className="font-semibold">{formatJam(s.jam_masuk)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('absensi.lama')}</dt>
          <dd className="font-semibold">{formatDurasi(s.lama_detik)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('absensi.tugas')}</dt>
          <dd className="font-semibold">{t('absensi.tugasSelesai', { selesai: s.tugas_selesai, total: s.tugas_total })}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('absensi.tutor')}</dt>
          <dd className="font-semibold">{s.tutor.map((x) => x.nama).join(', ') || '-'}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <TautanTombol href={href} varian="secondary">
          {t('absensi.detail')}
        </TautanTombol>
        <AksiSesi sesiId={s.id} namaSiswa={s.siswa_nama} sudahMenangani={sudah} />
      </div>
    </Card>
  );
}

/** Halaman Absensi (C3): form Absen masuk dan daftar Sesi berlangsung; tata letak satu kolom di HP. */
export default async function HalamanAbsensi() {
  const sesi = await wajibPengguna();
  const dep = ambilDep();
  const [daftar, tutor, pengaturan, info] = await Promise.all([
    dep.sesiController.daftarBerlangsung(),
    dep.sesiController.pilihanTutor(null, sesi),
    dep.pengaturanController.semua(),
    infoPermintaan(),
  ]);
  const panjang = Number(pengaturan[KUNCI_PENGATURAN.PANJANG_KODE_AKSES]);
  return (
    <div className="space-y-6">
      <h1 className="text-[1.5em] font-bold">{t('menu.absensi')}</h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div>
          <FormAbsen panjangKode={panjang} tutor={tutor} />
        </div>
        <section className="space-y-3">
          <h2 className="text-[1.15em] font-bold">{t('absensi.berlangsung', { jumlah: daftar.length })}</h2>
          {/* belum ada siswa yang diabsen */}
          {daftar.length === 0 ? (
            <EmptyState judul={t('absensi.kosong')} ikon="absensi" />
          ) : (
            <div className="space-y-3">
              {daftar.map((s) => (
                <KartuSesi key={s.id} s={s} idSaya={sesi.id} href={gabungJalur(info.basis, `/absensi/${s.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
