# PROMPT: Penerapan palet biru-oranye (siswa, pengelola, orang tua; terang dan gelap)

Kamu adalah agen coding yang melanjutkan project **DigiPlay Learning** (`digiplay-learning/`). Palet warna aplikasi berganti dari ungu/indigo menjadi **biru dan oranye** mengikuti logo DigiPlay. **Token warna sudah ditulis ulang oleh pemilik** dan sudah ditaruh di `src/app/design-tokens.css` (dan `docs/design-system.md`). Tugasmu: memastikan seluruh aplikasi benar-benar memakai token baru itu, termasuk tempat yang masih memakai warna lama atau warna tetap, di tema terang dan gelap.

## Baca dulu

1. `.kiro/steering/project-context.md` dan `README.md`.
2. `src/app/design-tokens.css` (token baru) dan `docs/design-system.md` (bagian 2, 3, dan 8). **Jangan mengubah kedua berkas ini.** Bila kamu menemukan token yang kurang, jangan menambahnya sendiri; tulis di catatan akhir sebagai "keputusan untuk pemilik".
3. `ShellPengelola`, `ShellSiswa`, komponen `LogoAplikasi` (dari prompt logo), `src/modules/sertifikat/sertifikat.pdf.js`, `Konfeti`, `GrafikKemajuan`, `AreaGame`, `PapanPuzzle`.

## Aturan kerja

- **Scope:** hanya warna. Jangan mengubah tata letak, logika, bentuk, ukuran, font, atau perilaku apa pun, dan jangan mengubah konten game (warna balon, gambar subjek, kategori warna blok di Coding Zippy dan Studio Zippy, maskot Zippy).
- **Arsitektur:** tiru pola yang ada. Komponen hanya memakai token (utilitas Tailwind `bg-primary`, `text-fg`, dan seterusnya); tidak boleh ada warna keras di komponen UI.
- **Komentar:** setiap function yang kamu ubah atau tambah diberi komentar ringkas Bahasa Indonesia; percabangan non-trivial diberi komentar alasan.
- **Kompleksitas:** perubahan sekecil mungkin; tidak membuat komponen atau berkas baru kecuali benar-benar perlu (jelaskan alasannya).
- **Jangan menghapus** kode yang tidak dipakai atau yang dikomen. **Tanpa test.**
- **Dokumentasi:** perbarui hanya `README.md` (catatan palet) dan `.kiro/steering/project-context.md` (catatan teknis, hapus rujukan "ungu" yang sudah tidak berlaku, dan konstanta warna sertifikat yang baru). **Jangan membuat `ringkasan-perubahan.md`** dan tanpa laporan `docs/reports/`.
- Bila ada keputusan yang tidak bisa diambil dari prompt ini, **berhenti dan tulis "keputusan untuk pemilik"** beserta rekomendasimu.

## Ringkasan palet baru (acuan, nilai resmi ada di `design-tokens.css`)

| | Siswa | Pengelola |
|---|---|---|
| Biru utama (`primary`) | `#0A66D8` terang, `#5DA8FF` gelap | `#1D5FB0` terang, `#6CB0FF` gelap |
| Oranye (`sun`) | `#FF8A1F`, `#FFAA4D` | `#E88A2E`, `#F2A24C` |
| Latar (`bg`) | `#F3F8FF`, `#0F1A3C` | `#F2F5FA`, `#0B1220` |
| Menu samping (`nav-*`) | seperti kartu biasa | **navy** `#17284A` (terang), `#0A1426` (gelap) |

Orang tua mengikuti area siswa (`data-mode="ortu"`). Token `info` sekarang **teal**, bukan biru. Token baru `nav-bg`, `nav-fg`, `nav-muted`, `nav-line`, `nav-active-bg`, `nav-active-fg` (utilitas `bg-nav-bg`, `text-nav-fg`, dan seterusnya) khusus menu samping.

## Tahap 1: Cari dan ganti warna lama atau warna tetap

Cari di seluruh `src/` (JSX, CSS, JS, SVG inline, gaya inline, konfigurasi Tailwind jika ada), dan ganti **hanya bila warna itu bagian dari identitas atau antarmuka**, dengan token yang sepadan:

