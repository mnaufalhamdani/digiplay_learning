# Prompt Build: Coding Zippy (Blockly buatan sendiri) untuk L1 P11

> Cara menjalankan (di chat agen): `Baca docs/prompt/PROMPT_BUILD_BLOCKLY.md lalu kerjakan Tahap 1 sampai 4.`
> Berkas data yang disediakan pemilik: `seed/labirin-blockly.json` (7 labirin, sudah diverifikasi dapat diselesaikan). **Jangan membuat atau mengubah isi labirin sendiri.**

Baca dulu `.kiro/steering/project-context.md` dan `README.md`. Kerjakan hanya fitur di bawah. Jangan mengubah modul lain di luar yang disebut eksplisit.

## Latar belakang

Pertemuan L1 P11 "Coding visual 1 (blok kode)" tidak lagi memakai aplikasi pihak ketiga (Scratch Jr / Code.org). Gantinya adalah latihan coding blok **buatan sendiri di web**, tanpa akun dan tanpa internet ke pihak ketiga, seperti game mouse dan puzzle yang sudah ada. Siswa menyusun blok perintah untuk membantu Zippy berjalan di labirin kecil sampai ke bintang. Penilaian **otomatis**.

Level 2 dan Level 3 kelak akan menambah blok (percabangan, variabel) pada fitur yang sama, jadi bangun dengan struktur yang bisa diperluas tanpa dibangun ulang. **Yang dikerjakan sekarang hanya blok untuk Level 1.** Jangan membuat blok untuk L2/L3.

## Aturan kerja (wajib)

- Ikuti pola, struktur, penamaan, dan cara DI file serupa di project (alur `jsx -> controller -> usecase -> model`, satu folder per modul di `src/modules/<modul>/`, awilix, zod). Fitur ini adalah saudara dari game mouse dan puzzle (Fase D1): **baca dulu bagaimana keduanya dibangun** (menu, halaman, tabel `hasil_latihan`, penilaian otomatis, aturan sesi) dan tiru polanya.
- Cek dulu apakah ada komponen/function yang bisa dipakai atau diperluas sebelum membuat yang baru. Bila membuat baru, jelaskan alasannya singkat di catatan akhir.
- Setiap function diberi komentar ringkas Bahasa Indonesia. Cabang non-trivial diberi komentar alasan/maksud, bukan mengulang kode. Cek ulang sebelum selesai.
- **Jangan menghapus kode yang tidak terpakai atau dikomen.** Tipe tugas `scratch` tetap dipertahankan (masih dipakai L2 dan L3).
- **Jangan membuat test.**
- Jangan membuat `ringkasan-perubahan.md`. Dokumen yang boleh diperbarui hanya `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`.
- Tanpa `eval`, tanpa `new Function`, dan tanpa menjalankan kode hasil generator Blockly. Program siswa ditafsirkan oleh penerjemah kita sendiri (lihat Tahap 2).
- Kerjakan sampai tuntas; berhenti hanya bila butuh keputusan dari pemilik.
- Desain mengikuti `docs/design-system.md`: area siswa playful, terang/gelap lolos kontras AA, ikon Phosphor lewat pembungkus `Ikon`, `ConfirmDialog` untuk konfirmasi. Tidak boleh ada berkas gambar baru: pakai berkas Zippy di `public/aset/maskot/` yang sudah ada, bintang dan petak dengan SVG/CSS atau ikon Phosphor.
- SQL kompatibel MySQL 8 dan MariaDB 11. ID `BIGINT UNSIGNED` dibuat aplikasi (`idGen`), selalu string di JavaScript. Kolom JSON dibaca lewat helper pengurai JSON yang sudah ada.

## Tahap 1: Pustaka, data labirin, dan modul

