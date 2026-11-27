// Konstanta bersama. Nilai sama persis dengan yang dipakai di schema.sql.
// Berkas ini tidak memakai alias @/ dan aman diimpor dari client maupun skrip Node.

/** Peran akun pengelola. */
export const PERAN = Object.freeze({ ADMIN: 'admin', TUTOR: 'tutor' });
export const DAFTAR_PERAN = Object.values(PERAN);

/** Jenis kode akses (tabel kode_akses). */
export const JENIS_KODE = Object.freeze({ SISWA: 'siswa', ORTU: 'ortu' });

/** Area tampilan (atribut data-area pada pembungkus layout). */
export const AREA = Object.freeze({ SISWA: 'siswa', PENGELOLA: 'pengelola' });

/** Area pencatatan percobaan login (tabel percobaan_login). */
export const AREA_LOGIN = Object.freeze({ SISWA: 'siswa', ORTU: 'ortu', BACKOFFICE: 'backoffice' });

/** Alasan berakhirnya login perangkat siswa (tabel login_perangkat). */
export const ALASAN_BERAKHIR = Object.freeze({
  GANTI_DEVICE: 'ganti_device',
  TIDAK_AKTIF: 'tidak_aktif',
  PULANG: 'pulang',
  DITUTUP_TUTOR: 'ditutup_tutor',
  LOGOUT: 'logout',
});

/** Status siswa. */
export const STATUS_SISWA = Object.freeze({ AKTIF: 'aktif', NONAKTIF: 'nonaktif' });
export const DAFTAR_STATUS_SISWA = Object.values(STATUS_SISWA);
/** Status keikutsertaan siswa pada sebuah level (tabel siswa_level). */
export const STATUS_SISWA_LEVEL = Object.freeze({ BERJALAN: 'berjalan', LULUS: 'lulus', BERHENTI: 'berhenti' });
/** Tipe template (ENUM template.tipe). */
export const TIPE_TEMPLATE = Object.freeze([
  'mengetik',
  'pilihan_ganda',
  'excel',
  'word',
  'powerpoint',
  'paint',
  'scratch',
  'coding',
  'game_mouse',
  'puzzle',
  'blockly',
  'coding_proyek',
  'lainnya',
]);
/**
 * Tipe template yang hanya bisa dikerjakan di aplikasi lain, jadi tidak bisa dinilai otomatis. `coding_proyek` dikerjakan
 * di Studio Zippy, tetapi proyeknya bebas sehingga tetap dinilai tutor (siswa mengirim proyek, tutor menjalankan dan menilai).
 */
