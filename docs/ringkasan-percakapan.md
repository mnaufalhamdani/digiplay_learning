# Ringkasan Percakapan: DigiPlay Learning

> Berkas ini **untuk Claude**, bukan untuk agen coding (agen tidak perlu membacanya dan tidak boleh mengubahnya). Gunanya: di sesi chat baru, Claude cukup membaca ringkasan ini (bersama `.kiro/steering/project-context.md` terbaru) tanpa membaca chat yang panjang.
>
> Cara memakai di chat baru: unggah berkas ini + `.kiro/steering/project-context.md` terbaru (+ laporan agen terakhir bila ada), lalu tulis: *"Baca ringkasan ini lalu lanjutkan proyek DigiPlay."*

Terakhir diperbarui: **Fase A sampai F sudah dikerjakan agen dan diuji lokal**; yang tersisa adalah uji dengan siswa sungguhan, perbaikan temuan, dan deploy (ditunda sampai domain dan server siap). `project-context.md` sekarang berada di `.kiro/steering/` (dimuat otomatis sebagai steering Kiro), bukan di root.

## 1. Proyek

**DigiPlay Learning**: website les komputer anak berbasis **level tanpa patokan usia** (Pemula, Dasar, Lanjutan), tiap level **12 pertemuan + 1 pertemuan post test**. Pemilik adalah developer (JS, PHP, Flutter, Kotlin) yang membangun lewat **agen coding** memakai prompt yang ditulis Claude; pengerjaan masih **lokal** (domain dan server belum siap).

- **Satu project Next.js** (frontend + backend) melayani dua area: siswa dan orang tua (`namadomain.com`), pengelola (`backoffice.namadomain.com`). Dibedakan oleh `src/proxy.js`; cookie sesi tidak dibagi antar domain.
- **Stack:** Next.js 16 (App Router, versi dipin), JavaScript (+ `*.controller.ts`/`*.usecase.ts`), MySQL 8 / **MariaDB 11.8 lokal (port 3307)**, mysql2 tanpa ORM, awilix (DI), zod, Tailwind v4, Phosphor Icons, font Fredoka + Nunito. Arsitektur meniru project referensi **DK Docs**: `jsx -> controller -> usecase -> model (semua SQL)`, satu folder per modul di `src/modules/<modul>/`.
- **Nama project/repo:** `digiplay-learning`. **Maskot:** **Zippy**, sugar glider "Pahlawan Anti-Gaptek" (setelan biru-oranye, lambang petir).

## 2. Keputusan utama

**Akses dan sesi**
- Siswa login dengan **kode unik 8 karakter** (alfabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, tanpa O, I, 0, 1). **Kode siswa dan kode orang tua terpisah**; orang tua hanya melihat (rapor, sertifikat, status bayar).
- Admin dan tutor login email + password. Admin: semua hak tutor + pengaturan, kelola akun tutor, hapus siswa, ubah template. Tutor: daftarkan siswa, absen, catatan, penuntasan, pembayaran, sertifikat.
- **Sesi**: tutor absen masuk dengan input kode siswa dan memilih pertemuan; siswa baru boleh mengerjakan setelah itu (sebelum itu mode lihat saja). Siswa menekan **Pulang** (`ConfirmDialog`); tutor bisa **Tutup sesi** (tanpa tanda khusus). **Satu kode satu perangkat**, login berakhir bila tidak aktif > 5 menit (bisa diatur), tombol **Ganti device** mengakhiri login di PC itu tanpa mengakhiri absensi. Tidak ada penutupan otomatis akhir hari. Satu siswa bisa ditangani lebih dari satu tutor; catatan disimpan per tutor.

