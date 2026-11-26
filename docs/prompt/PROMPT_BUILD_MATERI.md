# Prompt Build: Materi Pertemuan (baca dulu, baru kerjakan tugas)

> Cara menjalankan (di chat agen): `Baca docs/prompt/PROMPT_BUILD_MATERI.md lalu kerjakan Tahap 1 sampai 3.`
> Isi materi (berkas seed) ditulis terpisah oleh pemilik/Claude. Agen hanya membangun fitur dan memuat berkas seed yang ada; **jangan menulis isi materi sendiri**.

Baca dulu `.kiro/steering/project-context.md` dan `README.md`. Kerjakan hanya fitur materi di bawah. Jangan mengubah modul lain, termasuk Post test (pertemuan 13), kecuali yang disebut eksplisit.

## Aturan kerja (wajib)

- Ikuti pola, struktur, penamaan, dan cara DI file serupa di project (alur `jsx -> controller -> usecase -> model`, satu folder per modul di `src/modules/<modul>/`, awilix, zod). Jangan mengubah pola yang sudah berjalan.
- Cek dulu apakah ada komponen/function yang bisa dipakai atau diperluas (komponen UI, `ConfirmDialog`, `Ikon`, helper JSON, pembungkus gambar) sebelum membuat yang baru. Bila membuat baru, jelaskan alasannya singkat di catatan akhir.
- Setiap function diberi komentar ringkas Bahasa Indonesia. Cabang non-trivial diberi komentar alasan/maksud, bukan mengulang kode. Cek ulang sebelum selesai.
- **Jangan menghapus kode yang tidak terpakai atau dikomen.**
- **Jangan membuat test.**
- Jangan membuat `ringkasan-perubahan.md`. Dokumen yang boleh diperbarui hanya `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`.
- Kerjakan sampai tuntas; berhenti hanya bila butuh keputusan dari pemilik.
- Desain mengikuti `docs/design-system.md`: area siswa playful (Zippy, tombol gemuk), terang/gelap lolos kontras AA, ikon Phosphor lewat pembungkus `Ikon`. Teks ditulis untuk anak, jadi huruf besar dan jarak lega.
- SQL kompatibel MySQL 8 dan MariaDB 11. ID `BIGINT UNSIGNED` dibuat aplikasi (`idGen`), selalu string di JavaScript. Kolom JSON dibaca lewat helper pengurai JSON yang sudah ada.

## Aturan fitur

1. Materi hanya untuk **pertemuan 1 sampai 12** tiap level (36 materi). **Pertemuan 13 (Post test) tidak punya materi** dan alurnya tidak berubah.
2. Saat siswa membuka pertemuan, **materi tampil lebih dulu**. **Tugas terkunci** sampai siswa membaca sampai akhir dan menekan **"Saya sudah paham"**.
3. Setelah itu daftar tugas terbuka. Status "sudah paham" disimpan **per siswa per pertemuan** dan tidak diminta lagi (tidak terkunci ulang).
4. **Pustaka materi (menu "Materi" di area siswa).** Baik **sudah maupun belum absen**, siswa bisa membuka kembali materi yang **sudah pernah dilalui**, **termasuk dari level lain** (mis. level sebelumnya setelah Ganti level). Daftar tampil **berurutan** (level, lalu nomor pertemuan). Aturan "sudah dilalui": pertemuan yang berstatus **Diajarkan** untuk siswa itu (status otomatis dari absensi, sudah ada di project), **ditambah** pertemuan pada sesi yang sedang berlangsung. Materi yang **belum pernah diajarkan tidak ditampilkan sama sekali** (tanpa judul, tanpa kunci, tanpa petunjuk), dan server menolak pembukaan lewat URL langsung. Contoh: siswa sekarang di L1 P03 dengan sesi berlangsung, maka P01, P02, P03 tampil dan P04 sampai P12 tidak tampil. Bila sesi belum dimulai (belum absen), hanya pertemuan yang sudah Diajarkan yang tampil. Membuka materi lama tidak mengunci tugas dan tidak mengubah status apa pun.
5. **Tombol "Saya sudah paham" hanya muncul pada materi pertemuan dari sesi yang sedang berlangsung** (setelah tutor absen masuk dan memilih pertemuan itu). Pada materi lain (pertemuan lama, level lain, atau saat belum absen) hanya mode baca, tanpa tombol (boleh diberi keterangan singkat bila relevan, mis. "Tunggu kakak tutor mengabsen kamu dulu" bila belum ada sesi). Tombol **"Baca materi"** di halaman pertemuan tetap ada dan membuka materi pertemuan itu dalam mode baca ulang (tanpa penguncian ulang).
6. Deteksi "sudah baca sampai akhir": tombol "Saya sudah paham" nonaktif sampai penanda akhir materi (elemen sentinel) terlihat di layar (IntersectionObserver). Pada layar besar yang materinya pendek, penanda langsung terlihat, jadi tombol langsung aktif; itu wajar.
7. Pertemuan yang belum punya materi di database (belum diisi): **jangan mengunci tugas**; langsung tampilkan tugas dan jangan error. Ini mencegah siswa terblokir saat seed belum lengkap.

