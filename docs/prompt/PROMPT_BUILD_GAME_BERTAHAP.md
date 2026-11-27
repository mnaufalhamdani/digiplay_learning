# PROMPT: Game siswa terbuka bertahap mengikuti tugas

Kamu adalah agen coding yang melanjutkan project **DigiPlay Learning** (`digiplay-learning/`). Prompt ini mengubah aturan akses menu game di area siswa: game tidak lagi terbuka semua sejak login, tetapi **terbuka bertahap** mengikuti jenis tugas yang sudah muncul untuk siswa itu.

## Baca dulu

1. `.kiro/steering/project-context.md` dan `README.md`.
2. Modul yang terkait, sebagai contoh pola yang harus ditiru: `latihan`, `mengetik`, `blockly`, `studio`, `materi` (pola kunci `tugasTerbuka`), `tugas`, `layout` (menu siswa, termasuk pola item menu terkunci), `sesi` (generate tugas saat absen masuk). Periksa juga `schema.sql` untuk nama tabel dan kolom `tugas_siswa`, `template`, `pertemuan`.

## Aturan kerja

- **Scope:** hanya aturan akses game di area siswa. Jangan mengubah isi game, penilaian, template, materi, backoffice, atau halaman orang tua.
- **Arsitektur:** clean architecture + DI. Alur `jsx -> controller -> usecase -> model` (semua SQL di model). Dependency tidak dibuat di dalam class/function; daftarkan lewat `src/di/container.js`. Tiru pola berkas serupa; jangan mengubah pola yang sudah berjalan.
- **Komentar:** tiap function diberi komentar ringkas Bahasa Indonesia; percabangan non-trivial diberi komentar alasan (bukan mengulang kode). Periksa ulang sebelum selesai.
- **Kompleksitas:** perubahan sekecil mungkin. Pakai ulang komponen/helper yang ada; buat baru hanya bila perlu dan jelaskan alasannya singkat. Hindari nesting lebih dari 2-3 level.
- Teks UI lewat `src/locales/id_ID.json`; tema terang dan gelap serta tampilan responsif (360 px sampai desktop) tidak boleh rusak.
- **Tanpa perubahan skema** (lihat rancangan di bawah). **Jangan menghapus** kode yang tidak dipakai atau yang dikomen. **Tanpa test.**
- **Dokumentasi:** perbarui hanya `README.md` (cara uji) dan `.kiro/steering/project-context.md` (bagian "Status pengerjaan" dan catatan teknis; tambahkan catatan bahwa menu Coding Zippy dan menu game lain tidak lagi `bebas` penuh, jangan menghapus baris lama selain menandainya). **Jangan membuat `ringkasan-perubahan.md`** dan tanpa laporan `docs/reports/` (ini fitur, bukan bug fix).
- Bila ada keputusan yang tidak bisa diambil dari prompt ini, **berhenti dan tulis "keputusan untuk pemilik"** beserta rekomendasimu.

## Keputusan pemilik (ikuti)

- Yang sudah berlaku tetap: setelah login, siswa boleh membuka menu game **tanpa sesi aktif**. Game yang sudah terbuka **terbuka selamanya** (termasuk di pertemuan dan level berikutnya).
- **Pemicu terbuka = tugasnya muncul untuk siswa itu**, yaitu saat tugas dibuat ketika **absen masuk**. Jadi game sudah bisa dicoba **selagi siswa masih membaca materi**, sebelum menekan "Saya sudah paham" (tugas masih terkunci, tetapi gamenya sudah terbuka).
- **Puzzle terbuka sejak awal**, bahkan sebelum siswa punya sesi pertemuan 1.
- **Latihan Mouse terbuka sebagai satu kelompok:** satu tugas `game_mouse` membuka **kelima game mouse sekaligus** (Pecahkan Balon, Buka Kotak Hadiah, Masukkan ke Keranjang, Klik Kanan Ajaib, Kebun Gulung).
- **Coding Zippy dan Studio Zippy ikut aturan yang sama.**
- **Mode post test ikut aturan yang sama:** butir dan bagian post test juga dihitung sebagai "tugas yang muncul". Game yang dibutuhkan butir post test (mis. Mengetik untuk bagian A, Studio Zippy untuk butir coding) **tidak pernah terkunci selama post test**, dan setelah post test dimulai game itu **tetap terbuka selamanya** seperti game dari tugas pertemuan biasa.

## Pemetaan jenis tugas ke menu

| Jenis tugas (`template.tipe`) | Menu/game yang terbuka | Catatan |
|---|---|---|
| (tanpa syarat) | Puzzle | terbuka sejak awal |
| `game_mouse` | Latihan Mouse (semua 5 game) | contoh: muncul pertama di Level 1 pertemuan 2 |
| `mengetik` | Mengetik (pelajaran, tes, mode game) | contoh: muncul pertama di Level 1 pertemuan 3 |
| `blockly` | Coding Zippy | contoh: Level 1 pertemuan 11 |
| `coding_proyek` | Studio Zippy | contoh: Level 2 pertemuan 9; aturan Tingkat 3 hanya untuk level 3 ke atas **tetap berlaku** |

Daftar pemetaan ini cukup satu konstanta di satu tempat (mis. di `src/enums/index.js`, mengikuti gaya enum yang ada), bukan tersebar di banyak berkas. Tipe `puzzle` pada tugas tidak mengubah apa pun karena Puzzle sudah terbuka.

## Rancangan

**Aturan terbuka diturunkan dari data yang sudah ada, tanpa tabel atau kolom baru:** sebuah menu terbuka bila siswa itu punya **minimal satu baris `tugas_siswa`** yang templatenya bertipe seperti di tabel di atas, **di salah satu `siswa_level` miliknya** (lintas level, supaya game dari level lama tetap terbuka). Hitung semua status tugas (belum, selesai, dilewati, diganti), karena tugas itu sudah pernah muncul. Dengan cara ini siswa yang sudah berjalan otomatis mendapat akses sesuai riwayatnya, tanpa migrasi.

