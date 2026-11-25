'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { JENIS_GAMBAR_UNDUH, PENILAIAN, STATUS_TUGAS, TIPE_LATIHAN_WEB } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import TextField from '@/modules/shared/ui/TextField';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import OpsiJawaban from '@/modules/shared/ui/domain/OpsiJawaban';
import { gabungJalur } from '@/utils/jalurArea';
import { useArea } from '@/modules/shared/ui/AreaContext';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import { gantiTugasSiswa, kirimJawaban, lewatiTugas } from './tugas.actions';

/** Nada lencana per status tugas (selalu berteks). */
const NADA_STATUS = { belum: 'netral', selesai: 'sukses', dilewati: 'peringatan' };

/** Isian jawaban tugas otomatis: pilihan ganda (4 kartu) atau kolom teks/angka, dengan tombol Periksa. */
function IsianJawaban({ tugas, nonaktif, onKirim, memuat, hasil, setHasil }) {
  const [jawaban, setJawaban] = useState('');
  const pg = tugas.tipe === 'pilihan_ganda';
  /** Kirim jawaban saat form dikirim (Enter atau tombol Periksa). */
  function kirim(e) {
    e.preventDefault();
    // belum memilih/mengetik apa pun: tidak perlu ke server
    if (String(jawaban).trim() === '') return;
    onKirim(jawaban);
  }
  /** Mengubah jawaban sekaligus menghapus umpan balik lama agar siswa bisa mencoba lagi. */
  function ubah(nilai) {
    setJawaban(nilai);
    setHasil(null);
  }
  return (
    <form onSubmit={kirim} className="space-y-3" noValidate>
      {pg ? (
        <OpsiJawaban opsi={tugas.opsi} terpilih={jawaban} onPilih={ubah} hasil={hasil} nonaktif={nonaktif} />
      ) : (
        <TextField label={t('sesiSiswa.jawabanmu')} ukuran="lg" value={jawaban} onChange={(e) => ubah(e.target.value)} disabled={nonaktif} autoComplete="off" />
      )}
      <Button type="submit" ukuran="lg" ikon="sukses" memuat={memuat} disabled={nonaktif || String(jawaban).trim() === ''}>
        {t('sesiSiswa.periksa')}
      </Button>
    </form>
  );
}

