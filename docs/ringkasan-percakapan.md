# Ringkasan Percakapan: DigiPlay Learning

> Berkas ini **untuk Claude**, bukan untuk agen coding (agen tidak perlu membacanya dan tidak boleh mengubahnya). Gunanya: di sesi chat baru, Claude cukup membaca ringkasan ini (bersama `.kiro/steering/project-context.md` terbaru) tanpa membaca chat yang panjang.
>
> Cara memakai di chat baru: unggah berkas ini + `.kiro/steering/project-context.md` terbaru (+ laporan/catatan agen terakhir bila ada), lalu tulis: *"Baca ringkasan ini lalu lanjutkan proyek DigiPlay."*

Terakhir diperbarui: **26 November 2026**. Fase A sampai F, perbaikan hasil uji awal (instruksi bahan, penilaian praktik, gambar posisi jari), fitur **materi pertemuan**, dan coding visual buatan sendiri untuk **L1 (Coding Zippy), L2 dan L3 (Studio Zippy)** sudah dikerjakan agen dan diuji lokal. Yang tersisa adalah uji dengan siswa sungguhan, perbaikan temuan, dan deploy (ditunda sampai domain dan server siap).

## 1. Proyek

**DigiPlay Learning**: website les komputer anak berbasis **level tanpa patokan usia** (Pemula, Dasar, Lanjutan), tiap level **12 pertemuan + 1 pertemuan post test**. Pemilik adalah developer (JS, PHP, Flutter, Kotlin) yang membangun lewat **agen coding (Kiro)** memakai prompt yang ditulis Claude; pengerjaan masih **lokal**.

- **Satu project Next.js** (frontend + backend) melayani dua area: siswa dan orang tua (`namadomain.com`), pengelola (`backoffice.namadomain.com`). Dibedakan oleh `src/proxy.js`.
- **Stack:** Next.js 16 (App Router, versi dipin), JavaScript (+ `*.controller.ts`/`*.usecase.ts`), MySQL 8 / **MariaDB 11.8 lokal (port 3307)**, mysql2 tanpa ORM, awilix (DI), zod, Tailwind v4, Phosphor Icons, Blockly 13.4.0 (pin), font Fredoka + Nunito. Arsitektur meniru project referensi **DK Docs**: `jsx -> controller -> usecase -> model (semua SQL)`, satu folder per modul di `src/modules/<modul>/`.
- **Nama project/repo:** `digiplay-learning`. **Maskot:** **Zippy**, sugar glider "Pahlawan Anti-Gaptek".

## 2. Keputusan utama

**Akses dan sesi**
- Siswa login dengan **kode unik 8 karakter**. **Kode siswa dan kode orang tua terpisah**; orang tua hanya melihat (rapor, sertifikat, status bayar).
- Admin dan tutor login email + password. Admin: semua hak tutor + pengaturan, kelola akun tutor, hapus siswa, ubah template dan **materi**. Tutor: daftarkan siswa, absen, catatan, penuntasan, pembayaran, sertifikat, **menilai praktik dan proyek siswa**.
- **Sesi**: tutor absen masuk dengan kode siswa dan memilih pertemuan; siswa baru boleh mengerjakan/menyimpan setelah itu. Siswa menekan **Pulang**; tutor bisa **Tutup sesi**. **Satu kode satu perangkat**, login berakhir bila tidak aktif > 5 menit, tombol **Ganti device**.

**Materi dan tugas (keputusan sesi ini)**
- **Materi dulu, baru tugas.** Pertemuan 1 sampai 12 tiap level punya materi (36 materi, isi di `seed/materi-level-<n>.json`, ditulis Claude, bahasa "kamu" ramah anak dengan Zippy sebagai penutup). Tugas **terkunci** sampai siswa membaca sampai akhir dan menekan **"Saya sudah paham"** (hanya tersimpan saat sesi pertemuan itu berlangsung). Pertemuan 13 (post test) tanpa materi. Pertemuan tanpa materi di database tidak mengunci tugas. Tombol **"Baca materi"** selalu ada untuk membuka ulang.
- **Menu "Materi" siswa**: menampilkan materi yang **sudah dilalui** (punya sesi untuk siswa itu, lintas level, berurutan); yang belum diajarkan **tidak tampil sama sekali** (dan 404 bila URL langsung dibuka). Bisa dibuka sebelum maupun sesudah absen.
- **Instruksi tugas tidak menyebut nama bahan.** Cukup **"Unduh bahan"** dengan tombol langsung di instruksi (kartu tugas dan butir post test). **Menu Bahan dihilangkan** (kode tidak dihapus). Nama subjek, berkas unduhan, dan kunci selalu berasal dari satu parameter subjek yang sama.
- **Tugas menggambar/mewarnai** hanya memakai subjek dari **75 gambar** (`public/aset/gambar/<kode>/`), contohnya `mewarnai.png`.
- **Gambar posisi jari** (`public/aset/mengetik/posisi-jari.png`, dibuat pemilik lewat generator gambar) tampil di halaman Mengetik dan dipakai di materi L1 P03 dan L2 P01 bila berkasnya ada.
- **Penilaian praktik post test:** butir `dicek_tutor` dinilai tutor lewat panel (skor, catatan, rubrik), lalu **Finalisasi** menghitung nilai dan sertifikat. Skor tersimpan di `tugas_siswa.parameter_hasil.penilaianTutor`.

