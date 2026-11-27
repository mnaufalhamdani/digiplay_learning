# DigiPlay Learning

Website les komputer anak berbasis level. Satu project Next.js (frontend + backend) yang melayani dua area:

- **Area siswa** (`HOST_SISWA`, lokal `siswa.localhost`): siswa dan orang tua masuk dengan kode unik 8 karakter.
- **Area pengelola** (`HOST_BACKOFFICE`, lokal `backoffice.localhost`): admin dan tutor masuk dengan email + password.

Keputusan produk ada di `.kiro/steering/project-context.md` (dimuat otomatis sebagai steering Kiro); urutan pengerjaan ada di `docs/prompt/PROMPT_BUILD_DIGIPLAY.md`.

## Prasyarat

- Node.js 20+ (diuji dengan Node 22)
- MySQL 8 atau MariaDB setara (diuji dengan MariaDB 11.8)

## Menjalankan secara lokal

1. `npm install`
2. Salin `.env.example` menjadi `.env`, lalu isi koneksi database dan `SESSION_SECRET`.
3. `npm run db:init` membuat database `digiplay_learning` dan 25 tabel dari `schema.sql` (bila sudah terpasang, hanya kolom baru yang ditambahkan).
4. `npm run admin:buat -- --email admin@contoh.com --nama "Nama Admin" --password "minimal8karakter"` membuat admin pertama. Tanpa argumen, skrip bertanya satu per satu. Di PowerShell, tulis pemisahnya dengan tanda kutip: `npm run admin:buat '--' --email ...`.
5. `npm run db:seed` memuat level, pertemuan, bagian post test, template, bank teks mengetik, dan gambar (aman dijalankan berulang).
6. `npm run siswa:uji` membuat (idempoten) siswa **Siswa Uji** dan mencetak kode siswa dan kode orang tua.
7. `npm run dev`, lalu buka:
   - `http://backoffice.localhost:3000` untuk admin/tutor
   - `http://siswa.localhost:3000` untuk siswa/orang tua

Chrome dan Firefox mengarahkan `*.localhost` ke komputer sendiri tanpa mengubah berkas hosts. Bila dibuka lewat `localhost` atau IP, pakai jalur cadangan `/backoffice/...` dan `/siswa/...`.

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm run start` | Build dan jalankan mode produksi |
| `npm run db:init` | Menjalankan `schema.sql` (satu-satunya skrip yang memakai `multipleStatements`). Bila skema sudah terpasang, hanya menambah tabel, kolom, nilai ENUM, dan indeks baru yang belum ada (tabel `materi`, `materi_baca`, dan `labirin_blockly`; `post_test.bagian_ulang` dan `hasil_latihan.labirin_id`; nilai `blockly` pada `template.tipe` dan `hasil_latihan.jenis`; indeks Fase F) tanpa mengubah data. Aman dijalankan berulang |
| `npm run db:seed` | Seed dari `seed/*.json` dan `docs/aset/prompt-gambar.csv` (lihat "Seed data master") |
| `npm run admin:buat` | Membuat akun admin; menolak email yang sudah ada |
| `npm run siswa:uji` | Data uji manual: satu siswa beserta kode siswa, kode orang tua, dan level berjalan (setelah `db:seed`) |
| `npm run data:uji-besar` | **Hanya database pengembangan.** Membuat 2.000 siswa "Uji Besar NNNN", 20.000 sesi, 1.000 post test dan sertifikat, 20.000 log untuk uji performa (`EXPLAIN`). Hapus lagi dengan `npm run data:uji-besar '--' --hapus` |

## Variabel `.env`

| Variabel | Keterangan |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | Koneksi database |
| `DB_NAME` | Nama database, `digiplay_learning` (sama dengan `schema.sql`) |
| `SERVER_ID` | 2 digit ID server aplikasi untuk pembuat ID; beda per instance |
| `SCRIPT_SERVER_ID` | ID server khusus skrip (bawaan 99) |
| `SESSION_SECRET` | Wajib, minimal 32 karakter. Aplikasi tidak mau start bila kosong/pendek. Buat dengan `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `HOST_SISWA`, `HOST_BACKOFFICE` | Hostname area **tanpa port**; saat produksi diganti domain asli |
| `JUMLAH_PROXY_TEPERCAYA` | Jumlah reverse proxy di depan aplikasi (bawaan 1). IP klien = entri `X-Forwarded-For` ke-N dari kanan |
| `UPLOAD_DIR` | Folder logo dan unggahan (bawaan `uploads`, tidak masuk git) |
| `URL_SISWA` | Alamat lengkap situs siswa: dicetak di kartu kode dan dipakai QR sertifikat (bawaan `http://siswa.localhost:3000`; produksi wajib domain asli dengan `https://`) |

## Seed data master

`npm run db:seed` membaca `seed/level-pertemuan.json`, `seed/template-level-{1,2,3}.json`, `seed/pelajaran-mengetik.json`, dan `docs/aset/prompt-gambar.csv`, lalu memindai `public/aset/gambar/<kode>/` untuk penanda `punya_mewarnai/berwarna/puzzle`.

- **Semua berkas divalidasi lebih dulu** (kode template unik, ENUM tipe/penilaian/sumber, total butir 15 dan bobot 100 per level, bagian yang dirujuk ada, dan `validasiTemplate` dengan 50 kali render). Bila ada galat, tidak ada yang ditulis.
- Penulisan dalam satu transaksi, dicocokkan dengan kunci unik (`level.kode`, `pertemuan level+nomor`, `bagian level+kode`, `template.kode`, `gambar.kode`; bank teks: `level+teks`). Upsert penuh: baris yang sudah ada **diperbarui dari berkas seed**, jadi perubahan admin lewat halaman Level/Template (termasuk template yang dinonaktifkan) kembali ke isi berkas seed setiap kali seed dijalankan. Penanda `punya_*` gambar selalu mengikuti berkas di disk.
- Ringkasan yang diharapkan: 3 level, 39 pertemuan, 14 bagian post test, 407 template, 48 teks mengetik, 12 pelajaran mengetik, 75 gambar.
- Labirin Coding Zippy: `seed/labirin-blockly.json` (7 labirin Level 1) di-upsert per `kode` ke `labirin_blockly`; semua kolom ikut **ditimpa** dari berkas seed setiap kali seed dijalankan. Tiap labirin diperiksa (bentuk grid, titik mulai/bintang, blok tersedia) dan `contoh_solusi`-nya harus berhasil di penerjemah; nama labirin yang dirujuk template `blockly` harus ada. Berkas hilang atau kosong hanya memberi peringatan.
- Materi pertemuan: `seed/materi-level-{1,2,3}.json` ikut dimuat (lihat "Fitur materi pertemuan"). Berkas yang belum ada dilewati dengan peringatan jumlah materi yang dimuat, bukan galat.
- Skrip memakai utilitas aplikasi di `src/utils/` lewat `node --import ./scripts/_alias.mjs` (menerjemahkan alias `@/` dan impor JSON).

## Domain dan reverse proxy

- `src/proxy.js` membaca header `Host`: host siswa ditulis ulang ke `src/app/siswa`, host backoffice ke `src/app/backoffice`. Akses silang (`/backoffice` di host siswa dan sebaliknya) dijawab 404. `/api`, `/_next`, `/aset`, dan berkas statis tidak ditulis ulang. `/verifikasi/*` dipetakan ke `/publik/verifikasi/*` di kedua host (halaman verifikasi sertifikat).
- Cookie sesi (`dp_bo`, `dp_siswa`, `dp_ortu`) tanpa atribut `Domain`, sehingga tidak terkirim ke host lain. Atribut `secure` aktif di produksi, jadi produksi harus memakai HTTPS.
- `dp_siswa` bertahan 12 jam walau browser ditutup, jadi siswa yang tidak sengaja menutup browser langsung masuk lagi di browser yang sama tanpa kode. Login perangkat tetap berakhir lebih cepat lewat Ganti device, Pulang, Keluar, ditutup tutor, atau batas tidak aktif (bawaan 5 menit); setelah itu cookie tidak berlaku dan siswa memasukkan kode lagi.
- Di belakang reverse proxy, teruskan header `Host` apa adanya (atau `X-Forwarded-Host`). `serverActions.allowedOrigins` di `next.config.mjs` dibentuk dari `HOST_SISWA` dan `HOST_BACKOFFICE` (dengan dan tanpa port `PORT`, bawaan 3000).

### IP klien untuk pembatas percobaan login

Pembatas percobaan login (5 gagal backoffice, 10 gagal kode, per IP per 15 menit) membaca IP dari `X-Forwarded-For` **dari kanan**. Entri ke-`JUMLAH_PROXY_TEPERCAYA` dari kanan adalah alamat yang dicatat proxy kita sendiri; entri di kirinya bisa dikirim klien sehingga tidak dipercaya.

- Produksi **wajib** di belakang reverse proxy. Tanpa proxy, klien bisa mengirim `X-Forwarded-For` palsu, karena Next.js hanya mengisi header ini bila klien tidak mengirimnya.
- Satu lapis nginx (`JUMLAH_PROXY_TEPERCAYA=1`), pilih salah satu:

  ```nginx
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # menambah IP klien di belakang
  # atau: proxy_set_header X-Forwarded-For $remote_addr;         # menimpa dengan IP klien saja
  ```

- Dua lapis (misal Cloudflare lalu nginx dengan `$proxy_add_x_forwarded_for`): isi `JUMLAH_PROXY_TEPERCAYA=2`.
- Saat pengembangan lokal tanpa proxy, nilai bawaan 1 sudah cukup.

## Struktur

```
src/
  proxy.js                    pengarah domain
  app/                        routing tipis (siswa/, backoffice/, api/v1/[[...segmen]])
  config/                     database.js, keamanan.config.js, area.config.js
  di/container.js             DI (awilix), disimpan di globalThis saat dev
  enums/  locales/id_ID.json  logger/  middlewares/routeHandler.js  utils/
  modules/
    <modul>/                  model.js (SQL) -> usecase.ts -> controller.ts, schema.js, actions.js, routes.js, *.jsx
    layout/                   ShellSiswa, ShellPengelola, menu, halaman placeholder lama (tidak dipakai lagi)
    shared/ui/                Button, TextField, TextArea, Select, Card, Badge, Modal, ConfirmDialog, Toast, Ikon, ThemeToggle,
                              TabelResponsif, Paginasi, FormFilter, EmptyState, TautanTombol, Tabs, ProgressBar, kelasTombol.js
    shared/ui/domain/         KolomKode, Maskot, StatusSesi, OpsiJawaban, Konfeti, GrafikKemajuan, Pewaktu
scripts/                      db-init, db-seed, admin-buat, siswa-uji, data-uji-besar, _alias, _koneksi, _idGen (+ gabung-mewarnai)
uploads/                      logo/, tandatangan/ dan karya/<siswaId>/ (tidak masuk git; wajib ikut dicadangkan)
```

Utilitas template (fungsi murni, dipakai ulang di Fase C dan D): `src/utils/evaluasiEkspresi.js` (pengurai ekspresi sendiri, tanpa `eval`), `src/utils/templateRender.js` (`renderTemplate`, `periksaJawaban`, `uraiAngka`, `jawabanHarapan`), `src/utils/templateValidasi.js` (`validasiTemplate`), `src/utils/json.js` (`uraiJson` untuk kolom JSON MariaDB/MySQL).

## Modul yang sudah ada (Fase A)

| Modul | Isi |
|---|---|
| `health` | `GET /api/v1/health` (publik): cek koneksi database |
| `log` | `catatAktivitas` (lewat DI) untuk mencatat aksi penting ke `log_aktivitas` |
| `pengaturan` | Halaman Pengaturan (admin), cache 30 detik, unggah logo `POST /api/v1/pengaturan/logo`, sajikan logo `GET /api/v1/pengaturan/logo` |
| `pengguna` | Halaman Pengguna (admin: tambah, ubah, aktif/nonaktif, reset password) dan Akun (ubah password sendiri) |
| `auth` | Login backoffice, login kode siswa/orang tua, satu kode satu perangkat, batas tidak aktif, Ganti device, Keluar, `POST /api/v1/auth/ping` |
| `layout` | Kerangka kedua area, menu sesuai peran, ping sesi tiap 15 detik |

Batas keamanan (percobaan login, masa cookie, interval ping) ada di `src/config/keamanan.config.js`.

## Modul Fase B

| Modul | Halaman (backoffice) | Isi |
|---|---|---|
| `siswa` | `/data-siswa`, `/data-siswa/[id]`, `/kartu-kode/[id]` | Daftar (cari, filter status/level, paginasi), tambah siswa + kode siswa + kode orang tua + level awal dalam satu transaksi, salin dan cetak kartu kode, ganti kode, ganti level, aktif/nonaktif, hapus (admin, ketik nama) |
| `level` | `/level` | Level -> 13 pertemuan -> jumlah template; admin mengubah level, pertemuan, dan bagian post test (peringatan bila total bobot bukan 100 atau butir bukan 15) |
| `template` | `/template`, `/template/[id]`, `/template/baru`, `/template/[id]/ubah` | Daftar dengan filter dan pencarian, detail, pratinjau 5 contoh render beserta jawaban, tambah/ubah (admin) yang hanya tersimpan bila `validasiTemplate` lulus; tanpa hapus |
| `gambar` | `/gambar`, `/gambar/[id]` | Kartu subjek dengan filter kategori/kelengkapan, detail empat berkas, aktif/nonaktif dan **Pindai ulang berkas** (admin) |
| `log` | `/log` | Log aktivitas (admin) dengan filter aksi, entitas, pengguna, tanggal, dan paginasi |

## Modul Fase C

| Modul | Halaman / endpoint | Isi |
|---|---|---|
| `sesi` | Backoffice `/absensi`, `/absensi/[sesiId]`, beranda; siswa `/` dan `/sampai-jumpa` | Absen masuk dua langkah (cek kode -> pertemuan, tutor tambahan, pembayaran), sesi berlangsung, Ikut menangani, Tutup sesi, Pulang, catatan per tutor, penuntasan (otomatis/tutor, Kembali ke otomatis), pengecualian kehadiran post test, riwayat dan kehadiran di detail siswa, lencana jumlah sesi di menu Absensi |
| `tugas` | `GET /api/v1/tugas/unduh?tugasId=&kode=` (siswa) | Generate tugas saat absen (`jumlah_tugas_per_sesi`, minimal sepertiga per jenis penilaian), jawaban otomatis pilihan ganda/Excel, Ganti tugas, Lewati, ubah status oleh tutor, penuntasan otomatis, tombol **Unduh bahan** (`mewarnai.png`/`berwarna.png`) di dalam kartu tugas |
| `pembayaran` | Detail sesi dan tab Pembayaran di detail siswa | Catat (jumlah dan/atau keterangan), daftar, hapus (admin), tampilan `Rp15.000` |

- `POST /api/v1/auth/ping` kini membalas `sesiAktifId`; beranda siswa memuat ulang sendiri bila nilainya berubah (tutor mengabsen). Interval ping 15 detik (`intervalPingDetik` di `keamanan.config.js`), jadi perubahan tampil paling lambat sekitar 15 detik atau saat tab kembali terlihat. Setelah tutor menutup sesi, login siswa berakhir dan siswa diarahkan ke halaman masuk.
- Pengaturan baru **Jumlah tugas per sesi** (bawaan 6, 1-20) di halaman Pengaturan; kuncinya disisipkan oleh `npm run db:seed` (`INSERT IGNORE`).
- `npm run siswa:uji` sekarang juga memastikan Siswa Uji punya level berjalan (level pertama) agar bisa diabsen.

- Halaman siswa di backoffice memakai `/data-siswa`, bukan `/siswa`: di host backoffice semua jalur `/siswa/*` dianggap akses silang ke area siswa dan dijawab 404 oleh `src/proxy.js`.
- Menu **Absensi** masih placeholder sampai Fase C. Item Pengaturan, Pengguna, dan Log hanya tampil untuk admin.

## Modul Fase D1 (latihan)

| Modul | Halaman (siswa) | Isi |
|---|---|---|
| `mengetik` | `/mengetik`, `/mengetik/kemajuan` | 12 pelajaran bertahap per baris keyboard (pelajaran berikutnya terbuka setelah target WPM dan akurasi tercapai), latihan adaptif dari tombol yang sering salah, teks acak dari `bank_teks_mengetik`, game **Hujan Kata**, keyboard visual, WPM + akurasi + konsistensi, peta panas tombol salah, grafik perkembangan |
| `latihan` | `/latihan-mouse`, `/puzzle` | Lima game mouse (klik balon, klik ganda kotak, drag ke keranjang, klik kanan, gulung) dan puzzle 2x2/2x3/3x3 dari `puzzle.png`; hasil tersimpan di `hasil_latihan`. Tab **Latihan** di detail siswa (backoffice) |

- Halaman latihan bisa dibuka kapan saja, tetapi hasil hanya disimpan saat sesi aktif (di luar sesi tampil "lihat saja"). Menu latihan di header siswa aktif hanya selama sesi berlangsung.
- Tugas sesi bertipe mengetik, game mouse, dan puzzle **selesai otomatis** bila hasil memenuhi target (`min_wpm`/`min_akurasi`, `min_skor`, gambar dan jumlah keping yang sama). Tombol **Main**/**Kerjakan** di kartu tugas membuka halaman latihannya dengan tugas itu.
- Tugas bertipe `blockly` (Coding Zippy, lihat "Fitur Coding Zippy") dinilai otomatis dari tabel `hasil_latihan` (`kunci.jenis` = `blockly`, `kunci.labirin` = **nama** labirin yang berhasil diselesaikan) dan memakai `penilaian` `otomatis_jawaban` seperti `game_mouse` dan `puzzle`. Tombol **Kerjakan** di kartu tugas langsung membuka labirin yang diminta.
- Server menghitung ulang WPM dan akurasi, dan menolak hasil yang tidak wajar (WPM > 250, durasi < 3 detik, karakter benar > karakter diketik, skor game > 5 per detik). Batasnya di `BATAS_LATIHAN` (`src/enums/index.js`).

