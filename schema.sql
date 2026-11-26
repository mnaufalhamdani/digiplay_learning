-- =====================================================================
-- DigiPlay Learning: skema database (MySQL 8+)
-- Hierarki utama: level -> pertemuan -> template; siswa -> siswa_level -> sesi -> tugas_siswa
-- Konvensi (mengikuti DK Docs): snake_case, nama tabel singular, created_at/updated_at.
-- ID: semua primary key (dan foreign key-nya) bertipe BIGINT UNSIGNED tanpa AUTO_INCREMENT.
-- ID dibuat aplikasi (idGen: <timestamp ms><SERVER_ID><counter>, 17-18 digit)
-- dan HARUS diperlakukan sebagai string di JavaScript. Pool mysql2 memakai bigNumberStrings.
-- Kolom *_kunci (generated, STORED) dipakai agar UNIQUE hanya berlaku pada baris "aktif":
-- MySQL menganggap NULL selalu berbeda, jadi baris tidak aktif bernilai NULL dan bebas dobel.
-- Jangan mengisi kolom *_kunci saat INSERT.
-- Level, pertemuan, dan gambar di-seed lewat skrip (ID dibuat aplikasi), bukan di file ini.
-- Seed gambar membaca docs/aset/prompt-gambar.csv (kode huruf kecil) dan mengisi flag punya_* dengan memindai
-- folder public/aset/gambar/<kode>/ (outline, berwarna, puzzle, mewarnai).
-- Jumlah tabel: 31.
--
-- Fase pengerjaan (lihat project-context.md):
--   A fondasi            : pengaturan, pengguna, percobaan_login, log_aktivitas
--   B data master        : siswa, kode_akses, level, pertemuan, bagian_post_test, template, siswa_level, gambar
--   C sesi dan absensi   : sesi, sesi_tutor, login_perangkat, pembayaran, tugas_siswa
--   D latihan dan tes    : pelajaran_mengetik, bank_teks_mengetik, hasil_mengetik, hasil_latihan, post_test, post_test_nilai
--   E sertifikat         : sertifikat
--   F galeri             : karya
--   G materi pertemuan   : materi, materi_baca
--   H coding zippy       : labirin_blockly (hasilnya disimpan di hasil_latihan, jenis 'blockly')
--   I studio zippy       : proyek_coding, proyek_kiriman, kostum_unggahan (proyek siswa Level 2/3, salinannya yang dikirim ke tugas, dan kostum unggahan Level 3)
--
-- Catatan penghapusan: MySQL melarang ON DELETE CASCADE pada foreign key yang kolomnya menjadi
-- dasar kolom generated (*_kunci). Karena itu FK siswa_id/siswa_level_id pada kode_akses, siswa_level,
-- sesi, login_perangkat, post_test, dan sertifikat memakai RESTRICT. Menghapus siswa (hanya admin)
-- dilakukan oleh usecase dalam satu transaksi dengan urutan:
--   sertifikat -> post_test (menghapus post_test_nilai dan tugas post test) -> login_perangkat
--   -> sesi (menghapus tugas_siswa dan sesi_tutor) -> siswa_level -> kode_akses -> siswa
-- (hasil_mengetik, hasil_latihan, pembayaran, karya, dan materi_baca ikut terhapus otomatis lewat CASCADE dari siswa;
-- materi_baca tidak punya kolom generated, jadi CASCADE diizinkan dan tidak perlu langkah sendiri di urutan di atas;
-- proyek_coding ikut terhapus lewat CASCADE dari siswa, dan proyek_kiriman lewat CASCADE dari tugas_siswa yang terhapus bersama sesi/post test;
-- kostum_unggahan ikut terhapus lewat CASCADE dari siswa dan berkasnya dihapus aplikasi setelah commit, seperti berkas karya).
--
-- Yang SENGAJA belum ada (tahap lanjut): pengumuman, jadwal, badge/poin, ekspor.
-- Login admin/tutor memakai cookie bertanda tangan (tanpa tabel sesi); login siswa memakai
-- tabel login_perangkat karena butuh aturan satu kode satu perangkat.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS digiplay_learning
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digiplay_learning;

-- ---------------------------------------------------------------------
-- 1. FONDASI (fase A)
-- ---------------------------------------------------------------------

-- Pengaturan admin (key-value). Nilai selalu teks; aplikasi yang mengubah tipenya.
CREATE TABLE pengaturan (
  kunci       VARCHAR(100) NOT NULL,
  nilai       TEXT         NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (kunci)
) ENGINE=InnoDB;

INSERT IGNORE INTO pengaturan (kunci, nilai) VALUES
  ('nama_pelatihan',            'DigiPlay Learning'),
  ('nama_perusahaan',           ''),
  ('logo_path',                 ''),
  ('batas_tidak_aktif_menit',   '5'),   -- login perangkat siswa berakhir bila tidak aktif selama ini
  ('nilai_lulus_total',         '70'),  -- nilai total minimal post test
  ('nilai_lulus_bagian',        '50'),  -- nilai minimal tiap bagian post test
  ('kehadiran_min_post_test',   '9'),   -- jumlah pertemuan (dari 12) agar boleh ikut post test
  ('durasi_post_test_menit',    '45'),  -- durasi post test (dipakai sebagai post_test.durasi_detik), semua level
  ('panjang_kode_akses',        '8'),   -- panjang kode unik siswa dan orang tua
  ('jumlah_tugas_per_sesi',     '6'),   -- jumlah tugas yang digenerate saat absen masuk (pertemuan 1-12)
  -- rubrik bawaan tugas dicek tutor bila template tidak punya kunci.rubrik (JSON, total poin 100, bisa diubah admin)
  ('rubrik_bawaan',             '[{"kriteria":"Tugas dikerjakan sesuai perintah","poin":60},{"kriteria":"Hasil rapi dan lengkap","poin":25},{"kriteria":"Siswa bisa menjelaskan hasilnya","poin":15}]'),
  -- penandatangan sertifikat PDF (opsional); kosong = hanya garis tanda tangan dan nama pelatihan
  ('penandatangan_nama',        ''),
  ('penandatangan_jabatan',     '');

