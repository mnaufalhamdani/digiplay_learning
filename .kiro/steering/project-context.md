# DigiPlay Learning — Konteks Project

Website les komputer anak berbasis level. Satu project Next.js (frontend + backend), dikerjakan lokal dulu. Uji dan deploy ditunda sampai domain dan server siap.

Tanda **⚠** = usulan yang belum dikonfirmasi eksplisit, perlu dicek ulang.

## 0. Letak berkas di project

Root project: folder `digiplay-learning/`. Berkas hasil percakapan ditaruh sebagai berikut (berkas bertanda "agen" dibuat oleh agen coding, bukan ditaruh manual):

| Berkas | Letak dari root project |
|---|---|
| `project-context.md` | `.kiro/steering/project-context.md` |
| `schema.sql` | `schema.sql` |
| `gabung-mewarnai.mjs` | `scripts/gabung-mewarnai.mjs` |
| `PROMPT_BUILD_DIGIPLAY.md` (dan prompt agen lain) | `docs/prompt/` |
| `level-pertemuan.json`, `pelajaran-mengetik.json`, `template-level-1.json`, `template-level-2.json`, `template-level-3.json` | `seed/` |
| `design-system.md` | `docs/design-system.md` |
| `prompt-gambar.md`, `prompt-gambar.csv`, `prompt-maskot.md` | `docs/aset/` |
| `design-tokens.css` | `src/app/design-tokens.css` (diimpor dari `globals.css`) |
| Gambar subjek (outline, berwarna, puzzle, mewarnai) | `public/aset/gambar/<kode>/` |
| Gambar maskot `zippy-<suasana>.png` | `public/aset/maskot/` |
| `README.md`, `src/app/globals.css`, semua kode aplikasi | agen |

```
digiplay-learning/
  .kiro/steering/project-context.md   (berkas ini; dimuat otomatis sebagai steering)
  schema.sql
  scripts/gabung-mewarnai.mjs
  seed/level-pertemuan.json, pelajaran-mengetik.json, template-level-{1,2,3}.json
  docs/
    design-system.md
    aset/prompt-gambar.md, prompt-gambar.csv, prompt-maskot.md
    prompt/PROMPT_BUILD_DIGIPLAY.md
    reports/                     (laporan bug fix sesuai aturan kerja)
  public/aset/gambar/<kode>/
  public/aset/maskot/
  src/app/design-tokens.css
```

## 1. Gambaran umum

- Nama project/repo: `digiplay-learning`. Nama tampilan default: **DigiPlay Learning** (nama pelatihan, nama perusahaan, dan logo bisa diubah admin lewat pengaturan).
- Sistem **level tanpa patokan usia**. Anak yang baru mengenal PC tetap masuk level Pemula berapa pun umurnya.
- Satu level = **12 pertemuan + 1 pertemuan post test** (total 13).
- Peran: admin, tutor, siswa, orang tua/viewer.

## 2. Level dan materi

**Level 1 — Pemula** (belum pernah memegang PC)
1. Mengenal komputer, menyalakan dan mematikan
2. Mouse: klik, drag and drop
3. Keyboard: huruf dan angka
4. Mengetik kata dan kalimat sederhana
5. Desktop, folder, file
6. Paint 1: menggambar bebas
7. Paint 2: mewarnai, membuat poster
8. Word 1: mengetik dan menyimpan dokumen
9. Word 2: format huruf, menyisipkan gambar
10. Internet sehat
11. Coding visual 1 (Scratch Jr / Code.org)
12. Proyek akhir: kartu ucapan atau poster
13. Post test

**Level 2 — Dasar**
1. Review level 1 dan mengetik 10 jari
2. Latihan mengetik (target kecepatan)
3. Word 1: tabel dan daftar
4. Word 2: laporan sederhana
5. PowerPoint 1: slide, teks, gambar
6. PowerPoint 2: animasi dan transisi
7. Excel 1: sel, baris, kolom, tabel
8. Excel 2: rumus dasar (SUM, AVERAGE)
9. Scratch 1: sprite, gerak, suara
10. Scratch 2: percabangan dan perulangan
11. Scratch 3: game sederhana
12. Proyek akhir: presentasi topik pilihan
13. Post test

**Level 3 — Lanjutan**
1. Review dan mengetik cepat
2. Excel 1: rumus lanjutan (IF, COUNT, MAX/MIN)
3. Excel 2: grafik dan format data
4. Word dan PowerPoint untuk tugas sekolah
5. Canva: poster dan konten
6. Animasi 1: konsep dasar
7. Animasi 2: animasi pendek
8. Coding game 1: variabel dan logika
9. Coding game 2: skor, nyawa, level
10. Coding game 3: menyelesaikan game
11. Dasar HTML/CSS atau pengenalan robotika
12. Proyek akhir: game, animasi, atau website sederhana
13. Post test

Siswa baru bisa ikut tes penempatan; level 2 dan 3 tidak harus diambil berurutan.

## 3. Peran dan akses

| Peran | Login | Hak |
|---|---|---|
| Admin | ⚠ email + password | Semua hal tutor, ditambah: pengaturan (nama pelatihan, perusahaan, logo, batas waktu tidak aktif, batas nilai), kelola akun tutor, hapus data siswa, ubah template soal dan materi |
| Tutor | ⚠ email + password | Daftarkan siswa, absen masuk, tutup sesi, isi catatan dan status penuntasan, cek tugas praktik, catat pembayaran, batalkan/terbitkan ulang sertifikat |
| Siswa | Kode unik 8 karakter | Default hanya melihat; bisa mengerjakan latihan dan tes hanya saat sesi aktif |
| Orang tua/viewer | Kode unik 8 karakter (terpisah dari kode siswa) | Hanya melihat: kepesertaan, nilai, status pembayaran; unduh sertifikat PDF |

- Pendaftaran siswa hanya oleh admin atau tutor.
- Kode unik: 8 karakter acak, tanpa karakter yang membingungkan (O/0, I/1/l), tidak boleh sama.
- Tidak ada tutor tetap per siswa. Semua tutor bisa menangani beberapa siswa dalam satu sesi, dan satu siswa bisa ditangani 2 tutor. Absensi mencatat tutor yang hadir (bisa lebih dari satu).
- Rate limit pada percobaan login kode untuk mencegah tebak-tebakan.

## 4. Alur sesi dan absensi