**Coding visual tanpa pihak ketiga (keputusan sesi ini)**
- **Scratch Jr / Code.org dan Scratch asli tidak dipakai lagi.** Semuanya buatan sendiri di web (Blockly, tanpa `eval`, tanpa akun).
- **L1 P11 = Coding Zippy:** labirin petak "Bantu Zippy sampai ke bintang" (7 labirin di `seed/labirin-blockly.json`; blok maju, belok kiri/kanan, ulangi), tipe tugas `blockly`, **dinilai otomatis** (server menilai ulang program, tidak percaya klien).
- **L2 P09-P11 dan bagian D post test L2 = Studio Zippy:** panggung bebas dengan sprite (75 subjek + Zippy, kostum 1 `berwarna`, kostum 2 `outline`), latar SVG (polos, taman, pantai, luar angkasa, kota, labirin), suara disintesis Web Audio, blok berkategori warna (Kejadian kuning, Gerakan biru, Tampilan ungu, Suara merah muda, Kontrol oranye, Sensor biru muda, Operator hijau, Variabel merah). Tipe tugas `coding_proyek`, **dinilai tutor** (siswa mengirim salinan beku proyek; tutor menjalankan pratinjau, melihat susunan blok, menilai lewat panel yang sama dengan praktik post test).
- **L3 = Studio Zippy tingkat 3:** blok tambahan (pesan, tanya/jawaban, musik latar, jika-tidak, tunggu sampai, operator hitung/logika, gabung, variabel buatan maks 8, menyentuh sprite tertentu), **sprite teks** (judul, tombol Mulai, Game Over), dan **kostum unggahan dari Paint** (PNG/JPEG, diperkecil 256 px, maks 200 KB, tidak bisa dihapus bila sudah terkirim). Keputusan: tugas bebas dinilai tutor; kostum digambar di **Paint** lalu diunggah (tidak ada editor gambar di Studio). Tingkat 3 hanya untuk siswa level berurutan 3 ke atas.
- Judul pertemuan: L1 P11 "Coding visual 1 (blok kode)"; L2 P09-P11 "Coding 1/2/3"; deskripsi L3 "...Excel, dan coding dasar". Istilah di soal memakai nama blok Indonesia (mis. "Kostum berikutnya", bukan "next costume").
- Tipe `scratch` tetap terdaftar di kode tetapi tidak dipakai template mana pun lagi.

**Penilaian dan sertifikat (tetap dari sebelumnya)**
- Mode: `otomatis_jawaban` atau `dicek_tutor`. Status tugas: belum, selesai, dilewati, diganti. Penuntasan materi (tuntas / sebagian / tidak) dihitung otomatis dan bisa diubah tutor.
- **Post test: 15 butir, 45 menit, semua level.** Lulus bila total >= 70 **dan** tiap bagian >= 50. Syarat ikut: kehadiran >= 9 dari 12. Tes ulang hanya bagian yang gagal, tidak dibatasi. Bagian: **L1** A mengetik, B pengetahuan, C praktik Mouse/File/Paint, D praktik Word. **L2** A mengetik, B Word/PowerPoint, C Excel, D **Praktik Coding** (Studio), E konsep. **L3** A mengetik, B Excel, C praktik grafik/desain/animasi, D **Praktik Coding** (Studio + HTML/CSS), E konsep.
- **Sertifikat** per level terbit otomatis saat lulus (PDF, QR ke halaman verifikasi publik bertoken); admin/tutor bisa membatalkan/menerbitkan ulang. Pembayaran dicatat manual dan terlihat orang tua.
- Isi level: **L1** (Mouse, keyboard, Paint, Word dasar, internet sehat, Coding Zippy), **L2** (mengetik 10 jari, Word tabel/laporan, PowerPoint, Excel SUM/AVERAGE, Studio Zippy), **L3** (mengetik cepat, Excel IF/COUNT/MAX/MIN dan grafik, Word/PowerPoint tugas sekolah, Canva, animasi, coding game, HTML/CSS). Canva dipakai di L3; urusan akun dan syarat usia ditangani pemilik kursus.

