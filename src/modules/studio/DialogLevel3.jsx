'use client';
import { useEffect, useState } from 'react';
import { t } from '@/utils/i18n';
import { BATAS_STUDIO, DAFTAR_UKURAN_TEKS, DAFTAR_WARNA_TEKS, POLA_NAMA_VARIABEL, UKURAN_TEKS, WARNA_TEKS, kunciNama } from '@/modules/shared/blockly/pustakaStudio';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import Modal from '@/modules/shared/ui/Modal';
import Select from '@/modules/shared/ui/Select';
import TextField from '@/modules/shared/ui/TextField';

/** Isian awal dialog sprite teks untuk sprite baru. */
const TEKS_BARU = { teks: 'Halo!', ukuran: 'besar', warna: 'kuning' };

/** Pratinjau tulisan sprite teks (huruf berwarna bergaris tepi, di atas latar kotak-kotak agar terbaca terang atau gelap). */
function PratinjauTeks({ teks, ukuran, warna }) {
  const w = WARNA_TEKS[warna] ?? WARNA_TEKS.putih;
  return (
    <div aria-hidden="true" className="flex min-h-20 items-center justify-center overflow-hidden rounded-lg border-2 border-line bg-[linear-gradient(135deg,#8FD3FF,#2D1B69)] p-2">
      <span style={{ color: w.isi, WebkitTextStroke: `1px ${w.tepi}`, paintOrder: 'stroke fill', fontSize: `${Math.min(UKURAN_TEKS[ukuran] ?? 28, 40)}px` }} className="whitespace-nowrap font-display font-bold leading-tight">
        {teks || ' '}
      </span>
    </div>
  );
}

/**
 * Dialog sprite teks: isi tulisan (maksimal 40 karakter), ukuran, dan warna (8 pilihan yang terbaca di semua latar).
 * `awal` mengisi dialog saat mengubah sprite teks yang ada; kosong (null) untuk sprite baru. `onSimpan({ teks, ukuran, warna })`.
 */
