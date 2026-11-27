import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { formatRupiah } from '@/utils/format';
import { t } from '@/utils/i18n';
import BatangHorizontal from '@/modules/shared/ui/BatangHorizontal';
import Card from '@/modules/shared/ui/Card';
import GrafikBatang from '@/modules/shared/ui/GrafikBatang';
import GrafikTumpuk from '@/modules/shared/ui/GrafikTumpuk';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import KartuAngka from '@/modules/shared/ui/KartuAngka';
import KartuGrafik from '@/modules/shared/ui/KartuGrafik';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import { namaBulan, namaHariTanggal } from './dashboard.helper';
import FilterDashboard from './FilterDashboard';
import PembungkusDashboard from './PembungkusDashboard';

/** Tanggal panjang dengan nama hari, mis. "Kamis, 27 November 2026" (dari teks "YYYY-MM-DD" database). */
function tanggalPanjang(tanggal) {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Kartu "Sesi berlangsung sekarang": ringkasan dan tombol utama Absen masuk (posisi shortcut Absensi di semua ukuran layar). */
function KartuSesi({ bagian, href }) {
  const d = bagian.data;
  const sisa = d ? d.siswa - d.contoh.length : 0;
  return (
    <Card varian="berwarna" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h2 className="flex items-center gap-2 font-bold">
          <Ikon nama="absensi" className="text-primary-text" />
          {t('beranda.dashboard.sesi.judul')}
        </h2>
        {bagian.galat && <p className="text-bad">{t('beranda.dashboard.galatKartu')}</p>}
        {d && d.siswa === 0 && <p>{t('beranda.dashboard.sesi.kosong')}</p>}
        {d && d.siswa > 0 && (
          <>
            <p className="font-semibold">{t('beranda.dashboard.sesi.ringkas', { siswa: d.siswa, tutor: d.tutor })}</p>
            <p className="text-[0.9em] text-muted">
              {d.contoh.map((s) => t('beranda.dashboard.sesi.contoh', { nama: s.siswa_nama, nomor: s.pertemuan_nomor })).join(', ')}
              {sisa > 0 && `, ${t('beranda.dashboard.sesi.dan', { jumlah: sisa })}`}
            </p>
          </>
        )}
        <Link href={href('/absensi')} className="inline-flex min-h-11 items-center font-bold text-primary-text underline">
          {t('beranda.dashboard.sesi.lihat')}
        </Link>
      </div>
      <TautanTombol href={href('/absensi')} ikon="absensi" ukuran="lg" className="w-full shrink-0 sm:w-auto">
        {t('beranda.dashboard.absenMasuk')}
      </TautanTombol>
    </Card>
  );
}

/** Keterangan kartu "Sesi 7 hari terakhir": naik, turun, atau sama dibanding 7 hari sebelumnya. */
function keteranganSesi7(d) {
  const selisih = d.ini - d.sebelumnya;
  if (selisih > 0) return { teks: t('beranda.dashboard.kartu.naik', { jumlah: selisih }), nada: 'baik' };
  if (selisih < 0) return { teks: t('beranda.dashboard.kartu.turun', { jumlah: -selisih }), nada: 'muted' };
  return { teks: t('beranda.dashboard.kartu.sama'), nada: 'muted' };
}

/** Keterangan kartu "Post test menunggu dinilai": usia terlama dalam hari, atau penanda tidak ada yang menunggu. */
function keteranganMenunggu(d) {
  if (d.jumlah === 0) return t('beranda.dashboard.kartu.tidakAda');
  return d.usiaTertuaHari > 0 ? t('beranda.dashboard.kartu.usiaTertua', { hari: d.usiaTertuaHari }) : t('beranda.dashboard.kartu.usiaHariIni');
}

/** Empat kartu angka (tiga untuk tutor): kondisi saat ini, tidak mengikuti filter. */
function KartuKartuAngka({ d, href }) {
  const aktif = d.siswaAktif.data;
  const sesi7 = d.sesi7Hari.data;
  const menunggu = d.postTestMenunggu.data;
  const bayar = d.pembayaranBulanIni?.data;
  const ket7 = sesi7 && keteranganSesi7(sesi7);
  return (
    // item ganjil terakhir melebar penuh di layar 2 kolom agar tidak ada lubang (kasus tutor tanpa kartu pembayaran)
    <ul className={`grid grid-cols-2 gap-3 [&>li:last-child:nth-child(odd)]:col-span-2 lg:[&>li:last-child:nth-child(odd)]:col-span-1 ${d.pembayaranBulanIni ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      <KartuAngka href={href('/data-siswa?status=aktif')} ikon="siswa" label={t('beranda.dashboard.kartu.siswaAktif')} galat={d.siswaAktif.galat} nilai={aktif?.total} keterangan={aktif && t('beranda.dashboard.kartu.siswaBaru', { jumlah: aktif.baru })} nada={aktif?.baru > 0 ? 'baik' : 'muted'} />
      <KartuAngka href={href('/ekspor')} ikon="absensi" label={t('beranda.dashboard.kartu.sesi7Hari')} galat={d.sesi7Hari.galat} nilai={sesi7?.ini} keterangan={ket7?.teks} nada={ket7?.nada} />
      <KartuAngka href={href('/post-test?tab=menunggu')} ikon="target" label={t('beranda.dashboard.kartu.postTestMenunggu')} galat={d.postTestMenunggu.galat} nilai={menunggu?.jumlah} keterangan={menunggu && keteranganMenunggu(menunggu)} />
      {/* rekap keuangan hanya ada untuk admin */}
      {d.pembayaranBulanIni && (
        <KartuAngka href={href('/ekspor')} ikon="bayar" label={t('beranda.dashboard.kartu.pembayaranBulanIni')} galat={d.pembayaranBulanIni.galat} nilai={bayar && formatRupiah(bayar.total)} keterangan={bayar && t('beranda.kartu.jumlahCatatan', { jumlah: bayar.jumlah })} />
      )}
    </ul>
  );
}

/** Grafik "Sesi per hari": satu batang per tanggal pada bulan terpilih; hari ini berwarna `sun`, hari yang belum tiba kosong. */
function GrafikSesiPerHari({ bagian, filter, className }) {
  const d = bagian.data;
  const bulan = namaBulan(filter.bulan);
  const data = d?.deret.map((h) => ({
    kunci: h.tanggal,
    label: String(h.hari),
    nilai: h.n,
    sorot: h.hariIni,
    kosong: h.akanDatang,
    teks: h.akanDatang ? t('beranda.dashboard.grafik.sesiPerHari.tooltipAkanDatang', { hari: namaHariTanggal(h.tanggal) }) : t('beranda.dashboard.grafik.sesiPerHari.tooltip', { hari: namaHariTanggal(h.tanggal), jumlah: h.n }),
  }));
  const judul = t('beranda.dashboard.grafik.sesiPerHari.judul');
  const maks = d ? Math.max(0, ...d.deret.map((h) => h.n)) : 0;
  return (
    <KartuGrafik judul={judul} keterangan={t('beranda.dashboard.grafik.sesiPerHari.keterangan', { bulan })} galat={bagian.galat} kosong={d?.total === 0} className={className}>
      {d && (
        <GrafikBatang
          data={data}
          judul={judul}
          ringkas={t('beranda.dashboard.grafik.sesiPerHari.ringkas', { bulan, jumlah: d.total, maks })}
          pitaBawaan={t('beranda.dashboard.grafik.sesiPerHari.total', { jumlah: d.total })}
        />
      )}
    </KartuGrafik>
  );
}

/** Grafik "Siswa per level": kondisi saat ini, tidak mengikuti filter. */
function GrafikSiswaPerLevel({ bagian, className }) {
  const d = bagian.data;
  const judul = t('beranda.dashboard.grafik.siswaPerLevel.judul');
  const aksi = <span className="text-[0.8em] text-muted">{t('beranda.dashboard.kondisiSaatIni')}</span>;
  return (
    <KartuGrafik judul={judul} keterangan={t('beranda.dashboard.grafik.siswaPerLevel.keterangan')} aksi={aksi} galat={bagian.galat} kosong={d?.every((l) => l.n === 0)} tinggiSkeleton="h-28" className={className}>
      {d && <BatangHorizontal judul={judul} ringkas={t('beranda.dashboard.grafik.siswaPerLevel.ringkas')} baris={d.map((l) => ({ kunci: l.id, label: l.nama, nilai: l.n }))} />}
    </KartuGrafik>
  );
}

/** Grafik "Post test": satu pil bertumpuk (belum tes, selesai dan dinilai, menunggu penilaian) beserta rincian lulus dan tombol Nilai. */
function GrafikPostTest({ bagian, filter, href, className }) {
  const d = bagian.data;
  const judul = t('beranda.dashboard.grafik.postTest.judul');
  const aksi = (
    <TautanTombol href={href('/post-test?tab=menunggu')} varian="secondary">
      {t('beranda.dashboard.grafik.postTest.nilai')}
    </TautanTombol>
  );
  const nama = { belumTes: t('beranda.dashboard.grafik.postTest.belumTes'), selesai: t('beranda.dashboard.grafik.postTest.selesai'), menunggu: t('beranda.dashboard.grafik.postTest.menunggu') };
  return (
    <KartuGrafik judul={judul} keterangan={t('beranda.dashboard.grafik.postTest.keterangan', { bulan: namaBulan(filter.bulan) })} aksi={aksi} galat={bagian.galat} kosong={d && d.belumTes + d.selesai + d.menunggu === 0} tinggiSkeleton="h-24" className={className}>
      {d && (
        <div className="space-y-3">
          <GrafikTumpuk
            tanpaLabel
            judul={judul}
            ringkas={t('beranda.dashboard.grafik.postTest.ringkas', { belumTes: d.belumTes, selesai: d.selesai, menunggu: d.menunggu })}
            baris={[
              {
                kunci: 'status',
                label: t('beranda.dashboard.grafik.postTest.barisSemua'),
                ket: '',
                segmen: [
                  { nama: nama.belumTes, nilai: d.belumTes, warna: 'muted' },
                  { nama: nama.selesai, nilai: d.selesai, warna: 'primary' },
                  { nama: nama.menunggu, nilai: d.menunggu, warna: 'sun' },
                ],
              },
            ]}
          />
          <p className="text-[0.85em] text-muted">
            {t('beranda.dashboard.grafik.postTest.hasil', { lulus: d.lulus, belum: d.belumLulus })}. {t('beranda.dashboard.grafik.postTest.belumTesCatatan')}
          </p>
        </div>
      )}
    </KartuGrafik>
  );
}

/** Grafik "Pembayaran 6 bulan terakhir" (admin): batang per bulan, total bulan terpilih, dan jumlah siswa yang membayar. */
function GrafikPembayaran({ bagian, filter, href, className }) {
  const d = bagian.data;
  const judul = t('beranda.dashboard.grafik.pembayaran.judul');
  const bulan = namaBulan(filter.bulan);
  const aksi = (
    // pembayaran dicatat di detail sesi (wajib terkait sesi), jadi tujuannya daftar sesi berlangsung
    <TautanTombol href={href('/absensi')} varian="secondary">
      {t('beranda.dashboard.grafik.pembayaran.catat')}
    </TautanTombol>
  );
  const data = d?.deret.map((b) => ({
    kunci: b.bulan,
    label: namaBulan(b.bulan, 'pendek'),
    nilai: b.total,
    sorot: b.terpilih,
    teks: t('beranda.dashboard.grafik.pembayaran.tooltip', { bulan: namaBulan(b.bulan), jumlah: formatRupiah(b.total) }),
  }));
  return (
    <KartuGrafik judul={judul} keterangan={t('beranda.dashboard.grafik.pembayaran.keterangan', { bulan })} aksi={aksi} galat={bagian.galat} kosong={d?.deret.every((b) => b.jumlah === 0)} className={className}>
      {d && (
        <div className="space-y-3">
          <GrafikBatang
            data={data}
            judul={judul}
            format="rupiah"
            ringkas={t('beranda.dashboard.grafik.pembayaran.ringkas', { bulan, jumlah: formatRupiah(d.terpilih.total) })}
            pitaBawaan={`${t('beranda.dashboard.grafik.pembayaran.totalBulan', { bulan })}: ${formatRupiah(d.terpilih.total)}`}
          />
          <p className="text-[0.9em] text-muted">{t('beranda.dashboard.grafik.pembayaran.siswa', { membayar: d.membayar, belum: d.belum })}</p>
        </div>
      )}
    </KartuGrafik>
  );
}

/** Grafik "Penuntasan tugas per minggu": proporsi sesi tuntas, tuntas sebagian, dan tidak tuntas pada tiap minggu bulan terpilih. */
function GrafikPenuntasan({ bagian, filter, className }) {
  const d = bagian.data;
  const judul = t('beranda.dashboard.grafik.penuntasan.judul');
  const bulan = namaBulan(filter.bulan);
  const nama = { tuntas: t('beranda.dashboard.grafik.penuntasan.tuntas'), sebagian: t('beranda.dashboard.grafik.penuntasan.sebagian'), tidak: t('beranda.dashboard.grafik.penuntasan.tidak') };
  const jumlah = (kolom) => d.deret.reduce((j, m) => j + m[kolom], 0);
  return (
    <KartuGrafik judul={judul} keterangan={t('beranda.dashboard.grafik.penuntasan.keterangan', { bulan })} galat={bagian.galat} kosong={d?.deret.every((m) => m.total === 0)} tinggiSkeleton="h-32" className={className}>
      {d && (
        <GrafikTumpuk
          judul={judul}
          ringkas={t('beranda.dashboard.grafik.penuntasan.ringkas', { bulan, tuntas: jumlah('tuntas'), sebagian: jumlah('sebagian'), tidak: jumlah('tidak') })}
          baris={d.deret.map((m) => ({
            kunci: String(m.minggu),
            label: t('beranda.dashboard.grafik.penuntasan.minggu', { nomor: m.minggu }),
            ket: m.total > 0 ? t('beranda.dashboard.grafik.penuntasan.jumlahSesi', { jumlah: m.total }) : '-',
            segmen: [
              { nama: nama.tuntas, nilai: m.tuntas, warna: 'primary' },
              { nama: nama.sebagian, nilai: m.sebagian, warna: 'sun' },
              { nama: nama.tidak, nilai: m.tidak, warna: 'muted' },
            ],
          }))}
        />
      )}
    </KartuGrafik>
  );
}

/** Daftar tindakan yang jumlahnya lebih dari 0 (bagian bernilai 0 tidak tampil); `belumBayar` null (tutor) juga dilewati. */
function itemPerhatian(d, href) {
  const k = 'beranda.dashboard.perhatian';
  const semua = [
    { kunci: 'postTest', jumlah: d.postTestMenunggu, teks: t(`${k}.postTest`), aksi: t(`${k}.aksiNilai`), tujuan: href('/post-test?tab=menunggu') },
    // daftar siswa belum punya filter "tanpa sesi": tujuannya daftar siswa aktif
    { kunci: 'tanpaSesi', jumlah: d.tanpaSesi, teks: t(`${k}.tanpaSesi`, { hari: d.hariTanpaSesi }), aksi: t(`${k}.aksiLihat`), tujuan: href('/data-siswa?status=aktif') },
    // pembayaran dicatat di detail sesi, jadi tujuannya daftar sesi berlangsung
    { kunci: 'belumBayar', jumlah: d.belumBayar, teks: t(`${k}.belumBayar`), aksi: t(`${k}.aksiCatat`), tujuan: href('/absensi') },
    { kunci: 'sesiLama', jumlah: d.sesiLama, teks: t(`${k}.sesiLama`), aksi: t(`${k}.aksiTutup`), tujuan: href('/absensi') },
  ];
  return semua.filter((i) => i.jumlah > 0);
}

/** Kartu "Perlu perhatian": daftar tindakan beserta tautan, atau keadaan "Semua beres" bila tidak ada satu pun. Kondisi saat ini. */
function KartuPerhatian({ bagian, href, className }) {
  const item = bagian.data ? itemPerhatian(bagian.data, href) : [];
  const judul = t('beranda.dashboard.perhatian.judul');
  return (
    <KartuGrafik judul={judul} keterangan={t('beranda.dashboard.perhatian.keterangan')} aksi={<span className="text-[0.8em] text-muted">{t('beranda.dashboard.kondisiSaatIni')}</span>} galat={bagian.galat} tinggiSkeleton="h-32" className={className}>
      {bagian.data && item.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <Maskot suasana="merayakan" ukuran={96} className="!m-0" />
          <p className="font-bold">{t('beranda.dashboard.perhatian.semuaBeres')}</p>
          <p className="text-muted">{t('beranda.dashboard.perhatian.semuaBeresPesan')}</p>
        </div>
      )}
      {item.length > 0 && (
        <ul aria-label={t('beranda.dashboard.perhatian.daftar')} className="divide-y divide-line">
          {item.map((i) => (
            // flex-wrap: di wadah sempit tombol turun ke baris bawah, teks tidak terjepit
            <li key={i.kunci} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2 first:pt-0 last:pb-0">
              <span className="min-w-11 shrink-0 rounded-full bg-warn-soft px-3 py-1 text-center font-bold text-warn angka-tabular">{i.jumlah.toLocaleString('id-ID')}</span>
              <span className="min-w-[10rem] flex-1">{i.teks}</span>
              <TautanTombol href={i.tujuan} varian="secondary" className="shrink-0">
                {i.aksi}
              </TautanTombol>
            </li>
          ))}
        </ul>
      )}
    </KartuGrafik>
  );
}

/**
 * Beranda pengelola (dashboard): kartu sesi dengan tombol Absen masuk, kartu angka, dan grafik yang mengikuti filter bulan dan
 * level di query URL (`?bulan=YYYY-MM&level=<id>`). Semua data uang hanya ada untuk admin (controller tidak menghitungnya
 * untuk tutor), sehingga kartunya tidak dirender dan grid menyesuaikan diri.
 */
export default async function HalamanDashboard({ searchParams }) {
  const sesi = await wajibPengguna();
  const [d, info] = await Promise.all([ambilDep().raporController.dashboard(await searchParams, sesi), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  // urutan DOM = urutan desktop; `order-*` mengatur urutan HP (< 640 px), `sm:order-none` mengembalikannya
  return (
    <PembungkusDashboard>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.5em] font-bold">{t('beranda.dashboard.judul')}</h1>
          <p className="text-muted">{tanggalPanjang(d.hariIni)}</p>
        </div>
        <FilterDashboard filter={d.filter} level={d.level} jalurDasar={href('/')} />
      </header>
      <KartuSesi bagian={d.sesiBerlangsung} href={href} />
      <KartuKartuAngka d={d} href={href} />
      {/* petak mengikuti lebar wadah (bukan layar): menu samping memakan 256 px di layar >= 768 px */}
      <div className="@container">
        <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-6">
          <GrafikSesiPerHari bagian={d.sesiPerHari} filter={d.filter} className="order-1 @xl:order-none @xl:col-span-2 @4xl:col-span-4" />
          <GrafikSiswaPerLevel bagian={d.siswaPerLevel} className="order-5 @xl:order-none @xl:col-span-2 @4xl:col-span-2" />
          {/* tanpa kartu pembayaran (tutor), Post test melebar agar tidak ada lubang di grid */}
          <GrafikPostTest bagian={d.postTest} filter={d.filter} href={href} className={`order-2 @xl:order-none ${d.pembayaran ? '@4xl:col-span-3' : '@xl:col-span-2 @4xl:col-span-6'}`} />
          {d.pembayaran && <GrafikPembayaran bagian={d.pembayaran} filter={d.filter} href={href} className="order-3 @xl:order-none @4xl:col-span-3" />}
          <GrafikPenuntasan bagian={d.penuntasan} filter={d.filter} className="order-4 @xl:order-none @4xl:col-span-3" />
          <KartuPerhatian bagian={d.perhatian} href={href} className="order-6 @xl:order-none @4xl:col-span-3" />
        </div>
      </div>
      {/* tombol mengambang hanya di HP; di layar lebar cukup tombol pada kartu sesi */}
      <Link
        href={href('/absensi')}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-sun px-5 font-bold text-on-sun shadow-lg sm:hidden"
      >
        <Ikon nama="absensi" />
        {t('beranda.dashboard.absenMasuk')}
      </Link>
    </PembungkusDashboard>
  );
}
