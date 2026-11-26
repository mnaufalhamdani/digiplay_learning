---
inclusion: always
---

# Aturan Delegasi ke Sub-Agent

## Agent modul yang tersedia
- `auth-dev`: modul `src/modules/auth` (beserta `src/app/siswa/masuk` dan `src/app/backoffice/masuk`)
- `ekspor-dev`: modul `src/modules/ekspor` (beserta `src/app/backoffice/(dalam)/ekspor`)
- `health-dev`: modul `src/modules/health` (tanpa halaman)
- `log-dev`: modul `src/modules/log` (beserta `src/app/backoffice/(dalam)/log`)
- `pengguna-dev`: modul `src/modules/pengguna` (beserta `src/app/backoffice/(dalam)/akun` dan `.../pengguna`)
- `pengaturan-dev`: modul `src/modules/pengaturan` (beserta `src/app/backoffice/(dalam)/pengaturan` dan `uploads/logo`)
- `level-dev`: modul `src/modules/level` (beserta `src/app/backoffice/(dalam)/level`)
- `gambar-dev`: modul `src/modules/gambar` (beserta `src/app/backoffice/(dalam)/gambar` dan `public/aset/gambar`)
- `template-dev`: modul `src/modules/template` (beserta `src/app/backoffice/(dalam)/template`)
- `siswa-dev`: modul `src/modules/siswa` (beserta `src/app/backoffice/(dalam)/data-siswa` dan `src/app/backoffice/kartu-kode`)
- `tugas-dev`: modul `src/modules/tugas` (tanpa halaman)
- `pembayaran-dev`: modul `src/modules/pembayaran` (tanpa halaman)
- `sesi-dev`: modul `src/modules/sesi` (beserta `src/app/backoffice/(dalam)/page.jsx`, `.../absensi`, `src/app/siswa/page.jsx`, dan `src/app/siswa/sampai-jumpa`)
- `mengetik-dev`: modul `src/modules/mengetik` (beserta `src/app/siswa/mengetik` dan `public/aset/mengetik`)
- `latihan-dev`: modul `src/modules/latihan` (beserta `src/app/siswa/latihan-mouse` dan `src/app/siswa/puzzle`)
- `karya-dev`: modul `src/modules/karya` (beserta `src/app/siswa/karya`, `src/app/backoffice/(dalam)/karya`, dan `uploads/karya`)
- `posttest-dev`: modul `src/modules/posttest` (beserta `src/app/siswa/post-test` dan `src/app/backoffice/(dalam)/post-test`)
- `sertifikat-dev`: modul `src/modules/sertifikat` (beserta `src/app/publik/verifikasi` dan `src/app/backoffice/(dalam)/sertifikat`)
- `rapor-dev`: modul `src/modules/rapor` (beserta `src/app/siswa/ortu`)

## Kapan mendelegasikan
Prosedur untuk setiap tugas yang menyentuh kode:

1. Tentukan modul apa saja yang disentuh tugas.
2. Sebelum meluncurkan sub-agent, analisis ketergantungan (hanya baca): lihat `src/di/container.js` dan cari pemakai kelas atau fungsi publik modul itu (usecase, controller, model, guard) di `src/` (modul lain, `src/app/`, `src/middlewares/`) dan `scripts/`. Selain pemakai lewat DI, cari juga modul lain yang memakai tabel atau kolom yang sama lewat query atau model langsung, karena itu juga ketergantungan kontrak (penyedia: modul yang menulis atau mengubah tabel). Tentukan apakah tugas mengubah kontrak (nama fungsi, parameter, bentuk respons, tabel/kolom) yang dipakai modul lain di tugas yang sama.
3. Putuskan:
   - Satu modul, tugas kecil: kerjakan langsung, tanpa sub-agent.
   - Satu modul, tugas besar (banyak file atau lapisan): delegasikan ke agent modul tersebut.
   - Satu modul yang mengubah kontrak yang dipakai modul lain: tetap lakukan analisis dampak di langkah 2 dan laporkan pemakai yang terdampak, sekalipun dikerjakan langsung.
   - Dua modul atau lebih yang independen (tidak ada kontrak yang saling dipakai): WAJIB delegasikan paralel ke agent modul masing-masing. Aturan ini hanya menghitung modul yang punya agent.
   - Dua modul atau lebih dengan ketergantungan kontrak: kerjakan berurutan. Modul penyedia dulu, lalu modul pemakai, dengan laporan penyedia sebagai masukan. Paralel hanya untuk bagian yang benar-benar independen.
   - Modul pasangan, modul hub, dan agregator: jangan paralel. Kerjakan langsung oleh agent utama atau berurutan.
     - Pasangan `auth` dan `sesi`: `authController` memakai `sesiUsecase`, sedangkan `sesiUsecase` memakai `authModel` dan `authUsecase`.
     - Pasangan `posttest` dan `sertifikat`: `posttest` memakai `sertifikatUsecase` (penerbitan otomatis saat finalisasi) dan komponen `StatusSertifikatPostTest`, sedangkan `sertifikat` membaca tabel `post_test` milik `posttest`.
     - Pasangan `sesi` dan `rapor`: beranda pengelola di `sesi` memakai `raporController.beranda`, sedangkan `rapor` memakai `sesiUsecase`, `sesiModel`, dan komponen `LencanaSesi`.
     - Hub `auth`: `auth.guard.js` diimpor puluhan file di modul lain, dan `authController.wajibAkses` dipakai `*.actions.js` modul lain serta `src/middlewares/routeHandler.js`.
     - Hub `pengaturan`: `pengaturanUsecase` dipakai `auth`, `posttest`, `sertifikat`, `sesi`, `siswa`, dan `tugas`; `pengaturanController.branding` dipakai `layout` dan `rapor`.
     - Hub `log`: helper `catatAktivitas` dipakai 13 modul, dan `logUsecase.detailTerakhir` dipakai `posttest`, `sertifikat`, dan `sesi`.
     - Hub `sesi`: `sesiModel`, `sesiUsecase`, atau `sesiController` dipakai `auth`, `karya`, `latihan`, `mengetik`, `pembayaran`, `posttest`, `rapor`, `siswa`, `tugas`, dan `layout`.
     - Agregator `rapor`: memanggil usecase `sesi`, `posttest`, `mengetik`, `latihan`, `pembayaran`, `sertifikat`, dan `karya`, serta model `siswa`, `sesi`, `posttest`, `sertifikat`, dan `pembayaran`. Jangan paralel dengan modul yang dipanggilnya.
   - Modul tanpa agent khusus (semua modul di `src/modules/` yang tidak ada di daftar agent di atas): kerjakan langsung oleh agent utama. Jangan memakai agent modul lain untuk modul itu.
   - Area bersama (`src/di/container.js`, `src/modules/routes.index.js`, `src/proxy.js`, `src/middlewares/`, `src/config/`, `src/enums/index.js`, `src/utils/`, `src/locales/id_ID.json`, `src/logger/`, `src/modules/shared/`, `src/modules/layout/`, `src/app/` di luar halaman masuk, `schema.sql`, `scripts/`, `seed/`, `package.json`, `next.config.mjs`, `.env*`): dikerjakan langsung oleh agent utama, bukan sub-agent. Jika tugas yang sama juga mengubah modul, kerjakan area bersama lebih dulu (sebagai penyedia), baru delegasikan modulnya.
