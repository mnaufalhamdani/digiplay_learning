'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { hitungBlok, periksaProgram } from '@/modules/shared/blockly/daftarBlok';
import { simulasiProgram } from '@/modules/shared/blockly/simulasiProgram';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import TombolKembali from '@/modules/shared/ui/TombolKembali';
import Konfeti from '@/modules/shared/ui/domain/Konfeti';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import PapanLabirin from './PapanLabirin';
import { simpanHasilBlockly } from './blockly.actions';

// Pustaka Blockly besar: dimuat hanya di halaman ini dan hanya di browser (tanpa SSR)
const EditorBlockly = dynamic(() => import('./EditorBlockly'), {
  ssr: false,
  loading: () => (
    <Card className="flex h-[24rem] items-center justify-center text-muted sm:h-[28rem]">
      <Ikon nama="memuat" className="animate-spin" />
      <span className="ml-2 font-semibold">{t('blockly.memuat')}</span>
    </Card>
  ),
});

/** Jeda tiap langkah animasi (ms): lebih cepat untuk jejak panjang agar tidak terlalu lama menunggu. */
const jedaLangkah = (jumlah) => Math.min(400, Math.max(40, 4000 / jumlah));

/** Umpan balik setelah Jalankan: pesan ramah per sebab gagal atau perayaan bila berhasil (tanpa menyalahkan siswa). */
function UmpanBalik({ hasil, program, tersedia }) {
  const berhasil = hasil.berhasil;
  // program tidak sah: tambahkan sebab pertama (mis. ulangi bersarang terlalu dalam) agar jelas apa yang diperbaiki
  const rinci = hasil.alasan === 'tidak_valid' ? periksaProgram(program, { tersedia })[0]?.pesan : null;
  return (
    <div role="status" className={`flex items-center gap-3 rounded-lg p-3 font-bold ${berhasil ? 'bg-ok-soft text-ok' : 'bg-primary-soft text-fg'}`}>
      <Maskot suasana={berhasil ? 'merayakan' : 'menyemangati'} ukuran={84} />
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[1.1em]">
          <Ikon nama={berhasil ? 'sukses' : 'info'} />
          {t(berhasil ? 'blockly.hasil.berhasil' : `blockly.hasil.${hasil.alasan}`)}
        </p>
        {rinci && <p className="text-[0.9em] font-semibold text-muted">{rinci}</p>}
      </div>
    </div>
  );
}

/**
 * Halaman satu labirin Coding Zippy (siswa): papan labirin, editor blok, dan tombol Jalankan/Ulang/Petunjuk.
 * Program disimulasikan di browser dengan penerjemah bersama (simulasiProgram) hanya untuk animasi dan umpan balik;
 * bila berhasil dan sesi berlangsung, program dikirim ke server yang MENILAI SENDIRI dan menyimpan hasilnya.
 * `tugas`: tugas bertipe blockly untuk labirin ini (atau null). `sesiAktif`: hasil hanya tersimpan saat sesi berlangsung.
 */
