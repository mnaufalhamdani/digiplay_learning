'use client';
import { useRef } from 'react';
import { t } from '@/utils/i18n';
import { AREA } from '@/enums';
import { useArea } from './AreaContext';
import Modal from './Modal';
import Button from './Button';
import Maskot from './domain/Maskot';

/**
 * Dialog konfirmasi kustom (pengganti window.confirm). Nada `bahaya`: tombol Ya merah dan fokus awal
 * di tombol Batal agar Enter tidak langsung menjalankan aksi berbahaya. Esc = batal.
 * Di area siswa tampil maskot dan tombol besar. `children` untuk isian tambahan (misal ketik nama).
 */
export default function ConfirmDialog({ terbuka, judul, pesan, labelYa = null, labelBatal = null, nada = 'biasa', maskot = null, memuat = false, yaNonaktif = false, onYa, onBatal, children = null }) {
  const { area } = useArea();
  const refYa = useRef(null);
  const refBatal = useRef(null);
  const bahaya = nada === 'bahaya';
  const siswa = area === AREA.SISWA;
  const ukuran = siswa ? 'lg' : 'md';

  return (
    <Modal terbuka={terbuka} judul={judul} tutup={memuat ? null : onBatal} fokusAwalRef={bahaya ? refBatal : refYa} tutupSaatKlikLuar={false}>
      <div className={siswa ? 'flex flex-col items-center gap-3 text-center' : 'space-y-3'}>
        {siswa && maskot && <Maskot suasana={maskot} ukuran={120} />}
        <p>{pesan}</p>
        {children}
      </div>
      <div className={`mt-6 flex gap-3 ${siswa ? 'flex-col-reverse sm:flex-row sm:justify-center' : 'flex-col-reverse sm:flex-row sm:justify-end'}`}>
        <Button ref={refBatal} varian="secondary" ukuran={ukuran} onClick={onBatal} disabled={memuat}>
          {labelBatal ?? t('umum.batal')}
        </Button>
        <Button ref={refYa} varian={bahaya ? 'bahaya' : 'primary'} ukuran={ukuran} onClick={onYa} memuat={memuat} disabled={yaNonaktif}>
          {labelYa ?? t('umum.ya')}
        </Button>
      </div>
    </Modal>
  );
}