export const TIPE_DICEK_TUTOR_SAJA = Object.freeze(['word', 'powerpoint', 'paint', 'scratch', 'coding', 'coding_proyek', 'lainnya']);
/** Mode penilaian template (ENUM template.penilaian). */
export const PENILAIAN = Object.freeze({ OTOMATIS: 'otomatis_jawaban', TUTOR: 'dicek_tutor' });
export const DAFTAR_PENILAIAN = Object.values(PENILAIAN);
/** Sumber nilai bagian post test (ENUM bagian_post_test.sumber). */
export const SUMBER_BAGIAN = Object.freeze(['tes_mengetik', 'soal', 'praktik_tutor']);
/** Jenis pertemuan (ENUM pertemuan.jenis). */
export const JENIS_PERTEMUAN = Object.freeze(['materi', 'post_test']);
/** Jumlah pertemuan per level (12 materi + 1 post test) dan nomor pertemuan post test. */
export const JUMLAH_PERTEMUAN = 13;
export const NOMOR_POST_TEST = 13;
/** Aturan post test per level: total butir semua bagian dan total bobot. */
export const TOTAL_BUTIR_POST_TEST = 15;
export const TOTAL_BOBOT_POST_TEST = 100;
/** Jenis berkas subjek gambar yang bisa dipakai tugas (parameter {dari:"gambar", jenis}). */
export const JENIS_GAMBAR = Object.freeze(['mewarnai', 'berwarna', 'puzzle']);
/** Kategori subjek gambar (ENUM gambar.kategori). */
export const KATEGORI_GAMBAR = Object.freeze(['hewan', 'tanaman', 'kendaraan', 'benda_lain', 'benda_olahraga']);
/** Nama berkas yang dicari di public/aset/gambar/<kode>/ (outline hanya ditampilkan, tidak punya penanda). */
export const BERKAS_GAMBAR = Object.freeze(['outline', 'berwarna', 'puzzle', 'mewarnai']);
/** Jenis game latihan mouse (kunci.jenis tugas game_mouse, ENUM hasil_latihan.jenis). */
export const JENIS_GAME_MOUSE = Object.freeze(['mouse_klik', 'mouse_klik_ganda', 'mouse_drag', 'mouse_klik_kanan', 'mouse_scroll']);
/** Jumlah keping puzzle yang didukung (2x2, 3x2, 3x3). */
export const KEPING_PUZZLE = Object.freeze([4, 6, 9]);
/** Status sesi (tabel sesi). */
export const STATUS_SESI = Object.freeze({ BERLANGSUNG: 'berlangsung', SELESAI: 'selesai' });
/** Status penuntasan pertemuan (sesi.penuntasan_otomatis / penuntasan_tutor). */
export const PENUNTASAN = Object.freeze({ TUNTAS: 'tuntas', SEBAGIAN: 'tuntas_sebagian', TIDAK: 'tidak_tuntas' });
export const DAFTAR_PENUNTASAN = Object.values(PENUNTASAN);
/** Status tugas siswa (tabel tugas_siswa). */
export const STATUS_TUGAS = Object.freeze({ BELUM: 'belum', SELESAI: 'selesai', DILEWATI: 'dilewati', DIGANTI: 'diganti' });
/** Status yang boleh dipilih tutor untuk sebuah tugas ('diganti' hanya lewat Ganti tugas). */
export const STATUS_TUGAS_TUTOR = Object.freeze(['belum', 'selesai', 'dilewati']);
/** Tipe tugas yang jawabannya diketik/dipilih siswa di web lalu diperiksa otomatis. */
export const TIPE_DIJAWAB_SISWA = Object.freeze(['pilihan_ganda', 'excel']);
/** Tipe tugas yang dikerjakan di menu latihan web (diaktifkan di Fase D). */
export const TIPE_LATIHAN_WEB = Object.freeze(['game_mouse', 'puzzle', 'mengetik', 'blockly']);
/** Jenis gambar yang bisa diunduh siswa sebagai bahan (puzzle dimainkan di web). */
export const JENIS_GAMBAR_UNDUH = Object.freeze(['mewarnai', 'berwarna']);
/** Mode hasil mengetik (ENUM hasil_mengetik.mode). 'tes' hanya untuk post test. */
export const MODE_MENGETIK = Object.freeze({ PELAJARAN: 'pelajaran', LATIHAN: 'latihan', GAME: 'game', TES: 'tes' });
/** Jenis hasil latihan web (ENUM hasil_latihan.jenis). */
export const JENIS_LATIHAN = Object.freeze([...JENIS_GAME_MOUSE, 'puzzle']);
/** Kunci menu game siswa (sama dengan kunci menu di ShellSiswa dan sesiSiswa.menu.*). */
export const MENU_GAME = Object.freeze({ LATIHAN_MOUSE: 'latihanMouse', PUZZLE: 'puzzle', CODING_ZIPPY: 'codingZippy', STUDIO: 'studio', MENGETIK: 'mengetik' });
/** Menu game yang terbuka sejak awal (tanpa syarat tugas). */
export const MENU_GAME_AWAL = Object.freeze([MENU_GAME.PUZZLE]);
/**
 * Pemetaan jenis tugas (template.tipe) ke menu game yang terbuka begitu tugas itu muncul untuk siswa (juga butir post test).
 * Tipe puzzle tidak ada di sini karena Puzzle sudah terbuka sejak awal. Bagian tes mengetik post test (bukan baris tugas)
 * dihitung terpisah di query dan membuka menu Mengetik.
 */
export const MENU_GAME_DARI_TIPE = Object.freeze({ game_mouse: MENU_GAME.LATIHAN_MOUSE, mengetik: MENU_GAME.MENGETIK, blockly: MENU_GAME.CODING_ZIPPY, coding_proyek: MENU_GAME.STUDIO });
/**
 * Urutan level tempat tiap menu game pertama kali dipakai tugas. Siswa yang pernah berada di level dengan urutan LEBIH TINGGI
 * dari angka ini (mis. masuk langsung di Level 2 atau 3) mendapat menu itu terbuka walau tugas jenis itu tidak muncul di levelnya.
 */