1. **Pustaka Blockly:** pasang paket `blockly` dari npm dengan **versi dipin eksak** (bukan rentang), pilih versi stabil terbaru yang sudah dirilis minimal 2 minggu. Muat hanya di halaman latihan ini lewat dynamic import tanpa SSR (`ssr: false`) agar halaman lain tidak membengkak.
2. **Schema** (`schema.sql`, `db:init` mengikuti): tabel `labirin_blockly`: id, `kode` (UNIQUE), `nama` (UNIQUE), `urutan`, `lebar`, `tinggi`, `grid` (JSON, daftar string baris), `mulai` (JSON: x, y, arah), `bintang` (JSON: x, y), `batas_blok`, `blok_tersedia` (JSON, daftar tipe blok yang tampil di toolbox), `petunjuk`, `contoh_solusi` (JSON), `aktif` (default 1), `dibuat_pada`, `diubah_pada`. Sesuaikan gaya kolom dengan tabel lain.
3. **Seed:** muat `seed/labirin-blockly.json` ke `labirin_blockly` dengan **upsert per `kode`**, ditambahkan ke `npm run db:seed` dengan pola yang sama dengan seed lain. Berkas hilang atau kosong: seed jangan gagal, tulis peringatan. Seed tetap menimpa data (catat di README seperti seed lain).
4. **Hasil latihan:** simpan hasil ke tabel `hasil_latihan` yang sudah dipakai game mouse dan puzzle. Periksa kolom dan batasannya (mis. enum/daftar `jenis`) lalu tambahkan jenis baru **`blockly`** dengan perubahan sekecil mungkin; bila perlu kolom tambahan (mis. referensi labirin atau jumlah blok), tambahkan hanya yang perlu. Satu percobaan berhasil menyimpan satu baris hasil dengan labirin, jumlah blok, dan jumlah langkah.
5. **Modul** `src/modules/blockly/` (nama mengikuti pola modul yang ada): `model` (semua SQL), `usecase` (aturan), `controller` (menerima `(input, sesi)`, hak akses lewat `authController.wajibAkses`; validasi input dengan zod). Daftarkan di awilix. Aturan sesi (siswa hanya boleh menyimpan hasil saat sesi berlangsung, dan seterusnya) **sama persis dengan game mouse/puzzle**; tiru, jangan buat aturan baru.

## Tahap 2: Format program dan penerjemah (satu-satunya sumber kebenaran)

1. **Format program (JSON buatan kita, bukan XML/JS Blockly):** daftar perintah berurutan. Contoh:
   ```json
   [
     { "blok": "maju" },
     { "blok": "belok_kanan" },
     { "blok": "ulangi", "kali": 3, "isi": [ { "blok": "maju" }, { "blok": "maju" } ] }
   ]
   ```
   Tipe blok Level 1: `maju`, `belok_kiri`, `belok_kanan`, `ulangi` (dengan `kali` bilangan bulat 2 sampai 10 dan `isi` daftar perintah). Tipe lain ditolak.
2. **Penerjemah murni** `simulasiProgram(labirin, program)`: satu function murni (tanpa efek samping, tanpa akses DB) yang menjalankan program di labirin dan mengembalikan: `berhasil` (sampai di bintang), `alasan` bila gagal (`menabrak`, `belum_sampai`, `terlalu_banyak_blok`, `program_kosong`, `tidak_valid`), `jumlahBlok`, `jumlahLangkah`, dan `jejak` (daftar posisi dan arah tiap langkah, dipakai animasi). Letakkan di folder `shared/` sesuai pola project (seperti `shared/ui/kelasTombol.js`) supaya **dipakai sama persis oleh tampilan (animasi) dan oleh server (validasi)**.
3. **Aturan permainan:**
   - Siswa mulai di `mulai` (x, y, arah), arah awal sesuai data. Arah: `atas`, `kanan`, `bawah`, `kiri`; `belok_kanan` memutar searah jarum jam, `belok_kiri` berlawanan.
   - `maju` pindah satu petak ke depan. Bila petak depan dinding (`#`) atau di luar grid: **menabrak**, program berhenti dan gagal.
   - Begitu `maju` mendarat di petak `bintang`, program berhenti dan dinyatakan **berhasil** (perintah sisa tidak dijalankan).
   - Hitungan `jumlahBlok`: semua blok perintah termasuk blok `ulangi` dan seluruh isinya (blok "Mulai" tidak dihitung). `jumlahBlok > batas_blok` berarti `terlalu_banyak_blok` dan **tidak berhasil** walau sampai bintang. Itu yang mendorong siswa memakai blok ulangi di labirin tertentu.
   - Pengaman: batas total langkah (mis. 500) dan kedalaman `ulangi` maksimal 3, agar program ganas tidak membuat server menggantung.
