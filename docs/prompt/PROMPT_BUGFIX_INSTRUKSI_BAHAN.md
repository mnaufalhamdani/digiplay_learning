# Prompt Bug Fix: Instruksi Bahan, Mewarnai, dan Penilaian Praktik Post Test

> Cara menjalankan (di chat agen): `Baca docs/prompt/PROMPT_BUGFIX_INSTRUKSI_BAHAN.md lalu kerjakan semua bagian di dalamnya.`

Baca dulu `.kiro/steering/project-context.md` dan `README.md`. Kerjakan **hanya** tiga bagian di bawah. Jangan mengubah modul, dokumen, atau kode lain yang tidak berkaitan. Bagian materi pertemuan dan coding visual (Blockly) **bukan** bagian prompt ini.

## Aturan kerja (wajib)

- Ikuti pola, struktur, penamaan, dan cara DI file serupa yang sudah ada di project. Jangan mengubah pola yang sudah berjalan. Alur: `jsx -> controller -> usecase -> model (semua SQL)`.
- Utamakan perubahan sekecil mungkin. Cek dulu apakah sudah ada function/komponen yang bisa dipakai atau diperluas sebelum membuat yang baru; kalau terpaksa membuat baru, jelaskan alasannya singkat di laporan.
- Setiap function diberi komentar ringkas Bahasa Indonesia. Setiap percabangan non-trivial (if/else, switch, try-catch, loop bersyarat) diberi komentar alasan/maksud, bukan mengulang isi kode. Cek ulang sebelum selesai.
- **Jangan menghapus kode yang tidak terpakai atau yang dikomen**, baik kode lama maupun kode yang kamu tulis sendiri. Kalau sesuatu tidak jadi dipakai (misalnya menu Bahan), cukup disembunyikan atau dinonaktifkan, jangan dihapus.
- **Jangan membuat test** dalam bentuk apa pun.
- Jangan membuat `ringkasan-perubahan.md`. Dokumen yang boleh diperbarui hanya `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`.
- Kerjakan sampai tuntas; berhenti hanya bila butuh keputusan dari pemilik.
- Setelah selesai, buat **satu laporan per bagian** di `docs/reports/` (nama file ada di tiap bagian) dengan isi: **Ringkasan** (1-2 kalimat), **Masalah** (gejala dan akar penyebab), **Error** (pesan/log relevan saja), **Solusi** (apa yang diubah dan alasannya), **File diubah** (daftar path), **File baru** (daftar path, tulis "tidak ada" bila kosong). Jangan menyalin isi kode ke laporan.

---

## Bagian 1: Penilaian praktik post test tidak bisa dilakukan

Laporan: `docs/reports/penilaian-post-test-praktik.md`

**Gejala.** Di L1 Pemula P13 Post test, bagian **C (Praktik Mouse, File, dan Paint)** dan **D (Praktik Word)** bermode `dicek_tutor`. Di sisi siswa statusnya "menunggu" terus. Di backoffice tidak ada daftar butir yang perlu dicek dan tidak ada tombol untuk menilai, sehingga post test tidak bisa difinalisasi.

**Yang diinginkan.**

1. Di halaman detail post test (backoffice) tampilkan semua butir bermode `dicek_tutor` yang berstatus menunggu. Tiap butir menampilkan: bagian, instruksi, jawaban/karya siswa (berkas atau tangkapan layar bila ada), serta panel penilaian: **skor**, **catatan**, dan tombol **Simpan**. Skor dibatasi 0 sampai nilai maksimum butir (validasi di controller dengan zod).
2. Setelah **semua** butir dinilai, tutor menekan **Finalisasi**. Finalisasi memakai logika yang sudah ada: nilai per bagian dan total dihitung, lulus bila total >= 70 **dan** tiap bagian >= 50, sertifikat terbit otomatis lewat `terbitkanOtomatis` (SAVEPOINT yang sudah ada tetap dipertahankan).
3. Tombol Finalisasi nonaktif selama masih ada butir menunggu, dengan keterangan jumlah butir yang belum dinilai.
4. Akses: admin dan tutor. Gunakan mekanisme hak akses yang sudah ada.
5. Aksi penilaian dan finalisasi dicatat ke Log seperti aksi serupa di modul lain.
6. Siswa melihat status berubah dari "menunggu" menjadi dinilai setelah tutor menyimpan.

**Periksa juga (masalah yang sama):** apakah **tugas biasa** (bukan post test) bermode `dicek_tutor` punya celah serupa, yaitu tidak ada layar penilaian di backoffice. Bila ada, perbaiki dengan memakai ulang panel yang sama, bukan membuat versi kedua. Catat temuannya di laporan.

---

## Bagian 2: Instruksi bahan tidak sesuai, dan `mewarnai.png` belum dipakai

Laporan: `docs/reports/instruksi-bahan-tidak-sesuai.md`

**Gejala yang ditemukan pemilik.**

- **L1 P9 Word 2** (format huruf dan menyisipkan gambar): instruksi "unduh gambar Mobil pemadam kebakaran", tetapi file yang terunduh adalah roket. Nama di instruksi dan berkas tidak berasal dari subjek yang sama.
- **L1 P13 Post test**: instruksi "unduh stroberi dari menu Bahan", padahal menu Bahan tidak ada atau disembunyikan.
- **L1 P6 Paint 1** (menggambar bebas): tidak ada tugas yang menyuruh mengunduh `mewarnai.png`. Pemilik ingin menggambar/mewarnai sesuai contoh.