**Materi, penilaian, sertifikat**
- Tugas dan soal dari **template dengan parameter acak (tanpa AI)**. Mode penilaian: `otomatis_jawaban` atau `dicek_tutor`. Status tugas: belum, selesai, dilewati, diganti. Status materi: **Diajarkan** (otomatis dari absensi) dan penuntasan (**tuntas / tuntas sebagian / tidak tuntas**, dihitung otomatis dan bisa diubah tutor; pilihan tutor yang berlaku).
- **Post test: 15 butir, 45 menit, semua level.** Lulus bila total >= 70 **dan** tiap bagian >= 50. Syarat ikut: kehadiran >= 9 dari 12 pertemuan (tutor bisa memberi pengecualian). Tombol mulai muncul otomatis di pertemuan 13. Tes ulang hanya bagian yang gagal. Hanya sekali dikerjakan; bisa dilanjutkan dengan sisa waktu setelah ganti device.
- Bagian post test: **L1** A mengetik 20% (1 butir), B pengetahuan 30% (10), C praktik Mouse/File/Paint 25% (2), D praktik Word 25% (2). **L2** A mengetik 15% (1), B praktik Word/PowerPoint 25% (2), C Excel 25% (5), D praktik Scratch 20% (2), E konsep 15% (5). **L3** A mengetik 10% (1), B Excel 30% (5), C praktik grafik/desain/animasi 20% (2), D praktik coding 20% (2), E konsep 20% (5).
- **Sertifikat** per level terbit otomatis saat lulus; admin/tutor bisa membatalkan atau menerbitkan ulang. QR menuju **halaman verifikasi publik berbasis token acak** tanpa data sensitif.
- **Pembayaran** dicatat manual oleh tutor (saat absen atau catatan) dan **terlihat oleh orang tua**.
- Isi level: **L1** (Mouse, keyboard, Paint, Word dasar, internet sehat, coding visual Scratch Jr/Code.org), **L2** (mengetik 10 jari, Word tabel dan laporan, PowerPoint, Excel SUM/AVERAGE, Scratch), **L3** (mengetik cepat, Excel IF/COUNT/MAX/MIN dan grafik, Word/PowerPoint tugas sekolah, Canva, animasi Scratch, coding game, dasar HTML/CSS). Robotika tidak dipakai. Canva dipakai di L3; urusan akun dan syarat usia ditangani pemilik kursus.

**Desain dan aset**
- Satu set komponen, dua "kepribadian" lewat `data-area`: siswa playful (tombol gemuk, Zippy), pengelola tenang. **Mode orang tua** = varian area siswa yang lebih tenang. Terang dan gelap di semua halaman (64 pasangan warna lolos kontras AA). Ikon **Phosphor** (bobot `bold`/`duotone` siswa, `regular` pengelola) lewat pembungkus `Ikon`. Konfirmasi aksi penting memakai `ConfirmDialog` kustom.
- **75 subjek gambar** (hewan, tanaman, kendaraan, benda lain, benda olahraga; 15 per kategori), tiap subjek empat berkas: `outline`, `berwarna`, `puzzle`, `mewarnai`. `mewarnai.png` dibuat skrip dari outline + contoh berwarna (tata letak "pita": contoh di bawah, tidak menimpa gambar). Game mouse (5 game) dan puzzle dibuat sendiri di web. Zippy: PNG transparan potret 3:4, `zippy-wajah` persegi 1:1 (sudah selesai).

## 3. Berkas dan letaknya (dari root `digiplay-learning/`)

| Berkas | Letak |
|---|---|
| `project-context.md` (dibaca dan diperbarui agen, bagian "Status pengerjaan"; dipindah dari root) | `.kiro/steering/project-context.md` |
| `README.md` (cara menjalankan, matriks akses, cadangan, daftar periksa produksi, cara uji per fase) | root |
| `schema.sql` (25 tabel) | `schema.sql` |
| `PROMPT_BUILD_DIGIPLAY.md` (prompt agen, semua fase) | `docs/prompt/` |
| `ringkasan-percakapan.md` (berkas ini) | `docs/` |
| `design-system.md` | `docs/` |
| `prompt-gambar.md`, `prompt-gambar.csv`, `prompt-maskot.md` | `docs/aset/` |
| `design-tokens.css` | `src/app/` |
| `gabung-mewarnai.mjs` | `scripts/` |
| `level-pertemuan.json`, `pelajaran-mengetik.json`, `template-level-1/2/3.json` | `seed/` |
| Gambar subjek | `public/aset/gambar/<kode>/` |
| Zippy `zippy-<suasana>.png` | `public/aset/maskot/` |
| Laporan bug fix | `docs/reports/<nama-bug>.md` |

Angka seed yang diharapkan: 3 level, 39 pertemuan, 14 bagian post test, **407 template** (L1 133, L2 136, L3 138), 48 teks mengetik (16 per level), 12 pelajaran mengetik, 75 subjek gambar.

## 4. Status pengerjaan

| Fase | Isi | Status |
|---|---|---|
| A | Fondasi, auth, area, UI dasar | **Selesai** |
| B | Seed, utilitas template, modul level/template/gambar/siswa/log | **Selesai** |
| C | Sesi, absensi, tugas, pembayaran | **Selesai** |
| D1 | Mengetik, game mouse, puzzle | **Selesai** |
| D2 | Post test | **Selesai** |
| E | Sertifikat PDF (pdfkit), QR, verifikasi publik bertoken, batal/terbit ulang | **Selesai** |
| F | Rapor orang tua, galeri karya, ekspor CSV, beranda pengelola, pemeriksaan akhir (akses, header, performa, README) | **Selesai** |
| Deploy | Domain, SSL, server, cadangan | Ditunda sampai domain dan server siap |

