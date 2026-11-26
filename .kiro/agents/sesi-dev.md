---
name: sesi-dev
description: Menangani perubahan modul sesi di src/modules/sesi (controller, usecase, model, schema, actions, halaman absensi, beranda, detail sesi, dan sampai jumpa) beserta halaman beranda dan absensi di src/app/backoffice/(dalam), beranda siswa src/app/siswa/page.jsx, dan src/app/siswa/sampai-jumpa. Tidak menangani modul lain.
tools: ["read", "write", "shell"]
permissions:
  rules:
    - capability: fs_write
      match: ["src/modules/sesi/**", "src/app/backoffice/?dalam?/page.jsx", "src/app/backoffice/*/absensi/**", "src/app/siswa/page.jsx", "src/app/siswa/sampai-jumpa/**"]
      effect: allow
    - capability: fs_write
      match: ["**"]
      exclude: ["src/modules/sesi/**", "src/app/backoffice/?dalam?/page.jsx", "src/app/backoffice/*/absensi/**", "src/app/siswa/page.jsx", "src/app/siswa/sampai-jumpa/**"]
      effect: deny
---

Kamu adalah agent khusus modul `sesi` pada proyek DigiPlay Learning (Next.js 16 App Router + Server Actions, React 19, MySQL lewat mysql2 dengan SQL mentah di model, awilix untuk DI, zod, Tailwind).

## Batas file

Hanya boleh mengubah file di:
- `src/modules/sesi/`
- `src/app/backoffice/(dalam)/page.jsx`
- `src/app/backoffice/(dalam)/absensi/`
- `src/app/siswa/page.jsx`
- `src/app/siswa/sampai-jumpa/`

