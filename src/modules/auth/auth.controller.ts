import { validasi } from '@/utils/validasi';
import { AppError } from '@/utils/appError';
import { gabungJalur } from '@/utils/jalurArea';
import { t } from '@/utils/i18n';
import { AKSES, ALASAN_BERAKHIR, JENIS_KODE, PERAN } from '@/enums';
import { masukKodeSchema, masukPengelolaSchema } from './auth.schema';

/**
 * Controller auth: penghubung form masuk/keluar dengan usecase, sekaligus satu-satunya tempat
 * cookie sesi dibaca dan ditulis. Juga menyediakan pemeriksaan hak akses untuk action dan route.
 */
export function buatAuthController({ authUsecase, sesiUsecase, cookieSesi, infoPermintaan, keamanan }) {
  const nama = keamanan.namaCookie;

  /** Sesi pengelola dari cookie dp_bo; null bila tidak login. */
  async function sesiPengguna() {
    return authUsecase.sesiPengguna(await cookieSesi.baca(nama.pengelola));
  }
  /** Sesi siswa dari cookie dp_siswa; null bila tidak login atau login sudah berakhir. */
  async function sesiSiswa() {
    return authUsecase.sesiSiswa(await cookieSesi.baca(nama.siswa));
  }
  /** Sesi orang tua dari cookie dp_ortu; null bila tidak login. */
  async function sesiOrtu() {
    return authUsecase.sesiOrtu(await cookieSesi.baca(nama.ortu));
  }
  /** Mengakhiri login perangkat siswa saat ini (bila ada), menghapus cookie, dan memberi tujuan halaman masuk. */
  async function akhiriSiswa(alasan) {
    const sesi = await sesiSiswa();
    // login sudah berakhir di server: cukup hapus cookie
    if (sesi) await authUsecase.akhiriLoginSiswa(sesi.siswaId, alasan);
    await cookieSesi.hapus(nama.siswa);
    return { href: gabungJalur((await infoPermintaan()).basis, '/masuk') };
  }

  /** Penolakan seragam: 401 belum login. */
  function belumLogin() {
    return new AppError(t('auth.belumLogin'), 401);
  }

  return {
    sesiPengguna,
    sesiSiswa,
    sesiOrtu,
    /**
     * Memastikan pemanggil punya hak `akses` dan mengembalikan sesinya (null untuk publik).
     * Dipakai routeHandler (sebelum controller) dan setiap Server Action yang mengubah data.
     */
    async wajibAkses(akses) {
      switch (akses) {
        // tanpa login
        case AKSES.PUBLIK:
          return null;
        // admin atau tutor; khusus ADMIN, tutor yang login ditolak 403 (bukan 401)
        case AKSES.PENGGUNA:
        case AKSES.ADMIN: {
          const sesi = await sesiPengguna();
          if (!sesi) throw belumLogin();
          // sudah login tetapi bukan admin: dilarang (403), bukan belum login
          if (akses === AKSES.ADMIN && sesi.peran !== PERAN.ADMIN) throw new AppError(t('auth.tidakBerhak'), 403);
          return sesi;
        }
        case AKSES.SISWA: {
          const sesi = await sesiSiswa();
          if (!sesi) throw belumLogin();
          return sesi;
        }
        case AKSES.ORTU: {
          const sesi = await sesiOrtu();
          if (!sesi) throw belumLogin();
          return sesi;
        }
        // halaman lihat saja yang boleh dibuka siswa maupun orang tua
        case AKSES.SISWA_ATAU_ORTU: {
          const sesi = (await sesiSiswa()) ?? (await sesiOrtu());
          if (!sesi) throw belumLogin();
          return sesi;
        }
        // siapa pun yang login (pengelola didahulukan); usecase wajib memeriksa kepemilikan data siswa
        case AKSES.LOGIN: {
          const sesi = (await sesiPengguna()) ?? (await sesiSiswa()) ?? (await sesiOrtu());
          if (!sesi) throw belumLogin();
          return sesi;
        }
        // akses tidak dikenal: tolak demi keamanan (kesalahan konfigurasi route)
        default:
          throw new AppError(t('auth.tidakBerhak'), 403);
      }
    },
    /** Login pengelola dari form; sukses menyimpan cookie dp_bo dan memberi tujuan beranda backoffice. */
    async masukPengelola(input) {
      const data = validasi(masukPengelolaSchema, input);
      const info = await infoPermintaan();
      const { nilaiCookie, masaDetik } = await authUsecase.masukPengelola(data, info);
      await cookieSesi.simpan(nama.pengelola, nilaiCookie, masaDetik);
      return { href: gabungJalur(info.basis, '/') };
    },
    /** Keluar dari backoffice. */
    async keluarPengelola() {
      await cookieSesi.hapus(nama.pengelola);
      return { href: gabungJalur((await infoPermintaan()).basis, '/masuk') };
    },
    /** Login kode dari form area siswa; tujuan beranda siswa atau halaman orang tua sesuai jenis kode. */
    async masukKode(input) {
      const data = validasi(masukKodeSchema, input);
      const info = await infoPermintaan();
      const hasil = await authUsecase.masukKode(data, info);
      const namaCookie = hasil.jenis === JENIS_KODE.ORTU ? nama.ortu : nama.siswa;
      // cookie siswa bermasa berlaku agar tidak hilang saat browser ditutup tidak sengaja; batas tidak aktif tetap dijaga server
      await cookieSesi.simpan(namaCookie, hasil.nilaiCookie, hasil.masaDetik);
      return { href: gabungJalur(info.basis, hasil.jenis === JENIS_KODE.ORTU ? '/ortu' : '/') };
    },
    /** Ganti device: login di perangkat ini berakhir, absensi (Fase C) tetap berjalan. */
    gantiDevice: () => akhiriSiswa(ALASAN_BERAKHIR.GANTI_DEVICE),
    /** Keluar biasa dari area siswa. */
    keluarSiswa: () => akhiriSiswa(ALASAN_BERAKHIR.LOGOUT),
    /** Keluar dari halaman orang tua. */
    async keluarOrtu() {
      await cookieSesi.hapus(nama.ortu);
      return { href: gabungJalur((await infoPermintaan()).basis, '/masuk') };
    },
    /**
     * Ping sesi siswa dari browser; login sudah diperiksa (dan diperbarui) oleh routeHandler.
     * `sesiAktifId` dipakai browser untuk memuat ulang halaman saat tutor mengabsen atau menutup sesi.
     */
    ping: async (_input, sesi) => ({ aktif: true, sesiAktifId: await sesiUsecase.sesiAktifId(sesi.siswaId) }),
    /** Menghapus cookie siswa setelah login diakhiri di server (mis. Pulang) dan memberi tujuan `jalur` di area siswa. */
    async keluarkanSiswa(jalur) {
      await cookieSesi.hapus(nama.siswa);
      return { href: gabungJalur((await infoPermintaan()).basis, jalur) };
    },
  };
}
