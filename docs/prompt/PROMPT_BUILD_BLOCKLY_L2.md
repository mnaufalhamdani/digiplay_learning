# Prompt Build: Studio Zippy (Blockly buatan sendiri) untuk Level 2

> Cara menjalankan (di chat agen): `Baca docs/prompt/PROMPT_BUILD_BLOCKLY_L2.md lalu kerjakan Tahap 1 sampai 5.`

Baca dulu `.kiro/steering/project-context.md`, `README.md`, dan hasil kerja fitur **Coding Zippy Level 1** (modul Blockly labirin: registri blok, komponen Blockly, tema, `blok_tersedia`). Fitur ini **memperluas** yang sudah ada, bukan membangun ulang. Jangan mengubah modul lain di luar yang disebut eksplisit.

## Latar belakang dan keputusan pemilik

Pertemuan L2 P09 sampai P11 dan bagian D post test L2 ("Praktik Scratch") tidak lagi memakai Scratch asli. Gantinya adalah **Studio Zippy**: panggung bebas buatan sendiri dengan sprite dan blok kode, tanpa akun dan tanpa pihak ketiga. Keputusan yang sudah diambil:

1. **Tugas bebas dinilai tutor** (`dicek_tutor`), bukan otomatis. Siswa menyimpan proyek, mengirimkannya ke tugas, lalu tutor membuka proyek itu di backoffice, menekan Jalankan, dan menilai. Ini memakai ulang panel penilaian tutor yang dibangun di `PROMPT_BUGFIX_INSTRUKSI_BAHAN.md` bagian 1.
2. **Tidak ada berkas gambar atau suara baru.** Sprite dan kostum memakai gambar subjek yang sudah ada (75 subjek, berkas `berwarna` dan `outline`) dan Zippy dari `public/aset/maskot/`. Latar dibuat sebagai SVG di kode. Suara disintesis dengan Web Audio API (nada sederhana bertema hewan, musik, dan alam). Pemilik boleh mengganti dengan berkas suara sungguhan nanti, jadi buat pustaka suara terpusat di satu tempat.
3. Fitur disiapkan agar **Level 3 tinggal menambah blok** (kostum unggahan dari Paint, `tunggu`, adegan, nyawa, level) tanpa membangun ulang. **Hanya blok Level 2 yang dikerjakan sekarang.**

## Aturan kerja (wajib)

- Ikuti pola, struktur, penamaan, dan cara DI file serupa di project (alur `jsx -> controller -> usecase -> model`, satu folder per modul di `src/modules/<modul>/`, awilix, zod). Baca dulu bagaimana Coding Zippy L1, panel penilaian tutor, dan tugas bermode `dicek_tutor` (Word/PowerPoint) bekerja, lalu tiru polanya.
- Cek dulu komponen/function yang bisa dipakai atau diperluas sebelum membuat yang baru. Bila membuat baru, jelaskan alasannya singkat di catatan akhir.
- Setiap function diberi komentar ringkas Bahasa Indonesia. Cabang non-trivial diberi komentar alasan/maksud, bukan mengulang kode. Cek ulang sebelum selesai.
- **Jangan menghapus kode yang tidak terpakai atau dikomen.** Tipe tugas `scratch` tetap ada (dipakai L3 sementara).
- **Jangan membuat test.**
- Jangan membuat `ringkasan-perubahan.md`. Dokumen yang boleh diperbarui hanya `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`.
- Tanpa `eval`, tanpa `new Function`, dan tanpa menjalankan kode hasil generator Blockly. Program ditafsirkan oleh penerjemah kita sendiri.
- Kerjakan sampai tuntas; berhenti hanya bila butuh keputusan dari pemilik.
- Desain mengikuti `docs/design-system.md`: area siswa playful, terang/gelap lolos kontras AA, ikon Phosphor lewat `Ikon`, `ConfirmDialog` untuk konfirmasi.
- SQL kompatibel MySQL 8 dan MariaDB 11. ID `BIGINT UNSIGNED` dibuat aplikasi (`idGen`), selalu string di JavaScript. Kolom JSON dibaca lewat helper pengurai JSON yang sudah ada.

## Tahap 1: Pustaka sprite, latar, suara, dan tabel proyek

