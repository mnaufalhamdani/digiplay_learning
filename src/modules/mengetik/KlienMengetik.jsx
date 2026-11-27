'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { hitungAkurasi, hitungBintang, hitungWpm } from '@/utils/mengetik';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import TombolKembali from '@/modules/shared/ui/TombolKembali';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import AreaMengetik from './AreaMengetik';
import HujanKata from './HujanKata';
import { ambilKataGame, ambilTeksAcak, ambilTeksAdaptif, simpanHasilMengetik } from './mengetik.actions';

/**
 * Gambar kecil posisi jari (jari berwarna per zona) sebagai pengingat. Mengambang di kanan bawah layar, bisa diseret
 * lewat bilah judulnya (mouse maupun sentuh) dan ditutup lewat tombol X. Bila berkasnya gagal dimuat, panel
 * disembunyikan lewat `onGagal` (tanpa ikon gambar rusak). `tampil` false menyembunyikan panel tanpa melepasnya,
 * sehingga posisi seretan tetap terjaga saat siswa berpindah antara menu dan latihan.
 */
function PosisiJari({ url, tampil, onGagal, onTutup }) {
  const ref = useRef(null);
  const panel = useRef(null);
  const geser = useRef(null);
  const [pos, setPos] = useState(null);
  const panggilGagal = useRef(onGagal);
  panggilGagal.current = onGagal;
  /** Menjaga panel tetap di dalam layar (x, y = sudut kiri atas). */
  function batasi(x, y) {
    const { width, height } = panel.current.getBoundingClientRect();
    return { x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - width)), y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - height)) };
  }
  useEffect(() => {
    const img = ref.current;
    // gambar bisa sudah gagal dimuat sebelum React terpasang (onError terlewat)
    if (img?.complete && img.naturalWidth === 0) panggilGagal.current();
  }, []);
  // layar dikecilkan: panel yang sudah digeser ditarik masuk lagi agar tidak hilang di luar layar
  useEffect(() => {
    const sesuaikan = () => setPos((p) => (p && panel.current ? batasi(p.x, p.y) : p));
    window.addEventListener('resize', sesuaikan);
    return () => window.removeEventListener('resize', sesuaikan);
  }, []);
  /** Mulai menyeret dari bilah judul (tombol tutup tidak ikut menyeret). */
  function mulaiGeser(e) {
    if (e.target.closest('button')) return;
    const r = panel.current.getBoundingClientRect();
    geser.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  /** Memindahkan panel mengikuti penunjuk selama seretan berlangsung. */
  function gerakkan(e) {
    if (geser.current) setPos(batasi(e.clientX - geser.current.dx, e.clientY - geser.current.dy));
  }
  return (
    <div
      ref={panel}
      // mencegah klik/seret panel merebut fokus dari area ketik, supaya siswa bisa terus mengetik tanpa klik ulang
      onMouseDown={(e) => e.preventDefault()}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      className={`fixed z-40 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-line bg-panel shadow-lg ${pos ? '' : 'bottom-4 right-4'} ${tampil ? '' : 'hidden'}`}
    >
      <div
        title={t('mengetik.posisiJariGeser')}
        onPointerDown={mulaiGeser}
        onPointerMove={gerakkan}
        onPointerUp={() => (geser.current = null)}
        onPointerCancel={() => (geser.current = null)}
        className="flex cursor-grab touch-none select-none items-center justify-between gap-2 px-3 py-1 font-bold active:cursor-grabbing"
      >
        <span>{t('mengetik.posisiJariJudul')}</span>
        <Button varian="hantu" ikon="tutup" aria-label={t('mengetik.posisiJariTutup')} onClick={onTutup} />
      </div>
      <div className="px-3 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- PNG lokal statis, tidak perlu optimasi next/image */}
        <img ref={ref} src={url} alt={t('mengetik.posisiJariAlt')} width={2752} height={1536} loading="lazy" onError={onGagal} className="h-auto w-full select-none rounded-md object-contain" draggable={false} />
      </div>
    </div>
  );
}

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

/**
 * Hasil tampilan di klien (tanpa sesi, tidak disimpan): pakai wpm/akurasi dari `h` bila berupa angka,
 * selain itu hitung dari jumlah karakter dan durasi; bila data tidak cukup, hasilnya 0.
 */
function hitungHasilTampilan(h) {
  const benar = Number(h?.jumlahKarakterBenar);
  const diketik = Number(h?.jumlahKarakterDiketik);
  const durasi = Number(h?.durasiDetik);
  const dataCukup = Number.isFinite(benar) && Number.isFinite(diketik) && Number.isFinite(durasi) && diketik > 0 && durasi > 0;
  // wpm/akurasi sudah dihitung oleh area mengetik atau game; bila tidak, hitung dari data mentah
  const wpm = Number.isFinite(h?.wpm) ? h.wpm : dataCukup ? hitungWpm(benar, durasi) : 0;
  const akurasi = Number.isFinite(h?.akurasi) ? h.akurasi : dataCukup ? hitungAkurasi(benar, diketik) : 0;
  return { wpm, akurasi, tugasSelesai: [] };
}

