# Prompt Build: Studio Zippy Level 3 (blok lanjutan, sprite teks, kostum unggahan)

> Cara menjalankan (di chat agen): `Baca docs/prompt/PROMPT_BUILD_BLOCKLY_L3.md lalu kerjakan Tahap 1 sampai 4.`

Baca dulu `.kiro/steering/project-context.md`, `README.md` (bagian **Fitur Studio Zippy** dan "Menambah blok baru"), dan hasil kerja Studio Zippy Level 2: `src/modules/studio/`, `src/modules/shared/blockly/` (`pustakaStudio.js`, `daftarBlokStudio.js`, `mesinStudio.js`), serta teks `studio.*` di `src/locales/id_ID.json`. Fitur ini **memperluas Studio Zippy L2**: tambah blok dan kemampuan, bukan membangun ulang. Jangan mengubah modul lain di luar yang disebut eksplisit.

## Latar belakang dan keputusan pemilik

Pertemuan L3 P06 sampai P10 dan P12, serta bagian C dan D post test L3, masih memakai tipe tugas `scratch`. Gantinya adalah Studio Zippy tingkat 3. Keputusan yang sudah diambil:

1. **Tugas bebas dinilai tutor** (`coding_proyek`, `dicek_tutor`), sama seperti L2. Tidak ada penilaian otomatis.
2. **Kostum gambar sendiri digambar di Paint lalu diunggah** sebagai kostum sprite di Studio. **Tidak ada editor gambar di dalam Studio.**
3. Tidak ada berkas gambar atau suara bawaan baru. Musik latar disintesis dengan Web Audio (lihat Tahap 1).
4. **Proyek dan perilaku L1 dan L2 tidak boleh berubah.** Proyek L2 yang sudah tersimpan harus tetap bisa dibuka dan dijalankan dengan hasil yang sama. Semua yang ditambah di sini bersifat tambahan.

## Aturan kerja (wajib)

- Ikuti pola, struktur, penamaan, dan cara DI file serupa di project (alur `jsx -> controller -> usecase -> model`, satu folder per modul di `src/modules/<modul>/`, awilix, zod). Tiru cara L2 menambah blok: satu entri di `DAFTAR_BLOK_STUDIO`, teks di `studio.blok.<nama>` dan `studio.tip.<nama>` pada `src/locales/id_ID.json`, dan nama di `KONFIGURASI_TOOLBOX` (kolom `tingkat` proyek memilih konfigurasi; tambahkan konfigurasi `l3`).
- Cek dulu komponen/function yang bisa dipakai atau diperluas sebelum membuat yang baru. Bila membuat baru, jelaskan alasannya singkat di catatan akhir.
- Setiap function diberi komentar ringkas Bahasa Indonesia. Cabang non-trivial diberi komentar alasan/maksud, bukan mengulang kode. Cek ulang sebelum selesai.
- **Jangan menghapus kode yang tidak terpakai atau dikomen.** Tipe tugas `scratch` tetap terdaftar (jangan dihapus), meski tidak ada lagi template yang memakainya setelah prompt ini.
- **Jangan membuat test.**
- Jangan membuat `ringkasan-perubahan.md`. Dokumen yang boleh diperbarui hanya `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`.
- Tanpa `eval`, tanpa `new Function`. Penerjemah tetap `mesinStudio.js` buatan sendiri.
- Kerjakan sampai tuntas; berhenti hanya bila butuh keputusan dari pemilik.
- Desain mengikuti `docs/design-system.md`: area siswa playful, terang/gelap lolos kontras AA, ikon Phosphor lewat `Ikon`, `ConfirmDialog` untuk konfirmasi.
- SQL kompatibel MySQL 8 dan MariaDB 11. ID `BIGINT UNSIGNED` dibuat aplikasi (`idGen`), selalu string di JavaScript.

## Tahap 1: Kemampuan baru di pustaka dan proyek

