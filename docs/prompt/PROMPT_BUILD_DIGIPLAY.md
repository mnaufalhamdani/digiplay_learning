# PROMPT: Bangun DigiPlay Learning

> **Cara pakai:** pastikan berkas pendukung sudah ada di root project (lihat bagian 0), lalu di chat agent tulis:
> `Baca docs/prompt/PROMPT_BUILD_DIGIPLAY.md lalu kerjakan Fase B.` (ganti nama fasenya sesuai kebutuhan)
> Kerjakan **satu fase per permintaan**. Jika fase tidak disebut, mulai dari Fase A.
> Berkas ini sendiri berada di `docs/prompt/PROMPT_BUILD_DIGIPLAY.md`. Semua fase sudah lengkap: A, B, C, D1, D2, E, F. Deploy ditunda sampai domain dan server siap.

---

## 0. Berkas pendukung (harus sudah ada di root project)

| Berkas | Letak | Fungsi |
|---|---|---|
| `project-context.md` | `.kiro/steering/` | **Sumber kebenaran keputusan** (alur sesi, peran, penilaian, sertifikat, domain). Baca penuh sebelum mulai. |
| `schema.sql` | root | Skema MySQL 8, 25 tabel. Gunakan apa adanya. |
| `docs/design-system.md` | `docs/` | Aturan desain, komponen, layout. |
| `src/app/design-tokens.css` | `src/app/` | Token warna, bentuk, gerak (diimpor dari `globals.css`). |
| `seed/level-pertemuan.json` | `seed/` | 3 level x 13 pertemuan. |
| `seed/template-level-1.json`, `-2`, `-3` | `seed/` | Template soal/tugas, definisi bagian post test, bank teks mengetik. |
| `docs/aset/prompt-gambar.csv` | `docs/aset/` | 75 subjek gambar (kode, kategori, nama). |
| `docs/prompt/PROMPT_BUILD_DIGIPLAY.md` | `docs/prompt/` | Prompt ini sendiri. |
| `scripts/gabung-mewarnai.mjs` | `scripts/` | Skrip penggabung gambar mewarnai (sudah jadi, jangan diubah). |
| `public/aset/gambar/<kode>/` | `public/aset/gambar/` | Gambar subjek (outline, berwarna, puzzle, mewarnai). |
| `public/aset/maskot/zippy-<suasana>.png` | `public/aset/maskot/` | Maskot Zippy (PNG transparan, potret 3:4; `zippy-wajah.png` persegi 1:1). |

Jika folder referensi **DK Docs** tersedia (misal `referensi/dk_docs/`), tiru pola kodenya. Jika tidak, ikuti uraian di dokumen ini; semua pola yang perlu sudah dijelaskan.

---

## 0b. Penyesuaian setelah Fase A (wajib dibaca sebelum Fase B dan seterusnya)

Fase A sudah selesai. Catatan lengkapnya ada di `.kiro/steering/project-context.md`, bagian **"Catatan teknis Fase A"**; baca dan ikuti. Poin yang paling memengaruhi fase berikutnya:

- **Pola yang sudah berjalan menang atas uraian di dokumen ini.** Bila ada perbedaan kecil antara dokumen ini dan kode Fase A (nama helper, penamaan berkas), tiru kode Fase A dan catat penyimpangannya di laporan. Jangan mengubah pola Fase A yang sudah berjalan.
- **Controller menerima `(input, sesi)`.** Hak akses **Server Action** ditegakkan di `*.actions.js` lewat `authController.wajibAkses(akses)`; hak akses **route HTTP** lewat kolom `akses` di `*.routes.js` (tanpa `akses` dianggap `pengguna`). Halaman khusus admin yang dibuka tutor dijawab 404 (`notFound()`).
- **Tautan dan redirect** harus memakai mekanisme basis jalur yang sudah dibuat di Fase A (header `x-dp-basis` dari `src/proxy.js`), supaya benar di host asli maupun cadangan `localhost`/IP. Jangan menulis jalur `/siswa/...` atau `/backoffice/...` secara keras.
- **Ikon Phosphor** dipakai dengan nama berakhiran `Icon` (misal `SignOutIcon`), tetap lewat pembungkus `Ikon`.
- **Database lokal adalah MariaDB 11.8** (port 3307), sedangkan produksi bisa MySQL 8. Semua SQL harus **kompatibel dengan keduanya**. Akibat penting: pada MariaDB kolom `JSON` adalah alias teks, sehingga driver mengembalikan **string**, sedangkan pada MySQL 8 dikembalikan sebagai objek. Karena itu **setiap model yang membaca kolom JSON** (`template.parameter/opsi/kunci`, `tugas_siswa.parameter_hasil`, `log_aktivitas.detail`, `hasil_*.detail*`) wajib memakai satu helper bersama (misal `uraiJson(nilai)` di `src/utils/`) yang mengurai bila nilainya string. Saat menulis, gunakan `JSON.stringify`. Jangan memakai fungsi JSON khusus MySQL di SQL (`JSON_TABLE`, operator `->`); lakukan pemrosesan JSON di aplikasi. Kolom `DECIMAL` kembali sebagai string; ubah dengan `Number()` di model.
- **Cookie orang tua `dp_ortu`** berisi `{ siswaId, kodeId, exp }`. Saat kode orang tua diganti, cookie lama harus otomatis tidak berlaku: validasi memeriksa bahwa `kodeId` masih kode aktif.
- **Versi dipin** seperti di `package.json` hasil Fase A (Next.js 16.4.6, dst). Jangan menurunkan versi.
- **Halaman placeholder** di `src/modules/layout/` (beranda siswa, orang tua, beranda pengelola) dipindahkan ke modul yang sesuai saat fasenya tiba (beranda siswa dan pengelola ke modul `sesi` di Fase C; rapor orang tua ke modul `rapor` di Fase F).
- **Pembatas percobaan login** mengambil IP dari `x-forwarded-for` dari kanan (`JUMLAH_PROXY_TEPERCAYA`). Jangan diubah.

---

## 1. Tujuan

**DigiPlay Learning** adalah website les komputer anak berbasis **level** (tanpa patokan usia): 3 level (Pemula, Dasar, Lanjutan), tiap level 12 pertemuan materi + 1 pertemuan post test. Satu project Next.js (frontend + backend) yang melayani **dua area** lewat dua domain:

- **Area siswa** (`namadomain.com`): siswa login dengan **kode unik 8 karakter** (tanpa username/password), orang tua login dengan kode terpisah (hanya lihat). Tampilan playful, dengan maskot **Zippy**.
- **Area pengelola** (`backoffice.namadomain.com`): admin dan tutor login dengan email + password. Tutor mencatat absensi, menilai, dan mengelola siswa; admin mengelola pengaturan, akun tutor, dan materi.

Alur kerja inti: tutor mencatat **absen masuk** siswa (input kode siswa) -> siswa login dan mengerjakan tugas yang digenerate dari template acak -> siswa menekan **Pulang** -> tutor menulis catatan dan status penuntasan -> di pertemuan ke-13 siswa mengerjakan **post test** -> lulus -> sertifikat PDF terbit otomatis, orang tua memantau lewat kode mereka.

Tahap saat ini: pengerjaan **lokal** (belum ada domain/server). Domain dan deploy menyusul.

---

## 2. Aturan pengerjaan

- Jika project memiliki `rules.md` dan `architecture.md`, **baca dan ikuti keduanya**. Jika bertentangan dengan dokumen ini, keduanya yang menang; catat konfliknya di laporan akhir.
- **Scope**: kerjakan hanya fase yang diminta. Jangan mengubah berkas di luar kebutuhan fase. **Jangan mengubah** `schema.sql`, `scripts/gabung-mewarnai.mjs`, berkas di `seed/`, `docs/`, `public/aset/`, dan `src/app/design-tokens.css` tanpa alasan kuat; bila perlu, catat di laporan dan minta keputusan.
- **Tanpa test** (unit/widget/dll) kecuali diminta khusus. Skrip data uji manual (mis. `siswa-uji`) boleh.
- **Jangan menghapus kode** yang tidak terpakai atau yang dikomentari, baik milik project maupun yang ditulis dalam pengerjaan ini.
- **Jangan commit.** Perubahan ditinjau developer lewat editor.
- **Berhenti hanya jika butuh keputusan**; selain itu selesaikan fase sampai tuntas.
- **Dokumen yang diperbarui setelah fase selesai hanya `README.md` dan `.kiro/steering/project-context.md`.** Di `project-context.md` hanya tambahkan/ubah bagian **"Status pengerjaan"** di akhir berkas (centang fase, catat keputusan teknis dan penyimpangan); jangan mengubah keputusan di bagian lain. **Jangan membuat atau memperbarui `ringkasan-perubahan.md`.**
- **Arsitektur (clean architecture + dependency injection).** Satu project Next.js, **satu pola modul**: tiap modul berisi semua lapisannya dalam satu folder `src/modules/<modul>/`.
  - **Alur:** `*.jsx` (tampilan/interaksi) -> `<modul>.controller.ts` (penghubung tampilan dan usecase; validasi input memakai `<modul>.schema.js`; logika ringan) -> `<modul>.usecase.ts` (logika bisnis dan orkestrasi data) -> `<modul>.model.js` (**semua query SQL ada di model**, tidak boleh di lapisan lain).
  - Tampilan membaca data dengan memanggil controller langsung pada komponen halaman (server component), dan mengubah data lewat **Server Actions** (`'use server'`) yang memanggil controller dan dibungkus `jalankanAction`. Controller adalah satu-satunya pintu dari tampilan ke usecase.
  - `<modul>.routes.js`: daftar endpoint HTTP modul (metode, path, fungsi controller, schema, **`akses`**). Dipakai untuk yang tidak cocok dengan Actions: ping sesi, unduh berkas, upload, health. Berkas di `src/app/api/` hanya menyalurkan ke daftar ini.
  - `<modul>.service.js` **opsional**: hanya untuk komunikasi ke API/URL lain (belum dipakai).
  - **DI global** di `src/di/container.js` (awilix): model, usecase, controller diregistrasi di sana. Dependency **tidak dibuat di dalam class/function**.
  - Pasang `server-only` pada `*.model.js` dan `*.usecase.ts`. Berkas di `src/app/` hanya routing tipis, **tanpa logika**.
  - Saat dev (hot reload), simpan container DI dan pool MySQL di `globalThis`.
- **Dokumentasi kode:** setiap function diberi komentar ringkas dalam **Bahasa Indonesia**. Setiap percabangan non-trivial (if/else, switch, try-catch, loop bersyarat) diberi komentar singkat tentang **alasan/maksud**, bukan mengulang isi kode. Cek ulang komentar ini sebelum selesai.
- **Kompleksitas:** nesting maksimal 2-3 level (early return / extract function), function ±40-50 baris maksimal, satu function satu tanggung jawab, logika berulang di banyak berkas diekstrak ke helper. Jangan membuat berkas/function baru yang tidak dipakai fase ini.
- **Keamanan:** semua query **parameterized**; tidak ada `eval`/`new Function`; kredensial dan rahasia hanya di `.env` (sediakan `.env.example`, jangan commit `.env`); pesan error ke user tidak membocorkan detail internal.
- **Teks antarmuka** berbahasa Indonesia lewat `src/locales/id_ID.json` dan helper `t()`. Teks yang dibaca anak harus singkat dan ramah.
- **Bug fix** (bila diminta di luar fase): perbaiki sampai tuntas lalu tulis laporan `docs/reports/<nama-bug>.md` berisi Ringkasan, Masalah, Error, Solusi, File diubah, File baru; tanpa menyalin kode.

---

## 3. Teknologi