1. Tutor input kode siswa → absen masuk (jam mulai tercatat). Pada saat itu tutor juga memilih ⚠ pertemuan ke berapa (default: pertemuan berikutnya) dan bisa mencatat pembayaran.
2. Materi dan latihan siswa digenerate saat absen masuk (lihat bagian 6).
3. Siswa login dengan kodenya. Jika sudah absen masuk → sesi aktif, bisa mengerjakan. Jika belum → hanya bisa view seperti orang tua.
4. Siswa menekan tombol **Pulang** dengan ConfirmDialog (tanpa input kode lagi). Setuju → sesi berakhir, jam selesai tercatat. Tutor lalu bisa mengisi catatan.
5. Siswa lupa pulang: tutor menekan logout/akhiri sesi. Jam pulang langsung terekap otomatis, tanpa tanda khusus.
6. **Ganti device**: tombol saat sesi aktif. Login di PC itu berakhir (PC bisa dipakai siswa lain), absensi tetap berjalan, siswa bisa login lagi di PC lain tanpa absen ulang. Hanya tombol Pulang yang mengakhiri absensi.
7. Satu kode hanya bisa aktif di satu PC. Login di PC lain ditolak selama masih aktif di PC pertama.
8. Batas tidak aktif **5 menit** (editable di pengaturan admin): login perangkat berakhir otomatis. Absensi tetap berjalan sampai Pulang atau ditutup tutor.

## 5. Penilaian

**Status materi per pertemuan**
- **Diajarkan**: otomatis saat absen masuk.
- **Penuntasan**: tuntas / tuntas sebagian / tidak tuntas.
  - Dihitung otomatis dari status tugas (semua selesai = tuntas; sebagian atau ada yang dilewati = tuntas sebagian; tidak ada = tidak tuntas).
  - Saat tutor mengisi catatan pulang, pilihan sudah terisi otomatis dan bisa diubah. **Pilihan tutor yang berlaku**; jika tidak diisi, hasil otomatis dipakai. Sumber status (otomatis/tutor) dicatat.

**Status tugas**: belum, selesai, dilewati. Tugas dilewati tercatat dan tidak memblokir tombol Pulang atau mengurangi nilai otomatis. Tombol **Ganti tugas** (siswa atau tutor) mengambil template lain di topik yang sama. Tidak ada tombol "Butuh bantuan"; siswa menghubungi tutor langsung.

**Mode penilaian tugas** (field di tiap template)
- ⚠ `otomatis_jawaban`: siswa memasukkan hasil di web, dicocokkan dengan kunci (mengetik, pilihan ganda, hasil Excel).
- ⚠ `dicek_tutor`: karya di aplikasi lain (Word, Paint, Scratch), ditandai selesai oleh tutor.

**Post test**
- Dibagi bagian A, B, C, dst. Tiap bagian dinilai sendiri (0-100) dengan bobot, lalu digabung jadi nilai total. Dihitung otomatis.
- Bagian Level 1: A mengetik 20%, B pengetahuan 30%, C praktik Mouse/File/Paint 25%, D praktik Word 25%. Level 2: A mengetik 15%, B praktik Word dan PowerPoint 25%, C Excel 25%, D praktik Scratch 20%, E konsep 15% (butir: 1 + 2 + 5 + 2 + 5 = 15). Level 3: A mengetik 10%, B Excel 30%, C praktik grafik/desain/animasi 20%, D praktik coding 20%, E konsep 20% (butir: 1 + 5 + 2 + 2 + 5 = 15). Bagian mengetik diukur otomatis dari tes mengetik bawaan.
- **Lulus: total ≥ 70 dan tiap bagian ≥ 50** (editable di pengaturan admin).
- Syarat ikut: kehadiran minimal **9 dari 12 pertemuan** (75%). Tutor bisa mengecualikan manual.
- ⚠ Tombol Mulai Post Test muncul otomatis di PC siswa saat pertemuan yang dipilih tutor adalah pertemuan 13 dan sesi aktif. Tidak ada tombol "buka" dari tutor.
- Hanya sekali dikerjakan. Remedial atau tes ulang dibuka tutor. Jika ganti device atau PC mati di tengah tes, bisa dilanjutkan dengan sisa waktu yang sama. Post test tidak bisa dilewati; jawaban yang belum terisi dihitung salah.
- Jika ada bagian di bawah batas, cukup remedial bagian itu lalu tes ulang bagian itu saja.
- **15 butir per level, durasi 45 menit** (semua level): 1 tes mengetik (A) + 10 soal pilihan ganda (B) + 2 tugas Paint/File (C) + 2 tugas Word (D). Butir B, C, dan D diambil acak dari bank (B: 20 soal, C dan D: masing-masing 5 tugas), sehingga tiap siswa bisa berbeda. Jumlah butir dan bobot per bagian diatur di `bagian_post_test`.

## 6. Bank soal dan materi

- **Template + parameter acak, tanpa AI.** Dibuat dalam jumlah banyak (sasaran ±8-10 template per pertemuan, ±100 untuk 3 level, plus bank teks ketikan).
- Digenerate saat absen masuk; siswa pada sesi dan level yang sama bisa mendapat latihan berbeda untuk topik yang sama.
- Contoh format:

```json
{
  "id": "L2-P8-SUM-01",
  "level": 2, "pertemuan": 8, "tipe": "excel",
  "penilaian": "otomatis_jawaban",
  "teks": "Buat tabel penjualan {buah1}, {buah2}, {buah3}. Isi jumlahnya {a}, {b}, {c}. Hitung total dengan SUM.",
  "parameter": { "buah": ["apel","jeruk","mangga","pisang"], "angka": [5, 30] },
  "kunci": { "ekspresi": "a+b+c" }
}
```

- Konvensi isi template: `parameter` berupa daftar (pilih satu acak) atau `{min,max}` (bilangan bulat acak); `pilihan_ganda` menyimpan `opsi` (4 pilihan, diacak saat tampil) dan `kunci.benar` (indeks); `mengetik` memakai `kunci.teks_ketik` + `min_akurasi`/`min_wpm`; tugas `dicek_tutor` memakai rubrik (`kunci.rubrik`, atau `rubrik_default` bila kosong).
- File seed per level: `template-level-1.json` (Level 1: 103 latihan pertemuan 1-12 termasuk game mouse dan puzzle otomatis, bank post test bagian B/C/D, definisi `bagian_post_test`, dan 16 teks untuk `bank_teks_mengetik`).
- `template-level-2.json` (Level 2: 136 template; 91 dinilai otomatis termasuk 21 tugas Excel dengan `kunci.ekspresi`, 45 dicek tutor; 5 bagian post test; 16 teks mengetik). Jawaban angka menerima koma atau titik desimal, dengan `toleransi` untuk hasil berkoma.
- `template-level-3.json` (Level 3: 138 template; 87 dinilai otomatis, 51 dicek tutor; 5 bagian post test; 16 teks mengetik). Tugas Excel memakai `kunci.ekspresi` (angka) atau `kunci.jika/maka/lainnya` (fungsi IF, jawaban teks; kedua hasil muncul di data acak). Animasi dan coding game memakai Scratch, dasar web memakai HTML/CSS (robotika tidak dipakai). Desain memakai Canva (akun dan syarat usia ditangani pemilik kursus). Opsi HTML pada soal harus di-escape saat ditampilkan.