export const MENU_GAME_LEVEL_AWAL = Object.freeze({ [MENU_GAME.LATIHAN_MOUSE]: 1, [MENU_GAME.MENGETIK]: 1, [MENU_GAME.CODING_ZIPPY]: 1, [MENU_GAME.STUDIO]: 2 });
/**
 * Jenis hasil Coding Zippy (ENUM hasil_latihan.jenis, juga kunci.jenis tugas blockly). Sengaja tidak masuk JENIS_LATIHAN:
 * hasilnya hanya boleh disimpan lewat modul blockly yang menilai program di server, bukan lewat simpanLatihan.
 */
export const JENIS_BLOCKLY = 'blockly';
/** Batas kewajaran hasil latihan yang dikirim browser (dicek ulang di server). */
export const BATAS_LATIHAN = Object.freeze({ maksWpm: 250, minDurasiMengetik: 3, maksSkorPerDetik: 5, maksPanjangTeks: 600, durasiBebasDetik: 60 });
/** Status post test (tabel post_test). */
export const STATUS_POST_TEST = Object.freeze({ BERLANGSUNG: 'berlangsung', SELESAI: 'selesai' });
/** Sumber nilai bagian post test (ENUM post_test_nilai.sumber). */
export const SUMBER_NILAI = Object.freeze({ OTOMATIS: 'otomatis', TUTOR: 'tutor' });
/** Waktu post test: interval denyut browser dan tambahan waktu maksimal per denyut (detik). */
export const WAKTU_POST_TEST = Object.freeze({ intervalDenyutDetik: 15, maksTambahDetik: 30, peringatanDetik: 300 });
/** Panjang maksimum ringkasan penilaian siswa dari tutor (post_test.ringkasan_tutor), dalam karakter. */
export const MAKS_RINGKASAN_POST_TEST = 2000;
/**
 * Nilai awal pengaturan `rubrik_bawaan` (sama dengan `rubrik_default` di seed/template-level-*.json).
 * Rubrik yang berlaku dibaca dari pengaturan (bisa diubah admin); konstanta ini hanya cadangan bila barisnya belum ada.
 */
export const RUBRIK_BAWAAN = Object.freeze([
  { kriteria: 'Tugas dikerjakan sesuai perintah', poin: 60 },
  { kriteria: 'Hasil rapi dan lengkap', poin: 25 },
  { kriteria: 'Siswa bisa menjelaskan hasilnya', poin: 15 },
]);
/** Jumlah pertemuan materi sebelum post test (dasar perhitungan kehadiran). */
export const JUMLAH_PERTEMUAN_MATERI = 12;
/** Jumlah baris per halaman pada semua daftar berpaginasi (backoffice, siswa, dan orang tua). */
export const UKURAN_HALAMAN = 10;

/** Hak akses route HTTP (dipakai routeHandler) dan Server Action. */
export const AKSES = Object.freeze({
  PUBLIK: 'publik',
  PENGGUNA: 'pengguna',
  ADMIN: 'admin',
  SISWA: 'siswa',
  ORTU: 'ortu',
  SISWA_ATAU_ORTU: 'siswa_atau_ortu',
  // pengelola, siswa, atau orang tua yang login (mis. berkas karya); kepemilikan diperiksa usecase
  LOGIN: 'login',
});

