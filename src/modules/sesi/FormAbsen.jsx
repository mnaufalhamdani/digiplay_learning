'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { gabungJalur } from '@/utils/jalurArea';
import { formatTanggal } from '@/utils/format';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import Select from '@/modules/shared/ui/Select';
import TextField from '@/modules/shared/ui/TextField';
import KolomKode from '@/modules/shared/ui/domain/KolomKode';
import { absenMasuk, cekKodeAbsen, izinkanPengecualian, tutupSesi } from './sesi.actions';

/** Isian bawaan langkah kedua (setelah kode dikenali). */
function isianAwal(data) {
  return { pertemuanId: data.bawaanId ?? '', tutorTambahan: [], jumlah: '', keterangan: '' };
}

/** Kotak masalah yang butuh tindakan: sesi lama belum ditutup atau kehadiran kurang. */
function KotakTindakan({ masalah, onTindak, memuat }) {
  // tidak ada masalah yang perlu tindakan
  if (!masalah) return null;
  const berlangsung = masalah.kode === 'berlangsung';
  return (
    <div role="alert" className="space-y-3 rounded-md border-2 border-warn bg-warn-soft p-3 text-warn">
      <p className="flex items-start gap-2 font-bold">
        <Ikon nama="peringatan" className="mt-0.5" />
        {masalah.pesan}
      </p>
      <Button varian="secondary" ikon={berlangsung ? 'pulang' : 'aktifkan'} memuat={memuat} onClick={onTindak}>
        {t(berlangsung ? 'absensi.tutupSesiItu' : 'absensi.izinkanPengecualian')}
      </Button>
    </div>
  );
}

/** Ringkasan setelah absen berhasil: siswa, pertemuan, jumlah tugas, peringatan, dan tautan detail sesi. */
function Ringkasan({ hasil, ulang }) {
  const { basis } = useArea();
  return (
    <div role="status" className="space-y-3 rounded-md border-2 border-ok bg-ok-soft p-4">
      <p className="flex items-center gap-2 font-bold text-ok">
        <Ikon nama="sukses" />
        {t('absensi.berhasil', { nama: hasil.siswaNama })}
      </p>
      <p>{t('absensi.ringkasan', { level: hasil.levelKode, nomor: hasil.pertemuanNomor, judul: hasil.pertemuanJudul, tugas: hasil.tugasDibuat })}</p>
      {hasil.templateDilewati.length > 0 && <p className="font-semibold text-warn">{t('absensi.peringatanGambar', { daftar: hasil.templateDilewati.join(', ') })}</p>}
      <div className="flex flex-wrap gap-2">
        <Link href={gabungJalur(basis, `/absensi/${hasil.sesiId}`)} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--r-btn)] bg-primary px-4 font-bold text-on-primary">
          {t('absensi.lihatDetail')}
        </Link>
        <Button varian="secondary" onClick={ulang}>
          {t('absensi.absenLagi')}
        </Button>
      </div>
    </div>
  );
}

/** Langkah kedua: pertemuan, tutor tambahan, dan pembayaran untuk siswa yang kodenya sudah dikenali. */
function IsianAbsen({ data, nilai, setNilai, galat, tutor }) {
  const opsiPertemuan = data.pertemuan.map((p) => ({ nilai: p.id, label: `P${p.nomor} · ${p.judul}${p.hadir ? ` (${t('absensi.sudahHadir')})` : ''}` }));
  /** Menambah/menghapus satu tutor tambahan. */
  function pilihTutor(id, dicentang) {
    setNilai((n) => ({ ...n, tutorTambahan: dicentang ? [...n.tutorTambahan, id] : n.tutorTambahan.filter((x) => x !== id) }));
  }
  return (
    <div className="space-y-4">
      <Select label={t('absensi.pertemuan')} value={nilai.pertemuanId} onChange={(e) => setNilai((n) => ({ ...n, pertemuanId: e.target.value }))} opsi={opsiPertemuan} petunjuk={t('absensi.pertemuanPetunjuk')} galat={galat.pertemuanId} />
      {tutor.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="font-semibold">{t('absensi.tutorTambahan')}</legend>
          {tutor.map((x) => (
            <label key={x.id} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={nilai.tutorTambahan.includes(x.id)} onChange={(e) => pilihTutor(x.id, e.target.checked)} />
              {x.nama}
            </label>
          ))}
        </fieldset>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t('absensi.bayarJumlah')} inputMode="numeric" awalan="Rp" value={nilai.jumlah} onChange={(e) => setNilai((n) => ({ ...n, jumlah: e.target.value }))} galat={galat.jumlah} />
        <TextField label={t('absensi.bayarKeterangan')} value={nilai.keterangan} onChange={(e) => setNilai((n) => ({ ...n, keterangan: e.target.value }))} galat={galat.keterangan} />
      </div>
    </div>
  );
}

/**
 * Form Absen masuk (C3.1) dalam dua langkah agar nyaman di HP: masukkan kode -> cek (nama siswa dan pertemuan bawaan)
 * -> absen. Masalah yang butuh tindakan (sesi lama, kehadiran kurang) punya tombol penyelesaiannya sendiri.
 */