- **Next.js (App Router)**, React, JavaScript. `tsconfig` dengan `allowJs` agar `*.controller.ts` dan `*.usecase.ts` berdampingan dengan berkas JS. Alias `@/*` -> `src/*`.
- **Node.js 20+**, **awilix** (DI), **mysql2** (connection pool, tanpa ORM, SQL di `*.model.js`), **zod** (validasi), **server-only**.
- **Tailwind CSS v4** (`@tailwindcss/postcss`), mode gelap lewat class `dark`. **next/font**: Fredoka (judul area siswa) dan Nunito (teks), dipasang lokal.
- **@phosphor-icons/react** untuk ikon (bobot `bold` untuk siswa, `regular` untuk pengelola), selalu lewat komponen pembungkus `Ikon`.
- **sharp** hanya untuk skrip; **pdfkit** dan **qrcode** dipakai di Fase E.
- Database **MySQL 8**, nama `digiplay_learning`.
- `package.json` bernama `digiplay-learning`; nama tampilan aplikasi dibaca dari tabel `pengaturan` (bawaan **DigiPlay Learning**).
- **Pin semua versi persis (tanpa `^`/`~`).** Acuan versi dari DK Docs bila tersedia: next 16.4.2, react/react-dom 19.3.1, tailwindcss + @tailwindcss/postcss 4.3.3, awilix 13.0.5, mysql2 3.24.6, zod 4.6.7, server-only 0.0.1, sharp 0.35.5, dotenv 18.0.9, typescript 5.9.3. Jika tidak tersedia, pakai versi stabil terbaru yang saling kompatibel dan catat di laporan.

---

## 4. Struktur folder (acuan)

Satu project, **satu pola modul**. Folder yang tidak dibutuhkan fase berjalan **tidak dibuat**. Berkas bertanda `*` sudah ada (lihat bagian 0).

```
digiplay-learning/
├── .kiro/steering/project-context.md  *
├── schema.sql                      *
├── README.md                       # dibuat/diperbarui agen
├── .env.example
├── scripts/
│   ├── gabung-mewarnai.mjs         *
│   ├── db-init.mjs                 # menjalankan schema.sql
│   ├── db-seed.mjs                 # Fase B
│   ├── admin-buat.mjs              # membuat admin pertama
│   └── siswa-uji.mjs               # data uji manual: satu siswa + kode siswa/ortu
├── seed/                           *
├── docs/                           *  (docs/prompt/ prompt agen, docs/reports/ laporan bug fix)
├── public/aset/                    *
├── uploads/                        # logo dan berkas unggahan (masuk .gitignore)
└── src/
    ├── proxy.js                    # pengarah domain (Next 16; di versi lama bernama middleware.js)
    ├── app/
    │   ├── layout.jsx              # akar: <html>, font, skrip tema; TANPA data-area
    │   ├── globals.css             # @import "tailwindcss"; @import "./design-tokens.css";
    │   ├── design-tokens.css       *
    │   ├── siswa/                  # area siswa + orang tua (data-area="siswa")
    │   ├── backoffice/             # area pengelola (data-area="pengelola")
    │   ├── publik/verifikasi/      # Fase E
    │   └── api/v1/[[...segmen]]/route.js
    ├── config/                     # database.js, keamanan.config.js
    ├── di/                         # container.js
    ├── enums/
    ├── locales/id_ID.json
    ├── logger/
    ├── middlewares/routeHandler.js
    ├── modules/
    │   ├── routes.index.js
    │   ├── health/  pengaturan/  auth/  pengguna/  log/
    │   ├── siswa/  level/  template/  gambar/                 # Fase B
    │   ├── sesi/  tugas/  pembayaran/                         # Fase C
    │   ├── mengetik/  latihan/  posttest/                     # Fase D
    │   ├── sertifikat/                                        # Fase E
    │   ├── karya/  rapor/                                     # Fase F
    │   ├── layout/                 # ShellSiswa, ShellPengelola, menu
    │   └── shared/
    │       ├── ui/                 # Button, TextField, Card, Badge, Modal, ConfirmDialog, Toast, Ikon, ...
    │       └── ui/domain/          # KolomKode, Maskot, ...
    └── utils/                      # idGenerator, appError, responseHandler, validasi, i18n,
                                    # kodeAkses, kripto, templateRender, evaluasiEkspresi, ...
```

---

## 5. Database

- Gunakan `schema.sql` apa adanya (25 tabel, **snake_case**, tabel **singular**). Sediakan `npm run db:init` (menjalankan `schema.sql`; hanya skrip ini yang boleh memakai `multipleStatements`), `npm run db:seed` (Fase B), `npm run admin:buat`, dan `npm run siswa:uji`.
- **ID**: semua primary key `BIGINT UNSIGNED` **tanpa AUTO_INCREMENT**, dibuat aplikasi lewat `idGen` (DI), format `<timestamp ms><SERVER_ID 2 digit><counter>`, 17-18 digit. Di JavaScript **wajib diperlakukan sebagai string**. Pool mysql2: `supportBigNumbers: true`, `bigNumberStrings: true`, `dateStrings: true`, `charset: 'utf8mb4'`. Skrip memakai `SCRIPT_SERVER_ID` (99) agar tidak bentrok dengan aplikasi.
- Kolom `*_kunci` (generated, STORED) pada `kode_akses`, `siswa_level`, `sesi`, `login_perangkat`, `post_test`, `sertifikat` menjaga "satu aktif per ..." lewat UNIQUE. **Jangan mengisi kolom `*_kunci` saat INSERT.** Pelanggaran UNIQUE (error duplikat) ditangkap dan diubah menjadi pesan ramah.
- Foreign key pada kolom dasar kolom generated memakai RESTRICT (batasan MySQL). **Menghapus siswa** dilakukan usecase dalam **satu transaksi** dengan urutan di komentar kepala `schema.sql`.
- Tabel `pengaturan` berisi key-value teks (nilai bawaan sudah di-seed oleh `schema.sql`); aplikasi yang mengubah tipenya.
- Semua perubahan penting (ubah penuntasan, batal sertifikat, ganti kode, ganti level, hapus siswa, ubah pengaturan, kelola akun) dicatat ke `log_aktivitas` lewat satu helper `catatAktivitas`.

---

## 6. Konsep domain (ringkas; detail di `project-context.md`)

- **Level -> Pertemuan -> Template.** Tiap level 13 pertemuan; nomor 13 = post test. Template soal/tugas memakai **parameter acak** (tanpa AI).
- **Siswa** tidak punya username/password. **Kode unik 8 karakter**, alfabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tanpa O, I, 0, 1). **Kode siswa dan kode orang tua terpisah** (`kode_akses.jenis`); kode lama tidak dihapus saat diganti (`aktif = 0`).
- **Peran:** admin, tutor (email + password), siswa, orang tua. Admin: semua hal tutor + pengaturan, kelola akun tutor, hapus siswa, ubah template. Tutor: daftarkan siswa, absen, catatan, penuntasan, pembayaran, sertifikat.
- **Sesi** = kehadiran satu siswa pada satu pertemuan (tutor absen masuk dengan input kode siswa -> siswa Pulang -> selesai). Siswa yang belum absen hanya bisa **melihat** (seperti orang tua). **Satu kode hanya aktif di satu perangkat.** Login perangkat berakhir bila **tidak aktif > batas** (`batas_tidak_aktif_menit`, bawaan 5).
- **Ganti device**: mengakhiri login di PC itu, absensi tetap berjalan. Hanya **Pulang** (atau tutor menutup sesi) yang mengakhiri absensi.
- **Status tugas:** belum, selesai, dilewati, diganti. **Penuntasan** pertemuan: tuntas / tuntas sebagian / tidak tuntas, dihitung otomatis dan bisa diubah tutor (pilihan tutor yang berlaku).
- **Post test:** 15 butir, 45 menit; lulus bila total >= 70 dan tiap bagian >= 50; syarat kehadiran >= 9 dari 12 pertemuan.
- **Sertifikat** terbit otomatis saat lulus; QR menuju halaman verifikasi publik berbasis **token acak** (bukan nomor berurutan) tanpa data sensitif.
- **Pembayaran** dicatat manual oleh tutor dan terlihat oleh orang tua.
- **Dua area, satu project:** `namadomain.com` -> `src/app/siswa`, `backoffice.namadomain.com` -> `src/app/backoffice`. **Cookie sesi tidak dibagi antar domain** (tanpa atribut `Domain`).

---

## 7. Fase pengerjaan

### Fase A - Fondasi, auth, dan area

**A1. Setup project**