### Aset gambar

- Subjek gambar: 5 kategori x 15 (hewan, tanaman, kendaraan, benda lain, benda olahraga), kode `HWN`, `TNM`, `KND`, `BLN`, `OLR` + nomor (contoh `hwn-01`). Daftar dan prompt ada di `docs/aset/prompt-gambar.md` dan `docs/aset/prompt-gambar.csv`.
- Satu folder per subjek: `public/aset/gambar/<kode>/` berisi `outline.png`, `berwarna.png`, `puzzle.png`, `mewarnai.png` (gabungan: outline utuh di atas + contoh berwarna maksimal 3 warna di pita bawah sisi kiri, tidak menimpa gambar; ±1024x1334). PNG persegi 1024 px, maksimal ±500 KB.
- `mewarnai.png` dibuat oleh skrip `scripts/gabung-mewarnai.mjs` (Node + `sharp`) dari `outline.png` dan `berwarna.png`; opsi `--hanya <kode>`, `--paksa`, `--uji`, `--tumpuk` (tata letak lama: contoh menimpa pojok gambar). Subjek yang bahannya belum lengkap dilewati dan dilaporkan.
- Puzzle dibuat sendiri di web (dipotong otomatis dari `puzzle.png`, 2x2 / 2x3 / 3x3). Game latihan mouse juga dibuat sendiri di web.

## 7. Fitur

- Data siswa, kode unik, absensi (masuk/pulang, jam sesi), catatan tutor.
- Rapor/pantauan orang tua (lihat saja) dan unduh sertifikat PDF.
- **Sertifikat** per level: terbit otomatis saat lulus post test; admin/tutor bisa membatalkan atau menerbitkan ulang. Nomor unik dan QR yang mengarah ke **halaman verifikasi publik tanpa data sensitif** (nomor sertifikat, nama, level, nilai, tanggal). Halaman orang tua tetap lewat kodenya sendiri.
- **Tes mengetik bawaan** (target lebih powerful dari typing.com): pelajaran bertahap per baris keyboard, WPM + akurasi + konsistensi, heatmap tombol salah, latihan adaptif, mode game, grafik perkembangan. Hasilnya menjadi nilai bagian mengetik.
- Bank soal dan tes online dengan soal acak.
- Galeri karya (siswa menempel link proyek Scratch atau mengunggah hasil).
- Pelacak materi (diajarkan / penuntasan).
- Pembayaran: dicatat manual oleh tutor saat absen masuk atau saat menulis catatan; **tampil di halaman orang tua**.
- Pengumuman dan jadwal untuk orang tua; ekspor data ke Excel (tahap lanjut).
- Gamifikasi (badge, poin) tahap lanjut.

## 8. Arsitektur

Mengikuti project referensi `dk_docs` (Next.js, clean architecture, DI).

- Alur layer: `*.jsx → controller → usecase → model (semua SQL)`. Penamaan JS: **Service** (API luar, bila perlu), **Model** (database), **UseCase** (logika bisnis), **Controller** (validasi UI dan logika ringan).
- Stack: Next.js (App Router, Server Actions, satu route API `api/v1/[modul]/[[...path]]`), **MySQL + mysql2** (SQL mentah di model, tanpa ORM), **awilix** (DI di `src/di/container.js`), **zod** (validasi), Tailwind, teks di `locales/id_ID.json`, `enums`, `utils`, `middlewares`.
- Dependency tidak dibuat di dalam class/function. Setiap function diberi komentar ringkas berbahasa Indonesia; cabang logika non-trivial diberi komentar alasan.
- `src/app/` hanya routing; komponen halaman di `src/modules/<modul>/` (model, usecase, controller, schema, actions, UI).
- Auth belum ada di referensi: dibangun sendiri (login kode unik, sesi per perangkat, batas tidak aktif).
- Struktur:

```
src/
  app/
    siswa/ ...              area siswa (playful)
    backoffice/ ...         area admin/tutor
    publik/verifikasi/[nomor]/
    api/v1/[modul]/[[...path]]/route.js
  modules/
    shared/ui/              Button, TextField, Select, Card, Badge,
                            ConfirmDialog, Modal, Tabs, TabelResponsif
    siswa/ tutor/ level/ pertemuan/ sesi/ soal/ nilai/ sertifikat/ ...
  di/ config/ enums/ locales/ utils/ middlewares/
```

### Daftar modul dan tabelnya

Skema lengkap ada di `schema.sql` (MySQL 8+, 25 tabel, konvensi ID dan penamaan mengikuti DK Docs).

| Modul (`src/modules/`) | Tabel | Isi |
|---|---|---|
| `pengaturan` | pengaturan | Nama, logo, batas waktu, batas nilai |
| `auth` | login_perangkat, percobaan_login | Login kode siswa/orang tua, login backoffice, ganti device, batas tidak aktif |
| `pengguna` | pengguna | Akun admin dan tutor |
| `siswa` | siswa, kode_akses, siswa_level | Data siswa, kode unik, level yang sedang berjalan |
| `level` | level, pertemuan, bagian_post_test | Level, 13 pertemuan, bagian dan bobot post test |
| `template` | template | Template latihan/soal dan pembuat parameter acak |
| `sesi` | sesi, sesi_tutor | Absen masuk/pulang, tutor yang hadir, catatan, penuntasan |
| `tugas` | tugas_siswa | Tugas hasil generate, ganti tugas, dilewati |
| `pembayaran` | pembayaran | Catatan bayar manual |
| `mengetik` | pelajaran_mengetik, bank_teks_mengetik, hasil_mengetik | Pelajaran dan tes mengetik |
| `latihan` | hasil_latihan | Game latihan mouse (5 game) dan puzzle buatan sendiri di web |
| `gambar` | gambar | Bank subjek gambar (mewarnai, berwarna, puzzle) dan unduhan untuk tugas Paint/Word |
| `posttest` | post_test, post_test_nilai | Post test, nilai per bagian, nilai total, kelulusan |
| `sertifikat` | sertifikat | Terbit otomatis, PDF, QR, verifikasi publik |
| `karya` | karya | Galeri karya |
| `rapor` | (tanpa tabel sendiri) | Rangkuman untuk halaman orang tua dan dashboard |
| `log` | log_aktivitas | Jejak koreksi dan aksi penting |