1. **Pustaka sprite:** semua subjek di `public/aset/gambar/<kode>/` plus Zippy. Tiap sprite punya dua kostum: `berwarna.png` (kostum 1) dan `outline.png` (kostum 2), sehingga blok "kostum berikutnya" selalu punya hasil. Zippy memakai dua berkas maskot yang sudah ada. Baca daftar subjek dari tabel gambar/subjek di database (jangan menulis ulang daftarnya di kode).
2. **Pustaka latar (SVG di kode, terpusat):** `polos`, `taman`, `pantai`, `luar angkasa`, `kota`, dan `labirin` (berisi data dinding sebagai daftar persegi panjang untuk deteksi sentuhan, dengan satu petak tujuan). Nama ini dipakai tugas dan harus persis: `taman`, `pantai`, `luar angkasa`, `kota`.
3. **Pustaka suara (terpusat, Web Audio):** tiga tema (`hewan`, `musik`, `alam`), masing-masing 3 suara pendek yang disintesis dengan osilator/noise. Dimainkan hanya setelah ada interaksi pengguna (kebijakan autoplay browser), dan mematuhi tombol bisukan di studio.
4. **Schema** (`schema.sql`, `db:init` mengikuti): tabel `proyek_coding`: id, `siswa_id`, `nama`, `tingkat` (default `l2`), `isi` (JSON, lihat Tahap 2), `dibuat_pada`, `diubah_pada`. UNIQUE (`siswa_id`, `nama`). Batas ukuran `isi` (mis. 256 KB). FK siswa mengikuti pola tabel siswa lain, dan **perhatikan urutan transaksi khusus hapus siswa** (komentar kepala `schema.sql`): proyek milik siswa harus ikut terhapus tanpa melanggar RESTRICT.
5. **Modul** `src/modules/studio/` (nama mengikuti pola modul yang ada): `model` (semua SQL), `usecase`, `controller` (menerima `(input, sesi)`, hak akses lewat `authController.wajibAkses`, validasi zod). Daftarkan di awilix.

## Tahap 2: Format proyek dan penerjemah

1. **Format proyek (JSON buatan kita):**
   ```json
   {
     "versi": 1,
     "latar": "taman",
     "variabel": { "skor": 0 },
     "sprite": [
       { "id": "s1", "subjek": "<kode subjek atau zippy>", "x": 0, "y": -120, "arah": 90,
         "kostum": 0, "tampil": true,
         "skrip": [ { "kejadian": "bendera", "isi": [ { "blok": "gerak", "langkah": 10 } ] } ] }
     ]
   }
   ```
   Koordinat panggung seperti Scratch: lebar 480, tinggi 360, pusat (0,0), x -240 sampai 240, y -180 sampai 180. Arah 90 = ke kanan, derajat searah jarum jam. Validasi dengan zod: tipe blok dikenal, batas jumlah sprite (mis. 10), jumlah skrip dan blok, kedalaman bersarang (maks 5), dan angka dibatasi rentang wajar. Tipe tak dikenal ditolak dengan pesan jelas.
2. **Blok Level 2** (nama Indonesia ramah anak, kategori dan warnanya **wajib** seperti di bawah karena dipakai soal):

   | Kategori | Warna | Blok |
   |---|---|---|
   | Kejadian | kuning | Ketika bendera hijau diklik; Ketika tombol [spasi/panah kanan/panah kiri/panah atas/panah bawah] ditekan |
   | Gerakan | biru | Gerak [n] langkah; Putar kanan [n] derajat; Putar kiri [n] derajat; Pantul jika menyentuh tepi; Ke posisi x [ ] y [ ]; Atur x ke; Atur y ke; Ubah x sebesar; Ubah y sebesar |
   | Tampilan | ungu | Katakan [teks]; Kostum berikutnya; Ganti latar ke [tema]; Tampilkan; Sembunyikan |
   | Suara | merah muda | Mainkan suara [tema dan nomor] |
   | Kontrol | oranye | Ulangi [n] kali; Selamanya; Jika ... maka; Tunggu [n] detik; Hentikan semua |
   | Sensor | biru muda | Menyentuh [tepi/dinding/sprite lain]? |
   | Operator | hijau | Angka acak dari [a] sampai [b]; [a] [lebih besar atau sama dengan / sama dengan / lebih kecil] [b] |
   | Variabel | merah | skor (nilai); Atur skor ke [n]; Ubah skor sebesar [n]; Tampilkan skor di panggung |

   Daftarkan blok di **registri blok yang sudah dibuat untuk L1** (definisi tampilan + cara penerjemah menjalankan), supaya L3 nanti cukup menambah entri. Kolom `blok_tersedia` dan pola toolbox L1 dipakai ulang; sediakan konfigurasi toolbox untuk "studio l2".
