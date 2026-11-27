# PROMPT: Logo DigiPlay Learning (tiga varian, favicon, dan pengaturan logo)

Kamu adalah agen coding yang melanjutkan project **DigiPlay Learning** (`digiplay-learning/`). Prompt ini memasang tiga varian logo baru di aplikasi, memasang favicon, dan menambah slot logo di halaman Pengaturan lengkap dengan keterangan fungsinya. **Warna tema tidak termasuk di sini** (dikerjakan di prompt terpisah setelah `design-tokens.css` baru tersedia). Jangan mengubah warna atau token apa pun.

## Baca dulu

1. `.kiro/steering/project-context.md` dan `README.md`.
2. Modul `pengaturan` (unggah dan sajian logo yang sudah ada: `POST` dan `GET /api/v1/pengaturan/logo`, folder `uploads/logo/`), pembuat PDF `src/modules/sertifikat/sertifikat.pdf.js` (logo di sertifikat, `folderAset`), halaman masuk, layout siswa, layout pengelola (backoffice), layout orang tua, dan `BingkaiPengelola` (halaman verifikasi publik). Tiru polanya.

## Aturan kerja

- **Scope:** hanya logo, favicon, dan slot logo di Pengaturan. Jangan mengubah warna, token, modul lain, atau dokumen lain.
- **Arsitektur:** clean architecture + DI (`src/di/container.js`), alur `jsx -> controller -> usecase -> model`, SQL hanya di model. Dependency tidak dibuat di dalam class/function. Tiru pola berkas serupa; jangan mengubah pola yang sudah berjalan.
- **Komentar:** setiap function diberi komentar ringkas Bahasa Indonesia; percabangan non-trivial diberi komentar alasan (bukan mengulang kode). Periksa ulang sebelum selesai.
- **Kompleksitas:** perubahan sekecil mungkin. Pakai ulang komponen dan helper yang ada. Buat satu komponen baru `LogoAplikasi` hanya bila belum ada yang bisa diperluas, dan jelaskan alasannya singkat.
- Teks UI lewat `src/locales/id_ID.json`. Tema terang dan gelap serta tampilan responsif (360 px sampai desktop) tidak boleh rusak. Semua gambar logo memakai `alt` berisi nama tampilan aplikasi.
- **Jangan menghapus** kode yang tidak dipakai atau yang dikomen. **Tanpa test.**
- **Dokumentasi:** perbarui hanya `README.md` (cara uji, cara mengganti favicon) dan `.kiro/steering/project-context.md` (tabel letak berkas, daftar pengaturan, catatan teknis). **Jangan membuat `ringkasan-perubahan.md`** dan tanpa laporan `docs/reports/`.
- Bila ada keputusan yang tidak bisa diambil dari prompt ini, **berhenti dan tulis "keputusan untuk pemilik"** beserta rekomendasimu.

## Berkas yang sudah ditaruh pemilik (jangan dibuat ulang atau diubah)

| Berkas | Letak dari root project | Ukuran |
|---|---|---|
| Logo landscape (ikon + teks di samping), PNG transparan | `public/aset/logo/logo-landscape.png` | 1200 x 471 |
| Logo persegi tanpa teks (ikon), PNG transparan | `public/aset/logo/logo-persegi.png` | 512 x 512 |
| Logo persegi dengan teks di bawah, PNG transparan | `public/aset/logo/logo-persegi-teks.png` | 640 x 640 |
| Favicon | `src/app/favicon.ico` (16, 32, 48 px), `src/app/icon.png` (512), `src/app/apple-icon.png` (180, latar putih) | - |

Berkas-berkas ini adalah **logo bawaan**: dipakai bila admin belum mengunggah logo sendiri. Berkas di `src/app/` otomatis dikenali Next.js sebagai ikon situs; pastikan tidak ada ikon lain (mis. `favicon.ico` bawaan) yang bentrok, dan tidak perlu menulis kode untuk favicon kecuali metadata memang diperlukan.

## Tahap 1: Slot logo di Pengaturan

Kelompok baru **Logo** di halaman Pengaturan (admin). Satu slot per fungsi, masing-masing dengan pratinjau, tombol **Unggah/Ganti**, tombol **Kembalikan ke bawaan** (`ConfirmDialog`), dan **keterangan fungsi** singkat di bawah judul slot (teks di `id_ID.json`), serta petunjuk ukuran dan format:

| Slot | Kunci pengaturan | Keterangan fungsi yang ditampilkan | Bawaan bila kosong |
|---|---|---|---|
| **Logo utama** (landscape) | kunci logo yang sudah ada (jangan diganti nama; label saja diperbarui) | "Dipakai di header menu pengelola, header siswa dan orang tua, serta halaman verifikasi sertifikat. Disarankan lebar 1200 px, PNG transparan." | `logo-landscape.png` |
| **Logo ikon** (persegi) | `logo_ikon` | "Dipakai saat menu dipadatkan, di header layar HP, dan tempat sempit lain. Disarankan 512 x 512 px, PNG transparan." | `logo-persegi.png` |
| **Logo persegi dengan teks** | `logo_persegi_teks` | "Dipakai di halaman masuk dan layar kosong atau galat. Disarankan 640 x 640 px, PNG transparan." | `logo-persegi-teks.png` |
| **Logo sertifikat** | `logo_sertifikat` | "Dipakai di bagian atas PDF sertifikat. Pakai PNG atau JPEG, logo berwarna cukup jelas di kertas putih." | Logo utama; bila itu WebP atau tidak terbaca, `logo-landscape.png` bawaan |