/** Hasil setelah satu putaran: angka dari server, bintang (pelajaran), tugas selesai, atau "Hampir!". Tanpa sesi: tanpa bintang dan ada keterangan belum tersimpan. */
function HasilPutaran({ hasil, aktif, ulang, dariTugas, kembali, sesiAktif }) {
  const { basis } = useArea();
  // tanpa sesi hasil tidak tersimpan, jadi bintang tidak dihitung agar tidak menyiratkan kemajuan
  const bintang = sesiAktif && aktif.pelajaran ? hitungBintang(hasil.wpm, hasil.akurasi, aktif.pelajaran.target_wpm, aktif.pelajaran.target_akurasi) : null;
  const hebat = (bintang ?? 1) > 0 || hasil.tugasSelesai?.length > 0;
  return (
    <Card varian="terangkat" className="flex flex-col items-center gap-3 text-center">
      <Maskot suasana={hebat ? 'merayakan' : 'menyemangati'} ukuran={120} />
      <p className="font-display text-[1.4em] font-bold">{t('mengetik.hasil', { wpm: hasil.wpm, akurasi: hasil.akurasi })}</p>
      {!sesiAktif && (
        <p role="status" className="font-semibold text-muted">
          {t('latihan.belumAbsen')}
        </p>
      )}
      {bintang !== null && (bintang > 0 ? <Bintang jumlah={bintang} /> : <p className="font-semibold">{t('mengetik.targetBelum')}</p>)}
      {hasil.tugasSelesai?.length > 0 && <Badge nada="sukses">{t('mengetik.tugasSelesai')}</Badge>}
      {hasil.hampir && <p className="font-semibold text-warn">{t('mengetik.hampir', { wpm: hasil.hampir.minWpm, akurasi: hasil.hampir.minAkurasi })}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button ikon="acak" onClick={ulang}>
          {t('mengetik.cobaLagi')}
        </Button>
        {dariTugas ? (
          // dibuka dari tugas/dashboard: kembali ke halaman asal
          <TombolKembali varian="secondary" cadangan={gabungJalur(basis, '/')} />
        ) : (
          // dibuka manual dari menu: kembali ke pilihan latihan
          <Button varian="secondary" ikon="kembali" onClick={kembali}>
            {t('umum.kembali')}
          </Button>
        )}
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
 * `sesiAktif` false (belum absen / sudah pulang): boleh mencoba, tetapi hasil tidak dikirim ke server.
 */
export default function KlienMengetik({ pelajaran, tugas, gambarJari = null, sesiAktif = true }) {
  const router = useRouter();
  const { basis } = useArea();
  const awal = tugas ? { judul: tugas.soal, teks: tugas.kunci.teks_ketik, mode: 'latihan', target: tugas.kunci } : null;
  const [aktif, setAktif] = useState(awal);
  const [putaran, setPutaran] = useState(0);
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState('');
  const [jariGagal, setJariGagal] = useState(false);
  const [jariTutup, setJariTutup] = useState(false);
  const [memuat, mulai] = useTransition();
  const tampilJari = Boolean(gambarJari) && !jariGagal && !jariTutup;
  /** Membuka satu latihan. */
  function pilih(x) {
    setPesan('');
    setHasil(null);
    setAktif(x);
    setPutaran((n) => n + 1);
  }
  /** Mengirim hasil ke server (WPM dan akurasi dihitung ulang di sana); tanpa sesi hanya menampilkan hasil hitungan klien. */
  function selesai(h) {
    // di luar sesi server menolak (403): jangan kirim, cukup tampilkan hasil
    if (!sesiAktif) return setHasil(hitungHasilTampilan(h));
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
      {!sesiAktif && (
        <p role="status" className="flex items-center gap-2 font-semibold text-muted">
          <Ikon nama="info" />
          {t('latihan.belumAbsen')}
        </p>
      )}
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
            {tugas ? (
              // dibuka dari tugas/dashboard: kembali ke halaman asal
              <TombolKembali cadangan={gabungJalur(basis, '/')} />
            ) : (
              // dibuka manual dari menu: kembali ke pilihan latihan
              <Button varian="hantu" ikon="kembali" onClick={() => setAktif(null)}>
                {t('umum.kembali')}
              </Button>
            )}
          </div>
          {aktif.target && <p className="font-semibold">{t('mengetik.targetTugas', { akurasi: aktif.target.min_akurasi ?? 0, wpm: aktif.target.min_wpm ?? 0 })}</p>}
          {hasil ? (
            <HasilPutaran hasil={hasil} aktif={aktif} ulang={() => pilih(aktif)} dariTugas={Boolean(tugas)} kembali={() => setAktif(null)} sesiAktif={sesiAktif} />
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
      {/* gambar posisi jari mengambang: tetap terpasang agar posisi seretannya terjaga, tampil hanya saat mengetik */}
      {tampilJari && <PosisiJari url={gambarJari} tampil={Boolean(aktif)} onGagal={() => setJariGagal(true)} onTutup={() => setJariTutup(true)} />}
    </div>
  );
}
