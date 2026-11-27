# PROMPT: Dashboard backoffice (ringkasan, grafik, filter, dan shortcut Absen masuk)

Kamu adalah agen coding yang melanjutkan project **DigiPlay Learning** (`digiplay-learning/`). Prompt ini mengubah **beranda pengelola (backoffice)** menjadi dashboard dengan kartu ringkasan, grafik yang enak dilihat dan responsif, filter periode dan level, serta tombol cepat ke halaman Absensi. Draft visual sudah disetujui pemilik; deskripsi tata letak ada di bawah.

## Baca dulu

1. `.kiro/steering/project-context.md` (terutama catatan beranda pengelola, `raporController.beranda`, penghitung `posttestModel.jumlahTab`, `sertifikatModel.jumlahTerbitBulanIni`, `pembayaranModel.totalBulanIni`, dan catatan performa `data:uji-besar`) dan `README.md`.
2. `docs/design-system.md` dan `src/app/design-tokens.css` (token **sudah biru-oranye**, jangan mengubah keduanya), `GrafikKemajuan` (grafik SVG yang sudah ada), `Card`, `Badge`, `Skeleton`, `EmptyState`, `Ikon`, `TabelResponsif`, `ShellPengelola`, `Paginasi`.
3. Modul `sesi`, `posttest`, `pembayaran`, `siswa`, `level`, `rapor`, dan filter ekspor CSV (arti filter `level`, `dari`, `sampai`). Tiru polanya.

## Aturan kerja

- **Scope:** hanya beranda pengelola dan data pendukungnya. Jangan mengubah halaman lain, template, materi, atau dokumen lain.
- **Arsitektur:** clean architecture + DI (`src/di/container.js`), alur `jsx -> controller -> usecase -> model`, semua SQL di model. Dependency tidak dibuat di dalam class/function. Pakai agregator yang sudah ada (`rapor`/`raporController.beranda`) dan tambahkan fungsi di model modul pemilik data (`sesiModel`, `posttestModel`, `pembayaranModel`, `siswaModel`), bukan membuat modul baru kecuali terpaksa.
- **Tanpa library grafik baru** dan tanpa dependency baru. Grafik dibuat dengan HTML/CSS dan SVG sendiri mengikuti gaya `GrafikKemajuan`.
- **Komentar:** tiap function diberi komentar ringkas Bahasa Indonesia; percabangan non-trivial diberi komentar alasan (bukan mengulang kode). Periksa ulang sebelum selesai.
- **Kompleksitas:** perubahan sekecil mungkin yang menyelesaikan tugas. Cek komponen yang sudah ada sebelum membuat baru; bila membuat baru, jelaskan alasannya singkat. Hindari nesting lebih dari 2-3 level; satu function satu tanggung jawab.
- Teks UI lewat `src/locales/id_ID.json`; ikon lewat `Ikon`; warna **hanya lewat token** (tanpa warna keras); tema terang dan gelap serta tampilan 360 px sampai desktop tidak boleh rusak.
- SQL kompatibel MySQL 8 dan MariaDB 11 (JSON kembali sebagai string; `DECIMAL` string; ID `BIGINT UNSIGNED` string). **Tanpa perubahan skema**; bila agregasi lambat, tambah indeks lewat `PEMBARUAN_INDEKS` (di `schema.sql` dan `db:init`) dan catat.
- **Jangan menghapus** kode yang tidak dipakai atau yang dikomen (termasuk placeholder lama `HalamanBerandaPengelola`). **Tanpa test.**
- **Dokumentasi:** perbarui hanya `README.md` (cara uji dan definisi tiap angka) dan `.kiro/steering/project-context.md` (catatan teknis). **Jangan membuat `ringkasan-perubahan.md`** dan tanpa laporan `docs/reports/` (ini fitur, bukan bug fix).
- Bila ada keputusan yang tidak bisa diambil dari prompt ini, **berhenti dan tulis "keputusan untuk pemilik"** beserta rekomendasimu.

## Hak akses

Admin dan tutor melihat dashboard. **Semua yang berkaitan dengan uang** (kartu pembayaran bulan ini, grafik pembayaran, baris "siswa belum dicatat bayar") **hanya untuk admin**, dihitung hanya bila peran admin (seperti `pembayaranModel.totalBulanIni` sekarang) dan **tidak dirender** untuk tutor. Susunan grid harus rapi tanpa lubang saat kartu pembayaran tidak ada.

## Tata letak (acuan dari draft yang disetujui)

**Urutan dari atas ke bawah (desktop ≥ 1024 px):**