## 9. Domain

- Satu project melayani dua domain: `namadomain.com` (siswa) dan `backoffice.namadomain.com` (pengelola).
- File pengarah (`proxy.ts` pada Next 16) membaca host dan mengarahkan ke `app/siswa` atau `app/backoffice`; akses silang ditolak (404).
- Cookie sesi tidak dibagi antar domain (tanpa `Domain=.namadomain.com`); nama cookie terpisah.
- Di belakang reverse proxy: teruskan header `Host` dan atur `allowedOrigins` Server Actions.
- Pengembangan lokal: `siswa.localhost:3000` dan `backoffice.localhost:3000`; bila lewat IP, cadangan path `/backoffice`.
- **Deploy dan uji ditunda** (domain dan server belum siap).

## 10. UI/UX

- Ramah anak, kekinian, enak dilihat; semua halaman mendukung **tema gelap dan terang**.
- Satu set komponen reusable (file sendiri) dengan variabel warna (token). Penanda area (`data-area="siswa|pengelola"`) mengganti palet, lengkung sudut, font, dan ukuran tombol: siswa playful dan cerah, pengelola rapi dan tenang.
- Mode gelap tidak hitam pekat (biru malam/ungu tua, aksen cerah). Tombol besar dan "gemuk", sudut sangat membulat, area sentuh minimal 44px. Font bulat (Fredoka/Nunito) lewat `next/font`. Animasi kecil saat berhasil dan otomatis mati bila pengguna memilih "kurangi gerakan".
- **ConfirmDialog kustom ramah anak** (bukan `window.confirm`) untuk tombol Pulang dan aksi penting lain.
- Responsif mobile dan desktop. Orang tua dan tutor kemungkinan memakai HP/tablet (prioritas mobile-first); siswa kemungkinan memakai PC. Tabel di HP berubah jadi daftar kartu.

- Maskot: **Zippy**, sugar glider "Pahlawan Anti-Gaptek" (setelan biru-oranye, lambang petir). Font Fredoka + Nunito, warna utama dan mode orang tua (varian area siswa yang lebih tenang) sudah disetujui. Set ikon: Phosphor Icons (disetujui) (bobot `bold`/`duotone` untuk siswa, `regular` untuk pengelola).
- Rincian lengkap (palet terang/gelap yang sudah lolos uji kontras WCAG AA, token bentuk dan gerak, daftar komponen, layout, layar kunci) ada di `docs/design-system.md` dan `src/app/design-tokens.css`.

## 11. Rencana pengerjaan

1. Dokumen konteks ini
2. Menutup keputusan terbuka
3. Skema database MySQL (`schema.sql`) dan daftar modul
4. Template soal dan materi Level 1-3
5. Desain UI: palet terang/gelap, daftar komponen, contoh layar kunci
6. Prompt build bertahap untuk agen coding: A fondasi (project, DI, database, pengarah domain, login kode) → B data master → C sesi dan absensi → D latihan, tes mengetik, bank soal → E nilai, sertifikat, QR → F rapor orang tua, galeri, pengaturan
7. Uji dan deploy (ditunda)

Prompt untuk agen hanya meminta pembaruan `README.md` dan `.kiro/steering/project-context.md`.

## 12. Keputusan terbuka / perlu konfirmasi

- (Selesai) Canva tetap dipakai pada Level 3. Akun dan kondisi siswa (syarat usia Canva) ditangani sendiri oleh pemilik kursus.

- ⚠ Admin dan tutor login dengan email + password.
- ⚠ Tutor memilih pertemuan saat absen masuk, dan post test otomatis muncul pada pertemuan 13.
- ⚠ Mode penilaian tugas (`otomatis_jawaban` / `dicek_tutor`) per template.
- Aturan remedial setelah tidak lulus (berapa kali tes ulang, ada jeda atau tidak).
- Tes penempatan untuk siswa baru: isi dan cara menentukan level.
- (Selesai) Level berikutnya diatur tutor lewat Ganti level di detail siswa, bukan terbuka otomatis setelah lulus. Siswa tidak perlu didaftarkan ulang.

## Status pengerjaan

Diperbarui oleh agen coding setelah tiap fase (lihat `docs/prompt/PROMPT_BUILD_DIGIPLAY.md`).

- [x] Fase A - Fondasi, auth, dan area
- [x] Fase B - Data master: level, template, gambar, siswa
- [x] Fase C - Sesi dan absensi
- [x] Fase D - Latihan dan tes (dikerjakan dalam dua permintaan: D1 latihan mengetik, game mouse, puzzle; D2 post test)
- [x] Fase E - Sertifikat
- [x] Fase F - Orang tua dan pelengkap

### Catatan teknis Fase A

