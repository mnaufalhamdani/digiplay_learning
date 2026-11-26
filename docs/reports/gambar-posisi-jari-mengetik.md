# Gambar referensi posisi jari di pelajaran mengetik

## Ringkasan
Halaman latihan mengetik siswa kini menampilkan gambar kecil posisi jari (`public/aset/mengetik/posisi-jari.png`) di sisi kanan bawah area ketik pada layar lebar, dan sebagai panel tertutup di bawah area ketik pada layar sempit (HP). Bila berkasnya tidak ada, gambar tidak ditampilkan dan halaman tidak error.

## Masalah
Siswa tidak punya pengingat posisi tangan saat latihan mengetik. Pemilik menyediakan gambar jari berwarna per zona, dan halaman perlu menampilkannya tanpa mengganggu input.

## Error
Tidak ada. Berkas gambar yang diberikan pemilik awalnya JPG berlatar putih (2752x1536); dikonversi menjadi PNG transparan (860 KB) sebelum dipakai.

## Solusi
- `HalamanMengetik` (server) memeriksa berkas lewat `folderAset` dari DI; bila tidak ada, `gambarJari` bernilai `null` dan tidak ada yang ditampilkan.
- `KlienMengetik`: komponen kecil `PosisiJari` (elemen `<details>`) muncul hanya saat sebuah latihan aktif. Layar lebar (>= 1024 px): terbuka, di kolom kanan selebar 18rem dan sejajar dengan tepi bawah kartu ketik (kanan bawah). Layar sempit: tertutup, di bawah kartu ketik, sehingga area ketik tidak terdorong keluar layar. Gambar bisa dibuka/ditutup di kedua ukuran. Kolom grid hanya dibagi bila gambar ada, dan bila gambar gagal dimuat (`onError`, atau sudah gagal sebelum React terpasang) panel dihilangkan tanpa ikon gambar rusak. Pola `<img>` + `onError` mengikuti komponen `Maskot`.
- Teks alternatif Bahasa Indonesia "Posisi jari di atas keyboard"; memakai kelas tema yang sama dengan komponen lain (`bg-panel`, `border-line`), sehingga mengikuti mode terang dan gelap. Gambar PNG transparan terlihat jelas di latar gelap.
- Komponen baru dibuat karena `Maskot` hanya untuk folder maskot dengan rasio 3:4; polanya dipakai ulang di dalam `KlienMengetik.jsx` (tanpa berkas baru).
- **Pengujian manual:** `/mengetik` pada lebar 1280 px menampilkan panel terbuka di kanan bawah area ketik (gambar termuat); pada 390 px panel tertutup di bawah area ketik, tanpa luapan mendatar (lebar dokumen 390 px). Dengan berkas diganti nama sementara, halaman `/mengetik` tetap terbuka tanpa panel posisi jari (tidak ada elemen `<details>`, tidak ada galat); berkas lalu dikembalikan.

## File diubah
- `src/modules/mengetik/HalamanMengetik.jsx`
- `src/modules/mengetik/KlienMengetik.jsx`
- `src/locales/id_ID.json`

## File baru
- `public/aset/mengetik/posisi-jari.png` (hasil konversi dari `posisi-jari.jpg`, dikerjakan sebelum prompt ini)