4. **Penilaian di server:** klien mengirim `program` (format di atas) dan kode labirin. Server memvalidasi dengan zod, mengambil labirin dari DB, menjalankan `simulasiProgram`, lalu **menentukan sendiri** berhasil atau tidak. **Server tidak boleh memercayai kiriman "berhasil" dari klien.**
5. **Struktur dapat diperluas:** daftar blok yang tampil dibaca dari kolom `blok_tersedia`. Tambahkan blok baru nanti cukup dengan mendaftarkan definisi blok (tampilan Blockly + cara penerjemah menjalankannya) di satu tempat terpusat, tanpa mengubah komponen halaman. Tulis di README satu paragraf pendek tentang cara menambah blok.

## Tahap 3: Halaman siswa "Coding Zippy"

1. **Menu siswa "Coding Zippy"** (ikon Phosphor lewat `Ikon`), sejajar dengan Latihan Mouse dan Puzzle. Ikuti aturan akses menu itu. Daftar labirin tampil berurutan menurut `urutan` dengan nama dan tanda "sudah selesai" bila siswa pernah berhasil.
2. **Halaman satu labirin:**
   - Papan labirin (SVG/CSS): jalan, dinding, bintang (ikon Phosphor), dan Zippy (berkas maskot yang sudah ada) menghadap sesuai arahnya.
   - Area Blockly: toolbox hanya berisi blok dari `blok_tersedia`. Blok berbahasa Indonesia ramah anak: "Maju", "Belok kiri", "Belok kanan", "Ulangi ... kali". Satu blok **"Mulai"** tetap sebagai pangkal program (tidak bisa dihapus). Batasi ukuran angka pada blok ulangi sesuai aturan 2 sampai 10.
   - Tombol **Jalankan**, **Ulang** (kembalikan Zippy ke awal dan biarkan blok), dan **Petunjuk** (teks `petunjuk` labirin; **bukan** `contoh_solusi`, solusi tidak boleh ditampilkan ke siswa). Indikator "Blok: n / batas" yang berubah warna saat melebihi batas.
   - Animasi: Zippy bergerak petak demi petak mengikuti `jejak`, lengkap dengan gerak sederhana. Hormati preferensi pengurangan gerak (`prefers-reduced-motion`): bila aktif, loncat ke hasil akhir.
3. **Umpan balik ramah anak:** berhasil (perayaan singkat dengan Zippy, simpan hasil, tombol "Labirin berikutnya"); menabrak ("Aduh, Zippy menabrak dinding. Coba periksa lagi urutannya!"); belum sampai; terlalu banyak blok ("Blokmu terlalu banyak. Coba pakai blok Ulangi!"). Tidak ada kalimat yang menyalahkan siswa.
4. **Penyimpanan hasil** lewat Server Action/route sesuai pola; hanya tersimpan bila aturan sesi terpenuhi (Tahap 1 butir 5). Saat bukan di sesi, siswa tetap boleh mencoba tanpa menyimpan hasil, dengan keterangan singkat (tiru perilaku game mouse).
5. **Blockly di layar sentuh:** area kerja cukup besar dan nyaman di HP dan tablet. Pada layar sempit, papan labirin di atas dan area Blockly di bawahnya. Tema Blockly mengikuti terang/gelap dan kontras AA. Dukungan keyboard dasar bawaan Blockly dibiarkan menyala.
6. Mode orang tua: tidak ada perubahan.

## Tahap 4: Tipe tugas baru dan penggantian tugas P11