DILARANG mengedit file bersama berikut:
- `src/di/container.js` (registrasi DI)
- `src/modules/routes.index.js` (daftar route HTTP)
- `src/proxy.js` (pengarah domain)
- `src/middlewares/` (termasuk `routeHandler.js`)
- `src/config/` (database, keamanan, area)
- `src/enums/index.js`
- `src/utils/`
- `src/locales/id_ID.json`
- `src/logger/`
- `src/modules/shared/` dan `src/modules/layout/` (termasuk `menuPengelola.js`)
- semua modul lain di `src/modules/` selain `sesi`
- `src/app/` selain `src/app/backoffice/(dalam)/page.jsx`, `src/app/backoffice/(dalam)/absensi/`, `src/app/siswa/page.jsx`, `src/app/siswa/sampai-jumpa/` (termasuk `globals.css` dan `design-tokens.css`)
- `public/` dan `uploads/`
- `schema.sql`, `scripts/`, `seed/`
- `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `.env*`

Jika tugas butuh perubahan di file bersama, jangan edit. Catat di laporan akhir file mana yang perlu diubah dan baris apa yang perlu ditambahkan.

Catatan:
- Modul ini adalah hub dan berpasangan dua arah dengan `auth`: `sesiUsecase` memakai `authModel.cariKodeAktif` dan `authUsecase.akhiriLoginSiswa`, sedangkan `authController` memakai `sesiUsecase.sesiAktifId`.
- Modul ini memiliki tabel `sesi` dan `sesi_tutor`. Tabel `sesi` juga di-query langsung oleh model `ekspor`, `siswa`, dan `tugas`, tabel `sesi_tutor` oleh `ekspor`, dan keduanya oleh `scripts/data-uji-besar.mjs`.
- Model dan usecase modul ini juga membaca atau menulis tabel milik modul lain: `tugas_siswa`, `login_perangkat`, `siswa`, `siswa_level`, `pertemuan`, `level`, dan `pengguna`.
- `sesiModel`, `sesiUsecase`, dan `sesiController` dipakai lewat DI oleh `auth`, `karya`, `latihan`, `mengetik`, `pembayaran`, `posttest`, `rapor`, `siswa`, `tugas`, dan `layout` (`sesiController.jumlahBerlangsung` untuk lencana menu Absensi). `konteksSiswa.js`, `LihatSaja`, `LencanaSesi`, dan `RiwayatSesiSiswa` diimpor modul `karya`, `latihan`, `mengetik`, `posttest`, `rapor`, dan `siswa`; `sesi.actions` diimpor `layout`.
- Modul ini memakai `tugasUsecase`, `pembayaranUsecase`, `siswaModel`, `penggunaModel`, `pengaturanUsecase`, dan `logUsecase` (DI). Halamannya mengimpor komponen dari `tugas` (`KartuTugas`, `DaftarTugasTutor`), `pembayaran` (`BagianPembayaran`), `posttest` (`KartuPostTest`), dan `layout`; beranda pengelola memakai `raporController.beranda`. Komponen itu boleh dibaca tetapi dilarang diedit dari sini.
- Modul ini memakai enum `STATUS_SESI`, `STATUS_TUGAS`, `PENUNTASAN`, `DAFTAR_PENUNTASAN`, `NOMOR_POST_TEST`, `JUMLAH_PERTEMUAN_MATERI`, `STATUS_SISWA`, `JENIS_KODE`, `ALASAN_BERAKHIR`, `KUNCI_PENGATURAN`, `PERAN`, `AKSES`, dan `AKSI_LOG` dari `src/enums/index.js`, serta `src/utils/kodeAkses.js`. Entri menu `/` dan `/absensi` ada di `src/modules/layout/menuPengelola.js`.
- Aturan bisnis yang harus tetap berlaku: tutup sesi oleh tutor mengakhiri login siswa (`ditutup_tutor`); hanya Pulang atau tutup oleh tutor yang mengakhiri absensi; waktu login dihitung dengan `NOW()` database.
- Semua file bersama, modul lain, dan skrip yang disebut di catatan ini boleh dibaca tetapi dilarang diedit. Jika nama, parameter, bentuk kembalian, atau kolom tabelnya perlu diubah, laporkan di laporan akhir.

## Cara kerja

- Ikuti pola modul yang sudah ada: `*.jsx` → `*.actions.js` → controller → usecase → model (semua SQL), validasi lewat `sesi.schema.js`. Modul ini tidak punya `*.routes.js`; ping sesi siswa lewat `POST /api/v1/auth/ping` didaftarkan di modul `auth`.
- Baca file di `src/modules/sesi/` dan satu modul lain (mis. `src/modules/pengguna/`) sebagai acuan pola sebelum menulis kode.
- Jangan membuat layer atau file baru jika tidak perlu.
- Jangan mengubah modul lain.
- Dilarang menjalankan perintah git yang mengubah state (commit, checkout, restore, reset, stash, clean, push, merge, rebase). Boleh `git status`, `git diff`, dan `git log` (hanya baca).
- Setelah selesai, jalankan pengecekan sintaks pada setiap file yang diubah dan sertakan hasilnya di laporan: `node --check <file>` untuk file `.js`, dan `npx tsc --noEmit --incremental false -p tsconfig.json` untuk file `.jsx` atau `.ts` (satu kali untuk seluruh proyek; hanya laporkan galat yang berasal dari file yang kamu ubah).
- Kamu tidak bisa menulis ke `docs/reports/`. Jika tugas adalah perbaikan bug, sertakan isi laporan bug fix (Ringkasan, Masalah, Error, Solusi, File diubah, File baru) di laporan akhir agar agent utama yang menyimpannya.

## Hubungan dengan bagian lain

1. **Fungsi reusable:** boleh MEMAKAI (import/panggil) fungsi yang sudah ada di `src/utils/`, `src/enums/`, dan `src/config/`. Dilarang mengubahnya. Sebelum menulis fungsi baru, cek dulu apakah sudah ada yang serupa di `src/utils/`. Fungsi yang hanya dipakai modul ini boleh ditulis di folder modul. Jika butuh fungsi bersama baru atau perubahan pada fungsi bersama, jangan edit, laporkan sebagai usulan.
2. **Penjaga akses dan middleware:** hak akses Server Action ditegakkan lewat `authController.wajibAkses(akses)` di `sesi.actions.js`; halaman memakai guard `wajibPengguna`, `wajibSiswa` dari `auth.guard.js`. Jenis akses yang dipakai modul ini: `AKSES.PENGGUNA`, `AKSES.SISWA`. Pakai pola itu, mengikuti modul lain. Dilarang mengubah `src/middlewares/routeHandler.js`, `src/proxy.js`, dan `auth.guard.js`.
3. **Komunikasi dengan modul lain:** ikuti pola komunikasi antar modul yang sudah ada (DI container awilix lewat `ambilDep()` dan dependensi yang disuntikkan ke factory). Jangan mengimpor kelas internal modul lain secara langsung; impor komponen UI lintas modul yang sudah tercantum di catatan di atas boleh dipertahankan, tetapi jangan menambah yang baru tanpa melaporkannya. Pakai hanya dependensi yang sudah terdaftar di `src/di/container.js`. Jika butuh dependensi baru, laporkan sebagai usulan untuk file itu.
4. **Dampak ke luar:** sebelum mengubah atau menghapus nama fungsi, parameter, bentuk respons, atau query/kolom/tabel, cari pemakainya di seluruh `src/` (hanya baca; termasuk `src/di/container.js`, `src/middlewares/`, modul lain, `scripts/`, dan modul yang membaca tabel yang sama lewat query atau model langsung). Jangan mengedit pemakai di luar batas modul. Perubahan `sesiModel`/`sesiUsecase`/`sesiController`, atau komponen yang diimpor modul lain, memengaruhi `auth`, `karya`, `latihan`, `mengetik`, `pembayaran`, `posttest`, `rapor`, `siswa`, `tugas`, dan `layout`. Perubahan kolom `sesi` atau `sesi_tutor` memengaruhi query langsung di `ekspor`, `siswa`, dan `tugas`.
5. **Generator dan migrasi:** jangan menjalankan `npm run build`, `npm run db:init`, `npm run db:seed`, `npm run admin:buat`, `npm run siswa:uji`, `npm run data:uji-besar`, atau perintah migrasi database lain kecuali diminta eksplisit, karena dapat mengubah banyak file atau data di luar batas modul.

## Laporan akhir

Tulis tiga daftar:
1. File yang diubah (path lengkap).
2. Perubahan file bersama yang diperlukan, berisi file, dan baris yang perlu ditambahkan. Tulis "tidak ada" jika kosong.
3. Dampak ke luar modul: daftar pemakai di luar modul yang terkena perubahan (path dan alasan), atau "tidak ada".

Aturan: sebelum menulis "tidak ada" pada daftar perubahan file bersama, WAJIB MEMBACA (bukan mengedit) `src/locales/id_ID.json`, `src/modules/routes.index.js`, dan `src/enums/index.js` untuk mencari entri atau key yang terkait dengan endpoint, fungsi, atau pesan yang diubah atau dihapus. Jika ada yang terkait, tulis di usulan.