4. Tampilkan rencana singkat (modul, urutan, alasan satu kalimat), lalu langsung jalankan tanpa menunggu persetujuan.
5. Setelah semua selesai: baca bagian "Dampak ke luar modul" dari tiap laporan, gabungkan usulan file bersama, periksa sendiri `src/locales/id_ID.json` dan `src/modules/routes.index.js`, lalu terapkan satu file pada satu waktu. Jika ada pemakai di luar lingkup tugas yang terdampak, jangan ubah otomatis. Laporkan kepada saya. Jalankan pengecekan sintaks pada semua file yang diubah (oleh siapa pun) dan laporkan hasilnya: `node --check <file>` untuk file `.js`, dan `npx tsc --noEmit --incremental false -p tsconfig.json` untuk file `.jsx` atau `.ts` (satu kali untuk seluruh proyek). Jangan membuat test.

## Kapan berhenti dan bertanya
Meskipun rencana dijalankan otomatis, BERHENTI dan tanya saya sebelum mengubah kode jika:
- (a) tugas bergantung pada asumsi penting yang tidak bisa diverifikasi dari repo (mis. kolom atau tabel DB, perilaku klien);
- (b) instruksi punya beberapa tafsir dengan hasil berbeda;
- (c) perubahan menyentuh folder util, middleware, config, atau enum bersama.

Jika instruksi sudah eksplisit meminta penghapusan atau perubahan yang membuat klien lama gagal, lanjutkan, dan tulis peringatannya di laporan sebagai "Dampak ke klien".

## File bersama
- Sub-agent dilarang mengedit file bersama.
- Setelah semua sub-agent selesai, agent utama memeriksa sendiri `src/locales/id_ID.json` dan `src/modules/routes.index.js`, lalu menerapkan hanya perubahan yang diperlukan, satu file pada satu waktu, tanpa menyentuh baris lain.

## Laporan
Setelah selesai, laporkan file yang diubah per agent dan file bersama yang diubah.
- Jika tugas adalah bug fix, agent utama menulis laporan bug fix sesuai `working-rules.md` setelah semua sub-agent selesai, dengan menggabungkan laporan mereka. Sub-agent tidak menulis di luar batas modulnya.

## Pemeliharaan project-context.md
- Setelah tugas selesai, agent utama memperbarui `.kiro/steering/project-context.md` HANYA jika tugas mengubah hal struktural: modul ditambah, dihapus, atau diganti nama; prefix route berubah; registrasi atau dependensi baru di `src/di/container.js`; area bersama baru; script berubah. Bug fix dan perubahan di dalam satu fungsi tidak memicu pembaruan.
- Edit hanya bagian yang terdampak, jangan menulis ulang seluruh file, dan jangan menulis rahasia.
- Sub-agent dilarang mengedit file ini. Agent utama yang memperbaruinya setelah semua sub-agent selesai.
- Ini pengecualian dari aturan Scope di `working-rules.md`. Laporkan perubahannya di bagian laporan sebagai file bersama yang diubah.
- Jika ragu apakah perlu diperbarui, jangan ubah. Tulis usulannya di laporan.