- **Butir post test ikut dihitung.** Pemicunya adalah saat butir/bagian post test dibuat untuk siswa itu (cek di kode kapan tepatnya: saat absen masuk pertemuan 13 atau saat siswa menekan Mulai Post Test, lalu pakai saat itu). Bagian **A (tes mengetik)** mungkin tidak berupa baris `tugas_siswa` bertipe `mengetik` (teksnya dari `bank_teks_mengetik`); periksa bagaimana bagian itu direpresentasikan (mis. `bagian_post_test`/`post_test_nilai`) dan anggap adanya bagian mengetik pada post test siswa sebagai "tugas mengetik muncul" yang membuka menu Mengetik. Untuk butir bertipe lain (mis. `coding_proyek` pada bagian D) pakai tipe template butirnya.
- Alur post test sendiri (layar fokus tanpa menu) **tidak memakai pemeriksaan menu terbuka sama sekali**: tes mengetik, butir Studio, dan penyimpanan hasil tidak boleh terhalang oleh aturan ini, termasuk bagi siswa yang melewatkan pertemuan mengetik (syarat ikut post test hanya hadir 9 dari 12).
- Satu fungsi di usecase (mis. `latihanUsecase.menuGameTerbuka(siswaId)`) mengembalikan himpunan menu yang terbuka, dengan **satu query ringan** di model (`SELECT DISTINCT` tipe, memakai indeks yang ada). Hasilnya dipakai bersama oleh menu siswa dan penjaga akses halaman; jangan membuat query terpisah di tiap halaman.
- Tugas yang gagal dirender saat generate (template dilewati karena bank gambar kosong) tidak membuat baris, sehingga tidak membuka game. Itu wajar.

**Penegakan di server (wajib, bukan hanya tampilan):**
- Halaman dan aksi masuk ke menu yang terkunci ditolak di server: Latihan Mouse, Mengetik, Coding Zippy, Studio Zippy. Pola penolakan mengikuti menu Materi bila cocok (jawaban 404 yang sama untuk halaman); untuk game, bila ada pola layar terkunci ramah anak yang sudah dipakai di menu terkunci, pakai itu.
- **Jangan memblokir alur yang memang berasal dari tugas atau post test:** pengerjaan tugas, tes mengetik post test (mode fokus), kirim proyek Studio ke tugas atau butir post test, dan penyimpanan hasil. Semuanya sudah pasti punya tugas, tetapi pastikan tidak ada penjaga baru yang menghalanginya (mis. Studio yang dibuka dari butir post test, atau pertemuan yang tugasnya baru muncul pada sesi itu).
- Puzzle tidak diberi penjaga.

**Tampilan menu siswa:**
- Menu yang terkunci **tetap tampil** (tidak disembunyikan) dengan ikon gembok dan teks bantu singkat berbahasa anak, mis. "Terbuka saat pertemuannya tiba". Pakai pola item menu terkunci yang sudah ada (`nav` dengan teks `sr-only`); jangan menambah komponen baru bila pola itu cukup. Item terkunci tidak bisa diklik dan dibaca layar pembaca sebagai terkunci.
- Menu yang terbuka tampil seperti sekarang.
- Halaman Latihan (bila ada daftar game di dalamnya): game mouse yang terkunci tampil terkunci dengan cara yang sama.
- Beranda siswa: tombol atau tautan langsung ke game (mis. di kartu tugas) tetap berfungsi karena tugasnya sudah ada.

## Kriteria selesai (uji manual dan jelaskan di README)

1. Siswa baru, login tanpa sesi: hanya **Puzzle** yang terbuka; Latihan Mouse, Mengetik, Coding Zippy, dan Studio Zippy terkunci dan tidak bisa dibuka lewat URL langsung.
2. Absen masuk L1 pertemuan 2: **Latihan Mouse** (ke-5 game) langsung terbuka **sebelum** siswa menekan "Saya sudah paham".
3. Keluar dari sesi atau login lagi tanpa sesi aktif: Latihan Mouse tetap terbuka.
4. Absen masuk L1 pertemuan 3: **Mengetik** terbuka. Pertemuan 11: **Coding Zippy** terbuka. Pada L2 pertemuan 9: **Studio Zippy** terbuka.
5. Siswa yang sudah naik level tetap memegang game dari level sebelumnya.
6. Siswa yang sudah punya riwayat tugas (data yang ada sekarang) langsung mendapat akses sesuai riwayatnya tanpa migrasi.
7. Alur tugas dan post test (mengetik, Studio, Coding Zippy) tetap berjalan normal; hasil latihan tetap tersimpan hanya saat sesi aktif seperti sebelumnya.
8. Menu terkunci rapi di HP dan di tema terang maupun gelap.
9. Siswa yang melewatkan L1 pertemuan 3 dan 4 (belum pernah dapat tugas mengetik, menu Mengetik masih terkunci) tetap bisa mengerjakan bagian A (mengetik) saat post test; setelah post test dimulai, menu **Mengetik terbuka**. Hal yang sama untuk butir Studio Zippy pada post test Level 2 dan 3.

## Catatan akhir (wajib)

Tulis ringkasan singkat di chat (bukan berkas): berkas yang diubah dan dibuat, query yang dipakai, kapan tepatnya butir post test dibuat dan bagaimana bagian A (mengetik) dikenali, dan **keputusan untuk pemilik** (bila ada). Pastikan `README.md` memuat cara uji di atas dan `.kiro/steering/project-context.md` diperbarui.
