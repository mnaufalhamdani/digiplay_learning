# Sistem Desain DigiPlay Learning

Dokumen ini pasangan dari `design-tokens.css`. Tanda **⚠** = usulan yang belum kamu konfirmasi.

## 1. Prinsip

1. **Ramah anak, bukan kekanak-kanakan.** Warna cerah dan bentuk bulat, tetapi tata letak rapi dan teks mudah dibaca (anak 6-13 tahun).
2. **Satu set komponen, dua "kepribadian".** Area siswa playful, area pengelola tenang. Perbedaannya hanya variabel di `design-tokens.css`, tanpa kode ganda.
3. **Terang dan gelap di semua halaman.** Mode gelap berwarna biru malam (bukan hitam pekat) dengan aksen cerah.
4. **Mobile-first untuk pengelola dan orang tua**, adaptif untuk siswa (kemungkinan memakai PC).
5. **Tidak mengandalkan warna saja.** Setiap status punya teks atau ikon (benar/salah, tuntas/sebagian, hadir/pulang).
6. **Aman untuk pengguna yang sensitif gerak.** Animasi dekoratif mati bila pengguna memilih "kurangi gerakan".

## 2. Cara kerja tema

- Mode gelap: class `dark` pada `<html>`, memakai skrip anti-kedip `SKRIP_TEMA` yang sama dengan DK Docs (kunci `theme` di localStorage, ikut pengaturan sistem bila belum dipilih).
- Area: atribut `data-area="siswa"` atau `data-area="pengelola"` pada pembungkus layout masing-masing. Pembungkus wajib `min-h-dvh bg-bg text-fg font-body` agar latar penuh mengikuti tema.
- Orang tua: area siswa dengan `data-mode="ortu"` (⚠): huruf 16 px, tombol datar, lebih tenang.
- Halaman verifikasi sertifikat publik: memakai area `pengelola` (netral) dengan nama pelatihan dan logo dari pengaturan admin.
- Teks `nama pelatihan`, `perusahaan`, dan `logo` selalu dibaca dari pengaturan, tidak ditulis keras di komponen.
- Logo bertulisan biru tua ("Learning"), sehingga **di latar gelap logo utama dan persegi-teks dibungkus wadah terang**. Ini berlaku di tema gelap dan di menu samping navy area pengelola.

## 3. Palet

Palet mengikuti logo DigiPlay: **biru** (aksi utama), **oranye** (pencapaian), dan **navy** (teks). Semua nilai ada di `design-tokens.css`. Semua **144 pasangan teks/latar lulus WCAG AA** (teks normal ≥ 4,5:1; fokus dan garis aksi ≥ 3:1).

| Token | Siswa terang | Siswa gelap | Pengelola terang | Pengelola gelap |
|---|---|---|---|---|
| `bg` (latar) | #F3F8FF | #0F1A3C | #F2F5FA | #0B1220 |
| `panel` (kartu) | #FFFFFF | #182758 | #FFFFFF | #121C31 |
| `fg` (teks) | #1B2A4D | #EEF4FF | #172033 | #E6ECF8 |
| `muted` (teks sekunder) | #52617F | #AFBEE3 | #566380 | #9FAECB |
| `primary` (aksi utama) | #0A66D8 | #5DA8FF | #1D5FB0 | #6CB0FF |
| `sun` (aksen hangat) | #FF8A1F | #FFAA4D | #E88A2E | #F2A24C |
| `info` | #0B6A86 | #5FD3EC | #0B6A86 | #5FD3EC |
| `nav-bg` (menu samping) | #FFFFFF | #182758 | #17284A | #0A1426 |
| `ok` / `warn` / `bad` | hijau / amber / koral, tiap warna punya versi `-soft` untuk latar lencana (tidak berubah dari palet sebelumnya) | | | |

Pembeda dua area (satu keluarga warna):
- **Siswa:** biru cerah, oranye menyala, latar putih kebiruan, tombol 3D gemuk.
- **Pengelola:** biru lebih dalam dan tenang, oranye lebih teredam, latar abu kebiruan, **menu samping navy** (token `nav-*`) di terang maupun gelap, tombol datar.
- **Orang tua:** area siswa dengan mode lebih tenang (`data-mode="ortu"`), warna sama dengan siswa.
- Tema gelap siswa: biru malam yang lebih jenuh; tema gelap pengelola: biru kehitaman yang lebih netral.
- `info` sekarang **teal** (bukan biru) supaya tidak tertukar dengan `primary` yang biru; lencana info tetap berisi teks atau ikon.

Makna warna (konsisten di dua area):
- `primary` = aksi utama, tautan, pilihan aktif
- `sun` = pencapaian, poin, level, sorotan (oranye)
- `ok` = benar, tuntas, hadir
- `warn` = tuntas sebagian, perlu perhatian
- `bad` = salah, tidak tuntas, aksi berbahaya
- `info` = informasi netral (teal)