- Nilai heks palet lama: `#6240F0`, `#4F46E5`, `#5233DB`, `#4338CA`, `#4C31BB`, `#3D36B2`, `#EFEAFF`, `#ECEBFF`, `#FFF8EE`, `#2A2347`, `#1B1D3A`, `#62598A`, `#5A5F82`, `#E9E2F7`, `#E1E4F2`, `#FFC93C`, `#F59E0B`, `#C69C2E`, `#BF7B08`, `#17153A`, `#221F4D`, `#F4F1FF`, `#B7B0DE`, `#38337A`, `#A793FF`, `#BBAAFF`, `#2E2965`, `#7B6CBC`, `#FFD45E`, `#BC9C45`, `#0E1022`, `#161933`, `#E8EAFB`, `#A5AAD0`, `#2A2E55`, `#8B93FF`, `#A5ABFF`, `#222654`, `#666CBC`, `#FBBF24`, `#B98D1A`.
- Kelas warna bawaan Tailwind bernuansa ungu atau indigo (`purple-*`, `violet-*`, `indigo-*`, `fuchsia-*`) dan warna keras lain (`#hex`, `rgb(`, `hsl(`) di luar daftar pengecualian.
- Tempat khusus yang wajib dicek: bayangan dan garis fokus, `Konfeti`, `GrafikKemajuan` (garis dan area grafik), progress bar, kartu level dan lencana, latar halaman masuk, halaman 404/galat, skeleton, scrollbar, `selection`, serta **`theme-color` pada metadata/viewport** bila sudah ada (nilai terang dan gelap sesuai `bg` siswa).
- Untuk **`info`** (kini teal): periksa tempat yang memakai `info` untuk arti "tautan atau aksi biru"; aksi harus memakai `primary`/`primary-text`, informasi netral memakai `info`.

**Pengecualian (jangan diubah):** warna isi game (balon, keranjang, labirin, papan puzzle, panggung Studio), kategori warna blok Blockly (Coding Zippy, Studio Zippy), gambar subjek dan maskot, dan warna semantik `ok`, `warn`, `bad` yang tidak berubah.

## Tahap 2: Menu samping pengelola

- `ShellPengelola` (menu samping desktop **dan** laci di HP) memakai token `nav-*`: latar `bg-nav-bg`, teks `text-nav-fg`, teks sekunder `text-nav-muted`, garis `border-nav-line`, item aktif `bg-nav-active-bg text-nav-active-fg`. Menu samping siswa tidak diubah.
- Karena latar menu samping gelap (navy) **di kedua tema**, logo (`LogoAplikasi` varian `utama` dan `ikon`) di header menu itu **dibungkus wadah terang** seperti aturan logo di tema gelap. Perluas aturan wadah terang di `LogoAplikasi` agar juga berlaku di permukaan gelap ini, bukan hanya di tema gelap. Tulisan "Learning" berwarna biru tua dan tidak terbaca di atas navy tanpa wadah.
- Fokus keyboard, hover, dan item terkunci di menu samping tetap terbaca (periksa dengan token `nav-*`).

## Tahap 3: PDF sertifikat

Konstanta warna di `sertifikat.pdf.js` (saat ini ungu dan krem) disesuaikan dengan palet baru, dengan angka tetap (PDF tidak membaca token CSS):

- Ungu menjadi **biru** `#0A56B8` (judul, bingkai, garis).
- Aksen menjadi **oranye** `#E88A2E` (ornamen kecil atau garis pemisah).
- Teks utama navy `#1B2A4D`, teks sekunder `#52617F`.
- Latar krem boleh tetap (kertas hangat) selama tulisan tetap terbaca dan cetak hitam-putih masih jelas.
- Watermark "DIBATALKAN" tetap warna merah seperti sekarang.
- Unduh satu sertifikat contoh dan periksa: tanda tangan, logo sertifikat, dan QR tetap terbaca.

## Tahap 4: Pemeriksaan di semua layar

Telusuri halaman area **siswa**, **orang tua**, dan **pengelola**, plus halaman masuk dan halaman verifikasi publik, di tema **terang dan gelap**, pada lebar **360, 768, 1280 px**, dengan cara otomatis yang sudah dipakai di project (termasuk deteksi luapan mendatar):

- Tidak ada warna ungu/indigo tersisa di antarmuka (kecuali pengecualian di atas).
- Teks dan latar tetap terbaca di semua keadaan: biasa, hover, fokus, nonaktif, galat, terpilih, dan lencana status.
- Tombol 3D siswa (bibir bawah `*-edge`) dan tombol datar pengelola masih tampak benar.
- Hasilnya dirangkum di catatan akhir; temuan kontras yang kamu ragukan dilaporkan, bukan diperbaiki dengan mengubah token.

## Kriteria selesai

1. Tidak ada nilai heks palet lama dan tidak ada kelas Tailwind ungu/indigo yang tersisa di `src/` (kecuali pengecualian), dan tidak ada warna keras baru di komponen UI.
2. Siswa dan orang tua tampil biru-oranye cerah; pengelola tampil biru dalam dengan **menu samping navy**; keduanya jelas berbeda tetapi satu keluarga.
3. Terang dan gelap bekerja di semua halaman dan tidak ada teks yang sulit terbaca.
4. Logo di menu samping pengelola terbaca (wadah terang), di terang dan gelap.
5. PDF sertifikat memakai palet baru dan tetap rapi.
6. Maskot, konten game, dan warna blok tidak berubah.

## Catatan akhir (wajib)

Tulis ringkasan singkat di chat (bukan berkas): berkas yang diubah, daftar warna tetap yang ditemukan beserta penggantinya, tempat yang sengaja tidak diubah, hasil pemeriksaan tahap 4, dan **keputusan untuk pemilik** (mis. token yang kurang). Pastikan `README.md` dan `.kiro/steering/project-context.md` diperbarui.