1. **Sprite teks.** Satu jenis sprite baru yang menampilkan tulisan di panggung, untuk judul, tombol Mulai, petunjuk cara bermain, nama pembuat, dan layar "Game Over". Properti: `teks` (maks 40 karakter), `ukuran` (pilihan: kecil, sedang, besar, sangat besar), `warna` (pilihan 8 warna yang lolos kontras di semua latar; tulisan diberi garis tepi tipis agar terbaca di latar apa pun). Sprite teks mendukung blok Tampilkan, Sembunyikan, Ke posisi, Atur/Ubah x dan y, dan menerima kejadian "diklik" seperti sprite biasa. Ia **tidak** punya kostum dan tidak ikut deteksi sentuhan kecuali kotak pembatasnya.
2. **Kostum unggahan dari Paint.** Pada sprite gambar (bukan sprite teks), siswa bisa **Unggah kostum**: memilih berkas gambar (PNG atau JPEG) dari komputer, yang ditambahkan **setelah** dua kostum bawaan. Aturan:
   - Di sisi klien, gambar diperkecil (sisi terpanjang maks 256 piksel) dan diubah menjadi PNG sebelum dikirim, agar kecil.
   - Simpan lewat **mekanisme unggah galeri karya yang sudah ada** (route HTTP, tipe berkas dari byte awal, pemeriksaan kepemilikan di usecase, akses `login`). Jangan membuat jalur unggah kedua. Batas ukuran per berkas (mis. 200 KB) dan maks 6 kostum unggahan per sprite.
   - Proyek hanya menyimpan **rujukan** ke berkas (id), tidak menyimpan isi gambar di JSON proyek.
   - Siswa hanya boleh mengunggah saat **sesi berlangsung**, sama seperti menyimpan proyek.
   - Siswa bisa menghapus kostum unggahan miliknya, **kecuali** yang sudah dirujuk oleh sebuah kiriman tugas (`proyek_kiriman`): tolak dengan pesan ramah, supaya kiriman beku tetap utuh untuk tutor. Berkas ikut terhapus saat siswa dihapus (cek urutan transaksi hapus siswa di komentar kepala `schema.sql`).
   - Penerjemah dan pratinjau tutor memuat gambar dari rujukan itu, sehingga kiriman beku menampilkan kostum yang sama.
3. **Musik latar (disintesis).** Tiga suasana: `ceria`, `tenang`, `penuh petualangan`. Tiap suasana adalah pola melodi pendek yang berulang, dibuat dengan Web Audio di **pustaka suara yang sama** (`pustakaSuara.js`), dengan satu tempat untuk mengganti ke berkas suara sungguhan kelak. Hanya satu musik latar berbunyi pada satu waktu. Mulai setelah interaksi pengguna (aturan autoplay) dan ikuti tombol bisukan. **Berhenti** pada tombol Berhenti dan pada blok Hentikan semua.
4. **Variabel buatan sendiri.** Format proyek sudah punya `variabel` (objek nama ke nilai, L2 hanya `skor`). Perluas: siswa boleh menambah variabel (tombol **Buat variabel** di kategori Variabel), nama 1 sampai 15 karakter (huruf, angka, spasi; unik tanpa membedakan huruf besar kecil), maksimal 8 variabel, nilai berupa angka atau teks. `skor` tetap selalu ada dan blok skor L2 tetap berfungsi persis seperti sebelumnya. Variabel bersifat global untuk seluruh sprite dalam satu proyek. Tampilan monitor variabel di panggung per variabel (dipicu blok Tampilkan variabel).
5. **Kolom `tingkat`** pada `proyek_coding` yang sudah ada diisi `l3` untuk proyek tingkat 3. Format proyek tetap `versi: 1` dan **tetap kompatibel mundur**: proyek lama (tanpa fitur baru) harus lolos validasi zod yang diperluas. Tambahkan jenis sprite (`gambar` atau `teks`), daftar rujukan kostum unggahan per sprite, dan variabel tambahan ke zod dengan batas yang wajar. Tipe blok asing, kunci asing, dan ukuran berlebih tetap ditolak seperti L2.

## Tahap 2: Blok Level 3 dan mesin

Semua blok L2 tetap ada. Tambahkan blok berikut. **Nama Indonesia dan kategori/warnanya wajib persis** karena dipakai soal dan materi (warna kategori sama dengan L2).