1. Siapkan project Next.js di root **tanpa menimpa** berkas yang sudah ada (bagian 0). Buat `package.json` (nama `digiplay-learning`, `"type": "module"`, skrip `dev`, `build`, `start`, `db:init`, `db:seed`, `admin:buat`, `siswa:uji`), `tsconfig.json` (allowJs, alias `@/*`), `next.config.mjs`, `postcss.config.mjs`, `.gitignore` (`node_modules/`, `.next/`, `.env`, `.env.local`, `uploads/*` kecuali `.gitkeep`, `*.tsbuildinfo`, `next-env.d.ts`, `.vscode/`).
2. `.env.example`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=digiplay_learning`, `SERVER_ID=01`, `SCRIPT_SERVER_ID=99`, `SESSION_SECRET` (wajib, minimal 32 karakter, komentar cara membuatnya), `HOST_SISWA=siswa.localhost`, `HOST_BACKOFFICE=backoffice.localhost` (hostname **tanpa port**; saat produksi diganti domain asli), `UPLOAD_DIR=uploads`. Aplikasi gagal start dengan pesan jelas bila `SESSION_SECRET` kosong atau pendek.
3. `src/app/globals.css`: `@import "tailwindcss";` lalu `@import "./design-tokens.css";`, gaya dasar minimum. Jangan mengubah isi `design-tokens.css`.
4. `src/app/layout.jsx` (akar, server component): `<html lang="id">`, font Fredoka dan Nunito lewat `next/font` dengan variabel CSS `--font-fredoka` dan `--font-nunito`, **skrip tema anti-kedip** yang menambah class `dark` pada `<html>` dari `localStorage.theme` atau `prefers-color-scheme` sebelum render (pola `SKRIP_TEMA` DK Docs), `suppressHydrationWarning`. Akar **tidak** memasang `data-area`; pembungkus tiap area yang memasangnya.

**A2. Fondasi backend (pola DK Docs)**

1. `src/config/database.js`: pool tunggal di `globalThis`; helper `buatDb(pool)` untuk semua `*.model.js` (jalankan query, satu baris, banyak baris, transaksi dengan koneksi yang bisa diteruskan).
2. `src/utils/`: `idGenerator.js` (kelas `IdGenerator` seperti DK Docs, counter dinaikkan bila dipanggil di milidetik yang sama), `appError.js` (`AppError`, `adalahAppError` berbasis nama), `responseHandler.js` (`sukses`, `gagal`, `berkas`, `hasilBerkas`, `normalisasiError`, `jalankanAction`), `validasi.js` (pembungkus zod yang melempar `AppError` 400 dengan detail isu), `i18n.js` (`t(kunci, params)`), `kodeAkses.js` (lihat A3), `kripto.js` (hash password dengan `scrypt` bawaan Node + salt acak, perbandingan konstan-waktu; `sha256`; penanda-tangan HMAC untuk cookie; token acak 32 byte).
3. `src/di/container.js` (awilix, di `globalThis` saat dev) dan `ambilDep()`. `src/logger/logger.js`.
4. `src/middlewares/routeHandler.js` + `src/modules/routes.index.js` + `src/app/api/v1/[[...segmen]]/route.js` (menyalurkan `GET/POST/PUT/PATCH/DELETE` ke `tanganiRequest`). Setiap route punya **`akses`**: `publik`, `pengguna`, `admin`, `siswa`, `ortu`, `siswa_atau_ortu`; `routeHandler` menegakkan akses **sebelum** memanggil controller (gagal -> 401/403 seragam). Untuk metode selain GET, periksa header `Origin` sama dengan host request (bila ada), jika tidak 403.
5. `src/enums/`: peran (`admin`, `tutor`), jenis kode akses (`siswa`, `ortu`), area (`siswa`, `pengelola`), alasan berakhir login.
6. Modul `health`: `GET /api/v1/health` (cek koneksi database), `akses: publik`.
7. Modul `log`: model/usecase `catatAktivitas({ penggunaId, aksi, entitas, entitasId, detail })` dan helper agar bisa dipakai modul lain lewat DI. Halaman daftar log menyusul di Fase B.

**A3. Auth dan sesi**

Konfigurasi batas keamanan di `src/config/keamanan.config.js` (bukan angka tersebar): percobaan gagal login backoffice 5 per IP per 15 menit; percobaan gagal kode 10 per IP per 15 menit; masa cookie pengelola 12 jam; masa cookie orang tua 7 hari; interval ping 60 detik; throttle pembaruan `terakhir_aktif_at` 30 detik.

1. **Kode akses** (`utils/kodeAkses.js`): `buatKode()` memakai `crypto.randomInt`, alfabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, panjang dari pengaturan `panjang_kode_akses` (bawaan 8); `normalisasiKode(teks)` (trim, huruf besar, buang spasi dan tanda hubung); `kodeValid(teks)` (hanya karakter alfabet dan panjang benar). Karakter di luar alfabet **ditolak**, tidak dikoreksi otomatis.
2. **Login pengelola** (email + password): cari `pengguna` aktif, verifikasi hash. Gagal dengan pesan **sama** untuk email tidak ada dan password salah. Catat setiap percobaan ke `percobaan_login` (area `backoffice`, IP dari `x-forwarded-for` bagian pertama atau alamat koneksi, `berhasil`). Bila melewati batas -> pesan "Coba lagi nanti" (HTTP 429). Sukses: cookie **`dp_bo`** = payload `{ penggunaId, peran, exp }` ditandatangani HMAC-SHA256 dengan `SESSION_SECRET`; `httpOnly`, `sameSite=lax`, `secure` di produksi, `path=/`, **tanpa `Domain`**. Perbarui `terakhir_login_at`. Setiap pembacaan sesi memeriksa tanda tangan, kedaluwarsa, dan bahwa pengguna masih `aktif` di database (akun yang dinonaktifkan langsung tidak bisa masuk).
3. **Login kode** (satu form di area siswa untuk siswa dan orang tua): normalisasi, validasi format, hitung batas percobaan, cari `kode_akses` (`aktif = 1`) berikut siswa.
   - Kode tidak ada/salah -> pesan generik "Kode tidak dikenali" (tidak membedakan sebabnya). Siswa `nonaktif` -> "Akun belum aktif, tanyakan kepada tutor."
   - Jenis **`ortu`**: cookie **`dp_ortu`** bertanda tangan `{ siswaId, exp }` (7 hari), mode lihat saja; arahkan ke `/ortu`.
   - Jenis **`siswa`**: aturan **satu kode satu perangkat** lewat `login_perangkat`. Bila ada login aktif (`berakhir_at IS NULL`): jika `terakhir_aktif_at` masih dalam batas tidak aktif -> **tolak** dengan pesan ramah "Kodemu sedang dipakai di perangkat lain. Tekan Ganti device di perangkat itu atau minta bantuan tutor." Jika sudah melewati batas -> akhiri login lama (`alasan_berakhir = 'tidak_aktif'`) lalu izinkan. Buat baris baru dengan token acak 32 byte; di database simpan **hash SHA-256**-nya (`token_hash`), cookie **`dp_siswa`** berisi token mentah (`httpOnly`, `sameSite=lax`, `secure` produksi, tanpa `Domain`). Tangani balapan (dua login bersamaan) lewat error UNIQUE `aktif_kunci` -> pesan yang sama seperti di atas.
4. **Pembaca sesi** (dipakai layout dan controller): `ambilSesiPengguna()`, `ambilSesiSiswa()`, `ambilSesiOrtu()`. `ambilSesiSiswa()` mencari login aktif lewat hash token; bila `terakhir_aktif_at` melewati batas -> akhiri (`tidak_aktif`) dan kembalikan null; selain itu perbarui `terakhir_aktif_at` (dengan throttle). Guard: `wajibPengguna(peranMinimal?)`, `wajibAdmin()`, `wajibSiswa()`, `wajibOrtu()` yang mengarahkan ke halaman masuk yang sesuai.
5. **Aksi sesi siswa**: `POST /api/v1/auth/ping` (`akses: siswa`, dipanggil klien tiap 60 detik saat tab terlihat; balasan 401 bila login sudah berakhir), aksi **Ganti device** (akhiri login, `alasan_berakhir = 'ganti_device'`, hapus cookie, arahkan ke masuk) dan **Keluar** (`logout`). Sediakan fungsi usecase `akhiriLoginSiswa(siswaId, alasan)` yang dipakai ulang di Fase C (pulang, ditutup tutor).
6. Hapus baris `percobaan_login` yang lebih tua dari 24 jam secara berkala (mis. peluang 1 dari 50 saat mencatat), tanpa penjadwal terpisah.

**A4. Pengarah domain** (`src/proxy.js`)

1. Baca hostname (tanpa port) dan bandingkan dengan `HOST_SISWA` dan `HOST_BACKOFFICE`. Host siswa: tulis ulang `/x` -> `/siswa/x`. Host backoffice: `/x` -> `/backoffice/x`. Jalur publik `/verifikasi/*` dipetakan ke `/publik/verifikasi/*` di kedua host.
2. **Tolak akses silang**: permintaan langsung ke `/backoffice/*` pada host siswa, atau `/siswa/*` pada host backoffice, dijawab 404. `/api/*`, `/_next/*`, `/aset/*`, dan berkas statis **tidak** ditulis ulang.
3. Host yang tidak cocok dengan keduanya (akses lewat IP atau `localhost`): **cadangan dev** - `/backoffice/*` dan `/siswa/*` dapat dibuka langsung tanpa penulisan ulang.
4. Atur `serverActions.allowedOrigins` di `next.config.mjs` dari `HOST_SISWA` dan `HOST_BACKOFFICE` (termasuk varian dengan port dev), dan dokumentasikan di README bahwa di belakang reverse proxy header `Host` harus diteruskan. Di Next 16 nama berkasnya `proxy`; pastikan sesuai versi terpasang dan catat bila berbeda.

**A5. Modul `pengaturan` dan `pengguna`**

1. `pengaturan`: baca semua, baca per kunci, ubah (validasi tipe: angka bulat positif untuk batas dan nilai, nilai lulus 0-100). Helper `ambilPengaturan()` dengan cache memori singkat (30 detik) yang dibersihkan saat ubah. Halaman **Pengaturan** (admin): nama pelatihan, nama perusahaan, logo (unggah PNG/JPEG/WebP, maksimal 1 MB, simpan di `uploads/logo/`, **tanpa SVG**, sajikan lewat route berkas), `batas_tidak_aktif_menit`, `nilai_lulus_total`, `nilai_lulus_bagian`, `kehadiran_min_post_test`, `durasi_post_test_menit`. `panjang_kode_akses` hanya ditampilkan (tidak bisa diubah). Nama pelatihan dan logo tampil di header kedua area dan judul tab.
2. `pengguna` (admin): daftar, tambah (nama, email unik, peran, password awal minimal 8 karakter), ubah nama/peran, aktif/nonaktif, reset password. **Akun tidak dihapus**, hanya dinonaktifkan. Tidak boleh menonaktifkan atau menurunkan admin aktif terakhir. Setiap pengguna dapat mengubah password sendiri (halaman **Akun**, wajib password lama). Semua tercatat ke `log_aktivitas`.
3. `npm run admin:buat -- --email <e> --nama "<n>" --password "<p>"`: membuat admin pertama (atau meminta input interaktif bila argumen kosong). Menolak jika email sudah ada.
4. `npm run siswa:uji`: membuat (idempoten) satu siswa bernama **Siswa Uji** beserta kode siswa dan kode orang tua, lalu mencetak kedua kode. Dipakai untuk menguji login di Fase A.

**A6. UI fondasi**

1. Komponen di `src/modules/shared/ui/` sesuai `docs/design-system.md` (bagian 7): `Button`, `TextField`, `Card`, `Badge`, `Modal`, `ConfirmDialog`, `Toast`, `Ikon`, `ThemeToggle`; dan `ui/domain/`: `KolomKode` (8 kotak, huruf kapital otomatis, mendukung tempel, pindah kotak otomatis, menolak karakter di luar alfabet dengan pesan ramah), `Maskot` (memuat `/aset/maskot/zippy-<suasana>.png`; bila berkas tidak ada, sembunyikan gambar tanpa error). Hanya token warna, **tanpa warna keras**; tinggi sentuh, fokus keyboard, dan `prefers-reduced-motion` mengikuti desain. `ConfirmDialog` mengikuti spesifikasi (nada `bahaya` memfokuskan tombol Batal, Esc menutup, fokus terkunci).
2. `Ikon` adalah client component pembungkus Phosphor yang memilih bobot dari area lewat context kecil (`AreaContext` diisi tiap shell); jangan mengimpor Phosphor langsung di halaman.
3. Layout di `src/modules/layout/`: **ShellSiswa** (header dengan nama pelatihan/logo, tombol tema, menu; saat login aktif tampil **Ganti device** dan **Keluar** dengan `ConfirmDialog`; komponen klien yang memanggil `ping` tiap 60 detik saat tab terlihat dan mengarahkan ke masuk bila 401) dan **ShellPengelola** (menu samping berdasarkan peran, drawer di layar sempit, header berisi pengguna, peran, tema). Pembungkus tiap area: `<div data-area="..." class="min-h-dvh bg-bg text-fg font-body">`; orang tua memakai `data-mode="ortu"`.
4. Halaman area siswa (`src/app/siswa/`): `masuk` (KolomKode + Zippy "sapa", pesan galat ramah), beranda placeholder (sapaan nama siswa, status "belum absen" sebagai tampilan lihat saja, Zippy "tidur"), `ortu` placeholder (nama siswa, "Rapor menyusul"). Halaman area pengelola (`src/app/backoffice/`): `masuk`, beranda placeholder, `pengaturan` (admin), `pengguna` (admin), `akun`. Halaman yang butuh login memakai guard di layout/halaman.
5. Semua teks lewat `id_ID.json`. Mode terang/gelap berfungsi di kedua area dan pilihannya diingat per domain.

**Selesai jika:**
- `npm run db:init` membuat database dan seluruh tabel; `npm run admin:buat` membuat admin; `npm run siswa:uji` mencetak dua kode.
- Dengan `HOST_*` bawaan: `http://backoffice.localhost:3000` -> login admin berhasil, halaman Pengaturan mengubah nama pelatihan dan tampil di header dan judul tab; admin bisa membuat akun tutor; tutor **tidak** bisa membuka Pengaturan/Pengguna; akun yang dinonaktifkan langsung tidak bisa masuk; setelah 5 login gagal muncul pesan "Coba lagi nanti".
- `http://siswa.localhost:3000/backoffice` menghasilkan 404 dan sebaliknya; cookie sesi dari satu host tidak terkirim ke host lain.
- Login kode siswa uji berhasil di satu browser; login kode yang sama di browser lain **ditolak** dengan pesan ramah; **Ganti device** di browser pertama membuat login di browser kedua berhasil; diam melewati batas tidak aktif (uji dengan menurunkan pengaturan menjadi 1 menit) membuat login berakhir; kode orang tua membuka halaman `/ortu`; kode acak dan karakter terlarang ditolak dengan pesan yang tepat.
- Mode terang/gelap bekerja di semua halaman; `GET /api/v1/health` mengembalikan sukses.

### Fase B - Data master: level, template, gambar, siswa

Prasyarat: Fase A selesai.

**B1. Seed (`npm run db:seed`, idempoten)**

Memakai `SCRIPT_SERVER_ID` dan **upsert berdasarkan kunci unik**, jadi aman dijalankan berulang tanpa duplikat.

1. `seed/level-pertemuan.json` -> `level` (unik `kode`) dan `pertemuan` (unik `level_id + nomor`; `jenis`, `judul`, `tujuan` boleh kosong).
2. Dari tiap `seed/template-level-N.json`:
   - `bagian_post_test` (unik `level_id + kode`): `kode`, `nama`, `bobot`, `sumber`, `jumlah_soal`, `target_wpm`, `urutan`.
   - `template` (unik `kode`): `pertemuan` (nomor) -> `pertemuan_id` pada level berkode `level` di berkas itu (`"L1"`, `"L2"`, `"L3"`); `bagian` (huruf, hanya pertemuan 13) -> `bagian_id`; kolom `tipe`, `penilaian`, `kesulitan`, `teks`, `parameter`, `opsi`, `kunci` (JSON; `null` disimpan sebagai NULL), `aktif = 1`.
   - `bank_teks_mengetik`: isi `level_id`, `teks`, `jumlah_kata`, `kesulitan`; sisipkan hanya bila pasangan `level_id + teks` belum ada.
3. `gambar` dari `docs/aset/prompt-gambar.csv` (kode **huruf kecil**, `kategori`, `nama_id` -> `nama`, `nama_en`), lalu pindai `public/aset/gambar/<kode>/` untuk mengisi `punya_mewarnai`, `punya_berwarna`, `punya_puzzle` berdasarkan ada tidaknya `mewarnai.png`, `berwarna.png`, `puzzle.png`. Subjek tanpa folder tetap dimasukkan dengan semua penanda 0.
4. **Validasi seluruh berkas sebelum menulis apa pun** (jangan menulis sebagian): `kode` template unik; `tipe`, `penilaian`, `sumber` sesuai ENUM di `schema.sql`; per level total `jumlah_soal` bagian = 15 dan total `bobot` = 100; setiap `bagian` yang dirujuk ada. Bila gagal, hentikan dengan pesan jelas.
5. Cetak ringkasan. Angka yang diharapkan: **3 level, 39 pertemuan, 14 bagian post test, 407 template** (133 + 136 + 138), **48 teks mengetik** (16 per level), **75 gambar**.

**B2. Utilitas template** (fungsi murni di `src/utils/`, dipakai ulang di Fase C dan D)

1. `evaluasiEkspresi(ekspresi, variabel)`: **tulis parser sendiri, tanpa `eval`/`Function`**. Mendukung bilangan, nama variabel, `+ - * /`, kurung, minus unair, fungsi `max`, `min`, `abs`, `round`, serta pembanding `>= > <= < == !=` (untuk syarat `jika`). Ekspresi tidak valid atau variabel tidak ada -> `AppError`.
2. `renderTemplate(template, { acak, gambarTersedia })` (`acak` adalah fungsi RNG yang **disuntikkan**, bukan dibuat di dalam):
   - Parameter berupa **daftar** -> pilih satu; **`{min,max}`** -> bilangan bulat acak; **`{dari:"gambar", jenis}`** -> satu subjek aktif dari `gambarTersedia[jenis]` (jenis: `mewarnai`, `berwarna`, `puzzle`), **tidak boleh sama** dalam satu tugas. Bank gambar untuk jenis itu kosong -> `AppError` "Belum ada gambar tersedia".
   - Ganti penanda `{nama}` pada `teks`, `opsi`, dan **nilai teks pada `kunci`** (misal `teks_ketik`, `min_skor`).
   - Hasil: `{ teks, opsi (diacak, tiap opsi membawa indeksAsli), nilaiParameter, gambar: [{kode, nama, jenis}], kunci }`.
3. `periksaJawaban(template, nilaiParameter, jawaban)` untuk tugas `otomatis_jawaban`:
   - `kunci.ekspresi`: dibandingkan dengan `kunci.toleransi` (bawaan 0). **Angka menerima koma atau titik sebagai desimal**; spasi diabaikan; pola titik pemisah ribuan seperti `1.000`, `15.000`, `1.250.000` (titik diikuti tepat tiga digit, berulang) dianggap ribuan.
   - `kunci.jika` + `maka` + `lainnya`: evaluasi syarat, bandingkan jawaban teks tanpa memperhatikan huruf besar/kecil dan spasi tepi.
   - `pilihan_ganda`: `kunci.benar` adalah indeks pada urutan `opsi` **tersimpan** (sebelum diacak); pemeriksaan memakai `indeksAsli`.
4. `validasiTemplate(template, gambarTersedia)`: render 50 kali dan periksa: semua penanda memiliki parameter; semua parameter terpakai (di `teks`, `opsi`, nilai `kunci`, `ekspresi`, atau `jika`); pilihan ganda punya 4 opsi unik dan `kunci.benar` 0-3; ekspresi dapat dievaluasi, hasil tidak negatif, dan bulat bila tanpa toleransi; syarat `jika` menghasilkan **kedua** kemungkinan; `tipe` dan `penilaian` valid. Mengembalikan daftar galat. Dipakai oleh seed dan oleh penyimpanan template.

**B3. Modul `level`** (pengelola): halaman **Level dan Materi**: level -> 13 pertemuan -> jumlah template per pertemuan. Admin dapat mengubah nama/deskripsi level, judul/tujuan pertemuan, dan bagian post test (nama, bobot, jumlah butir); tampilkan **peringatan** (bukan penolakan) bila total bobot tidak 100 atau total butir tidak 15. Tutor hanya melihat. Tidak ada tambah/hapus level. Perubahan tercatat ke log.

**B4. Modul `template`** (pengelola):
1. Daftar dengan filter (level, pertemuan, bagian, tipe, penilaian, aktif), pencarian kode/teks, paginasi; halaman detail.
2. **Pratinjau**: tombol "Contoh hasil" menampilkan 5 contoh render beserta jawaban/kunci yang diharapkan (hanya untuk pengelola).
3. Admin dapat membuat dan mengubah (teks, parameter dengan editor JSON, opsi, kunci, kesulitan, penilaian, aktif). **Simpan hanya bila `validasiTemplate` lulus**; bila tidak, tampilkan daftar galat. Template **tidak dihapus**, hanya dinonaktifkan (tugas lama tetap utuh). Tutor hanya melihat.

**B5. Modul `gambar`** (pengelola): daftar subjek dalam kartu (pratinjau `berwarna.png` bila ada) dengan filter kategori dan kelengkapan; detail menampilkan empat berkas bila ada; admin dapat mengaktifkan/menonaktifkan dan menekan **Pindai ulang berkas** untuk memperbarui penanda `punya_*`. Gambar disajikan langsung dari `public/aset/gambar/` (tanpa route khusus). Beri penanda untuk subjek yang tidak lengkap.

**B6. Modul `siswa`** (admin dan tutor):
1. **Daftar**: pencarian nama, filter status dan level, paginasi; kolom nama, level berjalan, status, tanggal daftar.
2. **Tambah**: nama, tanggal daftar (bawaan hari ini), level awal (bawaan Level 1). Dalam **satu transaksi**: buat `siswa`, dua baris `kode_akses` (jenis `siswa` dan `ortu`, kode unik; bila UNIQUE bentrok ulangi sampai 5 kali), dan `siswa_level` berstatus `berjalan`. Tampilkan kedua kode dengan tombol **Salin** dan **Cetak kartu kode** (halaman cetak sederhana berisi nama, kode siswa, kode orang tua, dan alamat situs siswa dari `URL_SISWA`; tambahkan `URL_SISWA=http://siswa.localhost:3000` ke `.env.example`).
3. **Detail**: profil, level berjalan dan riwayat level, kode saat ini (bisa ditampilkan/disembunyikan), ruang riwayat sesi (placeholder "Menyusul"), dan aksi dengan `ConfirmDialog`:
   - **Ganti kode siswa** / **Ganti kode orang tua**: kode lama `aktif = 0`, buat kode baru; bila siswa memiliki login aktif, akhiri dengan alasan `ditutup_tutor`.
   - **Ganti level**: level lama menjadi `berhenti` (isi `selesai_at`), buka level baru `berjalan`.
   - **Nonaktifkan/aktifkan**: siswa `nonaktif` tidak bisa login dan login aktifnya diakhiri.
   - **Hapus siswa** (**hanya admin**): satu transaksi dengan urutan di komentar kepala `schema.sql`; `ConfirmDialog` nada bahaya dengan mengetik nama siswa. Tutor tidak melihat tombol ini.
4. Semua aksi sensitif dicatat lewat `catatAktivitas`.

**B7. Halaman Log** (admin): daftar `log_aktivitas` terbaru dengan filter aksi, entitas, pengguna, tanggal, dan paginasi.

**B8. Menu pengelola**: Absensi (placeholder "Menyusul di Fase C"), Siswa, Level dan Materi, Template, Gambar, Pengaturan (admin), Pengguna (admin), Log (admin). Item admin tidak tampil bagi tutor.

**Selesai jika:**
- `npm run db:seed` mencetak ringkasan sesuai angka B1 dan **dijalankan dua kali tanpa menambah data**.
- Admin membuka daftar template, memfilter, menekan **Pratinjau** pada tugas Excel dan jawaban kunci yang tampil benar; mengubah template menjadi tidak valid (penanda tanpa parameter) **ditolak** dengan pesan jelas; template valid tersimpan.
- Tutor mendaftarkan siswa, kedua kode tampil dan kartu kode bisa dicetak; login dengan kode siswa baru berfungsi (uji dari area siswa); **Ganti kode** membuat kode lama tidak berlaku; **Ganti level** bekerja; hanya admin yang bisa **Hapus siswa** dan penghapusan tuntas tanpa error foreign key.
- Halaman Level dan Materi, Gambar, dan Log berfungsi; semua halaman responsif dan mendukung mode terang/gelap.

### Fase C - Sesi dan absensi

Prasyarat: Fase A dan B selesai (siswa, kode, level, template, dan gambar sudah ada).

**C1. Absen masuk** (usecase `sesi`, satu transaksi)

Masukan: kode siswa (diinput tutor), `pertemuanId`, tutor tambahan (opsional, boleh lebih dari satu), pembayaran (opsional: jumlah dan keterangan).

1. Normalisasi kode dan cari `kode_akses` aktif **berjenis `siswa`**. Kode orang tua ditolak ("Ini kode orang tua, masukkan kode siswa"). Kode tidak dikenal atau siswa `nonaktif` -> pesan ramah. Siswa harus punya `siswa_level` berstatus `berjalan`, dan `pertemuanId` harus milik level itu.
2. **Pertemuan bawaan** = nomor terkecil (1-13) yang belum memiliki sesi pada `siswa_level` itu; tutor boleh mengganti manual.
3. **Sesi sebelumnya belum ditutup** (termasuk dari hari lain; dijaga UNIQUE `aktif_kunci`): tolak dengan pesan "Siswa ini masih dalam sesi (tanggal ...)" disertai tombol **Tutup sesi itu**. Tidak ada penutupan otomatis akhir hari.
4. **Pertemuan 13**: syarat kehadiran = jumlah pertemuan 1-12 yang punya sesi >= `kehadiran_min_post_test`, atau `siswa_level.pengecualian_kehadiran = 1`. Bila tidak terpenuhi, tolak dengan pesan "Kehadiran n dari 12, butuh 9" dan tombol **Izinkan pengecualian** (`ConfirmDialog`; set `pengecualian_kehadiran = 1`, dicatat ke log), lalu absen dapat diulang.
5. Buat `sesi` (tanggal hari ini, `jam_masuk = NOW()`, status `berlangsung`), `sesi_tutor` untuk tutor yang menginput **dan** tutor tambahan, `pembayaran` bila diisi (tanggal hari ini, `sesi_id`), generate tugas (C2), dan `catatAktivitas`.
6. Tutor lain dapat bergabung ke sesi yang berlangsung lewat tombol **Ikut menangani** (menambah baris `sesi_tutor`).

**C2. Generate tugas** (hanya pertemuan 1-12; pertemuan 13 tidak punya tugas biasa, post test dikerjakan di Fase D)

1. Tambah kunci pengaturan **`jumlah_tugas_per_sesi`** (bawaan **6**): sisipkan lewat `db:seed` (`INSERT IGNORE`, idempoten) dan tampilkan di halaman Pengaturan (admin, bilangan bulat 1-20).
2. Pilih template aktif pertemuan itu (`bagian_id` kosong) secara acak **tanpa pengulangan** sebanyak `jumlah_tugas_per_sesi` (semuanya bila kurang dari itu). Bila tersedia kedua jenis penilaian (`otomatis_jawaban` dan `dicek_tutor`), usahakan masing-masing minimal sepertiga dari jumlah tugas agar sesi tidak hanya berisi satu macam.
3. Render lewat `renderTemplate` dengan RNG berbasis `crypto.randomInt` yang **disuntikkan**, dan `gambarTersedia` dari tabel `gambar` (aktif, punya berkas jenis terkait). Template yang butuh gambar tetapi bank gambarnya kosong **dilewati dan diganti** template lain; bila tak ada pengganti, lanjutkan dengan yang ada dan tampilkan **peringatan** di detail sesi.
4. Simpan satu baris `tugas_siswa` per tugas: `soal_teks` (hasil render), `status = 'belum'`, dan `parameter_hasil` (JSON) berisi `{ nilai, gambar: [{kode, nama, jenis}], opsi: [{teks, indeksAsli}], kunci, percobaan: 0 }`.

**C3. Halaman Absensi** (pengelola, `/absensi`; **tampilan HP wajib nyaman**, karena tutor mungkin memakai ponsel)

1. Formulir **Absen masuk**: `KolomKode`, pilihan pertemuan (bawaan dari C1), tutor tambahan (pilihan ganda, opsional), catatan pembayaran (jumlah dan keterangan, keduanya opsional). Setelah berhasil: tampilkan ringkasan dan tautan ke detail sesi.
2. Daftar **Sesi berlangsung** berupa kartu per siswa: nama, level, pertemuan, jam masuk, lama berjalan, status login perangkat (aktif atau tidak, dari `login_perangkat`), progres tugas (selesai/total), tutor yang menangani. Aksi: **Detail**, **Tutup sesi**, **Ikut menangani**.
3. Menu **Absensi** menampilkan lencana jumlah sesi berlangsung.

**C4. Detail sesi** (pengelola, `/absensi/[sesiId]`; juga untuk sesi selesai)

1. Daftar tugas dengan lencana status dan, bila otomatis, hasil jawaban. Tutor dapat: menandai tugas `dicek_tutor` **selesai** (isi `dinilai_oleh`, `selesai_at`; `benar` dibiarkan NULL), mengubah status tugas apa pun (selesai/dilewati/belum), dan melakukan **Ganti tugas** untuk siswa. Setiap perubahan oleh tutor dicatat ke log.
2. **Catatan**: tersimpan di `sesi_tutor.catatan` milik tutor yang sedang login (tutor harus tercatat di sesi; gunakan **Ikut menangani** bila belum). Catatan tutor lain ditampilkan dengan nama penulisnya; admin dapat melihat semuanya.
3. **Penuntasan**: pilihan tuntas / tuntas sebagian / tidak tuntas dengan nilai awal dari hasil otomatis. Menyimpan mengisi `penuntasan_tutor` dan `penuntasan_diubah_oleh` (log); tombol **Kembali ke otomatis** mengosongkannya. Tampilkan **sumber** status akhir ("otomatis" atau "tutor"); status akhir = `COALESCE(penuntasan_tutor, penuntasan_otomatis)`.
4. **Pembayaran** (C8) dan tombol **Tutup sesi**.

**C5. Pulang dan penutupan sesi** (`akhiriSesi(sesiId, oleh)`, idempoten)

1. Siswa menekan **Pulang** -> `ConfirmDialog` ramah dengan Zippy ("Sudah selesai belajar hari ini?") -> sesi `selesai`, `jam_pulang = NOW()`, hitung dan simpan `penuntasan_otomatis`, akhiri login lewat `akhiriLoginSiswa(siswaId, 'pulang')`, hapus cookie, arahkan ke halaman "Sampai jumpa" dengan Zippy.
2. Tutor menekan **Tutup sesi**: sama, tetapi alasan login `ditutup_tutor`. **Tidak ada tanda khusus** di sesi untuk penutupan oleh tutor; jam pulang cukup `NOW()`.
3. Menutup sesi yang sudah selesai tidak menimbulkan error (hasilnya sama).

**C6. Area siswa saat sesi aktif** (modul `sesi`; menggantikan halaman placeholder)

1. **Beranda**: `StatusSesi` (jam mulai, lama berjalan), `ProgressBar` tugas selesai/total, daftar `KartuTugas`, Zippy "menunjuk". Tanpa sesi berlangsung: **mode lihat saja** dengan Zippy "tidur" dan pesan ramah ("Minta kakak tutor mencatat kehadiranmu dulu"); menu latihan terkunci dengan ikon gembok.
2. **Sinkron otomatis**: balasan `POST /api/v1/auth/ping` ditambah `sesiAktifId`; klien membandingkan dengan nilai sebelumnya dan memanggil `router.refresh()` bila berubah, supaya siswa langsung melihat tugas setelah tutor absen (atau layar kembali ke mode lihat saja setelah sesi ditutup).
3. `KartuTugas` (komponen domain baru, bersama `OpsiJawaban`, `StatusSesi`, `ProgressBar`, `Konfeti`, `Skeleton`, `EmptyState`, `Select`, `TabelResponsif` sesuai kebutuhan):
   - Pilihan ganda -> `OpsiJawaban` (4 kartu besar). Jawaban angka atau teks -> `TextField`. Tombol **Periksa**.
   - Umpan balik: benar (lencana sukses + Zippy sedikit merayakan) atau salah (teks dan ikon + Zippy "menyemangati"; boleh mencoba lagi tanpa batas).
   - Tugas `dicek_tutor`: tampil instruksi dan lencana **"Menunggu dicek tutor"**; siswa tidak punya tombol selesai.
   - Tugas bertipe `game_mouse`, `puzzle`, `mengetik`: tampil sebagai kartu dengan tombol menuju menu terkait yang **dinonaktifkan** berlabel "Segera hadir" (diaktifkan di Fase D).
   - Tombol **Ganti tugas** dan **Lewati** (`Lewati` memakai `ConfirmDialog`).
   - `Konfeti` + Zippy "merayakan" saat semua tugas selesai (hormati `prefers-reduced-motion`).
4. **Kirim jawaban** (`kirimJawaban(tugasId, jawaban, sesiSiswa)`): pastikan tugas milik siswa itu dan sesinya berlangsung; hanya untuk `otomatis_jawaban` bertipe `pilihan_ganda` atau `excel`; periksa dengan `periksaJawaban`; simpan `jawaban` dan `benar`, tambah `parameter_hasil.percobaan`; bila benar -> `status = 'selesai'` dan `selesai_at`.
5. **Ganti tugas** (siswa atau tutor): buat tugas baru dari template lain pada pertemuan yang sama yang belum dipakai di sesi ini (utamakan kesulitan yang sama atau lebih rendah); tugas lama `diganti`, tugas baru memakai `menggantikan_id`. Bila tidak ada template lain -> pesan ramah. **Lewati** -> `status = 'dilewati'` (tidak memblokir Pulang).
6. **Unduh bahan**: `GET /api/v1/tugas/unduh?tugasId=&kode=` (`akses: siswa`). Validasi bahwa subjek `kode` tercantum di `parameter_hasil` tugas milik siswa itu; jenis `mewarnai` mengirim `mewarnai.png`, jenis `berwarna` mengirim `berwarna.png` sebagai attachment dengan nama ramah (mis. `mewarnai-kucing.png`). Puzzle tidak diunduh (dimainkan di web, Fase D).

**C7. Penuntasan otomatis** (`hitungPenuntasan(sesiId)`): abaikan tugas `diganti`; semua selesai -> **tuntas**; sebagian selesai atau ada yang dilewati -> **tuntas sebagian**; tidak ada yang selesai -> **tidak tuntas**. Dipakai di detail sesi (real-time) dan disimpan ke `penuntasan_otomatis` saat sesi ditutup.

**C8. Modul `pembayaran`:** tambah catatan (siswa, `sesi_id` opsional, tanggal bawaan hari ini, jumlah dan keterangan opsional) dari detail sesi dan detail siswa; daftar per siswa; hapus hanya admin (dicatat ke log). Tampilan rupiah berformat `Rp15.000`.

**C9. Riwayat sesi dan kehadiran** di detail siswa (menggantikan placeholder dari Fase B): tab **Riwayat** berupa `TabelResponsif` (tanggal, pertemuan, jam masuk sampai pulang dan lama, tutor, penuntasan akhir beserta sumbernya, tugas selesai x/y) dengan ringkasan "Kehadiran level ini: n dari 12 pertemuan" dan status syarat post test; tab **Pembayaran**.

**Selesai jika:**
- Tutor mengabsen siswa uji dengan kode siswa -> sesi muncul di daftar Sesi berlangsung dan 6 tugas (atau sesuai pengaturan) terbentuk; kode orang tua ditolak dengan pesan yang tepat.
- Di browser siswa (sudah login) halaman **berubah sendiri** dari mode lihat saja menjadi daftar tugas tanpa muat ulang manual (sinkron lewat `ping`), dan kembali ke mode lihat saja setelah sesi ditutup.
- Pilihan ganda: jawaban salah memberi umpan balik dan boleh dicoba lagi; jawaban benar menandai tugas selesai. Tugas Excel menerima `15,5` dan `15.5`, serta `15.000` sebagai ribuan.
- Tugas `dicek_tutor` tidak bisa diselesaikan siswa; tutor menandainya di detail sesi. **Ganti tugas**, **Lewati**, dan **Unduh bahan** (`mewarnai.png`/`berwarna.png`) berfungsi; percobaan mengunduh tugas milik siswa lain ditolak.
- Penuntasan otomatis benar untuk tiga kondisi; tutor dapat mengubahnya, sumbernya tampil, dan **Kembali ke otomatis** bekerja.
- **Pulang** oleh siswa dan **Tutup sesi** oleh tutor sama-sama mengisi jam pulang, mengakhiri login siswa, dan menghitung penuntasan otomatis; menutup dua kali tidak error.
- Absen kedua saat sesi sebelumnya belum ditutup ditolak dengan tautan **Tutup sesi itu**. Pertemuan 13 ditolak bila kehadiran kurang, dan **Izinkan pengecualian** membukanya. Catatan beberapa tutor pada satu sesi tersimpan terpisah.
- Pembayaran tercatat dan tampil di detail sesi dan detail siswa; riwayat sesi dan kehadiran di detail siswa benar.
- Halaman Absensi nyaman dipakai di lebar HP; semua mendukung mode terang/gelap.

### Fase D1 - Latihan: mengetik, game mouse, puzzle

Prasyarat: Fase A, B, dan C selesai. Fase D dikerjakan dalam dua permintaan: **D1** (bagian ini) lalu **D2** (post test).

**D1.1. Seed pelajaran mengetik:** tambahkan ke `npm run db:seed` (idempoten, upsert unik `kode`) pemuatan `seed/pelajaran-mengetik.json` ke tabel `pelajaran_mengetik` (12 pelajaran; kolom `kode`, `nama`, `urutan`, `tombol_fokus`, `teks_latihan`, `target_wpm`, `target_akurasi`). Ringkasan seed ikut menampilkan jumlahnya.

**D1.2. Mesin mengetik (komponen klien `AreaMengetik`)**

Props: `teks`, `mode` (`pelajaran`, `latihan`, `game`, `tes`), `onSelesai(hasil)`.

1. Teks target tampil besar dengan status tiap karakter (belum, benar, salah, kursor). Masukan lewat `keydown` pada area yang terfokus. **Tempel (paste) dicegah.** `Backspace` menghapus karakter terakhir. Selesai ketika jumlah karakter diketik sama dengan panjang teks. Pada layar sentuh tanpa keyboard fisik tampilkan pesan ramah bahwa latihan ini butuh keyboard.
2. Pengukuran (pengatur waktu dimulai pada tombol pertama):
   - **WPM** = (karakter benar / 5) / menit.
   - **Akurasi** = karakter yang benar saat **pertama kali** diketik / seluruh karakter yang diketik (koreksi dengan Backspace tidak menghapus kesalahan yang sudah terjadi) x 100.
   - **Konsistensi** = 100 x (1 - simpangan baku / rata-rata) dari WPM per segmen 5 detik, dibatasi 0-100; kosong bila durasi < 10 detik.
   - **detail_tombol** = `{ "<karakter huruf kecil>": { "ketik": n, "salah": m } }`; spasi memakai kunci `spasi`.
3. `KeyboardVisual` (SVG QWERTY) menyorot tombol berikutnya beserta jari yang dianjurkan (warna per jari). HUD menampilkan WPM langsung, akurasi, dan waktu; tombol **Ulang**. Responsif.
4. Penyimpanan: usecase `simpanHasilMengetik(siswaId, sesiId, data)`. Klien mengirim `jumlahKarakterBenar`, `jumlahKarakterDiketik`, `durasiDetik`, `detailTombol`, `konsistensi`, `mode`, `pelajaranId?`; **server menghitung ulang WPM dan akurasi** dari angka itu dan menolak yang tidak wajar (WPM > 250, durasi < 3 detik, akurasi di luar 0-100). Simpan ke `hasil_mengetik`.

**D1.3. Halaman Mengetik (siswa, `/mengetik`; hanya saat sesi berlangsung, selain itu mode lihat saja dengan pesan ramah)**

1. **Pelajaran bertahap**: daftar 12 pelajaran sebagai kartu bertingkat. Pelajaran 1 selalu terbuka; pelajaran n terbuka bila siswa pernah mencapai target pelajaran n-1 (hasil mode `pelajaran` dengan WPM >= `target_wpm` dan akurasi >= `target_akurasi`). Tampilkan hasil terbaik dan bintang: 1 bintang = target tercapai, 2 = WPM >= 1,2 x target, 3 = WPM >= 1,5 x target dan akurasi >= 97.
2. **Latihan adaptif** ("Latihan untuk tombol lemahku"): dari `detail_tombol` 10 hasil terakhir siswa, pilih sampai 5 tombol dengan rasio salah tertinggi (minimal 5 ketikan). Susun teks 40-60 karakter dari kata pada `bank_teks_mengetik` dan `pelajaran_mengetik.teks_latihan` yang memuat tombol-tombol itu (acak); bila kurang, tambahkan deret latihan dari tombol tersebut. Mode `latihan`.
3. **Tes bebas**: teks acak dari `bank_teks_mengetik` pada level siswa (mode `latihan`; mode `tes` khusus post test).
4. **Game "Hujan Kata"** (mode `game`): kata sederhana dari bank jatuh dari atas; ketik kata lalu spasi/Enter untuk menghilangkannya; 3 nyawa; berakhir saat nyawa habis. Hasilnya disimpan sebagai `hasil_mengetik` (WPM dan akurasi dihitung seperti biasa).
5. **Kemajuan** (`/mengetik/kemajuan`): `GrafikKemajuan` (SVG) untuk WPM dan akurasi 20 hasil terakhir, dan `PetaPanasKeyboard` (SVG QWERTY dengan intensitas dari rasio salah pada 30 hasil terakhir).

**D1.4. Game latihan mouse (modul `latihan`, `/latihan-mouse`; hanya saat sesi berlangsung)**

Prinsip: komponen klien dengan DOM + CSS atau canvas ringan **tanpa pustaka game**; area bermain responsif (rasio sekitar 16:10, lebar minimum 320 px); **Pointer Events** agar mouse dan sentuh sama-sama bekerja; `prefers-reduced-motion` mengurangi animasi; pembungkus `AreaGame` (HUD skor dan waktu, Mulai, Jeda, Ulang, layar hasil, Zippy bereaksi). **1 poin per aksi benar**, tanpa pengurangan poin. Mode tugas: tanpa batas waktu sampai target tercapai; mode bebas: 60 detik.

| Game | `jenis` | Aturan |
|---|---|---|
| Pecahkan Balon | `mouse_klik` | Balon muncul di tempat acak dan menghilang sendiri setelah sekitar 2,5 detik; klik balon = +1; makin lama makin cepat. Klik di area kosong tidak mengurangi poin. |
| Buka Kotak Hadiah | `mouse_klik_ganda` | Kotak tertutup; **klik dua kali** membukanya (+1); satu klik hanya menggoyang kotak sebagai petunjuk. |
| Masukkan ke Keranjang | `mouse_drag` | Benda (buah/mainan) di atas, 2-3 keranjang berbeda di bawah; **seret** ke keranjang yang cocok (+1). Salah: benda kembali ke posisi awal dan Zippy menyemangati. |
| Klik Kanan Ajaib | `mouse_klik_kanan` | Objek "terkunci"; **klik kanan** memunculkan menu kecil buatan sendiri (menu bawaan browser dicegah **hanya di area game**); memilih "Buka" = +1. |
| Kebun Gulung | `mouse_scroll` | **Gulung roda mouse** untuk menumbuhkan tanaman dan mengangkat ember; tiap tahap selesai = +1. Area memakai `overscroll-behavior: contain` agar halaman tidak ikut bergulir. |

Penyimpanan: `simpanHasilLatihan(siswaId, sesiId, data)` ke `hasil_latihan` (`jenis`, `skor`, `selesai`, `durasi_detik`, `detail`). Validasi server: `jenis` valid dan `skor` <= `durasi_detik` x 5 (batas kewajaran).

**D1.5. Puzzle (`/puzzle`; hanya saat sesi berlangsung)**

1. `PapanPuzzle` memotong `puzzle.png` menjadi grid **2x2 (4 keping), 3x2 (6), 3x3 (9)** memakai CSS (`background-position`) atau canvas. Keping diacak dan **tidak boleh ada yang sudah berada di tempat benar** saat mulai. Seret dengan Pointer Events (mouse dan sentuh), **snap** ke slot terdekat bila jaraknya dalam 25% ukuran keping; keping yang benar terkunci dengan efek ringan. Tombol **Lihat contoh** menampilkan gambar utuh sementara. Selesai -> `Konfeti` + Zippy "merayakan".
2. Mode bebas: pilih kategori dan tingkat (4/6/9); gambar acak dari bank (`punya_puzzle = 1`).
3. Simpan `hasil_latihan` (`jenis = 'puzzle'`, `gambar_id`, `keping`, `selesai`, `durasi_detik`).

**D1.6. Penilaian otomatis tugas dan menu**

1. `selesaikanTugasOtomatis(siswaId, sesiId, hasil)` dipanggil setelah hasil apa pun tersimpan. Mencari tugas `belum` pada sesi berlangsung milik siswa itu:
   - `game_mouse`: `kunci.jenis` sama dan `skor >= kunci.min_skor`.
   - `puzzle`: `kunci.keping` sama, `selesai = 1`, dan gambar yang dimainkan sama dengan `parameter_hasil.gambar[0].kode`.
   - `mengetik`: hasil bermode `latihan` untuk teks `kunci.teks_ketik` dengan WPM >= `kunci.min_wpm` (bila ada) dan akurasi >= `kunci.min_akurasi`; bila belum memenuhi, beri umpan balik "Hampir! Targetnya ... coba lagi".
   - Yang cocok menjadi `selesai` (`benar = 1`, `selesai_at`). Hasil yang tidak cocok tugas apa pun tetap tersimpan sebagai latihan bebas.
2. Pada `KartuTugas` (Fase C) aktifkan tombol yang tadinya "Segera hadir": **Main** membuka game sesuai `kunci.jenis` dengan target skor tampil; **Kerjakan** membuka puzzle dengan **gambar dari tugas** dan jumlah keping dari kunci; **Kerjakan** pada tugas mengetik membuka `AreaMengetik` dengan `kunci.teks_ketik`.
3. Menu siswa aktif: **Latihan Mouse**, **Puzzle**, **Mengetik**, **Bahan** (daftar bahan unduhan dari tugas pada sesi ini memakai `KartuGambar` dan rute unduh dari Fase C). **Karya** tetap terkunci "Segera hadir" (Fase F).
4. Detail siswa (pengelola): tab **Latihan** berisi WPM terbaik dan rata-rata akurasi dengan grafik, jumlah dan skor terbaik tiap game mouse, serta jumlah puzzle selesai.

**Selesai jika:**
- `db:seed` memuat 12 pelajaran mengetik dan ringkasannya benar; dijalankan dua kali tanpa duplikat.
- Pelajaran 2 terkunci sampai target pelajaran 1 tercapai; hasil, bintang, kemajuan, dan peta panas tombol tampil benar; latihan adaptif menyusun teks dari tombol yang paling sering salah.
- Server menolak data hasil yang tidak wajar (WPM 400, durasi 1 detik); tempel ke area ketik tidak berfungsi.
- Kelima game mouse berjalan dengan mouse (dan sentuhan untuk yang memungkinkan); klik kanan hanya mengubah menu di dalam area game; puzzle 4, 6, dan 9 keping dapat diselesaikan dan tidak ada keping yang sudah benar saat mulai.
- Tugas bertipe `game_mouse`, `puzzle`, dan `mengetik` pada sesi otomatis menjadi **selesai** setelah target tercapai; mengunduh/menyelesaikan tugas milik siswa lain ditolak; di luar sesi berlangsung halaman latihan hanya mode lihat saja.
- Semua halaman responsif (HP, tablet, PC), mendukung mode terang/gelap, dan animasi mengikuti `prefers-reduced-motion`.

### Fase D2 - Post test

Prasyarat: Fase A sampai D1 selesai.

**D2.1. Syarat dan mulai**

1. Di beranda siswa, tombol **Mulai Post Test** tampil bila: sesi berlangsung pada **pertemuan nomor 13**, `siswa_level` berstatus `berjalan`, tidak ada `post_test` yang sedang berlangsung (bila ada: tombol **Lanjutkan Post Test**), dan percobaan terakhir bukan yang sudah lulus. Percobaan **pertama** boleh langsung dimulai (syarat kehadiran sudah diperiksa saat absen, Fase C). Percobaan berikutnya hanya lewat **tes ulang** yang dibuka tutor (D2.7).
2. Menekan tombol menampilkan `ConfirmDialog` ("Post test 45 menit dan hanya sekali, siap?"), lalu `mulaiPostTest(siswaId, sesiId)` dalam **satu transaksi**:
   - Buat `post_test` (`percobaan_ke`, status `berlangsung`, `durasi_detik = durasi_post_test_menit x 60`, `terpakai_detik = 0`, `mulai_at = NOW()`, `terakhir_aktif_at = NOW()`).
   - Untuk tiap bagian level (urut `urutan`): bagian bersumber `soal` dan `praktik_tutor` memilih `jumlah_soal` template aktif dengan `bagian_id` itu, acak **tanpa pengulangan** (bila bank kurang, ambil semuanya dan catat peringatan ke log), render dengan `renderTemplate`, simpan sebagai `tugas_siswa` (`sesi_id`, `post_test_id`, `template_id`, `soal_teks`, `parameter_hasil`).
   - Bagian `tes_mengetik` **tidak** punya `tugas_siswa`: teks dipilih **deterministik** dari `bank_teks_mengetik` pada level itu (indeks = hash id post test mod jumlah teks) agar sama saat dilanjutkan.

**D2.2. Waktu dijaga server**

1. `POST /api/v1/posttest/denyut` (`akses: siswa`) dipanggil klien tiap **15 detik** saat halaman post test terlihat: tambahkan `min(NOW() - terakhir_aktif_at, 30 detik)` ke `terpakai_detik`, perbarui `terakhir_aktif_at`, dan balas `sisaDetik = durasi_detik - terpakai_detik`.
2. `Pewaktu` menampilkan `sisaDetik` dari server (bukan jam lokal). Saat login berakhir (ganti device, PC mati) denyut berhenti sehingga waktu tidak berjalan; siswa yang login lagi dan menekan **Lanjutkan** melanjutkan dengan **sisa waktu yang sama**.
3. `sisaDetik <= 0` -> otomatis `kumpulkanPostTest`. Pada 5 menit terakhir `Pewaktu` berubah ke nada `warn` dengan teks "Sisa waktu 5 menit".
4. Catatan: tutor mengawasi di kelas, jadi pencegahan kecurangan tidak perlu ketat; cukup yang disebut di sini.

**D2.3. Halaman post test siswa (layar fokus, tanpa menu biasa)**

1. Header: `Pewaktu` dan judul "Post Test Level X". Navigasi butir berupa kotak bernomor 1-15 (terjawab/belum) dikelompokkan per bagian; satu butir per layar; tombol Sebelumnya/Berikutnya; boleh berpindah bebas.
2. Jenis butir:
   - **Pilihan ganda**: `OpsiJawaban` **mode tes** (tanpa umpan balik benar/salah).
   - **Angka/teks** (`excel`): `TextField`, tanpa umpan balik.
   - **`dicek_tutor`**: instruksi dan tombol **"Sudah selesai, panggil tutor"** (menyetel `parameter_hasil.siapDinilai = true`; dapat dibatalkan sebelum dikumpulkan).
   - **Tes mengetik** (bagian `tes_mengetik`): `AreaMengetik` mode `tes`, **sekali saja**; hasil disimpan sebagai `hasil_mengetik` bermode `tes` (dengan `sesi_id`) dan setelahnya tidak bisa diulang dalam percobaan itu.
3. Jawaban tersimpan otomatis lewat Server Action; server menghitung `benar` tetapi **tidak mengirimkannya ke klien** selama post test (periksa tidak ada kebocoran di respons).
4. Tombol **Selesai dan Kumpulkan** -> `ConfirmDialog` yang menyebut jumlah butir belum dijawab -> `kumpulkanPostTest`. Keluar dari halaman memunculkan peringatan.

**D2.4. Penilaian saat dikumpulkan** (`kumpulkanPostTest`, idempoten)

Status `selesai`, isi `selesai_at`. Hitung nilai tiap bagian dan simpan di `post_test_nilai` (unik `post_test_id + bagian_id`):
- **`soal`**: `nilai = 100 x (butir benar / jumlah_soal bagian)`; belum dijawab dihitung salah; `sumber = 'otomatis'`.
- **`tes_mengetik`**: `nilai = min(100, 100 x WPM / target_wpm) x (akurasi / 100)` dibulatkan 2 desimal; belum dikerjakan = 0; isi `hasil_mengetik_id`. Rumus ini ada di **satu fungsi** `hitungNilaiMengetik` agar mudah diubah.
- **`praktik_tutor`**: **belum ada nilai**; baris `post_test_nilai` dibuat tutor (D2.6).
- Bila semua bagian sudah bernilai -> **finalisasi** (D2.5). Jika belum, `nilai_total` dan `lulus` tetap NULL dan siswa melihat "Hasilmu sedang diperiksa kakak tutor" (Zippy berpikir).
- Layar hasil siswa: nilai per bagian (angka saja, **tanpa kunci jawaban**), lulus atau belum, Zippy "merayakan" dan `Konfeti` bila lulus, atau "menyemangati" bila belum. Setelah itu siswa dapat menekan **Pulang**.

**D2.5. Finalisasi** (`finalisasiPostTest`, idempoten)

1. `nilai_total = jumlah (nilai bagian x bobot / 100)`, 2 desimal.
2. `lulus = nilai_total >= nilai_lulus_total` **dan** setiap bagian `>= nilai_lulus_bagian` (nilai dari pengaturan). Contoh: total 72 tetapi satu bagian 45 -> **belum lulus**.
3. Simpan `nilai_total`, `lulus`, catat ke log. Bila lulus, panggil titik `sertifikat.terbitkanOtomatis(postTestId)`: buat sebagai **fungsi kosong berkomentar** yang diisi di Fase E (tanpa efek saat ini). **Level tidak naik otomatis**; perpindahan level tetap manual lewat **Ganti level** (keputusan terbuka).

**D2.6. Penilaian tutor** (pengelola, `/post-test`)

1. Daftar post test dengan tab **Menunggu penilaian**, **Berlangsung**, **Selesai**.
2. Detail `/post-test/[id]`: per bagian praktik tampilkan setiap butir (`soal_teks`, penanda siap dinilai) beserta **rubrik** (`kunci.rubrik`) dan satu kolom **nilai bagian 0-100** (tutor menilai dari rubrik semua butir bagian itu). Simpan -> `post_test_nilai` (`sumber = 'tutor'`, `dinilai_oleh`); bila semua bagian sudah bernilai -> finalisasi. Tutor/admin dapat merevisi nilai kapan saja (hitung ulang, dicatat ke log).
3. Untuk transparansi tampilkan juga jawaban siswa per butir otomatis (soal, jawaban, benar/salah).

**D2.7. Tes ulang / remedial** (tombol **Buka tes ulang**, tutor; hanya bila percobaan terakhir `selesai` dan belum lulus)

1. Pilih bagian yang diulang (bawaan: bagian dengan nilai < `nilai_lulus_bagian`; bila total belum cukup tanpa ada bagian gagal, semua bagian).
2. Buat percobaan baru (`percobaan_ke + 1`, `dibuka_oleh` = tutor, status `berlangsung`, `terakhir_aktif_at` **NULL** sebagai penanda belum dimulai) dengan tugas hanya untuk bagian yang dipilih; nilai bagian lain **disalin** dari percobaan sebelumnya (`post_test_nilai` baru dengan `sumber` dan `hasil_mengetik_id` yang sama). Finalisasi menghitung dari gabungan.
3. Saat siswa menekan **Mulai Post Test (tes ulang)** di pertemuan 13, `terakhir_aktif_at` terisi dan waktu mulai berjalan. Beranda menjelaskan bagian apa saja yang diulang. Jangan memperlakukan percobaan yang belum dimulai sebagai post test yang sedang berjalan untuk keperluan pewaktu.

**D2.8. Detail siswa:** tab **Post test** berisi riwayat percobaan (tanggal, percobaan ke berapa, nilai per bagian, total, lulus/belum/menunggu) dan tombol **Buka tes ulang**.

**Selesai jika:**
- Siswa uji di pertemuan 13 memulai post test; terbentuk **15 butir** sesuai bagian level (contoh Level 1: 1 tes mengetik + 10 soal + 2 tugas Paint/File + 2 tugas Word); soal berbeda antar siswa/percobaan.
- Ganti device di tengah tes lalu **Lanjutkan** memakai sisa waktu yang sama; menyetel `durasi_post_test_menit` menjadi 1 menit membuat tes terkumpul otomatis saat waktu habis; waktu tidak berkurang saat siswa tidak login.
- Selama tes tidak ada indikasi benar/salah di antarmuka **maupun** di respons jaringan; tempel ke area ketik dicegah.
- Bagian otomatis dan tes mengetik dinilai benar; bagian praktik menunggu tutor; setelah tutor mengisi semua nilai, total dan kelulusan terhitung sesuai aturan (uji kasus total 72 dengan satu bagian 45 = belum lulus). Mengumpulkan dua kali tidak mengubah hasil.
- Tutor membuka **tes ulang** untuk bagian yang gagal saja; nilai bagian lain terbawa; total dihitung dari gabungan; percobaan yang belum dimulai tidak menjalankan waktu.
- Titik `sertifikat.terbitkanOtomatis` ada dan dipanggil saat lulus tanpa efek; level tidak berubah otomatis.
- Semua halaman responsif dan mendukung mode terang/gelap.

### Fase E - Sertifikat

Prasyarat: Fase A sampai D2 selesai. `sertifikatUsecase.terbitkanOtomatis` sudah ada sebagai **stub kosong** yang dipanggil saat finalisasi post test lulus (D2); isinya dikerjakan di sini. Tambah dependensi `pdfkit` dan `qrcode` (versi dipin).

**E1. Pengaturan baru dan font**

1. Tambah kunci pengaturan **`penandatangan_nama`** dan **`penandatangan_jabatan`** (bawaan kosong, opsional) pada seed pengaturan (`schema.sql` untuk database baru dan `db:seed` dengan `INSERT IGNORE` untuk database lama, sama seperti `jumlah_tugas_per_sesi`), lalu tampilkan di halaman Pengaturan (admin; teks maksimal 100 karakter).
2. Font PDF: bila ada `public/aset/font/Nunito-Regular.ttf` dan `Nunito-Bold.ttf` (opsional `Fredoka-SemiBold.ttf` untuk judul), pakai itu; bila tidak ada, **jatuh ke Helvetica bawaan** dan catat peringatan satu kali ke log. Dengan font bawaan, karakter di luar jangkauannya diganti `?` agar PDF tidak gagal dibuat.

**E2. Penerbitan** (modul `sertifikat`, tabel `sertifikat`)

1. `terbitkanOtomatis(postTestId)` (idempoten): syarat `post_test.lulus = 1` dan sudah final. Bila sudah ada sertifikat berstatus `terbit` untuk `(siswa, level)` -> **tidak melakukan apa pun**. Selain itu buat baris `sertifikat`: `nomor`, `token_verifikasi`, `nama_siswa`, `nama_level`, `nilai_total` (snapshot saat terbit), `diterbitkan_at = NOW()`, `diterbitkan_oleh = NULL` (sistem), `post_test_id`. Catat ke log. **Kegagalan penerbitan tidak boleh menggagalkan finalisasi post test**: tangkap, catat, dan tampilkan peringatan di detail post test bagi tutor (yang masih bisa menekan **Terbitkan ulang**).
2. **Nomor**: `DPL-<kode level>-<YYYYMM>-<urut 4 digit>` (contoh `DPL-L1-202611-0007`); urut dihitung per level dan bulan, ulangi bila UNIQUE bentrok (sampai 5 kali).
3. **Token verifikasi**: 16 karakter acak (`crypto.randomInt`) dari alfabet kode akses; dibandingkan **tanpa membedakan huruf besar/kecil** (normalisasi huruf besar).
4. **Batalkan** (admin atau tutor): wajib alasan (maksimal 255 karakter), `ConfirmDialog` nada bahaya; set `status = 'dibatalkan'`, `dibatalkan_at`, `dibatalkan_oleh`, `alasan_batal`; log. Sertifikat dibatalkan tetap tersimpan.
5. **Terbitkan ulang** (admin atau tutor): hanya bila siswa memiliki post test **lulus** pada level itu (pakai yang terbaru). Buat sertifikat **baru** dengan nomor dan token baru, `menggantikan_id` menunjuk yang lama, `diterbitkan_oleh` = pengguna, snapshot memakai data **saat ini** (berguna bila nama siswa diperbaiki). Sertifikat lama yang masih `terbit` otomatis dibatalkan dengan alasan "Diterbitkan ulang" (dijaga UNIQUE `aktif_kunci`). Dalam satu transaksi.
6. Tidak ada tombol penerbitan tanpa post test lulus.

**E3. PDF** (dibuat **sesuai permintaan** dari snapshot database; PDF tidak disimpan di disk)

1. `GET /api/v1/sertifikat/pdf?id=` (`akses: pengguna`) untuk pengelola dan `GET /api/v1/sertifikat/pdf-ortu?id=` (`akses: ortu`; hanya sertifikat milik siswa pada cookie `dp_ortu`, selain itu 404) mengirim PDF sebagai attachment `sertifikat-<nomor>.pdf`. Sertifikat `dibatalkan` hanya bisa diunduh pengelola dan diberi watermark teks "DIBATALKAN".
2. **Tata letak A4 lanskap**: bingkai tipis; logo dan nama pelatihan/perusahaan dari pengaturan (logo dibaca dari `UPLOAD_DIR`, abaikan bila tidak ada); judul "SERTIFIKAT"; "Diberikan kepada" + **nama siswa** besar; "telah menyelesaikan **Level N - <nama level>**" dan "dengan nilai **NN**"; tanggal terbit (format "23 November 2026"); **nomor sertifikat**; **QR** menuju `URL_SISWA/verifikasi/<token>`; blok penandatangan (nama dan jabatan dari pengaturan; bila kosong tampilkan hanya garis dan nama pelatihan); Zippy "merayakan" (`public/aset/maskot/zippy-merayakan.png`) bila berkas ada. Warna memakai nilai token palet siswa (ungu, krem, oranye) sebagai konstanta di satu berkas.
3. Isi PDF satu halaman, rapi, tidak meluap pada nama panjang (kecilkan ukuran huruf bertahap sampai muat, lalu potong dengan "...").

**E4. Halaman verifikasi publik** (`src/app/publik/verifikasi/[token]`, dapat dibuka dari host siswa maupun backoffice lewat penulisan ulang `/verifikasi/*` di `src/proxy.js`)

1. Tanpa login. Memakai token area `pengelola` (netral) dengan nama pelatihan dan logo dari pengaturan.
2. Menampilkan: status (**Sah** / **Dibatalkan** / **Tidak ditemukan**), dan untuk yang sah: nomor, nama siswa, level, nilai total, tanggal terbit, penerbit. Untuk yang dibatalkan: hanya nomor dan status. **Tanpa data lain** (tanpa kehadiran, catatan tutor, pembayaran, kode akses). Token tidak valid -> pesan netral "Sertifikat tidak ditemukan".
3. `metadata.robots` = `noindex, nofollow`, respons `Cache-Control: no-store`. Tidak ada tombol unduh PDF di halaman publik.

**E5. Halaman pengelola**

1. `/sertifikat` (admin dan tutor): daftar dengan filter status/level, pencarian nama atau nomor, paginasi (`TabelResponsif`). Aksi per baris: **Unduh PDF**, **Salin tautan verifikasi**, **Batalkan**, **Terbitkan ulang**.
2. Detail siswa: tab **Sertifikat** (riwayat termasuk yang dibatalkan, dan sertifikat pengganti).
3. Detail post test: tampilkan status sertifikat (terbit/belum/gagal terbit) dan tombol **Terbitkan ulang**.
4. Menu pengelola: tambahkan **Sertifikat**.
5. Hasil post test di layar siswa (D2): bila lulus tampilkan "Sertifikatmu sudah diterbitkan" (tanpa tombol unduh; unduhan lewat tutor atau orang tua).

**Selesai jika:**
- Admin mengisi penandatangan di Pengaturan; siswa uji lulus post test -> sertifikat **otomatis terbit** (dengan stub terisi), nomor sesuai format, token 16 karakter; finalisasi dijalankan dua kali tidak membuat sertifikat ganda.
- PDF terunduh dari halaman pengelola dan dari `pdf-ortu` (kode orang tua), terbaca benar pada A4 lanskap, QR dapat dipindai dan membuka halaman verifikasi; nama sangat panjang tetap muat; tanpa font TTF tetap terbentuk (peringatan di log).
- Orang tua siswa lain **tidak bisa** mengunduh sertifikat yang bukan milik anaknya (404).
- Halaman verifikasi menampilkan **Sah**, **Dibatalkan**, dan **Tidak ditemukan** dengan benar, hanya memuat data yang diizinkan, dan tidak terindeks.
- **Batalkan** mewajibkan alasan; **Terbitkan ulang** membatalkan yang lama otomatis dan membuat nomor/token baru; hasil PDF baru memakai nama siswa saat ini; sertifikat yang dibatalkan memunculkan watermark.
- Kegagalan penerbitan (simulasikan error) tidak menggagalkan finalisasi post test dan tampil sebagai peringatan.
- Semua halaman responsif dan mendukung mode terang/gelap.

### Fase F - Orang tua dan pelengkap

Prasyarat: Fase A sampai E selesai.

**F1. Rapor orang tua** (`/ortu`, area siswa dengan `data-mode="ortu"`; modul `rapor` hanya sebagai agregator, tanpa tabel sendiri; menggantikan halaman placeholder)

1. Hanya menampilkan data siswa pada cookie `dp_ortu`: **semua kueri dibatasi `siswaId` dari cookie**, tidak ada tombol yang mengubah data, dan kode akses tidak pernah ditampilkan. Tampilan **mobile-first** (orang tua kemungkinan memakai HP).
2. Bagian (berurutan):
   - **Kepala**: nama siswa, level berjalan, Zippy "sapa".
   - **Ringkasan**: kehadiran level ini (n dari 12, `ProgressBar`), sesi terakhir, status syarat post test, status level.
   - **Riwayat sesi** (`TabelResponsif`, kartu di HP): tanggal, pertemuan dan judulnya, jam masuk sampai pulang dan lama, penuntasan akhir (lencana), tugas selesai x/y, dan **catatan tutor beserta nama penulisnya**.
   - **Post test**: per percobaan tanggal, nilai tiap bagian, total, lulus/belum/menunggu penilaian. **Tanpa soal dan jawaban.**
   - **Perkembangan mengetik**: WPM terbaik, rata-rata akurasi, `GrafikKemajuan`; ringkasan latihan (jumlah game dan puzzle).
   - **Pembayaran**: tanggal, jumlah (`formatRupiah`), keterangan, dan total yang tercatat.
   - **Sertifikat**: yang berstatus terbit (nomor, level, tanggal) dengan tombol **Unduh PDF** (rute `pdf-ortu`) dan tautan verifikasi.
   - **Karya** (F2).
3. Keadaan kosong memakai `EmptyState` dengan Zippy dan kalimat ramah.
4. Di detail sesi pengelola, beri petunjuk di kolom catatan: **"Catatan ini dapat dibaca orang tua."**

**F2. Galeri karya** (modul `karya`, tabel `karya`)

1. Menu **Karya** siswa diaktifkan: **melihat kapan saja**; menambah, mengubah, dan menghapus hanya saat sesi berlangsung. Aksi tulis siswa hanya untuk karya miliknya.
2. **Tambah karya**: judul (wajib, maksimal 200), deskripsi (maksimal 1000), dan salah satu jenis:
   - `tautan`: URL **http/https** (maksimal 500 karakter); tolak skema lain (`javascript:`, `data:`) dan URL yang memuat kredensial (`user:pass@`). Tampilkan ikon dan **domainnya**. Buka dengan `target="_blank"` dan `rel="noopener noreferrer nofollow"`. **Server tidak mengambil atau membuat pratinjau isi situs.**
   - `berkas`: PNG/JPEG/WebP maksimal **3 MB**, **tanpa SVG**; periksa tipe sebenarnya lewat byte awal berkas (bukan hanya ekstensi); simpan di `UPLOAD_DIR/karya/<siswaId>/<nama acak>.<ext>`, `berkas_path` relatif.
   - `sesi_id` diisi sesi yang berlangsung bila ada. Setelah berhasil: Zippy "merayakan".
3. **Penyajian berkas** lewat `GET /api/v1/karya/berkas?id=`: diizinkan untuk pengelola, siswa pemilik, dan orang tua siswa pemilik; selain itu 404. Header `Content-Type` dari tipe tersimpan, `X-Content-Type-Options: nosniff`, `Cache-Control: private`.
4. **Hapus**: siswa menghapus karyanya sendiri (saat sesi berlangsung, `ConfirmDialog`); admin dan tutor dapat menghapus karya mana pun (`ConfirmDialog`, dicatat ke log). Berkas ikut dihapus dari disk.
5. Tampilan: grid kartu (thumbnail untuk berkas; ikon dan domain untuk tautan), terbaru dahulu, berpaginasi. Pengelola: halaman `/karya` (semua karya, filter siswa dan jenis, hapus) dan tab **Karya** di detail siswa. Orang tua: bagian Karya di rapor (lihat saja).

**F3. Ekspor CSV** (admin dan tutor; menu **Ekspor**, `/ekspor`)

1. `GET /api/v1/ekspor/<jenis>` dengan `jenis`: `siswa`, `kehadiran`, `post-test`, `pembayaran`; filter opsional lewat query (`level`, `dari`, `sampai`). Halaman `/ekspor` berisi formulir filter dan tombol unduh per jenis.
2. CSV **UTF-8 dengan BOM** (agar Excel membaca benar), pemisah koma, judul kolom berbahasa Indonesia, nama berkas `digiplay-<jenis>-<YYYYMMDD>.csv`. **Tidak menyertakan kode akses.** Maksimal 50.000 baris.
3. **Cegah CSV injection**: sel teks yang diawali `=`, `+`, `-`, atau `@` diberi awalan apostrof.
4. Aksi ekspor dicatat ke log.

**F4. Beranda pengelola:** tambahkan kartu ringkas (masing-masing tautan ke halaman terkait): siswa aktif, sesi berlangsung, post test menunggu penilaian, sertifikat terbit bulan ini; kartu **total pembayaran tercatat bulan ini hanya untuk admin**.

**F5. Pemeriksaan akhir** (tidak menambah fitur; perbaiki temuan dan laporkan)

1. **Audit akses**: buat matriks peran x halaman/route di `README.md`; pastikan **setiap** route HTTP dan Server Action menegakkan akses. Uji **IDOR**: siswa A tidak dapat mengakses data siswa B lewat unduh bahan, denyut post test, hasil latihan, berkas karya, dan PDF sertifikat; orang tua A tidak dapat melihat data anak lain.
2. **Header keamanan** di `next.config.mjs`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, dan `Permissions-Policy` yang mematikan kamera, mikrofon, dan geolokasi. CSP ketat hanya bila mudah dan tidak merusak Next.js. Periksa cookie: `httpOnly`, `sameSite=lax`, `secure` di produksi, tanpa `Domain`.
3. **Keluaran aman**: tidak ada `dangerouslySetInnerHTML` dengan data pengguna; tag HTML pada soal (misal `<h1>`) tampil sebagai teks.
4. **Responsif dan tema**: telusuri semua halaman pada lebar 360, 768, dan 1280 px di mode terang dan gelap; perbaiki luapan, kontras, dan elemen terpotong. Periksa fokus keyboard, label form, dan atribut aria pada dialog, pewaktu, dan notifikasi.
5. **Performa dasar**: semua daftar berpaginasi; jalankan `EXPLAIN` pada kueri daftar (siswa, sesi, sertifikat, log) dengan data uji besar (misal 2.000 siswa dan 20.000 sesi dari skrip data uji) dan tambahkan indeks yang perlu lewat perubahan skema yang dicatat. Jangan mengubah struktur tabel yang sudah ada tanpa konfirmasi.
6. **Operasional**: `db:init` dan `db:seed` idempoten dan terdokumentasi. `README.md` lengkap: persyaratan, instalasi, `.env`, semua perintah npm, struktur folder, cara kerja dua domain (termasuk `JUMLAH_PROXY_TEPERCAYA`, reverse proxy, `allowedOrigins`), **cadangan** (perintah `mysqldump` dan penyalinan `uploads/`) dan pemulihan, serta **daftar periksa produksi** (domain, SSL, `SESSION_SECRET`, cookie `secure`, `.env` produksi). Tidak membuat penjadwal; cukup dokumentasi.
7. **Kebersihan**: daftar berkas placeholder lama yang tidak terpakai di laporan (jangan dihapus sesuai aturan kerja).
8. **Laporan akhir**: bandingkan seluruh fitur di `project-context.md` dengan yang terbangun (sudah/belum) dan sebutkan keputusan terbuka yang tersisa.

**Selesai jika:**
- Orang tua membuka `/ortu` dengan kode orang tua siswa uji: semua bagian rapor tampil benar dan nyaman di lebar HP; tidak ada data siswa lain; tidak ada tombol yang mengubah data; sertifikat dapat diunduh; catatan tutor tampil bersama nama penulisnya.
- Siswa menambah karya berupa tautan dan berkas (saat sesi berlangsung), tidak bisa menambah di luar sesi, tidak bisa menghapus karya siswa lain; tautan `javascript:` dan URL berkredensial ditolak; berkas SVG atau berkas palsu berekstensi gambar ditolak; berkas karya anak lain tidak bisa dibuka (404); tutor dapat menghapus karya mana pun.
- Ekspor menghasilkan CSV yang terbaca benar di Excel (huruf Indonesia utuh, tanpa kode akses), dan sel berawalan `=` tidak dieksekusi.
- Beranda pengelola menampilkan kartu ringkas yang benar; kartu pembayaran hanya terlihat admin.
- Audit akses dan uji IDOR lulus tanpa temuan terbuka; header keamanan terpasang; `README.md` lengkap dengan matriks akses, cadangan, dan daftar periksa produksi.
- Laporan akhir memuat perbandingan fitur terhadap `project-context.md` dan daftar keputusan terbuka.

### Setelah Fase F (ditunda): uji akhir dan deploy

Belum dikerjakan: domain, SSL, server, reverse proxy, dan cadangan terjadwal. Prompt untuk tahap ini ditulis saat domain dan server siap.



---

## 8. Desain UI

Ikuti `docs/design-system.md` dan token di `src/app/design-tokens.css`.

- **Dua kepribadian, satu set komponen.** Area siswa: playful, tombol "gemuk" 3D, lengkung besar, maskot Zippy, teks singkat dan ramah. Area pengelola: tenang, padat informasi, tabel dan filter di atas daftar.
- **Mobile-first untuk pengelola dan orang tua**; siswa adaptif (PC prioritas). Tabel berubah menjadi daftar kartu di layar sempit; menu samping menjadi drawer.
- **Terang dan gelap di semua halaman.** Hanya token warna, **tanpa warna keras**. Kontras sesuai desain (AA), fokus keyboard terlihat, area sentuh minimal 44 px, animasi dekoratif mati bila `prefers-reduced-motion`.
- **Tidak mengandalkan warna saja:** status selalu disertai teks atau ikon; galat form tampil di dekat kolom (teks + ikon).
- **Konfirmasi aksi penting** (Pulang, Ganti device, hapus, ganti kode/level, batalkan sertifikat) selalu memakai `ConfirmDialog`, bukan `window.confirm`.
- **Zippy** dipakai sesuai pemetaan suasana di `docs/design-system.md` (bagian 7.3) dan tidak pernah tampil mengejek saat siswa salah.
- Keadaan memuat memakai `Skeleton` atau tombol berstatus memuat; keadaan kosong memakai `EmptyState` (dengan Zippy di area siswa).

---

## 9. Laporan akhir tiap fase

Setelah fase selesai, beri ringkasan singkat: **apa yang dikerjakan**, **berkas diubah/baru** (path), **kondisi sekarang** (apa yang sudah berjalan dan **cara mengujinya**: perintah dan langkah), **penyimpangan dari struktur folder acuan dan konflik dengan `rules.md`/`architecture.md`** (bila ada), serta **keputusan yang dibutuhkan** dari developer. Jangan menyalin isi kode ke laporan.

Perbarui **hanya** `README.md` (cara menjalankan, perintah `npm`, variabel `.env`, daftar modul yang sudah ada, cara uji) dan `.kiro/steering/project-context.md` bagian **"Status pengerjaan"**. **Jangan membuat atau memperbarui `ringkasan-perubahan.md`.**
