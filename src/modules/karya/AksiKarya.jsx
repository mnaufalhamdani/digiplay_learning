'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { ATURAN_KARYA } from '@/enums';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Modal from '@/modules/shared/ui/Modal';
import TextArea from '@/modules/shared/ui/TextArea';
import TextField from '@/modules/shared/ui/TextField';
import Toast from '@/modules/shared/ui/Toast';
import { hapusKaryaPengelola, hapusKaryaSiswa, ubahKarya } from './karya.actions';

/** Toast kosong. */
const TANPA_TOAST = { pesan: '', nada: 'sukses' };

/** Tombol Hapus dengan ConfirmDialog nada bahaya; `aksi` = server action hapus (siswa atau pengelola). */
function TombolHapus({ k, aksi, maskot }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [toast, setToast] = useState(TANPA_TOAST);
  const [memuat, mulai] = useTransition();
  /** Menghapus karya lalu memuat ulang galeri. */
  function jalankan() {
    mulai(async () => {
      const r = await aksi({ id: k.id });
      setTerbuka(false);
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      router.refresh();
    });
  }
  return (
    <>
      <Button varian="hantu" ikon="hapus" onClick={() => setTerbuka(true)}>
        {t('karya.hapus')}
      </Button>
      <ConfirmDialog terbuka={terbuka} nada="bahaya" maskot={maskot} judul={t('karya.hapusJudul')} pesan={t('karya.hapusPesan', { judul: k.judul })} labelYa={t('karya.hapus')} memuat={memuat} onYa={jalankan} onBatal={() => setTerbuka(false)} />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast(TANPA_TOAST)} />
    </>
  );
}

/** Tombol Ubah (judul dan deskripsi) karya milik siswa. */
function TombolUbah({ k }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [isi, setIsi] = useState({ judul: k.judul, deskripsi: k.deskripsi ?? '' });
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [memuat, mulai] = useTransition();
  /** Menyimpan perubahan; galat validasi tampil di kolomnya. */
  function simpan(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await ubahKarya({ id: k.id, ...isi });
      if (!r.ok) return setGalat({ umum: r.detail ? '' : r.error, kolom: petaGalat(r.detail) });
      setTerbuka(false);
      router.refresh();
    });
  }
  return (
    <>
      <Button varian="hantu" ikon="ubah" onClick={() => setTerbuka(true)}>
        {t('umum.ubah')}
      </Button>
      <Modal terbuka={terbuka} judul={t('karya.ubahJudul')} tutup={memuat ? null : () => setTerbuka(false)} tutupSaatKlikLuar={false}>
        <form onSubmit={simpan} className="space-y-4" noValidate>
          <TextField label={t('karya.judul')} value={isi.judul} maxLength={ATURAN_KARYA.maksJudul} onChange={(e) => setIsi((v) => ({ ...v, judul: e.target.value }))} galat={galat.kolom.judul} />
          <TextArea label={t('karya.deskripsi')} value={isi.deskripsi} maxLength={ATURAN_KARYA.maksDeskripsi} rows={3} onChange={(e) => setIsi((v) => ({ ...v, deskripsi: e.target.value }))} galat={galat.kolom.deskripsi} />
          {galat.umum && (
            <p role="alert" className="font-semibold text-bad">
              {galat.umum}
            </p>
          )}
          <Button type="submit" ukuran="lg" penuh ikon="sukses" memuat={memuat}>
            {t('umum.simpan')}
          </Button>
        </form>
      </Modal>
    </>
  );
}

/** Aksi karya milik siswa (hanya saat sesi berlangsung): Ubah dan Hapus. */
export function AksiKaryaSiswa({ k }) {
  return (
    <div className="flex flex-wrap gap-2">
      <TombolUbah k={k} />
      <TombolHapus k={k} aksi={hapusKaryaSiswa} maskot="berpikir" />
    </div>
  );
}

/** Aksi pengelola: Hapus karya mana pun (dicatat ke log). */
export function AksiKaryaPengelola({ k }) {
  return <TombolHapus k={k} aksi={hapusKaryaPengelola} />;
}