## Modul Fase D2 (post test)

| Modul | Halaman / endpoint | Isi |
|---|---|---|
| `posttest` | Siswa `/post-test`; backoffice `/post-test`, `/post-test/[id]`; `POST /api/v1/posttest/denyut` dan `GET /api/v1/posttest/unduh?tugasId=&kode=` (siswa) | Tombol **Mulai Post Test** di beranda siswa saat sesi pertemuan 13 aktif, 15 butir (1 tes mengetik + butir acak bagian B/C/D dari bank), pewaktu 45 menit, lanjut setelah ganti device dengan sisa waktu yang sama, kumpulkan (manual atau otomatis saat waktu habis), penilaian per bagian dan total, penilaian butir praktik oleh tutor (skor 0 sampai skor rubrik, catatan) dan tombol **Finalisasi**, kelulusan, **Buka tes ulang** per bagian, tab **Post test** di detail siswa |
| `sertifikat` | Lihat Fase E | Dipanggil saat finalisasi post test lulus (`terbitkanOtomatis`) |

- Layar post test memakai `ShellSiswa mode="fokus"` (tanpa menu, ping sesi tetap berjalan). Kunci jawaban tidak pernah dikirim ke browser.
- Waktu dihitung server: tiap denyut (15 detik) menambah paling banyak 30 detik. Membuka halaman lagi setelah ganti device mengatur ulang titik hitung, sehingga waktu saat tidak login tidak terpakai.
- Bagian mengetik dinilai saat tes mengetik dikirim (sekali saja, teks tetap untuk satu percobaan). Saat dikumpulkan, bagian pilihan ganda = benar / jumlah soal x 100, butir kosong dihitung salah, tes mengetik yang belum dikerjakan bernilai 0. Bagian praktik menunggu penilaian tutor per butir (skor 0 sampai jumlah poin rubrik, catatan opsional; boleh saat siswa menandai "siap dinilai" atau setelah dikumpulkan). Tombol **Finalisasi** aktif bila semua butir praktik sudah dinilai: nilai bagian praktik = rata-rata skor butir (skala 0-100), lalu total dan kelulusan dihitung (batas di Pengaturan, bawaan total >= 70 dan tiap bagian >= 50).
- Tes ulang hanya untuk percobaan terakhir yang sudah dinilai dan belum lulus. Bagian yang diulang disimpan di `post_test.bagian_ulang`. Nilai bagian yang tidak diulang disalin; butir dan waktu hanya untuk bagian yang diulang, pewaktu mulai saat siswa menekan Mulai.
- Lulus tidak mengubah level siswa secara otomatis. Tutor menaikkan level lewat **Ganti level** di detail siswa: kode siswa dan kode orang tua tetap, level lama tercatat **Lulus** (atau **Berhenti** bila post test-nya belum lulus), lalu level baru dimulai.
- **Rubrik bawaan** tugas praktik (pengaturan `rubrik_bawaan`) diubah admin di halaman Pengaturan: 1-10 kriteria, total poin tepat 100. Rubrik ini tampil di detail sesi dan detail post test untuk template tanpa `kunci.rubrik`. Nilai awalnya dari `rubrik_default` berkas seed; `npm run db:seed` hanya menyisipkannya bila belum ada (`INSERT IGNORE`), jadi perubahan admin tidak tertimpa.
- Database yang dibuat sebelum Fase D2: jalankan `npm run db:init` sekali (menambah `post_test.bagian_ulang`) lalu `npm run db:seed` (menyisipkan `rubrik_bawaan`).

## Modul Fase E (sertifikat)

| Modul | Halaman / endpoint | Isi |
|---|---|---|
| `sertifikat` | Backoffice `/sertifikat`; tab **Sertifikat** di detail siswa; kartu Sertifikat di detail post test; publik `/verifikasi/<token>` (kedua host); `GET /api/v1/sertifikat/pdf?id=` (pengelola), `GET /api/v1/sertifikat/pdf-ortu?id=` (orang tua) | Terbit otomatis saat post test lulus, nomor `DPL-<kode level>-<YYYYMM>-<urut>`, token verifikasi 16 karakter, **Batalkan** (alasan wajib), **Terbitkan ulang** (yang lama otomatis dibatalkan), PDF A4 lanskap dengan QR, halaman verifikasi Sah / Dibatalkan / Tidak ditemukan |

- Dependensi baru: `pdfkit` 0.21.0 dan `qrcode` 1.5.4 (dipin, dijalankan native lewat `serverExternalPackages`).
- Pengaturan baru **Nama penandatangan** dan **Jabatan penandatangan** (maks. 100 karakter, boleh kosong). Database lama: jalankan `npm run db:seed` sekali untuk menyisipkan kuncinya (`INSERT IGNORE`).
- PDF dibuat setiap diunduh dari snapshot di tabel `sertifikat` (nama siswa, nama level, nilai saat terbit) dan tidak disimpan di disk. Logo dari Pengaturan ikut tampil bila PNG/JPEG (pdfkit tidak bisa membaca WebP; logo WebP dilewati). Zippy diambil dari `public/aset/maskot/zippy-merayakan.png`.
- Font PDF: taruh `Nunito-Regular.ttf` dan `Nunito-Bold.ttf` (opsional `Fredoka-SemiBold.ttf`) di `public/aset/font/`. Tanpa berkas itu PDF memakai Helvetica bawaan, peringatan dicatat satu kali di log server, dan karakter di luar Windows-1252 (mis. emoji) diganti `?`.
- QR berisi `URL_SISWA/verifikasi/<token>`, jadi `URL_SISWA` di `.env` produksi wajib berisi domain asli.
- Penerbitan otomatis berjalan di SAVEPOINT dalam transaksi finalisasi: bila gagal, hanya penerbitan yang dibatalkan, nilai post test tetap tersimpan, kegagalan dicatat (`gagal_terbit_sertifikat` di Log), dan detail post test menampilkan peringatan dengan tombol **Terbitkan ulang**.
- Orang tua hanya bisa mengunduh sertifikat **terbit** milik anaknya; selain itu 404. Halaman verifikasi tanpa login, `noindex, nofollow` (meta dan header `X-Robots-Tag`), `Cache-Control: no-store`, tanpa tombol unduh.
## Cara uji Fase A

1. **Backoffice** (`http://backoffice.localhost:3000`): masuk sebagai admin. Di **Pengaturan**, ubah nama pelatihan lalu simpan; nama baru tampil di header dan judul tab kedua area.
2. Di **Pengguna**, buat akun tutor. Masuk sebagai tutor di browser lain/jendela privat: menu Pengaturan dan Pengguna tidak tampil dan alamatnya menjawab 404.
3. Nonaktifkan tutor dari akun admin; muat ulang halaman tutor, tutor langsung kembali ke halaman masuk dan tidak bisa masuk lagi.
4. Masukkan password salah 5 kali: percobaan ke-5 menampilkan "Terlalu banyak percobaan. Coba lagi nanti." (berlaku 15 menit per IP).
5. `http://siswa.localhost:3000/backoffice` dan `http://backoffice.localhost:3000/siswa/masuk` menjawab 404.
6. **Siswa** (`http://siswa.localhost:3000`): masuk dengan kode siswa dari `npm run siswa:uji`. Kode yang sama di browser lain ditolak ("Kodemu sedang dipakai di perangkat lain..."). Tekan **Ganti device** di browser pertama, lalu masuk di browser kedua berhasil.
7. **Batas tidak aktif**: ubah "Batas tidak aktif" menjadi 1 menit, masuk sebagai siswa, lalu tutup atau sembunyikan tab (ping hanya berjalan saat tab terlihat) lebih dari 1 menit. Saat dibuka lagi, siswa diarahkan ke halaman masuk. Kembalikan ke 5 menit setelah uji.
8. Kode orang tua membuka halaman `/ortu`. Kode acak menampilkan "Kode tidak dikenali"; huruf O/I atau angka 0/1 ditolak dengan pesan khusus.
9. Tombol tema di header berfungsi di semua halaman; pilihan tersimpan per domain.
10. `GET http://localhost:3000/api/v1/health` menjawab `{"success":true,...}`.