3. **Penerjemah waktu-nyata (murni dan tanpa eval):** jalankan tiap skrip sebagai coroutine (generator) pada loop bingkai sekitar 30 kali per detik, sehingga `selamanya`, `ulangi`, dan `tunggu` berjalan bersamaan antar sprite tanpa membekukan halaman. Satu bingkai hanya menjalankan blok sampai batas anggaran langkah (mis. 200 per bingkai) agar program ganas tidak membuat tab menggantung. Tombol **Berhenti** menghentikan semuanya. Letakkan logika simulasi di `shared/` sesuai pola project (seperti L1), terpisah dari komponen tampilan.
4. **Aturan perilaku:** `menyentuh tepi` benar bila kotak pembatas sprite menyentuh batas panggung; `pantul jika menyentuh tepi` membalik arah seperti Scratch; `menyentuh dinding` memakai daftar persegi panjang latar `labirin`; `menyentuh sprite lain` memakai kotak pembatas kedua sprite. `Hentikan semua` menghentikan seluruh skrip. `Tampilkan skor di panggung` menampilkan nilai variabel skor di pojok panggung. `Ganti latar ke` hanya menerima nama latar dari pustaka.
5. **Satu panduan tambah blok** (satu paragraf pendek di README): cara menambah blok baru lewat registri, tanpa mengubah komponen halaman.

## Tahap 3: Halaman siswa "Studio Zippy"

1. **Menu siswa "Studio Zippy"** (ikon Phosphor lewat `Ikon`), sejajar dengan Coding Zippy dan Latihan lain. Ikuti aturan akses menu itu (siswa yang sedang login/sesi sesuai pola yang ada).
2. **Tata letak** (nyaman di HP/tablet dan PC):
   - Panggung (480:360, skala menyesuaikan layar) dengan tombol **Bendera hijau**, **Berhenti**, dan bisukan suara.
   - **Daftar sprite** di bawah panggung: tambah sprite dari pustaka (dialog pilih dengan gambar), pilih sprite aktif, hapus sprite (`ConfirmDialog`), dan pilih kostum. Pilih latar dari pustaka.
   - **Area Blockly** untuk sprite yang dipilih (satu ruang kerja per sprite; berpindah sprite memuat skripnya). Toolbox mengikuti kategori dan warna di Tahap 2. Pada layar sempit: panggung di atas, area Blockly di bawah.
   - Papan sprite bisa diseret di panggung untuk mengatur posisi awal.
3. **Proyek:** tombol **Proyek baru**, **Simpan** (meminta nama bila belum ada; nama ini yang diminta tugas "simpan dengan nama ..."), dan **Buka** (daftar proyek milik siswa). Simpan otomatis sesekali tidak diharuskan; cukup tombol Simpan dan peringatan bila hendak pergi dengan perubahan belum tersimpan.
4. **Menyimpan hanya saat sesi berlangsung** mengikuti aturan yang sama dengan tipe latihan lain. Di luar sesi siswa boleh bereksperimen tetapi tidak menyimpan (tampilkan keterangan singkat). Tiru perilaku Coding Zippy L1.
5. Tema Blockly mengikuti terang/gelap dan kontras AA. Hormati `prefers-reduced-motion` untuk animasi sampingan (bukan untuk gerak sprite hasil program).
6. Mode orang tua: tidak ada perubahan.

## Tahap 4: Pengiriman tugas dan penilaian tutor

