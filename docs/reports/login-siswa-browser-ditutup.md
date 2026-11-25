# Login siswa ditolak setelah browser tertutup tidak sengaja

## Ringkasan
Siswa yang tidak sengaja menutup browser lalu membukanya lagi di PC yang sama ditolak dengan pesan "Kodemu sedang dipakai di perangkat lain". Sekarang browser yang sama langsung masuk lagi tanpa memasukkan kode, selama login perangkat belum diakhiri.

## Masalah
- Gejala: siswa A masuk dengan kodenya di browser PC A, browser tertutup, lalu dibuka lagi. Saat kode dimasukkan, login ditolak seolah kode dipakai di perangkat lain.
- Akar penyebab: cookie `dp_siswa` dibuat tanpa masa berlaku (cookie sesi browser), sehingga hilang saat browser ditutup. Baris `login_perangkat` di server masih aktif sampai batas tidak aktif (5 menit) terlewati. Browser yang dibuka lagi tidak lagi membawa token, jadi server menganggapnya perangkat baru dan menolak sesuai aturan satu kode satu perangkat.

## Error
```
Kodemu sedang dipakai di perangkat lain. Tekan Ganti device di perangkat itu atau minta bantuan tutor.
```
(`AppError` 409 dari `bukaLoginSiswa` di `auth.usecase.ts`)

## Solusi
- Cookie `dp_siswa` sekarang diberi masa berlaku 12 jam (`masaCookieSiswaJam` di `keamanan.config.js`), sehingga tetap ada setelah browser ditutup. Saat dibuka lagi, beranda langsung terbuka, dan halaman masuk mengarahkan ke beranda (perilaku ini sudah ada sebelumnya).
- Aturan lain tidak berubah. Perangkat lain tetap ditolak selama login pertama aktif. Ganti device, Pulang, dan Keluar tetap menghapus cookie. Login tetap berakhir otomatis bila diam melewati batas tidak aktif, dan setelah itu siswa masuk dengan kode seperti biasa tanpa ditolak.
- Diuji lewat HTTP ke dev server:
  - cookie memakai `Max-Age=43200`
  - membuka beranda lagi dengan cookie yang sama berhasil, dan `/masuk` mengarahkan ke `/`
  - perangkat lain ditolak
  - setelah diam 6 menit diarahkan ke `/masuk`, lalu masuk dengan kode berhasil
  - Ganti device menghapus cookie dan login ulang berhasil
- Catatan: di PC bersama, siswa lain yang membuka browser yang sama sebelum batas tidak aktif habis akan masuk sebagai siswa sebelumnya. Risiko ini sama seperti saat browser dibiarkan terbuka. Siswa tetap perlu menekan Ganti device atau Pulang sebelum meninggalkan PC.

## File diubah
- `src/config/keamanan.config.js`
- `src/modules/auth/auth.usecase.ts`
- `src/modules/auth/auth.controller.ts`
- `README.md`
- `project-context.md`

## File baru
- `docs/reports/login-siswa-browser-ditutup.md`