## Cara uji Fase B

1. `npm run db:seed` dua kali: angka ringkasan sama (`baru 0` pada jalan kedua) dan semuanya `OK`.
2. Admin membuka **Template**, memfilter (mis. Tipe Excel, Level L2), membuka `L2-P08-EX-02`, lalu menekan **Contoh hasil**: lima soal acak dengan jawaban yang sesuai rata-rata angka di soal.
3. Di **Ubah**, tambahkan `{zzz}` ke teks lalu simpan: ditolak dengan "Penanda {zzz} tidak punya parameter." Kembalikan teksnya lalu simpan: tersimpan. Parameter yang bukan JSON ditolak di kolomnya.
4. Masuk sebagai tutor: tambah siswa di **Siswa**; kedua kode tampil dengan tombol **Salin** dan **Cetak kartu kode**. Masuk di `http://siswa.localhost:3000` dengan kode siswa baru.
5. Di detail siswa, **Ganti kode siswa**: kode lama ditolak ("Kode tidak dikenali") dan login siswa yang sedang aktif berakhir. **Ganti kode orang tua** membuat cookie orang tua lama tidak berlaku. **Ganti level** menandai level lama berhenti dan membuka level baru.
6. Tombol **Hapus siswa** tidak tampil untuk tutor (action-nya juga menolak dengan 403). Admin menghapus dengan mengetik nama siswa; semua data siswa itu hilang tanpa galat foreign key.
7. **Level dan Materi**: ubah bobot satu bagian, peringatan total muncul; kembalikan, peringatan hilang. Tutor hanya melihat.
8. **Gambar**: filter "Belum lengkap", buka detail, nonaktifkan/aktifkan, dan **Pindai ulang berkas**. **Log** menampilkan semua aksi di atas.
9. Periksa semua halaman di lebar HP dan mode gelap.

## Cara uji Fase C

1. `npm run db:seed` lalu `npm run siswa:uji` (mencetak kode siswa, kode orang tua, dan level berjalan).
2. Siswa masuk di `http://siswa.localhost:3000` dengan kode siswa: beranda "Belum absen", menu latihan bergembok.
3. Tutor membuka **Absensi** (`http://backoffice.localhost:3000/absensi`, nyaman di lebar HP), memasukkan kode orang tua -> "Ini kode orang tua, masukkan kode siswa". Masukkan kode siswa -> **Cek kode** -> pilih pertemuan (bawaan pertemuan berikutnya), opsional tutor lain dan pembayaran -> **Absen masuk**. Sesi muncul di Sesi berlangsung dan menu Absensi berlencana.
4. Dalam sekitar 15 detik (atau saat tab siswa kembali terlihat) beranda siswa berubah sendiri menjadi daftar tugas (6 tugas atau sesuai pengaturan).
5. Pilihan ganda: jawaban salah -> "Belum tepat. Ayo coba lagi!", jawaban benar -> tugas selesai. Excel (mis. Level 2 pertemuan 8) menerima `15,5` dan `15.5`, dan `15.000` dibaca sebagai lima belas ribu. Tugas dicek tutor menampilkan "Menunggu dicek tutor". Coba **Ganti tugas**, **Lewati**, dan **Unduh** bahan gambar.
6. Di detail sesi tutor menandai tugas dicek tutor selesai, mengubah penuntasan (sumber "tutor") lalu **Kembali ke otomatis**, menulis catatan. Tutor lain menekan **Ikut menangani** dulu, lalu catatannya tersimpan terpisah.
7. Absen kedua untuk siswa yang sama ditolak dengan tombol **Tutup sesi itu**. Absen pertemuan 13 dengan kehadiran kurang ditolak ("Kehadiran n dari 12, butuh 9") dengan tombol **Izinkan pengecualian**.
8. Siswa menekan **Pulang** -> halaman "Sampai jumpa"; atau tutor menekan **Tutup sesi** -> login siswa berakhir. Keduanya mengisi jam pulang dan penuntasan otomatis; menutup dua kali tidak error.
9. Detail siswa: tab **Riwayat** (kehadiran n dari 12 dan status syarat post test) dan tab **Pembayaran** (hapus hanya admin).

## Cara uji Fase D1

