# PROMPT: Penyempurnaan DigiPlay Learning (tanda tangan sertifikat, keterangan sesi pembayaran, tampilan detail log, ringkasan post test, pagination)

Kamu adalah agen coding yang melanjutkan project **DigiPlay Learning** (`digiplay-learning/`). Fase A sampai F dan semua fitur tambahan sudah selesai. Prompt ini berisi **lima penyempurnaan** dari hasil pemakaian. Kerjakan sesuai tahap yang diminta pemilik (contoh: "kerjakan Tahap 1 dan 2"). Bila tidak disebut, kerjakan berurutan dari Tahap 1 sampai 5 dan berhenti bila butuh keputusan pemilik.

## Baca dulu

1. `.kiro/steering/project-context.md` (arsitektur, pola, catatan teknis) dan `README.md`.
2. Berkas yang disebut di tiap tahap, serta **berkas serupa yang sudah ada** sebagai contoh pola (struktur, penamaan, cara DI). Tiru polanya; jangan mengubah pola yang sudah berjalan.

## Aturan kerja (berlaku untuk semua tahap)

- **Scope:** kerjakan hanya yang tertulis di tahap yang diminta. Jangan mengubah modul, halaman, atau dokumen lain yang tidak berkaitan.
- **Arsitektur:** clean architecture + DI. Alur `jsx -> controller -> usecase -> model` (semua SQL di model). Dependency tidak dibuat langsung di dalam class atau function; daftarkan lewat `src/di/container.js`. Hak akses Server Action lewat `authController.wajibAkses`, route HTTP lewat kolom `akses` di `*.routes.js`.
- **Komentar:** setiap function diberi komentar ringkas Bahasa Indonesia. Percabangan non-trivial (if/else, switch, try-catch, loop dengan kondisi khusus) diberi komentar singkat yang menjelaskan **alasan**, bukan mengulang kode. Periksa ulang sebelum selesai.
- **Kompleksitas:** perubahan sekecil mungkin yang menyelesaikan tugas. Cek dulu apakah ada komponen/helper yang bisa dipakai atau diperluas sebelum membuat yang baru; bila membuat yang baru, jelaskan alasannya singkat di catatan akhir. Hindari nesting lebih dari 2-3 level (pakai early return atau extract function).
- **Teks UI** lewat `src/locales/id_ID.json`; ikon lewat `Ikon`; tema terang dan gelap, tampilan responsif (360 px sampai desktop) tidak boleh rusak.
- **Database:** SQL harus kompatibel MySQL 8 dan MariaDB 11 (JSON kembali sebagai string; `DECIMAL` string; ID `BIGINT UNSIGNED` string). Perubahan skema dicatat di `schema.sql` (database baru) **dan** di `db:init` (database lama), tanpa mengubah struktur tabel lain.
- **Jangan menghapus** kode yang tidak dipakai atau yang dikomen, baik milik project maupun yang kamu tulis sendiri.
- **Tanpa test** (unit/widget/dll).
- **Dokumentasi:** perbarui hanya `README.md` (cara uji fitur) dan bagian "Status pengerjaan" serta catatan teknis di `.kiro/steering/project-context.md`. **Jangan membuat `ringkasan-perubahan.md`** dan jangan membuat laporan di `docs/reports/` (ini penyempurnaan, bukan bug fix).
- Bila ada keputusan yang tidak bisa diambil dari prompt ini, **berhenti dan tulis sebagai "keputusan untuk pemilik"** di catatan akhir, lengkap dengan rekomendasimu.

---

## Tahap 1: Tanda tangan sertifikat (unggah PNG transparan)

**Masalah:** PDF sertifikat punya area tanda tangan kosong sehingga tanda tangan harus diisi manual setelah diunduh.

**Yang diinginkan:** admin mengunggah **satu gambar tanda tangan berlatar transparan** di halaman Pengaturan (kelompok **Sertifikat**, di dekat `penandatangan_nama` dan `penandatangan_jabatan`). Setiap sertifikat yang diunduh otomatis memuat gambar itu di atas nama penandatangan.