**Aturan baru (berlaku untuk semua level dan pertemuan, kecuali bila disebut lain).**

1. **Instruksi tidak menyebut nama bahan.** Tulis cukup **"Unduh bahan"**. Tombol/tautan unduh berada **langsung di dalam instruksi tugas**, bukan di menu Bahan. Siswa tidak perlu pindah halaman.
2. **Berkas yang diunduh selalu berasal dari subjek yang sama dengan soal/kunci tugas.** Pastikan nama subjek, berkas unduhan, dan kunci penilaian ditarik dari satu parameter subjek yang sama, supaya tidak mungkin lagi berbeda (akar masalah P9 kemungkinan di sini; selidiki dan tulis penyebab pastinya di laporan).
3. **Tugas menggambar atau mewarnai hanya memakai subjek dari 75 subjek gambar** yang ada di `public/aset/gambar/<kode>/` (daftar di `docs/aset/prompt-gambar.md`). Tidak boleh ada tugas dengan subjek di luar daftar itu.
4. **Contoh menggambar/mewarnai memakai `mewarnai.png`** milik subjek terpilih: `public/aset/gambar/<kode>/mewarnai.png`. Tombol "Unduh bahan" pada tugas menggambar/mewarnai mengunduh berkas itu. Bila soal bertanya soal menggambar atau mewarnai, rujukannya adalah berkas tersebut.
5. **Tugas sisip gambar** (P9 Word 2 dan sejenis, serta bagian praktik Word/Paint di post test): tulis misalnya "Sisipkan gambar dari bahan ke dokumenmu" disertai tombol **Unduh bahan** tepat di bawahnya. Berkas yang diunduh adalah gambar subjek terpilih (pakai varian `berwarna` atau `outline` sesuai tujuan tugas; pilih yang sudah dipakai pola template sekarang).
6. **Menu Bahan: dihilangkan dari tampilan** (keputusan pemilik, karena unduhan sudah ada langsung di instruksi tugas). Hilangkan dari navigasi/menu siswa, tetapi **jangan hapus kode, rute, atau tabelnya** (cukup tidak ditampilkan, mis. lewat penanda nonaktif atau dikomen sesuai pola project). Sebelum itu, pastikan tidak ada tugas atau template yang masih mengarahkan siswa ke menu Bahan; semua harus sudah memakai tombol "Unduh bahan" di instruksi.

**Langkah.**

1. Audit semua template di `seed/template-level-1.json`, `seed/template-level-2.json`, `seed/template-level-3.json` (dan tabel `template` di database): cari instruksi yang menyebut nama bahan tertentu, menyebut "menu Bahan", atau menggambar/mewarnai dengan subjek di luar 75 subjek. Cantumkan hasil audit (kode template yang diubah) di laporan.
2. Perbaiki template dan komponen render instruksi mengikuti aturan di atas. Sesuaikan juga `validasiTemplate` bila perlu agar template yang melanggar aturan ditolak.
3. Edit berkas JSON seed **dan** pastikan database sinkron. Ingat: `npm run db:seed` melakukan upsert penuh dan menimpa template di database; jalankan hanya setelah berkas JSON benar.
4. Pastikan tugas yang sudah dikerjakan siswa (data lama) tidak rusak; bila ada tugas lama yang instruksinya berubah, catat dampaknya di laporan.

---

## Bagian 3: Gambar referensi posisi jari di pelajaran mengetik

Laporan: `docs/reports/gambar-posisi-jari-mengetik.md`

Pemilik ingin gambar kecil posisi jari (home row, jari berwarna per zona) tampil di samping area latihan mengetik sebagai pengingat posisi tangan.

1. Berkas gambar: `public/aset/mengetik/posisi-jari.png`. **Gambar ini disediakan pemilik (dibuat terpisah), kamu tidak perlu membuatnya.** Bila berkas belum ada, halaman tidak boleh error: sembunyikan gambar (jangan tampilkan ikon rusak) dan tulis catatan di laporan.
2. Tampilkan di halaman latihan mengetik (siswa) sebagai gambar kecil di sisi area ketik pada layar lebar. Pada layar sempit (HP) letakkan di atas atau sebagai panel yang bisa dibuka-tutup agar tidak mendorong area ketik keluar layar. Gambar tidak boleh menghalangi atau mengganggu input.
3. Beri teks alternatif Bahasa Indonesia (misalnya "Posisi jari di atas keyboard") dan ikuti gaya desain area siswa yang sudah ada (tema terang/gelap, kontras AA).
4. Gunakan komponen gambar/pola yang sudah ada di project; jangan membuat komponen baru bila yang lama bisa diperluas.

---

## Selesai

1. Jalankan pemeriksaan manual lokal untuk tiap bagian: nilai satu butir praktik sampai finalisasi dan sertifikat; buka tugas P6, P9, P13 di L1 dan pastikan tombol "Unduh bahan" mengunduh berkas yang sesuai; buka latihan mengetik dengan dan tanpa berkas `posisi-jari.png`.
2. Perbarui `README.md` (cara uji tiap bagian) dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`. Jangan ubah bagian lain di kedua berkas itu.
3. Tulis tiga laporan di `docs/reports/` sesuai format di atas.