Cara menjalankan satu fase (di chat agent): `Baca docs/prompt/PROMPT_BUILD_DIGIPLAY.md lalu kerjakan Fase <X>.` Satu fase per permintaan.

## 5. Catatan teknis penting

- **Database lokal MariaDB**: kolom `JSON` kembali sebagai **string** (MySQL 8 mengembalikan objek) -> semua model memakai satu helper pengurai JSON; SQL harus kompatibel dengan MySQL 8 dan MariaDB 11. `DECIMAL` kembali string.
- ID: `BIGINT UNSIGNED` tanpa AUTO_INCREMENT, dibuat aplikasi (`idGen`), selalu **string** di JavaScript. Kolom `*_kunci` (generated, STORED) menjaga "satu aktif per ..." lewat UNIQUE; jangan diisi saat INSERT. FK pada kolom dasar kolom generated memakai RESTRICT, sehingga **hapus siswa** memakai urutan transaksi khusus (ada di komentar kepala `schema.sql`).
- Pola Fase A (dari agen): controller menerima `(input, sesi)`; hak akses Server Action lewat `authController.wajibAkses(akses)`, hak akses route lewat kolom `akses`; tautan/redirect memakai basis jalur (`x-dp-basis` dari `src/proxy.js`); ikon bernama `*Icon`; cookie `dp_bo` (pengelola), `dp_siswa` (token, hash di `login_perangkat`), `dp_ortu` (memuat `kodeId`).
- Skrip validasi dan pembangkit template (dulu di sandbox Claude) **tidak tersimpan di repo**. Bila template perlu diubah, edit JSON langsung atau lewat halaman Template (Fase B), yang memakai `validasiTemplate`.
- Parser ekspresi untuk kunci Excel ditulis sendiri (tanpa `eval`); `kunci.ekspresi` (angka, dengan `toleransi`) dan `kunci.jika/maka/lainnya` (teks).
- **Catatan dari agen (Fase B-D2) yang penting:**
  - `npm run db:seed` melakukan **upsert penuh**: baris yang sudah ada ditimpa dari berkas seed (termasuk `template.aktif = 1`), sehingga **perubahan template lewat halaman admin tertimpa bila seed dijalankan lagi**. Jangan menjalankan ulang seed setelah mengedit template di aplikasi (atau ubah dulu berkas JSON-nya).
  - `schema.sql` versi agen menambah pengaturan `jumlah_tugas_per_sesi` (6) dan `rubrik_bawaan` (JSON), serta kolom `post_test.bagian_ulang` (JSON, daftar id bagian tes ulang). `schema.sql` di repo adalah versi yang berlaku.
  - Halaman siswa di backoffice berada di `/data-siswa` (bukan `/siswa`, karena proxy menjawab 404 untuk `/siswa/*` di host backoffice); kartu kode cetak di `/kartu-kode/[id]`.
  - Cookie `dp_siswa` berlaku 12 jam: browser yang sama langsung masuk lagi tanpa kode selama login belum berakhir. Ping siswa tiap **15 detik**. Tutup sesi oleh tutor mengakhiri login siswa (siswa diarahkan ke halaman masuk).
  - Pembatas login membaca IP dari `x-forwarded-for` dari kanan (`JUMLAH_PROXY_TEPERCAYA`); produksi wajib di belakang reverse proxy.
  - **Fase E (sertifikat):** `terbitkanOtomatis` sudah terisi dan berjalan di SAVEPOINT di dalam transaksi finalisasi (gagal terbit tidak menggagalkan nilai; kegagalan tampil sebagai peringatan di detail post test dan tutor bisa menekan Terbitkan ulang). Nomor `DPL-<kode level>-<YYYYMM>-<urut>`, token verifikasi 16 karakter. PDF dibuat setiap diunduh dari snapshot (A4 lanskap, QR ke `URL_SISWA/verifikasi/<token>`); tanpa font TTF dipakai Helvetica (karakter di luar Windows-1252 jadi `?`), logo WebP tidak tampil di PDF (pdfkit hanya PNG/JPEG). Pengaturan baru `penandatangan_nama` dan `penandatangan_jabatan`. Revisi nilai setelah sertifikat terbit tidak mengubah snapshot; perlu Terbitkan ulang. `URL_SISWA` produksi wajib domain asli (isi QR).
  - **Fase F (orang tua dan pelengkap):** rapor `/ortu` (modul `rapor`, agregator tanpa tabel; riwayat sesi dan pembayaran berpaginasi), galeri karya (unggah lewat route HTTP, tipe berkas dari byte awal, siswa hanya menulis saat sesi berlangsung, akses baru `login` untuk rute berkas dengan pemeriksaan kepemilikan di usecase), ekspor CSV di `/ekspor` (BOM, anti CSV injection, tanpa kode akses, dicatat ke Log), beranda pengelola dengan kartu ringkas (kartu pembayaran hanya admin). Header keamanan di `next.config.mjs`; CSP belum dipasang (skrip tema inline butuh nonce). Indeks baru hasil `EXPLAIN` pada data uji besar (`npm run data:uji-besar`, hanya dev) ditambahkan di `schema.sql` dan `db:init`. `kelasTombol` dipindah ke `shared/ui/kelasTombol.js` agar bisa dipakai server component.
  - Menghapus siswa juga menghapus berkas karyanya dari `uploads/karya/<siswaId>/` (keputusan pemilik setelah Fase F).
  - Lulus post test **tidak** mengubah level; naik level manual lewat **Ganti level** (level lama tercatat `lulus` bila ada post test lulus, kalau tidak `berhenti`).
  - Next.js dinaikkan ke 16.4.6 karena 16.4.2 terkena celah keamanan.