Perilaku:
- Unggah, penyimpanan, penggantian, dan penghapusan berkas lama **meniru unggah logo yang sudah ada**: `POST /api/v1/pengaturan/logo` diperluas dengan field `slot` (atau route turunan bila lebih sesuai dengan pola yang ada), admin saja, validasi tipe dari **byte awal berkas** (bukan ekstensi), nama berkas acak (`tokenAcak()`), disimpan di `uploads/logo/`, dan berkas lama slot itu dihapus setelah diganti.
- Format: PNG, JPEG, WebP seperti aturan logo sekarang; **slot Logo sertifikat hanya PNG atau JPEG** karena pdfkit tidak membaca WebP. Batas ukuran 1 MB per slot. Slot utama, ikon, dan persegi-teks dianjurkan PNG transparan (jelaskan di petunjuk).
- Sajian publik lewat `GET /api/v1/pengaturan/logo` (utama, perilaku lama tetap) dan route turunan per slot (karena logo tampil di halaman masuk dan halaman verifikasi publik). Berikan `Cache-Control` yang wajar dan nama berkas acak sebagai pembatal cache. Bila slot kosong, sajikan berkas bawaan dari `public/aset/logo/`.
- Kunci baru ditambahkan ke `INSERT IGNORE` pengaturan di `schema.sql` (database baru) dan `db:seed` (database lama), bawaan kosong. **Logo yang sudah diunggah admin sebelumnya tetap dipakai sebagai Logo utama** tanpa migrasi.
- Aksi unggah, ganti, dan kembalikan ke bawaan dicatat ke log aktivitas (tambahkan di `AKSI_LOG` dan `log.aksiLabel`), tanpa menyalin isi berkas.
- Pratinjau slot memakai latar abu muda atau kotak-kotak supaya transparansi terlihat di tema terang dan gelap.

## Tahap 2: Pemasangan logo di aplikasi

Satu komponen `LogoAplikasi` (props `varian`: `utama`, `ikon`, `persegiTeks`; ukuran lewat kelas) yang memilih sumber (unggahan atau bawaan) dan dipakai di semua tempat di bawah ini. Tempat yang saat ini belum memakai logo hanya ditambah sesuai tabel; jangan mengubah tata letak lain.

| Tempat | Varian | Catatan |
|---|---|---|
| Halaman masuk (siswa, orang tua, pengelola) | `persegiTeks` di atas form | tinggi sekitar 120-160 px, di tengah |
| Header menu pengelola (backoffice), menu terbuka | `utama` | tinggi sekitar 32-40 px |
| Header menu pengelola, menu dipadatkan, dan header di layar HP | `ikon` | 32-40 px |
| Header siswa dan orang tua | `utama` di layar lebar, `ikon` di HP | ikuti titik patah yang sudah ada |
| Halaman verifikasi sertifikat publik (`BingkaiPengelola`) | `utama` | di bagian atas |
| Layar kosong, 404, dan galat | `persegiTeks` | di tengah |
| PDF sertifikat | Logo sertifikat | bagian atas, rata tengah, `fit` ke kotak maksimal sekitar 180 x 60 pt tanpa mengubah rasio; bila gagal dibaca, PDF tetap jadi tanpa logo dan peringatan ditulis sekali per proses (seperti sekarang) |

**Aturan penting untuk tema gelap:** pada logo utama dan persegi-teks, tulisan "Learning" berwarna biru tua dan garis tepi ikon berwarna biru tua, sehingga **hampir tak terlihat di latar gelap**. Di tema gelap, bungkus logo utama dan persegi-teks dengan wadah terang (mis. latar putih 95%, sudut membulat, padding kecil) di semua tempat tampilnya. Varian `ikon` boleh tanpa wadah di latar gelap, tetapi periksa terbacanya. Jangan membuat berkas logo versi gelap.

## Tahap 3: Favicon dan metadata

- Pastikan `src/app/favicon.ico`, `icon.png`, dan `apple-icon.png` (sudah ditaruh pemilik) dipakai, tanpa menambah route atau kode baru kecuali perlu. Favicon bersifat tetap (tidak bisa diubah dari Pengaturan); jelaskan di README cara menggantinya (timpa tiga berkas itu).
- Judul tab dan metadata tetap memakai nama tampilan dari pengaturan seperti sekarang; jangan mengubah mekanismenya.

## Kriteria selesai (uji manual dan jelaskan di README)

1. Tanpa unggahan apa pun, semua tempat di atas menampilkan logo bawaan dengan varian yang tepat.
2. Mengunggah dan mengganti tiap slot memperbarui tampilan di tempatnya, berkas lama terhapus, "Kembalikan ke bawaan" bekerja, dan nilai yang tidak valid ditolak dengan pesan jelas.
3. PDF sertifikat memuat Logo sertifikat; bila kosong memakai Logo utama; bila Logo utama WebP memakai logo bawaan; unduhan tidak pernah gagal karena logo.
4. Tema gelap: tulisan "Learning" selalu terbaca (wadah terang) di semua tempat; tema terang tetap rapi; HP 360 px tanpa luapan mendatar.
5. Tab browser menampilkan favicon; ikon di layar utama iOS tidak berlatar hitam.
6. Logo yang sudah diunggah admin sebelumnya tetap tampil sebagai Logo utama.

## Catatan akhir (wajib)

Tulis ringkasan singkat di chat (bukan berkas): berkas yang diubah dan dibuat, nama route baru, kunci pengaturan baru, dan **keputusan untuk pemilik** (bila ada). Pastikan `README.md` dan `.kiro/steering/project-context.md` diperbarui.
