'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { petaGalat } from '@/utils/galatForm';
import { formatRupiah, formatTanggal } from '@/utils/format';
import Button from '@/modules/shared/ui/Button';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import EmptyState from '@/modules/shared/ui/EmptyState';
import TextField from '@/modules/shared/ui/TextField';
import Toast from '@/modules/shared/ui/Toast';
import { hapusPembayaran, tambahPembayaran } from './pembayaran.actions';

/** Isian kosong form pembayaran. */
const KOSONG = { jumlah: '', keterangan: '', tanggal: '' };

/** Form tambah pembayaran; `denganTanggal` menampilkan kolom tanggal (detail siswa), selain itu hari ini. */
function FormPembayaran({ siswaId, sesiId, denganTanggal, selesai }) {
  const [nilai, setNilai] = useState(KOSONG);
  const [galat, setGalat] = useState({ umum: '', kolom: {} });
  const [memuat, mulai] = useTransition();
  /** Mengirim catatan pembayaran; sukses mengosongkan form. */
  function kirim(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await tambahPembayaran({ siswaId, sesiId: sesiId ?? '', ...nilai });
      // galat per kolom tampil di kolomnya; galat lain di bawah form
      if (!r.ok) return setGalat({ umum: r.detail ? '' : r.error, kolom: petaGalat(r.detail) });
      setNilai(KOSONG);
      setGalat({ umum: '', kolom: {} });
      selesai(t('pembayaran.tersimpan'));
    });
  }
  const ubah = (nama) => (e) => setNilai((n) => ({ ...n, [nama]: e.target.value }));
  return (
    <form onSubmit={kirim} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t('pembayaran.jumlah')} inputMode="numeric" awalan="Rp" placeholder="15000" value={nilai.jumlah} onChange={ubah('jumlah')} galat={galat.kolom.jumlah} />
        <TextField label={t('pembayaran.keterangan')} value={nilai.keterangan} onChange={ubah('keterangan')} galat={galat.kolom.keterangan} />
        {denganTanggal && <TextField label={t('pembayaran.tanggal')} type="date" petunjuk={t('pembayaran.tanggalPetunjuk')} value={nilai.tanggal} onChange={ubah('tanggal')} galat={galat.kolom.tanggal} />}
      </div>
      {galat.umum && (
        <p role="alert" className="font-semibold text-bad">
          {galat.umum}
        </p>
      )}
      <Button type="submit" varian="secondary" ikon="bayar" memuat={memuat}>
        {t('pembayaran.catat')}
      </Button>
    </form>
  );
}

/**
 * Daftar dan form pembayaran untuk detail sesi (`sesiId` terisi) atau detail siswa. Hapus hanya untuk admin
 * dan memakai ConfirmDialog. `paginasi` (opsional) adalah elemen React dari server component, tampil di bawah daftar.
 */
export default function BagianPembayaran({ siswaId, sesiId = null, daftar, adminkah, denganTanggal = false, paginasi = null }) {
  const router = useRouter();
  const [hapus, setHapus] = useState(null);
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  /** Menampilkan toast sukses dan memuat ulang data. */
  function selesai(pesan) {
    setToast({ pesan, nada: 'sukses' });
    router.refresh();
  }
  /** Menghapus pembayaran yang sudah dikonfirmasi. */
  function jalankanHapus() {
    mulai(async () => {
      const r = await hapusPembayaran({ id: hapus.id });
      setHapus(null);
      // gagal (mis. bukan admin): tampilkan alasannya
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      selesai(t('pembayaran.terhapus'));
    });
  }
  return (
    <div className="space-y-4">
      {daftar.length === 0 ? (
        <EmptyState judul={t('pembayaran.kosong')} ikon="bayar" />
      ) : (
        <ul className="divide-y-2 divide-line rounded-lg border border-line bg-panel">
          {daftar.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{formatRupiah(p.jumlah)}</p>
                <p className="text-muted">
                  {formatTanggal(p.tanggal)} · {t('pembayaran.dicatatOleh', { nama: p.dicatat_nama })}
                </p>
                {/* keterangan sesi tampil di bawah tanggal; teks panjang dipatah agar tidak membuat halaman meluap mendatar */}
                <p className="text-muted [overflow-wrap:anywhere]">
                  {t('pembayaran.untukSesi')}: {p.keterangan_sesi ?? '-'}
                </p>
                {p.keterangan && <p className="[overflow-wrap:anywhere]">{p.keterangan}</p>}
              </div>
              {adminkah && (
                <Button varian="hantu" ikon="hapus" onClick={() => setHapus(p)}>
                  {t('pembayaran.hapus')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {paginasi}
      {/* form hanya di konteks sesi (detail sesi); di detail siswa daftar saja, karena pembayaran harus terkait sesi */}
      {sesiId ? <FormPembayaran siswaId={siswaId} sesiId={sesiId} denganTanggal={denganTanggal} selesai={selesai} /> : <p className="text-muted">{t('pembayaran.catatDiSesi')}</p>}
      <ConfirmDialog
        terbuka={Boolean(hapus)}
        judul={t('pembayaran.hapusJudul')}
        pesan={t('pembayaran.hapusPesan', { jumlah: formatRupiah(hapus?.jumlah), tanggal: formatTanggal(hapus?.tanggal) })}
        labelYa={t('pembayaran.hapus')}
        nada="bahaya"
        memuat={memuat}
        onYa={jalankanHapus}
        onBatal={() => setHapus(null)}
      />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </div>
  );
}
