'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { KEPING_PUZZLE } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Select from '@/modules/shared/ui/Select';
import TombolKembali from '@/modules/shared/ui/TombolKembali';
import { useArea } from '@/modules/shared/ui/AreaContext';
import { gabungJalur } from '@/utils/jalurArea';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import PapanPuzzle from './PapanPuzzle';
import { ambilGambarPuzzle, simpanHasilLatihan } from './latihan.actions';

/** URL puzzle.png sebuah subjek. */
const urlPuzzle = (kode) => `/aset/gambar/${kode}/puzzle.png`;

/** Pilihan mode bebas: kategori (opsional) dan tingkat 4/6/9 keping. */
function PilihPuzzle({ kategori, mulai, memuat }) {
  const [pilihan, setPilihan] = useState({ kategori: '', keping: 4 });
  return (
    <Card className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label={t('puzzle.kategori')} value={pilihan.kategori} onChange={(e) => setPilihan((p) => ({ ...p, kategori: e.target.value }))} opsi={[{ nilai: '', label: t('umum.semua') }, ...kategori.map((k) => ({ nilai: k, label: t(`gambar.kategori.${k}`) }))]} />
        <fieldset className="space-y-1">
          <legend className="font-semibold">{t('puzzle.tingkat')}</legend>
          <div className="flex gap-2">
            {KEPING_PUZZLE.map((k) => (
              <Button key={k} varian={pilihan.keping === k ? 'primary' : 'secondary'} aria-pressed={pilihan.keping === k} onClick={() => setPilihan((p) => ({ ...p, keping: k }))}>
                {t('puzzle.jumlahKeping', { jumlah: k })}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>
      <Button ukuran="lg" ikon="main" memuat={memuat} onClick={() => mulai(pilihan)}>
        {t('puzzle.mulai')}
      </Button>
    </Card>
  );
}

/**
 * Halaman Puzzle (siswa, D1.5): mode bebas (pilih kategori dan tingkat, gambar acak) atau dari tugas
 * (gambar dan jumlah keping dari tugas). Selesai -> hasil tersimpan, Konfeti dan Zippy merayakan.
 * Bila `sesiAktif` false (belum absen/sudah pulang), puzzle tetap bisa dimainkan dan dirayakan, tetapi hasil tidak disimpan.
 */
export default function KlienPuzzle({ tugas, kategori, sesiAktif }) {
  const router = useRouter();
  const { basis } = useArea();
  const dariTugas = tugas ? { kode: tugas.gambar[0]?.kode, nama: tugas.gambar[0]?.nama, keping: Number(tugas.kunci.keping) } : null;
  const [main, setMain] = useState(dariTugas);
  const [putaran, setPutaran] = useState(0);
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState('');
  const [memuat, mulai] = useTransition();
  /** Mode bebas: minta gambar acak dari server lalu mulai. */
  function mulaiBebas(pilihan) {
    mulai(async () => {
      const r = await ambilGambarPuzzle({ kategori: pilihan.kategori || undefined });
      if (!r.ok) return setGalat(r.error);
      setGalat('');
      setHasil(null);
      setMain({ ...r.data, keping: pilihan.keping });
      setPutaran((n) => n + 1);
    });
  }
  /** Semua keping benar: simpan hasil (tugas yang cocok otomatis selesai). Tanpa sesi hanya dirayakan. */
  function selesai({ durasiDetik }) {
    // di luar sesi server menolak (403): lewati penyimpanan, tetap tampilkan perayaan tanpa tugas selesai
    if (!sesiAktif) return setHasil({ tugasSelesai: [] });
    mulai(async () => {
      const r = await simpanHasilLatihan({ jenis: 'puzzle', keping: main.keping, kode: main.kode, selesai: true, durasiDetik });
      if (!r.ok) return setGalat(r.error);
      setHasil(r.data);
      router.refresh();
    });
  }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[1.8em] font-bold">{t('sesiSiswa.menu.puzzle')}</h1>
      {/* keterangan tetap sejak awal agar siswa tahu hasilnya tidak tersimpan */}
      {!sesiAktif && (
        <p role="status" className="flex items-center gap-2 font-semibold text-muted">
          <Ikon nama="info" />
          {t('latihan.belumAbsen')}
        </p>
      )}
      {galat && (
        <p role="alert" className="flex items-center gap-2 font-semibold text-bad">
          <Ikon nama="peringatan" />
          {galat}
        </p>
      )}
      {!main ? (
        <PilihPuzzle kategori={kategori} mulai={mulaiBebas} memuat={memuat} />
      ) : (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[1.2em] font-bold">{t('puzzle.judul', { nama: main.nama, keping: main.keping })}</h2>
            {dariTugas && <Badge nada="info">{t('puzzle.dariTugas')}</Badge>}
            {/* dari tugas/dashboard: kembali ke halaman asal; dari menu: kembali ke pilihan puzzle */}
            {tugas ? (
              <TombolKembali cadangan={gabungJalur(basis, '/')} />
            ) : (
              <Button varian="hantu" ikon="kembali" onClick={() => setMain(null)}>
                {t('umum.kembali')}
              </Button>
            )}
          </div>
          {hasil && (
            <div role="status" className="flex flex-col items-center gap-2 text-center">
              <Maskot suasana="merayakan" ukuran={110} />
              <p className="font-display text-[1.3em] font-bold">{t(hasil.tugasSelesai.length > 0 ? 'puzzle.tugasSelesai' : 'puzzle.selesai')}</p>
              <Button
                ikon="acak"
                onClick={() => {
                  setHasil(null);
                  // dari tugas: ulangi gambar yang sama; mode bebas: kembali memilih
                  if (dariTugas) setPutaran((n) => n + 1);
                  else setMain(null);
                }}
              >
                {t('puzzle.mainLagi')}
              </Button>
            </div>
          )}
          <PapanPuzzle key={putaran} src={urlPuzzle(main.kode)} keping={main.keping} onSelesai={selesai} />
          <Konfeti tampil={Boolean(hasil)} />
        </Card>
      )}
    </div>
  );
}
