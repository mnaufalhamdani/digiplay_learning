import { notFound } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { wajibOrtu } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import { adalahAppError } from '@/utils/appError';
import { formatDurasi, formatJam, formatNilai, formatRupiah, formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import { STATUS_SESI } from '@/enums';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import Badge from '@/modules/shared/ui/Badge';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Paginasi from '@/modules/shared/ui/Paginasi';
import ProgressBar from '@/modules/shared/ui/ProgressBar';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';
import { kelasTombol } from '@/modules/shared/ui/kelasTombol';
import GrafikKemajuan from '@/modules/shared/ui/domain/GrafikKemajuan';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import GaleriKarya from '@/modules/karya/GaleriKarya';
import LencanaPostTest from '@/modules/posttest/LencanaPostTest';
import { LencanaPenuntasan, LencanaStatusSesi } from '@/modules/sesi/LencanaSesi';

/** Keadaan kosong rapor dengan Zippy dan kalimat ramah. */
function Kosong({ pesan }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 text-center">
      <Maskot suasana="tidur" ukuran={96} />
      <p className="text-muted">{pesan}</p>
    </div>
  );
}

/** Satu bagian rapor: kartu berjudul. */
function Bagian({ judul, ikon, children }) {
  return (
    <Card className="space-y-4">
      <h2 className="flex items-center gap-2 font-display text-[1.25em] font-bold">
        <Ikon nama={ikon} />
        {judul}
      </h2>
      {children}
    </Card>
  );
}

/** Pasangan label dan angka besar (ringkasan). */
function Angka({ label, nilai }) {
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <p className="text-[0.9em] text-muted">{label}</p>
      <p className="text-[1.3em] font-bold">{nilai}</p>
    </div>
  );
}

/** Ringkasan: kehadiran (ProgressBar), sesi terakhir, syarat post test, status level. */
function Ringkasan({ r }) {
  const k = r.kehadiran;
  return (
    <Bagian judul={t('rapor.ringkasan')} ikon="grafik">
      {/* siswa belum punya level berjalan: kehadiran tidak bisa dihitung */}
      {k ? <ProgressBar nilai={k.hadir} maks={k.dari} label={t('riwayat.kehadiran', { hadir: k.hadir, dari: k.dari })} /> : <p className="text-muted">{t('dataSiswa.tanpaLevel')}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Angka label={t('rapor.sesiTerakhir')} nilai={r.sesiTerakhir ? formatTanggal(r.sesiTerakhir.tanggal) : '-'} />
        <Angka label={t('rapor.syaratPostTest')} nilai={!k ? '-' : t(k.pengecualian ? 'riwayat.syaratPengecualian' : k.memenuhi ? 'rapor.terpenuhi' : 'rapor.belumTerpenuhi', { butuh: k.butuh })} />
        <Angka label={t('rapor.statusLevel')} nilai={r.siswa.status_level ? t(`dataSiswa.statusLevel.${r.siswa.status_level}`) : '-'} />
      </div>
    </Bagian>
  );
}

/** Catatan tutor beserta nama penulisnya. */
function CatatanTutor({ catatan }) {
  // tutor belum menulis catatan untuk sesi ini
  if (catatan.length === 0) return <span className="text-muted">-</span>;
  return (
    <ul className="space-y-1">
      {catatan.map((c) => (
        <li key={c.nama}>
          <span className="font-semibold">{c.nama}:</span> <span className="whitespace-pre-wrap">{c.catatan}</span>
        </li>
      ))}
    </ul>
  );
}

/** Kartu ringkas satu sesi untuk layar HP (lebih pendek dari kartu label: isi bawaan). */
function KartuSesiHP({ s }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{formatTanggal(s.tanggal)}</p>
        <LencanaPenuntasan nilai={s.penuntasan_akhir} />
      </div>
      <p>{`${s.level_kode} · P${s.pertemuan_nomor} ${s.pertemuan_judul}`}</p>
      <p className="text-[0.9em] text-muted">
        {/* sesi yang masih berjalan belum punya jam pulang */}
        {s.status === STATUS_SESI.BERLANGSUNG ? t('absensi.statusSesi.berlangsung') : `${formatJam(s.jam_masuk)}–${formatJam(s.jam_pulang)} (${formatDurasi(s.lama_detik)})`} · {t('rapor.tugasRingkas', { selesai: s.tugas_selesai, total: s.tugas_total })}
      </p>
      {s.catatan.length > 0 && (
        <div className="rounded-md bg-bg p-2 text-[0.95em]">
          <CatatanTutor catatan={s.catatan} />
        </div>
      )}
    </div>
  );
}