1. **Header:** judul "Beranda", tanggal hari ini; di kanan **bar filter** (lihat bagian Filter).
2. **Kartu sesi berlangsung:** latar `primary-soft`. Isi: judul "Sesi berlangsung sekarang", ringkasan (jumlah siswa yang sedang belajar, jumlah tutor hadir, dan paling banyak tiga siswa beserta pertemuannya), tautan "Lihat sesi", dan **tombol utama "Absen masuk"** di kanan (menuju halaman Absensi yang sudah ada). Inilah **posisi shortcut Absensi**.
3. **Empat kartu angka** (tidak mengikuti filter, selalu kondisi saat ini): Siswa aktif (dengan "+N bulan ini" dari tanggal daftar), Sesi 7 hari terakhir (dengan pembanding 7 hari sebelumnya), Post test menunggu dinilai (dengan usia tertua dalam hari), Pembayaran bulan ini (admin saja).
4. **Baris grafik 1 (2fr : 1fr):** "Sesi per hari" (batang vertikal) dan "Siswa per level" (batang horizontal).
5. **Baris grafik 2 (1fr : 1fr):** "Post test" (batang bertumpuk) dan "Pembayaran 6 bulan terakhir" (admin).
6. **Baris 3 (1fr : 1fr):** "Penuntasan tugas per minggu" (batang bertumpuk per minggu) dan "Perlu perhatian" (daftar tindakan).

**HP (< 640 px), satu kolom, urutan:** header + filter, kartu sesi (tombol Absen masuk lebar penuh), kartu angka 2 x 2, Sesi per hari, Post test, Pembayaran (admin), Penuntasan, Siswa per level, Perlu perhatian. Tablet (640-1023 px): dua kolom.

**Tombol mengambang "Absen masuk" (hanya di HP, hanya di beranda):** pil oranye (`bg-sun text-on-sun`, `shadow`), kanan bawah dengan `inset-inline-end` dan `bottom` ditambah `env(safe-area-inset-bottom)`, tidak menutupi konten terakhir (beri `padding-bottom` pada halaman), dan disembunyikan di layar ≥ 640 px karena tombol di kartu sesi sudah cukup. Tombol di kartu sesi tetap ada di semua ukuran.

## Filter

Satu bar filter di header, berlaku untuk **semua grafik** (bukan kartu angka, kartu sesi, "Siswa per level", dan "Perlu perhatian", yang menampilkan kondisi saat ini; beri keterangan kecil "kondisi saat ini" pada kartu itu bila perlu):

- **Periode:** pengatur bulan `‹ November 2026 ›`. Bawaan = bulan berjalan menurut `CURDATE()` database (sama seperti `totalBulanIni`). Panah kanan nonaktif di bulan berjalan; panah kiri dibatasi sampai bulan data tertua yang ada (atau 24 bulan ke belakang, mana yang lebih dekat). **Hanya pengatur bulan**; tidak ada rentang tanggal bebas dan tidak ada preset lain pada tahap ini.
- **Level:** pilihan `Semua` (bawaan), Level 1, 2, 3 (diambil dari tabel level aktif).
- **Atur ulang:** kembali ke bulan ini dan Semua level; tampil hanya bila filter tidak bawaan.

Keadaan filter disimpan di **query URL** (`?bulan=2026-11&level=<id>`), dirender di server, dan nilainya divalidasi (zod); nilai tidak valid diam-diam kembali ke bawaan. Pindah bulan atau level memuat ulang data tanpa kedip layar kosong (tampilkan `Skeleton` pada kartu grafik selama memuat). Di HP, bar filter berupa dua chip yang bisa digulir mendatar bila tidak muat.

Arti level pada filter **mengikuti ekspor CSV yang sudah ada**: sesi dan penuntasan = level pertemuan; post test = level post test; siswa dan pembayaran = level berjalan siswa.

## Definisi data tiap kartu dan grafik

Semua grafik memakai satu query agregasi per grafik (bukan satu query per hari atau per siswa), dijalankan paralel (`Promise.all`) di usecase.