1. Daftarkan **tipe tugas `coding_proyek`**: bermode `dicek_tutor`, sama polanya dengan tugas Word/PowerPoint. Perbarui `validasiTemplate`, daftar tipe, tampilan tugas, dan bagian `format` di README. Tipe `scratch` **tidak dihapus**.
2. Pada tugas bertipe `coding_proyek`, siswa melihat tombol **"Buka Studio Zippy"** langsung di instruksi (tanpa lewat menu) dan tombol **"Kirim proyek"** yang membuka pilihan proyek tersimpan (atau menyimpan proyek yang sedang dibuka). Proyek yang dikirim dikaitkan ke tugas siswa itu dengan cara yang sama seperti karya tugas dicek_tutor lainnya (baca dulu cara berkas/jawaban Word dikaitkan; jangan membuat mekanisme paralel). Proyek yang dikirim **dibekukan sebagai salinan** (snapshot) supaya perubahan setelahnya tidak mengubah apa yang dinilai; siswa boleh mengirim ulang sebelum dinilai.
3. **Sisi tutor:** pada panel penilaian tugas dicek_tutor dan butir post test (komponen dari bugfix bagian 1), tampilkan karya bertipe `coding_proyek` dengan **pratinjau panggung tanpa editor** (hanya baca) dan tombol **Jalankan**/**Berhenti**, plus tombol "Lihat susunan blok" (ruang kerja Blockly mode baca). Penilaian (skor, catatan, Simpan, Finalisasi) memakai panel yang sudah ada; rubrik butir post test tampil seperti biasa. Jangan membuat panel penilaian kedua.
4. Bagian D post test L2 dinilai melalui jalur yang sama. Pada pertemuan 13, siswa membuka Studio Zippy dari butir D dan mengirim proyeknya ke butir itu, mengikuti aturan "hanya sekali dikerjakan" dan sisa waktu yang sudah ada. Pastikan tidak mengubah perilaku bagian lain.
5. Hapus-siswa: proyek dan snapshot ikut dihapus.

## Tahap 5: Ganti isi template Level 2

Edit `seed/template-level-2.json` (kode sama, edit baris yang sudah ada; jangan menambah kode baru). Untuk semua template berikut: ubah `tipe` `scratch` menjadi `coding_proyek` (penilaian tetap `dicek_tutor`), dan pertahankan field lain (kunci, rubrik, kesulitan, dan sebagainya). Hanya L2 yang diubah; **L3 tidak disentuh**.

**Pilihan ganda (hanya teks dan opsi yang berubah; `kunci.benar` ditulis sebagai indeks mulai 0 sesuai urutan opsi di bawah):**

| Kode | Teks | Opsi | benar |
|---|---|---|---|
| L2-P09-PG-01 | Tokoh yang bisa digerakkan di Studio Zippy disebut ... | Folder; Sprite; Sel; Slide | 1 |
| L2-P09-PG-02 | Latar tempat sprite bergerak di Studio Zippy disebut ... | Paragraf; Tabel; Menu; Panggung | 3 |
| L2-P09-PG-03 | Blok kode berwarna biru yang menggerakkan sprite berada di kategori ... | Operator; Tampilan; Suara; Gerakan | 3 |
| L2-P09-PG-04 | Blok kode yang dipakai untuk memulai program saat bendera hijau diklik adalah ... | Gerak 10 langkah; Ketika bendera hijau diklik; Katakan Halo; Mainkan suara | 1 |
| L2-P10-PG-01 | Blok “ulangi” dipakai untuk ... | (tetap seperti sekarang) | (tetap) |
| L2-P10-PG-02 | Blok “selamanya” berarti ... | (tetap seperti sekarang) | (tetap) |
| L2-P10-PG-03 | Blok “jika ... maka” dipakai untuk ... | (tetap seperti sekarang) | (tetap) |
| L2-P10-PG-04 | Contoh syarat yang cocok dipakai pada blok “jika” adalah ... | Tampilkan; Mainkan suara; Menyentuh tepi?; Gerak 10 langkah | 2 |
| L2-P11-PG-02 | Blok “menyentuh ... ?” dipakai untuk ... | (opsi tetap) | (tetap) |
| L2-P13-E-08 | Blok “ketika bendera hijau diklik” berada di kategori ... | Suara; Gerakan; Operator; Kejadian | 3 |
| L2-P13-E-09 | Agar sprite terus bergerak tanpa henti, kita memakai blok ... | sembunyikan; selamanya; hentikan semua; tunggu | 1 |
| L2-P13-E-10 | Sprite harus berkata “Aduh!” hanya jika menyentuh dinding. Blok yang tepat adalah ... | jika ... maka; ulangi; selamanya; ke posisi x y | 0 |

Pada baris bertanda "(tetap)", hanya ganti nama blok berbahasa Inggris di teks dengan nama Indonesia di atas; opsi dan kunci tidak berubah. Pastikan **tidak ada lagi** kata "Scratch", "repeat", "forever", "if ... then", "when green flag clicked", "touching", atau "stage" di template L2 setelah perubahan (kecuali di riwayat/laporan lama).

**Tugas praktik (`PR` dan bagian `D`):**
- P09-PR-01 sampai PR-04, P10-PR-01 sampai PR-04, P11-PR-01 sampai PR-04, dan P13-D-01 sampai D-05: teks tugas tetap sama kecuali penyebutan nama blok atau aplikasi (mis. "blok repeat" menjadi "blok ulangi", "tanpa menyentuh dinding berwarna" menjadi "tanpa menyentuh dinding").
- Parameter `nama_file` yang berisi kata "Scratch" (mis. "Ujian Scratch") diganti menjadi "Ujian Coding"; "Proyek Kostum" tetap.
- Parameter `sprite`, `pemain`, `objek`, dan `tujuan` **harus berasal dari subjek yang benar-benar ada** di 75 subjek (atau Zippy), karena sprite hanya ada dari pustaka itu. Periksa tiap nilai di template (kucing, anjing, ikan, kupu-kupu, burung, keranjang, piring, mangkuk, apel, bintang, bola, koin, bendera, pintu, harta karun). Nilai yang tidak ada di pustaka **diganti** dengan subjek yang ada dan masuk akal untuk perannya (objek yang jatuh: benda kecil/buah; pemain: benda yang cocok menampung atau Zippy). Daftar subjek ada di `docs/aset/prompt-gambar.md`. Untuk `tujuan` pada labirin, ganti jadi nama yang sesuai dengan petak tujuan di latar `labirin` (mis. bintang), bukan nama yang tidak punya sprite. Catat tiap penggantian di catatan akhir.
- Parameter `tema` (latar: taman, pantai, luar angkasa, kota) dan `tema_suara` (hewan, musik, alam) harus cocok persis dengan pustaka latar dan suara di Tahap 1.
- Bagian post test D: ubah nama bagian "Praktik Scratch" menjadi **"Praktik Coding"** di `bagian_post_test` pada `seed/template-level-2.json`, dan cari serta ubah semua kode/teks/komentar yang menampilkannya (jangan menghapus apa pun yang lain; periksa halaman hasil post test, rapor, dan sertifikat yang mungkin memakai nama bagian).

## Selesai

1. Pemeriksaan manual lokal: siswa dalam sesi membuat proyek untuk setiap tugas P09 sampai P11 (gerak, suara, ganti latar, putar, ulangi, selamanya dan pantul, tombol ditekan, ganti kostum, game tangkap dengan skor, labirin, pesan menang), menyimpan dengan nama, dan mengirim ke tugas; tutor membuka tiap proyek, menjalankannya, melihat susunan blok, dan menilai lewat panel; mengirim ulang proyek; proyek dengan `selamanya` tidak membekukan tab dan bisa dihentikan; paksa kirim JSON proyek tidak valid atau terlalu besar (ditolak); buka proyek di luar sesi (bisa bereksperimen tanpa menyimpan); post test L2 bagian D lewat Studio Zippy sampai finalisasi dan sertifikat; tampilan HP dan mode gelap; hapus siswa uji (proyek ikut terhapus tanpa galat); `db:seed` dengan seed template yang baru tanpa galat validasi.
2. Perbarui `README.md` (cara uji, format proyek, cara menambah blok, catatan seed) dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`. Jangan ubah bagian lain di kedua berkas itu.
3. Karena ini fitur baru (bukan bug fix), tidak perlu laporan di `docs/reports/`. Tulis di akhir balasan: daftar penggantian parameter template (Tahap 5), dan keputusan yang perlu dari pemilik.
