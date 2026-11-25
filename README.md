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
| `npm run db:init` | Menjalankan `schema.sql` (satu-satunya skrip yang memakai `multipleStatements`). Bila skema sudah terpasang, hanya menambah kolom dan indeks baru yang belum ada (`post_test.bagian_ulang` dan indeks Fase F) tanpa mengubah data. Aman dijalankan berulang |
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
    shared/ui/domain/         KolomKode, Maskot, StatusSesi, OpsiJawaban, Konfeti, GrafikKemajuan, KartuGambar, Pewaktu
scripts/                      db-init, db-seed, admin-buat, siswa-uji, data-uji-besar, _alias, _koneksi, _idGen (+ gabung-mewarnai)
uploads/                      logo/ dan karya/<siswaId>/ (tidak masuk git; wajib ikut dicadangkan)
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
| `tugas` | `GET /api/v1/tugas/unduh?tugasId=&kode=` (siswa) | Generate tugas saat absen (`jumlah_tugas_per_sesi`, minimal sepertiga per jenis penilaian), jawaban otomatis pilihan ganda/Excel, Ganti tugas, Lewati, ubah status oleh tutor, penuntasan otomatis, unduh bahan `mewarnai.png`/`berwarna.png` |
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
| `sesi` | `/bahan` | Bahan unduhan untuk tugas Paint/Word |

- Halaman latihan bisa dibuka kapan saja, tetapi hasil hanya disimpan saat sesi aktif (di luar sesi tampil "lihat saja"). Menu latihan di header siswa aktif hanya selama sesi berlangsung.
- Tugas sesi bertipe mengetik, game mouse, dan puzzle **selesai otomatis** bila hasil memenuhi target (`min_wpm`/`min_akurasi`, `min_skor`, gambar dan jumlah keping yang sama). Tombol **Main**/**Kerjakan** di kartu tugas membuka halaman latihannya dengan tugas itu.
- Server menghitung ulang WPM dan akurasi, dan menolak hasil yang tidak wajar (WPM > 250, durasi < 3 detik, karakter benar > karakter diketik, skor game > 5 per detik). Batasnya di `BATAS_LATIHAN` (`src/enums/index.js`).

## Modul Fase D2 (post test)

| Modul | Halaman / endpoint | Isi |
|---|---|---|
| `posttest` | Siswa `/post-test`; backoffice `/post-test`, `/post-test/[id]`; `POST /api/v1/posttest/denyut` (siswa) | Tombol **Mulai Post Test** di beranda siswa saat sesi pertemuan 13 aktif, 15 butir (1 tes mengetik + butir acak bagian B/C/D dari bank), pewaktu 45 menit, lanjut setelah ganti device dengan sisa waktu yang sama, kumpulkan (manual atau otomatis saat waktu habis), penilaian per bagian dan total, nilai bagian praktik oleh tutor dengan rubrik, kelulusan, **Buka tes ulang** per bagian, tab **Post test** di detail siswa |
| `sertifikat` | Lihat Fase E | Dipanggil saat finalisasi post test lulus (`terbitkanOtomatis`) |

- Layar post test memakai `ShellSiswa mode="fokus"` (tanpa menu, ping sesi tetap berjalan). Kunci jawaban tidak pernah dikirim ke browser.
- Waktu dihitung server: tiap denyut (15 detik) menambah paling banyak 30 detik. Membuka halaman lagi setelah ganti device mengatur ulang titik hitung, sehingga waktu saat tidak login tidak terpakai.
- Bagian mengetik dinilai saat tes mengetik dikirim (sekali saja, teks tetap untuk satu percobaan). Saat dikumpulkan, bagian pilihan ganda = benar / jumlah soal x 100, butir kosong dihitung salah, tes mengetik yang belum dikerjakan bernilai 0. Bagian praktik menunggu nilai tutor; setelah semua bagian terisi, total dan kelulusan dihitung (batas di Pengaturan, bawaan total >= 70 dan tiap bagian >= 50).
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
2. Siswa masuk tanpa sesi: **Mengetik**, **Latihan mouse**, dan **Puzzle** bisa dibuka dalam mode lihat saja (hasil tidak disimpan).
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
2. Selesaikan post test siswa sampai lulus (Cara uji Fase D2). Begitu nilai bagian terakhir disimpan tutor, detail post test menampilkan kartu **Sertifikat** berstatus **Terbit** dengan nomor `DPL-L1-<YYYYMM>-0001`. Menyimpan ulang nilai tidak membuat sertifikat kedua.
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
| Siswa `/`, `/mengetik`, `/mengetik/kemajuan`, `/latihan-mouse`, `/puzzle`, `/bahan`, `/karya`, `/post-test` | – | – | – | ✓ | – | `wajibSiswa`; tanpa sesi berlangsung hanya lihat saja |
| Siswa `/ortu` | – | – | – | – | ✓ | `wajibOrtu`; data dibatasi `siswaId` cookie |
| `/verifikasi/[token]` (kedua host) | ✓ | ✓ | ✓ | ✓ | ✓ | noindex, no-store, data terbatas |
| `GET /api/v1/health`, `GET /api/v1/pengaturan/logo` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `POST /api/v1/pengaturan/logo` | – | ✓ | – | – | – | |
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

## Cara uji Fase F

1. `npm run db:init` (menambah indeks baru pada database lama). Admin dan tutor masuk backoffice: beranda menampilkan kartu siswa aktif, sesi berlangsung, post test menunggu, sertifikat bulan ini; kartu **pembayaran bulan ini** hanya tampil untuk admin.
2. Absen Siswa Uji, tulis catatan di detail sesi (ada petunjuk "Catatan ini dapat dibaca orang tua."), lalu masuk dengan kode orang tua di area siswa: `/ortu` menampilkan ringkasan, riwayat sesi dengan catatan dan nama tutornya, post test, mengetik, pembayaran dan totalnya, sertifikat (Unduh PDF dan Cek keaslian), dan karya. Coba di lebar HP.
3. Siswa (sedang sesi) membuka **Karya** -> **Tambah karya**: tautan `https://scratch.mit.edu/...` dan gambar PNG tersimpan (Zippy merayakan). `javascript:alert(1)`, `data:...`, `https://user:pass@...` ditolak; berkas SVG, teks berekstensi `.png`, atau lebih dari 3 MB ditolak. Setelah sesi ditutup, galeri tetap bisa dilihat tetapi tombol tambah terkunci dan ubah/hapus ditolak.
4. Buka `/api/v1/karya/berkas?id=<id karya siswa lain>` dengan login siswa atau orang tua lain: 404. Tutor menghapus karya dari `/karya` (tercatat di Log) dan berkasnya hilang dari `uploads/karya/`.
5. **Ekspor**: unduh keempat CSV dan buka di Excel. Huruf seperti "é" utuh, tidak ada kolom kode akses, dan keterangan pembayaran `=HYPERLINK(...)` tampil sebagai teks berawalan apostrof.
6. Performa (opsional, database pengembangan): `npm run data:uji-besar`, buka daftar siswa/sesi/sertifikat/log, lalu `npm run data:uji-besar '--' --hapus`.
