import 'server-only';
import { AppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { bacaPayloadBertanda, cocokPassword, hashPassword, sha256, tandatanganiPayload, tokenAcak } from '@/utils/kripto';
import { karakterTerlarang, normalisasiKode } from '@/utils/kodeAkses';
import { t } from '@/utils/i18n';
import { ALASAN_BERAKHIR, AREA_LOGIN, JENIS_KODE, KUNCI_PENGATURAN, STATUS_SISWA } from '@/enums';

/**
 * Usecase auth: login pengelola (email + password), login kode siswa/orang tua, pembacaan sesi,
 * dan pengakhiran login perangkat siswa. Cookie dibaca/ditulis oleh controller; di sini hanya nilainya.
 */
export function buatAuthUsecase({ authModel, penggunaModel, pengaturanUsecase, idGen, keamanan }) {
  let hashSemu = null; // hash password palsu agar email tak dikenal tetap butuh waktu verifikasi yang sama

  /** Menolak dengan 429 bila percobaan gagal dari IP ini sudah mencapai batas. */
  async function periksaBatas(daftarArea, ip, batas) {
    const gagal = await authModel.hitungGagal(daftarArea, ip, batas.jendelaMenit);
    // terlalu banyak gagal dalam jendela waktu: tahan sementara untuk mencegah tebak-tebakan
    if (gagal >= batas.maksGagal) throw new AppError(t('auth.cobaLagiNanti'), 429);
  }

  /** Mencatat percobaan login; sesekali (peluang 1/N) sekaligus membersihkan catatan lama, tanpa penjadwal. */
  async function catatPercobaan(area, ip, berhasil) {
    await authModel.catatPercobaan({ id: idGen.generate(), area, ip, berhasil });
    // pembersihan acak cukup untuk menjaga tabel tetap kecil
    if (Math.random() < 1 / keamanan.peluangBersihPercobaan) await authModel.bersihkanPercobaan(keamanan.simpanPercobaanJam);
  }

  /** Mencatat kegagalan lalu melempar pesan: 429 bila batas baru saja tercapai, selain itu pesan generik. */
  async function gagalLogin(daftarArea, ip, batas, pesan) {
    await catatPercobaan(daftarArea[0], ip, false);
    await periksaBatas(daftarArea, ip, batas);
    throw new AppError(pesan, 401);
  }

  /** Validasi format kode: karakter terlarang dan panjang diberi pesan yang tepat (tidak dikoreksi otomatis). */
  async function kodeTernormalisasi(masukan) {
    const kode = normalisasiKode(masukan);
    const terlarang = karakterTerlarang(kode);
    // karakter di luar alfabet (O, I, 0, 1, simbol) ditolak dengan menyebut karakternya
    if (terlarang.length > 0) throw new AppError(t('auth.kodeKarakterTerlarang', { karakter: terlarang.join(', ') }), 400);
    const panjang = await pengaturanUsecase.angka(KUNCI_PENGATURAN.PANJANG_KODE_AKSES);
    if (kode.length !== panjang) throw new AppError(t('auth.kodePanjang', { panjang }), 400);
    return kode;
  }

  /**
   * Membuka login perangkat baru untuk siswa (satu kode satu perangkat). Login lama yang sudah diam
   * melewati batas diakhiri dulu; yang masih aktif membuat login ditolak. Mengembalikan token mentah.
   */
  async function bukaLoginSiswa(siswaId, { ip, perangkat }) {
    const batasDetik = (await pengaturanUsecase.angka(KUNCI_PENGATURAN.BATAS_TIDAK_AKTIF_MENIT)) * 60;
    const aktif = await authModel.loginAktifSiswa(siswaId);
    // masih dipakai di perangkat lain dan belum melewati batas tidak aktif
    if (aktif && Number(aktif.diam_detik) <= batasDetik) throw new AppError(t('auth.kodeDipakai'), 409);
    // login lama sudah lama diam: dianggap ditinggal, akhiri agar perangkat baru bisa masuk
    if (aktif) await authModel.akhiriLogin(aktif.id, ALASAN_BERAKHIR.TIDAK_AKTIF);
    const token = tokenAcak();
    try {
      await authModel.tambahLogin({ id: idGen.generate(), siswaId, tokenHash: sha256(token), perangkat, ip });
    } catch (error) {
      // dua login bersamaan: UNIQUE aktif_kunci menolak yang kalah balapan
      if (adalahDuplikat(error, 'uq_login_perangkat_aktif')) throw new AppError(t('auth.kodeDipakai'), 409);
      throw error;
    }
    return token;
  }

  return {
    /**
     * Login pengelola. Email tidak ada, akun nonaktif, dan password salah memberi pesan yang SAMA.
     * Sukses: nilai cookie bertanda tangan { penggunaId, peran, exp } beserta masa berlakunya (detik).
     */
    async masukPengelola({ email, password }, { ip }) {
      const batas = keamanan.loginBackoffice;
      await periksaBatas([AREA_LOGIN.BACKOFFICE], ip, batas);
      const akun = await penggunaModel.cariUntukLogin(email);
      hashSemu ??= await hashPassword('akun-tidak-ada');
      // email tak dikenal tetap memverifikasi hash palsu agar waktu respons tidak membocorkan keberadaan akun
      const cocok = await cocokPassword(password, akun?.password_hash ?? hashSemu);
      if (!akun || !akun.aktif || !cocok) await gagalLogin([AREA_LOGIN.BACKOFFICE], ip, batas, t('auth.loginGagal'));
      await catatPercobaan(AREA_LOGIN.BACKOFFICE, ip, true);
      await penggunaModel.catatLogin(akun.id);
      const masaDetik = keamanan.masaCookiePengelolaJam * 3600;
      return { nilaiCookie: tandatanganiPayload({ penggunaId: akun.id, peran: akun.peran, exp: Date.now() + masaDetik * 1000 }), masaDetik };
    },
    /**
     * Login kode (satu form untuk siswa dan orang tua). Hasil: { jenis, nilaiCookie, masaDetik }.
     * Kode siswa membuka login perangkat; kode orang tua memberi cookie bertanda tangan (lihat saja).
     */
    async masukKode({ kode }, info) {
      const batas = keamanan.loginKode;
      const daftarArea = [AREA_LOGIN.SISWA, AREA_LOGIN.ORTU];
      await periksaBatas(daftarArea, info.ip, batas);
      const data = await authModel.cariKodeAktif(await kodeTernormalisasi(kode));
      // kode tidak ada atau sudah diganti: pesan generik, tidak membedakan sebabnya
      if (!data) await gagalLogin(daftarArea, info.ip, batas, t('auth.kodeTidakDikenal'));
      // siswa nonaktif tidak boleh masuk walau kodenya benar
      if (data.status !== STATUS_SISWA.AKTIF) {
        await catatPercobaan(AREA_LOGIN.SISWA, info.ip, false);
        throw new AppError(t('auth.akunBelumAktif'), 403);
      }
      // kode orang tua: hanya melihat, tanpa aturan satu perangkat
      if (data.jenis === JENIS_KODE.ORTU) {
        await catatPercobaan(AREA_LOGIN.ORTU, info.ip, true);
        const masaDetik = keamanan.masaCookieOrtuHari * 86400;
        const payload = { siswaId: data.siswa_id, kodeId: data.kode_id, exp: Date.now() + masaDetik * 1000 };
        return { jenis: JENIS_KODE.ORTU, nilaiCookie: tandatanganiPayload(payload), masaDetik };
      }
      const token = await bukaLoginSiswa(data.siswa_id, info);
      await catatPercobaan(AREA_LOGIN.SISWA, info.ip, true);
      return { jenis: JENIS_KODE.SISWA, nilaiCookie: token, masaDetik: keamanan.masaCookieSiswaJam * 3600 };
    },
    /** Sesi pengelola dari nilai cookie: tanda tangan, kedaluwarsa, dan akun masih aktif. Null bila tidak sah. */
    async sesiPengguna(nilaiCookie) {
      const payload = bacaPayloadBertanda(nilaiCookie);
      // cookie tidak ada, palsu, atau kedaluwarsa
      if (!payload?.penggunaId) return null;
      // peran dibaca ulang dari database: akun yang diturunkan/dinonaktifkan langsung berlaku
      return penggunaModel.cariAktif(String(payload.penggunaId));
    },
    /**
     * Sesi siswa dari token cookie. Login yang diam melewati batas diakhiri (tidak_aktif) dan hasilnya null;
     * selain itu terakhir_aktif_at diperbarui, paling sering sekali per jeda throttle.
     */
    async sesiSiswa(token) {
      // belum login di perangkat ini
      if (!token) return null;
      const login = await authModel.cariLoginToken(sha256(token));
      // token tidak dikenal/sudah berakhir, atau siswa dinonaktifkan
      if (!login || login.status !== STATUS_SISWA.AKTIF) return null;
      const batasDetik = (await pengaturanUsecase.angka(KUNCI_PENGATURAN.BATAS_TIDAK_AKTIF_MENIT)) * 60;
      const diam = Number(login.diam_detik);
      // diam melewati batas: login perangkat berakhir otomatis (absensi tidak terpengaruh)
      if (diam > batasDetik) {
        await authModel.akhiriLogin(login.id, ALASAN_BERAKHIR.TIDAK_AKTIF);
        return null;
      }
      // throttle: tidak menulis database pada setiap request
      if (diam >= keamanan.throttleAktifDetik) await authModel.sentuhLogin(login.id);
      return { loginId: login.id, siswaId: login.siswa_id, nama: login.nama };
    },
    /** Sesi orang tua dari cookie bertanda tangan; null bila kode orang tua sudah diganti atau siswa nonaktif. */
    async sesiOrtu(nilaiCookie) {
      const payload = bacaPayloadBertanda(nilaiCookie);
      // cookie tidak ada, palsu, atau kedaluwarsa
      if (!payload?.siswaId || !payload?.kodeId) return null;
      const data = await authModel.cariKodeOrtuAktif(String(payload.kodeId), String(payload.siswaId));
      // kode orang tua sudah diganti atau siswa dinonaktifkan: cookie lama tidak berlaku
      if (!data || data.status !== STATUS_SISWA.AKTIF) return null;
      return { siswaId: data.siswa_id, nama: data.nama };
    },
    /** Mengakhiri login perangkat aktif seorang siswa (ganti device, logout; Fase C: pulang, ditutup tutor). */
    akhiriLoginSiswa: (siswaId, alasan, conn = null) => authModel.akhiriLoginSiswa(siswaId, alasan, conn),
  };
}
