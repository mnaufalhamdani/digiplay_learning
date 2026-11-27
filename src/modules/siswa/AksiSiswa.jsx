'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { JENIS_KODE, STATUS_SISWA } from '@/enums';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Select from '@/modules/shared/ui/Select';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import TextField from '@/modules/shared/ui/TextField';
import Toast from '@/modules/shared/ui/Toast';
import TampilanKode from './TampilanKode';
import { gantiKodeSiswa, gantiLevelSiswa, hapusSiswa, ubahStatusSiswa } from './siswa.actions';
/**
 * Kartu kode dan semua aksi sensitif di detail siswa. Setiap aksi memakai ConfirmDialog.
 * `bagian` memilih yang ditampilkan agar bisa ditaruh di tempat berbeda pada halaman (tiap pemakaian punya dialognya sendiri):
 * 'aksi' = hanya tombol Ganti level, Nonaktifkan, dan Hapus (sejajar dengan nama siswa); 'kode' = hanya kartu Kode akses;
 * null = keduanya (kartu kode lalu kartu aksi).
 * `dialog` = jenis aksi yang sedang dikonfirmasi: kode_siswa, kode_ortu, level, status, hapus.
 */
export default function AksiSiswa({ siswa, opsiLevel, adminkah, bagian = null }) {
  const router = useRouter();
  const { basis } = useArea();
  const [dialog, setDialog] = useState(null);
  const [levelBaru, setLevelBaru] = useState('');
  const [namaKetik, setNamaKetik] = useState('');
  const [galatDialog, setGalatDialog] = useState('');
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  const aktif = siswa.status === STATUS_SISWA.AKTIF;
  /** Membuka satu dialog dengan isian bersih. */
  function buka(jenis) {
    setGalatDialog('');
    setNamaKetik('');
    setLevelBaru(opsiLevel.find((o) => o.nilai !== siswa.level_id)?.nilai ?? '');
    setDialog(jenis);
  }
  /** Menjalankan action yang dikonfirmasi; `setelah` dipanggil bila berhasil (mis. pindah halaman). */
  function jalankan(action, input, pesan, setelah = null) {
    mulai(async () => {
      const hasil = await action(input);
      // gagal: alasan tampil di dalam dialog agar admin/tutor bisa memperbaiki (mis. nama salah ketik)
      if (!hasil.ok) return setGalatDialog(hasil.error);
      setDialog(null);
      setToast({ pesan, nada: 'sukses' });
      // hapus siswa: halaman detail sudah tidak ada, kembali ke daftar
      if (setelah) return setelah();
      router.refresh();
    });
  }
  /** Konfigurasi tiap dialog: judul, pesan, label, nada, dan aksi Ya. */
  const konfig = {
    kode_siswa: { judul: t('dataSiswa.gantiKodeSiswa'), pesan: t('dataSiswa.gantiKodeSiswaPesan'), nada: 'bahaya', ya: () => jalankan(gantiKodeSiswa, { id: siswa.id, jenis: JENIS_KODE.SISWA }, t('dataSiswa.berhasilGantiKode')) },
    kode_ortu: { judul: t('dataSiswa.gantiKodeOrtu'), pesan: t('dataSiswa.gantiKodeOrtuPesan'), nada: 'bahaya', ya: () => jalankan(gantiKodeSiswa, { id: siswa.id, jenis: JENIS_KODE.ORTU }, t('dataSiswa.berhasilGantiKode')) },
    level: { judul: t('dataSiswa.gantiLevel'), pesan: t('dataSiswa.gantiLevelPesan'), nada: 'biasa', ya: () => jalankan(gantiLevelSiswa, { id: siswa.id, levelId: levelBaru }, t('dataSiswa.berhasilGantiLevel')) },
    status: {
      judul: t(aktif ? 'dataSiswa.nonaktifkanJudul' : 'dataSiswa.aktifkanJudul'),
      pesan: t(aktif ? 'dataSiswa.nonaktifkanPesan' : 'dataSiswa.aktifkanPesan', { nama: siswa.nama }),
      nada: aktif ? 'bahaya' : 'biasa',
      ya: () => jalankan(ubahStatusSiswa, { id: siswa.id, aktif: !aktif }, t(aktif ? 'dataSiswa.berhasilNonaktif' : 'dataSiswa.berhasilAktif')),
    },
    hapus: {
      judul: t('dataSiswa.hapusJudul'),
      pesan: t('dataSiswa.hapusPesan', { nama: siswa.nama }),
      nada: 'bahaya',
      ya: () => jalankan(hapusSiswa, { id: siswa.id, konfirmasiNama: namaKetik }, t('dataSiswa.berhasilHapus'), () => router.replace(gabungJalur(basis, '/data-siswa'))),
    },
  }[dialog];
  /** Tombol Ganti level, Nonaktifkan/Aktifkan, dan Hapus. */
  const tombolAksi = (
    <div className="flex flex-wrap gap-2">
      <Button varian="secondary" ikon="level" onClick={() => buka('level')}>
        {t('dataSiswa.gantiLevel')}
      </Button>
      <Button varian={aktif ? 'hantu' : 'secondary'} ikon={aktif ? 'nonaktifkan' : 'aktifkan'} onClick={() => buka('status')}>
        {t(aktif ? 'dataSiswa.nonaktifkan' : 'dataSiswa.aktifkan')}
      </Button>
      {/* hapus siswa hanya untuk admin; tutor tidak melihat tombolnya */}
      {adminkah && (
        <Button varian="bahaya" ikon="hapus" onClick={() => buka('hapus')}>
          {t('dataSiswa.hapus')}
        </Button>
      )}
    </div>
  );
  return (
    <>
      {bagian !== 'aksi' && (
        <Card className="space-y-5">
          <h2 className="text-[1.15em] font-bold">{t('dataSiswa.kodeAkses')}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <TampilanKode label={t('dataSiswa.kodeSiswa')} kode={siswa.kode.siswa} bisaSembunyi />
              <Button varian="hantu" ikon="acak" onClick={() => buka('kode_siswa')}>
                {t('dataSiswa.gantiKodeSiswa')}
              </Button>
            </div>
            <div className="space-y-2">
              <TampilanKode label={t('dataSiswa.kodeOrtu')} kode={siswa.kode.ortu} bisaSembunyi />
              <Button varian="hantu" ikon="acak" onClick={() => buka('kode_ortu')}>
                {t('dataSiswa.gantiKodeOrtu')}
              </Button>
            </div>
          </div>
          <TautanTombol href={gabungJalur(basis, `/kartu-kode/${siswa.id}`)} target="_blank" rel="noopener" varian="secondary" ikon="cetak">
            {t('dataSiswa.cetakKartu')}
          </TautanTombol>
        </Card>
      )}
      {/* tanpa pemilihan bagian: kartu Aksi tersendiri; 'aksi': hanya tombol (ditaruh sejajar nama siswa oleh halaman) */}
      {bagian === null && (
        <Card className="space-y-3">
          <h2 className="text-[1.15em] font-bold">{t('dataSiswa.aksi')}</h2>
          {tombolAksi}
        </Card>
      )}
      {bagian === 'aksi' && tombolAksi}
      <ConfirmDialog
        terbuka={Boolean(konfig)}
        judul={konfig?.judul ?? ''}
        pesan={konfig?.pesan ?? ''}
        nada={konfig?.nada}
        labelYa={dialog === 'hapus' ? t('dataSiswa.hapus') : null}
        memuat={memuat}
        yaNonaktif={(dialog === 'hapus' && namaKetik.trim() === '') || (dialog === 'level' && !levelBaru)}
        onYa={() => konfig?.ya()}
        onBatal={() => setDialog(null)}
      >
        {dialog === 'level' && <Select label={t('dataSiswa.levelTujuan')} value={levelBaru} onChange={(e) => setLevelBaru(e.target.value)} opsi={opsiLevel.filter((o) => o.nilai !== siswa.level_id)} />}
        {dialog === 'hapus' && <TextField label={t('dataSiswa.ketikNama', { nama: siswa.nama })} value={namaKetik} onChange={(e) => setNamaKetik(e.target.value)} autoComplete="off" />}
        {galatDialog && (
          <p role="alert" className="font-semibold text-bad">
            {galatDialog}
          </p>
        )}
      </ConfirmDialog>
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </>
  );
}