/** Umpan balik setelah Periksa: benar (merayakan) atau salah (menyemangati, boleh coba lagi). */
function UmpanBalik({ hasil }) {
  // belum diperiksa
  if (!hasil) return null;
  const benar = hasil === 'benar';
  return (
    <div role="status" className={`flex items-center gap-2 rounded-lg p-2 font-bold ${benar ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
      <Maskot suasana={benar ? 'merayakan' : 'menyemangati'} ukuran={96} />
      <span className="flex items-center gap-1.5">
        <Ikon nama={benar ? 'sukses' : 'salah'} />
        {t(benar ? 'sesiSiswa.benarPesan' : 'sesiSiswa.salahPesan')}
      </span>
    </div>
  );
}

/** Halaman latihan web per tipe tugas beserta label tombolnya (D1.6). */
const LATIHAN_WEB = {
  game_mouse: { jalur: '/latihan-mouse', label: 'sesiSiswa.main' },
  puzzle: { jalur: '/puzzle', label: 'sesiSiswa.kerjakan' },
  mengetik: { jalur: '/mengetik', label: 'sesiSiswa.kerjakan' },
};

/** Tombol menuju game/puzzle/mengetik dengan tugas ini; target skor game ikut ditampilkan. */
function TombolLatihanWeb({ tugas }) {
  const { basis } = useArea();
  const tujuan = LATIHAN_WEB[tugas.tipe];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TautanTombol href={gabungJalur(basis, `${tujuan.jalur}?tugas=${tugas.id}`)} ukuran="lg" ikon="main">
        {t(tujuan.label)}
      </TautanTombol>
      {tugas.tipe === 'game_mouse' && <Badge nada="info">{t('game.targetTugas', { target: tugas.kunci.min_skor })}</Badge>}
    </div>
  );
}

/** Bagian kerja sesuai jenis tugas: jawaban otomatis, latihan web, atau menunggu dicek tutor. */
function BagianKerja({ tugas, ...props }) {
  // game mouse, puzzle, dan mengetik dikerjakan di halaman latihannya dan selesai otomatis
  if (TIPE_LATIHAN_WEB.includes(tugas.tipe)) return <TombolLatihanWeb tugas={tugas} />;
  if (tugas.penilaian === PENILAIAN.TUTOR) {
    return (
      <Badge nada="info">
        <Ikon nama="jam" />
        {t('sesiSiswa.menungguTutor')}
      </Badge>
    );
  }
  return <IsianJawaban tugas={tugas} {...props} />;
}

/** Tombol unduh bahan gambar (mewarnai.png / berwarna.png) milik tugas ini. */
function TombolUnduh({ tugas }) {
  const bahan = tugas.gambar.filter((g) => JENIS_GAMBAR_UNDUH.includes(g.jenis));
  // tugas tanpa gambar yang bisa diunduh
  if (bahan.length === 0) return null;
  return bahan.map((g) => (
    <a key={g.kode} href={`/api/v1/tugas/unduh?tugasId=${tugas.id}&kode=${encodeURIComponent(g.kode)}`} download className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-btn)] border-2 border-line bg-panel px-4 font-bold hover:bg-primary-soft">
      <Ikon nama="unduh" />
      {t('sesiSiswa.unduhBahan', { nama: g.nama })}
    </a>
  ));
}

/**
 * Satu tugas di beranda siswa: soal, status, cara mengerjakan, Unduh bahan, Ganti tugas, dan Lewati (dengan ConfirmDialog).
 * Setelah aksi berhasil, data dimuat ulang dari server.
 */
export default function KartuTugas({ tugas, nomor }) {
  const router = useRouter();
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [memuat, mulai] = useTransition();
  const belum = tugas.status === STATUS_TUGAS.BELUM;
  /** Menjalankan action lalu memuat ulang; galat tampil di kartu. */
  function jalankan(action, input, setelah = null) {
    setGalat('');
    mulai(async () => {
      const r = await action(input);
      // ditolak (mis. sesi sudah ditutup, tidak ada pengganti): tampilkan pesan ramah
      if (!r.ok) return setGalat(r.error);
      setelah?.(r.data);
      router.refresh();
    });
  }
  return (
    <Card varian="terangkat" as="article" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[1.1em] font-bold">{t('sesiSiswa.tugasKe', { nomor })}</span>
        <Badge nada={NADA_STATUS[tugas.status] ?? 'netral'}>{t(`sesiSiswa.status.${tugas.status}`)}</Badge>
      </div>
      <p className="text-[1.1em] whitespace-pre-wrap">{tugas.soal}</p>
      <div className="flex flex-wrap gap-2">
        <TombolUnduh tugas={tugas} />
      </div>
      {belum && <BagianKerja tugas={tugas} nonaktif={memuat} memuat={memuat} hasil={hasil} setHasil={setHasil} onKirim={(jawaban) => jalankan(kirimJawaban, { tugasId: tugas.id, jawaban }, (d) => setHasil(d.benar ? 'benar' : 'salah'))} />}
      <UmpanBalik hasil={hasil} />
      {galat && (
        <p role="alert" className="flex items-center gap-1.5 font-semibold text-bad">
          <Ikon nama="peringatan" />
          {galat}
        </p>
      )}
      {belum && (
        <div className="flex flex-wrap gap-2 border-t-2 border-line pt-3">
          <Button varian="secondary" ikon="acak" disabled={memuat} onClick={() => jalankan(gantiTugasSiswa, { tugasId: tugas.id })}>
            {t('sesiSiswa.gantiTugas')}
          </Button>
          <Button varian="hantu" ikon="lewati" disabled={memuat} onClick={() => setKonfirmasi(true)}>
            {t('sesiSiswa.lewati')}
          </Button>
        </div>
      )}
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t('sesiSiswa.lewatiJudul')}
        pesan={t('sesiSiswa.lewatiPesan')}
        labelYa={t('sesiSiswa.lewatiYa')}
        labelBatal={t('siswa.tidakJadi')}
        maskot="menyemangati"
        memuat={memuat}
        onYa={() => jalankan(lewatiTugas, { tugasId: tugas.id }, () => setKonfirmasi(false))}
        onBatal={() => setKonfirmasi(false)}
      />
    </Card>
  );
}
