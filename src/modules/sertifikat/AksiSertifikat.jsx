'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { ATURAN_SERTIFIKAT, STATUS_SERTIFIKAT } from '@/enums';
import Button, { kelasTombol } from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import TextArea from '@/modules/shared/ui/TextArea';
import Toast from '@/modules/shared/ui/Toast';
import { salinTeks } from '@/modules/siswa/TampilanKode';
import { batalkanSertifikat, terbitkanUlangSertifikat } from './sertifikat.actions';

/** Toast kosong. */
const TANPA_TOAST = { pesan: '', nada: 'sukses' };

/** Tombol Terbitkan ulang untuk (siswa, level) dengan ConfirmDialog; dipakai di daftar, detail siswa, dan detail post test. */
export function TombolTerbitkanUlang({ siswaId, levelId, ada = true }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [toast, setToast] = useState(TANPA_TOAST);
  const [memuat, mulai] = useTransition();
  /** Menerbitkan sertifikat baru (yang lama otomatis dibatalkan). */
  function jalankan() {
    mulai(async () => {
      const r = await terbitkanUlangSertifikat({ siswaId, levelId });
      setTerbuka(false);
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan: t('sertifikat.berhasilTerbit', { nomor: r.data.nomor }), nada: 'sukses' });
      router.refresh();
    });
  }
  return (
    <>
      <Button varian="secondary" ikon="acak" onClick={() => setTerbuka(true)}>
        {t('sertifikat.terbitkanUlang')}
      </Button>
      {/* pesan berbeda bila masih ada sertifikat terbit yang akan dibatalkan */}
      <ConfirmDialog terbuka={terbuka} judul={t('sertifikat.terbitkanUlangJudul')} pesan={t(ada ? 'sertifikat.terbitkanUlangPesan' : 'sertifikat.terbitkanBaruPesan')} labelYa={t('sertifikat.terbitkanUlang')} memuat={memuat} onYa={jalankan} onBatal={() => setTerbuka(false)} />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast(TANPA_TOAST)} />
    </>
  );
}

/** Tombol Batalkan dengan ConfirmDialog nada bahaya dan kolom alasan wajib. */
function TombolBatalkan({ id, nomor }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState(TANPA_TOAST);
  const [memuat, mulai] = useTransition();
  /** Mengirim pembatalan; galat validasi alasan tampil di kolomnya. */
  function jalankan() {
    setGalat('');
    mulai(async () => {
      const r = await batalkanSertifikat({ id, alasan });
      // alasan kosong/terlalu panjang: biarkan dialog terbuka dan tampilkan pesannya
      if (!r.ok && r.detail) return setGalat(r.detail[0]?.pesan ?? r.error);
      setTerbuka(false);
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setAlasan('');
      setToast({ pesan: t('sertifikat.berhasilBatal'), nada: 'sukses' });
      router.refresh();
    });
  }
  return (
    <>
      <Button varian="hantu" ikon="nonaktifkan" onClick={() => setTerbuka(true)}>
        {t('sertifikat.batalkan')}
      </Button>
      <ConfirmDialog terbuka={terbuka} nada="bahaya" judul={t('sertifikat.batalkanJudul')} pesan={t('sertifikat.batalkanPesan', { nomor })} labelYa={t('sertifikat.batalkan')} memuat={memuat} yaNonaktif={alasan.trim() === ''} onYa={jalankan} onBatal={() => setTerbuka(false)}>
        <TextArea label={t('sertifikat.alasan')} value={alasan} maxLength={ATURAN_SERTIFIKAT.maksAlasan} rows={3} onChange={(e) => setAlasan(e.target.value)} galat={galat} petunjuk={t('sertifikat.alasanPetunjuk', { maks: ATURAN_SERTIFIKAT.maksAlasan })} />
      </ConfirmDialog>
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast(TANPA_TOAST)} />
    </>
  );
}

/** Tombol Salin tautan verifikasi; label berubah sebentar menjadi "Tersalin". */
function TombolSalin({ url }) {
  const [tersalin, setTersalin] = useState(false);
  /** Menyalin tautan lalu menandai berhasil selama 2 detik. */
  async function salin() {
    // gagal menyalin (sangat jarang): label tetap
    if (!(await salinTeks(url))) return;
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  }
  return (
    <Button varian="hantu" ikon={tersalin ? 'sukses' : 'tautan'} onClick={salin}>
      {t(tersalin ? 'dataSiswa.tersalin' : 'sertifikat.salinTautan')}
    </Button>
  );
}

/** Aksi satu sertifikat: Unduh PDF, Salin tautan verifikasi, Batalkan (bila terbit), Terbitkan ulang (bila boleh). */
export default function AksiSertifikat({ s }) {
  const terbit = s.status === STATUS_SERTIFIKAT.TERBIT;
  return (
    <div className="flex flex-wrap gap-2">
      {/* rute unduh berada di /api (tidak lewat awalan jalur area) */}
      <a href={`/api/v1/sertifikat/pdf?id=${encodeURIComponent(s.id)}`} download className={kelasTombol({ varian: 'secondary' })}>
        <Ikon nama="unduh" />
        {t('sertifikat.unduhPdf')}
      </a>
      {terbit && <TombolSalin url={s.url_verifikasi} />}
      {terbit && <TombolBatalkan id={s.id} nomor={s.nomor} />}
      {s.bisaTerbitUlang && <TombolTerbitkanUlang siswaId={s.siswa_id} levelId={s.level_id} ada={terbit} />}
    </div>
  );
}