## Tahap 1: Data, seed, dan modul

1. **Schema** (`schema.sql`, serta `db:init` mengikutinya). Tambahkan dua tabel. Sesuaikan nama dan gaya kolom dengan tabel yang sudah ada:
   - `materi`: id, `pertemuan_id` (FK ke pertemuan, UNIQUE: satu materi per pertemuan), `judul`, `isi` (JSON, lihat format di bawah), `aktif` (default 1), `dibuat_pada`, `diubah_pada`.
   - `materi_baca`: id, `siswa_id`, `pertemuan_id`, `dibaca_pada`; UNIQUE (`siswa_id`, `pertemuan_id`). FK mengikuti pola tabel siswa lain, dan **perhatikan urutan transaksi khusus hapus siswa** (komentar kepala `schema.sql`): data `materi_baca` milik siswa harus ikut terhapus saat siswa dihapus tanpa melanggar RESTRICT.
2. **Format `isi` (JSON).** Satu objek per materi:
   ```json
   {
     "tujuan": ["Kamu bisa ...", "Kamu bisa ..."],
     "bagian": [
       { "tipe": "paragraf", "judul": "Apa itu komputer?", "teks": "..." },
       { "tipe": "langkah", "judul": "Menyalakan komputer", "langkah": [
           { "teks": "Tekan tombol power.", "gambar": "aset/gambar/<kode>/berwarna.png" }
       ]},
       { "tipe": "zippy", "teks": "Tahukah kamu? ..." }
     ]
   }
   ```
   Tipe yang didukung: `paragraf`, `langkah`, `zippy`, `gambar` (gambar tunggal dengan `src` dan `keterangan`). Semua field `gambar`/`src` relatif terhadap `public/`. Validasi dengan zod di usecase; tolak tipe yang tidak dikenal dengan pesan yang jelas.
3. **Berkas seed:** muat dari `seed/materi-level-1.json`, `seed/materi-level-2.json`, `seed/materi-level-3.json`. Tiap berkas berupa daftar: `{ "kodePertemuan": "L1-P01", "judul": "...", "isi": { ... } }`. Kode pertemuan mengikuti `seed/level-pertemuan.json`. Tambahkan ke `npm run db:seed` dengan **upsert per `pertemuan_id`** dan pola yang sama dengan seed lain. Bila berkas seed belum ada atau belum lengkap, seed **jangan gagal**: lewati dan tulis peringatan jumlah materi yang dimuat. Saat berkas ada, seed boleh menimpa isi materi di database (sama seperti perilaku seed template; catat di README).
4. **Modul** `src/modules/materi/` mengikuti pola modul lain: `materi.model` (semua SQL: ambil materi per pertemuan, cek/simpan baca, daftar status), `materi.usecase` (aturan: pertemuan 13 tidak punya materi, simpan baca hanya saat sesi berlangsung, idempoten bila sudah pernah), `materi.controller` (menerima `(input, sesi)`, hak akses lewat `authController.wajibAkses`). Tambahkan di model/usecase satu query **daftar materi yang sudah dilalui siswa** (aturan 4: pertemuan berstatus Diajarkan + pertemuan sesi berlangsung, semua level, urut level lalu nomor). Query yang sama dipakai untuk memeriksa izin saat siswa membuka satu materi (menolak bila belum dilalui). Gunakan ulang query/status "Diajarkan" yang sudah ada di modul absensi/sesi, jangan menghitung ulang dengan cara berbeda. Daftarkan di awilix.

## Tahap 2: Sisi siswa