Tombol 3D memakai `*-edge` (versi lebih gelap dari warna tombol) sebagai "bibir" bawah.

`nav-bg`, `nav-fg`, `nav-muted`, `nav-line`, `nav-active-bg`, `nav-active-fg` dipakai menu samping. Di area siswa nilainya sama dengan tampilan kartu biasa; di area pengelola berlatar navy di kedua tema.

## 4. Tipografi

- **Fredoka** untuk judul area siswa (bulat, ramah), **Nunito** untuk semua teks. Keduanya lewat `next/font` (dipasang lokal, tanpa CDN). ⚠ pilihan font.
- Ukuran dasar: siswa 18 px, pengelola 14 px (sama dengan DK Docs), orang tua 16 px.
- Judul siswa tebal; angka (skor, WPM, timer) memakai angka tabular agar tidak "bergoyang".

## 5. Bentuk dan ukuran

| | Siswa | Pengelola |
|---|---|---|
| Lengkung kartu / tombol | 18-28 px / 16 px | 10-16 px / 10 px |
| Tinggi kontrol minimum | 48 px (besar 56 px) | 40 px (besar 44 px) |
| Tombol | "gemuk" 3D: bibir bawah 5 px, menekan turun saat diklik | datar |

- Area sentuh minimal 44 px di semua area (mobile).
- Fokus keyboard: garis 3 px warna `primary`, jarak 2 px.

## 6. Gerak

- Durasi: 120 / 200 / 320 ms. Kurva sedikit memantul (`--ease-pegas`) untuk tombol dan lencana.
- Animasi kecil saat berhasil (konfeti, maskot bereaksi, angka skor naik).
- Semua animasi dekoratif dimatikan oleh `prefers-reduced-motion`; informasi tidak pernah hanya disampaikan lewat animasi.

## 7. Komponen

Letak: `src/modules/shared/ui/` (satu file per komponen). Primitif memakai nama Inggris umum, komponen domain memakai nama Indonesia (sejalan dengan `Badge.jsx` dan `TombolAksi.jsx` di DK Docs). Semua komponen hanya memakai token, tidak ada warna keras.

### 7.1 Primitif

| Komponen | Props utama | Catatan |
|---|---|---|
| `Button` | `varian` (primary, secondary, sukses, bahaya, hantu), `ukuran` (md, lg), `ikon`, `memuat`, `penuh` | Siswa: 3D gemuk. Pengelola: datar. Status memuat menampilkan spinner dan menonaktifkan klik. |
| `TextField` | `label`, `petunjuk`, `galat`, `awalan`, `akhiran`, `ukuran` | Pesan galat berupa teks + ikon, bukan hanya garis merah. Label selalu tampak (tidak hanya placeholder). |
| `Select` | `label`, `opsi`, `galat` | Memakai kontrol bawaan di HP agar nyaman. |
| `Checkbox`, `Switch` | `label`, `dicentang`, `nonaktif` | Switch untuk pengaturan admin. |
| `Card` | `varian` (polos, terangkat, berwarna) | Pembungkus utama konten. |
| `Badge` | `nada` (netral, primer, sukses, peringatan, bahaya, info) | Status: Hadir, Pulang, Tuntas, Tuntas sebagian, Tidak tuntas, Dilewati, Lulus. Selalu berisi teks. |
| `ProgressBar` | `nilai`, `maks`, `label` | Siswa: berbentuk pil, mengisi dengan animasi. |
| `Modal` | `terbuka`, `judul`, `tutup` | Fokus terkunci di dalam, Esc menutup. |
| `ConfirmDialog` | `judul`, `pesan`, `labelYa`, `labelBatal`, `nada` (biasa, bahaya), `maskot` | Untuk Pulang, Ganti device, hapus, batalkan sertifikat. Pada nada `bahaya`, fokus awal ada di tombol Batal. Siswa: maskot + tombol besar dan kalimat singkat. |
| `Tabs` | `tab`, `aktif` | Bisa digulir mendatar di HP. |
| `Toast` | `nada`, `pesan` | Pesan singkat otomatis hilang, dibacakan pembaca layar (`aria-live`). |
| `Skeleton` | `bentuk` | Penanda saat memuat data. |
| `EmptyState` | `judul`, `pesan`, `aksi` | Memakai maskot di area siswa. |
| `TabelResponsif` | `kolom`, `baris`, `kartuHP` | Di layar sempit berubah menjadi daftar kartu (tabel tidak pernah menggulir mendatar di HP). |

### 7.2 Komponen domain