**Desain dan aset**
- Satu set komponen, dua "kepribadian" lewat `data-area` (siswa playful, pengelola tenang); terang dan gelap lolos kontras AA; ikon Phosphor lewat `Ikon`; `ConfirmDialog` untuk aksi penting. **75 subjek gambar** (outline, berwarna, puzzle, mewarnai). Tidak ada berkas gambar/suara baru untuk fitur coding (sprite dari subjek yang ada, latar SVG, suara sintesis).

## 3. Berkas dan letaknya (dari root `digiplay-learning/`)

| Berkas | Letak |
|---|---|
| `project-context.md` (dibaca dan diperbarui agen, bagian "Status pengerjaan") | `.kiro/steering/project-context.md` |
| `README.md` (cara menjalankan, matriks akses, cara uji per fitur) | root |
| `schema.sql` (31 tabel) | `schema.sql` |
| Prompt agen: `PROMPT_BUILD_DIGIPLAY.md`, `PROMPT_BUGFIX_INSTRUKSI_BAHAN.md`, `PROMPT_BUILD_MATERI.md`, `PROMPT_BUILD_BLOCKLY.md`, `PROMPT_BUILD_BLOCKLY_L2.md`, `PROMPT_BUILD_BLOCKLY_L3.md` | `docs/prompt/` |
| `ringkasan-percakapan.md` (berkas ini) | `docs/` |
| `design-system.md` | `docs/` |
| `prompt-gambar.md`, `prompt-gambar.csv`, `prompt-maskot.md` | `docs/aset/` |
| Seed: `level-pertemuan.json`, `pelajaran-mengetik.json`, `template-level-1/2/3.json`, `materi-level-1/2/3.json`, `labirin-blockly.json` | `seed/` |
| Gambar subjek | `public/aset/gambar/<kode>/` |
| Zippy `zippy-<suasana>.png` | `public/aset/maskot/` |
| Gambar posisi jari | `public/aset/mengetik/posisi-jari.png` |
| Kostum unggahan siswa (runtime) | `uploads/kostum/<siswaId>/` |
| Laporan bug fix | `docs/reports/<nama-bug>.md` (mis. `penilaian-post-test-praktik.md`, `instruksi-bahan-tidak-sesuai.md`, `gambar-posisi-jari-mengetik.md`) |

Angka seed yang diharapkan: 3 level, 39 pertemuan, 14 bagian post test, **407 template**, 48 teks mengetik, 12 pelajaran mengetik, 75 subjek gambar, **36 materi**, **7 labirin**.

## 4. Status pengerjaan

| Tahap | Isi | Status |
|---|---|---|
| Fase A-F | Fondasi, data master, sesi, latihan/post test, sertifikat, rapor/galeri/ekspor | **Selesai** |
| Bug fix | Instruksi bahan + `mewarnai.png`, penilaian praktik post test, gambar posisi jari | **Selesai** |
| Materi pertemuan | Fitur (tabel, pembaca, penguncian, menu Materi, editor admin) | **Selesai** |
| Isi materi | L1 12/12, L2 12/12, L3 12/12 (ditulis Claude, cocok dengan nama blok aplikasi) | **Selesai**; jalankan `npm run db:seed` bila materi L3 P06-P10 belum masuk (hasil benar: 36 dari 36) |
| Coding Zippy L1 | Labirin Blockly, tugas `blockly` otomatis | **Selesai** |
| Studio Zippy L2 | Panggung, proyek, kirim, penilaian tutor, bagian D post test | **Selesai** |
| Studio Zippy L3 | Blok lanjutan, sprite teks, kostum unggahan, bagian C/D post test L3 | **Selesai** |
| Uji siswa sungguhan | Post test 45 menit, HP, kejelasan teks | **Belum** |
| Deploy | Domain, SSL, server, cadangan | Ditunda |

Cara menjalankan satu prompt agen: `Baca docs/prompt/<NAMA_PROMPT>.md lalu kerjakan <tahap>.` Satu prompt per permintaan.

