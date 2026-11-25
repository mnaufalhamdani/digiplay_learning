'use client';
import { useEffect, useId, useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { DAFTAR_PERAN, PERAN } from '@/enums';
import Modal from '@/modules/shared/ui/Modal';
import TextField from '@/modules/shared/ui/TextField';
import Button from '@/modules/shared/ui/Button';
import { tambahPengguna, ubahPengguna } from './pengguna.actions';

/** Nilai awal form: kosong untuk tambah, data akun untuk ubah. */
function nilaiAwal(akun) {
  return { nama: akun?.nama ?? '', email: akun?.email ?? '', peran: akun?.peran ?? PERAN.TUTOR, password: '' };
}

/** Modal tambah akun (nama, email, peran, password awal) atau ubah akun (nama, peran). */
export default function FormPengguna({ terbuka, akun, selesai }) {
  const mode = akun ? 'ubah' : 'tambah';
  const idPeran = useId();
  const [nilai, setNilai] = useState(() => nilaiAwal(akun));
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [memuat, mulai] = useTransition();

  // setiap kali dibuka, isi ulang dari akun yang dipilih dan bersihkan galat lama
  useEffect(() => {
    // modal tertutup: biarkan isian apa adanya
    if (!terbuka) return;
    setNilai(nilaiAwal(akun));
    setGalat({ umum: '', kolom: {} });
  }, [terbuka, akun]);

  /** Mengubah satu kolom. */
  function ubah(nama, isi) {
    setNilai((n) => ({ ...n, [nama]: isi }));
  }

  /** Mengirim form sesuai mode. */
  function kirim(e) {
    e.preventDefault();
    mulai(async () => {
      const hasil = mode === 'ubah' ? await ubahPengguna({ id: akun.id, nama: nilai.nama, peran: nilai.peran }) : await tambahPengguna(nilai);
      // galat per kolom tampil di kolomnya; galat lain (email dipakai, admin terakhir) di atas tombol
      if (!hasil.ok) return setGalat({ umum: hasil.detail ? '' : hasil.error, kolom: petaGalat(hasil.detail) });
      selesai(t(mode === 'ubah' ? 'pengguna.berhasilUbah' : 'pengguna.berhasilTambah'));
    });
  }

  return (
    <Modal terbuka={terbuka} judul={t(mode === 'ubah' ? 'pengguna.ubahJudul' : 'pengguna.tambahJudul')} tutup={() => selesai()}>
      <form onSubmit={kirim} className="space-y-4" noValidate>
        <TextField label={t('pengguna.nama')} value={nilai.nama} onChange={(e) => ubah('nama', e.target.value)} galat={galat.kolom.nama} />
        {mode === 'tambah' && <TextField label={t('pengguna.email')} type="email" value={nilai.email} onChange={(e) => ubah('email', e.target.value)} galat={galat.kolom.email} />}
        <div className="space-y-1.5">
          <label htmlFor={idPeran} className="block font-semibold">
            {t('pengguna.peran')}
          </label>
          <select id={idPeran} value={nilai.peran} onChange={(e) => ubah('peran', e.target.value)} className="min-h-[max(2.75rem,var(--tap))] w-full rounded-[var(--r-btn)] border-2 border-line bg-panel px-3 text-fg sm:min-h-[var(--tap)]">
            {DAFTAR_PERAN.map((p) => (
              <option key={p} value={p}>
                {t(`peran.${p}`)}
              </option>
            ))}
          </select>
        </div>
        {mode === 'tambah' && (
          <TextField label={t('pengguna.passwordAwal')} type="password" autoComplete="new-password" petunjuk={t('pengguna.passwordPetunjuk')} value={nilai.password} onChange={(e) => ubah('password', e.target.value)} galat={galat.kolom.password} />
        )}
        {galat.umum && (
          <p role="alert" className="font-semibold text-bad">
            {galat.umum}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={() => selesai()} disabled={memuat}>
            {t('umum.batal')}
          </Button>
          <Button type="submit" memuat={memuat}>
            {t('umum.simpan')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