| Komponen | Fungsi |
|---|---|
| `KolomKode` | Input kode unik 8 karakter: 8 kotak, huruf otomatis kapital, mendukung tempel, berpindah kotak otomatis, kotak aktif terlihat jelas. |
| `OpsiJawaban` | 4 kartu besar untuk soal pilihan ganda. Mode latihan menampilkan benar/salah (warna + ikon + teks); mode post test tidak menampilkan jawaban benar. |
| `KartuTugas` | Satu tugas: teks, status (belum, selesai, dilewati, diganti), tombol Ganti tugas dan Lewati, tombol Unduh bahan bila ada gambar. |
| `Pewaktu` | Hitung mundur post test (45 menit). Pada 5 menit terakhir berubah ke nada `warn` dengan teks "Sisa waktu 5 menit", bukan hanya warna. |
| `StatusSesi` | Menunggu absen, Sesi aktif (jam mulai, lama berjalan), Selesai. |
| `Maskot` | Zippy, maskot sugar glider "Pahlawan Anti-Gaptek" (lihat 7.3). Props: `suasana` (sapa, menunjuk, semangat, berpikir, merayakan, menyemangati, tidur, terbang), `ukuran`. Dipakai di dialog, layar kosong, hasil tes, login. |
| `Konfeti` | Perayaan saat lulus atau naik level. Dimatikan bila pengguna mengurangi gerakan. |
| `KartuGambar` | Pratinjau subjek gambar dengan tombol Unduh (mewarnai.png atau berwarna.png). |
| `AreaGame` | Wadah game mouse: HUD skor dan waktu, area bermain yang menyesuaikan ukuran layar. |
| `PapanPuzzle` | Papan puzzle drag and drop (2x2, 2x3, 3x3) yang juga bisa dioperasikan dengan sentuhan. |
| `GrafikKemajuan` | Grafik garis sederhana (SVG) untuk WPM dan akurasi. |

### 7.3 Maskot Zippy

- **Wujud:** sugar glider bergaya superhero: topeng dan aksen oranye, setelan biru, lambang petir di dada, selaput sayap dengan garis cyan bercahaya. Julukan: **Pahlawan Anti-Gaptek** ("Digital Superhero"). Pose referensi saat ini: menunjuk.
- **Peran:** pemandu dan penyemangat, bukan penilai. Zippy tidak pernah muncul dengan ekspresi mengejek saat siswa salah; ekspresi "menyemangati" dipakai untuk jawaban salah atau tugas dilewati.
- **Pemetaan suasana ke layar:**

| Suasana | Dipakai di |
|---|---|
| sapa (melambai) | Login kode, dialog Pulang ("Sampai jumpa!") |
| menunjuk | Beranda, petunjuk tugas, menu Bahan |
| semangat | Pewaktu 5 menit terakhir, game dimulai |
| berpikir | Soal pilihan ganda, loading singkat |
| merayakan | Tugas tuntas, lulus post test, sertifikat terbit (bersama `Konfeti`) |
| menyemangati | Jawaban salah, tugas dilewati, belum lulus ("Ayo coba lagi!") |
| tidur | Belum absen (mode lihat saja), layar kosong |
| terbang | Memuat data |

- **Warna:** biru dan oranye Zippy kini **selaras dengan palet** (`primary` biru, `sun` oranye `#FF8A1F`, sama dengan oranye Zippy), sehingga Zippy menyatu dengan logo dan tetap terbaca di atas latar putih kebiruan maupun biru malam.
- **Aset:** PNG **berlatar transparan** (wajib untuk mode gelap), satu berkas per suasana di `public/aset/maskot/`, nama `zippy-<suasana>.png`. Seluruh badan berorientasi **potret 3:4** (misalnya 768 x 1024 px); `zippy-wajah.png` **persegi 1:1** (512 x 512 px). Pose harus konsisten dengan gambar referensi. Status: gambar yang tersedia sudah transparan dan siap dipakai.
- **Pemakaian:** jangan diwarnai ulang atau diberi filter; beri jarak bebas minimal 12 px di sekelilingnya; di layar ≤ 640 px ukurannya boleh mengecil tetapi tidak di bawah 96 px.

### 7.4 Ikon

- **Pilihan (disetujui): Phosphor Icons** (`@phosphor-icons/react`, lisensi MIT). Alasannya: tersedia dalam 6 bobot (Thin, Light, Regular, Bold, Fill, Duotone) sehingga satu pustaka cukup untuk dua area: **siswa memakai `bold` atau `duotone`** (tebal dan ramah), **pengelola memakai `regular`** (tenang). Pustaka ini mendukung tree-shaking sehingga hanya ikon yang dipakai yang masuk ke bundel, dan menyediakan dukungan SSR untuk React Server Components lewat submodul `/dist/ssr`.
- **Cara memakai:** bungkus dalam satu komponen `Ikon` (`src/modules/shared/ui/Ikon.jsx`) yang memilih bobot dari area (`siswa` atau `pengelola`), jangan mengimpor Phosphor langsung di halaman. Varian SSR tidak memakai React Context sehingga tidak mewarisi gaya dari `IconContext`, jadi bobot dikirim lewat prop oleh `Ikon`, bukan lewat context.
- **Alternatif:** Lucide (`lucide-react`), ringan dengan gaya garis yang konsisten, tetapi setahuku tanpa varian duotone sehingga area siswa terasa kurang ramah.
- Ikon selalu berpasangan dengan teks pada aksi penting (Pulang, Ganti device); ikon saja hanya untuk aksi yang sudah umum (tema, tutup).

