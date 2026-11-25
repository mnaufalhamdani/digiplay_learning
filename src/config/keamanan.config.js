// Batas keamanan login dan sesi. Satu tempat agar angka tidak tersebar di banyak berkas.

/** Konfigurasi batas keamanan aplikasi. */
export const keamananConfig = Object.freeze({
  /** Percobaan gagal login backoffice per IP dalam jendela waktu. */
  loginBackoffice: Object.freeze({ maksGagal: 5, jendelaMenit: 15 }),
  /** Percobaan gagal login kode (siswa/orang tua) per IP dalam jendela waktu. */
  loginKode: Object.freeze({ maksGagal: 10, jendelaMenit: 15 }),
  /** Masa berlaku cookie pengelola (jam). */
  masaCookiePengelolaJam: 12,
  /**
   * Masa berlaku cookie siswa (jam). Cookie bertahan saat browser tertutup tidak sengaja, sehingga siswa
   * langsung masuk lagi di browser yang sama. Login tetap berakhir lebih cepat oleh server: batas tidak aktif,
   * Ganti device, Pulang, atau ditutup tutor.
   */
  masaCookieSiswaJam: 12,
  /** Masa berlaku cookie orang tua (hari). */
  masaCookieOrtuHari: 7,
  /**
   * Interval ping sesi siswa dari browser (detik). 15 detik agar tugas tampil cepat setelah tutor mengabsen
   * (keputusan developer, Fase C); penulisan terakhir_aktif_at tetap dibatasi throttleAktifDetik.
   */
  intervalPingDetik: 15,
  /** Jeda minimum antar pembaruan terakhir_aktif_at login siswa (detik), agar database tidak ditulis tiap request. */
  throttleAktifDetik: 30,
  /** Baris percobaan_login yang lebih tua dari ini (jam) dihapus berkala. */
  simpanPercobaanJam: 24,
  /** Peluang pembersihan percobaan_login: 1 dari N kali pencatatan. */
  peluangBersihPercobaan: 50,
  /** Panjang minimum SESSION_SECRET. */
  minPanjangSecret: 32,
  /** Ukuran token login siswa (byte acak). */
  panjangTokenByte: 32,
  /**
   * Jumlah reverse proxy tepercaya di depan aplikasi (.env JUMLAH_PROXY_TEPERCAYA, bawaan 1, minimal 1).
   * Menentukan entri x-forwarded-for (dihitung dari kanan) yang dipakai sebagai IP klien untuk pembatas login.
   */
  jumlahProxyTepercaya: Math.max(1, Math.trunc(Number(process.env.JUMLAH_PROXY_TEPERCAYA)) || 1),
  /** Nama cookie per jenis sesi; tanpa atribut Domain sehingga tidak terbagi antar host. */
  namaCookie: Object.freeze({ pengelola: 'dp_bo', siswa: 'dp_siswa', ortu: 'dp_ortu' }),
});