| Kartu/grafik | Definisi | Mengikuti filter |
|---|---|---|
| Sesi berlangsung | sesi berstatus berlangsung hari ini; siswa dan tutor yang tercatat | tidak |
| Siswa aktif | jumlah siswa aktif; "+N bulan ini" dari tanggal daftar bulan berjalan | tidak |
| Sesi 7 hari terakhir | jumlah baris sesi 7 hari terakhir dibanding 7 hari sebelumnya | tidak |
| Post test menunggu dinilai | `posttestModel.jumlahTab` yang sudah ada, plus usia tertua dalam hari | tidak |
| Pembayaran bulan ini (admin) | `pembayaranModel.totalBulanIni` yang sudah ada | tidak |
| **Sesi per hari** | jumlah baris `sesi` per tanggal sesi dalam bulan terpilih (satu baris = satu siswa hadir); hari tanpa sesi bernilai 0; hari setelah hari ini (di bulan berjalan) ditandai kosong; hari ini berwarna `sun` | bulan, level |
| **Siswa per level** | jumlah siswa aktif per level berjalan | tidak |
| **Post test** | tiga bagian: **Belum tes** = siswa yang sudah memenuhi syarat ikut post test tetapi belum memulainya (cek aturan syarat di `posttestUsecase`; dihitung per hari ini); **Selesai dan sudah dinilai** = post test yang sudah difinalisasi pada bulan terpilih (tampilkan juga "N lulus, M belum lulus"); **Menunggu penilaian tutor** = post test yang sudah dikerjakan tetapi belum difinalisasi (bulan terpilih), dengan tombol "Nilai" menuju daftar post test menunggu | bulan, level (Belum tes: hanya level) |
| **Pembayaran 6 bulan terakhir** (admin) | total pembayaran per bulan untuk 6 bulan yang berakhir di bulan terpilih; bulan terpilih berwarna `sun`; di bawahnya total bulan terpilih dan "N siswa membayar, M belum" (belum = siswa aktif tanpa pembayaran pada bulan itu); tombol "Catat" menuju halaman pembayaran | bulan, level |
| **Penuntasan tugas per minggu** | per minggu dalam bulan terpilih (Minggu 1 = tanggal 1-7, 2 = 8-14, 3 = 15-21, 4 = 22-28, 5 = 29-akhir bulan): proporsi sesi **tuntas**, **tuntas sebagian**, **tidak tuntas** (penuntasan otomatis atau pilihan tutor); sesi tanpa penuntasan (NULL) tidak dihitung | bulan, level |
| **Perlu perhatian** | daftar tindakan dengan jumlah dan tautan ke halaman yang sudah ada: (1) post test menunggu dinilai, (2) siswa aktif tanpa sesi selama 21 hari terakhir, (3) siswa aktif belum dicatat bayar bulan ini (admin saja), (4) sesi yang masih berlangsung sejak hari sebelumnya (belum ditutup). Bagian yang jumlahnya 0 tidak ditampilkan; bila semuanya 0, tampilkan keadaan kosong ramah "Semua beres" dengan Zippy `merayakan` | tidak |

Tautan "Nilai", "Lihat", "Catat", "Tutup" memakai rute dan filter query halaman yang sudah ada; jangan membuat halaman baru. Bila ada kebutuhan filter yang belum didukung halaman tujuan, tulis di catatan akhir.

## Komponen grafik (UI dan UX)

Buat set kecil komponen di `src/modules/shared/ui/` (satu berkas per komponen, nama Indonesia mengikuti gaya domain): `KartuGrafik` (pembungkus judul, keterangan, area grafik, dan keadaan memuat/kosong), `GrafikBatang` (vertikal), `GrafikTumpuk` (horizontal bertumpuk, dipakai untuk Post test dan Penuntasan), `BatangHorizontal` (Siswa per level), dan `KartuAngka`. Pakai ulang `Card`, `Skeleton`, `EmptyState`. Semua hanya memakai token.

**Tampilan (wajib "enak dilihat" dan membulat):**
- Kartu memakai `rounded-lg` area pengelola, padding lega, garis tipis `border-line`, latar `bg-panel`; judul kartu tebal dan kecil, keterangan di bawahnya `text-muted`.
- Batang vertikal: sudut atas membulat (kira-kira 6 px), jarak antar batang rapat tetapi bernapas, lebar batang menyesuaikan jumlah data. Batang horizontal dan bertumpuk berbentuk **pil** (`rounded-full`) dengan jalur latar `bg-primary-soft`, tinggi 12-20 px, dan sambungan antar segmen yang rapi.
- Warna dari token saja: seri utama `primary`; sorotan (hari ini, bulan terpilih, menunggu penilaian, tuntas sebagian) `sun`; netral atau "belum/tidak" `muted`; jalur dan hari kosong `line`/`primary-soft`. Dua warna yang harus dibedakan **juga berbeda terang-gelapnya** dan setiap segmen punya label teks dan angka, tidak hanya warna.
- Sumbu minimalis: tidak ada garis grid tebal; cukup garis dasar halus, label awal dan akhir (mis. "1" dan "30"), dan nilai yang penting. Batang tertinggi atau nilai terpilih diberi label angka.
- Animasi masuk halus (batang tumbuh dari bawah, durasi memakai `--dur-sedang`/`--dur-lambat`); semua mati lewat `prefers-reduced-motion` (sudah diatur global, pastikan tidak ada animasi yang terlewat).
- Angka memakai angka tabular dan format Indonesia (`Intl`, pemisah ribuan titik, rupiah lewat helper format yang sudah ada).

