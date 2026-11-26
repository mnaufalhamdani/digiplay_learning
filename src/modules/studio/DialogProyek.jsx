'use client';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import { formatWaktu } from '@/utils/format';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import Modal from '@/modules/shared/ui/Modal';
import TextField from '@/modules/shared/ui/TextField';
import { BATAS_STUDIO } from '@/modules/shared/blockly/pustakaStudio';
import { daftarProyekStudio, hapusProyekStudio, kirimProyekStudio } from './studio.actions';

/** Memuat daftar proyek siswa setiap dialog dibuka. Hasil: { daftar (null = memuat), galat, muatUlang }. */
function useDaftarProyek(terbuka) {
  const [daftar, setDaftar] = useState(null);
  const [galat, setGalat] = useState('');
  const muatUlang = useCallback(async () => {
    const r = await daftarProyekStudio();
    // gagal memuat (mis. login berakhir): tampilkan pesannya
    if (!r.ok) return setGalat(r.error);
    setGalat('');
    setDaftar(r.data);
  }, []);
  useEffect(() => {
    if (terbuka) muatUlang();
    else setDaftar(null);
  }, [terbuka, muatUlang]);
  return { daftar, galat, muatUlang };
}

/** Satu baris proyek: nama dan waktu diubah (waktu dari database ditampilkan apa adanya sebagai tanggal dan jam). */
function KeteranganProyek({ p }) {
  return (
    <span className="min-w-0 flex-1 text-left">
      <span className="block break-words font-bold">{p.nama}</span>
      <span className="text-[0.85em] text-muted">{formatWaktu(p.diubahPada)}</span>
    </span>
  );
}

/** Daftar kosong, memuat, atau galat yang dipakai dua dialog di bawah. */
function KeadaanDaftar({ daftar, galat }) {
  if (galat) return <p role="alert" className="font-semibold text-bad">{galat}</p>;
  if (daftar === null) return <p className="text-muted">{t('studio.memuatProyek')}</p>;
  if (daftar.length === 0) return <p className="text-muted">{t('studio.belumAdaProyek')}</p>;
  return null;
}

/**
 * Dialog membuka proyek tersimpan: daftar proyek dengan tombol Buka dan Hapus (Hapus memakai ConfirmDialog dan hanya
 * saat sesi berlangsung). `onBuka(id)` dipanggil dengan ID proyek yang dipilih.
 */
export function DialogBukaProyek({ terbuka, sesiAktif, onBuka, onTutup }) {
  const { daftar, galat, muatUlang } = useDaftarProyek(terbuka);
  const [hapus, setHapus] = useState(null);
  const [pesan, setPesan] = useState('');
  const [memuat, mulai] = useTransition();
  /** Menghapus proyek terpilih lalu memuat ulang daftarnya. */
  function konfirmasiHapus() {
    mulai(async () => {
      const r = await hapusProyekStudio({ id: hapus.id });
      setHapus(null);
      // ditolak (mis. sesi sudah ditutup): tampilkan alasannya di dialog
      if (!r.ok) return setPesan(r.error);
      setPesan('');
      await muatUlang();
    });
  }
  return (
    <>
      <Modal terbuka={terbuka && !hapus} judul={t('studio.bukaProyek')} tutup={onTutup}>
        <div className="space-y-3">
          <KeadaanDaftar daftar={daftar} galat={galat} />
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {(daftar ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg border-2 border-line bg-panel p-2">
                <KeteranganProyek p={p} />
                <Button varian="secondary" ikon="lihat" onClick={() => onBuka(p.id)}>
                  {t('studio.buka')}
                </Button>
                {sesiAktif && (
                  <Button varian="hantu" ikon="hapus" aria-label={t('studio.hapusProyekAria', { nama: p.nama })} onClick={() => setHapus(p)} />
                )}
              </li>
            ))}
          </ul>
          {pesan && <p role="alert" className="font-semibold text-bad">{pesan}</p>}
        </div>
      </Modal>
      <ConfirmDialog
        terbuka={Boolean(hapus)}
        judul={t('studio.hapusProyekJudul')}
        pesan={t('studio.hapusProyekPesan', { nama: hapus?.nama ?? '' })}
        labelYa={t('studio.hapus')}
        labelBatal={t('siswa.tidakJadi')}
        nada="bahaya"
        maskot="menyemangati"
        memuat={memuat}
        onYa={konfirmasiHapus}
        onBatal={() => setHapus(null)}
      />
    </>
  );
}

