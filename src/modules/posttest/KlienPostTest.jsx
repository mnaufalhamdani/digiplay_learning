'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import TextField from '@/modules/shared/ui/TextField';
import Toast from '@/modules/shared/ui/Toast';
import OpsiJawaban from '@/modules/shared/ui/domain/OpsiJawaban';
import Pewaktu from '@/modules/shared/ui/domain/Pewaktu';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import { useArea } from '@/modules/shared/ui/AreaContext';
import { gabungJalur } from '@/utils/jalurArea';
import AreaMengetik from '@/modules/mengetik/AreaMengetik';
import { jawabPostTest, kumpulPostTest, siapDinilaiPostTest, tesMengetikPostTest } from './posttest.actions';
import { useWaktu } from './useWaktuPostTest';

/** Navigasi butir: kotak bernomor (terjawab/belum, dengan teks untuk pembaca layar) dikelompokkan per bagian. */
function NavigasiButir({ butir, indeks, pilih, terjawab }) {
  const bagian = [...new Map(butir.map((b) => [b.bagian.kode, b.bagian])).values()];
  return (
    <nav aria-label={t('posttest.navigasi')} className="space-y-2">
      {bagian.map((bg) => (
        <div key={bg.kode} className="flex flex-wrap items-center gap-1.5">
          <span className="w-full text-[0.85em] font-bold text-muted sm:w-auto sm:min-w-28">
            {bg.kode}. {bg.nama}
          </span>
          {butir
            .filter((b) => b.bagian.kode === bg.kode)
            .map((b) => {
              const sudah = terjawab(b);
              const i = butir.indexOf(b);
              return (
                <button key={b.id} type="button" onClick={() => pilih(i)} aria-current={i === indeks ? 'step' : undefined} aria-label={t(sudah ? 'posttest.butirTerjawab' : 'posttest.butirBelum', { nomor: b.nomor })} className={`flex size-11 items-center justify-center rounded-md border-2 font-bold ${i === indeks ? 'border-primary' : 'border-line'} ${sudah ? 'bg-primary-soft' : 'bg-panel'}`}>
                  {b.nomor}
                  {sudah && <Ikon nama="sukses" ukuran="0.8em" className="ml-0.5" />}
                </button>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

/** Tombol Unduh bahan di dalam instruksi butir (gambar mewarnai/berwarna milik butir ini); bernomor bila bahannya lebih dari satu. */
function TombolUnduhBahan({ gambar, butirId }) {
  // butir tanpa bahan unduhan
  if (!gambar?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {gambar.map((g, i) => (
        <a key={g.kode} href={`/api/v1/posttest/unduh?tugasId=${butirId}&kode=${encodeURIComponent(g.kode)}`} download className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-btn)] border-2 border-line bg-panel px-4 font-bold hover:bg-primary-soft">
          <Ikon nama="unduh" />
          {gambar.length > 1 ? t('sesiSiswa.unduhBahanKe', { nomor: i + 1 }) : t('sesiSiswa.unduhBahan')}
        </a>
      ))}
    </div>
  );
}

/**
 * Butir praktik coding (Studio Zippy): tombol membuka Studio untuk butir ini (waktu tes tetap berjalan di sana).
 * Proyek yang sudah dikirim ditampilkan namanya; tombol panggil tutor baru muncul setelah ada kiriman.
 */
function ButirProyek({ b, toggleSiap, memuat }) {
  const { basis } = useArea();
  const terkirim = b.jawaban != null && b.jawaban !== '';
  return (
    <div className="space-y-3">
      <p className="text-muted">{t('posttest.proyekPetunjuk')}</p>
      <TautanTombol href={gabungJalur(basis, `/studio?butir=${b.id}`)} ukuran="lg" ikon="coding">
        {t(terkirim ? 'posttest.bukaStudioLagi' : 'posttest.bukaStudio')}
      </TautanTombol>
      {terkirim && <p className="font-semibold text-ok">{t('posttest.proyekTerkirim', { nama: b.jawaban })}</p>}
      {terkirim && (
        <Button ukuran="lg" varian={b.siapDinilai ? 'secondary' : 'sukses'} ikon={b.siapDinilai ? 'kembalikan' : 'sukses'} memuat={memuat} onClick={() => toggleSiap(b)}>
          {t(b.siapDinilai ? 'posttest.batalSiap' : 'posttest.panggilTutor')}
        </Button>
      )}
      {b.siapDinilai && <p className="font-semibold text-ok">{t('posttest.menungguTutor')}</p>}
    </div>
  );
}

/** Isi satu butir sesuai jenisnya (tanpa umpan balik benar/salah). */
function IsiButir({ b, jawaban, ubahJawaban, simpanIsian, toggleSiap, kirimMengetik, memuat }) {
  if (b.jenis === 'mengetik') {
    if (b.terjawab) return <p className="font-semibold text-ok">{t('posttest.mengetikSelesai')}</p>;
    // bank teks kosong: tidak ada yang bisa diketik
    if (!b.teks) return <p className="text-muted">{t('mengetik.bankKosong')}</p>;
    return <AreaMengetik teks={b.teks} onSelesai={kirimMengetik} bolehUlang={false} nonaktif={memuat} />;
  }
  if (b.jenis === 'tutor') {
    // tutor sudah menyimpan skor: status berubah dan penanda siap tidak bisa diubah lagi (skornya tidak ditampilkan di sini)
    if (b.dinilai) return <p className="font-semibold text-ok">{t('posttest.dinilaiTutor')}</p>;
    // praktik coding: dikerjakan di Studio Zippy lalu dikirim dari sana (mengirim = siap dinilai)
    if (b.tipe === 'coding_proyek') return <ButirProyek b={b} toggleSiap={toggleSiap} memuat={memuat} />;
    return (
      <div className="space-y-3">
        <p className="text-muted">{t('posttest.praktikPetunjuk')}</p>
        <Button ukuran="lg" varian={b.siapDinilai ? 'secondary' : 'sukses'} ikon={b.siapDinilai ? 'kembalikan' : 'sukses'} memuat={memuat} onClick={() => toggleSiap(b)}>
          {t(b.siapDinilai ? 'posttest.batalSiap' : 'posttest.panggilTutor')}
        </Button>
        {b.siapDinilai && <p className="font-semibold text-ok">{t('posttest.menungguTutor')}</p>}
      </div>
    );
  }
  if (b.jenis === 'pilihan_ganda') return <OpsiJawaban opsi={b.opsi} terpilih={jawaban ?? ''} onPilih={(v) => ubahJawaban(b, String(v), true)} />;
  return <TextField label={t('sesiSiswa.jawabanmu')} ukuran="lg" value={jawaban ?? ''} onChange={(e) => ubahJawaban(b, e.target.value, false)} onBlur={() => simpanIsian(b)} autoComplete="off" />;
}

/**
 * Halaman post test siswa (D2.3): satu butir per layar, navigasi bebas, jawaban tersimpan otomatis tanpa indikasi
 * benar/salah, tombol Selesai dan Kumpulkan dengan ConfirmDialog, dan peringatan saat meninggalkan halaman.
 */
export default function KlienPostTest({ data }) {
  const router = useRouter();
  const [butir, setButir] = useState(data.butir);
  const [jawaban, setJawaban] = useState(() => Object.fromEntries(data.butir.map((b) => [b.id, b.jawaban ?? ''])));
  const [indeks, setIndeks] = useState(0);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [toast, setToast] = useState({ pesan: '', nada: 'bahaya' });
  const [memuat, mulai] = useTransition();
  // butir praktik yang baru dinilai tutor ditandai tanpa memuat ulang halaman (tes tidak boleh terganggu)
  const sisa = useWaktu(
    data.sisaDetik,
    () => router.refresh(),
    (d) => setButir((daftar) => daftar.map((y) => (d.dinilai?.includes(y.id) && !y.dinilai ? { ...y, dinilai: true, terjawab: true } : y))),
  );
  // peringatan bawaan browser saat menutup/meninggalkan halaman selama tes
  useEffect(() => {
    const peringatan = (e) => e.preventDefault();
    window.addEventListener('beforeunload', peringatan);
    return () => window.removeEventListener('beforeunload', peringatan);
  }, []);
  const terjawab = (b) => (b.jenis === 'pilihan_ganda' || b.jenis === 'isian' ? String(jawaban[b.id] ?? '').trim() !== '' : b.terjawab);
  /** Menjalankan action; galat ditampilkan, sukses opsional memperbarui butir lokal. */
  function jalankan(action, input, setelah = null) {
    mulai(async () => {
      const r = await action(input);
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setelah?.();
    });
  }
  /** Mengubah jawaban lokal; pilihan ganda langsung disimpan. */
  function ubahJawaban(b, nilai, langsung) {
    setJawaban((j) => ({ ...j, [b.id]: nilai }));
    if (langsung) jalankan(jawabPostTest, { tugasId: b.id, jawaban: nilai });
  }
  /** Isian disimpan saat kolom ditinggalkan atau berpindah butir. */
  function simpanIsian(b) {
    if (b.jenis === 'isian') jalankan(jawabPostTest, { tugasId: b.id, jawaban: jawaban[b.id] ?? '' });
  }
  /** Pindah butir (menyimpan isian butir saat ini dulu). */
  function pilih(i) {
    simpanIsian(butir[indeks]);
    setIndeks(Math.max(0, Math.min(butir.length - 1, i)));
  }
  const b = butir[indeks];
  const belum = butir.filter((x) => !terjawab(x)).length;
  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg py-2">
        <Pewaktu sisaDetik={sisa} />
        <Button varian="sukses" ikon="sukses" onClick={() => setKonfirmasi(true)} disabled={memuat}>
          {t('posttest.kumpulkan')}
        </Button>
      </div>
      <NavigasiButir butir={butir} indeks={indeks} pilih={pilih} terjawab={terjawab} />
      <Card varian="terangkat" className="space-y-4">
        <p className="font-bold text-muted">{t('posttest.butirKe', { nomor: b.nomor, total: butir.length, bagian: `${b.bagian.kode}. ${b.bagian.nama}` })}</p>
        {b.soal && <p className="text-[1.15em] whitespace-pre-wrap">{b.soal}</p>}
        <TombolUnduhBahan gambar={b.gambar} butirId={b.id} />
        <IsiButir
          key={b.id}
          b={b}
          jawaban={jawaban[b.id]}
          memuat={memuat}
          ubahJawaban={ubahJawaban}
          simpanIsian={simpanIsian}
          toggleSiap={(x) => jalankan(siapDinilaiPostTest, { tugasId: x.id, siap: !x.siapDinilai }, () => setButir((d) => d.map((y) => (y.id === x.id ? { ...y, siapDinilai: !x.siapDinilai, terjawab: !x.siapDinilai } : y))))}
          kirimMengetik={(h) => jalankan(tesMengetikPostTest, { ...h, wpm: undefined, akurasi: undefined }, () => setButir((d) => d.map((y) => (y.id === b.id ? { ...y, terjawab: true } : y))))}
        />
      </Card>
      <div className="flex justify-between gap-2">
        <Button varian="secondary" ikon="kiri" onClick={() => pilih(indeks - 1)} disabled={indeks === 0}>
          {t('paginasi.sebelumnya')}
        </Button>
        <Button varian="secondary" onClick={() => pilih(indeks + 1)} disabled={indeks === butir.length - 1}>
          {t('paginasi.berikutnya')}
          <Ikon nama="kanan" />
        </Button>
      </div>
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t('posttest.kumpulJudul')}
        pesan={belum > 0 ? t('posttest.kumpulPesanBelum', { belum }) : t('posttest.kumpulPesan')}
        labelYa={t('posttest.kumpulkan')}
        labelBatal={t('siswa.tidakJadi')}
        maskot="berpikir"
        memuat={memuat}
        onYa={() => {
          simpanIsian(b);
          jalankan(kumpulPostTest, null, () => {
            setKonfirmasi(false);
            router.refresh();
          });
        }}
        onBatal={() => setKonfirmasi(false)}
      />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'bahaya' })} />
    </div>
  );
}