## 8. Layout

**ShellSiswa**
- Header: logo dan nama pelatihan, chip level, `StatusSesi`, tombol tema. Saat sesi aktif tampil juga tombol **Ganti device** dan **Pulang**.
- Menu: Beranda, Latihan Mouse, Puzzle, Mengetik, Bahan, Karya. Desktop: menu samping berisi ikon besar. HP: menu bawah.
- Saat belum absen (mode lihat saja): menu latihan dan tes terkunci dengan penjelasan ramah ("Minta kakak tutor mencatat kehadiranmu dulu").

**ShellPengelola**
- Menu samping berlatar navy (token `nav-*`) di terang dan gelap, dengan logo dalam wadah terang: Absensi, Siswa, Level dan Materi, Template, Gambar, Sertifikat, Pembayaran, Pengaturan, Log. Item yang hanya untuk admin tidak tampil bagi tutor.
- HP: menu samping menjadi laci (drawer) dan aksi utama (Absen masuk) tampil sebagai tombol mengambang.
- Header: nama pengguna, peran, tombol tema.

## 9. Responsif

| Lebar | Perilaku |
|---|---|
| < 640 px (HP) | Satu kolom, menu bawah (siswa) atau laci (pengelola), tabel menjadi kartu |
| 640-1023 px (tablet) | Dua kolom bila perlu, menu samping ringkas (ikon) |
| ≥ 1024 px (PC) | Menu samping penuh, tabel penuh |

## 10. Kode akses di antarmuka

- Alfabet kode: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tanpa O, I, 0, 1; 32 karakter, sekitar 1,1 triliun kombinasi untuk 8 karakter). ⚠ Pembuat kode di backend memakai alfabet yang sama.
- Karakter di luar alfabet (misalnya O, I, 0, 1) tidak diterima dan diberi pesan ramah; sistem tidak menebak atau mengganti karakter secara otomatis.
- Pesan gagal login tidak membedakan "kode tidak ada" dan "kode salah". Setelah terlalu banyak percobaan tampil pesan "Coba lagi nanti".

## 11. Layar kunci (untuk mockup berikutnya)

1. Login kode siswa
2. Beranda siswa saat sesi aktif (daftar tugas hari ini)
3. Dialog Pulang (ConfirmDialog dengan maskot)
4. Game Pecahkan Balon
5. Post test (timer, navigasi butir)
6. Tutor: absen masuk (input kode, pilih pertemuan)
7. Tutor: detail sesi (tugas siswa, catatan, status penuntasan)
8. Orang tua: rapor dan sertifikat

## 12. Berkas

```
src/app/globals.css            @import "tailwindcss"; @import "./design-tokens.css";
src/app/design-tokens.css      token warna, bentuk, dan gerak
src/modules/shared/ui/         Button.jsx, TextField.jsx, ConfirmDialog.jsx, ...
src/modules/shared/ui/domain/  KolomKode.jsx, OpsiJawaban.jsx, Pewaktu.jsx, ...
public/aset/maskot/            zippy-<suasana>.png (latar transparan)
public/aset/logo/              logo-landscape.png, logo-persegi.png, logo-persegi-teks.png
src/modules/shared/ui/Ikon.jsx  pembungkus ikon Phosphor (bobot mengikuti area)
```

## 13. Keputusan

Disetujui:
- Font Fredoka + Nunito.
- Palet biru-oranye dari logo (biru `#0A66D8` siswa, `#1D5FB0` pengelola, oranye `#FF8A1F` siswa, `#E88A2E` pengelola). Menggantikan palet ungu/indigo sebelumnya.
- Tiga varian logo (landscape, ikon, persegi-teks) dan favicon.
- Maskot **Zippy** (sugar glider, "Pahlawan Anti-Gaptek").
- Mode orang tua sebagai varian area siswa dengan tampilan lebih tenang.
- Set ikon: Phosphor Icons (lihat 7.4).

Masih terbuka:
- ⚠ Pose Zippy tambahan (8 suasana, prompt ada di `docs/aset/prompt-maskot.md`) dan versi bertransparansi dari pose saat ini.