- Versi dipin sesuai DK Docs (react 19.3.1, tailwind 4.3.3, awilix 13.0.5, mysql2 3.24.6, zod 4.6.7), ditambah `@phosphor-icons/react` 2.1.10 (ikon dipakai dengan nama `*Icon`, mis. `SignOutIcon`). Next.js dinaikkan dari 16.4.2 (acuan DK Docs) ke **16.4.6** karena 16.4.2 terkena celah keamanan yang diumumkan Next.js.
- Database lokal yang dipakai uji adalah MariaDB 11.8 (port 3307); `schema.sql` berjalan apa adanya (25 tabel).
- Pengarah domain `src/proxy.js` (nama Next 16) membaca hostname dari header `Host`, bukan `nextUrl.hostname` (di dev berisi host server sendiri). Proxy mengisi header internal `x-dp-basis` (awalan jalur area: kosong di host asli, `/siswa` atau `/backoffice` di cadangan localhost/IP) agar tautan dan redirect benar di kedua cara akses.
- Cookie orang tua `dp_ortu` berisi `{ siswaId, kodeId, exp }` (ada tambahan `kodeId` dari rancangan `{ siswaId, exp }`) supaya cookie lama langsung tidak berlaku saat kode orang tua diganti di Fase B.
- Cookie `dp_siswa` bermasa berlaku 12 jam (`masaCookieSiswaJam`). Awalnya tanpa masa berlaku, lalu diubah karena siswa yang tidak sengaja menutup browser tertolak "Kodemu sedang dipakai" di browser yang sama (laporan `docs/reports/login-siswa-browser-ditutup.md`). Sekarang browser yang sama langsung masuk lagi tanpa kode selama login belum berakhir (Ganti device, Pulang, Keluar, ditutup tutor, atau diam melewati batas tidak aktif); batas tidak aktif dijaga server lewat `login_perangkat.terakhir_aktif_at`. Semua perbandingan waktu login memakai `NOW()` database.
- Kegagalan login yang ke-5 (backoffice) / ke-10 (kode) langsung dijawab "Coba lagi nanti" (429). Siswa `nonaktif` dicatat sebagai percobaan gagal.
- IP klien untuk pembatas percobaan login diambil dari `x-forwarded-for` **dari kanan**: entri ke-`JUMLAH_PROXY_TEPERCAYA` (.env, bawaan 1) dihitung dari kanan. Ini menyimpang dari rancangan awal ("bagian pertama"), karena bagian pertama bisa dipalsukan klien. Produksi wajib di belakang reverse proxy (setelan nginx di README), sebab Next 16 tidak menyediakan alamat koneksi ke aplikasi dan hanya mengisi `x-forwarded-for` bila klien tidak mengirimnya.
- Hak akses Server Action ditegakkan di berkas `*.actions.js` lewat `authController.wajibAkses(akses)`; route HTTP lewat kolom `akses` di `*.routes.js` (route tanpa `akses` dianggap `pengguna`). Controller menerima `(input, sesi)`.
- Halaman khusus admin yang dibuka tutor dijawab 404 (`notFound()`). Admin tidak bisa menonaktifkan akunnya sendiri dari daftar Pengguna; admin aktif terakhir tidak bisa diturunkan atau dinonaktifkan.
- Unggah logo lewat `POST /api/v1/pengaturan/logo` (multipart, kolom `logo`, admin); logo disajikan publik lewat `GET /api/v1/pengaturan/logo` karena tampil juga di halaman masuk. Berkas logo lama dihapus setelah diganti.
- Halaman placeholder (beranda siswa, orang tua, beranda pengelola) sementara ada di `src/modules/layout/`; akan pindah ke modul `sesi` (Fase C) dan `rapor` (Fase F).
- `kripto.js` dan `kodeAkses.js` memakai import relatif dan tanpa `server-only` agar bisa dipakai skrip Node (`admin:buat`, `siswa:uji`).

### Catatan teknis Fase B
- `npm run db:seed` memvalidasi semua berkas seed (termasuk `validasiTemplate` 50 kali render per template) sebelum menulis apa pun, lalu menulis dalam satu transaksi dengan upsert penuh berdasarkan kunci unik (sesuai prompt, dikonfirmasi developer): baris yang sudah ada diperbarui dari berkas seed, termasuk `template.aktif = 1`, sehingga perubahan admin lewat halaman Level/Template ikut tertimpa saat seed dijalankan lagi. Penanda `punya_*` gambar selalu mengikuti berkas di disk.
- Skrip Node memakai utilitas `src/utils/` lewat loader `scripts/_alias.mjs` (`node --import`), yang menerjemahkan alias `@/` dan memuat JSON tanpa atribut impor. `scripts/_koneksi.mjs` mendapat opsi `barisBerubah` (tanpa flag FOUND_ROWS) untuk statistik baru/diperbarui.
- Halaman siswa di backoffice berada di `/data-siswa` (bukan `/siswa`; dikonfirmasi developer), karena `src/proxy.js` menjawab 404 untuk `/siswa/*` di host backoffice. Kartu kode cetak di `/kartu-kode/[id]`, di luar kerangka pengelola. Alamat yang dicetak dari `.env` `URL_SISWA`.
- Kolom JSON dibaca lewat `uraiJson` (`src/utils/json.js`) dan ditulis lewat `teksJson`. RNG template disuntikkan lewat DI `acak` (`crypto.randomInt`).
- Utilitas template: `evaluasiEkspresi` (pengurai sendiri; nilai parameter teks angka seperti `"60"` diterima; pembanding hanya di tingkat terluar), `renderTemplate` (penanda yang seluruhnya `{x}` di kunci mempertahankan tipe nilai, mis. `min_skor` tetap angka), `periksaJawaban` (pilihan ganda membandingkan `indeksAsli`), `uraiAngka`, `jawabanHarapan`, `validasiTemplate(template, gambarTersedia, acak)`. Validasi menambah aturan kombinasi tipe/penilaian: pilihan ganda wajib otomatis; Word/PowerPoint/Paint/Scratch/Coding/Lainnya wajib dicek tutor; Excel otomatis butuh `ekspresi` atau `jika`; mengetik butuh `teks_ketik`; game mouse butuh `jenis` dan `min_skor`; puzzle butuh `keping` 4/6/9.
- Template pertemuan 13 wajib punya bagian dari level yang sama; template lain tanpa bagian. Saat ubah, kode, pertemuan, bagian, dan tipe tidak bisa diubah. Pratinjau memakai bank gambar aktif.
- Ganti kode siswa mengakhiri login perangkat aktif (`ditutup_tutor`); ganti kode orang tua tidak menyentuh login siswa (cookie `dp_ortu` lama gugur lewat pemeriksaan `kodeId`). Nonaktifkan siswa juga mengakhiri login aktifnya. Ganti level ke level yang sama ditolak. Kode akses tidak dicatat di log.
- Hapus siswa: admin saja, nama diketik ulang (tanpa beda huruf besar/kecil), satu transaksi dengan urutan komentar kepala `schema.sql`; sudah diuji dengan baris di semua tabel anak (sesi, tugas, post test, nilai, sertifikat, pembayaran, hasil, karya).
- Rubrik bawaan (`rubrik_default` di berkas seed) belum disimpan di database; pratinjau hanya menampilkan `kunci.rubrik` bila ada. Tempat simpannya diputuskan di fase berikutnya (keputusan developer). Di Fase D2 rubrik ini dipindah ke pengaturan `rubrik_bawaan` (lihat catatan Fase D1/D2).
- Komponen bersama baru: `Select`, `TextArea`, `TabelResponsif`, `Paginasi`, `FormFilter` (GET, berfungsi tanpa JavaScript), `EmptyState`, `TautanTombol`; helper `atau404`, `hitungPaginasi`, `jalurQuery`, `formatTanggal/formatWaktu`, schema query di `schemaDasar.js`.

