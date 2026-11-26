import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { formatWaktu } from '@/utils/format';
import { t } from '@/utils/i18n';
import { PENILAIAN } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import EmptyState from '@/modules/shared/ui/EmptyState';
import Ikon from '@/modules/shared/ui/Ikon';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import StatusSertifikatPostTest from '@/modules/sertifikat/StatusSertifikatPostTest';
import BukaTesUlang from './BukaTesUlang';
import LencanaPostTest from './LencanaPostTest';
import PenilaianPraktik from './PenilaianPraktik';

/** Tab daftar post test. */
const TAB = ['menunggu', 'berlangsung', 'selesai'];

/** Halaman daftar post test (pengelola, D2.6): tab Menunggu penilaian, Berlangsung, Selesai. */
export async function HalamanDaftarPostTest({ searchParams }) {
  await wajibPengguna();
  const { tab: tabMentah } = await searchParams;
  const tab = TAB.includes(tabMentah) ? tabMentah : 'menunggu';
  const [daftar, info] = await Promise.all([ambilDep().posttestController.daftar(tab), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const kolom = [
    { label: t('posttest.siswa'), isi: (p) => <Link href={href(`/post-test/${p.id}`)} className="font-semibold text-primary-text underline">{p.siswa_nama}</Link> },
    { label: t('posttest.levelPercobaan'), isi: (p) => t('posttest.percobaanKe', { level: p.level_kode, ke: p.percobaan_ke }) },
    { label: t('posttest.kolomKeadaan'), isi: (p) => <LencanaPostTest pt={p} /> },
    { label: t('posttest.total'), isi: (p) => p.nilai_total ?? '-' },
    { label: t('posttest.waktu'), isi: (p) => formatWaktu(p.selesai_at ?? p.mulai_at) },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-[1.5em] font-bold">{t('menu.postTest')}</h1>
      <nav aria-label={t('posttest.tabLabel')} className="flex gap-1 overflow-x-auto border-b-2 border-line">
        {TAB.map((x) => (
          <Link key={x} href={href(jalurQuery('/post-test', { tab: x }))} aria-current={x === tab ? 'page' : undefined} className={`-mb-0.5 min-h-11 shrink-0 border-b-2 px-4 py-2 font-bold ${x === tab ? 'border-primary text-primary-text' : 'border-transparent text-muted'}`}>
            {t(`posttest.tab.${x}`)}
          </Link>
        ))}
      </nav>
      {daftar.length === 0 ? <EmptyState judul={t('posttest.kosong')} ikon="target" /> : <TabelResponsif kolom={kolom} baris={daftar} />}
    </div>
  );
}

/** Satu butir di detail: soal, jawaban dan benar/salah (otomatis) atau status penilaian tutor (praktik; dinilai di panel Butir praktik). */
function ButirPengelola({ x, nomor }) {
  const otomatis = x.penilaian === PENILAIAN.OTOMATIS;
  return (
    <li className="space-y-2 rounded-md border border-line bg-bg p-3">
      <p className="text-[0.85em] text-muted">
        {nomor}. {x.template_kode}
      </p>
      <p className="whitespace-pre-wrap">{x.soal}</p>
      {otomatis ? (
        <p className="flex flex-wrap items-center gap-2">
          {t('detailSesi.jawabanSiswa')}: <strong>{x.jawaban ?? '-'}</strong>
          <Badge nada={x.benar ? 'sukses' : 'bahaya'}>
            <Ikon nama={x.benar ? 'sukses' : 'salah'} />
            {t(x.benar ? 'detailSesi.benar' : 'detailSesi.salah')}
          </Badge>
          <span className="text-muted">
            ({t('detailSesi.jawabanHarapan')}: {x.harapan ?? '-'})
          </span>
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-2">
          <Badge nada={x.dinilai ? 'sukses' : 'peringatan'}>{t(x.dinilai ? 'posttest.butirDinilai' : 'posttest.butirMenunggu')}</Badge>
          {x.dinilai && (
            <strong>
              {x.skor} / {x.maks}
            </strong>
          )}
        </p>
      )}
    </li>
  );
}

/** Kartu satu bagian: nilai, sumber, dan butirnya. */
function KartuBagian({ b, butir }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[1.1em] font-bold">
          {b.kode}. {b.nama} <span className="font-normal text-muted">({t('posttest.bobot', { bobot: b.bobot })})</span>
        </h2>
        <span className="font-bold">
          {b.nilai ?? '-'} {b.sumber_nilai && <span className="font-normal text-muted">({t(`absensi.sumber.${b.sumber_nilai}`)}{b.dinilai_nama ? `, ${b.dinilai_nama}` : ''})</span>}
        </span>
      </div>
      {butir.length > 0 && (
        <ol className="space-y-2">
          {butir.map((x, i) => (
            <ButirPengelola key={x.id} x={x} nomor={i + 1} />
          ))}
        </ol>
      )}
      {b.sumber === 'tes_mengetik' && <p className="text-muted">{t('posttest.mengetikOtomatis')}</p>}
    </Card>
  );
}

/** Detail post test (pengelola): butir praktik yang perlu dinilai, nilai per bagian, butir, dan Buka tes ulang. */
export async function HalamanDetailPostTest({ params }) {
  await wajibPengguna();
  const { id } = await params;
  const [pt, info] = await Promise.all([atau404(() => ambilDep().posttestController.detail({ id })), infoPermintaan()]);
  const statusSertifikat = await ambilDep().sertifikatController.statusPostTest(pt);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  return (
    <div className="space-y-4">
      <TautanTombol href={href('/post-test')} varian="hantu" ikon="kembali">
        {t('menu.postTest')}
      </TautanTombol>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[1.5em] font-bold">
            <Link href={href(`/data-siswa/${pt.siswa_id}`)} className="underline">
              {pt.siswa_nama}
            </Link>
          </h1>
          <p className="text-muted">{t('posttest.percobaanKe', { level: `${pt.level_kode} ${pt.level_nama}`, ke: pt.percobaan_ke })}</p>
          <div className="flex flex-wrap items-center gap-2">
            <LencanaPostTest pt={pt} />
            {pt.nilai_total != null && <span className="font-bold">{t('posttest.nilaiTotal', { total: pt.nilai_total })}</span>}
          </div>
        </div>
        {pt.bisaTesUlang && <BukaTesUlang ptId={pt.id} bagian={pt.bagian} bawaan={pt.bagianUlangBawaan} />}
      </div>
      <StatusSertifikatPostTest status={statusSertifikat} siswaId={pt.siswa_id} levelId={pt.level_id} />
      <PenilaianPraktik pt={pt} />
      {pt.bagian.map((b) => (
        <KartuBagian key={b.id} b={b} butir={pt.butir.filter((x) => x.bagian_id === b.id)} />
      ))}
    </div>
  );
}
