import 'server-only';
import { AppError } from '@/utils/appError';
import { t } from '@/utils/i18n';
import { hitungPaginasi } from '@/utils/paginasi';
import { JUMLAH_PERTEMUAN_MATERI, KUNCI_PENGATURAN, STATUS_SERTIFIKAT, STATUS_SISWA, UKURAN_HALAMAN } from '@/enums';
import { awalBulan, deretPembayaran, deretPenuntasan, deretSesiPerHari, normalisasiFilter } from './dashboard.helper';

/** Siswa aktif tanpa sesi selama sekian hari terakhir masuk daftar "Perlu perhatian". */
const HARI_TANPA_SESI = 21;

/** Banyaknya baris per halaman pada rapor orang tua: sama dengan semua daftar berpaginasi lain. */
const PER_HALAMAN_RAPOR = UKURAN_HALAMAN;

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

/** Satu halaman dari daftar yang sudah dimuat. Tidak dipakai lagi oleh rapor: sesi dan pembayaran kini dipaginasi di database (LIMIT/OFFSET). */
function potong(daftar, halaman, ukuran) {
  const pg = hitungPaginasi(daftar.length, halaman, ukuran);
  return { baris: daftar.slice(pg.offset, pg.offset + ukuran), total: daftar.length, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
}

/**
 * Usecase rapor (agregator tanpa tabel sendiri): rapor orang tua (F1) yang seluruhnya dibatasi `siswaId` dari cookie,
 * dan ringkasan kartu beranda pengelola (F4). Mengambil data lewat usecase/model modul lain.
 */
export function buatRaporUsecase({ siswaModel, sesiUsecase, posttestUsecase, mengetikUsecase, latihanUsecase, pembayaranUsecase, sertifikatUsecase, karyaUsecase, sesiModel, posttestModel, sertifikatModel, pembayaranModel, levelModel, pengaturanUsecase, logger }) {
  /**
   * Menjalankan satu bagian dashboard dan menyelamatkan galatnya: bagian yang gagal menjadi `{ galat: true }` (dan dicatat di
   * log server) agar satu query yang gagal tidak merusak seluruh beranda.
   */
  async function aman(nama, ambil) {
    try {
      return { data: await ambil() };
    } catch (error) {
      logger.error(`Dashboard: bagian ${nama} gagal`, error);
      return { galat: true };
    }
  }
  /** Kartu "Sesi berlangsung sekarang" dan kartu angka (selalu kondisi saat ini, tidak mengikuti filter). */
  async function kartuSaatIni(adminkah) {
    const [sesiBerlangsung, siswa, sesi7, menunggu, pembayaran] = await Promise.all([
      aman('sesiBerlangsung', () => sesiModel.ringkasBerlangsungHariIni()),
      aman('siswaAktif', () => siswaModel.ringkasanAktif()),
      aman('sesi7Hari', () => sesiModel.perbandingan7Hari()),
      aman('postTestMenunggu', () => posttestModel.ringkasMenunggu()),
      // tutor tidak boleh melihat rekap keuangan: jangan dihitung sama sekali
      adminkah ? aman('pembayaranBulanIni', () => pembayaranModel.totalBulanIni()) : null,
    ]);
    return { sesiBerlangsung, siswaAktif: siswa, sesi7Hari: sesi7, postTestMenunggu: menunggu, pembayaranBulanIni: pembayaran };
  }
  /** Bagian grafik post test: belum tes (hari ini, hanya level) dan status post test pada bulan terpilih. */
  async function grafikPostTest(filter) {
    const minHadir = await pengaturanUsecase.angka(KUNCI_PENGATURAN.KEHADIRAN_MIN_POST_TEST);
    const [belumTes, bulan] = await Promise.all([
      posttestModel.jumlahBelumTes({ levelId: filter.levelId, minHadir, maksNomor: JUMLAH_PERTEMUAN_MATERI }),
      posttestModel.statusBulan(awalBulan(filter.bulan), filter.levelId),
    ]);
    return { belumTes, ...bulan };
  }
  /** Bagian grafik pembayaran (admin): 6 bulan berakhir di bulan terpilih, serta siswa yang membayar dan belum pada bulan itu. */
  async function grafikPembayaran(filter) {
    const [baris, status] = await Promise.all([
      pembayaranModel.totalPerBulan(awalBulan(filter.bulan), filter.levelId),
      pembayaranModel.statusSiswaBulan(awalBulan(filter.bulan), filter.levelId),
    ]);
    const deret = deretPembayaran(filter.bulan, baris);
    return { deret, terpilih: deret[deret.length - 1], membayar: status.membayar, belum: status.aktif - status.membayar };
  }
  /** Daftar tindakan "Perlu perhatian" (kondisi saat ini); `belumBayar` hanya dihitung untuk admin. */
  async function perluPerhatian(adminkah, bulanBerjalan) {
    const [postTest, tanpaSesi, sesiLama, bayar] = await Promise.all([
      posttestModel.ringkasMenunggu(),
      siswaModel.jumlahTanpaSesi(HARI_TANPA_SESI),
      sesiModel.jumlahBerlangsungLama(),
      adminkah ? pembayaranModel.statusSiswaBulan(awalBulan(bulanBerjalan)) : null,
    ]);
    return { postTestMenunggu: postTest.jumlah, tanpaSesi, hariTanpaSesi: HARI_TANPA_SESI, sesiLama, belumBayar: bayar ? bayar.aktif - bayar.membayar : null };
  }
  /** Ringkasan latihan: jumlah main game mouse dan puzzle selesai. */
  async function latihanRingkas(siswaId) {
    const s = await latihanUsecase.statistikSiswa(siswaId);
    return { jumlahGame: s.game.reduce((n, g) => n + g.jumlah, 0), puzzleSelesai: s.puzzleSelesai };
  }
  /**
   * Pembayaran untuk orang tua: satu halaman (tanggal, jumlah, keterangan, teks keterangan sesi; tanpa nama pencatat dan ID
   * internal) dan total dari SEMUA catatan (bukan hanya halaman yang tampil).
   */
  async function pembayaranOrtu(siswaId, nomorHalaman) {
    const h = await pembayaranUsecase.halamanSiswa(siswaId, nomorHalaman);
    const baris = h.baris.map((p) => ({ id: p.id, tanggal: p.tanggal, jumlah: p.jumlah, keterangan: p.keterangan, keterangan_sesi: p.keterangan_sesi }));
    return { daftar: { baris, total: h.total, halaman: h.halaman, totalHalaman: h.totalHalaman }, total: h.jumlahTotal };
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
      const [riwayat, levelRiwayat, postTest, ringkasan, mengetik, latihan, pembayaran, sertifikat, karya] = await Promise.all([
        sesiUsecase.riwayatSiswaHalaman(siswaId, hal.sesi),
        siswaModel.riwayatLevel(siswaId),
        posttestUsecase.riwayatSiswa(siswaId),
        posttestUsecase.ringkasanOrtu(siswaId),
        mengetikUsecase.statistikSiswa(siswaId),
        latihanRingkas(siswaId),
        pembayaranOrtu(siswaId, hal.bayar),
        sertifikatOrtu(siswaId),
        karyaUsecase.daftarSiswa(siswaId, hal.karya),
      ]);
      return {
        siswa: { nama: siswa.nama, level_kode: siswa.level_kode, level_nama: siswa.level_nama, status_level: levelRiwayat[0]?.status ?? null },
        kehadiran: riwayat.kehadiran,
        // sesi terakhir tidak bergantung pada halaman riwayat yang sedang dibuka
        sesiTerakhir: riwayat.terakhir ? sesiOrtu(riwayat.terakhir) : null,
        sesi: { baris: riwayat.sesi.map(sesiOrtu), total: riwayat.total, halaman: riwayat.halaman, totalHalaman: riwayat.totalHalaman },
        postTest: postTest.map(postTestOrtu),
        // ringkasan penilaian tutor per level (hanya dari post test yang sudah difinalisasi); kosong = bagian tidak tampil
        ringkasan,
        mengetik: { wpmTerbaik: mengetik.wpmTerbaik, akurasiRata: mengetik.akurasiRata, grafik: mengetik.grafik },
        latihan,
        // total dihitung dari semua catatan, daftar yang tampil berpaginasi di database
        pembayaran,
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
    /**
     * Data dashboard beranda pengelola. `filter` = { bulan, levelId } dari query (sudah berbentuk sah); nilai di luar rentang
     * dinormalkan di sini. Tiap bagian dijalankan paralel dan terisolasi (`aman`). Semua yang berkaitan dengan uang hanya
     * dihitung dan dikirim untuk admin.
     */
    async dashboard(adminkah, filterMasuk) {
      const [waktu, level] = await Promise.all([sesiModel.batasWaktu(), levelModel.daftarLevel()]);
      const levelAktif = level.filter((l) => Number(l.aktif) === 1);
      const filter = normalisasiFilter(filterMasuk ?? {}, waktu, levelAktif);
      const awal = awalBulan(filter.bulan);
      const [kartu, sesiPerHari, siswaPerLevel, postTest, penuntasan, pembayaran, perhatian] = await Promise.all([
        kartuSaatIni(adminkah),
        aman('sesiPerHari', async () => deretSesiPerHari(filter.bulan, await sesiModel.sesiPerHari(awal, filter.levelId), waktu.hari)),
        aman('siswaPerLevel', async () => (await siswaModel.perLevel()).map((l) => ({ id: l.id, kode: l.kode, nama: l.nama, n: Number(l.n) }))),
        aman('postTest', () => grafikPostTest(filter)),
        aman('penuntasan', async () => deretPenuntasan(filter.bulan, await sesiModel.penuntasanPerMinggu(awal, filter.levelId))),
        adminkah ? aman('pembayaran', () => grafikPembayaran(filter)) : null,
        aman('perluPerhatian', () => perluPerhatian(adminkah, filter.bulanBerjalan)),
      ]);
      return {
        filter,
        hariIni: waktu.hari,
        level: levelAktif.map((l) => ({ id: l.id, kode: l.kode, nama: l.nama, urutan: Number(l.urutan) })),
        ...kartu,
        sesiPerHari,
        siswaPerLevel,
        postTest,
        penuntasan,
        pembayaran,
        perhatian,
      };
    },
  };
}