### Catatan teknis Fase C
- Modul baru `sesi`, `tugas`, `pembayaran`. Beranda siswa dan beranda pengelola sekarang di modul `sesi`; berkas placeholder lama di `src/modules/layout/` (`HalamanBerandaSiswa`, `HalamanBerandaPengelola`, `HalamanAbsensiPlaceholder`) tidak dihapus sesuai aturan kerja, tetapi tidak lagi dipakai halaman.
- Form Absen masuk dua langkah: **Cek kode** (nama siswa, level, pertemuan bawaan, peringatan sesi lama) lalu **Absen masuk**. Penolakan yang butuh tindakan dikirim sebagai `AppError` 409 dengan `detail` objek (`{ kode: 'berlangsung', sesiId }` atau `{ kode: 'kehadiran', siswaLevelId, hadir, butuh }`) agar form menampilkan tombol **Tutup sesi itu** / **Izinkan pengecualian**.
- Kehadiran = jumlah nomor pertemuan 1-12 yang berbeda dan punya sesi pada `siswa_level` itu (pertemuan yang diulang dihitung sekali).
- Generate tugas: kandidat diacak; bila kedua jenis penilaian ada, masing-masing `ceil(n/3)` ditaruh di depan. Template yang gagal dirender karena bank gambar kosong dilewati; kodenya disimpan di detail log `absen_masuk` (`templateDilewati`) dan ditampilkan sebagai peringatan di detail sesi bila jumlah tugas jadi kurang.
- Pemeriksaan jawaban memakai kunci hasil render di `parameter_hasil` (bukan template terbaru), jadi soal siswa tetap konsisten walau template diubah. Daftar tugas untuk siswa tidak mengirim kunci jawaban (hanya petunjuk target: jenis, min_skor, keping, teks_ketik, min_akurasi, min_wpm).
- Penuntasan otomatis: tanpa tugas sama sekali (mis. pertemuan 13) hasilnya NULL (ditampilkan "-"). Tutor boleh mengubah status tugas setelah siswa pulang; untuk sesi selesai `penuntasan_otomatis` dihitung ulang. Ganti tugas hanya selama sesi berlangsung, dan tidak untuk tugas yang sudah selesai.
- Tutup sesi oleh tutor mengakhiri login siswa (`ditutup_tutor`) sesuai C5, sehingga ping siswa mendapat 401 dan siswa diarahkan ke halaman masuk (bukan "kembali ke mode lihat saja" seperti tertulis di kriteria C); perilaku ini dikonfirmasi developer. Sinkron otomatis `sesiAktifId` terlihat saat tutor mengabsen. Interval ping diperpendek dari 60 menjadi **15 detik** (keputusan developer); throttle penulisan `terakhir_aktif_at` tetap 30 detik.
- Saat sesi aktif, header siswa menampilkan **Ganti device** dan **Pulang**; tombol **Keluar** hanya tampil di luar sesi. Pulang menghapus cookie lewat `authController.keluarkanSiswa` lalu ke `/sampai-jumpa`.
- `authController` mendapat dependency `sesiUsecase` (untuk `sesiAktifId` di ping) dan fungsi `keluarkanSiswa`. `logUsecase.detailTerakhir` ditambahkan untuk membaca peringatan generate.
- Catatan tutor: setiap tutor menulis catatannya sendiri di `sesi_tutor`; semua pengelola melihat semua catatan. Tutor yang belum tercatat harus **Ikut menangani** (hanya selama sesi berlangsung) sebelum bisa menulis.
- Pembayaran wajib berisi jumlah atau keterangan; jumlah menerima `15000`, `15.000`, atau `Rp15.000` (tanpa desimal). Pembayaran dari absen masuk tercatat dengan tanggal hari ini dan `sesi_id`.
- Komponen baru: `ProgressBar`, `Tabs`, domain `StatusSesi`, `OpsiJawaban`, `Konfeti` (keyframe di `globals.css`, mati bila kurangi gerakan); `KartuTugas` dan `DaftarTugasTutor` di modul `tugas`, `BagianPembayaran` di modul `pembayaran`. Helper format baru: `formatJam`, `formatDurasi`, `formatRupiah`.
- `npm run siswa:uji` memastikan Siswa Uji punya level berjalan (level pertama) bila level sudah di-seed.
### Catatan teknis Fase D1/D2
- Modul baru `mengetik`, `latihan`, `posttest`, dan stub `sertifikat` (`sertifikatUsecase.terbitkanOtomatis` masih kosong, dipanggil saat finalisasi lulus; isinya Fase E). Utilitas baru `src/utils/mengetik.js` (hitung WPM/akurasi/konsistensi, nilai bagian mengetik) dan `src/utils/tataLetakKeyboard.js`.
- Hasil latihan dari browser dihitung ulang di server dan ditolak bila tidak wajar (`BATAS_LATIHAN`: WPM > 250, durasi < 3 detik, karakter benar > diketik, skor > 5 per detik). `Math.random` di browser hanya untuk posisi tampilan game.
- Tugas sesi mengetik, game mouse, dan puzzle selesai otomatis lewat `tugasUsecase.selesaikanOtomatis` bila hasil memenuhi target di `parameter_hasil` (puzzle: gambar dan jumlah keping sama). Di luar sesi halaman latihan hanya lihat saja.
- Rubrik bawaan tugas dicek tutor disimpan di pengaturan `rubrik_bawaan` (teks JSON `[{ kriteria, poin }]`) dan diubah admin di halaman Pengaturan (1-10 kriteria, total poin tepat 100; keputusan developer). Nilai awalnya dari `rubrik_default` seed (`schema.sql` untuk database baru, `db:seed` dengan `INSERT IGNORE` untuk database lama). Rubrik ini dipakai bila template tidak punya `kunci.rubrik`, di detail sesi tutor dan detail post test. Konstanta `RUBRIK_BAWAAN` di `src/enums/index.js` hanya cadangan bila baris pengaturan rusak/belum ada. Catatan: semua template praktik post test di seed saat ini punya rubrik sendiri, jadi rubrik bawaan baru terlihat pada tugas pertemuan 1-12.
- Teks tes mengetik post test deterministik per percobaan: `bank_teks_mengetik` aktif untuk level itu ditambah teks tanpa level, urut id, indeks `id post_test mod jumlah`. Tes mengetik hanya sekali dan langsung dinilai; yang belum dikerjakan saat dikumpulkan bernilai 0.
- Waktu post test dihitung server lewat `POST /api/v1/posttest/denyut` (tiap 15 detik, tambahan maksimal 30 detik per denyut). Membuka halaman lagi mengatur ulang `terakhir_aktif_at`, sehingga waktu saat tidak login (ganti device) tidak terpakai. Waktu habis -> dikumpulkan otomatis.
- Tes ulang: bagian yang diulang disimpan di kolom baru `post_test.bagian_ulang` (JSON daftar id bagian; NULL = semua bagian; keputusan developer). Detail log `buka_tes_ulang` tetap mencatat bagian yang sama, dan dibaca sebagai cadangan untuk tes ulang yang dibuka sebelum kolom ada. Database yang sudah terpasang mendapat kolom ini lewat `npm run db:init` (menambah kolom yang belum ada, data tidak diubah). Nilai bagian lain disalin; `terakhir_aktif_at` NULL berarti belum dimulai, dan saat Mulai butir dipindah ke sesi yang sedang berjalan.
- Layar post test memakai `ShellSiswa mode="fokus"` (tanpa menu, ping sesi tetap berjalan).
- Lulus post test tidak mengubah level siswa; naik level diatur tutor lewat **Ganti level** di detail siswa (keputusan developer). Siswa tidak didaftarkan ulang: kode siswa dan kode orang tua tetap, riwayat tetap. Level lama tercatat `lulus` bila punya percobaan post test yang lulus, `berhenti` bila belum.

