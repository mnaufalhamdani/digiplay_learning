'use client';
import { useEffect, useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import Modal from '@/modules/shared/ui/Modal';
import TextField from '@/modules/shared/ui/TextField';
import TextArea from '@/modules/shared/ui/TextArea';
import Button from '@/modules/shared/ui/Button';
import { ubahBagian, ubahLevel, ubahPertemuan } from './level.actions';

/** Konfigurasi tiap jenis form: kolom, judul, action, dan nilai awal dari data yang dipilih. */
const JENIS = {
  level: {
    judul: 'level.ubahLevel',
    action: ubahLevel,
    kolom: [{ nama: 'nama' }, { nama: 'deskripsi', panjang: true }],
    awal: (d) => ({ nama: d.nama ?? '', deskripsi: d.deskripsi ?? '' }),
  },
  pertemuan: {
    judul: 'level.ubahPertemuan',
    action: ubahPertemuan,
    kolom: [{ nama: 'judul' }, { nama: 'tujuan', panjang: true }],
    awal: (d) => ({ judul: d.judul ?? '', tujuan: d.tujuan ?? '' }),
  },
  bagian: {
    judul: 'level.ubahBagian',
    action: ubahBagian,
    kolom: [{ nama: 'nama' }, { nama: 'bobot', angka: 'decimal' }, { nama: 'jumlahSoal', angka: 'numeric' }],
    awal: (d) => ({ nama: d.nama ?? '', bobot: String(d.bobot ?? ''), jumlahSoal: String(d.jumlah_soal ?? '') }),
  },
};

/** Modal ubah level, pertemuan, atau bagian post test (admin). `pilihan` = { jenis, data } atau null. */
export default function FormUbahLevel({ pilihan, selesai }) {
  const konfig = pilihan ? JENIS[pilihan.jenis] : null;
  const [nilai, setNilai] = useState({});
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [memuat, mulai] = useTransition();
  // setiap kali dibuka untuk data lain: isi ulang nilai awal dan bersihkan galat
  useEffect(() => {
    // modal tertutup: tidak ada yang perlu diisi
    if (!pilihan) return;
    setNilai(JENIS[pilihan.jenis].awal(pilihan.data));
    setGalat({ umum: '', kolom: {} });
  }, [pilihan]);
  /** Mengirim perubahan ke action sesuai jenis. */
  function kirim(e) {
    e.preventDefault();
    mulai(async () => {
      const hasil = await konfig.action({ id: pilihan.data.id, ...nilai });
      // galat per kolom tampil di kolomnya; galat lain di atas tombol
      if (!hasil.ok) return setGalat({ umum: hasil.detail ? '' : hasil.error, kolom: petaGalat(hasil.detail) });
      selesai(t('level.tersimpan'));
    });
  }
  return (
    <Modal terbuka={Boolean(pilihan)} judul={konfig ? t(konfig.judul) : ''} tutup={() => selesai()}>
      {konfig && (
        <form onSubmit={kirim} className="space-y-4" noValidate>
          {konfig.kolom.map((k) => {
            const props = { label: t(`level.kolom.${k.nama}`), value: nilai[k.nama] ?? '', galat: galat.kolom[k.nama], onChange: (e) => setNilai((n) => ({ ...n, [k.nama]: e.target.value })) };
            // kolom panjang (deskripsi, tujuan) memakai textarea
            return k.panjang ? <TextArea key={k.nama} {...props} /> : <TextField key={k.nama} {...props} inputMode={k.angka} />;
          })}
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
      )}
    </Modal>
  );
}