| Kategori | Blok baru |
|---|---|
| Kejadian | Ketika sprite ini diklik; Kirim pesan [nama pesan]; Ketika menerima pesan [nama pesan] |
| Tampilan | Katakan [teks] selama [n] detik |
| Suara | Mainkan musik latar [ceria / tenang / penuh petualangan]; Hentikan musik |
| Kontrol | Jika ... maka ... jika tidak ...; Tunggu sampai [kondisi] |
| Sensor | Menyentuh sprite [pilih sprite di proyek] ?; Tanya [teks] dan tunggu jawaban; jawaban |
| Operator | [a] [tambah / kurang / kali / bagi] [b]; Gabung [a] dan [b]; [kondisi] dan [kondisi]; [kondisi] atau [kondisi]; bukan [kondisi]; tambahan pilihan pada blok perbandingan L2: lebih besar dari, lebih kecil atau sama dengan |
| Variabel | [variabel] (nilai); Atur [variabel] ke [n]; Ubah [variabel] sebesar [n]; Tampilkan variabel [variabel] di panggung; Sembunyikan variabel [variabel] |

Aturan perilaku:

1. **Pesan:** `Kirim pesan` memicu semua skrip `Ketika menerima pesan` dengan nama yang sama (di semua sprite) pada bingkai berikutnya. Nama pesan 1 sampai 20 karakter, tidak membedakan huruf besar kecil. Ini dipakai untuk layar awal (tombol Mulai) dan perpindahan antar bagian game.
2. **Tanya dan jawab:** `Tanya` menampilkan kotak isian di bawah panggung (dengan tombol Kirim dan Enter) dan menjeda skrip pemanggil sampai siswa menjawab; skrip lain tetap berjalan. Blok `jawaban` mengembalikan jawaban terakhir (teks). Perbandingan dan operator hitung menerjemahkan teks yang berupa angka menjadi angka. Untuk game tebak angka.
3. **Menyentuh sprite tertentu:** memakai kotak pembatas sprite itu. Bila sprite yang dipilih dihapus dari proyek, blok dianggap salah (false), dan tidak menimbulkan galat.
4. **Jika ... maka ... jika tidak:** perluas blok `jika` yang ada atau tambahkan entri baru, asalkan proyek L2 lama tetap dimuat dan berjalan sama.
5. **Operator hitung dan logika:** `bagi` dengan pembagi 0 menghasilkan 0 (jangan melempar galat). Hasil angka dibatasi rentang wajar. `Gabung` mengubah angka menjadi teks. Semua kolom angka pada blok L2 dan L3 harus bisa diisi blok pelapor (mis. `Gerak [variabel kecepatan] langkah`, `Angka acak`, penjumlahan).
6. **Musik latar:** `Mainkan musik latar` mengganti musik yang sedang berbunyi; `Hentikan musik` mematikan.
7. **Variabel:** `Atur`, `Ubah`, dan nilai variabel bekerja untuk variabel yang ada. `Ubah ... sebesar` pada nilai teks diperlakukan sebagai 0 + angka. Blok variabel yang merujuk variabel yang sudah dihapus dianggap 0 dan tidak membuat galat.
8. **Batas aman tetap berlaku:** anggaran langkah per bingkai, kedalaman bersarang, dan jumlah skrip/blok. Skrip yang menunggu (`Tanya`, `Tunggu sampai`) tidak menghabiskan anggaran.
9. Ruang kerja Blockly: variabel dan pesan tampil sebagai pilihan dropdown dari data proyek, bukan teks bebas, kecuali nama pesan (ketik atau pilih dari yang sudah dipakai).

## Tahap 3: Tampilan Studio untuk Level 3