### Catatan teknis Fase E
- Modul `sertifikat` lengkap (model, usecase, controller, schema, actions, routes) menggantikan stub D2. Dependensi baru `pdfkit` 0.21.0 dan `qrcode` 1.5.4 (dipin; keduanya masuk `serverExternalPackages`). Pembuat PDF ada di `src/modules/sertifikat/sertifikat.pdf.js` (didaftarkan di DI sebagai `pdfSertifikat`, folder aset lewat `folderAset`); konstanta warna (ungu, krem, teks, oranye Zippy `#FF8A1F`) ada di berkas itu.
- Pengaturan baru `penandatangan_nama` dan `penandatangan_jabatan` (bawaan kosong, maks. 100 karakter): ditambahkan ke `INSERT IGNORE` pengaturan di `schema.sql` (database baru) dan `db:seed` (database lama), tampil di kelompok **Sertifikat** halaman Pengaturan.
- Penerbitan otomatis dipanggil dari finalisasi post test di dalam transaksinya, memakai SAVEPOINT lewat helper baru `db.titikSimpan(conn, nama, fn)` di `src/config/database.js`. Gagal terbit hanya membatalkan bagian sertifikat; finalisasi tetap di-commit, galat ditulis ke log aplikasi dan `log_aktivitas` (`gagal_terbit_sertifikat`, entitas `post_test`). Detail post test menurunkan status **gagal** dari catatan log itu bila post test lulus tetapi belum pernah punya sertifikat. Bentrok UNIQUE `uq_sertifikat_aktif` saat otomatis dianggap sudah terbit.
- Idempoten: bila sudah ada sertifikat `terbit` untuk (siswa, level), penerbitan otomatis tidak melakukan apa pun. Revisi nilai praktik setelah terbit tidak mengubah snapshot sertifikat; perlu **Terbitkan ulang** bila nilai di sertifikat harus ikut berubah.
- Snapshot `nama_level` ditulis "Level <urutan> - <nama level>" (mis. "Level 1 - Pemula"). Nomor `DPL-<kode level>-<YYYYMM>-<urut 4 digit>`; bulan dan tanggal memakai `NOW()` database; urut = nomor terbesar berawalan sama + 1, diulang sampai 5 kali bila nomor atau token bentrok. Token 16 karakter memakai `buatKode` (alfabet kode akses, `crypto.randomInt`) dan dicari setelah `normalisasiKode` (tanpa beda huruf besar/kecil).
- **Terbitkan ulang** menerima (siswa, level) dan memakai post test lulus terbaru level itu. Tombolnya tampil di detail post test yang lulus, dan pada baris sertifikat yang terbit atau dibatalkan bila tidak ada lagi sertifikat terbit untuk pasangan itu. Bila tidak ada sertifikat terbit, `menggantikan_id` menunjuk sertifikat terbaru pasangan itu (bila ada).
- PDF: A4 lanskap satu halaman, dibuat setiap diunduh. Nama panjang dikecilkan 36 -> 18 pt lalu dipotong "...". Tanpa `public/aset/font/Nunito-*.ttf` dipakai Helvetica dengan peringatan sekali per proses; karakter di luar Windows-1252 menjadi `?`. Logo WebP tidak bisa dibaca pdfkit sehingga dilewati (PNG/JPEG tampil). Watermark "DIBATALKAN" untuk sertifikat dibatalkan (hanya pengelola yang bisa mengunduhnya).
- Halaman verifikasi `src/app/publik/verifikasi/[token]` memakai `BingkaiPengelola` (token area pengelola, netral). `src/proxy.js` menambah `Cache-Control: no-store` dan `X-Robots-Tag: noindex, nofollow` pada jalur `/verifikasi/*`; metadata halaman juga `noindex, nofollow`.
- Layar hasil post test siswa menampilkan "Sertifikatmu sudah diterbitkan!" bila ada sertifikat terbit (posttest usecase memanggil `sertifikatUsecase.adaTerbit`). Fungsi `salinTeks` di `TampilanKode.jsx` diekspor agar dipakai tombol Salin tautan verifikasi. Ikon baru `sertifikat` dan `tautan`; helper format `formatNilai`.
- Unduh PDF orang tua (`pdf-ortu`) sudah berfungsi lewat rute HTTP; tombolnya ditempatkan di rapor orang tua pada Fase F.