export function DialogSpriteTeks({ terbuka, awal, onSimpan, onTutup }) {
  const [isi, setIsi] = useState(TEKS_BARU);
  // dialog dibuka lagi: isian diatur ulang dari sprite yang diubah (atau isian awal untuk sprite baru)
  useEffect(() => {
    if (terbuka) setIsi(awal ?? TEKS_BARU);
    // hanya saat dialog dibuka: `awal` dibuat ulang tiap render induk dan tidak boleh menghapus ketikan siswa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terbuka]);
  return (
    <Modal terbuka={terbuka} judul={t(awal ? 'studio.ubahSpriteTeks' : 'studio.tambahSpriteTeks')} tutup={onTutup}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSimpan({ ...isi, teks: isi.teks.trim() });
        }}
      >
        <TextField label={t('studio.tulisan')} value={isi.teks} maxLength={BATAS_STUDIO.maksTeksSprite} onChange={(e) => setIsi((v) => ({ ...v, teks: e.target.value }))} petunjuk={t('studio.tulisanPetunjuk', { maks: BATAS_STUDIO.maksTeksSprite })} autoComplete="off" />
        <Select label={t('studio.ukuranTeks')} value={isi.ukuran} onChange={(e) => setIsi((v) => ({ ...v, ukuran: e.target.value }))} opsi={DAFTAR_UKURAN_TEKS.map((u) => ({ nilai: u, label: t(`studio.ukuran.${u}`) }))} />
        <fieldset className="space-y-1.5">
          <legend className="font-semibold">{t('studio.warnaTeks')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('studio.warnaTeks')}>
            {DAFTAR_WARNA_TEKS.map((w) => (
              <button key={w} type="button" role="radio" aria-checked={isi.warna === w} aria-label={t(`studio.warna.${w}`)} title={t(`studio.warna.${w}`)} onClick={() => setIsi((v) => ({ ...v, warna: w }))} className={`flex size-11 items-center justify-center rounded-full border-2 ${isi.warna === w ? 'border-primary ring-2 ring-primary' : 'border-line'}`}>
                <span style={{ background: WARNA_TEKS[w].isi, borderColor: WARNA_TEKS[w].tepi }} className="size-7 rounded-full border-2" />
              </button>
            ))}
          </div>
          <p className="text-[0.9em] text-muted">{t(`studio.warna.${isi.warna}`)}</p>
        </fieldset>
        <PratinjauTeks {...isi} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onTutup}>
            {t('umum.batal')}
          </Button>
          <Button type="submit" ikon="sukses" disabled={isi.teks.trim() === ''}>
            {t('umum.simpan')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Dialog variabel: membuat variabel baru (nama 1-15 huruf/angka/spasi, unik tanpa membedakan huruf besar kecil,
 * maksimal 8 selain `skor`) dan menghapus yang sudah ada (dengan ConfirmDialog). `skor` selalu ada dan tidak bisa dihapus.
 * `onBuat(nama)` dan `onHapus(nama)` mengubah proyek di halaman induk.
 */
export function DialogVariabel({ terbuka, variabel, onBuat, onHapus, onTutup }) {
  const [nama, setNama] = useState('');
  const [galat, setGalat] = useState('');
  const [hapus, setHapus] = useState(null);
  const buatan = variabel.filter((v) => v !== 'skor');
  // dialog dibuka lagi: kolom dan pesan lama dibersihkan
  useEffect(() => {
    if (terbuka) {
      setNama('');
      setGalat('');
    }
  }, [terbuka]);
  /** Memeriksa nama lalu membuat variabel; pesan galat tampil di bawah kolom. */
  function buat(e) {
    e.preventDefault();
    const bersih = nama.trim();
    if (!POLA_NAMA_VARIABEL.test(bersih)) return setGalat(t('studio.namaVariabelSalah', { maks: BATAS_STUDIO.maksNamaVariabel }));
    // nama sudah dipakai (huruf besar kecil diabaikan) termasuk "skor"
    if (variabel.some((v) => kunciNama(v) === kunciNama(bersih))) return setGalat(t('studio.variabelKembar'));
    if (buatan.length >= BATAS_STUDIO.maksVariabel) return setGalat(t('studio.variabelPenuh', { maks: BATAS_STUDIO.maksVariabel }));
    onBuat(bersih);
    setNama('');
    setGalat('');
  }
  return (
    <>
      <Modal terbuka={terbuka && hapus === null} judul={t('studio.variabelJudul')} tutup={onTutup}>
        <div className="space-y-4">
          <form onSubmit={buat} className="space-y-2" noValidate>
            <TextField label={t('studio.namaVariabel')} value={nama} maxLength={BATAS_STUDIO.maksNamaVariabel} onChange={(e) => setNama(e.target.value)} galat={galat || null} petunjuk={t('studio.namaVariabelPetunjuk', { maks: BATAS_STUDIO.maksVariabel })} autoComplete="off" />
            <Button type="submit" ikon="tambah" disabled={nama.trim() === ''}>
              {t('studio.tambahVariabel')}
            </Button>
          </form>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 rounded-lg border-2 border-line bg-panel p-2 font-bold">
              <Ikon nama="gembok" />
              skor <span className="font-semibold text-muted">({t('studio.variabelBawaan')})</span>
            </li>
            {buatan.map((v) => (
              <li key={v} className="flex items-center gap-2 rounded-lg border-2 border-line bg-panel p-2">
                <span className="min-w-0 flex-1 break-words font-bold">{v}</span>
                <Button varian="hantu" ikon="hapus" aria-label={t('studio.hapusVariabelAria', { nama: v })} onClick={() => setHapus(v)} />
              </li>
            ))}
          </ul>
        </div>
      </Modal>
      <ConfirmDialog
        terbuka={hapus !== null}
        judul={t('studio.hapusVariabelJudul')}
        pesan={t('studio.hapusVariabelPesan', { nama: hapus ?? '' })}
        labelYa={t('studio.hapus')}
        labelBatal={t('siswa.tidakJadi')}
        nada="bahaya"
        maskot="menyemangati"
        onYa={() => {
          onHapus(hapus);
          setHapus(null);
        }}
        onBatal={() => setHapus(null)}
      />
    </>
  );
}

/** Dialog memilih tingkat proyek baru (hanya ditampilkan bila siswa boleh memakai lebih dari satu tingkat). */
export function DialogTingkat({ terbuka, tingkatBoleh, onPilih, onTutup }) {
  return (
    <Modal terbuka={terbuka} judul={t('studio.tingkatJudul')} tutup={onTutup}>
      <div className="space-y-3">
        <p className="text-muted">{t('studio.tingkatPetunjuk')}</p>
        {tingkatBoleh.map((k) => (
          <Button key={k} ukuran="lg" varian={k === tingkatBoleh[0] ? 'primary' : 'secondary'} penuh onClick={() => onPilih(k)}>
            {t(`studio.tingkat.${k}`)}
          </Button>
        ))}
      </div>
    </Modal>
  );
}
