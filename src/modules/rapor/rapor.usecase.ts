import 'server-only';
import { AppError } from '@/utils/appError';
import { t } from '@/utils/i18n';
import { hitungPaginasi } from '@/utils/paginasi';
import { STATUS_SERTIFIKAT, STATUS_SISWA } from '@/enums';

/** Banyaknya baris per halaman pada rapor orang tua (HP: daftar pendek). */
const PER_HALAMAN_RAPOR = 10;

/**
 * Bentuk aman satu sesi untuk orang tua: tanpa ID tutor dan tanpa data internal; catatan tutor ikut bersama
 * nama penulisnya (catatan kosong tidak ditampilkan).
 */
function sesiOrtu(s) {
  return {
    id: s.id,
    tanggal: s.tanggal,
    status: s.status,
    level_kode: s.level_kode,
    pertemuan_nomor: s.pertemuan_nomor,
    pertemuan_judul: s.pertemuan_judul,
    jam_masuk: s.jam_masuk,
    jam_pulang: s.jam_pulang,
    lama_detik: s.lama_detik,
    penuntasan_akhir: s.penuntasan_akhir,
    tugas_selesai: s.tugas_selesai,
    tugas_total: s.tugas_total,
    catatan: s.tutor.filter((x) => x.catatan && x.catatan.trim()).map((x) => ({ nama: x.nama, catatan: x.catatan })),
  };
}

/** Bentuk aman satu percobaan post test untuk orang tua: tanggal, nilai per bagian, total, kelulusan (tanpa soal/jawaban). */
function postTestOrtu(p) {
  return {
    id: p.id,
    mulai_at: p.mulai_at,
    status: p.status,
    dimulai: p.dimulai,
    level_kode: p.level_kode,
    percobaan_ke: p.percobaan_ke,
    nilai_total: p.nilai_total,
    lulus: p.lulus,
    bagian: p.bagian.map((b) => ({ kode: b.kode, nama: b.nama, nilai: b.nilai })),
  };
}

/** Satu halaman dari daftar yang sudah dimuat (riwayat per siswa kecil, jadi dipotong di aplikasi). */
function potong(daftar, halaman, ukuran) {
  const pg = hitungPaginasi(daftar.length, halaman, ukuran);
  return { baris: daftar.slice(pg.offset, pg.offset + ukuran), total: daftar.length, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
}

/**
 * Usecase rapor (agregator tanpa tabel sendiri): rapor orang tua (F1) yang seluruhnya dibatasi `siswaId` dari cookie,
 * dan ringkasan kartu beranda pengelola (F4). Mengambil data lewat usecase/model modul lain.
 */
export function buatRaporUsecase({ siswaModel, sesiUsecase, posttestUsecase, mengetikUsecase, latihanUsecase, pembayaranUsecase, sertifikatUsecase, karyaUsecase, sesiModel, posttestModel, sertifikatModel, pembayaranModel }) {
  /** Ringkasan latihan: jumlah main game mouse dan puzzle selesai. */
  async function latihanRingkas(siswaId) {
    const s = await latihanUsecase.statistikSiswa(siswaId);
    return { jumlahGame: s.game.reduce((n, g) => n + g.jumlah, 0), puzzleSelesai: s.puzzleSelesai };
  }
  /** Pembayaran untuk orang tua: tanggal, jumlah, keterangan, dan total yang tercatat (tanpa nama pencatat). */
  async function pembayaranOrtu(siswaId) {
    const daftar = (await pembayaranUsecase.daftarSiswa(siswaId)).map((p) => ({ id: p.id, tanggal: p.tanggal, jumlah: p.jumlah, keterangan: p.keterangan }));
    return { daftar, total: daftar.reduce((n, p) => n + (p.jumlah ?? 0), 0) };
  }
  /** Sertifikat terbit saja (yang dibatalkan tidak ditampilkan ke orang tua). */
  async function sertifikatOrtu(siswaId) {
    return (await sertifikatUsecase.riwayatSiswa(siswaId))
      .filter((s) => s.status === STATUS_SERTIFIKAT.TERBIT)
      .map((s) => ({ id: s.id, nomor: s.nomor, nama_level: s.nama_level, diterbitkan_at: s.diterbitkan_at, url_verifikasi: s.url_verifikasi }));
  }

  return {
    /** Rapor lengkap satu siswa untuk orang tua; `hal` = nomor halaman { sesi, bayar, karya } untuk daftar berpaginasi. */
    async ortu(siswaId, hal) {
      const siswa = await siswaModel.cariId(siswaId);
      // cookie sah tetapi siswa sudah dihapus/nonaktif: perlakukan seperti tidak ada
      if (!siswa || siswa.status !== STATUS_SISWA.AKTIF) throw new AppError(t('dataSiswa.tidakAda'), 404);
      const [riwayat, levelRiwayat, postTest, mengetik, latihan, pembayaran, sertifikat, karya] = await Promise.all([
        sesiUsecase.riwayatSiswa(siswaId),
        siswaModel.riwayatLevel(siswaId),
        posttestUsecase.riwayatSiswa(siswaId),
        mengetikUsecase.statistikSiswa(siswaId),
        latihanRingkas(siswaId),
        pembayaranOrtu(siswaId),
        sertifikatOrtu(siswaId),
        karyaUsecase.daftarSiswa(siswaId, hal.karya),
      ]);
      const semuaSesi = riwayat.sesi.map(sesiOrtu);
      return {
        siswa: { nama: siswa.nama, level_kode: siswa.level_kode, level_nama: siswa.level_nama, status_level: levelRiwayat[0]?.status ?? null },
        kehadiran: riwayat.kehadiran,
        sesiTerakhir: semuaSesi[0] ?? null,
        sesi: potong(semuaSesi, hal.sesi, PER_HALAMAN_RAPOR),
        postTest: postTest.map(postTestOrtu),
        mengetik: { wpmTerbaik: mengetik.wpmTerbaik, akurasiRata: mengetik.akurasiRata, grafik: mengetik.grafik },
        latihan,
        // total dihitung dari semua catatan, daftar yang tampil berpaginasi
        pembayaran: { total: pembayaran.total, daftar: potong(pembayaran.daftar, hal.bayar, PER_HALAMAN_RAPOR) },
        sertifikat,
        karya,
      };
    },
    /** Kartu ringkas beranda pengelola; total pembayaran bulan ini hanya dihitung untuk admin. */
    async beranda(adminkah) {
      const [siswaAktif, sesiBerlangsung, postTestMenunggu, sertifikatBulanIni, pembayaran] = await Promise.all([
        siswaModel.hitung({ status: STATUS_SISWA.AKTIF }),
        sesiModel.jumlahBerlangsung(),
        posttestModel.jumlahTab('menunggu'),
        sertifikatModel.jumlahTerbitBulanIni(),
        // tutor tidak boleh melihat rekap keuangan: jangan dihitung sama sekali
        adminkah ? pembayaranModel.totalBulanIni() : null,
      ]);
      return { siswaAktif, sesiBerlangsung, postTestMenunggu, sertifikatBulanIni, pembayaran };
    },
  };
}