1. `npm run db:seed`: ringkasan menampilkan 12 pelajaran mengetik.
2. Siswa masuk tanpa sesi: **Mengetik**, **Latihan mouse**, dan **Puzzle** bisa dibuka dalam mode lihat saja (hasil tidak disimpan). *(Diganti aturan game bertahap, lihat bagian "Game siswa terbuka bertahap": hanya Puzzle yang terbuka sejak awal.)*
3. Tutor mengabsen siswa (mis. Level 1 pertemuan 2 atau 3). Di **Mengetik**, selesaikan pelajaran 1 sesuai target: pelajaran 2 terbuka. Coba latihan adaptif, teks acak, dan Hujan Kata; buka **Kemajuan** untuk grafik dan peta panas.
4. Kartu tugas game mouse/puzzle/mengetik menampilkan **Main**/**Kerjakan**. Mencapai target menandai tugas selesai otomatis; skor di bawah target menampilkan "hampir" dan tugas tetap belum selesai.
5. Backoffice, detail siswa, tab **Latihan**: hasil mengetik dan game tercatat.

## Cara uji Fase D2

1. Tutor mengabsen siswa pada pertemuan 13 (gunakan **Izinkan pengecualian** bila kehadiran kurang). Beranda siswa menampilkan **Mulai Post Test**.
2. Mulai: 15 butir (A mengetik, B 10 pilihan ganda, C 2, D 2) dan pewaktu 45 menit. Menekan Mulai lagi hanya melanjutkan.
3. Jawab pilihan ganda, kerjakan tes mengetik (hanya sekali), tandai butir praktik "Sudah selesai". Tekan **Ganti device**, masuk di browser lain: tes berlanjut dengan sisa waktu yang sama.
4. **Kumpulkan**: siswa melihat "sedang diperiksa". Backoffice **Post test** -> detail: nilai A dan B otomatis (tidak bisa diubah), isi nilai C dan D dengan rubrik. Total dan status lulus muncul setelah semua bagian terisi.
5. Bila ada bagian di bawah 50: **Buka tes ulang** untuk bagian itu. Siswa melihat tes ulang di beranda, pewaktu mulai saat Mulai; bila waktu habis, tes terkumpul otomatis. Setelah lulus, Mulai ditolak dan level siswa tidak berubah.
6. Detail siswa, tab **Post test**: daftar percobaan dan nilainya.
7. Setelah lulus, tutor membuka detail siswa -> **Ganti level** ke level berikutnya. Riwayat level menampilkan level lama **Lulus**, dan siswa tetap masuk dengan kode yang sama.
8. Admin membuka **Pengaturan** -> **Rubrik bawaan tugas praktik**: total poin selain 100 atau kriteria kosong ditolak di kolomnya. Simpan rubrik baru, lalu buka detail sesi yang punya tugas dicek tutor (mis. pertemuan 6): rubrik baru tampil.

## Cara uji Fase E

1. `npm run db:seed` (database lama) lalu admin membuka **Pengaturan** -> kelompok **Sertifikat**: isi nama dan jabatan penandatangan, simpan. Teks lebih dari 100 karakter ditolak di kolomnya.
2. Selesaikan post test siswa sampai lulus (Cara uji Fase D2). Begitu tutor menekan **Finalisasi** (setelah semua butir praktik dinilai), detail post test menampilkan kartu **Sertifikat** berstatus **Terbit** dengan nomor `DPL-L1-<YYYYMM>-0001`. Menyimpan ulang nilai tidak membuat sertifikat kedua.
3. Menu **Sertifikat**: filter status/level dan cari nama atau nomor. **Unduh PDF** menghasilkan `sertifikat-<nomor>.pdf` A4 lanskap; pindai QR dengan HP (HP harus bisa membuka `URL_SISWA`) atau tekan **Salin tautan verifikasi** lalu buka di browser: halaman **Sah** dengan nomor, nama, level, nilai, tanggal, dan penerbit.
4. **Batalkan**: tombol Ya mati sampai alasan diisi. Setelah dibatalkan, halaman verifikasi menampilkan **Dibatalkan** dan nomor saja, dan PDF dari backoffice bertanda watermark DIBATALKAN. Token acak (`/verifikasi/ABCDEFGHJKLMNPQR`) menampilkan **Tidak ditemukan**.
5. Ubah nama siswa langsung di database (belum ada form ubah nama), lalu **Terbitkan ulang**: sertifikat lama otomatis dibatalkan dengan alasan "Diterbitkan ulang", sertifikat baru mendapat nomor dan token baru, dan PDF-nya memakai nama baru. Tab **Sertifikat** di detail siswa menampilkan keduanya beserta "Menggantikan ...".
6. Orang tua: masuk dengan kode orang tua di area siswa, lalu buka `http://siswa.localhost:3000/api/v1/sertifikat/pdf-ortu?id=<id sertifikat>`. Milik anaknya terunduh; sertifikat anak lain atau yang dibatalkan menjawab 404. (Tombolnya ada di rapor orang tua, Fase F.)
7. Simulasi gagal terbit: di database jalankan `RENAME TABLE sertifikat TO sertifikat_x`, simpan nilai terakhir post test lain yang lulus, lalu `RENAME TABLE sertifikat_x TO sertifikat`. Nilai dan status lulus tetap tersimpan, Log berisi `gagal_terbit_sertifikat`, dan detail post test menampilkan **Gagal terbit** dengan peringatan. **Terbitkan ulang** menerbitkannya.
8. Layar hasil post test siswa yang lulus menampilkan "Sertifikatmu sudah diterbitkan!" tanpa tombol unduh.

## Modul Fase F (orang tua dan pelengkap)

| Modul | Halaman / endpoint | Isi |
|---|---|---|
| `rapor` | Siswa `/ortu` (kode orang tua); beranda backoffice `/` | Agregator tanpa tabel: rapor orang tua (ringkasan kehadiran, riwayat sesi dengan catatan tutor dan nama penulisnya, post test tanpa soal/jawaban, perkembangan mengetik, pembayaran dan totalnya, sertifikat terbit dengan Unduh PDF dan Cek keaslian, karya) dan kartu ringkas beranda pengelola |
| `karya` | Siswa `/karya`; backoffice `/karya` dan tab **Karya** di detail siswa; `POST /api/v1/karya` (siswa, multipart), `GET /api/v1/karya/berkas?id=` (pengelola, siswa pemilik, orang tua pemilik) | Galeri karya berupa tautan (http/https saja, tanpa kredensial, tampil ikon dan domain, dibuka `rel="noopener noreferrer nofollow"`) atau gambar PNG/JPEG/WebP maks 3 MB (tipe diperiksa dari byte awal). Tambah/ubah/hapus siswa hanya saat sesi berlangsung; admin/tutor menghapus karya mana pun |
| `ekspor` | Backoffice `/ekspor`; `GET /api/v1/ekspor/{siswa,kehadiran,post-test,pembayaran}?level=&dari=&sampai=` | CSV UTF-8 dengan BOM, pemisah koma, judul kolom bahasa Indonesia, maks 50.000 baris, tanpa kode akses, sel teks berawalan `=`, `+`, `-`, `@` (juga tab/CR) diberi apostrof. Setiap ekspor dicatat ke Log |

- Rapor orang tua: semua kueri memakai `siswaId` dari cookie `dp_ortu`; riwayat sesi dan pembayaran berpaginasi 10 per halaman (query `sesi`, `bayar`), karya 12 per halaman (`halaman`). Tidak ada tombol yang mengubah data dan kode akses tidak pernah ditampilkan.
- Detail sesi backoffice memberi petunjuk di kolom catatan: "Catatan ini dapat dibaca orang tua."
- Beranda backoffice: siswa aktif, sesi berlangsung, post test menunggu penilaian, sertifikat terbit bulan ini; **total pembayaran bulan ini hanya untuk admin** (tidak dihitung untuk tutor).
- Berkas karya disimpan di `UPLOAD_DIR/karya/<siswaId>/<nama acak>.<ext>`; disajikan dengan `Content-Type` dari isi berkas, `X-Content-Type-Options: nosniff`, `Cache-Control: private`. Menghapus karya ikut menghapus berkasnya; menghapus siswa (admin) juga menghapus semua berkas karyanya dan folder `karya/<siswaId>/`. Server tidak pernah mengambil isi situs tautan.
- Akses route baru `login` (pengelola, siswa, atau orang tua yang masuk) dipakai rute berkas karya; kepemilikan diperiksa di usecase dan penolakan dijawab 404.
- Header keamanan di `next.config.mjs` untuk semua respons: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. CSP belum dipasang (lihat daftar periksa produksi).
- Indeks baru hasil `EXPLAIN` pada data uji besar: `siswa(created_at)`, `sesi(status, jam_masuk)`, `post_test(status, nilai_total)`, `sertifikat(diterbitkan_at)`, `sertifikat(status, diterbitkan_at)`, `karya(created_at)`. Database lama mendapatkannya lewat `npm run db:init`.

## Matriks akses

Kolom: **P** = publik, **A** = admin, **T** = tutor, **S** = siswa (login perangkat aktif), **O** = orang tua. ✓ boleh, – ditolak (halaman: dialihkan ke halaman masuk atau 404; route/action: 401/403/404).

| Halaman / route / action | P | A | T | S | O | Catatan |
|---|---|---|---|---|---|---|
| Backoffice `/masuk` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Backoffice `/`, `/absensi`, `/absensi/[id]`, `/data-siswa`, `/data-siswa/[id]`, `/kartu-kode/[id]`, `/level`, `/template`, `/template/[id]`, `/gambar`, `/gambar/[id]`, `/post-test`, `/post-test/[id]`, `/sertifikat`, `/karya`, `/ekspor`, `/akun` | – | ✓ | ✓ | – | – | `wajibPengguna`; kartu pembayaran beranda hanya admin |
| Backoffice `/pengaturan`, `/pengguna`, `/log`, `/template/baru`, `/template/[id]/ubah` | – | ✓ | – | – | – | tutor mendapat 404 |
| Siswa `/masuk`, `/sampai-jumpa` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Siswa `/`, `/mengetik`, `/mengetik/kemajuan`, `/latihan-mouse`, `/puzzle`, `/karya`, `/post-test` | – | – | – | ✓ | – | `wajibSiswa`; tanpa sesi berlangsung hanya lihat saja (`/bahan` sudah dihapus; unduhan ada di kartu tugas) |
| Siswa `/ortu` | – | – | – | – | ✓ | `wajibOrtu`; data dibatasi `siswaId` cookie |
| `/verifikasi/[token]` (kedua host) | ✓ | ✓ | ✓ | ✓ | ✓ | noindex, no-store, data terbatas |
| `GET /api/v1/health`, `GET /api/v1/pengaturan/logo` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `POST /api/v1/pengaturan/logo` | – | ✓ | – | – | – | |
| `GET /api/v1/pengaturan/tanda-tangan` | – | ✓ | ✓ | – | – | pratinjau di Pengaturan; tidak publik |
| `POST /api/v1/pengaturan/tanda-tangan` | – | ✓ | – | – | – | PNG saja, maksimal 500 KB |
| `POST /api/v1/auth/ping`, `POST /api/v1/posttest/denyut`, `GET /api/v1/tugas/unduh` | – | – | – | ✓ | – | data milik siswa pada login; tugas siswa lain 404 |
| `POST /api/v1/karya` | – | – | – | ✓ | – | hanya saat sesi berlangsung |
| `GET /api/v1/karya/berkas` | – | ✓ | ✓ | pemilik | pemilik | selain pemilik 404 |
| `GET /api/v1/sertifikat/pdf` | – | ✓ | ✓ | – | – | termasuk yang dibatalkan (watermark) |
| `GET /api/v1/sertifikat/pdf-ortu` | – | – | – | – | pemilik | hanya terbit milik anaknya, selain itu 404 |
| `GET /api/v1/ekspor/*` | – | ✓ | ✓ | – | – | dicatat ke Log |
| Actions `auth.*` (masuk, keluar, ganti device) | ✓ | ✓ | ✓ | ✓ | ✓ | hanya memengaruhi cookie pemanggil |
| Actions pengaturan, pengguna (kecuali ubah password sendiri), level, gambar, template tambah/ubah, hapus siswa, hapus pembayaran | – | ✓ | – | – | – | `wajibAkses(ADMIN)` |
| Actions siswa (tambah, ganti kode/level, aktif), sesi tutor, tugas tutor, pembayaran tambah, nilai/tes ulang post test, sertifikat batal/terbit ulang, hapus karya pengelola, ubah password sendiri | – | ✓ | ✓ | – | – | `wajibAkses(PENGGUNA)` |
| Actions siswa: jawab/lewati/ganti tugas, pulang, hasil latihan/mengetik, post test, ubah/hapus karya sendiri | – | – | – | ✓ | – | `wajibAkses(SISWA)`; `siswaId` selalu dari login, bukan dari input |

Uji IDOR yang dijalankan (Fase F): siswa A tidak bisa mengunduh bahan tugas siswa B (404), membuka berkas karya B (404), mengubah/menghapus karya B (404), atau mengunduh PDF sertifikat (401); denyut post test dan hasil latihan selalu memakai `siswaId` dari login; orang tua A tidak bisa mengunduh sertifikat atau berkas karya anak lain (404) dan rapor hanya memuat data anaknya.

## Cadangan dan pemulihan

Data ada di dua tempat: database dan folder `UPLOAD_DIR` (logo dan berkas karya). Keduanya harus dicadangkan bersama. Belum ada penjadwal; jalankan lewat cron/Task Scheduler server.

```bash
# cadangan database (konsisten tanpa mengunci tabel InnoDB)
mysqldump --single-transaction --routines --default-character-set=utf8mb4 -h DB_HOST -P DB_PORT -u DB_USER -p digiplay_learning > cadangan/digiplay-$(date +%Y%m%d).sql
# cadangan berkas unggahan
tar -czf cadangan/uploads-$(date +%Y%m%d).tar.gz uploads/
```

Pemulihan (aplikasi dihentikan dulu):

```bash
mysql -h DB_HOST -P DB_PORT -u DB_USER -p -e "CREATE DATABASE IF NOT EXISTS digiplay_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -h DB_HOST -P DB_PORT -u DB_USER -p digiplay_learning < cadangan/digiplay-YYYYMMDD.sql
tar -xzf cadangan/uploads-YYYYMMDD.tar.gz      # mengembalikan folder uploads/
npm run db:init                                # menambah kolom/indeks baru bila cadangan berasal dari versi lama
```

Simpan cadangan di luar server aplikasi dan uji pemulihan secara berkala.

## Daftar periksa produksi

- [ ] Domain siswa dan backoffice mengarah ke server; `HOST_SISWA` dan `HOST_BACKOFFICE` diisi hostname asli (tanpa port), `URL_SISWA` diisi `https://<domain siswa>`.
- [ ] SSL/HTTPS aktif di kedua domain (cookie `secure` aktif otomatis saat `NODE_ENV=production`, jadi tanpa HTTPS tidak bisa login).
- [ ] `SESSION_SECRET` baru, acak, minimal 32 karakter, berbeda dari pengembangan; tidak pernah di-commit.
- [ ] `.env` produksi: kredensial database khusus aplikasi (bukan root, hanya hak ke `digiplay_learning`), `SERVER_ID` unik per instance, `UPLOAD_DIR` di disk yang dicadangkan, `JUMLAH_PROXY_TEPERCAYA` sesuai jumlah proxy.
- [ ] Reverse proxy (nginx) di depan aplikasi: teruskan `Host`, setel `X-Forwarded-For` (lihat bagian IP klien), batasi ukuran unggahan (`client_max_body_size 4m`).
- [ ] `npm ci`, `npm run build`, `npm run start` (atau process manager); `npm run db:init` dan `npm run db:seed` setelah setiap pembaruan.
- [ ] Buat admin pertama dengan `npm run admin:buat`; jangan menjalankan `siswa:uji` atau `data:uji-besar` di produksi.
- [ ] Unggah logo dan isi penandatangan di Pengaturan; opsional taruh `Nunito-Regular.ttf`/`Nunito-Bold.ttf` di `public/aset/font/` agar PDF memakai font Nunito.
- [ ] Jadwalkan cadangan database dan `uploads/`, dan uji pemulihannya.
- [ ] Opsional: Content-Security-Policy di reverse proxy (aplikasi memakai satu skrip inline untuk tema, perlu nonce/hash bila CSP ketat).

## Cara uji perbaikan instruksi bahan, penilaian praktik, dan posisi jari
1. **Penilaian praktik post test.** Siswa Uji (Level 1, pertemuan 13) memulai post test, menandai satu butir praktik "Sudah selesai, panggil tutor", lalu tutor membuka `/post-test/<id>` di backoffice: panel **Butir praktik yang perlu dinilai** menampilkan bagian, instruksi, bahan, rubrik, kolom skor dan catatan. Skor kosong, di bawah 0, di atas maksimum rubrik, atau bukan angka ditolak. Setelah disimpan, layar siswa berubah menjadi "Sudah dinilai tutor" (dalam 15 detik, tanpa skor). Siswa mengumpulkan; **Finalisasi** nonaktif dengan keterangan "N butir praktik belum dinilai" sampai semua butir dinilai, lalu nilai bagian C/D, total, kelulusan, dan sertifikat terhitung. Skor boleh direvisi, lalu tekan **Finalisasi ulang**. Aksi tercatat di Log (`nilai_butir_post_test`, `finalisasi_post_test`). Tugas biasa (bukan post test) yang dicek tutor sudah punya layar penilaian di detail sesi (tombol Tandai selesai), tidak ada perubahan.
2. **Instruksi bahan.** `npm run db:seed` (memvalidasi dan memperbarui 19 template). Buka tugas Level 1 pertemuan 6, 7, 9 dan butir post test pertemuan 13: instruksi hanya berbunyi "Unduh bahan ..." (tanpa nama subjek dan tanpa "menu Bahan"), tombol **Unduh bahan** tepat di bawahnya, dan berkas yang terunduh adalah `mewarnai.png` (menggambar/mewarnai) atau `berwarna.png` (sisip gambar) subjek tugas itu. Menu **Bahan** tidak ada lagi. Templat yang menyebut "menu Bahan", menulis nama subjek bahan di teks, atau memakai gambar bahan tanpa kata "bahan" ditolak validasi (seed dan halaman Template).
3. **Posisi jari.** Siswa (sesi berlangsung) membuka **Mengetik**, pilih latihan: gambar `public/aset/mengetik/posisi-jari.png` tampil di kanan bawah area ketik pada layar lebar, dan sebagai panel **Posisi jari** yang tertutup di bawah area ketik di HP. Pindahkan berkas itu sementara: panel hilang dan tidak ada ikon gambar rusak.

## Cara uji Fase F

1. `npm run db:init` (menambah indeks baru pada database lama). Admin dan tutor masuk backoffice: beranda menampilkan kartu siswa aktif, sesi berlangsung, post test menunggu, sertifikat bulan ini; kartu **pembayaran bulan ini** hanya tampil untuk admin.
2. Absen Siswa Uji, tulis catatan di detail sesi (ada petunjuk "Catatan ini dapat dibaca orang tua."), lalu masuk dengan kode orang tua di area siswa: `/ortu` menampilkan ringkasan, riwayat sesi dengan catatan dan nama tutornya, post test, mengetik, pembayaran dan totalnya, sertifikat (Unduh PDF dan Cek keaslian), dan karya. Coba di lebar HP.
3. Siswa (sedang sesi) membuka **Karya** -> **Tambah karya**: tautan `https://scratch.mit.edu/...` dan gambar PNG tersimpan (Zippy merayakan). `javascript:alert(1)`, `data:...`, `https://user:pass@...` ditolak; berkas SVG, teks berekstensi `.png`, atau lebih dari 3 MB ditolak. Setelah sesi ditutup, galeri tetap bisa dilihat tetapi tombol tambah terkunci dan ubah/hapus ditolak.
4. Buka `/api/v1/karya/berkas?id=<id karya siswa lain>` dengan login siswa atau orang tua lain: 404. Tutor menghapus karya dari `/karya` (tercatat di Log) dan berkasnya hilang dari `uploads/karya/`.
5. **Ekspor**: unduh keempat CSV dan buka di Excel. Huruf seperti "é" utuh, tidak ada kolom kode akses, dan keterangan pembayaran `=HYPERLINK(...)` tampil sebagai teks berawalan apostrof.
6. Performa (opsional, database pengembangan): `npm run data:uji-besar`, buka daftar siswa/sesi/sertifikat/log, lalu `npm run data:uji-besar '--' --hapus`.

## Fitur materi pertemuan

Materi hanya untuk pertemuan 1-12 tiap level (36 materi); pertemuan 13 (post test) tidak punya materi. Saat siswa membuka pertemuan sesi berlangsung, materi tampil lebih dulu dan **tugas terkunci di server** sampai siswa menekan **Saya sudah paham** (tombol baru aktif setelah penanda akhir materi terlihat di layar). Status disimpan per siswa per pertemuan (`materi_baca`) dan tidak dikunci ulang. Pertemuan yang belum punya materi (atau materinya dinonaktifkan) tidak mengunci tugas.

- **Menu Materi (siswa)** bisa dibuka sebelum maupun sesudah absen. Isinya hanya pertemuan yang sudah dilalui: pertemuan yang pernah punya sesi untuk siswa itu (status Diajarkan, termasuk sesi berlangsung), semua level, urut level lalu nomor. Pertemuan lain tidak ikut dikirim dari server dan URL langsungnya dijawab 404. Tombol "Saya sudah paham" hanya ada pada materi pertemuan sesi berlangsung; materi lain hanya mode baca.
- **Backoffice**: halaman **Materi** (daftar 36 materi, pratinjau tampilan siswa; editor JSON hanya untuk admin) dan kolom **Materi** ("Sudah dibaca (waktu)" / "Belum dibaca") di tab Riwayat detail siswa.
- **Seed**: `seed/materi-level-<n>.json` berupa daftar `{ "kodePertemuan": "L1-P01", "judul": "...", "isi": { ... } }` (kode = kode level + `-P` + nomor dua digit). `npm run db:seed` memvalidasi isinya, lalu upsert per pertemuan dan **menimpa** isi yang diubah admin lewat halaman Materi (perubahan lewat editor hanya berlaku sampai seed dijalankan lagi). Berkas yang belum ada dilewati dengan peringatan; pertemuan 13 atau kode tidak dikenal membatalkan seed.
- **Format `isi`** (JSON):

```json
{
  "tujuan": ["Kamu bisa ..."],
  "bagian": [
    { "tipe": "paragraf", "judul": "Judul (opsional)", "teks": "..." },
    { "tipe": "langkah", "judul": "Judul (opsional)", "langkah": [ { "teks": "...", "gambar": "aset/gambar/<kode>/berwarna.png" } ] },
    { "tipe": "zippy", "teks": "Tahukah kamu? ..." },
    { "tipe": "gambar", "src": "aset/mengetik/posisi-jari.png", "keterangan": "(opsional)" }
  ]
}
```

  Jalur gambar relatif terhadap `public/`, harus diawali `aset/`, dan gambar yang hilang tidak menampilkan ikon rusak. Tipe atau kunci yang tidak dikenal ditolak dengan pesan yang menyebut letaknya.

### Cara uji fitur materi
1. `npm run db:init` lalu `npm run db:seed` (tanpa berkas materi: hanya peringatan). Restart `npm run dev` bila modul baru belum terbaca.
2. Daftarkan siswa baru dan masuk dengan kodenya: menu **Materi** kosong dengan pesan ramah dari Zippy; `/materi/<id pertemuan>` dijawab 404.
3. Pastikan P01 dan P02 sudah Diajarkan, lalu tutor absen di P03: beranda siswa dialihkan ke materi P03, menu Materi menampilkan P01-P03 berurutan, P04-P12 tidak ada di HTML dan URL langsungnya 404; hanya P03 punya tombol "Saya sudah paham".
4. Sebelum paham: aksi tugas (jawab, lewati, ganti, unduh bahan) ditolak 403 walau dipanggil langsung. Gulir ke bawah, tombol aktif, tekan: tugas terbuka. Buka ulang lewat **Baca materi** (tanpa penguncian ulang).
5. Tutup sesi, **Ganti level** siswa ke level lain: materi level lama tetap tampil di menu Materi. Pertemuan tanpa materi (mis. level 2 sebelum seed) membuka tugas langsung.
6. Admin: halaman **Materi** (daftar, pratinjau, ubah; isi dengan tipe tidak dikenal ditolak). Tutor hanya bisa melihat. Detail siswa menampilkan status baca per pertemuan. Hapus siswa uji: data `materi_baca` ikut terhapus (CASCADE dari `siswa`).

## Fitur Coding Zippy (Blockly buatan sendiri, Level 1 P11)

Pertemuan L1 P11 tidak lagi memakai aplikasi pihak ketiga. Siswa menyusun blok perintah untuk membantu Zippy berjalan di labirin kecil sampai ke bintang, di menu **Coding Zippy** (`/coding-zippy`, `/coding-zippy/<kode>`), tanpa akun dan tanpa internet ke pihak ketiga. Penilaian otomatis. Pustaka `blockly` dipin di `13.4.0` (rilis stabil terbaru yang sudah lebih dari 2 minggu saat dipasang; dipasang dengan `--legacy-peer-deps` agar `jsdom` yang hanya dipakai Blockly di Node tidak ikut terpasang). Pustaka dimuat hanya di halaman ini lewat `next/dynamic` tanpa SSR.

- **Menu Coding Zippy** terbuka sebelum maupun sesudah absen. Di luar sesi siswa boleh mencoba, tetapi hasil tidak disimpan (ada keterangan di halaman). Hasil hanya tersimpan saat sesi berlangsung, dan hanya percobaan yang **berhasil** (satu baris `hasil_latihan`, `jenis` = `blockly`, `labirin_id`, `detail` berisi `jumlahBlok` dan `jumlahLangkah`).
- **Penilaian di server**: browser hanya mengirim `{ kode, program }`. Server memvalidasi program dengan zod, mengambil labirin dari database, menjalankan `simulasiProgram` sendiri, lalu menentukan berhasil atau tidak. Kiriman "berhasil" dari browser tidak ada dan diabaikan. `contoh_solusi` hanya untuk uji dan tidak pernah dikirim ke browser. Hasil berhasil menyelesaikan tugas `blockly` yang labirinnya sama (dan, seperti game mouse, hanya bila materi pertemuan tugas itu sudah dipahami).
- **Format program** (JSON buatan kita, bukan XML atau kode JavaScript Blockly): daftar perintah berurutan, mis. `[{ "blok": "maju" }, { "blok": "belok_kanan" }, { "blok": "ulangi", "kali": 3, "isi": [{ "blok": "maju" }, { "blok": "maju" }] }]`. Blok Level 1: `maju`, `belok_kiri`, `belok_kanan`, `ulangi` (`kali` bulat 2 sampai 10). Tipe lain, kunci asing, atau blok yang tidak ada di `blok_tersedia` labirin ditolak.
- **Penerjemah** `simulasiProgram(labirin, program)` di `src/modules/shared/blockly/simulasiProgram.js` adalah satu-satunya sumber kebenaran: murni (tanpa efek samping dan tanpa database), dipakai sama persis oleh animasi di browser dan penilaian di server, tanpa `eval`. Hasil: `berhasil`, `alasan` (`menabrak`, `belum_sampai`, `terlalu_banyak_blok`, `program_kosong`, `tidak_valid`), `jumlahBlok`, `jumlahLangkah`, dan `jejak`. Aturan: `maju` yang menabrak dinding atau tepi papan menghentikan program; `maju` yang mendarat di bintang langsung berhasil (sisa perintah tidak dijalankan); `jumlahBlok` menghitung semua blok termasuk `ulangi` dan isinya (blok "Mulai" tidak dihitung), dan melebihi `batas_blok` berarti belum berhasil walau sampai bintang. Pengaman: maksimal 500 langkah, `ulangi` bersarang maksimal 3 tingkat, maksimal 300 blok per program, pemeriksaan tanpa rekursi.
- **Menambah blok baru** (mis. percabangan atau variabel untuk Level 2 dan 3): cukup menambah satu entri di `DAFTAR_BLOK` (`src/modules/shared/blockly/daftarBlok.js`) berisi tampilan Blockly (JSON blok), `jalankan` (untuk blok perintah) atau bidang `kali`/`isi` (untuk blok wadah), lalu menulis nama blok itu di kolom `blok_tersedia` labirin pada `seed/labirin-blockly.json`. Toolbox, pembaca workspace, validasi program, dan penerjemah semuanya dibaca dari daftar itu, jadi komponen halaman tidak berubah. Blok L2/L3 belum dibuat.
- **Tugas** `blockly` (4 template P11 di `seed/template-level-1.json`: `L1-P11-PR-01` sampai `-04`): `kunci` = `{ "jenis": "blockly", "labirin": "{labirin}" }` dengan `parameter.labirin` berisi nama labirin. `validasiTemplate` mewajibkan `kunci.jenis` = `blockly` dan `kunci.labirin` berupa teks. Tugas lama bertipe `scratch` yang sudah digenerate di data siswa tidak diubah; tipe `scratch` dan template L2/L3 tidak berubah.
- Tong sampah dan tombol zoom Blockly dimatikan karena memakai gambar sprite bawaan Blockly yang tidak kita sertakan: blok dihapus dengan menyeretnya kembali ke toolbox atau menekan Delete, zoom lewat cubit. Blockly meminta kursor `handdelete.cur` dari `/aset/blockly/` (tidak ada, jadi 404 tak berbahaya) dan tidak lagi memuat apa pun dari `static.blockly.com`.

### Cara uji Coding Zippy
1. `npm run db:init` (menambah tabel, kolom, dan nilai ENUM), `npm run db:seed` (7 labirin dan 4 template P11; tanpa `seed/labirin-blockly.json` hanya peringatan), lalu restart `npm run dev`.
2. Siswa tanpa absen: menu **Coding Zippy** terbuka, labirin bisa dicoba, ada keterangan hasil tidak tersimpan, dan aksi simpan lewat permintaan manual dijawab 403.
3. Tutor absen siswa di L1 P11 (materi dipahami lebih dulu). Tugas `blockly` tampil dengan tombol **Kerjakan** yang langsung membuka labirin yang diminta. Selesaikan ketujuh labirin dengan solusi sendiri: tiap keberhasilan menambah satu baris `hasil_latihan`, tanda "Sudah selesai" muncul, dan tugas yang cocok otomatis selesai. Coba program yang menabrak, program kosong, dan "Jalan Panjang" tanpa blok Ulangi (harus belum berhasil: blok melebihi batas).
4. Kirim paksa lewat permintaan manual: tipe blok asing, `kali` di luar 2-10, program bersarang terlalu dalam (ditolak 400 dengan pesan letaknya), dan kiriman `berhasil: true` palsu (diabaikan, server menilai sendiri).
5. Periksa HP (papan di atas, toolbox Blockly di atas area kerja), mode gelap, dan pengaturan "kurangi gerakan" (Zippy langsung loncat ke hasil akhir).

## Fitur Studio Zippy (Level 2: P09 sampai P11 dan bagian D post test)

Pertemuan L2 P09 sampai P11 dan bagian D post test L2 ("Praktik Coding") tidak lagi memakai Scratch. Siswa memakai **Studio Zippy**: panggung bebas buatan sendiri dengan sprite dan blok kode, tanpa akun dan tanpa pihak ketiga.

- **Menu Studio Zippy** (`/studio`) terbuka sebelum maupun sesudah absen. Di luar sesi siswa boleh bereksperimen; menyimpan, menghapus, dan mengirim proyek hanya saat sesi berlangsung (403 bila tidak). Perubahan yang belum disimpan ditahan dengan peringatan saat menutup tab, menekan tautan di dalam aplikasi, atau memilih Proyek baru/Buka.
- **Pustaka** (semua dibuat di kode, tanpa berkas baru): sprite = 75 subjek gambar aktif (kostum 1 `berwarna.png`, kostum 2 `outline.png`) ditambah Zippy (dua berkas maskot); daftar subjek dibaca dari tabel `gambar`. Latar SVG: `polos`, `taman`, `pantai`, `luar angkasa`, `kota`, `labirin` (8 x 6 petak, dinding tipis dan satu petak tujuan berbentuk bintang; dibuat deterministik di `pustakaStudio.js`). Suara disintesis dengan Web Audio di **satu tempat**, `src/modules/studio/pustakaSuara.js`: tema `hewan`, `musik`, `alam` masing-masing 3 suara (nama `<tema>-<nomor>`); mengganti dengan berkas suara sungguhan cukup mengubah berkas itu. Suara baru bunyi setelah klik Bendera hijau (aturan autoplay browser) dan mengikuti tombol bisukan.
- **Tabel**: `proyek_coding` (proyek milik siswa; `UNIQUE (siswa_id, nama)`, `tingkat` bawaan `l2`, maksimal 256 KB dan 30 proyek per siswa; `ON DELETE CASCADE` dari `siswa`) dan `proyek_kiriman` (salinan beku yang dikirim ke satu tugas/butir post test; unik per `tugas_id`, `ON DELETE CASCADE` dari `tugas_siswa`). Menghapus siswa menghapus keduanya tanpa langkah tambahan di urutan hapus. `npm run db:init` menambahkan kedua tabel dan nilai ENUM `template.tipe = coding_proyek` pada database lama.
- **Format proyek** (JSON buatan kita; koordinat seperti Scratch: panggung 480 x 360, pusat (0,0), arah 90 = kanan, searah jarum jam):
  ```json
  { "versi": 1, "latar": "taman", "variabel": { "skor": 0 },
    "sprite": [ { "id": "s1", "subjek": "hwn-01", "x": 0, "y": -120, "arah": 90, "kostum": 0, "tampil": true,
      "skrip": [ { "kejadian": "bendera", "x": 24, "y": 24, "isi": [ { "blok": "ulangi", "kali": 10, "isi": [ { "blok": "gerak", "langkah": 10 } ] } ] } ] } ] }
  ```
  Skrip diawali blok kejadian (`bendera`, atau `tombol` dengan `tombol` = `spasi|kanan|kiri|atas|bawah`); isian angka boleh diganti blok nilai (`{ "blok": "angka_acak", "a": 1, "b": 6 }`, `{ "blok": "skor" }`) dan `jika` memakai `syarat` berupa blok `menyentuh` (`tepi|dinding|tujuan|sprite_lain`) atau `bandingkan` (`gte|eq|lt`). `x`/`y` pada skrip hanya posisi di ruang kerja. Validasi (`periksaProyek`, tanpa rekursi) menolak tipe blok tak dikenal, kunci asing, angka di luar rentang, lebih dari 10 sprite, 20 skrip per sprite, 2000 node, wadah bersarang lebih dari 5 tingkat, dan nilai bersarang lebih dari 4 tingkat; server juga memastikan `subjek` ada di bank gambar.
- **Blok Level 2** (kategori dan warna dipakai soal): Kejadian (kuning), Gerakan (biru), Tampilan (ungu), Suara (merah muda), Kontrol (oranye), Sensor (biru muda), Operator (hijau), Variabel (merah). Sensor "Menyentuh" punya satu pilihan tambahan, `tujuan` (bintang di latar labirin), supaya tugas labirin bisa mendeteksi kemenangan. Warna kuning memakai emas gelap agar teks putih lolos kontras AA.
- **Penerjemah** `buatMesinStudio` (`src/modules/shared/blockly/mesinStudio.js`) murni dan tanpa `eval`: tiap skrip adalah generator yang diputar sekitar 30 bingkai per detik (`useMesinStudio`), satu putaran `ulangi`/`selamanya` per bingkai, `tunggu` memakai waktu mesin, dan tiap skrip dibatasi 200 blok per bingkai sehingga proyek ganas tidak membekukan tab. **Berhenti** menghentikan semuanya. Gambar sprite memakai `mix-blend-mode: multiply` agar latar putih gambar tidak tampak (kecuali latar luar angkasa).
- **Menambah blok baru** (mis. blok Level 3: kostum unggahan, `tunggu` lanjutan, adegan, nyawa): cukup menambah satu entri di `DAFTAR_BLOK_STUDIO` (`src/modules/shared/blockly/daftarBlokStudio.js`) berisi `jenis`, `kategori`, `bidang` (angka, teks, pilihan, kondisi, isi), dan `jalankan` atau `hitung`, menulis teks tampilannya di `studio.blok.<nama>` dan `studio.tip.<nama>` pada `src/locales/id_ID.json`, lalu menambah namanya di `KONFIGURASI_TOOLBOX` (kolom `tingkat` proyek memilih konfigurasi). Toolbox, pembaca/pemuat workspace, validasi, dan penerjemah dibaca dari daftar itu, jadi komponen halaman tidak berubah. Tipe Blockly diberi awalan `studio_` agar tidak bentrok dengan blok Coding Zippy L1.
- **Tugas** bertipe `coding_proyek` (`penilaian: dicek_tutor`, masuk `TIPE_DICEK_TUTOR_SAJA`): kartu tugas siswa menampilkan **Buka Studio Zippy** dan **Kirim proyek** (pilih proyek tersimpan); di dalam Studio yang dibuka dari tugas ada tombol **Kirim ke tugas** (menyimpan dulu bila perlu). Yang dikirim adalah salinan beku; boleh dikirim ulang selama tugas masih `belum` (tutor menandai selesai = tidak bisa lagi). Tutor melihat panel **Proyek siswa** di detail sesi (pratinjau panggung hanya-baca dengan Jalankan/Berhenti, tombol keyboard, dan **Lihat susunan blok** yang membuka ruang kerja Blockly mode baca) dan menandai selesai seperti tugas lain. Tipe `scratch` tetap ada (dipakai L3).
- **Post test L2 bagian D** ("Praktik Coding"): butir `coding_proyek` menampilkan **Buka Studio Zippy** (`/studio?butir=<id>`, layar fokus dengan pewaktu yang tetap berdenyut ke `/api/v1/posttest/denyut`, jadi waktu tes terus berjalan). **Kirim ke butir ini** menyimpan salinan dan sekaligus menandai butir siap dinilai; penilaian tutor memakai panel `PenilaianPraktik` yang sudah ada (skor, catatan, rubrik, Finalisasi) dengan pratinjau proyek di kartu butir. Setelah dikumpulkan atau waktu habis, kirim ditolak dan Studio dialihkan ke halaman post test.
- **Seed** `seed/template-level-2.json` (kode sama, 30 baris diedit): 17 template praktik (`L2-P09-PR-*`, `L2-P10-PR-*`, `L2-P11-PR-*`, `L2-P13-D-*`) berpindah dari `scratch` ke `coding_proyek`; 12 soal pilihan ganda memakai nama blok Indonesia; bagian D diganti nama menjadi "Praktik Coding"; parameter `sprite`/`pemain`/`objek` hanya memakai subjek yang ada atau Zippy, `tujuan` labirin = `bintang`, `tema` dan `tema_suara` cocok dengan pustaka. L3 tidak diubah.

### Cara uji Studio Zippy
1. `npm run db:init`, `npm run db:seed`, restart `npm run dev`.
2. Siswa tanpa absen: **Studio Zippy** terbuka, bendera/berhenti/suara bekerja, Simpan dan Kirim memberi keterangan (aksi manual dijawab 403).
3. Tutor absen siswa L2 di P09 (materi dipahami lebih dulu): buat proyek untuk tiap tugas (gerak, suara, ganti latar, putar, ulangi, selamanya dan pantul, tombol ditekan, ganti kostum, game tangkap dengan skor, labirin dengan latar `labirin`, pesan menang), simpan dengan nama, kirim lewat kartu tugas atau tombol di Studio, lalu kirim ulang. Tutor membuka detail sesi, menjalankan pratinjau, melihat susunan blok, dan menandai selesai.
4. Kirim paksa proyek tidak valid (tipe blok asing, kunci asing, subjek tak dikenal, terlalu dalam/besar): ditolak 400 dengan pesan letaknya. Proyek dengan `selamanya` tidak membekukan tab dan berhenti dengan tombol Berhenti.
5. Post test L2 (pertemuan 13): bagian D lewat Studio, kumpulkan, tutor menilai butir dan Finalisasi. Periksa HP dan mode gelap. Hapus siswa uji: `proyek_coding` dan `proyek_kiriman` ikut terhapus.

## Fitur Studio Zippy Level 3 (P06 sampai P12 dan bagian C/D post test L3)

Studio Zippy dipakai juga di Level 3. Proyek punya **tingkat**: `l2` (blok dasar, bawaan semua siswa) dan `l3` (blok lanjutan). Siswa pada level berurutan 3 ke atas boleh membuat proyek tingkat 3; menu **Proyek baru** menampilkan pilihan tingkat hanya bila siswa boleh memakai lebih dari satu. Proyek lama (`l2`) dibuka dan dijalankan persis seperti sebelumnya; satu-satunya perubahan di tingkat 2 adalah blok `bandingkan` yang kini berisi lima pembanding (`>`, `>=`, `=`, `<`, `<=`). Server menolak proyek tingkat 3 dari siswa yang belum boleh (403) dan menolak blok tingkat 3 di proyek tingkat 2 (400).

- **Blok baru** (semua di `DAFTAR_L3` pada `src/modules/shared/blockly/daftarBlokStudio.js`; `DAFTAR_BLOK_STUDIO` = `DAFTAR_L2` + `DAFTAR_L3`, toolbox lewat `KONFIGURASI_TOOLBOX.l3`): Ketika sprite ini diklik, Kirim pesan / Ketika menerima pesan (nama pesan diketik, maksimal 20 karakter), Katakan selama, Mainkan/Hentikan musik latar, Jika-maka-jika tidak, Tunggu sampai, Menyentuh sprite, Tanya dan jawaban, hitung angka (tambah, kurang, kali, bagi), Gabung teks, dan/atau/bukan, serta blok variabel (nilai, atur, ubah, tampilkan, sembunyikan). Isian "bebas" menerima angka atau teks.
- **Variabel buatan sendiri**: tombol **Buat variabel** di kategori Variabel membuka dialog (nama 1 sampai 15 huruf, angka, atau spasi; unik tanpa membedakan huruf besar kecil; maksimal 8 selain `skor`). Dropdown variabel dan sprite pada blok dibaca dari data proyek; variabel atau sprite yang sudah dihapus tetap tampil di blok lama agar proyek tidak rusak. Variabel yang ditampilkan muncul sebagai monitor di panggung.
- **Sprite teks**: tulisan (maksimal 40 karakter), ukuran, dan satu dari 8 warna yang terbaca di semua latar. Sprite teks tidak punya kostum dan bisa diklik, digeser, serta diberi blok.
- **Kostum unggahan**: siswa mengunggah PNG atau JPEG (diperkecil di browser menjadi PNG sisi terpanjang 256 px; server menolak berkas lebih dari 200 KB atau bukan gambar PNG/JPEG, mengenalinya dari byte awal). Maksimal 6 kostum unggahan per sprite dan 60 per siswa. Berkas disimpan di `uploads/kostum/<siswaId>/<token>.png|jpg` (tabel `kostum_unggahan`, `ON DELETE CASCADE` dari `siswa`; total 31 tabel); proyek hanya menyimpan ID di `sprite.kostumUnggahan`. Route HTTP: `POST /api/v1/studio/kostum` (multipart kolom `berkas`, siswa dengan sesi berlangsung) dan `GET /api/v1/studio/kostum/berkas?id=<id>` (pemilik, atau pengelola untuk pratinjau). Kostum yang sudah ikut terkirim ke tugas atau butir (kiriman memuat ID itu) tidak bisa dihapus (409); kostum lain boleh dihapus dan rujukannya dicabut dari proyek tersimpan. Menghapus siswa menghapus baris dan folder berkasnya.
- **Musik latar**: disintesis Web Audio di `pustakaSuara.js` dengan tiga suasana (`ceria`, `tenang`, `petualangan`), mengikuti tombol bisukan, dan berhenti saat Berhenti.
- **Format proyek** (versi 1, tetap kompatibel): sprite boleh punya `jenis: 'teks'` (`teks`, `ukuran`, `warna`) atau `kostumUnggahan` (daftar ID), `variabel` memuat variabel buatan selain `skor`, dan kolom `tingkat` pada `proyek_coding` menentukan blok yang sah. Batas baru ada di `BATAS_STUDIO` (kedalaman nilai 6, variabel, kostum).
- **Seed** `seed/template-level-3.json`: 27 template praktik (P06 sampai P12 dan P13 bagian C/D) berpindah dari `scratch` ke `coding_proyek`; teks tugas dan 9 soal pilihan ganda memakai nama blok Indonesia dan bebas dari istilah Scratch (parameter objek/rintangan hanya subjek yang ada: `jeruk`, `pisang`, `bola sepak`, `roket`, `kaktus`, `truk`, `lebah`). Tipe `scratch` tetap terdaftar tetapi tidak dipakai template mana pun. `npm run db:seed` juga memuat materi dan template ke database lokal, jadi tugas pertemuan terkunci sampai siswa menandai materinya paham.

### Cara uji Studio Zippy Level 3
1. `npm run db:init`, `npm run db:seed`, restart `npm run dev`.
2. Siswa Level 3 (absen di P06): **Proyek baru** menampilkan pilihan tingkat; pilih Tingkat 3, lalu tambah sprite teks, buat variabel (nama kembar ditolak), susun skrip dengan Tanya, Kirim pesan, Jika-tidak, dan Mainkan musik, simpan, dan jalankan (kotak jawaban muncul untuk Tanya, klik sprite teks memicu skripnya).
3. Unggah kostum: PNG atau JPEG kecil diterima; berkas teks berekstensi `.png`, WebP, SVG, dan berkas di atas 200 KB ditolak. Hapus kostum yang belum terkirim (berhasil) dan yang sudah terkirim ke tugas (ditolak dengan pesan).
4. Buka proyek tingkat 2 lama: tetap jalan. Siswa Level 2 tidak melihat tombol Tambah sprite teks, Unggah kostum, maupun pilihan tingkat.
5. Kirim proyek ke tugas L3, lalu tutor membuka detail sesi: pratinjau menjalankan proyek (Tanya bisa dijawab, kostum unggahan tampil lewat route berkas) dan menampilkan susunan blok.
6. Post test L3 (pertemuan 13): butir `coding_proyek` di bagian C dan D dikirim lewat Studio, tutor menilai, Finalisasi, dan sertifikat terbit bila lulus. Periksa HP dan mode gelap. Hapus siswa uji: `proyek_coding`, `proyek_kiriman`, `kostum_unggahan`, dan folder `uploads/kostum/<siswaId>` ikut hilang.

## Penyempurnaan (`docs/prompt/PROMPT_BUILD_PENYEMPURNAAN.md`)

### Tahap 1: tanda tangan sertifikat
- Admin mengunggah satu gambar **PNG transparan** (maks. 500 KB, disarankan sekitar 600 x 200 px) di **Pengaturan**, tepat di bawah kolom penandatangan pada kelompok **Sertifikat**. Berkas disimpan di `uploads/tandatangan/<token>.png`, path-nya di pengaturan `tanda_tangan_path`. Database lama: `npm run db:seed` (menyisipkan kunci kosong; tanpa baris itu aplikasi tetap memakai nilai kosong, jadi tidak wajib).
- Unggah lewat `POST /api/v1/pengaturan/tanda-tangan` (admin, multipart kolom `tandaTangan`), hapus lewat Server Action `hapusTandaTangan` (admin). Pratinjau `GET /api/v1/pengaturan/tanda-tangan` hanya untuk admin dan tutor (tidak publik).
- PDF dibuat setiap diunduh, sehingga sertifikat lama ikut memakai tanda tangan terbaru. Nama dan jabatan penandatangan juga dibaca dari pengaturan saat unduh (bukan snapshot), jadi tanda tangan mengikuti pola yang sama. Gambar dimuat dalam kotak 160 x 60 pt di atas garis, rata tengah, tanpa mengubah rasio. Berkas hilang atau tidak terbaca: PDF tetap jadi tanpa tanda tangan dan peringatan masuk log sekali per proses.
- Cara uji: (1) Pengaturan -> unggah PNG transparan, pratinjau tampil di atas latar kotak-kotak; (2) unduh sertifikat dari menu Sertifikat dan dari halaman orang tua, tanda tangan tampil tanpa kotak putih (juga pada sertifikat dibatalkan); (3) unggah JPEG, berkas teks berekstensi `.png`, atau PNG di atas 500 KB: ditolak dengan pesan; (4) ganti gambar: berkas lama di `uploads/tandatangan/` terhapus; (5) **Hapus tanda tangan** (dengan konfirmasi): PDF kembali seperti semula; (6) log aktivitas mencatat `ubah_tanda_tangan` dan `hapus_tanda_tangan` tanpa isi berkas; (7) tutor tidak melihat halaman Pengaturan, tetapi pratinjau untuk tutor tetap bisa dibuka (route khusus pengelola).

### Tahap 2: keterangan sesi pada daftar pembayaran
- Setiap baris pembayaran menampilkan `Sesi: Pertemuan <nomor> · <judul> (Level <urutan>) · <tanggal sesi>`, atau `-` bila pembayaran tanpa sesi. Data diambil lewat `LEFT JOIN` `sesi`, `pertemuan`, `level` di `pembayaranModel`; teksnya dibuat `pembayaranUsecase` (field `keterangan_sesi`). Tanpa perubahan skema.
- Tampil di tab Pembayaran detail siswa, bagian Pembayaran detail sesi (keduanya lewat `BagianPembayaran`), dan rapor orang tua (kolom Sesi di tabel, baris di bawah jumlah pada kartu HP). Rapor orang tua hanya menerima teks `keterangan_sesi`, tanpa nama pencatat atau ID internal.
- Cara uji: buka detail siswa yang punya pembayaran dari absen masuk, lalu tab Pembayaran; buka detail sesinya; buka `/ortu` dengan kode orang tua siswa itu. Pembayaran hanya dicatat lewat Absensi (form Absen masuk) dan detail sesi (seperti catatan tutor), sehingga selalu terkait satu sesi; tab Pembayaran di detail siswa hanya menampilkan riwayat (tanpa form) dan server menolak pembayaran tanpa sesi. Baris lama tanpa sesi tetap tampil dengan `Sesi: -`. Periksa lebar 360 px: teks panjang turun ke baris berikutnya tanpa menggeser halaman.

### Tahap 3: detail JSON di menu Log
- Tabel Log kini memakai `TabelLog.jsx` (modul `log`, client component) sebagai ganti `TabelResponsif`, yang tidak punya baris tambahan dan tidak diubah. Detail JSON tampil di baris tambahan tepat di bawah baris datanya (`colSpan` 5, selebar tabel); di HP detail tampil di bawah isi kartu. Awalnya tertutup, beberapa baris boleh terbuka bersamaan, tombol berganti ikon dan label (Lihat detail / Tutup detail) dengan `aria-expanded` dan `aria-controls`. Isi: JSON berindentasi 2 spasi, monospace, `pre-wrap` + `overflow-wrap:anywhere`, tinggi maksimal 320 px dengan scroll vertikal. Detail kosong tampil "-" tanpa tombol; detail berupa teks biasa ditampilkan apa adanya.
- Cara uji: buka **Log**, klik **Lihat detail** pada dua baris (keduanya terbuka, detail selebar tabel di bawah barisnya), klik **Tutup detail**. Periksa lebar 360 px (kartu, tanpa geser mendatar) dan tema gelap.

### Tahap 4: ringkasan penilaian siswa pada post test
- Kolom baru `post_test.ringkasan_tutor` (TEXT, maks. 2000 karakter, divalidasi zod), `ringkasan_oleh` (FK ke `pengguna`, `ON DELETE SET NULL`), `ringkasan_at`. Database lama: `npm run db:init`. Data lama tidak berubah.
- Backoffice: kartu **Ringkasan penilaian siswa** di paling bawah detail post test (`FormRingkasan.jsx`): textarea, penghitung karakter, **Simpan ringkasan**, dan "Terakhir diubah oleh X pada Y". Admin dan tutor, boleh sebelum maupun sesudah Finalisasi, tidak wajib untuk Finalisasi. Teks kosong menghapus ringkasan. Log `ubah_ringkasan_post_test` hanya mencatat panjang teks.
- Rapor orang tua: bagian **Penilaian tutor** tepat di bawah kartu data siswa. Hanya dari post test yang sudah difinalisasi (`nilai_total` terisi), satu per level (percobaan terbaru yang punya teks), urut level, dengan nama level dan tanggal. Tanpa ringkasan bagian tidak tampil. Teks tampil sebagai teks biasa, baris baru dipertahankan. Siswa tidak melihat ringkasan ini.
- Tanggal yang ditampilkan adalah `post_test.selesai_at` (saat siswa mengumpulkan tes), karena belum ada kolom waktu finalisasi.
- Cara uji: (1) buka detail post test, isi ringkasan, simpan, muat ulang: teks dan pengubah terakhir tampil; (2) buka `/ortu` dengan kode orang tua siswa itu: bagian Penilaian tutor tampil di bawah kartu siswa; (3) kosongkan ringkasan: bagian hilang; (4) teks di atas 2000 karakter ditolak; (5) post test yang belum difinalisasi tidak memunculkan ringkasannya di `/ortu`; (6) cek log aktivitas.

### Tahap 5: pagination 10 data per halaman
- Satu konstanta `UKURAN_HALAMAN = 10` (`src/enums/index.js`) dipakai semua daftar berpaginasi, termasuk galeri karya (`ATURAN_KARYA.perHalaman`) dan rapor orang tua. Pagination dilakukan di database (`LIMIT/OFFSET` dengan `COUNT` terpisah), nomor halaman lewat query `halaman` (rapor: `sesi`, `bayar`, `halaman` untuk karya; detail siswa: `sesi`, `bayar`, `pt`, plus `tab`). Nomor tak sah menjadi 1 dan di luar jangkauan menjadi halaman terakhir. `Paginasi` menampilkan "Menampilkan x-y dari z data (halaman a dari b)".
- Indeks baru `sesi(siswa_id, jam_masuk)` (`schema.sql` dan `db:init`) untuk riwayat sesi per siswa. Ekspor CSV tidak terpengaruh.
- **Sudah berpaginasi (otomatis 10):** daftar siswa, template, sertifikat, log, karya (backoffice, detail siswa, galeri siswa, rapor orang tua).
- **Diubah:** bank gambar, daftar akun (Pengguna), tab Menunggu/Berlangsung/Selesai di Post test (sebelumnya `LIMIT 200`), tab Riwayat sesi, Pembayaran, dan Post test di detail siswa, serta riwayat sesi dan pembayaran di rapor orang tua (sebelumnya dipotong di aplikasi). Total pembayaran di rapor tetap dari semua catatan.
- **Sengaja tidak diubah:** sesi berlangsung di Absensi (alur operasional tutor, selalu sedikit); pembayaran di detail sesi; tugas dalam satu sesi dan butir post test (alur pengerjaan); level, materi (kelompok per level, ukuran tetap 12); daftar post test, sertifikat, dan latihan di rapor orang tua serta tab Sertifikat dan Latihan di detail siswa (kecil per siswa); opsi jawaban, editor rubrik, tab, dan menu.
- Cara uji: buka `/gambar` (75 subjek -> 8 halaman, `?halaman=999` memantul ke halaman terakhir), `/template`, `/log`, detail siswa dengan banyak sesi (tab Riwayat sesi, Pembayaran; pindah halaman tidak menutup tab dan tidak mengubah halaman daftar lain), `/ortu?sesi=2&bayar=2`, dan Post test dengan lebih dari 10 percobaan. Periksa HP 360 px dan tema gelap.

## Game siswa terbuka bertahap (`docs/prompt/PROMPT_BUILD_GAME_BERTAHAP.md`)
- **Aturan:** sebuah menu game terbuka bila siswa punya minimal satu baris `tugas_siswa` (status apa pun, di level mana pun, termasuk butir post test) yang templatenya bertipe: `game_mouse` -> Latihan Mouse (kelima game sekaligus), `mengetik` -> Mengetik, `blockly` -> Coding Zippy, `coding_proyek` -> Studio Zippy. Puzzle terbuka sejak awal. Bagian tes mengetik post test bukan baris tugas, jadi ada tidaknya `post_test` siswa pada level yang punya bagian `tes_mengetik` ikut membuka Mengetik. Tanpa tabel atau kolom baru, tanpa migrasi: siswa lama langsung mendapat akses sesuai riwayatnya. Setelah terbuka, menu tetap terbuka (diturunkan dari riwayat), boleh dibuka tanpa sesi aktif (hasil tetap hanya tersimpan saat sesi berlangsung).
- **Siswa di level lebih tinggi:** karena level tidak harus berurutan (Level 2 atau 3 bisa dimulai langsung), game level di bawahnya ikut terbuka. Siswa yang pernah punya `siswa_level` dengan urutan > 1 mendapat Latihan Mouse, Mengetik, dan Coding Zippy; urutan > 2 (Level 3) juga mendapat Studio Zippy. Aturannya `MENU_GAME_LEVEL_AWAL` di `src/enums/index.js` (level tempat tiap game pertama dipakai), dihitung dari urutan level tertinggi yang pernah diikuti siswa lewat satu baris tambahan di query yang sama. Siswa Level 2 baru mendapat Studio saat tugas `coding_proyek` pertama muncul (L2 pertemuan 9) atau post test dimulai.
- **Pemicu:** tugas dibuat saat absen masuk, jadi game sudah terbuka selagi siswa membaca materi (sebelum "Saya sudah paham"). Butir post test dibuat saat siswa menekan **Mulai Post Test** (`posttestUsecase.mulai` -> `buatButir`; tes ulang membuat butir saat tutor membuka tes ulang, tetapi baris `post_test` percobaan pertama sudah ada). Sebelum Mulai, pertemuan 13 belum membuka apa pun.
- **Kode:** pemetaan tipe -> menu ada di `MENU_GAME`, `MENU_GAME_AWAL`, `MENU_GAME_DARI_TIPE` (`src/enums/index.js`). Satu query `UNION` ringan di `latihanModel.tipeGameSiswa` (memakai indeks `sesi(siswa_id, jam_masuk)`), `latihanUsecase.menuGameTerbuka/wajibMenuTerbuka`, `latihanController.menuGameTerbuka/wajibMenu`. `konteksSiswa()` menyertakan `menuTerbuka` dan mengekspor `wajibMenuTerbuka(k, menu)` (404 seperti menu Materi).
- **Penegakan di server:** halaman `/latihan-mouse`, `/mengetik`, `/mengetik/kemajuan`, `/coding-zippy`, `/coding-zippy/[kode]`, `/studio` menjawab 404 bila terkunci (Studio dengan `?butir=` dari post test tidak pernah dijaga). Aksi: simpan hasil game mouse, aksi teks/simpan Mengetik, simpan Coding Zippy, dan daftar/buka/simpan/hapus proyek serta unggah/hapus kostum Studio menjawab 403. Tidak dijaga: Puzzle, tes mengetik post test (aksi `posttest`), kirim proyek ke tugas/butir, dan penyimpanan lewat tugas.
- **Tampilan:** menu terkunci tetap tampil dengan gembok dan keterangan "Terbuka saat pertemuannya tiba" (`MenuTerkunci` di `ShellSiswa`, tanpa komponen baru; `sesiSiswa.terkunciGame`). Perbaikan kecil: `nav` menu diberi `relative` agar teks `sr-only` item terkunci tidak membuat halaman meluap mendatar di HP.
- **Cara uji:** (1) siswa baru login tanpa sesi: hanya Puzzle terbuka, URL langsung ke `/latihan-mouse`, `/mengetik`, `/coding-zippy`, `/studio` menjawab 404; (2) absen masuk L1 pertemuan 2: Latihan Mouse (kelima game) terbuka sebelum menekan "Saya sudah paham"; (3) tutup sesi lalu login lagi tanpa sesi: Latihan Mouse tetap terbuka; (4) pertemuan 3 membuka Mengetik, pertemuan 11 Coding Zippy, L2 pertemuan 9 Studio Zippy; (5) setelah **Ganti level**, game level lama tetap terbuka; (6) siswa lama langsung memegang akses sesuai riwayat; (6b) siswa baru yang langsung didaftarkan di Level 2: Latihan Mouse, Mengetik, dan Coding Zippy terbuka, Studio masih terkunci; di Level 3: semua game terbuka; (7) siswa Level 1 yang melewatkan pertemuan 3 dan 4: Mengetik terkunci sampai **Mulai Post Test** ditekan, lalu terbuka (L2 dan L3: Studio ikut terbuka bersama butir `coding_proyek`); tes mengetik dan butir Studio post test tidak pernah terhalang; (8) periksa HP 360 px dan tema gelap.

## Logo, favicon, dan slot logo di Pengaturan (`docs/prompt/PROMPT_BUILD_LOGO.md`)
- **Logo bawaan** ada di `public/aset/logo/` (`logo-landscape.png`, `logo-persegi.png`, `logo-persegi-teks.png`) dan dipakai bila slot kosong. **Favicon** di `src/app/` (`favicon.ico`, `icon.png`, `apple-icon.png`) dikenali otomatis oleh Next.js dan bersifat tetap (tidak bisa diubah dari Pengaturan; logo unggahan tidak lagi dipakai sebagai ikon tab). Untuk menggantinya, timpa ketiga berkas itu (16/32/48 px untuk `.ico`, 512 px untuk `icon.png`, 180 px berlatar putih untuk `apple-icon.png`) lalu restart `npm run dev`; tab browser kadang perlu muat ulang keras.
- **Slot di Pengaturan (kelompok Logo, admin):** *Logo utama* (landscape; kunci `logo_path` yang sudah ada, jadi logo yang pernah diunggah tetap menjadi Logo utama), *Logo ikon* (`logo_ikon`), *Logo persegi dengan teks* (`logo_persegi_teks`), dan *Logo sertifikat* (`logo_sertifikat`, hanya PNG atau JPEG). Tiap slot punya pratinjau di atas latar kotak-kotak, keterangan fungsi, tombol Unggah/Ganti, dan **Kembalikan ke bawaan** (dengan konfirmasi). Batas 1 MB, tipe dibaca dari byte awal berkas. Database lama: `npm run db:seed` menyisipkan tiga kunci baru (tanpa itu aplikasi tetap memakai nilai kosong). Unggah dan kembalikan dicatat ke log (`ubah_logo`, `kembalikan_logo`, dengan `slot`, tanpa isi berkas).
- **Route:** `POST /api/v1/pengaturan/logo` (admin, multipart: kolom `logo` dan kolom opsional `slot`, bawaan `utama`); `GET /api/v1/pengaturan/logo?slot=utama|ikon|persegiTeks|sertifikat` (publik; slot kosong menyajikan berkas bawaan, slot sertifikat kosong menyajikan Logo utama atau bawaan); aksi `kembalikanLogo` (admin).
- **Pemasangan:** komponen `LogoAplikasi` (`src/modules/layout/`, varian `utama`, `ikon`, `persegiTeks`) membaca `branding.logo[varian]`. Header semua area (`Merek`): logo utama mulai lebar `sm`, logo ikon di HP. Halaman masuk siswa dan pengelola: persegi dengan teks di atas isi kartu. Halaman verifikasi publik memakai header yang sama (`BingkaiPengelola`). Halaman 404 (`src/app/not-found.jsx`) dan galat (`src/app/error.jsx`, memakai logo bawaan) memakai persegi dengan teks. Logo ditampilkan apa adanya tanpa wadah atau latar putih (keputusan pemilik). Karena tulisan "Learning" dan garis tepi ikon pada logo bawaan berwarna biru tua, di tema gelap logo bawaan memakai versi gelap (`logo-landscape-gelap.png`, `logo-persegi-gelap.png`, `logo-persegi-teks-gelap.png` di `public/aset/logo/`) yang dipilih lewat CSS (`dark:`). Berkas itu dibuat dari ketiga logo asli oleh `node scripts/buat-logo-gelap.mjs` (menerangkan hanya biru tua yang menyentuh bagian luar logo; warna cerah tidak berubah) dan boleh ditimpa versi dari desainer. Logo yang diunggah admin (PNG atau WebP bertransparansi) juga mendapat versi gelap otomatis: server membuatnya dengan algoritma yang sama (`src/utils/logoGelap.js`) saat pertama diminta lewat `GET /api/v1/pengaturan/logo?slot=<slot>&tema=gelap` dan menyimpannya di `uploads/logo/<nama>-gelap.png` (terhapus bersama berkas aslinya saat diganti atau dikembalikan ke bawaan; logo yang diunggah sebelum fitur ini ikut terlayani). JPEG dan slot Logo sertifikat tidak punya versi gelap. Pratinjau di Pengaturan menampilkan kotak kedua berlatar gelap. Logo unggahan sebaiknya berlatar transparan dan berbentuk landscape untuk slot Logo utama; logo persegi 1024 px tampil kecil (tinggi 40 px) di header.
- **PDF sertifikat:** logo di tengah atas dalam kotak 180 x 56 pt tanpa mengubah rasio, dari Logo sertifikat; bila kosong Logo utama; bila itu WebP atau tidak terbaca, `logo-landscape.png` bawaan. Nama pelatihan dan perusahaan turun di bawah logo.
- **Cara uji:** (1) tanpa unggahan baru semua tempat memakai logo bawaan (kecuali Logo utama yang pernah diunggah); (2) unggah dan ganti tiap slot di Pengaturan: tampilan berubah, berkas lama di `uploads/logo/` terhapus, WebP ditolak untuk Logo sertifikat, berkas non-gambar atau di atas 1 MB ditolak; (3) **Kembalikan ke bawaan** menghapus unggahan; (4) unduh PDF sertifikat: logo di atas, tetap jadi walau Logo utama WebP; (5) tema gelap: logo utama dan persegi dengan teks berlatar putih, HP 360 px tanpa luapan mendatar; (6) buka alamat yang tidak ada (mis. `/xyz`) untuk melihat halaman 404.

## Palet warna biru-oranye (`docs/prompt/PROMPT_BUILD_WARNA.md`)
- Palet aplikasi mengikuti logo: **biru dan oranye** (sebelumnya ungu/indigo). Token resmi di `src/app/design-tokens.css` dan `docs/design-system.md`; komponen hanya memakai token (`bg-primary`, `text-fg`, dan seterusnya). Siswa dan orang tua cerah biru-oranye; pengelola biru dalam dengan **menu samping navy** (token `nav-*`) di tema terang dan gelap.
- Yang disesuaikan: menu samping pengelola (`ShellPengelola`), tema area kerja Blockly (`WARNA_AREA`), teks balon panggung Studio, latar pratinjau logo gelap di Pengaturan, dan PDF sertifikat (biru `#0A56B8`, aksen oranye `#E88A2E`, teks navy `#1B2A4D`; krem tetap). Warna isi game, kategori warna blok, gambar subjek, dan maskot tidak berubah.
- Cara uji: buka beranda pengelola dan beranda siswa di tema terang dan gelap (menu samping pengelola navy di keduanya, item aktif dan lencana terbaca); buka Pengaturan (pratinjau logo gelap); unduh satu sertifikat (judul biru, garis oranye, QR dan tanda tangan terbaca).

## Dashboard beranda pengelola (`docs/prompt/PROMPT_BUILD_DASHBOARD.md`, Tahap 1 sampai 3)

Beranda backoffice (`/`) kini dashboard: kartu **Sesi berlangsung sekarang** dengan tombol **Absen masuk** (di HP ada juga tombol oranye mengambang), empat kartu angka, dan grafik. Filter di kanan atas: pengatur bulan, pilihan level, dan **Atur ulang**; keadaannya ada di query URL (`?bulan=2026-11&level=<id>`), nilai tidak sah kembali ke bawaan (bulan berjalan, semua level). Rentang bulan: dari bulan sesi tertua (maksimal 24 bulan ke belakang) sampai bulan berjalan. Semua yang berkaitan dengan uang hanya untuk admin dan tidak dihitung untuk tutor.

Definisi angka (tanggal hari ini = `CURDATE()` database):

| Bagian | Definisi | Mengikuti filter |
|---|---|---|
| Sesi berlangsung | sesi berstatus berlangsung dengan tanggal hari ini; jumlah siswa, jumlah tutor berbeda, tiga siswa terlama | tidak |
| Siswa aktif | siswa berstatus aktif; "+N bulan ini" dari tanggal daftar di bulan berjalan | tidak |
| Sesi 7 hari terakhir | baris sesi hari ini dan 6 hari sebelumnya, dibanding 7 hari sebelum itu | tidak |
| Post test menunggu dinilai | post test selesai dikumpulkan tetapi belum difinalisasi (sama dengan tab Menunggu); usia tertua dalam hari sejak dikumpulkan | tidak |
| Pembayaran bulan ini (admin) | `pembayaranModel.totalBulanIni` | tidak |
| Sesi per hari | baris `sesi` per tanggal pada bulan terpilih (level = level pertemuan, sama dengan ekspor kehadiran); hari ini berwarna oranye, hari yang belum tiba kosong | bulan, level |
| Siswa per level | siswa aktif per level yang sedang berjalan (siswa aktif tanpa level berjalan tidak dihitung) | tidak |
| Post test | **Belum tes** = siswa aktif pada level berjalan yang sudah memenuhi syarat kehadiran (pertemuan 1-12 berbeda >= pengaturan `kehadiran_min_post_test`, atau diberi pengecualian) dan belum punya satu pun percobaan post test (dihitung per hari ini). **Selesai dan sudah dinilai** = percobaan dengan nilai total terisi yang dikumpulkan (`selesai_at`) pada bulan terpilih, dengan rincian lulus / belum lulus. **Menunggu penilaian tutor** = dikumpulkan pada bulan terpilih tetapi belum difinalisasi | bulan, level (Belum tes hanya level) |
| Pembayaran 6 bulan terakhir (admin) | total `jumlah` per bulan untuk 6 bulan berakhir di bulan terpilih (level = level berjalan siswa); "N siswa membayar, M belum" = siswa aktif dengan / tanpa minimal satu catatan pembayaran pada bulan terpilih | bulan, level |
| Penuntasan tugas per minggu | per minggu (1-7, 8-14, 15-21, 22-28, 29-akhir) proporsi sesi tuntas / tuntas sebagian / tidak tuntas (pilihan tutor, bila kosong hasil otomatis); sesi tanpa penuntasan tidak dihitung | bulan, level |

Kartu **Perlu perhatian** (kondisi saat ini, tidak mengikuti filter) memuat daftar tindakan dengan jumlah dan tombol ke halaman yang sudah ada; bagian yang jumlahnya 0 tidak tampil, dan bila semuanya 0 muncul "Semua beres" dengan Zippy. Isinya: (1) post test menunggu dinilai (tombol Nilai, tab Menunggu), (2) siswa aktif tanpa sesi dalam 21 hari terakhir, tidak termasuk siswa yang mendaftar kurang dari 21 hari lalu (tombol Lihat, daftar siswa aktif karena daftar siswa belum punya filter "tanpa sesi"), (3) siswa aktif belum dicatat bayar bulan ini, hanya admin (tombol Catat, `/absensi` karena pembayaran dicatat di sesi), (4) sesi yang masih berlangsung padahal tanggalnya sebelum hari ini (tombol Tutup, `/absensi`).

Keadaan khusus: saat filter diganti, kartu grafik menampilkan Skeleton (isi lama disembunyikan, judul tetap) dan filter dinonaktifkan sampai data baru tiba; periode tanpa data menampilkan "Belum ada data bulan ini" di dalam kartu; satu bagian yang gagal dimuat hanya menampilkan pesan galat di kartunya (galat dicatat di log server). Susunan kartu mengikuti lebar area konten (container query), bukan lebar layar, karena menu samping memakan 256 px di layar 768 px ke atas. Animasi batang dan Skeleton mati bila pengguna memilih "kurangi gerakan".

Cara uji: `npm run data:uji-besar` (hapus dengan `npm run data:uji-besar '--' --hapus`), masuk sebagai admin lalu tutor, ganti bulan dan level, ketuk atau hover batang di grafik Sesi per hari, ubah lebar jendela ke 360 px. Total Sesi per hari harus sama dengan jumlah baris ekspor kehadiran untuk bulan dan level yang sama.