## 5. Catatan teknis penting

- **Database lokal MariaDB**: kolom `JSON` kembali sebagai **string** (pakai satu helper pengurai JSON); SQL harus kompatibel MySQL 8 dan MariaDB 11. `DECIMAL` kembali string. ID `BIGINT UNSIGNED` dibuat aplikasi (`idGen`), selalu **string** di JavaScript. Kolom `*_kunci` (generated) jangan diisi saat INSERT. **Hapus siswa** memakai urutan transaksi khusus (komentar kepala `schema.sql`); `proyek_coding`, `proyek_kiriman`, `kostum_unggahan`, `materi_baca` ikut terhapus (CASCADE), berkas kostum dihapus setelah commit.
- **`npm run db:seed` melakukan upsert penuh** (template, materi, labirin, level/pertemuan). Perubahan template/materi lewat halaman admin **tertimpa** bila seed dijalankan lagi, jadi ubah dulu berkas JSON-nya. Berkas seed materi yang belum ada hanya memberi peringatan, bukan galat.
- **Tipe tugas:** `pilihan_ganda`, `excel`, `coding` (HTML/CSS, dicek tutor), `lainnya`, `blockly` (otomatis, L1), `coding_proyek` (dicek tutor, L2/L3; masuk `TIPE_DICEK_TUTOR_SAJA`), `scratch` (tidak dipakai lagi). Parameter `sprite`/`objek`/`pemain`/`rintangan`/`tujuan` hanya boleh subjek yang ada di 75 gambar (penggantian tercatat: keranjang/piring/mangkuk -> tas sekolah/gelas/Zippy; bintang/koin/bola -> jeruk/pisang/bola sepak; bom/batu/api/monster -> roket/kaktus/truk/lebah).
- **Format `isi` materi (JSON, zod ketat):** `tujuan` (daftar), `bagian` (tipe `paragraf`, `langkah`, `zippy`, `gambar`); jalur gambar relatif `aset/...`. Seed per berkas: daftar `{ kodePertemuan: "L1-P01", judul, isi }`.
- **Format proyek Studio (JSON, `versi: 1`):** `latar`, `variabel`, `sprite[]` (jenis `gambar` atau `teks`, posisi, arah, kostum, skrip). Penerjemah `mesinStudio.js` berbasis generator (~30 bingkai/detik, anggaran 200 blok per skrip per bingkai); tombol Berhenti selalu bisa menghentikan. Menambah blok baru: satu entri di `DAFTAR_BLOK_STUDIO` + teks `studio.blok.<nama>`/`studio.tip.<nama>` di `src/locales/id_ID.json` + `KONFIGURASI_TOOLBOX`.
- **Kunci materi:** tugas terkunci hanya bila materi aktif ada dan belum ada baris `materi_baca`; tutor tidak terkena. "Sudah dilalui" = punya baris `sesi` (lintas level, termasuk sesi berlangsung).
- **Pola dari Fase A-F yang masih berlaku:** controller menerima `(input, sesi)`; hak akses Server Action lewat `authController.wajibAkses`; cookie `dp_bo`, `dp_siswa` (12 jam), `dp_ortu`; pembatas login membaca `x-forwarded-for` dari kanan (`JUMLAH_PROXY_TEPERCAYA`); produksi wajib di belakang reverse proxy; halaman siswa di backoffice berada di `/data-siswa`. Lulus post test **tidak** mengubah level; naik level manual lewat **Ganti level**.
- **Sertifikat:** PDF dibuat setiap diunduh dari snapshot; tanpa font TTF dipakai Helvetica (karakter di luar Windows-1252 jadi `?`); `URL_SISWA` produksi wajib domain asli. Font TTF Nunito/Fredoka opsional di `public/aset/font/`.
- **Temuan kecil agen yang dibiarkan:** kotak putih gambar sprite masih terlihat di latar luar angkasa (`mix-blend-mode: multiply`); tombol Pulang/Keluar di header belum menahan peringatan "perubahan belum tersimpan" di Studio. Sertifikat L3 sudah teruji terbit; sertifikat L2 dengan bagian D "Praktik Coding" belum teruji sampai lulus penuh.
- Kemungkinan masalah: balasan Claude yang sangat panjang bisa terpotong; pecah pekerjaan besar menjadi beberapa langkah.

## 6. Keputusan yang masih terbuka