-- Akun admin dan tutor. Akun tidak dihapus, cukup dinonaktifkan (riwayat sesi tetap utuh).
CREATE TABLE pengguna (
  id                  BIGINT UNSIGNED NOT NULL,
  nama                VARCHAR(150) NOT NULL,
  email               VARCHAR(190) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  peran               ENUM('admin','tutor') NOT NULL DEFAULT 'tutor',
  aktif               TINYINT(1)   NOT NULL DEFAULT 1,
  terakhir_login_at   DATETIME     NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pengguna_email (email)
) ENGINE=InnoDB;

-- Catatan percobaan login untuk pembatasan (rate limit). Kode yang dicoba sengaja TIDAK disimpan.
CREATE TABLE percobaan_login (
  id          BIGINT UNSIGNED NOT NULL,
  area        ENUM('siswa','ortu','backoffice') NOT NULL,
  ip          VARCHAR(45)  NOT NULL,
  berhasil    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_percobaan_ip_waktu (ip, created_at)
) ENGINE=InnoDB;

-- Jejak koreksi dan aksi penting (ubah status penuntasan, batal sertifikat, hapus siswa, dst).
CREATE TABLE log_aktivitas (
  id           BIGINT UNSIGNED NOT NULL,
  pengguna_id  BIGINT UNSIGNED NULL,
  aksi         VARCHAR(60)  NOT NULL,                  -- contoh: ubah_penuntasan, batal_sertifikat
  entitas      VARCHAR(40)  NOT NULL,                  -- nama tabel yang terkena
  entitas_id   BIGINT UNSIGNED NULL,
  detail       JSON         NULL,                      -- nilai sebelum dan sesudah
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_log_entitas (entitas, entitas_id),
  KEY idx_log_waktu (created_at),
  CONSTRAINT fk_log_pengguna FOREIGN KEY (pengguna_id) REFERENCES pengguna (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. DATA MASTER (fase B)
-- ---------------------------------------------------------------------

-- Siswa. Tanpa username/password: akses lewat kode_akses.
CREATE TABLE siswa (
  id             BIGINT UNSIGNED NOT NULL,
  nama           VARCHAR(150) NOT NULL,
  status         ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  tanggal_daftar DATE         NOT NULL,
  dibuat_oleh    BIGINT UNSIGNED NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_siswa_nama (nama),
  KEY idx_siswa_dibuat (created_at),                   -- Fase F: urutan daftar siswa (terbaru dahulu)
  CONSTRAINT fk_siswa_dibuat_oleh FOREIGN KEY (dibuat_oleh) REFERENCES pengguna (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Kode unik siswa dan orang tua/viewer. Satu tabel agar kode tidak pernah sama antar keduanya.
-- Kode lama tidak dihapus saat diganti: aktif = 0. Hanya satu kode aktif per (siswa, jenis).
-- Kode disimpan apa adanya karena admin/tutor perlu menampilkannya untuk dibagikan.
CREATE TABLE kode_akses (
  id          BIGINT UNSIGNED NOT NULL,
  siswa_id    BIGINT UNSIGNED NOT NULL,
  jenis       ENUM('siswa','ortu') NOT NULL,
  kode        CHAR(8)      NOT NULL,                   -- 8 karakter acak tanpa O/0 I/1/l
  aktif       TINYINT(1)   NOT NULL DEFAULT 1,
  aktif_kunci VARCHAR(40)  GENERATED ALWAYS AS (IF(aktif = 1, CONCAT(siswa_id, '-', jenis), NULL)) STORED,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kode_akses_kode (kode),
  UNIQUE KEY uq_kode_akses_aktif (aktif_kunci),
  CONSTRAINT fk_kode_akses_siswa FOREIGN KEY (siswa_id) REFERENCES siswa (id)
) ENGINE=InnoDB;

-- Level (Pemula, Dasar, Lanjutan). Tanpa patokan usia.
CREATE TABLE level (
  id          BIGINT UNSIGNED NOT NULL,
  kode        VARCHAR(30)  NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  urutan      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  deskripsi   TEXT         NULL,
  aktif       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_level_kode (kode)
) ENGINE=InnoDB;

-- 13 pertemuan per level: nomor 1-12 materi, nomor 13 post test.
CREATE TABLE pertemuan (
  id          BIGINT UNSIGNED NOT NULL,
  level_id    BIGINT UNSIGNED NOT NULL,
  nomor       TINYINT UNSIGNED NOT NULL,
  judul       VARCHAR(200) NOT NULL,
  jenis       ENUM('materi','post_test') NOT NULL DEFAULT 'materi',
  tujuan      TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pertemuan_level_nomor (level_id, nomor),
  CONSTRAINT fk_pertemuan_level FOREIGN KEY (level_id) REFERENCES level (id)
) ENGINE=InnoDB;

-- Bagian post test (A, B, C, ...) per level beserta bobotnya. Total bobot satu level = 100,
-- total jumlah_soal satu level = 15 butir (durasi 45 menit, lihat pengaturan durasi_post_test_menit).
-- sumber: tes_mengetik = nilai dari hasil tes mengetik; soal = soal acak dari template;
--         praktik_tutor = nilai diisi tutor memakai rubrik.
CREATE TABLE bagian_post_test (
  id           BIGINT UNSIGNED NOT NULL,
  level_id     BIGINT UNSIGNED NOT NULL,
  kode         CHAR(1)      NOT NULL,
  nama         VARCHAR(100) NOT NULL,
  bobot        DECIMAL(5,2) NOT NULL,
  sumber       ENUM('tes_mengetik','soal','praktik_tutor') NOT NULL,
  jumlah_soal  SMALLINT UNSIGNED NOT NULL DEFAULT 1,   -- jumlah butir yang diambil acak dari bank (A=1, B=10, C=2, D=2; total 15 per level)
  target_wpm   SMALLINT UNSIGNED NULL,                 -- khusus 'tes_mengetik': WPM untuk nilai 100
  urutan       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bagian_level_kode (level_id, kode),
  CONSTRAINT fk_bagian_level FOREIGN KEY (level_id) REFERENCES level (id)
) ENGINE=InnoDB;

-- Template latihan dan soal dengan parameter acak (tanpa AI). Satu tabel untuk dua kegunaan:
--   latihan pertemuan 1-12 : bagian_id NULL
--   soal post test         : pertemuan_id = pertemuan 13 level itu, bagian_id terisi
-- penilaian: otomatis_jawaban = jawaban siswa dicocokkan dengan kunci; dicek_tutor = tutor menandai.
-- kunci (JSON) contoh: {"ekspresi":"a+b+c"} atau {"benar":"b"}. Dihitung ulang dari parameter_hasil.
CREATE TABLE template (
  id            BIGINT UNSIGNED NOT NULL,
  pertemuan_id  BIGINT UNSIGNED NOT NULL,
  bagian_id     BIGINT UNSIGNED NULL,
  kode          VARCHAR(40)  NOT NULL,                 -- contoh: L2-P8-SUM-01
  tipe          ENUM('mengetik','pilihan_ganda','excel','word','powerpoint','paint','scratch','coding','game_mouse','puzzle','blockly','coding_proyek','lainnya') NOT NULL,
  penilaian     ENUM('otomatis_jawaban','dicek_tutor') NOT NULL,
  kesulitan     TINYINT UNSIGNED NOT NULL DEFAULT 1,   -- dipakai saat Ganti tugas (mis. pilih yang lebih mudah)
  teks          TEXT         NOT NULL,                 -- memuat penanda {nama_parameter}
  parameter     JSON         NULL,                     -- daftar nilai atau rentang acak per penanda
  opsi          JSON         NULL,                     -- pilihan jawaban (khusus pilihan_ganda)
  kunci         JSON         NULL,
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_template_kode (kode),
  KEY idx_template_pertemuan (pertemuan_id, aktif),
  KEY idx_template_bagian (bagian_id),
  CONSTRAINT fk_template_pertemuan FOREIGN KEY (pertemuan_id) REFERENCES pertemuan (id),
  CONSTRAINT fk_template_bagian    FOREIGN KEY (bagian_id)    REFERENCES bagian_post_test (id)
) ENGINE=InnoDB;

-- Keikutsertaan siswa pada sebuah level. Hanya satu level berstatus 'berjalan' per siswa.
-- pengecualian_kehadiran = 1: tutor mengizinkan ikut post test walau kehadiran kurang.
CREATE TABLE siswa_level (
  id                      BIGINT UNSIGNED NOT NULL,
  siswa_id                BIGINT UNSIGNED NOT NULL,
  level_id                BIGINT UNSIGNED NOT NULL,
  status                  ENUM('berjalan','lulus','berhenti') NOT NULL DEFAULT 'berjalan',
  pengecualian_kehadiran  TINYINT(1)   NOT NULL DEFAULT 0,
  mulai_at                DATE         NOT NULL,
  selesai_at              DATE         NULL,
  aktif_kunci             BIGINT UNSIGNED GENERATED ALWAYS AS (IF(status = 'berjalan', siswa_id, NULL)) STORED,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_siswa_level_aktif (aktif_kunci),
  KEY idx_siswa_level_siswa (siswa_id, level_id),
  CONSTRAINT fk_siswa_level_siswa FOREIGN KEY (siswa_id) REFERENCES siswa (id),
  CONSTRAINT fk_siswa_level_level FOREIGN KEY (level_id) REFERENCES level (id)
) ENGINE=InnoDB;

-- Bank subjek gambar. File ada di public/aset/gambar/<kode>/{outline,berwarna,puzzle,mewarnai}.png.
-- Flag punya_* menandai file yang sudah tersedia, supaya aplikasi hanya memilih subjek yang
-- lengkap untuk jenis tugasnya (bank boleh diisi bertahap). Parameter template {dari: gambar}
-- memilih baris dari tabel ini; kode subjek yang terpilih disimpan di tugas_siswa.parameter_hasil.
CREATE TABLE gambar (
  id              BIGINT UNSIGNED NOT NULL,
  kode            VARCHAR(10)  NOT NULL,               -- contoh: hwn-01 (huruf kecil, sama dengan nama folder)
  kategori        ENUM('hewan','tanaman','kendaraan','benda_lain','benda_olahraga') NOT NULL,
  nama            VARCHAR(100) NOT NULL,
  nama_en         VARCHAR(100) NULL,
  punya_mewarnai  TINYINT(1)   NOT NULL DEFAULT 0,
  punya_berwarna  TINYINT(1)   NOT NULL DEFAULT 0,
  punya_puzzle    TINYINT(1)   NOT NULL DEFAULT 0,
  aktif           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gambar_kode (kode),
  KEY idx_gambar_kategori (kategori, aktif)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. SESI DAN ABSENSI (fase C)
-- ---------------------------------------------------------------------

-- Satu sesi = satu kehadiran siswa pada satu pertemuan (absen masuk sampai pulang).
-- Hanya satu sesi 'berlangsung' per siswa. "Hadir" dihitung dari sesi pada pertemuan nomor 1-12.
-- Status Diajarkan tidak disimpan: otomatis ada selama sesi ada.
-- Penuntasan akhir = COALESCE(penuntasan_tutor, penuntasan_otomatis); sumbernya terbaca dari kolom mana yang terisi.
CREATE TABLE sesi (
  id                       BIGINT UNSIGNED NOT NULL,
  siswa_id                 BIGINT UNSIGNED NOT NULL,
  siswa_level_id           BIGINT UNSIGNED NOT NULL,
  pertemuan_id             BIGINT UNSIGNED NOT NULL,
  tanggal                  DATE         NOT NULL,
  jam_masuk                DATETIME     NOT NULL,
  jam_pulang               DATETIME     NULL,
  status                   ENUM('berlangsung','selesai') NOT NULL DEFAULT 'berlangsung',
  penuntasan_otomatis      ENUM('tuntas','tuntas_sebagian','tidak_tuntas') NULL,
  penuntasan_tutor         ENUM('tuntas','tuntas_sebagian','tidak_tuntas') NULL,
  penuntasan_diubah_oleh   BIGINT UNSIGNED NULL,
  aktif_kunci              BIGINT UNSIGNED GENERATED ALWAYS AS (IF(status = 'berlangsung', siswa_id, NULL)) STORED,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sesi_aktif (aktif_kunci),
  KEY idx_sesi_siswa_level (siswa_level_id, pertemuan_id),
  KEY idx_sesi_tanggal (tanggal),
  KEY idx_sesi_status (status, jam_masuk),             -- Fase F: sesi berlangsung dan lencana menu Absensi
  CONSTRAINT fk_sesi_siswa        FOREIGN KEY (siswa_id)               REFERENCES siswa (id),
  CONSTRAINT fk_sesi_siswa_level  FOREIGN KEY (siswa_level_id)         REFERENCES siswa_level (id) ON DELETE CASCADE,
  CONSTRAINT fk_sesi_pertemuan    FOREIGN KEY (pertemuan_id)           REFERENCES pertemuan (id),
  CONSTRAINT fk_sesi_diubah_oleh  FOREIGN KEY (penuntasan_diubah_oleh) REFERENCES pengguna (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tutor yang hadir pada sebuah sesi (bisa lebih dari satu), masing-masing dengan catatannya.
CREATE TABLE sesi_tutor (
  id           BIGINT UNSIGNED NOT NULL,
  sesi_id      BIGINT UNSIGNED NOT NULL,
  pengguna_id  BIGINT UNSIGNED NOT NULL,
  catatan      TEXT         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sesi_tutor (sesi_id, pengguna_id),
  CONSTRAINT fk_sesi_tutor_sesi     FOREIGN KEY (sesi_id)     REFERENCES sesi (id) ON DELETE CASCADE,
  CONSTRAINT fk_sesi_tutor_pengguna FOREIGN KEY (pengguna_id) REFERENCES pengguna (id)
) ENGINE=InnoDB;

-- Login siswa pada sebuah PC. Hanya satu login aktif per siswa (kode tidak bisa dipakai di dua PC).
-- berakhir_at terisi saat: ganti device, tidak aktif melewati batas, pulang, ditutup tutor, atau logout.
CREATE TABLE login_perangkat (
  id                BIGINT UNSIGNED NOT NULL,
  siswa_id          BIGINT UNSIGNED NOT NULL,
  token_hash        CHAR(64)     NOT NULL,             -- hash token cookie, token asli tidak disimpan
  perangkat         VARCHAR(255) NULL,                 -- user agent ringkas
  ip                VARCHAR(45)  NULL,
  mulai_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  terakhir_aktif_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  berakhir_at       DATETIME     NULL,
  alasan_berakhir   ENUM('ganti_device','tidak_aktif','pulang','ditutup_tutor','logout') NULL,
  aktif_kunci       BIGINT UNSIGNED GENERATED ALWAYS AS (IF(berakhir_at IS NULL, siswa_id, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_login_perangkat_aktif (aktif_kunci),
  UNIQUE KEY uq_login_perangkat_token (token_hash),
  KEY idx_login_perangkat_siswa (siswa_id, mulai_at),
  CONSTRAINT fk_login_perangkat_siswa FOREIGN KEY (siswa_id) REFERENCES siswa (id)
) ENGINE=InnoDB;

-- Catatan pembayaran manual, dicatat tutor saat absen masuk atau saat menulis catatan.
-- Tampil di halaman orang tua. Bentuknya (per sesi/per bulan, jumlah) masih bisa disesuaikan.
CREATE TABLE pembayaran (
  id           BIGINT UNSIGNED NOT NULL,
  siswa_id     BIGINT UNSIGNED NOT NULL,
  sesi_id      BIGINT UNSIGNED NULL,
  tanggal      DATE         NOT NULL,
  jumlah       DECIMAL(12,0) NULL,
  keterangan   VARCHAR(255) NULL,
  dicatat_oleh BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pembayaran_siswa (siswa_id, tanggal),
  CONSTRAINT fk_pembayaran_siswa   FOREIGN KEY (siswa_id)     REFERENCES siswa (id) ON DELETE CASCADE,
  CONSTRAINT fk_pembayaran_sesi    FOREIGN KEY (sesi_id)      REFERENCES sesi (id) ON DELETE SET NULL,
  CONSTRAINT fk_pembayaran_pencatat FOREIGN KEY (dicatat_oleh) REFERENCES pengguna (id)
) ENGINE=InnoDB;

-- Tugas yang digenerate untuk siswa saat absen masuk (atau saat post test dimulai).
-- soal_teks dan parameter_hasil menyimpan hasil render template agar soal siswa tetap sama
-- walau template diubah. 'diganti' = tugas diganti lewat Ganti tugas (baris baru menunjuk lewat menggantikan_id).
-- 'dilewati' tidak memblokir pulang dan tidak mengurangi nilai otomatis.
CREATE TABLE tugas_siswa (
  id               BIGINT UNSIGNED NOT NULL,
  sesi_id          BIGINT UNSIGNED NOT NULL,
  post_test_id     BIGINT UNSIGNED NULL,
  template_id      BIGINT UNSIGNED NOT NULL,
  menggantikan_id  BIGINT UNSIGNED NULL,
  soal_teks        TEXT         NOT NULL,
  parameter_hasil  JSON         NULL,
  status           ENUM('belum','selesai','dilewati','diganti') NOT NULL DEFAULT 'belum',
  jawaban          TEXT         NULL,
  benar            TINYINT(1)   NULL,                  -- NULL = belum/tidak dinilai otomatis
  dinilai_oleh     BIGINT UNSIGNED NULL,               -- tutor yang menandai tugas dicek_tutor
  selesai_at       DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tugas_sesi (sesi_id, status),
  KEY idx_tugas_post_test (post_test_id),
  CONSTRAINT fk_tugas_sesi        FOREIGN KEY (sesi_id)          REFERENCES sesi (id) ON DELETE CASCADE,
  CONSTRAINT fk_tugas_template    FOREIGN KEY (template_id)      REFERENCES template (id),
  CONSTRAINT fk_tugas_menggantikan FOREIGN KEY (menggantikan_id) REFERENCES tugas_siswa (id) ON DELETE SET NULL,
  CONSTRAINT fk_tugas_dinilai_oleh FOREIGN KEY (dinilai_oleh)    REFERENCES pengguna (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. LATIHAN DAN TES (fase D)
-- ---------------------------------------------------------------------

-- Pelajaran mengetik bertahap (baris keyboard, angka, dst). Dikunci sampai target tercapai.
CREATE TABLE pelajaran_mengetik (
  id              BIGINT UNSIGNED NOT NULL,
  kode            VARCHAR(40)  NOT NULL,
  nama            VARCHAR(150) NOT NULL,
  urutan          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  tombol_fokus    VARCHAR(60)  NULL,                   -- tombol yang dilatih, contoh: asdfjkl;
  teks_latihan    TEXT         NOT NULL,
  target_wpm      SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  target_akurasi  DECIMAL(5,2) NOT NULL DEFAULT 90.00,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pelajaran_mengetik_kode (kode)
) ENGINE=InnoDB;

-- Bank teks untuk tes dan latihan mengetik (dipilih acak). level_id NULL = berlaku untuk semua level.
CREATE TABLE bank_teks_mengetik (
  id          BIGINT UNSIGNED NOT NULL,
  level_id    BIGINT UNSIGNED NULL,
  teks        TEXT         NOT NULL,
  jumlah_kata SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  kesulitan   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  aktif       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bank_teks_level (level_id, aktif),
  CONSTRAINT fk_bank_teks_level FOREIGN KEY (level_id) REFERENCES level (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Hasil setiap latihan/tes mengetik. detail_tombol (JSON) menyimpan jumlah ketik dan salah per tombol
-- untuk heatmap dan latihan adaptif.
CREATE TABLE hasil_mengetik (
  id             BIGINT UNSIGNED NOT NULL,
  siswa_id       BIGINT UNSIGNED NOT NULL,
  sesi_id        BIGINT UNSIGNED NULL,
  pelajaran_id   BIGINT UNSIGNED NULL,
  mode           ENUM('pelajaran','latihan','game','tes') NOT NULL,
  wpm            DECIMAL(6,2) NOT NULL,
  akurasi        DECIMAL(5,2) NOT NULL,
  konsistensi    DECIMAL(5,2) NULL,
  durasi_detik   SMALLINT UNSIGNED NOT NULL,
  detail_tombol  JSON         NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hasil_mengetik_siswa (siswa_id, created_at),
  CONSTRAINT fk_hasil_mengetik_siswa     FOREIGN KEY (siswa_id)     REFERENCES siswa (id) ON DELETE CASCADE,
  CONSTRAINT fk_hasil_mengetik_sesi      FOREIGN KEY (sesi_id)      REFERENCES sesi (id) ON DELETE SET NULL,
  CONSTRAINT fk_hasil_mengetik_pelajaran FOREIGN KEY (pelajaran_id) REFERENCES pelajaran_mengetik (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Labirin latihan Coding Zippy (Blockly buatan sendiri, Level 1). Di-seed dari seed/labirin-blockly.json (upsert per kode).
-- grid (JSON): daftar string baris, '.' jalan dan '#' dinding; koordinat x ke kanan, y ke bawah, mulai dari 0.
-- mulai {x, y, arah}, bintang {x, y}; batas_blok menghitung semua blok termasuk ulangi dan isinya.
-- blok_tersedia: tipe blok yang tampil di toolbox (lihat src/modules/shared/blockly/daftarBlok.js).
-- contoh_solusi hanya untuk uji dan tidak pernah dikirim ke siswa.
CREATE TABLE labirin_blockly (
  id             BIGINT UNSIGNED NOT NULL,
  kode           VARCHAR(40)  NOT NULL,
  nama           VARCHAR(100) NOT NULL,                -- dicocokkan dengan kunci.labirin tugas bertipe blockly
  urutan         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  lebar          TINYINT UNSIGNED NOT NULL,
  tinggi         TINYINT UNSIGNED NOT NULL,
  grid           JSON         NOT NULL,
  mulai          JSON         NOT NULL,
  bintang        JSON         NOT NULL,
  batas_blok     SMALLINT UNSIGNED NOT NULL,
  blok_tersedia  JSON         NOT NULL,
  petunjuk       TEXT         NULL,
  contoh_solusi  JSON         NULL,
  aktif          TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_labirin_blockly_kode (kode),
  UNIQUE KEY uq_labirin_blockly_nama (nama)
) ENGINE=InnoDB;
-- Hasil game latihan mouse, puzzle, dan Coding Zippy yang dikerjakan di web. Dipakai untuk menilai tugas
-- bertipe game_mouse/puzzle/blockly secara otomatis (kunci.jenis cocok dengan jenis di sini).
-- skor = jumlah poin pada game mouse; keping dan gambar_id dipakai untuk puzzle.
-- blockly: hanya percobaan yang berhasil disimpan (selesai = 1) dan sudah dinilai ulang di server; labirin_id menunjuk
-- labirin, detail berisi {"jumlahBlok":n,"jumlahLangkah":n}.
CREATE TABLE hasil_latihan (
  id            BIGINT UNSIGNED NOT NULL,
  siswa_id      BIGINT UNSIGNED NOT NULL,
  sesi_id       BIGINT UNSIGNED NULL,
  jenis         ENUM('mouse_klik','mouse_klik_ganda','mouse_drag','mouse_klik_kanan','mouse_scroll','puzzle','blockly') NOT NULL,
  gambar_id     BIGINT UNSIGNED NULL,
  labirin_id    BIGINT UNSIGNED NULL,
  keping        TINYINT UNSIGNED NULL,
  skor          INT UNSIGNED NULL,
  selesai       TINYINT(1)   NOT NULL DEFAULT 0,
  durasi_detik  SMALLINT UNSIGNED NOT NULL,
  detail        JSON         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hasil_latihan_siswa (siswa_id, jenis, created_at),
  CONSTRAINT fk_hasil_latihan_siswa  FOREIGN KEY (siswa_id)  REFERENCES siswa (id) ON DELETE CASCADE,
  CONSTRAINT fk_hasil_latihan_sesi   FOREIGN KEY (sesi_id)   REFERENCES sesi (id) ON DELETE SET NULL,
  CONSTRAINT fk_hasil_latihan_gambar FOREIGN KEY (gambar_id) REFERENCES gambar (id) ON DELETE SET NULL,
  CONSTRAINT fk_hasil_latihan_labirin FOREIGN KEY (labirin_id) REFERENCES labirin_blockly (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Satu percobaan post test pada satu level. Hanya sekali dikerjakan per percobaan;
-- remedial/tes ulang dibuka tutor sebagai percobaan_ke berikutnya (dibuka_oleh terisi).
-- Waktu tes bisa dilanjutkan setelah ganti device: terpakai_detik diakumulasi, sisanya = durasi_detik - terpakai_detik.
CREATE TABLE post_test (
  id                  BIGINT UNSIGNED NOT NULL,
  siswa_level_id      BIGINT UNSIGNED NOT NULL,
  sesi_id             BIGINT UNSIGNED NOT NULL,
  percobaan_ke        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status              ENUM('berlangsung','selesai') NOT NULL DEFAULT 'berlangsung',
  durasi_detik        INT UNSIGNED NOT NULL,
  terpakai_detik      INT UNSIGNED NOT NULL DEFAULT 0,
  mulai_at            DATETIME     NOT NULL,
  terakhir_aktif_at   DATETIME     NULL,
  selesai_at          DATETIME     NULL,
  nilai_total         DECIMAL(5,2) NULL,
  lulus               TINYINT(1)   NULL,
  dibuka_oleh         BIGINT UNSIGNED NULL,
  bagian_ulang        JSON         NULL,                -- tes ulang: daftar id bagian_post_test yang diulang (teks id); NULL = semua bagian
  aktif_kunci         BIGINT UNSIGNED GENERATED ALWAYS AS (IF(status = 'berlangsung', siswa_level_id, NULL)) STORED,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_post_test_percobaan (siswa_level_id, percobaan_ke),
  UNIQUE KEY uq_post_test_aktif (aktif_kunci),
  KEY idx_post_test_status (status, nilai_total),      -- Fase F: tab dan kartu "menunggu penilaian"
  CONSTRAINT fk_post_test_siswa_level FOREIGN KEY (siswa_level_id) REFERENCES siswa_level (id),
  CONSTRAINT fk_post_test_sesi        FOREIGN KEY (sesi_id)        REFERENCES sesi (id),
  CONSTRAINT fk_post_test_dibuka_oleh FOREIGN KEY (dibuka_oleh)    REFERENCES pengguna (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tugas post test merujuk ke post_test lewat tugas_siswa.post_test_id; ikatan FK-nya ditambahkan
-- di sini karena post_test baru dibuat setelah tugas_siswa.
ALTER TABLE tugas_siswa
  ADD CONSTRAINT fk_tugas_post_test FOREIGN KEY (post_test_id) REFERENCES post_test (id) ON DELETE CASCADE;

-- Nilai per bagian pada satu post test. Nilai total dihitung dari bobot bagian_post_test.
CREATE TABLE post_test_nilai (
  id                  BIGINT UNSIGNED NOT NULL,
  post_test_id        BIGINT UNSIGNED NOT NULL,
  bagian_id           BIGINT UNSIGNED NOT NULL,
  nilai               DECIMAL(5,2) NOT NULL,
  sumber              ENUM('otomatis','tutor') NOT NULL DEFAULT 'otomatis',
  hasil_mengetik_id   BIGINT UNSIGNED NULL,            -- khusus bagian tes_mengetik
  dinilai_oleh        BIGINT UNSIGNED NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_post_test_nilai (post_test_id, bagian_id),
  CONSTRAINT fk_ptn_post_test FOREIGN KEY (post_test_id)      REFERENCES post_test (id) ON DELETE CASCADE,
  CONSTRAINT fk_ptn_bagian    FOREIGN KEY (bagian_id)         REFERENCES bagian_post_test (id),
  CONSTRAINT fk_ptn_mengetik  FOREIGN KEY (hasil_mengetik_id) REFERENCES hasil_mengetik (id) ON DELETE SET NULL,
  CONSTRAINT fk_ptn_dinilai   FOREIGN KEY (dinilai_oleh)      REFERENCES pengguna (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. SERTIFIKAT (fase E)
-- ---------------------------------------------------------------------

-- Sertifikat per level, terbit otomatis saat lulus; admin/tutor bisa membatalkan atau menerbitkan ulang.
-- Halaman verifikasi publik memakai token_verifikasi acak (bukan nomor berurutan) agar tidak bisa
-- ditelusuri satu per satu, dan hanya menampilkan data pada kolom snapshot (tanpa data sensitif).
-- Hanya satu sertifikat 'terbit' per (siswa, level); yang dibatalkan tetap tersimpan.
CREATE TABLE sertifikat (
  id                    BIGINT UNSIGNED NOT NULL,
  siswa_id              BIGINT UNSIGNED NOT NULL,
  level_id              BIGINT UNSIGNED NOT NULL,
  post_test_id          BIGINT UNSIGNED NOT NULL,
  nomor                 VARCHAR(40)  NOT NULL,
  token_verifikasi      CHAR(16)     NOT NULL,
  status                ENUM('terbit','dibatalkan') NOT NULL DEFAULT 'terbit',
  nama_siswa            VARCHAR(150) NOT NULL,         -- snapshot saat terbit
  nama_level            VARCHAR(100) NOT NULL,
  nilai_total           DECIMAL(5,2) NOT NULL,
  diterbitkan_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diterbitkan_oleh      BIGINT UNSIGNED NULL,          -- NULL = otomatis oleh sistem
  dibatalkan_at         DATETIME     NULL,
  dibatalkan_oleh       BIGINT UNSIGNED NULL,
  alasan_batal          VARCHAR(255) NULL,
  menggantikan_id       BIGINT UNSIGNED NULL,          -- terbit ulang dari sertifikat sebelumnya
  aktif_kunci           VARCHAR(40)  GENERATED ALWAYS AS (IF(status = 'terbit', CONCAT(siswa_id, '-', level_id), NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sertifikat_nomor (nomor),
  UNIQUE KEY uq_sertifikat_token (token_verifikasi),
  UNIQUE KEY uq_sertifikat_aktif (aktif_kunci),
  KEY idx_sertifikat_siswa (siswa_id),
  KEY idx_sertifikat_waktu (diterbitkan_at),           -- Fase F: daftar sertifikat terbaru dahulu
  KEY idx_sertifikat_status_waktu (status, diterbitkan_at),
  CONSTRAINT fk_sertifikat_siswa        FOREIGN KEY (siswa_id)         REFERENCES siswa (id),
  CONSTRAINT fk_sertifikat_level        FOREIGN KEY (level_id)         REFERENCES level (id),
  CONSTRAINT fk_sertifikat_post_test    FOREIGN KEY (post_test_id)     REFERENCES post_test (id),
  CONSTRAINT fk_sertifikat_diterbitkan  FOREIGN KEY (diterbitkan_oleh) REFERENCES pengguna (id) ON DELETE SET NULL,
  CONSTRAINT fk_sertifikat_dibatalkan   FOREIGN KEY (dibatalkan_oleh)  REFERENCES pengguna (id) ON DELETE SET NULL,
  CONSTRAINT fk_sertifikat_menggantikan FOREIGN KEY (menggantikan_id)  REFERENCES sertifikat (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. GALERI KARYA (fase F)
-- ---------------------------------------------------------------------

-- Karya siswa: tautan proyek (mis. Scratch) atau berkas yang diunggah.
CREATE TABLE karya (
  id          BIGINT UNSIGNED NOT NULL,
  siswa_id    BIGINT UNSIGNED NOT NULL,
  sesi_id     BIGINT UNSIGNED NULL,
  judul       VARCHAR(200) NOT NULL,
  deskripsi   TEXT         NULL,
  jenis       ENUM('tautan','berkas') NOT NULL,
  url         VARCHAR(500) NULL,                       -- hanya http/https, tanpa kredensial
  berkas_path VARCHAR(500) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_karya_siswa (siswa_id, created_at),
  KEY idx_karya_waktu (created_at),                    -- Fase F: galeri pengelola terbaru dahulu
  CONSTRAINT fk_karya_siswa FOREIGN KEY (siswa_id) REFERENCES siswa (id) ON DELETE CASCADE,
  CONSTRAINT fk_karya_sesi  FOREIGN KEY (sesi_id)  REFERENCES sesi (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. MATERI PERTEMUAN (fitur materi)
-- ---------------------------------------------------------------------
-- Materi bacaan per pertemuan 1-12 (pertemuan 13 post test tidak punya materi). Satu materi per pertemuan.
-- isi (JSON): { "tujuan": [teks], "bagian": [ {tipe: paragraf|langkah|zippy|gambar, ...} ] }; format lengkap di README.
-- Diisi dari seed/materi-level-<n>.json oleh db:seed (upsert per pertemuan_id) atau diubah admin lewat halaman Materi.
CREATE TABLE materi (
  id            BIGINT UNSIGNED NOT NULL,
  pertemuan_id  BIGINT UNSIGNED NOT NULL,
  judul         VARCHAR(200) NOT NULL,
  isi           JSON         NOT NULL,
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_materi_pertemuan (pertemuan_id),
  CONSTRAINT fk_materi_pertemuan FOREIGN KEY (pertemuan_id) REFERENCES pertemuan (id)
) ENGINE=InnoDB;

-- Penanda "Saya sudah paham" per siswa per pertemuan (membuka tugas pertemuan itu; tidak dikunci ulang).
CREATE TABLE materi_baca (
  id            BIGINT UNSIGNED NOT NULL,
  siswa_id      BIGINT UNSIGNED NOT NULL,
  pertemuan_id  BIGINT UNSIGNED NOT NULL,
  dibaca_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_materi_baca (siswa_id, pertemuan_id),
  KEY idx_materi_baca_pertemuan (pertemuan_id),
  CONSTRAINT fk_materi_baca_siswa     FOREIGN KEY (siswa_id)     REFERENCES siswa (id) ON DELETE CASCADE,
  CONSTRAINT fk_materi_baca_pertemuan FOREIGN KEY (pertemuan_id) REFERENCES pertemuan (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. STUDIO ZIPPY (Level 2)
-- ---------------------------------------------------------------------
-- Proyek Studio Zippy milik siswa (panggung dengan sprite dan blok kode buatan sendiri). isi (JSON) berformat
-- { versi, latar, variabel, sprite[ { id, subjek, x, y, arah, kostum, tampil, skrip[] } ] }; format lengkap di README
-- dan src/modules/shared/blockly/daftarBlokStudio.js. Maksimal 256 KB per proyek (dijaga aplikasi). tingkat memilih
-- kumpulan blok yang tersedia (l2 sekarang; l3 menyusul). Tanpa kolom generated, jadi CASCADE dari siswa diizinkan
-- dan menghapus siswa otomatis menghapus proyeknya (tidak perlu langkah sendiri di urutan hapus siswa).
CREATE TABLE proyek_coding (
  id          BIGINT UNSIGNED NOT NULL,
  siswa_id    BIGINT UNSIGNED NOT NULL,
  nama        VARCHAR(60)  NOT NULL,
  tingkat     VARCHAR(10)  NOT NULL DEFAULT 'l2',
  isi         JSON         NOT NULL,
  dibuat_pada DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proyek_coding_nama (siswa_id, nama),
  CONSTRAINT fk_proyek_coding_siswa FOREIGN KEY (siswa_id) REFERENCES siswa (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Salinan beku proyek yang dikirim siswa ke sebuah tugas (template tipe coding_proyek) atau butir post test, supaya
-- perubahan proyek setelahnya tidak mengubah apa yang dinilai tutor. Satu salinan per tugas (kirim ulang menimpanya).
-- Ikut terhapus bersama tugas_siswa (CASCADE), jadi ikut hilang saat siswa dihapus lewat sesi/post test.
CREATE TABLE proyek_kiriman (
  id            BIGINT UNSIGNED NOT NULL,
  tugas_id      BIGINT UNSIGNED NOT NULL,
  nama          VARCHAR(60)  NOT NULL,
  tingkat       VARCHAR(10)  NOT NULL DEFAULT 'l2',
  isi           JSON         NOT NULL,
  dikirim_pada  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proyek_kiriman_tugas (tugas_id),
  CONSTRAINT fk_proyek_kiriman_tugas FOREIGN KEY (tugas_id) REFERENCES tugas_siswa (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Kostum unggahan Studio Zippy Level 3: gambar yang digambar siswa di Paint, diperkecil di browser (sisi terpanjang
-- 256 px, PNG), lalu diunggah. Berkas di uploads/kostum/<siswa_id>/<token>.png|jpg (maksimal 200 KB). Proyek di
-- proyek_coding.isi dan proyek_kiriman.isi hanya menyimpan rujukan ID ini (sprite.kostumUnggahan), bukan isi gambar.
-- Kostum yang dirujuk sebuah proyek_kiriman tidak bisa dihapus siswa (dijaga aplikasi). Tanpa kolom generated, jadi CASCADE
-- dari siswa diizinkan; berkasnya dihapus aplikasi setelah transaksi hapus siswa berhasil (seperti berkas karya).
CREATE TABLE kostum_unggahan (
  id           BIGINT UNSIGNED NOT NULL,
  siswa_id     BIGINT UNSIGNED NOT NULL,
  berkas_path  VARCHAR(255) NOT NULL,
  ukuran       INT UNSIGNED NOT NULL,
  dibuat_pada  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kostum_unggahan_siswa (siswa_id),
  CONSTRAINT fk_kostum_unggahan_siswa FOREIGN KEY (siswa_id) REFERENCES siswa (id) ON DELETE CASCADE
) ENGINE=InnoDB;