1. Daftarkan **tipe tugas `blockly`** dengan pola yang sama dengan `game_mouse` dan `puzzle`: dinilai otomatis dari tabel hasil latihan. `kunci.jenis` harus cocok dengan `hasil_latihan.jenis` (`blockly`) dan `kunci.labirin` harus cocok dengan **`nama`** labirin yang berhasil diselesaikan siswa. Perbarui `validasiTemplate`, daftar tipe/nilai `penilaian` yang dipakai (ikuti nilai penilaian yang dipakai `game_mouse`/`puzzle`), tampilan tugas, dan teks bantuan di README (bagian `format` template).
2. Tugas bertipe `blockly` menampilkan **tombol langsung ke labirin yang diminta** di dalam instruksi (tanpa lewat menu), mengikuti pola unduh bahan langsung di instruksi.
3. **Ganti empat template P11** di `seed/template-level-1.json` (kode sama, isi diganti; edit baris yang sudah ada, jangan menambah kode baru). Pertahankan field lain seperti `pertemuan`, `bagian: null`, dan `opsi: null`. Nilai `penilaian` mengikuti butir 1.
   ```json
   {"kode": "L1-P11-PR-01", "pertemuan": 11, "bagian": null, "tipe": "blockly", "kesulitan": 1,
    "teks": "Bantu Zippy sampai ke bintang di labirin “{labirin}” pada menu Coding Zippy.",
    "parameter": {"labirin": ["Jalan Lurus", "Belok Kanan", "Belok Kiri"]}, "opsi": null,
    "kunci": {"jenis": "blockly", "labirin": "{labirin}"}}
   {"kode": "L1-P11-PR-02", "pertemuan": 11, "bagian": null, "tipe": "blockly", "kesulitan": 1,
    "teks": "Bantu Zippy sampai ke bintang di labirin “{labirin}” pada menu Coding Zippy.",
    "parameter": {"labirin": ["Belok Kanan", "Belok Kiri", "Zig-zag"]}, "opsi": null,
    "kunci": {"jenis": "blockly", "labirin": "{labirin}"}}
   {"kode": "L1-P11-PR-03", "pertemuan": 11, "bagian": null, "tipe": "blockly", "kesulitan": 2,
    "teks": "Selesaikan labirin “{labirin}” dengan blok Ulangi supaya jumlah blokmu tidak melebihi batas.",
    "parameter": {"labirin": ["Jalan Panjang", "Keliling Kotak"]}, "opsi": null,
    "kunci": {"jenis": "blockly", "labirin": "{labirin}"}}
   {"kode": "L1-P11-PR-04", "pertemuan": 11, "bagian": null, "tipe": "blockly", "kesulitan": 2,
    "teks": "Bantu Zippy sampai ke bintang di labirin “{labirin}”. Perhatikan pola yang berulang.",
    "parameter": {"labirin": ["Tangga", "Zig-zag"]}, "opsi": null,
    "kunci": {"jenis": "blockly", "labirin": "{labirin}"}}
   ```
   (Tambahkan field `penilaian` sesuai butir 1 pada tiap baris.)
4. **Tugas P11 lama di data siswa:** tugas yang sudah digenerate dari template `scratch` lama tidak diubah. Catat di catatan akhir bila ada dampak.
5. Pastikan tidak ada lagi penyebutan "Scratch Jr" atau "Code.org" di seed, tampilan, dan teks L1 (kecuali di riwayat/laporan lama). Tipe `scratch` dan template L2/L3 **tidak diubah**.

## Selesai

1. Pemeriksaan manual lokal: siswa dalam sesi menyelesaikan ketujuh labirin dengan `contoh_solusi` (yang ada di seed, hanya untuk uji, jangan ditampilkan); coba program yang menabrak; program kosong; program melebihi `batas_blok` di "Jalan Panjang" tanpa ulangi (harus gagal); kirim paksa program tidak valid atau hasil berhasil palsu lewat permintaan manual (server harus menolak/menilai sendiri); siswa di luar sesi (bisa mencoba, hasil tidak tersimpan); tugas P11 baru digenerate dan ditandai selesai otomatis setelah labirin yang diminta berhasil; tampilan HP dan mode gelap; `db:seed` dengan dan tanpa `seed/labirin-blockly.json`.
2. Perbarui `README.md` (cara uji, format program, cara menambah blok, catatan seed) dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`. Jangan ubah bagian lain di kedua berkas itu.
3. Karena ini fitur baru (bukan bug fix), tidak perlu laporan di `docs/reports/`. Keputusan yang perlu dari pemilik tulis di akhir balasan.