export default function FormAbsen({ panjangKode, tutor }) {
  const router = useRouter();
  const [putaran, setPutaran] = useState(0); // kunci KolomKode: dinaikkan untuk mengosongkan kotak
  const [kode, setKode] = useState('');
  const [data, setData] = useState(null);
  const [nilai, setNilai] = useState(null);
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [masalah, setMasalah] = useState(null); // { kode, pesan, sesiId?, siswaLevelId? }
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [memuat, mulai] = useTransition();
  /** Kembali ke langkah awal dengan kotak kode kosong. */
  function ulang() {
    setPutaran((n) => n + 1);
    setKode('');
    setData(null);
    setNilai(null);
    setHasil(null);
    setMasalah(null);
    setGalat({ umum: '', kolom: {} });
  }
  /** Langkah 1: kenali kode siswa. */
  function cek(e) {
    e.preventDefault();
    // kotak belum terisi semua: beri tahu tanpa memanggil server
    if (kode.length !== panjangKode) return setGalat({ umum: t('absensi.kodeBelumLengkap', { panjang: panjangKode }), kolom: {} });
    mulai(async () => {
      const r = await cekKodeAbsen({ kode });
      if (!r.ok) return setGalat({ umum: r.error, kolom: {} });
      setGalat({ umum: '', kolom: {} });
      setData(r.data);
      setNilai(isianAwal(r.data));
      // sesi lama belum ditutup: tampilkan tindakan sejak awal agar tutor tidak perlu mencoba dulu
      setMasalah(r.data.sesiBerlangsung ? { kode: 'berlangsung', sesiId: r.data.sesiBerlangsung.id, pesan: t('sesi.masihBerlangsung', { tanggal: formatTanggal(r.data.sesiBerlangsung.tanggal) }) } : null);
    });
  }
  /** Langkah 2: absen masuk. */
  function absen() {
    mulai(async () => {
      const r = await absenMasuk({ kode, ...nilai });
      if (r.ok) {
        setHasil(r.data);
        setMasalah(null);
        return router.refresh();
      }
      // detail berbentuk objek ber-`kode` = masalah yang punya tombol penyelesaian; array = galat per kolom
      if (r.detail?.kode) return setMasalah({ ...r.detail, pesan: r.error });
      setGalat({ umum: r.detail ? '' : r.error, kolom: petaGalat(r.detail) });
    });
  }
  /** Menjalankan tindakan penyelesaian masalah yang sudah dikonfirmasi (Tutup sesi itu / Izinkan pengecualian). */
  function tindak() {
    mulai(async () => {
      const r = masalah.kode === 'berlangsung' ? await tutupSesi({ sesiId: masalah.sesiId }) : await izinkanPengecualian({ siswaLevelId: masalah.siswaLevelId });
      setKonfirmasi(false);
      if (!r.ok) return setGalat({ umum: r.error, kolom: {} });
      setMasalah(null);
      // pesan sukses memakai tempat yang sama dengan galat, ditandai `info` agar berwarna sukses
      setGalat({ umum: t(masalah.kode === 'berlangsung' ? 'absensi.sesiLamaDitutup' : 'absensi.pengecualianDiizinkan'), kolom: {}, info: true });
      router.refresh();
    });
  }
  return (
    <Card className="space-y-4">
      <h2 className="text-[1.15em] font-bold">{t('absensi.absenMasuk')}</h2>
      {hasil ? (
        <Ringkasan hasil={hasil} ulang={ulang} />
      ) : (
        <>
          <form onSubmit={cek} className="space-y-3" noValidate>
            <KolomKode key={putaran} label={t('absensi.kodeSiswa')} onUbah={(teks) => setKode(teks)} panjang={panjangKode} disabled={memuat || Boolean(data)} />
            {!data && (
              <Button type="submit" ikon="cari" memuat={memuat} penuh>
                {t('absensi.cekKode')}
              </Button>
            )}
          </form>
          {data && (
            <div className="space-y-4">
              <p className="rounded-md bg-primary-soft p-3">
                <strong>{data.siswa.nama}</strong> · {data.level.kode} {data.level.nama}
              </p>
              <KotakTindakan masalah={masalah} memuat={memuat} onTindak={() => setKonfirmasi(true)} />
              <IsianAbsen data={data} nilai={nilai} setNilai={setNilai} galat={galat.kolom} tutor={tutor} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button varian="secondary" onClick={ulang} disabled={memuat}>
                  {t('absensi.gantiKode')}
                </Button>
                <Button ikon="absensi" memuat={memuat} onClick={absen}>
                  {t('absensi.absenMasuk')}
                </Button>
              </div>
            </div>
          )}
          {galat.umum && (
            <p role={galat.info ? 'status' : 'alert'} className={`flex items-start gap-1.5 font-semibold ${galat.info ? 'text-ok' : 'text-bad'}`}>
              <Ikon nama={galat.info ? 'sukses' : 'peringatan'} className="mt-0.5" />
              {galat.umum}
            </p>
          )}
        </>
      )}
      <ConfirmDialog
        terbuka={konfirmasi}
        judul={t(masalah?.kode === 'berlangsung' ? 'absensi.tutupSesiItuJudul' : 'absensi.izinkanJudul')}
        pesan={t(masalah?.kode === 'berlangsung' ? 'absensi.tutupSesiItuPesan' : 'absensi.izinkanPesan')}
        memuat={memuat}
        onYa={tindak}
        onBatal={() => setKonfirmasi(false)}
      />
    </Card>
  );
}