/** Dialog meminta nama proyek (Simpan pertama kali atau Simpan sebagai). `onSimpan(nama)` melakukan penyimpanan; `galat` pesan dari server. */
export function DialogNamaProyek({ terbuka, awal, memuat, galat, onSimpan, onTutup }) {
  const [nama, setNama] = useState(awal);
  // dialog dibuka lagi: isi awal diterapkan ulang
  useEffect(() => {
    if (terbuka) setNama(awal);
  }, [terbuka, awal]);
  return (
    <Modal terbuka={terbuka} judul={t('studio.simpanJudul')} tutup={memuat ? null : onTutup}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSimpan(nama.trim());
        }}
      >
        <TextField label={t('studio.namaProyek')} value={nama} maxLength={BATAS_STUDIO.maksNamaProyek} onChange={(e) => setNama(e.target.value)} galat={galat || null} petunjuk={t('studio.namaPetunjuk')} autoComplete="off" />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onTutup} disabled={memuat}>
            {t('umum.batal')}
          </Button>
          <Button type="submit" ikon="sukses" memuat={memuat} disabled={nama.trim() === ''}>
            {t('umum.simpan')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Dialog memilih proyek tersimpan untuk dikirim ke satu tugas (`jenis` tugas) atau butir post test (`butir`).
 * `onTerkirim(nama)` dipanggil setelah server menerima kiriman.
 */
export function DialogKirimProyek({ terbuka, tugasId, jenis, onTerkirim, onTutup }) {
  const { daftar, galat } = useDaftarProyek(terbuka);
  const [pilih, setPilih] = useState(null);
  const [pesan, setPesan] = useState('');
  const [memuat, mulai] = useTransition();
  // dialog dibuka lagi: pilihan dan pesan lama dibersihkan
  useEffect(() => {
    if (terbuka) {
      setPilih(null);
      setPesan('');
    }
  }, [terbuka]);
  /** Mengirim proyek terpilih; ditolak (sesi ditutup, sudah dinilai, ...) tampil sebagai pesan di dialog. */
  function kirim() {
    mulai(async () => {
      const r = await kirimProyekStudio({ proyekId: pilih, tugasId, jenis });
      if (!r.ok) return setPesan(r.error);
      onTerkirim(r.data.nama);
    });
  }
  return (
    <Modal terbuka={terbuka} judul={t('studio.kirimJudul')} tutup={memuat ? null : onTutup}>
      <div className="space-y-3">
        <p className="text-muted">{t('studio.kirimPetunjuk')}</p>
        <KeadaanDaftar daftar={daftar} galat={galat} />
        <ul className="max-h-[45vh] space-y-2 overflow-y-auto" role="radiogroup" aria-label={t('studio.pilihProyek')}>
          {(daftar ?? []).map((p) => (
            <li key={p.id}>
              <button type="button" role="radio" aria-checked={pilih === p.id} onClick={() => setPilih(p.id)} className={`flex min-h-11 w-full items-center gap-2 rounded-lg border-2 p-2 ${pilih === p.id ? 'border-primary bg-primary-soft' : 'border-line bg-panel'}`}>
                <KeteranganProyek p={p} />
                {pilih === p.id && (
                  <Badge nada="sukses">
                    <Ikon nama="sukses" />
                    {t('studio.dipilih')}
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
        {pesan && <p role="alert" className="font-semibold text-bad">{pesan}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onTutup} disabled={memuat}>
            {t('umum.batal')}
          </Button>
          <Button ikon="kanan" memuat={memuat} disabled={!pilih} onClick={kirim}>
            {t('studio.kirimProyek')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