1. **Halaman materi** di area siswa untuk satu pertemuan: judul, kotak "Tujuan belajar" di atas, lalu bagian-bagian sesuai `isi`. `langkah` tampil bernomor besar dengan gambar bila ada; `zippy` tampil sebagai balon kata dengan Zippy (`public/aset/maskot/`, pakai berkas yang sudah ada, tanpa membuat gambar baru; bila berkas tidak ada, tampilkan tanpa gambar). Gambar yang hilang tidak boleh menampilkan ikon rusak.
2. Di akhir materi: penanda akhir (sentinel) dan tombol **"Saya sudah paham"** (aturan 5 dan 6). Setelah ditekan: simpan lewat Server Action/route yang mengikuti pola project, lalu arahkan ke daftar tugas pertemuan itu.
3. **Halaman pertemuan/daftar tugas:** bila materi ada dan belum dibaca, alihkan/tampilkan materi lebih dulu dan **tolak akses ke tugas di sisi server** (penguncian harus di usecase/controller, bukan hanya disembunyikan di tampilan; siswa tidak boleh bisa membuka URL tugas langsung). Bila sudah dibaca atau materi belum ada, tugas terbuka normal (aturan 3 dan 7).
4. Tombol **"Baca materi"** (aturan 4) di halaman pertemuan, memakai ikon Phosphor lewat `Ikon`. Mode baca ulang tidak menampilkan tombol "Saya sudah paham" sebagai penguncian; cukup tombol kembali ke tugas.
5. **Halaman daftar "Materi"** (menu siswa, bisa dibuka sebelum maupun sesudah absen): menampilkan materi yang sudah dilalui sesuai aturan 4, dikelompokkan per level dan berurutan. Tiap baris menampilkan nomor, judul, dan tanda kecil "sudah paham" bila `materi_baca` ada. Daftar kosong (siswa baru, belum ada pertemuan Diajarkan dan belum absen) tampilkan pesan ramah dari Zippy, bukan galat. Pertemuan yang tidak boleh tampil tidak boleh muncul di HTML, data, maupun respons JSON.
6. Mode orang tua: tidak ada perubahan, tidak perlu melihat materi.
6. Tampilan nyaman di HP dan PC, terang dan gelap.

## Tahap 3: Sisi pengelola

1. Di halaman detail siswa (`/data-siswa/[id]`, tempat riwayat pertemuan yang sudah ada), tampilkan per pertemuan keterangan **"Materi: sudah dibaca (tanggal/jam)"** atau **"belum dibaca"**. Cukup tambahan kecil pada tampilan yang ada.
2. Halaman **Materi** untuk admin: daftar 36 materi per level, pratinjau tampilan siswa, dan editor sederhana (judul + isi JSON dengan validasi zod yang sama dan pesan galat jelas). Tutor hanya boleh melihat/pratinjau, tidak mengubah. Gunakan pola halaman daftar/template yang sudah ada (Fase B) dan kerjakan **sesederhana mungkin**; jangan membuat editor visual.
3. Perubahan lewat halaman ini hanya berlaku sampai seed dijalankan lagi (upsert penuh). Tulis peringatan ini di bawah editor dan di README.

## Selesai

1. Pemeriksaan manual lokal: siswa baru tanpa absen (menu Materi kosong, pesan ramah); absen di P03 setelah P01 dan P02 berstatus Diajarkan (menu Materi menampilkan P01-P03 berurutan, P04-P12 tidak tampil dan URL langsungnya ditolak; hanya P03 punya tombol "Saya sudah paham"); siswa yang pernah berpindah level (materi level lama tetap tampil); setelah tutor absen: tugas terkunci, scroll sampai akhir, tombol aktif, tekan, tugas terbuka; buka ulang lewat "Baca materi"; coba buka URL tugas langsung sebelum paham (harus ditolak); buka pertemuan 13 (tanpa materi, alur lama); hapus siswa uji (data `materi_baca` ikut terhapus tanpa galat); jalankan `db:seed` dengan dan tanpa berkas materi (tanpa berkas: peringatan, bukan galat).
2. Perbarui `README.md` (cara uji fitur materi, format `isi`, catatan seed) dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`. Jangan ubah bagian lain di kedua berkas itu.
3. Karena ini fitur baru (bukan bug fix), tidak perlu laporan di `docs/reports/`. Bila ada keputusan yang perlu dari pemilik, tulis di akhir balasan.