/** Jenis karya (ENUM karya.jenis). */
export const JENIS_KARYA = Object.freeze({ TAUTAN: 'tautan', BERKAS: 'berkas' });
/** Aturan karya: panjang teks, ukuran berkas, ukuran halaman galeri. */
export const ATURAN_KARYA = Object.freeze({ maksJudul: 200, maksDeskripsi: 1000, maksUrl: 500, maksUkuran: 3 * 1024 * 1024, perHalaman: UKURAN_HALAMAN });
/** Ekstensi simpan berkas karya per tipe MIME yang dideteksi dari isi berkas (tanpa SVG). */
export const MIME_KARYA = Object.freeze({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' });
/** Jenis ekspor CSV (segmen terakhir /api/v1/ekspor/<jenis>) dan batas baris. */
export const JENIS_EKSPOR = Object.freeze(['siswa', 'kehadiran', 'post-test', 'pembayaran']);
export const MAKS_BARIS_EKSPOR = 50000;

/** Alfabet kode akses: tanpa O, I, 0, 1 agar tidak tertukar saat dibaca anak. */
export const ALFABET_KODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Panjang kode bawaan (pengaturan panjang_kode_akses). */
export const PANJANG_KODE_BAWAAN = 8;

/** Kunci pengaturan yang dikenal (tabel pengaturan). */
export const KUNCI_PENGATURAN = Object.freeze({
  NAMA_PELATIHAN: 'nama_pelatihan',
  NAMA_PERUSAHAAN: 'nama_perusahaan',
  LOGO_PATH: 'logo_path',
  LOGO_IKON: 'logo_ikon',
  LOGO_PERSEGI_TEKS: 'logo_persegi_teks',
  LOGO_SERTIFIKAT: 'logo_sertifikat',
  BATAS_TIDAK_AKTIF_MENIT: 'batas_tidak_aktif_menit',
  NILAI_LULUS_TOTAL: 'nilai_lulus_total',
  NILAI_LULUS_BAGIAN: 'nilai_lulus_bagian',
  KEHADIRAN_MIN_POST_TEST: 'kehadiran_min_post_test',
  DURASI_POST_TEST_MENIT: 'durasi_post_test_menit',
  PANJANG_KODE_AKSES: 'panjang_kode_akses',
  JUMLAH_TUGAS_PER_SESI: 'jumlah_tugas_per_sesi',
  RUBRIK_BAWAAN: 'rubrik_bawaan',
  PENANDATANGAN_NAMA: 'penandatangan_nama',
  PENANDATANGAN_JABATAN: 'penandatangan_jabatan',
  TANDA_TANGAN_PATH: 'tanda_tangan_path',
});
/** Batas isi rubrik bawaan di halaman Pengaturan: jumlah kriteria, panjang teks, dan total poin. */
export const BATAS_RUBRIK = Object.freeze({ maksKriteria: 10, maksPanjang: 150, totalPoin: 100 });

/** Aksi yang dicatat ke log_aktivitas. */
export const AKSI_LOG = Object.freeze({
  UBAH_PENGATURAN: 'ubah_pengaturan',
  UBAH_LOGO: 'ubah_logo',
  KEMBALIKAN_LOGO: 'kembalikan_logo',
  UBAH_TANDA_TANGAN: 'ubah_tanda_tangan',
  HAPUS_TANDA_TANGAN: 'hapus_tanda_tangan',
  TAMBAH_PENGGUNA: 'tambah_pengguna',
  UBAH_PENGGUNA: 'ubah_pengguna',
  AKTIFKAN_PENGGUNA: 'aktifkan_pengguna',
  NONAKTIFKAN_PENGGUNA: 'nonaktifkan_pengguna',
  RESET_PASSWORD: 'reset_password',
  UBAH_PASSWORD_SENDIRI: 'ubah_password_sendiri',
  UBAH_LEVEL: 'ubah_level',
  UBAH_PERTEMUAN: 'ubah_pertemuan',
  UBAH_BAGIAN_POST_TEST: 'ubah_bagian_post_test',
  TAMBAH_TEMPLATE: 'tambah_template',
  UBAH_TEMPLATE: 'ubah_template',
  UBAH_MATERI: 'ubah_materi',
  AKTIFKAN_GAMBAR: 'aktifkan_gambar',
  NONAKTIFKAN_GAMBAR: 'nonaktifkan_gambar',
  PINDAI_GAMBAR: 'pindai_gambar',
  TAMBAH_SISWA: 'tambah_siswa',
  GANTI_KODE: 'ganti_kode',
  GANTI_LEVEL: 'ganti_level',
  AKTIFKAN_SISWA: 'aktifkan_siswa',
  NONAKTIFKAN_SISWA: 'nonaktifkan_siswa',
  HAPUS_SISWA: 'hapus_siswa',
  ABSEN_MASUK: 'absen_masuk',
  IKUT_MENANGANI: 'ikut_menangani',
  IZINKAN_PENGECUALIAN: 'izinkan_pengecualian',
  TUTUP_SESI: 'tutup_sesi',
  PULANG: 'pulang',
  UBAH_PENUNTASAN: 'ubah_penuntasan',
  UBAH_STATUS_TUGAS: 'ubah_status_tugas',
  GANTI_TUGAS: 'ganti_tugas',
  TAMBAH_PEMBAYARAN: 'tambah_pembayaran',
  HAPUS_PEMBAYARAN: 'hapus_pembayaran',
  MULAI_POST_TEST: 'mulai_post_test',
  KUMPUL_POST_TEST: 'kumpul_post_test',
  FINALISASI_POST_TEST: 'finalisasi_post_test',
  NILAI_POST_TEST: 'nilai_post_test',
  NILAI_BUTIR_POST_TEST: 'nilai_butir_post_test',
  UBAH_RINGKASAN_POST_TEST: 'ubah_ringkasan_post_test',
  BUKA_TES_ULANG: 'buka_tes_ulang',
  BANK_SOAL_KURANG: 'bank_soal_kurang',
  TERBIT_SERTIFIKAT: 'terbit_sertifikat',
  GAGAL_TERBIT_SERTIFIKAT: 'gagal_terbit_sertifikat',
  BATAL_SERTIFIKAT: 'batal_sertifikat',
  TERBIT_ULANG_SERTIFIKAT: 'terbit_ulang_sertifikat',
  TAMBAH_KARYA: 'tambah_karya',
  UBAH_KARYA: 'ubah_karya',
  HAPUS_KARYA: 'hapus_karya',
  EKSPOR: 'ekspor',
});

/** Status sertifikat (ENUM sertifikat.status). */
export const STATUS_SERTIFIKAT = Object.freeze({ TERBIT: 'terbit', DIBATALKAN: 'dibatalkan' });
export const DAFTAR_STATUS_SERTIFIKAT = Object.values(STATUS_SERTIFIKAT);
/** Aturan sertifikat: awalan nomor, panjang token verifikasi, batas ulang bila UNIQUE bentrok, panjang teks. */
export const ATURAN_SERTIFIKAT = Object.freeze({ awalanNomor: 'DPL', panjangToken: 16, maksUlang: 5, maksAlasan: 255, maksPenandatangan: 100 });

/** Tipe MIME logo yang boleh diunggah beserta ekstensi simpannya (tanpa SVG). */
export const MIME_LOGO = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
});
/** Ukuran maksimum logo (byte). */
export const MAKS_UKURAN_LOGO = 1024 * 1024;
/**
 * Slot logo di Pengaturan: kunci pengaturan penyimpan path unggahan, berkas bawaan di public/aset/logo (dipakai bila slot kosong;
 * null = ikut logo utama), bawaanGelap (versi tema gelap berkas bawaan, dibuat scripts/buat-logo-gelap.mjs; hanya dipakai bila
 * slot tidak memakai unggahan admin), dan tanpaWebp (pdfkit tidak bisa membaca WebP, jadi slot sertifikat hanya PNG atau JPEG).
 * Slot utama memakai kunci logo_path yang sudah ada, jadi logo yang sudah diunggah admin tetap menjadi Logo utama.
 */
