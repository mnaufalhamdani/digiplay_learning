import 'server-only';
import { AppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { buatKode } from '@/utils/kodeAkses';
import { hitungPaginasi } from '@/utils/paginasi';
import { t } from '@/utils/i18n';
import { AKSI_LOG, ALASAN_BERAKHIR, JENIS_KODE, KUNCI_PENGATURAN, STATUS_SISWA, STATUS_SISWA_LEVEL, UKURAN_HALAMAN } from '@/enums';

/** Batas percobaan membuat kode acak bila kebetulan bentrok dengan kode yang sudah ada. */
const MAKS_ULANG_KODE = 5;

/** Kode aktif sebagai objek { siswa, ortu }. */
function petaKode(baris) {
  return Object.fromEntries(baris.map((k) => [k.jenis, k.kode]));
}

/**
 * Usecase siswa: daftar, detail, pendaftaran (siswa + 2 kode + level dalam satu transaksi), ganti kode,
 * ganti level, aktif/nonaktif, dan hapus (admin). Semua aksi sensitif dicatat ke log.
 */
export function buatSiswaUsecase({ siswaModel, levelUsecase, authUsecase, pengaturanUsecase, karyaUsecase, db, idGen, catatAktivitas, urlSiswa }) {
  /** Mengambil siswa (dengan level berjalan) atau melempar 404. */
  async function wajibAda(id, conn = null) {
    const s = await siswaModel.cariId(id, conn);
    if (!s) throw new AppError(t('dataSiswa.tidakAda'), 404);
    return s;
  }
  /** Mengunci baris siswa untuk aksi dalam transaksi; 404 bila tidak ada. */
  async function kunciSiswa(id, conn) {
    const s = await siswaModel.kunci(id, conn);
    if (!s) throw new AppError(t('dataSiswa.tidakAda'), 404);
    return s;
  }
  /** Memastikan level tujuan ada dan aktif. */
  async function pastikanLevel(levelId, conn) {
    const level = await levelUsecase.cariLevel(levelId, conn);
    if (!level || !level.aktif) throw new AppError(t('level.tidakAda'), 400, [{ kolom: 'levelId', pesan: t('level.tidakAda') }]);
    return level;
  }
  /** Membuat satu kode aktif yang unik; bila bentrok dengan kode lain, ulangi dengan kode acak baru (maksimal 5 kali). */
  async function buatKodeUnik(siswaId, jenis, conn) {
    const panjang = await pengaturanUsecase.angka(KUNCI_PENGATURAN.PANJANG_KODE_AKSES);
    for (let i = 0; i < MAKS_ULANG_KODE; i += 1) {
      const kode = buatKode(panjang);
      try {
        await siswaModel.tambahKode({ id: idGen.generate(), siswaId, jenis, kode }, conn);
        return kode;
      } catch (error) {
        // kode kebetulan sudah dipakai: coba kode acak berikutnya; galat lain diteruskan
        if (!adalahDuplikat(error, 'uq_kode_akses_kode')) throw error;
      }
    }
    throw new AppError(t('dataSiswa.gagalBuatKode'), 409);
  }
  return {
    /** Satu halaman daftar siswa beserta info paginasi. */
    async daftar(filter) {
      const total = await siswaModel.hitung(filter);
      const pg = hitungPaginasi(total, filter.halaman, UKURAN_HALAMAN);
      return { baris: await siswaModel.daftar(filter, pg), total, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
    },
    /** Detail siswa: profil, level berjalan, riwayat level, dan kode aktif. */
    async detail(id) {
      const siswa = await wajibAda(id);
      const [kode, riwayatLevel] = await Promise.all([siswaModel.kodeAktif(id), siswaModel.riwayatLevel(id)]);
      return { ...siswa, kode: petaKode(kode), riwayatLevel };
    },
    /** Data kartu kode untuk dicetak: nama, kedua kode, dan alamat situs siswa. */
    async kartuKode(id) {
      const siswa = await wajibAda(id);
      return { id: siswa.id, nama: siswa.nama, kode: petaKode(await siswaModel.kodeAktif(id)), urlSiswa };
    },
    /** Pilihan level untuk form tambah/ganti level. */
    pilihanLevel: async () => (await levelUsecase.pilihan()).level.filter((l) => l.aktif),
    /** Mendaftarkan siswa: siswa, kode siswa, kode orang tua, dan level awal berjalan dalam satu transaksi. */
    async tambah({ nama, tanggalDaftar, levelId }, pelakuId) {
      const id = idGen.generate();
      const kode = await db.transaction(async (conn) => {
        await pastikanLevel(levelId, conn);
        await siswaModel.tambah({ id, nama, tanggalDaftar, dibuatOleh: pelakuId }, conn);
        const kodeSiswa = await buatKodeUnik(id, JENIS_KODE.SISWA, conn);
        const kodeOrtu = await buatKodeUnik(id, JENIS_KODE.ORTU, conn);
        await siswaModel.tambahSiswaLevel({ id: idGen.generate(), siswaId: id, levelId, mulai: tanggalDaftar }, conn);
        // kode tidak ikut dicatat di log karena berfungsi sebagai kunci masuk
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.TAMBAH_SISWA, entitas: 'siswa', entitasId: id, detail: { nama, tanggalDaftar, levelId } }, conn);
        return { siswa: kodeSiswa, ortu: kodeOrtu };
      });
      return { id, nama, kode };
    },
    /**
     * Mengganti kode siswa atau orang tua: kode lama aktif = 0, kode baru dibuat. Ganti kode siswa juga
     * mengakhiri login perangkat yang masih aktif (alasan ditutup_tutor). Cookie orang tua lama otomatis
     * tidak berlaku karena memeriksa kode aktif.
     */
    async gantiKode(id, jenis, pelakuId) {
      const kode = await db.transaction(async (conn) => {
        await kunciSiswa(id, conn);
        await siswaModel.nonaktifkanKode(id, jenis, conn);
        const baru = await buatKodeUnik(id, jenis, conn);
        // login siswa berbasis token, jadi harus diakhiri manual agar kode lama benar-benar tidak terpakai lagi
        if (jenis === JENIS_KODE.SISWA) await authUsecase.akhiriLoginSiswa(id, ALASAN_BERAKHIR.DITUTUP_TUTOR, conn);
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.GANTI_KODE, entitas: 'siswa', entitasId: id, detail: { jenis } }, conn);
        return baru;
      });
      return { id, jenis, kode };
    },
    /**
     * Mengganti level (naik level diatur tutor): level berjalan diakhiri hari ini, berstatus lulus bila post test-nya
     * sudah lulus atau berhenti bila belum, lalu level baru dibuka berstatus berjalan. Kode siswa dan orang tua tetap.
     */
    async gantiLevel(id, levelId, pelakuId) {
      await db.transaction(async (conn) => {
        await kunciSiswa(id, conn);
        const siswa = await wajibAda(id, conn);
        // level tujuan sama dengan yang sedang berjalan: tidak ada yang diganti
        if (siswa.level_id === levelId) throw new AppError(t('dataSiswa.levelSama'), 409);
        await pastikanLevel(levelId, conn);
        if (siswa.siswa_level_id) {
          // level yang post test-nya sudah lulus dicatat lulus (bukan berhenti) agar riwayat level dan rapor benar
          const lulus = await siswaModel.sudahLulusPostTest(siswa.siswa_level_id, conn);
          await siswaModel.hentikanSiswaLevel(siswa.siswa_level_id, conn, lulus ? STATUS_SISWA_LEVEL.LULUS : STATUS_SISWA_LEVEL.BERHENTI);
        }
        // mulai null = tanggal hari ini menurut database
        await siswaModel.tambahSiswaLevel({ id: idGen.generate(), siswaId: id, levelId, mulai: null }, conn);
        const detail = { sebelum: siswa.level_id ?? null, sesudah: levelId };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.GANTI_LEVEL, entitas: 'siswa', entitasId: id, detail }, conn);
      });
      return { id };
    },
    /** Mengaktifkan/menonaktifkan siswa; menonaktifkan juga mengakhiri login perangkat yang masih aktif. */
    async ubahStatus(id, aktif, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await kunciSiswa(id, conn);
        const status = aktif ? STATUS_SISWA.AKTIF : STATUS_SISWA.NONAKTIF;
        await siswaModel.ubahStatus(id, status, conn);
        // siswa nonaktif tidak boleh tetap masuk di perangkat yang sedang dipakai
        if (!aktif) await authUsecase.akhiriLoginSiswa(id, ALASAN_BERAKHIR.DITUTUP_TUTOR, conn);
        const aksi = aktif ? AKSI_LOG.AKTIFKAN_SISWA : AKSI_LOG.NONAKTIFKAN_SISWA;
        await catatAktivitas({ penggunaId: pelakuId, aksi, entitas: 'siswa', entitasId: id, detail: { sebelum: lama.status, sesudah: status } }, conn);
      });
      return { id };
    },
    /**
     * Admin menghapus siswa beserta seluruh datanya; nama yang diketik harus sama dengan nama siswa.
     * Berkas karya di disk ikut dihapus setelah transaksi berhasil (baris karya terhapus lewat CASCADE).
     */
    async hapus(id, konfirmasiNama, pelakuId) {
      const berkasKarya = await db.transaction(async (conn) => {
        const siswa = await kunciSiswa(id, conn);
        // pengaman salah klik: nama harus diketik ulang (huruf besar/kecil dan spasi tepi diabaikan)
        if (siswa.nama.trim().toLowerCase() !== konfirmasiNama.trim().toLowerCase()) {
          throw new AppError(t('dataSiswa.namaTidakCocok'), 400, [{ kolom: 'konfirmasiNama', pesan: t('dataSiswa.namaTidakCocok') }]);
        }
        // path berkas dibaca sebelum baris karya hilang karena CASCADE
        const daftarPath = await karyaUsecase.berkasSiswa(id, conn);
        await siswaModel.hapusBerantai(id, conn);
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.HAPUS_SISWA, entitas: 'siswa', entitasId: id, detail: { nama: siswa.nama, berkasKarya: daftarPath.length } }, conn);
        return daftarPath;
      });
      // berkas dihapus setelah commit: bila transaksi batal, berkas tetap utuh bersama datanya
      await karyaUsecase.hapusBerkasSiswa(id, berkasKarya);
      return { id };
    },
  };
}