**Perilaku:**
- Hanya admin yang boleh mengunggah dan menghapus (sama seperti pengaturan lain).
- Format **PNG saja** (latar transparan). Deteksi tipe dari byte awal (`deteksiTipeGambar`), bukan dari nama atau ekstensi berkas. Tolak format lain dengan pesan jelas. Batas ukuran 500 KB.
- Alur unggah, penyimpanan, penggantian, dan penghapusan berkas lama **meniru unggah logo** (`POST /api/v1/pengaturan/logo`, multipart). Simpan di `uploads/tandatangan/` (tidak masuk repo; tambahkan ke aturan gitignore bila perlu). Nama berkas acak (`tokenAcak()`), nama berkas tersimpan di tabel `pengaturan` dengan satu kunci baru (ikuti penamaan kunci logo dan daftarkan di `INSERT IGNORE` `schema.sql` dan `db:seed`).
- Berbeda dari logo: tanda tangan **tidak disajikan publik**. Pratinjau di halaman Pengaturan lewat route khusus pengelola (admin dan tutor), karena halaman verifikasi publik tidak memerlukannya.
- Halaman Pengaturan menampilkan pratinjau di atas latar abu-abu muda atau kotak-kotak (supaya transparansi terlihat, baik tema terang maupun gelap), tombol **Unggah/Ganti**, dan tombol **Hapus** dengan `ConfirmDialog`. Beri petunjuk singkat: PNG transparan, disarankan sekitar 600 x 200 px.
- `sertifikat.pdf.js`: bila gambar ada, tempatkan di atas garis dan nama penandatangan, rata tengah terhadap blok penandatangan, dengan `fit` ke kotak maksimal (mis. 160 x 60 pt) tanpa mengubah rasio. Bila gambar belum diunggah, hilang di disk, atau gagal dibaca pdfkit, **PDF tetap jadi** seperti sekarang (ruang kosong untuk tanda tangan manual) dan peringatan ditulis ke log aplikasi sekali per proses. Unduhan tidak boleh gagal karena tanda tangan.
- PDF dibuat setiap diunduh, jadi sertifikat yang sudah terbit otomatis ikut memakai tanda tangan terbaru. Cek bagaimana `penandatangan_nama` dan `penandatangan_jabatan` dibaca (pengaturan saat unduh atau snapshot) dan **samakan** pola tanda tangan dengan keduanya. Catat pola yang kamu temukan di catatan akhir.
- Aksi unggah dan hapus dicatat ke log aktivitas (tambahkan konstanta di `AKSI_LOG` dan label di `log.aksiLabel`), tanpa menyimpan isi berkas.
- Sertifikat yang dibatalkan (watermark DIBATALKAN) tetap memakai tanda tangan yang sama.

**Kriteria selesai:** unggah PNG transparan, PDF yang diunduh pengelola dan orang tua memuat tanda tangan tanpa kotak putih; unggah non-PNG atau terlalu besar ditolak; hapus tanda tangan membuat PDF kembali seperti semula; berkas lama terhapus saat diganti.

---

## Tahap 2: Keterangan sesi pada daftar pembayaran

**Masalah:** daftar pembayaran hanya menampilkan pembayaran, tidak menyebut pembayaran itu untuk sesi yang mana.

**Yang diinginkan:** setiap baris pembayaran menampilkan **keterangan sesi**: pertemuan ke-berapa, judul pertemuan, level, dan tanggal sesi.

**Perilaku:**
- Tampil di semua tempat daftar pembayaran: menu Pembayaran backoffice, bagian pembayaran di detail siswa (backoffice), dan halaman **orang tua** (rapor).
- Contoh tampilan: `Pertemuan 5 · Paint dasar (Level 1) · 12 Nov 2026`. Pakai format tanggal yang sudah ada di helper format.
- Ambil dari `pembayaran.sesi_id` lewat `LEFT JOIN` ke `sesi`, `pertemuan`, dan `level`. Pembayaran **tanpa sesi** (kolom kosong) menampilkan "-" dan tidak boleh hilang dari daftar. Jangan mengubah struktur tabel; cek dulu apakah semua jalur pencatatan pembayaran (absen masuk, catatan tutor, form di detail siswa) mengisi `sesi_id`, dan catat hasilnya di catatan akhir sebagai keputusan untuk pemilik bila ada jalur yang tidak mengisinya.
- Total pembayaran dan filter yang sudah ada tidak berubah.
- Untuk orang tua, bentuk data tetap dipangkas di usecase: hanya kirim teks keterangan sesi (pertemuan, judul, level, tanggal), tanpa ID tutor atau data internal lain.
- Tampilan responsif: di layar sempit keterangan sesi tampil di bawah jumlah atau tanggal, tidak membuat halaman meluap mendatar.