### Catatan teknis Fase F
- Modul baru `rapor` (agregator tanpa tabel dan tanpa model; memanggil usecase/model modul lain), `karya`, dan `ekspor` (modul tambahan di luar struktur acuan, khusus CSV). Halaman orang tua sekarang `src/modules/rapor/HalamanRapor.jsx`; placeholder lama `src/modules/layout/HalamanOrtu.jsx` tidak dihapus (sesuai aturan kerja) dan tidak dipakai lagi, sama seperti `HalamanBerandaSiswa`, `HalamanBerandaPengelola`, dan `HalamanAbsensiPlaceholder` di `src/modules/layout/`.
- Rapor orang tua: riwayat sesi dan pembayaran berpaginasi 10 per halaman di aplikasi (query `sesi`, `bayar`), karya 12 per halaman (`halaman`); total pembayaran dari semua catatan. Data diambil memakai `siswaId` dari cookie `dp_ortu`; bentuk data rapor dipangkas di usecase (tanpa ID tutor, nama pencatat pembayaran, soal/jawaban, kode akses). Sertifikat yang dibatalkan tidak ditampilkan ke orang tua.
- Akses baru `AKSES.LOGIN` (`login`): pengelola, siswa, atau orang tua yang masuk (pengelola didahulukan). Dipakai `GET /api/v1/karya/berkas`; usecase mengizinkan pengelola, atau siswa/orang tua bila `siswaId` sama dengan pemilik, selain itu 404.
- Karya: unggahan lewat route HTTP `POST /api/v1/karya` (multipart, akses siswa), karena Server Action punya batas body 1 MB. Ubah (judul/deskripsi) dan hapus lewat Server Action. Tipe berkas dideteksi dari byte awal (`deteksiTipeGambar`), nama berkas `tokenAcak()` 64 hex. Galeri siswa bisa dilihat kapan saja (menu Karya tidak terkunci tanpa sesi); tambah/ubah/hapus siswa butuh sesi berlangsung (409 bila tidak). Penambahan, perubahan, dan penghapusan karya dicatat ke log (siswa tercatat tanpa `pengguna_id`). Menghapus siswa (admin) juga menghapus berkas karyanya di `uploads/karya/<siswaId>/` beserta foldernya (keputusan developer): path dibaca di dalam transaksi hapus, berkas dihapus setelah commit; berkas yang gagal dihapus dicatat ke log server tanpa membatalkan penghapusan data.
- Ekspor: tombol per jenis di satu form GET (`formAction` ke `/api/v1/ekspor/<jenis>`), filter `level` (ID level), `dari`, `sampai`. Arti filter: siswa = level berjalan + tanggal daftar; kehadiran = level pertemuan + tanggal sesi; post test = level + tanggal mulai; pembayaran = level berjalan siswa + tanggal bayar. Angka desimal ditulis dengan titik; tanggal `YYYY-MM-DD` dan waktu `YYYY-MM-DD HH:MM`. Pencegahan CSV injection juga mencakup sel yang diawali tab/CR.
- Beranda pengelola tetap di modul `sesi`, datanya dari `raporController.beranda`; kartu pembayaran bulan ini hanya dihitung untuk admin. Penghitung baru: `posttestModel.jumlahTab`, `sertifikatModel.jumlahTerbitBulanIni`, `pembayaranModel.totalBulanIni` (bulan berjalan menurut `CURDATE()` database).
- `kelasTombol` dipindah ke `src/modules/shared/ui/kelasTombol.js` (tanpa `'use client'`) agar bisa dipakai server component; `Button.jsx` mengekspor ulang sehingga impor lama tetap berjalan.
- Header keamanan dipasang di `next.config.mjs` (`nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`). CSP tidak dipasang karena skrip tema inline butuh nonce/hash; dicatat di daftar periksa produksi README.
- Performa: `npm run data:uji-besar` (2.000 siswa, 20.000 sesi, 1.000 post test/sertifikat, 20.000 log; hapus dengan `--hapus`). `EXPLAIN` menunjukkan full scan + filesort pada daftar siswa, sesi berlangsung (dipakai lencana menu Absensi di setiap halaman), daftar sertifikat, post test menunggu, dan galeri karya. Ditambahkan indeks (perubahan skema yang dicatat, tanpa mengubah struktur tabel): `siswa(created_at)`, `sesi(status, jam_masuk)`, `post_test(status, nilai_total)`, `sertifikat(diterbitkan_at)`, `sertifikat(status, diterbitkan_at)`, `karya(created_at)`; di `schema.sql` untuk database baru dan `db:init` (`PEMBARUAN_INDEKS`) untuk database lama. Ekspor kehadiran rentang lebar tetap full scan karena hampir semua baris terbaca (wajar).
- Responsif dan tema: semua halaman ditelusuri otomatis pada 360/768/1280 px, terang dan gelap, dengan deteksi luapan mendatar; satu temuan (editor rubrik di Pengaturan meluap 50 px pada 360 px) diperbaiki.
- Daftar riwayat sesi dan pembayaran di detail siswa (pengelola) dan riwayat post test belum berpaginasi (data per siswa kecil); daftar utama (siswa, template, gambar, sertifikat, karya, log) berpaginasi, sesi berlangsung tanpa paginasi (selalu sedikit).

### Perbandingan fitur dengan dokumen ini (akhir Fase F)
- Sudah: level dan materi 3 level x 13 pertemuan; peran admin/tutor/siswa/orang tua dengan login dan rate limit; kode unik 8 karakter; alur sesi (absen masuk, Pulang, tutup oleh tutor, ganti device, satu kode satu PC, batas tidak aktif); penuntasan otomatis + pilihan tutor; status tugas belum/selesai/dilewati/diganti dan Ganti tugas; penilaian `otomatis_jawaban`/`dicek_tutor`; post test 15 butir 45 menit dengan bagian berbobot, kelulusan, syarat kehadiran dan pengecualian, lanjut setelah ganti device, tes ulang per bagian; bank soal template acak tanpa AI; aset gambar, puzzle, game mouse; tes mengetik bawaan (pelajaran bertahap, WPM/akurasi/konsistensi, heatmap, latihan adaptif, game, grafik); sertifikat PDF + QR + verifikasi publik + batal/terbit ulang; rapor orang tua; galeri karya; pembayaran manual tampil di halaman orang tua; ekspor data (CSV, bukan .xlsx); tema gelap/terang dan dua area; ConfirmDialog; Zippy.
- Belum: tes penempatan siswa baru; pengumuman dan jadwal untuk orang tua; gamifikasi (badge, poin); deploy, domain, SSL, cadangan terjadwal (ditunda).
- Diputuskan developer setelah Fase F: berkas karya ikut terhapus saat siswa dihapus; tes ulang post test tetap tidak dibatasi (tanpa batas jumlah dan tanpa jeda); tes penempatan belum dibangun (dibiarkan).
- Keputusan terbuka yang tersisa: ⚠ butir di bagian 12 yang belum dikonfirmasi eksplisit (login email+password, pemilihan pertemuan saat absen, mode penilaian per template) sudah dibangun sesuai usulannya.
