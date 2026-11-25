'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { hitungBintang } from '@/utils/mengetik';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import AreaMengetik from './AreaMengetik';
import HujanKata from './HujanKata';
import { ambilKataGame, ambilTeksAcak, ambilTeksAdaptif, simpanHasilMengetik } from './mengetik.actions';

/** Bintang 0-3 sebagai ikon disertai teks. */
function Bintang({ jumlah }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={t('mengetik.bintang', { jumlah })}>
      {[1, 2, 3].map((i) => (
        <Ikon key={i} nama="bintang" bobot={i <= jumlah ? 'fill' : 'regular'} className={i <= jumlah ? 'text-sun' : 'text-muted'} />
      ))}
    </span>
  );
}

/** Kartu pelajaran bertingkat: terkunci (gembok) sampai target pelajaran sebelumnya tercapai. */
function KartuPelajaran({ p, pilih }) {
  return (
    <Card as="li" className={`space-y-2 ${p.terbuka ? '' : 'opacity-70'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[1.1em] font-bold">
          {p.urutan}. {p.nama}
        </span>
        {p.terbuka ? <Bintang jumlah={p.bintang} /> : <Ikon nama="gembok" label={t('mengetik.terkunci')} />}
      </div>
      <p className="text-muted">{t('mengetik.target', { wpm: p.target_wpm, akurasi: p.target_akurasi })}</p>
      {p.terbaik && <p className="font-semibold">{t('mengetik.terbaik', { wpm: p.terbaik.wpm, akurasi: p.terbaik.akurasi })}</p>}
      <Button ukuran="lg" ikon={p.terbuka ? 'main' : 'gembok'} disabled={!p.terbuka} onClick={() => pilih({ judul: p.nama, teks: p.teks_latihan, mode: 'pelajaran', pelajaran: p })}>
        {t(p.terbuka ? 'mengetik.mulaiPelajaran' : 'mengetik.terkunci')}
      </Button>
    </Card>
  );
}

/** Hasil setelah satu putaran: angka dari server, bintang (pelajaran), tugas selesai, atau "Hampir!". */
function HasilPutaran({ hasil, aktif, ulang, kembali }) {
  const bintang = aktif.pelajaran ? hitungBintang(hasil.wpm, hasil.akurasi, aktif.pelajaran.target_wpm, aktif.pelajaran.target_akurasi) : null;
  const hebat = (bintang ?? 1) > 0 || hasil.tugasSelesai?.length > 0;
  return (
    <Card varian="terangkat" className="flex flex-col items-center gap-3 text-center">
      <Maskot suasana={hebat ? 'merayakan' : 'menyemangati'} ukuran={120} />
      <p className="font-display text-[1.4em] font-bold">{t('mengetik.hasil', { wpm: hasil.wpm, akurasi: hasil.akurasi })}</p>
      {bintang !== null && (bintang > 0 ? <Bintang jumlah={bintang} /> : <p className="font-semibold">{t('mengetik.targetBelum')}</p>)}
      {hasil.tugasSelesai?.length > 0 && <Badge nada="sukses">{t('mengetik.tugasSelesai')}</Badge>}
      {hasil.hampir && <p className="font-semibold text-warn">{t('mengetik.hampir', { wpm: hasil.hampir.minWpm, akurasi: hasil.hampir.minAkurasi })}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button ikon="acak" onClick={ulang}>
          {t('mengetik.cobaLagi')}
        </Button>
        <Button varian="secondary" ikon="kembali" onClick={kembali}>
          {t('mengetik.kembaliMenu')}
        </Button>
      </div>
      <Konfeti tampil={hebat} />
    </Card>
  );
}

/** Pilihan latihan selain pelajaran: tombol lemah (adaptif), tes bebas, dan game Hujan Kata. */
function PilihanLatihan({ pilih, setPesan, memuat, mulai }) {
  /** Mengambil teks dari server lalu membuka area mengetik mode latihan. */
  function ambil(action, judul) {
    mulai(async () => {
      const r = await action();
      if (!r.ok) return setPesan(r.error);
      // belum ada data tombol yang cukup untuk latihan adaptif
      if (!r.data.teks) return setPesan(t('mengetik.adaptifBelum'));
      pilih({ judul, teks: r.data.teks, mode: 'latihan' });
    });
  }
  /** Mengambil kata lalu membuka game Hujan Kata. */
  function game() {
    mulai(async () => {
      const r = await ambilKataGame();
      if (!r.ok) return setPesan(r.error);
      pilih({ judul: t('mengetik.hujanKata'), kata: r.data.kata, mode: 'game' });
    });
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button ukuran="lg" varian="secondary" ikon="target" memuat={memuat} onClick={() => ambil(ambilTeksAdaptif, t('mengetik.adaptif'))}>
        {t('mengetik.adaptif')}
      </Button>
      <Button ukuran="lg" varian="secondary" ikon="keyboard" disabled={memuat} onClick={() => ambil(ambilTeksAcak, t('mengetik.tesBebas'))}>
        {t('mengetik.tesBebas')}
      </Button>
      <Button ukuran="lg" varian="secondary" ikon="main" disabled={memuat} onClick={game}>
        {t('mengetik.hujanKata')}
      </Button>
    </div>
  );
}

/**
 * Halaman Mengetik siswa (D1.3): pelajaran bertahap, latihan adaptif, tes bebas, Hujan Kata, dan tautan Kemajuan.
 * `tugas` terisi bila dibuka dari kartu tugas (langsung mengetik `kunci.teks_ketik` mode latihan).
 */
export default function KlienMengetik({ pelajaran, tugas }) {
  const router = useRouter();
  const { basis } = useArea();
  const awal = tugas ? { judul: tugas.soal, teks: tugas.kunci.teks_ketik, mode: 'latihan', target: tugas.kunci } : null;
  const [aktif, setAktif] = useState(awal);
  const [putaran, setPutaran] = useState(0);
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState('');
  const [memuat, mulai] = useTransition();
  /** Membuka satu latihan. */
  function pilih(x) {
    setPesan('');
    setHasil(null);
    setAktif(x);
    setPutaran((n) => n + 1);
  }
  /** Mengirim hasil ke server (WPM dan akurasi dihitung ulang di sana). */
  function selesai(h) {
    mulai(async () => {
      const r = await simpanHasilMengetik({ ...h, wpm: undefined, akurasi: undefined, skor: undefined, mode: aktif.mode, pelajaranId: aktif.pelajaran?.id });
      if (!r.ok) return setPesan(r.error);
      setHasil(r.data);
      router.refresh();
    });
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[1.8em] font-bold">{t('sesiSiswa.menu.mengetik')}</h1>
        <TautanTombol href={gabungJalur(basis, '/mengetik/kemajuan')} varian="secondary" ikon="grafik">
          {t('mengetik.kemajuan')}
        </TautanTombol>
      </div>
      {pesan && (
        <p role="alert" className="flex items-center gap-2 font-semibold text-bad">
          <Ikon nama="peringatan" />
          {pesan}
        </p>
      )}
      {aktif ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[1.2em] font-bold">{aktif.judul}</h2>
            <Button varian="hantu" ikon="kembali" onClick={() => setAktif(null)}>
              {t('mengetik.kembaliMenu')}
            </Button>
          </div>
          {aktif.target && <p className="font-semibold">{t('mengetik.targetTugas', { akurasi: aktif.target.min_akurasi ?? 0, wpm: aktif.target.min_wpm ?? 0 })}</p>}
          {hasil ? (
            <HasilPutaran hasil={hasil} aktif={aktif} ulang={() => pilih(aktif)} kembali={() => setAktif(null)} />
          ) : aktif.mode === 'game' ? (
            <HujanKata key={putaran} kata={aktif.kata} onSelesai={selesai} />
          ) : (
            <AreaMengetik key={putaran} teks={aktif.teks} onSelesai={selesai} nonaktif={memuat} />
          )}
        </Card>
      ) : (
        <>
          <PilihanLatihan pilih={pilih} setPesan={setPesan} memuat={memuat} mulai={mulai} />
          <section className="space-y-3">
            <h2 className="text-[1.2em] font-bold">{t('mengetik.pelajaranBertahap')}</h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pelajaran.map((p) => (
                <KartuPelajaran key={p.id} p={p} pilih={pilih} />
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