- Kemungkinan masalah: balasan Claude yang sangat panjang bisa terpotong; pecah pekerjaan besar menjadi beberapa langkah.

## 6. Keputusan yang masih terbuka

- Perpindahan level setelah lulus: **manual** lewat Ganti level (sudah diputuskan untuk saat ini; bisa diotomatiskan kelak).
- Font TTF untuk PDF sertifikat bersifat **opsional**: bila `public/aset/font/Nunito-Regular.ttf`, `Nunito-Bold.ttf` (dan `Fredoka-SemiBold.ttf`) ditaruh pemilik, PDF memakainya; jika tidak, memakai Helvetica bawaan.
- Bagian B pada post test Level 2 mengambil 2 butir acak dari 6 sehingga bisa dua-duanya Word atau PowerPoint; bila ingin selalu satu-satu, bagian itu perlu dipecah.
- Waktu 45 menit untuk 15 butir cukup mepet; perlu uji coba dengan siswa sungguhan.
- **Diputuskan pemilik setelah Fase F:** tes ulang post test **tidak dibatasi** (jumlah dan jeda), dan **tes penempatan siswa baru dibiarkan** (belum dibangun).
- **Belum dibangun (di luar prompt F):** pengumuman dan jadwal untuk orang tua, gamifikasi (badge, poin), ekspor `.xlsx` (sekarang CSV), dan form ubah nama siswa.
- Bentuk catatan pembayaran (per sesi/bulan/paket) dan opsional menggeser warna `sun` ke oranye Zippy.
- Content-Security-Policy ketat (butuh nonce untuk skrip tema) dan pembatasan hak database produksi: dicatat di daftar periksa produksi README.
- Git LFS atau penyimpanan terpisah untuk gambar (sekitar 90 MB bila semua dibuat); deploy, domain, dan SSL ditunda.

## 7. Cara kerja dengan pemilik

- Bahasa **Indonesia**, **pelan-pelan**, satu keputusan per langkah (pilihan tombol untuk keputusan kecil), jelaskan istilah teknis dengan sederhana. Pemilik tidak perlu diminta berpikir bolak-balik; beri **rekomendasi tegas** dengan alasan.
- **Setiap berkas yang dibuat harus disertai letak penempatannya** (path dari root project). **Prompt agen selalu di `docs/prompt/`.**
- Aturan untuk agen: kode mengikuti clean architecture + DI; tiap function diberi komentar Bahasa Indonesia (cabang non-trivial diberi alasan); tanpa test kecuali diminta; **jangan menghapus kode yang tidak terpakai**; agen hanya memperbarui `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`; **tidak boleh membuat `ringkasan-perubahan.md`**; laporan bug fix di `docs/reports/<nama-bug>.md`.
- Pemilik mengunggah `.kiro/steering/project-context.md` hasil agen; jadikan versi itu dasar bila perlu mengubahnya (jangan menimpa catatan agen).

## 8. Langkah berikutnya untuk Claude

1. Semua fase A sampai F sudah dikerjakan. Bila pemilik membawa laporan agen atau `.kiro/steering/project-context.md` terbaru, tinjau penyimpangannya (bagian "Catatan teknis Fase F" dan "Perbandingan fitur") dan sesuaikan prompt bila perlu.
2. Sekarang: bantu pemilik **menguji dengan siswa sungguhan** (terutama durasi post test 45 menit, kenyamanan HP untuk tutor dan orang tua, dan kejelasan teks untuk anak), lalu memperbaiki temuan lewat prompt bug fix (laporan di `docs/reports/`).
3. Saat domain dan server siap: tulis prompt **deploy** (domain dan subdomain, SSL, reverse proxy dengan `Host` diteruskan, `JUMLAH_PROXY_TEPERCAYA`, `.env` produksi, cadangan database dan `uploads/`).