- Perpindahan level setelah lulus: **manual** lewat Ganti level.
- Waktu 45 menit untuk 15 butir cukup mepet; perlu uji coba dengan siswa sungguhan.
- Bagian B post test L2 mengambil 2 butir acak dari 6 sehingga bisa dua-duanya Word atau PowerPoint; bila ingin selalu satu-satu, bagian itu perlu dipecah.
- **Belum dibangun:** tes penempatan siswa baru (diputuskan dibiarkan), pengumuman dan jadwal untuk orang tua, gamifikasi (badge, poin), ekspor `.xlsx` (sekarang CSV), form ubah nama siswa.
- Bentuk catatan pembayaran (per sesi/bulan/paket) dan opsional menggeser warna `sun` ke oranye Zippy.
- Content-Security-Policy ketat (butuh nonce skrip tema) dan pembatasan hak database produksi: ada di daftar periksa produksi README.
- Git LFS atau penyimpanan terpisah untuk gambar (sekitar 90 MB); deploy, domain, SSL, cadangan terjadwal ditunda.
- Suara Studio hasil sintesis terdengar sederhana; bisa diganti berkas suara sungguhan di satu tempat (`pustakaSuara.js`).

## 7. Cara kerja dengan pemilik

- Bahasa **Indonesia**, **pelan-pelan**, satu keputusan per langkah (pilihan tombol untuk keputusan kecil), jelaskan istilah teknis dengan sederhana. Beri **rekomendasi tegas** dengan alasan.
- **Jangan langsung mengerjakan atau mengubah berkas bila pemilik hanya bertanya** (mis. "dikerjakan kapan?"). Jawab dulu, pastikan maksudnya bila ambigu, baru bertindak. Bila terlanjur mengubah sesuatu, katakan berkas apa yang berubah dan bahwa tidak wajib dipakai.
- **Setiap berkas yang dibuat harus disertai letak penempatannya** (path dari root project). **Prompt agen selalu di `docs/prompt/`.** Sebutkan berkas mana yang perlu diunduh dan mana yang tidak.
- Aturan untuk agen (cantumkan di tiap prompt): kode mengikuti clean architecture + DI (alur `jsx -> controller -> usecase -> model`); tiap function diberi komentar Bahasa Indonesia (cabang non-trivial diberi alasan); tanpa test kecuali diminta; **jangan menghapus kode yang tidak terpakai atau dikomen**; agen hanya memperbarui `README.md` dan bagian "Status pengerjaan" di `.kiro/steering/project-context.md`; **tidak boleh membuat `ringkasan-perubahan.md`**; laporan bug fix di `docs/reports/<nama-bug>.md` (Ringkasan, Masalah, Error, Solusi, File diubah, File baru); fitur baru tidak butuh laporan.
- Pemilik mengunggah `.kiro/steering/project-context.md` dan catatan akhir agen; jadikan versi itu dasar bila perlu mengubah (jangan menimpa catatan agen). Setelah menjalankan prompt, pemilik biasanya menaruh JSON seed di `seed/` lalu menjalankan `npm run db:seed`.
- Bila agen melaporkan "keputusan untuk pemilik", tanggapi satu per satu dengan rekomendasi.

## 8. Langkah berikutnya untuk Claude

1. Pastikan `npm run db:seed` terakhir menghasilkan **materi 36 dari 36** dan template L2/L3 versi agen (bukan versi lama berisi Scratch).
2. Bantu pemilik **menguji dengan siswa sungguhan**: durasi post test 45 menit, kenyamanan Blockly/Studio di HP, kejelasan teks untuk anak, dan alur materi lalu tugas. Uji juga **sertifikat L2 sampai lulus penuh** (bagian D "Praktik Coding"). Buat daftar periksa uji bila diminta.
3. Perbaiki temuan lewat prompt bug fix (laporan di `docs/reports/`). Kandidat kecil: kotak putih sprite di latar luar angkasa, peringatan belum tersimpan pada tombol Pulang/Keluar.
4. Bila pemilik ingin menambah fitur: tes penempatan, pengumuman/jadwal orang tua, gamifikasi, ekspor `.xlsx`, ubah nama siswa. Tiap fitur satu prompt di `docs/prompt/`.
5. Saat domain dan server siap: tulis prompt **deploy** (domain dan subdomain, SSL, reverse proxy dengan `Host` diteruskan, `JUMLAH_PROXY_TEPERCAYA`, `.env` produksi, `URL_SISWA`, cadangan database dan `uploads/`).
6. Setelah perubahan besar berikutnya, perbarui berkas ini agar chat baru tetap nyambung.
