'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { PERAN } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Toast from '@/modules/shared/ui/Toast';
import { ubahAktifPengguna } from './pengguna.actions';
import FormPengguna from './FormPengguna';
import FormResetPassword from './FormResetPassword';

/** Lencana peran dan status akun (selalu berteks). */
function LencanaAkun({ akun }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge nada={akun.peran === PERAN.ADMIN ? 'primer' : 'info'}>{t(`peran.${akun.peran}`)}</Badge>
      <Badge nada={akun.aktif ? 'sukses' : 'netral'}>{t(akun.aktif ? 'pengguna.aktif' : 'pengguna.nonaktif')}</Badge>
    </span>
  );
}

/** Tombol aksi satu akun: ubah, reset password, aktif/nonaktif. */
function AksiAkun({ akun, idSaya, buka }) {
  return (
    <span className="flex flex-wrap gap-2">
      <Button varian="secondary" ikon="ubah" onClick={() => buka('ubah', akun)}>
        {t('umum.ubah')}
      </Button>
      <Button varian="secondary" ikon="kunci" onClick={() => buka('reset', akun)}>
        {t('pengguna.resetPassword')}
      </Button>
      {/* akun sendiri tidak dinonaktifkan dari sini agar admin tidak mengunci dirinya */}
      {akun.id !== idSaya && (
        <Button varian={akun.aktif ? 'hantu' : 'secondary'} ikon={akun.aktif ? 'nonaktifkan' : 'aktifkan'} onClick={() => buka('aktif', akun)}>
          {t(akun.aktif ? 'pengguna.nonaktifkan' : 'pengguna.aktifkan')}
        </Button>
      )}
    </span>
  );
}

/** Daftar akun: tabel di layar lebar, kartu di HP. Modal untuk tambah/ubah/reset dan ConfirmDialog untuk aktif/nonaktif. */
export default function DaftarPengguna({ daftar, idSaya }) {
  const router = useRouter();
  const [dialog, setDialog] = useState({ jenis: null, akun: null });
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();

  /** Membuka satu dialog untuk sebuah akun. */
  function buka(jenis, akun = null) {
    setDialog({ jenis, akun });
  }
  /** Menutup dialog; bila `pesan` diisi berarti aksi berhasil dan data dimuat ulang. */
  function selesai(pesan = '') {
    setDialog({ jenis: null, akun: null });
    // dialog ditutup tanpa aksi: tidak perlu memuat ulang
    if (!pesan) return;
    setToast({ pesan, nada: 'sukses' });
    router.refresh();
  }
  /** Menjalankan aktif/nonaktif yang sudah dikonfirmasi. */
  function ubahAktif() {
    const { akun } = dialog;
    mulai(async () => {
      const hasil = await ubahAktifPengguna({ id: akun.id, aktif: !akun.aktif });
      // ditolak (mis. admin aktif terakhir): tutup dialog dan tampilkan alasannya
      if (!hasil.ok) {
        setDialog({ jenis: null, akun: null });
        return setToast({ pesan: hasil.error, nada: 'bahaya' });
      }
      selesai(t(akun.aktif ? 'pengguna.berhasilNonaktif' : 'pengguna.berhasilAktif'));
    });
  }

  const akunAktif = dialog.akun;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.5em] font-bold">{t('pengguna.judul')}</h1>
        <Button ikon="tambah_pengguna" onClick={() => buka('tambah')}>
          {t('pengguna.tambah')}
        </Button>
      </div>

      {/* layar lebar: tabel */}
      <Card className="hidden overflow-hidden p-0 sm:p-0 md:block">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('pengguna.nama')}</th>
              <th className="px-4 py-3 font-semibold">{t('pengguna.peranStatus')}</th>
              <th className="px-4 py-3 font-semibold">{t('pengguna.terakhirLogin')}</th>
              <th className="px-4 py-3 font-semibold">{t('pengguna.aksi')}</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">{a.nama}</p>
                  <p className="text-muted">{a.email}</p>
                </td>
                <td className="px-4 py-3">
                  <LencanaAkun akun={a} />
                </td>
                <td className="px-4 py-3 text-muted">{a.terakhir_login_at?.slice(0, 16) ?? t('pengguna.belumPernah')}</td>
                <td className="px-4 py-3">
                  <AksiAkun akun={a} idSaya={idSaya} buka={buka} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* HP: daftar kartu, tabel tidak menggulir mendatar */}
      <ul className="space-y-3 md:hidden">
        {daftar.map((a) => (
          <li key={a.id}>
            <Card className="space-y-3">
              <div>
                <p className="font-semibold">{a.nama}</p>
                <p className="break-all text-muted">{a.email}</p>
              </div>
              <LencanaAkun akun={a} />
              <p className="text-muted">
                {t('pengguna.terakhirLogin')}: {a.terakhir_login_at?.slice(0, 16) ?? t('pengguna.belumPernah')}
              </p>
              <AksiAkun akun={a} idSaya={idSaya} buka={buka} />
            </Card>
          </li>
        ))}
      </ul>

      <FormPengguna terbuka={dialog.jenis === 'tambah' || dialog.jenis === 'ubah'} akun={dialog.jenis === 'ubah' ? akunAktif : null} selesai={selesai} />
      <FormResetPassword terbuka={dialog.jenis === 'reset'} akun={akunAktif} selesai={selesai} />
      <ConfirmDialog
        terbuka={dialog.jenis === 'aktif'}
        judul={t(akunAktif?.aktif ? 'pengguna.nonaktifkanJudul' : 'pengguna.aktifkanJudul')}
        pesan={t(akunAktif?.aktif ? 'pengguna.nonaktifkanPesan' : 'pengguna.aktifkanPesan', { nama: akunAktif?.nama ?? '' })}
        labelYa={t(akunAktif?.aktif ? 'pengguna.nonaktifkan' : 'pengguna.aktifkan')}
        nada={akunAktif?.aktif ? 'bahaya' : 'biasa'}
        memuat={memuat}
        onYa={ubahAktif}
        onBatal={() => selesai()}
      />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </div>
  );
}
