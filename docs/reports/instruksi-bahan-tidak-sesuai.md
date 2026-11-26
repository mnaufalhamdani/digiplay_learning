# Instruksi bahan tidak sesuai, dan mewarnai.png belum dipakai

## Ringkasan
Instruksi tugas menyebut nama bahan dan "menu Bahan", butir post test tidak punya cara mengunduh bahan sama sekali, dan tugas menggambar memakai subjek di luar 75 gambar. Sekarang instruksi cukup "Unduh bahan" dengan tombol di dalam instruksi, tugas menggambar/mewarnai memakai `mewarnai.png` dari 75 subjek, dan menu Bahan dihapus.

## Masalah
- **L1 P9 (Word 2):** pemilik menerima file roket padahal instruksi menyebut "Mobil pemadam kebakaran". **Penyebab pasti tidak terbukti dari kode atau data.** Yang diperiksa: nama di `soal_teks`, `parameter_hasil.gambar`, dan berkas yang dibaca saat unduh berasal dari satu parameter subjek yang sama (`renderTemplate` -> `parameter_hasil.gambar[{kode, nama, jenis}]` -> `tugas.unduh` membaca `public/aset/gambar/<kode>/<jenis>.png`). Pada 10 tugas bergambar di database tidak ada nama yang tidak cocok, `knd-12` memang gambar mobil pemadam dan `knd-13` roket, dan unduhan tugas P9 hasil uji identik (MD5) dengan `knd-12/berwarna.png`. Dugaan terkuat: pemilik mengunduh dari halaman **Bahan**, yang memuat satu kartu per gambar dari semua tugas sesi dengan tombol yang seragam ("Unduh"), sehingga unduhan dari kartu lain (mis. Roket) mudah tertukar dengan instruksi tugas. Dugaan lain: tugas lama yang teksnya dibuat sebelum seed diperbarui. Perbaikan di bawah menghilangkan halaman itu dan memindahkan tombol ke kartu tugas.
- **L1 P13 (post test):** instruksi "unduh ... dari menu Bahan", padahal butir post test tidak pernah muncul di menu Bahan (`tugasModel` hanya memuat `post_test_id IS NULL`) dan rute `/tugas/unduh` menolaknya. Siswa tidak punya cara mengunduh bahan sama sekali.
- **L1 P6 (Paint 1):** tidak ada tugas yang memakai `mewarnai.png`; tugas menggambar memakai objek bebas (rumah, kucing, pemandangan, bintang, ...) di luar 75 subjek.
- **Audit seed (Level 1-3):** instruksi dengan "menu Bahan"/nama bahan: L1-P07-PR-01, L1-P09-PR-03, L1-P09-PR-04, L1-P13-C-05, L1-P13-D-03, L2-P04-PR-02, L2-P05-PR-02, L2-P13-B-04, L3-P05-PR-04, L3-P11-PR-01, L3-P13-D-06; gambar bahan tanpa kata "bahan": L3-P04-PR-03; menggambar/mewarnai dengan subjek di luar 75: L1-P06-PR-01, L1-P06-PR-03, L1-P06-PR-04, L1-P13-C-01, L1-P13-C-02, L1-P13-C-04, L3-P06-PR-03.
- **Aset (di luar lingkup, hanya dicatat):** `outline.png` milik `knd-07` (Kapal) dan `knd-08` (Perahu layar) identik (MD5 sama), jadi `mewarnai.png` salah satunya memuat outline subjek lain. Perlu dibuat ulang oleh pemilik.

## Error
Tidak ada pesan error. Perilaku salah: unduhan tidak ada untuk butir post test, dan instruksi merujuk ke menu yang bukan tempat unduhannya.

## Solusi
- **19 template seed diubah** (`seed/template-level-1.json` 11, `-2.json` 3, `-3.json` 5), lalu `npm run db:seed` (validasi 50 kali render per template, 19 diperbarui):
  - Teks menjadi "Unduh bahan ..." tanpa nama subjek dan tanpa "menu Bahan"; parameter gambar tetap dipilih lewat `{dari: gambar, jenis}` dan tidak ditulis di teks.
  - Tugas menggambar/mewarnai memakai `jenis: mewarnai` (L1-P06-PR-01/03/04, L1-P13-C-01/02/04, L3-P06-PR-03); tugas sisip gambar tetap `berwarna`. Tugas alat Shapes (L1-P06-PR-02) dan poster bertema bebas tidak diubah karena tidak memakai subjek gambar.
- **Tombol unduh:** `KartuTugas` menampilkan **Unduh bahan** (bernomor "Unduh bahan 1/2" bila lebih dari satu) tepat di bawah instruksi. Butir post test mendapat tombol yang sama (`KlienPostTest`) lewat rute baru `GET /api/v1/posttest/unduh` (akses siswa, hanya butir milik siswa itu pada post test yang sedang berjalan, nama subjek dicek terhadap `parameter_hasil`). `namaUnduhan` di `tugas.usecase.ts` diekspor agar dipakai bersama.
- **Validasi:** `validasiTemplate` menolak teks yang menyebut "menu Bahan", menulis penanda parameter gambar bahan unduhan, atau memakai gambar bahan tanpa kata "bahan"; parameter gambar bahan dikecualikan dari aturan "parameter harus dipakai di teks". Diuji dengan lima teks contoh.
- **Menu Bahan dihapus (atas permintaan pemilik):** item menu di `ShellSiswa`, halaman `/siswa/bahan`, `HalamanBahan`, `KartuGambar`, dan kunci teks terkait.
- **Verifikasi:** unduhan tugas P7 (`tnm-14` mewarnai) dan P9 (`knd-12` berwarna) identik dengan berkas aslinya; unduhan butir P13 (`bln-05` mewarnai) identik, kode subjek salah dijawab 404, tanpa login 401.
- **Dampak ke data lama:** tugas dan butir yang sudah dibuat menyimpan `soal_teks` sendiri (tidak ikut berubah). Tugas lama masih menyebut "dari menu Bahan" dan nama subjek di teksnya, tetapi tombol **Unduh bahan** tetap muncul tepat di bawahnya dan berfungsi. Tugas lama yang tidak bergambar atau puzzle tidak terpengaruh. Tugas yang sudah dikerjakan tidak diubah. Bookmark `/bahan` kini 404.

## File diubah
- `seed/template-level-1.json`
- `seed/template-level-2.json`
- `seed/template-level-3.json`
- `src/utils/templateValidasi.js`
- `src/locales/id_ID.json`
- `src/modules/tugas/KartuTugas.jsx`
- `src/modules/tugas/tugas.usecase.ts`
- `src/modules/posttest/KlienPostTest.jsx`
- `src/modules/posttest/posttest.usecase.ts`
- `src/modules/posttest/posttest.controller.ts`
- `src/modules/posttest/posttest.schema.js`
- `src/modules/posttest/posttest.routes.js`
- `src/modules/layout/ShellSiswa.jsx`
- `README.md`
- `.kiro/steering/project-context.md`

## File baru
- tidak ada

(File dihapus: `src/app/siswa/bahan/page.jsx`, `src/modules/sesi/HalamanBahan.jsx`, `src/modules/shared/ui/domain/KartuGambar.jsx`.)
