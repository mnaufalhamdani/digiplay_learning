'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { ATURAN_KARYA, JENIS_KARYA, MIME_KARYA } from '@/enums';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import Modal from '@/modules/shared/ui/Modal';
import TextArea from '@/modules/shared/ui/TextArea';
import TextField from '@/modules/shared/ui/TextField';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/** Isian awal form tambah karya. */
const KOSONG = { judul: '', deskripsi: '', jenis: JENIS_KARYA.TAUTAN, url: '' };

/** Pilihan jenis karya (tautan atau berkas) sebagai dua tombol radio besar. */
function PilihJenis({ jenis, onPilih }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="font-semibold">{t('karya.jenis')}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[
          [JENIS_KARYA.TAUTAN, 'tautan'],
          [JENIS_KARYA.BERKAS, 'gambar'],
        ].map(([nilai, ikon]) => (
          <label key={nilai} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--r-btn)] border-2 px-3 font-bold ${jenis === nilai ? 'border-primary bg-primary-soft text-primary-text' : 'border-line'}`}>
            <input type="radio" name="jenis" value={nilai} checked={jenis === nilai} onChange={() => onPilih(nilai)} className="sr-only" />
            <Ikon nama={ikon} />
            {t(`karya.jenisNama.${nilai}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Kolom pilih berkas gambar (PNG/JPEG/WebP, maks 3 MB) dengan galat di dekatnya. */
function KolomBerkas({ berkas, onPilih, galat }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="berkas-karya" className="block font-semibold">
        {t('karya.berkas')}
      </label>
      <input id="berkas-karya" type="file" accept={Object.keys(MIME_KARYA).join(',')} onChange={(e) => onPilih(e.target.files?.[0] ?? null)} className="block w-full rounded-[var(--r-btn)] border-2 border-line bg-panel p-2" />
      <p className={`flex items-start gap-1.5 text-[0.9em] ${galat ? 'font-semibold text-bad' : 'text-muted'}`}>
        {galat && <Ikon nama="peringatan" className="mt-0.5" />}
        <span>{galat ?? (berkas ? berkas.name : t('karya.berkasPetunjuk'))}</span>
      </p>
    </div>
  );
}

/** Mengirim form karya sebagai multipart ke POST /api/v1/karya; hasil { ok, galat, kolom }. */
async function kirimKarya(isi, berkas) {
  const form = new FormData();
  for (const [k, v] of Object.entries(isi)) form.append(k, v);
  // berkas hanya dikirim untuk jenis berkas
  if (isi.jenis === JENIS_KARYA.BERKAS && berkas) form.append('berkas', berkas);
  try {
    const res = await fetch('/api/v1/karya', { method: 'POST', body: form, credentials: 'same-origin' });
    const json = await res.json().catch(() => ({ success: false, message: t('umum.galatServer') }));
    return json.success ? { ok: true } : { ok: false, galat: json.message, kolom: petaGalat(json.detail) };
  } catch {
    // jaringan putus saat mengunggah
    return { ok: false, galat: t('umum.galatJaringan'), kolom: {} };
  }
}

/** Tombol Tambah karya + modal form (tautan atau berkas). Setelah berhasil: Zippy merayakan. */
export default function FormKarya() {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [isi, setIsi] = useState(KOSONG);
  const [berkas, setBerkas] = useState(null);
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [berhasil, setBerhasil] = useState(false);
  const [memuat, setMemuat] = useState(false);
  /** Mengubah satu kolom isian. */
  const ubah = (kolom) => (e) => setIsi((v) => ({ ...v, [kolom]: e.target.value }));

  /** Memeriksa berkas di browser (pesan cepat), lalu mengirim; server tetap memeriksa isi berkas. */
  async function simpan(e) {
    e.preventDefault();
    const berkasSalah = isi.jenis === JENIS_KARYA.BERKAS && berkas && (!MIME_KARYA[berkas.type] || berkas.size > ATURAN_KARYA.maksUkuran);
    // tipe/ukuran salah sudah terlihat di browser: tidak perlu mengunggah
    if (berkasSalah) return setGalat({ umum: '', kolom: { berkas: t(berkas.size > ATURAN_KARYA.maksUkuran ? 'karya.berkasBesar' : 'karya.berkasTipe') } });
    setMemuat(true);
    const r = await kirimKarya(isi, berkas);
    setMemuat(false);
    if (!r.ok) return setGalat({ umum: r.galat, kolom: r.kolom });
    setTerbuka(false);
    setIsi(KOSONG);
    setBerkas(null);
    setGalat({ umum: '', kolom: {} });
    setBerhasil(true);
    router.refresh();
  }

  return (
    <>
      <Button ukuran="lg" ikon="tambah" onClick={() => setTerbuka(true)}>
        {t('karya.tambah')}
      </Button>
      <Modal terbuka={terbuka} judul={t('karya.tambah')} tutup={memuat ? null : () => setTerbuka(false)} tutupSaatKlikLuar={false}>
        <form onSubmit={simpan} className="space-y-4" noValidate>
          <TextField label={t('karya.judul')} value={isi.judul} maxLength={ATURAN_KARYA.maksJudul} onChange={ubah('judul')} galat={galat.kolom.judul} />
          <TextArea label={t('karya.deskripsi')} value={isi.deskripsi} maxLength={ATURAN_KARYA.maksDeskripsi} rows={3} onChange={ubah('deskripsi')} galat={galat.kolom.deskripsi} petunjuk={t('karya.deskripsiPetunjuk')} />
          <PilihJenis jenis={isi.jenis} onPilih={(jenis) => setIsi((v) => ({ ...v, jenis }))} />
          {/* tautan: alamat proyek (mis. Scratch); berkas: gambar hasil karya */}
          {isi.jenis === JENIS_KARYA.TAUTAN ? (
            <TextField label={t('karya.url')} inputMode="url" placeholder="https://" value={isi.url} maxLength={ATURAN_KARYA.maksUrl} onChange={ubah('url')} galat={galat.kolom.url} petunjuk={t('karya.urlPetunjuk')} />
          ) : (
            <KolomBerkas berkas={berkas} onPilih={setBerkas} galat={galat.kolom.berkas} />
          )}
          {galat.umum && (
            <p role="alert" className="font-semibold text-bad">
              {galat.umum}
            </p>
          )}
          <Button type="submit" ukuran="lg" penuh ikon="sukses" memuat={memuat}>
            {t('karya.simpan')}
          </Button>
        </form>
      </Modal>
      <Modal terbuka={berhasil} judul={t('karya.berhasilJudul')} tutup={() => setBerhasil(false)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Maskot suasana="merayakan" ukuran={120} />
          <p>{t('karya.berhasilPesan')}</p>
          <Button ukuran="lg" onClick={() => setBerhasil(false)}>
            {t('umum.tutup')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