export const SLOT_LOGO = Object.freeze({
  utama: Object.freeze({ kunci: KUNCI_PENGATURAN.LOGO_PATH, bawaan: 'logo-landscape.png', bawaanGelap: 'logo-landscape-gelap.png', tanpaWebp: false }),
  ikon: Object.freeze({ kunci: KUNCI_PENGATURAN.LOGO_IKON, bawaan: 'logo-persegi.png', bawaanGelap: 'logo-persegi-gelap.png', tanpaWebp: false }),
  persegiTeks: Object.freeze({ kunci: KUNCI_PENGATURAN.LOGO_PERSEGI_TEKS, bawaan: 'logo-persegi-teks.png', bawaanGelap: 'logo-persegi-teks-gelap.png', tanpaWebp: false }),
  sertifikat: Object.freeze({ kunci: KUNCI_PENGATURAN.LOGO_SERTIFIKAT, bawaan: null, bawaanGelap: null, tanpaWebp: true }),
});
/** Nama slot logo yang sah (urutan tampil di Pengaturan). */
export const DAFTAR_SLOT_LOGO = Object.freeze(Object.keys(SLOT_LOGO));
/** Ukuran maksimum gambar tanda tangan sertifikat (byte); hanya PNG (latar transparan). */
export const MAKS_UKURAN_TANDA_TANGAN = 500 * 1024;

/** Suasana maskot Zippy (nama berkas public/aset/maskot/zippy-<suasana>.png). */
export const SUASANA_MASKOT = Object.freeze(['sapa', 'menunjuk', 'semangat', 'berpikir', 'merayakan', 'menyemangati', 'tidur', 'terbang', 'wajah']);