**Responsif otomatis (HP sampai desktop):**
- Grafik mengisi lebar kartu (`width: 100%`) dan tidak pernah membuat halaman menggulir mendatar. Jumlah batang tetap (mis. 30 hari) mengecil mengikuti lebar; label sumbu ditipiskan otomatis di layar sempit (tampilkan awal, tengah, akhir saja). Tinggi grafik menyesuaikan (mis. 112 px di HP, 144 px di desktop).
- Kartu angka: 2 x 2 di HP, 4 sejajar di ≥ 1024 px. Grid kartu grafik: 1 kolom di HP, 2 kolom di tablet dan desktop sesuai tata letak.
- Interaksi sentuh: **ketuk batang** menampilkan nilainya pada pita ringkas di atas grafik (mis. "Rabu, 12 Nov: 8 sesi"), ketuk lagi atau di luar menghapus pilihan; di desktop cukup **hover/fokus** dengan petunjuk yang sama. Area ketuk batang minimal 24 px lebarnya dengan memperluas area sentuh (padding transparan), bukan mengubah bentuk batang.
- Bar filter dan tombol memenuhi area sentuh minimal 44 px.

**Aksesibilitas:** tiap grafik dibungkus `<figure>` dengan `<figcaption>`; ada ringkasan teks `aria-label`; sediakan tabel data tersembunyi (`sr-only`) berisi angka yang sama; batang yang bisa dipilih bisa dijangkau keyboard (Tab dan panah); kontras teks sesuai token; tidak ada informasi yang hanya lewat warna atau animasi.

**Keadaan khusus:** memuat = `Skeleton` berbentuk grafik; tidak ada data pada periode = `EmptyState` kecil di dalam kartu (jangan menyembunyikan kartu) dengan teks "Belum ada data bulan ini"; galat query satu kartu tidak boleh merusak seluruh beranda (tampilkan galat ringkas di kartu itu).

## Tahap pengerjaan

**Tahap 1: Data dan filter.** Fungsi model dan usecase untuk semua angka dan grafik di tabel definisi, parameter `bulan` dan `level` (divalidasi), hak akses uang hanya admin, dan perluasan `raporController.beranda` (atau agregator yang sudah dipakai beranda). Cek `EXPLAIN` tiap query dengan `npm run data:uji-besar` (2.000 siswa, 20.000 sesi, 1.000 post test) dan tambahkan indeks bila perlu; beranda harus tetap terasa cepat (target di bawah sekitar 1 detik di data uji besar). Hapus data uji dengan `--hapus` setelahnya.

**Tahap 2: Komponen grafik dan halaman.** Komponen di atas, bar filter (query URL), kartu sesi dengan tombol Absen masuk, tombol mengambang di HP, kartu angka, dan semua grafik sesuai tata letak. Tahap 2 bergantung pada Tahap 1.

**Tahap 3: Perlu perhatian, kosong/galat, dan pemeriksaan.** Daftar Perlu perhatian beserta tautannya, keadaan kosong/memuat/galat, serta pemeriksaan di tiga lebar (360, 768, 1280 px), tema terang dan gelap, peran admin dan tutor (grid rapi tanpa kartu pembayaran), dan `prefers-reduced-motion`.

## Kriteria selesai

1. Admin melihat semua kartu dan grafik; tutor tidak melihat satu pun yang berkaitan dengan uang dan grid tetap rapi.
2. Filter bulan dan level mengubah semua grafik yang bertanda "mengikuti filter" dan hanya itu; keadaan tersimpan di URL, bisa dibagikan dan dimuat ulang, dan nilai tidak valid kembali ke bawaan.
3. Tombol **Absen masuk** ada di kartu sesi (semua ukuran) dan sebagai tombol mengambang di HP, menuju halaman Absensi yang sudah ada.
4. Grafik tampil dengan sudut membulat, rapi di 360 px tanpa luapan mendatar, bisa diketuk di HP dan di-hover di desktop, dan terbaca di tema terang dan gelap.
5. Definisi tiap angka sesuai tabel; angka diperiksa terhadap data uji (mis. jumlah sesi per hari sama dengan penjumlahan hasil ekspor kehadiran untuk bulan dan level yang sama).
6. Query beranda tetap cepat di data uji besar dan tidak ada query per baris (N+1).

## Catatan akhir (wajib)

Tulis ringkasan singkat di chat (bukan berkas): berkas yang diubah dan dibuat, fungsi model/usecase baru beserta definisi akhir yang dipakai (terutama "Belum tes" dan "belum membayar"), indeks yang ditambahkan, hasil `EXPLAIN` dan waktu di data uji besar, dan **keputusan untuk pemilik** (bila ada). Pastikan `README.md` dan `.kiro/steering/project-context.md` diperbarui.