**Kriteria selesai:** tiga tempat di atas menampilkan keterangan sesi; pembayaran tanpa sesi tetap tampil dengan "-"; data orang tua tidak membocorkan field internal.

---

## Tahap 3: Detail JSON di menu Log tampil di bawah baris, lebar penuh

**Masalah:** detail JSON di menu Log muncul sebagai collapse kecil di bawah kolom "Lihat detail" sehingga sempit dan sulit dibaca.

**Yang diinginkan:** saat baris diperluas, detail JSON tampil **di bawah baris data tersebut dengan lebar penuh**, mulai dari kolom Waktu sampai ujung kolom Detail (satu sel yang membentang di semua kolom), dan **tetap ada tombol expand/collapse**.

**Perilaku:**
- Awalnya tertutup. Tombol di kolom detail membuka dan menutup baris detail; ikon dan label berubah sesuai keadaan (buka/tutup), dan atribut aksesibilitas (`aria-expanded`, `aria-controls`) dipasang.
- Baris detail dibuat sebagai baris tambahan tepat di bawah baris datanya dengan `colSpan` seluas jumlah kolom. Beberapa baris boleh terbuka bersamaan.
- Isi: JSON dirapikan (pretty-print, indentasi 2 spasi), font monospace, latar berbeda sedikit dari baris biasa, `white-space: pre-wrap` dengan `overflow-wrap: anywhere` dan batas tinggi dengan scroll vertikal untuk JSON yang panjang. Tidak boleh membuat halaman meluap mendatar.
- Perhatikan komponen `TabelResponsif`: pada layar sempit tampilan kartu harus tetap berfungsi (detail tampil di bawah kartu, lebar penuh). Bila baris tambahan tidak cocok dengan komponen itu, buat perubahan sekecil mungkin dan jelaskan di catatan akhir.
- Detail yang bukan JSON valid atau kosong ditampilkan apa adanya atau "-" tanpa galat.
- Data log, filter, dan pagination tidak berubah.

**Kriteria selesai:** detail log tampil selebar tabel di bawah barisnya, tombol buka/tutup bekerja, tampilan HP tetap rapi, tema terang dan gelap terbaca.

---

## Tahap 4: Ringkasan penilaian keseluruhan siswa pada post test

**Yang diinginkan:** di halaman detail post test (backoffice) tempat tutor menilai butir praktik, tambahkan di **bagian paling bawah** kolom/ kartu **"Ringkasan penilaian siswa"**: teks bebas dari tutor berisi penilaian keseluruhan siswa selama level itu. Ringkasan ini **tampil di halaman orang tua, di bawah data siswa**.

**Keputusan yang sudah diambil (ikuti):**
- Satu ringkasan per post test (otomatis per level dan per percobaan). Admin dan tutor boleh menulis dan mengubah; boleh **sebelum maupun sesudah Finalisasi**. Tidak wajib diisi untuk Finalisasi.
- Simpan di kolom baru `post_test.ringkasan_tutor` (TEXT, boleh NULL, maksimal 2000 karakter divalidasi zod) dan `post_test.ringkasan_oleh` serta `post_test.ringkasan_at` (siapa dan kapan terakhir mengubah; ikuti gaya kolom penilai di `tugas_siswa.dinilai_oleh`). Tambahkan di `schema.sql` dan `db:init` (`PEMBARUAN_KOLOM`); data lama tidak berubah.
- **Orang tua hanya melihat ringkasan dari post test yang sudah difinalisasi.** Bila siswa punya beberapa post test (tes ulang atau beberapa level), tampilkan ringkasan **terbaru per level** yang sudah punya teks, berurutan per level, masing-masing dengan nama level dan tanggal finalisasi. Bila belum ada ringkasan, bagian itu tidak tampil sama sekali (tanpa kotak kosong).
- Letak di rapor orang tua: **tepat di bawah kartu data siswa**, sebelum bagian lain. Teks ditampilkan sebagai teks biasa (tanpa HTML), baris baru dipertahankan.
- Siswa **tidak** diminta melihat ringkasan ini (hanya orang tua), kecuali pemilik meminta lain.

