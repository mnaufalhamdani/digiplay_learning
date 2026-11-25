import 'server-only';
import { buatCsv } from '@/utils/csv';
import { t } from '@/utils/i18n';
import { AKSI_LOG, MAKS_BARIS_EKSPOR } from '@/enums';

/** Angka dari kolom DECIMAL/COUNT (teks dari driver); kosong tetap kosong. */
const angka = (v) => (v == null ? null : Number(v));
/** Tanggal saja (YYYY-MM-DD) dari DATE/DATETIME. */
const tgl = (v) => (v ? String(v).slice(0, 10) : null);
/** Tanggal dan jam (YYYY-MM-DD HH:MM) dari DATETIME. */
const waktu = (v) => (v ? String(v).slice(0, 16) : null);
/** Judul kolom berbahasa Indonesia dari locale. */
const judul = (jenis, kolom) => kolom.map((k) => t(`ekspor.kolom.${jenis}.${k}`));

/**
 * Definisi tiap jenis ekspor: kueri model, kolom, dan pengubah satu baris menjadi nilai sel. Tidak ada kode akses
 * di jenis mana pun.
 */
const JENIS = {
  siswa: {
    kueri: 'siswa',
    kolom: ['nama', 'status', 'tanggalDaftar', 'level', 'namaLevel', 'mulaiLevel'],
    baris: (b) => [b.nama, t(`dataSiswa.status.${b.status}`), tgl(b.tanggal_daftar), b.level_kode, b.level_nama, tgl(b.mulai_at)],
  },
  kehadiran: {
    kueri: 'kehadiran',
    kolom: ['tanggal', 'siswa', 'level', 'pertemuan', 'judul', 'jamMasuk', 'jamPulang', 'lamaMenit', 'status', 'penuntasan', 'sumber', 'tugasSelesai', 'tugasTotal', 'tutor'],
    baris: (b) => {
      const akhir = b.penuntasan_tutor ?? b.penuntasan_otomatis;
      return [tgl(b.tanggal), b.siswa_nama, b.level_kode, angka(b.pertemuan_nomor), b.pertemuan_judul, waktu(b.jam_masuk), waktu(b.jam_pulang), angka(b.lama_menit), t(`absensi.statusSesi.${b.status}`), akhir ? t(`absensi.penuntasan.${akhir}`) : null, akhir ? t(`absensi.sumber.${b.penuntasan_tutor ? 'tutor' : 'otomatis'}`) : null, angka(b.tugas_selesai), angka(b.tugas_total), b.tutor];
    },
  },
  'post-test': {
    kueri: 'postTest',
    kolom: ['siswa', 'level', 'percobaan', 'status', 'mulai', 'selesai', 'nilaiBagian', 'nilaiTotal', 'lulus'],
    baris: (b) => [b.siswa_nama, b.level_kode, angka(b.percobaan_ke), t(`ekspor.statusPostTest.${b.status}`), waktu(b.mulai_at), waktu(b.selesai_at), b.nilai_bagian, angka(b.nilai_total), b.lulus == null ? t('ekspor.menunggu') : t(Number(b.lulus) === 1 ? 'ekspor.ya' : 'ekspor.tidak')],
  },
  pembayaran: {
    kueri: 'pembayaran',
    kolom: ['tanggal', 'siswa', 'level', 'jumlah', 'keterangan', 'dicatatOleh'],
    baris: (b) => [tgl(b.tanggal), b.siswa_nama, b.level_kode, angka(b.jumlah), b.keterangan, b.dicatat_nama],
  },
};

/** Tanggal hari ini (zona waktu server) sebagai YYYYMMDD untuk nama berkas. */
function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** Usecase ekspor CSV (F3): siswa, kehadiran, post test, pembayaran; maksimal 50.000 baris; dicatat ke log. */
export function buatEksporUsecase({ eksporModel, catatAktivitas }) {
  return {
    /** Membuat berkas CSV satu jenis sesuai filter; hasil { buffer, namaFile }. */
    async ekspor(jenis, filter, penggunaId) {
      const d = JENIS[jenis];
      const baris = await eksporModel[d.kueri](filter, MAKS_BARIS_EKSPOR);
      await catatAktivitas({ penggunaId, aksi: AKSI_LOG.EKSPOR, entitas: 'ekspor', detail: { jenis, filter, jumlah: baris.length } });
      return { buffer: buatCsv(judul(jenis, d.kolom), baris.map(d.baris)), namaFile: `digiplay-${jenis}-${hariIni()}.csv` };
    },
  };
}