1. Studio membaca `tingkat` proyek untuk memilih toolbox: `l2` seperti sekarang, `l3` berisi blok L2 ditambah blok baru. Proyek baru dibuat dari tugas L3 atau post test L3 memakai `l3`. Pada Proyek baru dari menu, tawarkan pilihan tingkat hanya bila siswa sudah berada di level yang membukanya (ikuti aturan akses menu yang ada; jangan membuka L3 untuk siswa L1/L2).
2. Tombol baru di daftar sprite: **Tambah sprite teks** (dialog isi teks, ukuran, warna) dan pada sprite gambar **Unggah kostum** (daftar kostum dengan gambar kecil, pilih kostum aktif, hapus kostum unggahan dengan `ConfirmDialog`).
3. Tombol **Buat variabel** di kategori Variabel, dan kotak isian **Tanya** di bawah panggung bila skrip sedang bertanya.
4. Semua teks antarmuka baru lewat `src/locales/id_ID.json` (`studio.*`), ramah anak. Nyaman di HP dan PC, terang dan gelap, kontras AA. Perubahan belum tersimpan tetap ditahan dengan peringatan seperti sekarang.
5. Pratinjau tutor (read-only) dan "Lihat susunan blok" harus bekerja untuk proyek tingkat 3, termasuk sprite teks, kostum unggahan, pertanyaan `Tanya` (tutor boleh menjawab di pratinjau), dan musik latar.
6. Pengiriman ke tugas dan butir post test L3 memakai jalur yang sama dengan L2 (`coding_proyek`, salinan beku di `proyek_kiriman`). Salinan beku harus ikut mengunci rujukan kostum unggahan (Tahap 1 butir 2). Aturan "hanya sekali dikerjakan" dan sisa waktu post test tidak berubah.

## Tahap 4: Ganti isi template Level 3

Edit `seed/template-level-3.json` (kode sama, edit baris yang sudah ada; jangan menambah kode baru). Ubah `tipe` **`scratch` menjadi `coding_proyek`** pada semua template berikut (penilaian tetap `dicek_tutor`) dan pertahankan field lain (kunci, rubrik, kesulitan):

- L3-P06-PR-01 sampai PR-04; L3-P07-PR-01 dan PR-03; L3-P08-PR-01 sampai PR-04; L3-P09-PR-01 sampai PR-04; L3-P10-PR-01 sampai PR-04; L3-P12-PR-01 dan PR-02; L3-P13-C-04 sampai C-06; L3-P13-D-01 sampai D-04.
- Template bertipe `lainnya`, `excel`, dan `coding` (HTML) **tidak diubah tipenya**.

**Pilihan ganda (teks dan opsi; `kunci.benar` ditulis sebagai indeks mulai 0 sesuai urutan opsi di bawah):**

| Kode | Teks | Opsi | benar |
|---|---|---|---|
| L3-P06-PG-03 | Blok “Kostum berikutnya” berada di kategori ... | Gerakan; Kontrol; Tampilan; Suara | 2 |
| L3-P06-PG-04 | Blok “Kostum berikutnya” dipakai untuk ... | (opsi dan kunci tetap) | (tetap) |
| L3-P07-PG-03 | Blok yang membuat sprite berbicara selama beberapa detik adalah ... | Sembunyikan; Katakan ... selama ... detik; Gerak ... langkah; Kostum berikutnya | 1 |
| L3-P07-PG-04 | Agar animasi berganti adegan, kita dapat memakai blok ... | Ganti latar ke; Tampilkan; Putar kanan; Mainkan suara | 0 |
| L3-P08-PG-01 | Tempat menyimpan nilai yang dapat berubah dalam program disebut ... | Latar; Sprite; Kostum; Variabel | 3 |
| L3-P08-PG-02 | Blok “Angka acak dari 1 sampai 10” menghasilkan ... | (opsi dan kunci tetap) | (tetap) |
| L3-P08-PG-03 | Blok “Jika ... maka ... jika tidak” dipakai untuk ... | (opsi dan kunci tetap) | (tetap) |
| L3-P09-PG-04 | Blok “Ubah skor sebesar 1” dipakai untuk ... | (opsi dan kunci tetap) | (tetap) |
| L3-P10-PG-04 | Blok “Kirim pesan” berguna untuk ... | (opsi dan kunci tetap) | (tetap) |