**Perilaku di backoffice:**
- Form dengan textarea, penghitung karakter, tombol **Simpan ringkasan**, dan keterangan "terakhir diubah oleh X pada tanggal Y". Server Action memakai `authController.wajibAkses` untuk admin dan tutor.
- Pencatatan ke log aktivitas: aksi baru `ubah_ringkasan_post_test` (tambahkan di `AKSI_LOG` dan `log.aksiLabel`), entitas `post_test`, tanpa menyalin isi teks ke detail log (cukup panjang karakter).
- Form tetap bisa dipakai setelah Finalisasi. Panel penilaian butir dan alur Finalisasi yang ada **tidak diubah**.
- Rapor orang tua: bentuk data tetap dipangkas di `raporController`/usecase; tambahkan hanya teks ringkasan, nama level, dan tanggal finalisasi.
- Hapus siswa tidak perlu langkah tambahan (kolom ada di `post_test`).

**Kriteria selesai:** tutor menyimpan ringkasan di bagian bawah detail post test; orang tua melihatnya di bawah data siswa hanya setelah post test difinalisasi; ringkasan terbaru per level yang tampil; tanpa ringkasan, bagian tidak muncul; perubahan tercatat di log.

---

## Tahap 5: Pagination 10 data pada semua halaman berdaftar

**Yang diinginkan:** semua halaman yang menampilkan daftar data di **backoffice, siswa, dan orang tua** memakai pagination dengan **10 data per halaman**.

**Perilaku:**
- Satu konstanta ukuran halaman (mis. `UKURAN_HALAMAN = 10` di `src/enums/index.js`, atau gunakan yang sudah ada bila ada) dipakai di semua tempat. Hapus angka lain yang tersebar **hanya dengan menggantinya memakai konstanta**, bukan menghapus kode. Galeri karya yang sekarang 12 per halaman ikut menjadi 10.
- Pakai komponen `Paginasi` yang sudah ada. Pagination dilakukan **di server** (`LIMIT/OFFSET` dengan `COUNT` terpisah), bukan memotong larik di browser. Nomor halaman lewat query (mengikuti nama query yang sudah dipakai halaman itu, mis. `halaman`, `sesi`, `bayar`).
- Filter dan urutan tetap terbawa saat pindah halaman; mengubah filter kembali ke halaman 1. Halaman di luar jangkauan dirapikan ke halaman terakhir yang ada (bukan galat). Tampilkan ringkasan "Menampilkan x-y dari z" bila komponen mendukung.
- **Audit dulu** semua halaman di tiga area dan tulis daftarnya di catatan akhir: yang sudah berpaginasi (dipastikan 10), yang diubah, dan yang sengaja tidak diubah beserta alasannya. Perkiraan yang perlu dicek: daftar siswa, level, template, gambar, pengguna, sesi (riwayat dan sesi berlangsung), pembayaran, post test, sertifikat, karya, log, materi, riwayat sesi/pembayaran/post test di detail siswa, serta riwayat sesi dan pembayaran di rapor orang tua.
- **Tidak dipaginasi** (bukan daftar data yang bertambah): daftar tugas dalam satu sesi dan butir soal post test (alur pengerjaan siswa), opsi jawaban, editor rubrik, tab, menu navigasi, dan daftar tetap berukuran kecil seperti 3 level. Bila ragu apakah suatu daftar termasuk, jangan diubah dan tulis sebagai keputusan untuk pemilik.
- Hasil ekspor CSV tidak terpengaruh (tetap semua baris sesuai filter).
- Jaga performa: indeks yang sudah ada dipakai; bila `EXPLAIN` menunjukkan pagination baru butuh indeks, tambahkan lewat `PEMBARUAN_INDEKS` dan catat.

**Kriteria selesai:** setiap daftar di tiga area menampilkan maksimal 10 baris/kartu per halaman dengan kontrol halaman yang bekerja, filter tetap bekerja, tampilan HP rapi; catatan akhir memuat audit daftar.

---

## Catatan akhir (wajib)

Setelah selesai, tulis ringkasan singkat di chat (bukan berkas): tahap yang dikerjakan, berkas yang diubah dan dibuat, perubahan skema, dan **keputusan untuk pemilik** (bila ada). Pastikan `README.md` memuat cara uji tiap tahap dan `.kiro/steering/project-context.md` bagian "Status pengerjaan" diperbarui.