/** Riwayat sesi berpaginasi (tabel di layar lebar, kartu ringkas di HP). */
function RiwayatSesi({ data, hrefHalaman }) {
  const kolom = [
    { label: t('riwayat.tanggal'), isi: (s) => formatTanggal(s.tanggal) },
    { label: t('riwayat.pertemuan'), isi: (s) => `${s.level_kode} · P${s.pertemuan_nomor} ${s.pertemuan_judul}` },
    // sesi yang masih berjalan belum punya jam pulang
    { label: t('riwayat.jam'), isi: (s) => (s.status === STATUS_SESI.BERLANGSUNG ? <LencanaStatusSesi status={s.status} /> : `${formatJam(s.jam_masuk)}–${formatJam(s.jam_pulang)} (${formatDurasi(s.lama_detik)})`) },
    { label: t('riwayat.penuntasan'), isi: (s) => <LencanaPenuntasan nilai={s.penuntasan_akhir} /> },
    { label: t('riwayat.tugas'), isi: (s) => `${s.tugas_selesai}/${s.tugas_total}` },
    { label: t('rapor.catatanTutor'), isi: (s) => <CatatanTutor catatan={s.catatan} />, kelas: 'min-w-56' },
  ];
  return (
    <Bagian judul={t('rapor.riwayatSesi')} ikon="absensi">
      {data.total === 0 ? (
        <Kosong pesan={t('rapor.kosongSesi')} />
      ) : (
        <>
          <TabelResponsif kolom={kolom} baris={data.baris} kartuHP={(s) => <KartuSesiHP s={s} />} />
          <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={hrefHalaman} />
        </>
      )}
    </Bagian>
  );
}

/** Post test per percobaan: tanggal, nilai tiap bagian, total, keadaan (tanpa soal dan jawaban). */
function PostTest({ daftar }) {
  const kolom = [
    { label: t('riwayat.tanggal'), isi: (p) => formatTanggal(p.mulai_at) },
    { label: t('posttest.levelPercobaan'), isi: (p) => t('posttest.percobaanKe', { level: p.level_kode, ke: p.percobaan_ke }) },
    { label: t('posttest.nilaiPerBagian'), isi: (p) => p.bagian.map((b) => `${b.kode}: ${formatNilai(b.nilai)}`).join(' · ') },
    { label: t('posttest.total'), isi: (p) => formatNilai(p.nilai_total) },
    { label: t('posttest.kolomKeadaan'), isi: (p) => <LencanaPostTest pt={p} /> },
  ];
  return (
    <Bagian judul={t('rapor.postTest')} ikon="target">
      {daftar.length === 0 ? <Kosong pesan={t('rapor.kosongPostTest')} /> : <TabelResponsif kolom={kolom} baris={daftar} />}
    </Bagian>
  );
}

/** Perkembangan mengetik dan ringkasan latihan. */
function Mengetik({ m, latihan }) {
  return (
    <Bagian judul={t('rapor.mengetik')} ikon="keyboard">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Angka label={t('mengetik.wpmTerbaik')} nilai={formatNilai(m.wpmTerbaik)} />
        <Angka label={t('mengetik.akurasiRata')} nilai={m.akurasiRata == null ? '-' : `${formatNilai(m.akurasiRata)}%`} />
        <Angka label={t('rapor.jumlahGame')} nilai={latihan.jumlahGame} />
        <Angka label={t('puzzle.jumlahSelesai')} nilai={latihan.puzzleSelesai} />
      </div>
      {m.grafik.length === 0 ? <Kosong pesan={t('rapor.kosongMengetik')} /> : <GrafikKemajuan data={m.grafik} />}
    </Bagian>
  );
}

/** Pembayaran yang tercatat beserta totalnya. */
function Pembayaran({ p, hrefHalaman }) {
  const kolom = [
    { label: t('riwayat.tanggal'), isi: (x) => formatTanggal(x.tanggal) },
    { label: t('pembayaran.jumlah'), isi: (x) => formatRupiah(x.jumlah) },
    { label: t('pembayaran.keterangan'), isi: (x) => x.keterangan ?? '-' },
  ];
  return (
    <Bagian judul={t('rapor.pembayaran')} ikon="bayar">
      {p.daftar.total === 0 ? (
        <Kosong pesan={t('rapor.kosongPembayaran')} />
      ) : (
        <>
          <TabelResponsif
            kolom={kolom}
            baris={p.daftar.baris}
            // kartu HP satu baris ringkas: tanggal dan jumlah, keterangan di bawahnya bila ada
            kartuHP={(x) => (
              <div className="space-y-1">
                <p className="flex flex-wrap justify-between gap-2">
                  <span>{formatTanggal(x.tanggal)}</span>
                  <span className="font-bold">{formatRupiah(x.jumlah)}</span>
                </p>
                {x.keterangan && <p className="text-[0.9em] text-muted">{x.keterangan}</p>}
              </div>
            )}
          />
          <Paginasi halaman={p.daftar.halaman} totalHalaman={p.daftar.totalHalaman} total={p.daftar.total} hrefHalaman={hrefHalaman} />
          <p className="text-[1.1em] font-bold">{t('rapor.totalBayar', { total: formatRupiah(p.total) })}</p>
        </>
      )}
    </Bagian>
  );
}