Pada baris "(tetap)", hanya teks pertanyaan yang diganti dari nama blok Inggris ke Indonesia; opsi dan kunci jangan diubah.

**Tugas praktik (`PR` dan bagian `C`, `D` yang berubah tipe):**
- Ganti nama blok dan aplikasi berbahasa Inggris pada teks tugas ke nama Indonesia di Tahap 2 (mis. "blok next costume" menjadi "blok Kostum berikutnya", "blok wait {detik} detik" menjadi "blok Tunggu {detik} detik"). Hapus sebutan "Scratch" dan "editor kostum Scratch".
- **L3-P06-PR-03:** teks menjadi: "Unduh bahan sebagai contoh, lalu gambar sendiri {jumlah} kostum sederhana untuk subjek itu di Paint, unggah sebagai kostum sprite di Studio Zippy, dan susun menjadi animasi." Parameter lain tidak berubah.
- **L3-P06-PR-01 dan L3-P13-C-04:** sprite bawaan hanya punya 2 kostum, jadi ubah parameter `jumlah` pada kedua template ini menjadi tepat 2 (mis. `{"min": 2, "max": 2}` mengikuti bentuk parameter yang sudah ada).
- Parameter `sprite`, `objek`, `pemain`, `rintangan` **harus berasal dari subjek yang benar-benar ada** di 75 subjek (atau Zippy), karena sprite hanya ada dari pustaka itu. Periksa tiap nilai di template L3 (mis. kucing, anjing, burung, ikan, mobil, kupu-kupu, bom, batu, api, monster, apel, bintang, bola, koin). Nilai yang tidak ada **diganti** dengan subjek yang ada dan masuk akal untuk perannya. Gunakan penggantian yang sama dengan L2 bila nilainya sama (apel tetap; bintang menjadi jeruk; koin menjadi pisang; bola menjadi bola sepak). Daftar subjek ada di `docs/aset/prompt-gambar.md`. Catat tiap penggantian di catatan akhir.
- Parameter `nama_file` tetap (tidak ada kata Scratch di sana).
- Pastikan **tidak ada lagi** kata "Scratch", "next costume", "wait", "say ... for ... seconds", "switch backdrop", "change size", "set volume", "pick random", "if ... then ... else", "broadcast", "change ... by", "backdrop", dan "costume" berbahasa Inggris di template L3 (kecuali di riwayat/laporan lama). Template HTML (`coding`) tetap seperti sekarang.

## Selesai

1. Pemeriksaan manual lokal: siswa L3 dalam sesi membuat proyek untuk tiap jenis tugas (animasi kostum berganti, animasi dengan musik latar dan pergantian adegan, tebak angka dengan Tanya, variabel dengan Ubah sebesar saat sprite diklik, Jika/jika tidak untuk pesan menang atau coba lagi, nyawa dengan Menyentuh sprite tertentu, Game Over dengan sprite teks, naik level dengan kelipatan, layar awal dengan tombol Mulai lewat Kirim pesan, judul dan petunjuk dengan sprite teks), simpan, dan kirim ke tugas; tutor membuka tiap proyek, menjalankan pratinjau (termasuk menjawab Tanya), melihat susunan blok, dan menilai lewat panel; unggah kostum dari Paint (PNG, JPEG, berkas terlalu besar, berkas bukan gambar harus ditolak), hapus kostum yang sudah terkirim (harus ditolak); buka proyek L2 lama (tetap berjalan sama); post test L3 bagian C dan D lewat Studio sampai finalisasi dan sertifikat; tampilan HP dan mode gelap; hapus siswa uji (proyek, kiriman, dan berkas kostum ikut terhapus tanpa galat); `db:seed` dengan seed template baru tanpa galat validasi.
2. Perbarui `README.md` (cara uji, blok L3, sprite teks, kostum unggahan, catatan seed) dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`. Jangan ubah bagian lain di kedua berkas itu.
3. Karena ini fitur baru (bukan bug fix), tidak perlu laporan di `docs/reports/`. Tulis di akhir balasan: daftar penggantian parameter template (Tahap 4) dan keputusan yang perlu dari pemilik.
