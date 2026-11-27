'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { JENIS_GAME_MOUSE } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TombolKembali from '@/modules/shared/ui/TombolKembali';
import { useArea } from '@/modules/shared/ui/AreaContext';
import { gabungJalur } from '@/utils/jalurArea';
import AreaGame from './AreaGame';
import { GameBalon, GameGulung, GameKeranjang, GameKlikKanan, GameKotak } from './GameMouse';
import { simpanHasilLatihan } from './latihan.actions';

/** Komponen isi tiap jenis game. */
const GAME = { mouse_klik: GameBalon, mouse_klik_ganda: GameKotak, mouse_drag: GameKeranjang, mouse_klik_kanan: GameKlikKanan, mouse_scroll: GameGulung };

/**
 * Halaman Latihan Mouse (siswa): pilih salah satu dari 5 game (mode bebas 60 detik), atau langsung main bila
 * dibuka dari kartu tugas (`tugas`: jenis dan target skor dari kunci, tanpa batas waktu).
 * Bila `sesiAktif` false (belum absen/sudah pulang), game tetap bisa dimainkan tetapi hasil tidak disimpan.
 */
export default function KlienLatihanMouse({ tugas, sesiAktif }) {
  const router = useRouter();
  const { basis } = useArea();
  const [jenis, setJenis] = useState(tugas?.kunci.jenis ?? null);
  const [pesan, setPesan] = useState({ teks: '', nada: 'sukses' });
  const [, mulai] = useTransition();
  const target = tugas && tugas.kunci.jenis === jenis ? Number(tugas.kunci.min_skor) : null;
  /** Menyimpan hasil game; tugas yang cocok otomatis selesai. Tanpa sesi hanya menampilkan info. */
  function selesai(hasil) {
    // di luar sesi server menolak (403): jangan kirim, cukup beri tahu bahwa hasil tidak tersimpan
    if (!sesiAktif) return setPesan({ teks: t('latihan.belumAbsen'), nada: 'info' });
    mulai(async () => {
      const r = await simpanHasilLatihan({ jenis, ...hasil });
      if (!r.ok) return setPesan({ teks: r.error, nada: 'bahaya' });
      setPesan(r.data.tugasSelesai.length > 0 ? { teks: t('game.tugasSelesai'), nada: 'sukses' } : { teks: t('game.tersimpan'), nada: 'info' });
      router.refresh();
    });
  }
  const Isi = jenis ? GAME[jenis] : null;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[1.8em] font-bold">{t('sesiSiswa.menu.latihanMouse')}</h1>
      {/* keterangan tetap sejak awal; disembunyikan bila pesan yang sama sudah tampil di bawahnya */}
      {!sesiAktif && !pesan.teks && (
        <p role="status" className="flex items-center gap-2 font-semibold text-muted">
          <Ikon nama="info" />
          {t('latihan.belumAbsen')}
        </p>
      )}
      {pesan.teks && (
        <p role="status" className={`flex items-center gap-2 font-bold ${pesan.nada === 'bahaya' ? 'text-bad' : 'text-ok'}`}>
          <Ikon nama={pesan.nada === 'bahaya' ? 'peringatan' : 'sukses'} />
          {pesan.teks}
        </p>
      )}
      {Isi ? (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[1.2em] font-bold">{t(`game.nama.${jenis}`)}</h2>
            {target && <Badge nada="info">{t('game.targetTugas', { target })}</Badge>}
            {/* dari tugas/dashboard: kembali ke halaman asal; dari menu: kembali ke daftar game */}
            {tugas ? (
              <TombolKembali cadangan={gabungJalur(basis, '/')} />
            ) : (
              <Button varian="hantu" ikon="kembali" onClick={() => setJenis(null)}>
                {t('umum.kembali')}
              </Button>
            )}
          </div>
          <AreaGame key={jenis} judul={t(`game.nama.${jenis}`)} petunjuk={t(`game.petunjuk.${jenis}`)} target={target} onSelesai={selesai}>
            {(props) => <Isi {...props} />}
          </AreaGame>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JENIS_GAME_MOUSE.map((j) => (
            <Card as="li" key={j} className="space-y-2">
              <p className="font-display text-[1.2em] font-bold">{t(`game.nama.${j}`)}</p>
              <p className="text-muted">{t(`game.petunjuk.${j}`)}</p>
              <Button ukuran="lg" ikon="main" onClick={() => setJenis(j)}>
                {t('game.main')}
              </Button>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