/** Sertifikat terbit: nomor, level, tanggal, tombol Unduh PDF dan tautan verifikasi. */
function Sertifikat({ daftar }) {
  return (
    <Bagian judul={t('rapor.sertifikat')} ikon="sertifikat">
      {daftar.length === 0 ? (
        <Kosong pesan={t('rapor.kosongSertifikat')} />
      ) : (
        <ul className="space-y-3">
          {daftar.map((s) => (
            <li key={s.id} className="space-y-2 rounded-md border border-line bg-bg p-3">
              <p className="font-bold">{s.nama_level}</p>
              <p className="text-muted">
                <span className="font-mono">{s.nomor}</span> · {formatTanggal(s.diterbitkan_at)}
              </p>
              <div className="flex flex-wrap gap-2">
                {/* rute unduh di /api (tidak lewat awalan jalur area); hanya sertifikat milik anak ini */}
                <a href={`/api/v1/sertifikat/pdf-ortu?id=${encodeURIComponent(s.id)}`} download className={kelasTombol({ varian: 'primary' })}>
                  <Ikon nama="unduh" />
                  {t('sertifikat.unduhPdf')}
                </a>
                <a href={s.url_verifikasi} target="_blank" rel="noopener noreferrer" className={kelasTombol({ varian: 'hantu' })}>
                  <Ikon nama="tautan" />
                  {t('rapor.cekKeaslian')}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Bagian>
  );
}

/** Data rapor; siswa yang sudah tidak ada/nonaktif dijawab 404. */
async function ambilRapor(query, sesi) {
  try {
    return await ambilDep().raporController.ortu(query, sesi);
  } catch (error) {
    // siswa dihapus/nonaktif setelah cookie dibuat: halaman dianggap tidak ada
    if (adalahAppError(error) && error.status === 404) notFound();
    throw error;
  }
}

/**
 * Rapor orang tua (F1, data-mode="ortu", mobile-first, lihat saja): semua data dibatasi siswaId dari cookie dp_ortu,
 * tanpa tombol pengubah data dan tanpa kode akses.
 */
export default async function HalamanRapor({ searchParams }) {
  const sesi = await wajibOrtu();
  const query = await searchParams;
  const [r, branding, info] = await Promise.all([ambilRapor(query, sesi), ambilDep().pengaturanController.branding(), infoPermintaan()]);
  /** Tautan rapor dengan satu nomor halaman diganti; nomor halaman daftar lain ikut terbawa. */
  const hrefHal = (kunci) => (n) => gabungJalur(info.basis, jalurQuery('/ortu', { sesi: query.sesi, bayar: query.bayar, halaman: query.halaman, [kunci]: n }));
  return (
    <ShellSiswa branding={branding} basis={info.basis} mode="ortu">
      <div className="mx-auto max-w-3xl space-y-5">
        <Card varian="berwarna" className="flex items-center gap-2">
          <Maskot suasana="sapa" ukuran={96} />
          <div className="min-w-0 space-y-1">
            <p className="text-muted">{t('ortu.pantauan')}</p>
            <h1 className="break-words font-display text-[1.6em] font-bold">{r.siswa.nama}</h1>
            {/* level berjalan bisa kosong (mis. sudah selesai dan belum naik level) */}
            <Badge nada="primer">{r.siswa.level_nama ? `${r.siswa.level_kode} · ${r.siswa.level_nama}` : t('dataSiswa.tanpaLevel')}</Badge>
          </div>
        </Card>
        <Ringkasan r={r} />
        <RiwayatSesi data={r.sesi} hrefHalaman={hrefHal('sesi')} />
        <PostTest daftar={r.postTest} />
        <Mengetik m={r.mengetik} latihan={r.latihan} />
        <Pembayaran p={r.pembayaran} hrefHalaman={hrefHal('bayar')} />
        <Sertifikat daftar={r.sertifikat} />
        <Bagian judul={t('rapor.karya')} ikon="gambar">
          <GaleriKarya data={r.karya} hrefHalaman={hrefHal('halaman')} kosong={<Kosong pesan={t('rapor.kosongKarya')} />} />
        </Bagian>
      </div>
    </ShellSiswa>
  );
}