export default function KlienLabirin({ labirin, sesiAktif, tugas }) {
  const router = useRouter();
  const { basis } = useArea();
  const awal = { x: labirin.mulai.x, y: labirin.mulai.y, arah: labirin.mulai.arah };
  const [posisi, setPosisi] = useState(awal);
  const [tabrak, setTabrak] = useState(false);
  const [animasi, setAnimasi] = useState(true);
  const [fase, setFase] = useState('siap');
  const [jumlahBlok, setJumlahBlok] = useState(0);
  const [hasil, setHasil] = useState(null);
  const [info, setInfo] = useState(null);
  const [petunjuk, setPetunjuk] = useState(false);
  const [, mulai] = useTransition();
  const program = useRef([]);
  const timer = useRef(null);
  const faseRef = useRef('siap');
  const waktuMulai = useRef(Date.now());

  /** Mengatur fase (state untuk tampilan, ref untuk pembacaan di callback Blockly yang tidak ikut render). */
  const aturFase = useCallback((f) => {
    faseRef.current = f;
    setFase(f);
  }, []);
  /** Menghentikan animasi yang sedang berjalan. */
  const hentikan = useCallback(() => clearTimeout(timer.current), []);
  /** Mengembalikan Zippy ke awal dan menghapus umpan balik (blok dibiarkan). */
  const kembaliKeAwal = useCallback(() => {
    hentikan();
    setPosisi({ x: labirin.mulai.x, y: labirin.mulai.y, arah: labirin.mulai.arah });
    setTabrak(false);
    setHasil(null);
    setInfo(null);
    aturFase('siap');
  }, [aturFase, hentikan, labirin.mulai.arah, labirin.mulai.x, labirin.mulai.y]);

  // animasi dihentikan saat halaman ditutup
  useEffect(() => hentikan, [hentikan]);

  /** Dipanggil editor setiap susunan blok berubah: simpan program, hitung blok, dan reset hasil lama bila tidak sedang berjalan. */
  const saatProgramBerubah = useCallback(
    (p) => {
      program.current = p;
      setJumlahBlok(hitungBlok(p));
      // siswa mengubah blok setelah satu putaran: Zippy kembali ke awal dan umpan balik lama hilang
      if (faseRef.current === 'selesai') kembaliKeAwal();
    },
    [kembaliKeAwal],
  );

  /** Mengirim program yang berhasil ke server untuk dinilai dan disimpan; di luar sesi hanya memberi keterangan. */
  function simpan() {
    // belum diabsen: boleh mencoba, tetapi tidak ada yang disimpan
    if (!sesiAktif) return setInfo({ teks: t('blockly.tidakTersimpan'), nada: 'info' });
    mulai(async () => {
      const durasiDetik = Math.min(65535, Math.round((Date.now() - waktuMulai.current) / 1000));
      const r = await simpanHasilBlockly({ kode: labirin.kode, program: program.current, durasiDetik });
      // ditolak (mis. sesi sudah ditutup) atau server menilai berbeda: tampilkan pesan ramah
      if (!r.ok || !r.data.berhasil) return setInfo({ teks: r.ok ? t('blockly.gagalSimpan') : r.error, nada: 'bahaya' });
      setInfo({ teks: t(r.data.tugasSelesai.length > 0 ? 'blockly.tugasSelesai' : 'blockly.tersimpan'), nada: 'sukses' });
      router.refresh();
    });
  }

  /** Akhir animasi: tampilkan umpan balik, dan simpan bila berhasil. */
  function selesaiJalan(h) {
    setTabrak(false);
    setHasil(h);
    aturFase('selesai');
    if (h.berhasil) simpan();
  }

  /** Menjalankan program: animasi mengikuti jejak penerjemah (atau langsung ke hasil bila pengguna memilih kurangi gerakan). */
  function jalankan() {
    kembaliKeAwal();
    const h = simulasiProgram(labirin, program.current);
    const akhir = h.jejak[h.jejak.length - 1];
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAnimasi(!kurangiGerak);
    // program tidak bisa dijalankan, atau pengguna meminta gerak dikurangi: loncat ke hasil akhir
    if (h.jejak.length <= 1 || kurangiGerak) {
      if (akhir) setPosisi({ x: akhir.x, y: akhir.y, arah: akhir.arah });
      return selesaiJalan(h);
    }
    aturFase('jalan');
    const jeda = jedaLangkah(h.jejak.length);
    /** Menampilkan langkah ke-i lalu menjadwalkan berikutnya. */
    const putar = (i) => {
      const j = h.jejak[i];
      setPosisi({ x: j.x, y: j.y, arah: j.arah });
      setTabrak(j.aksi === 'tabrak');
      if (i >= h.jejak.length - 1) timer.current = setTimeout(() => selesaiJalan(h), 400);
      else timer.current = setTimeout(() => putar(i + 1), jeda);
    };
    timer.current = setTimeout(() => putar(1), jeda);
  }

  const berlebih = jumlahBlok > labirin.batas_blok;
  const jalan = fase === 'jalan';
  const dariTugas = tugas?.labirin === labirin.nama;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* dari kartu tugas: kembali ke halaman asal (dashboard); dari daftar labirin: kembali ke daftar labirin */}
        {tugas ? (
          <TombolKembali cadangan={gabungJalur(basis, '/')} />
        ) : (
          <TautanTombol href={gabungJalur(basis, '/coding-zippy')} varian="hantu" ikon="kembali">
            {t('umum.kembali')}
          </TautanTombol>
        )}
        <h1 className="font-display text-[1.6em] font-bold">{labirin.nama}</h1>
        {dariTugas && <Badge nada="info">{t('blockly.tugasIni')}</Badge>}
        {labirin.sudahSelesai && (
          <Badge nada="sukses">
            <Ikon nama="sukses" />
            {t('blockly.sudahSelesai')}
          </Badge>
        )}
      </div>
      {!sesiAktif && (
        <p className="flex items-center gap-2 rounded-lg bg-warn-soft p-3 font-semibold text-warn">
          <Ikon nama="info" />
          {t('blockly.belumAbsen')}
        </p>
      )}
      {/* layar sempit: papan di atas, editor di bawahnya; layar lebar: berdampingan */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="space-y-4 self-start">
          <PapanLabirin labirin={labirin} posisi={posisi} animasi={animasi} tabrak={tabrak} />
          <div className="flex flex-wrap items-center gap-2">
            <Button ukuran="lg" ikon="main" onClick={jalankan} disabled={jalan}>
              {t('blockly.jalankan')}
            </Button>
            <Button varian="secondary" ukuran="lg" ikon="kembalikan" onClick={kembaliKeAwal}>
              {t('blockly.ulang')}
            </Button>
            <Button varian="hantu" ikon="petunjuk" aria-expanded={petunjuk} onClick={() => setPetunjuk((v) => !v)}>
              {t('blockly.petunjukTombol')}
            </Button>
            <Badge nada={berlebih ? 'bahaya' : 'netral'} className="ml-auto text-[1em]">
              {berlebih && <Ikon nama="peringatan" />}
              {t('blockly.jumlahBlok', { jumlah: jumlahBlok, batas: labirin.batas_blok })}
              {berlebih && <span> · {t('blockly.blokBerlebih')}</span>}
            </Badge>
          </div>
          {petunjuk && (
            <div className="rounded-lg bg-primary-soft p-3">
              <p className="flex items-center gap-1.5 font-bold">
                <Ikon nama="petunjuk" />
                {t('blockly.petunjukJudul')}
              </p>
              <p className="mt-1">{labirin.petunjuk}</p>
            </div>
          )}
          {jalan && <p className="font-semibold text-muted">{t('blockly.berjalan')}</p>}
          {hasil && <UmpanBalik hasil={hasil} program={program.current} tersedia={labirin.blok_tersedia} />}
          {info && (
            <p role="status" className={`flex items-center gap-1.5 font-semibold ${info.nada === 'bahaya' ? 'text-bad' : info.nada === 'sukses' ? 'text-ok' : 'text-muted'}`}>
              <Ikon nama={info.nada === 'bahaya' ? 'peringatan' : info.nada === 'sukses' ? 'sukses' : 'info'} />
              {info.teks}
            </p>
          )}
          {hasil?.berhasil && (
            <div className="flex flex-wrap gap-2">
              {labirin.berikutnya && (
                <TautanTombol href={gabungJalur(basis, `/coding-zippy/${labirin.berikutnya}`)} ukuran="lg" ikonAkhir="kanan">
                  {t('blockly.berikutnya')}
                </TautanTombol>
              )}
              <Button varian="secondary" ikon="acak" onClick={kembaliKeAwal}>
                {t('blockly.mainLagi')}
              </Button>
            </div>
          )}
        </Card>
        <EditorBlockly blokTersedia={labirin.blok_tersedia} onGanti={saatProgramBerubah} terkunci={jalan} />
      </div>
      <Konfeti tampil={Boolean(hasil?.berhasil)} />
    </div>
  );
}
