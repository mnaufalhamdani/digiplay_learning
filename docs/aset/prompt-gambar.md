# Prompt Gambar DigiPlay Learning

75 subjek (5 kategori × 15). Setiap subjek punya 3 jenis gambar. Prompt lengkap per subjek ada di `prompt-gambar.csv`; di file ini ada 3 prompt dasar dan daftar subjek.

## Cara pakai

1. Pilih subjek, ganti `{en}` pada prompt dasar dengan nama Inggrisnya.
2. Generate **outline** lebih dulu. Pilih hasil yang garisnya tertutup dan tanpa teks.
3. Generate **berwarna** (3 warna). Jika generatormu bisa memakai gambar referensi, lampirkan outline tadi dan pakai prompt *Berwarna dari outline* agar bentuknya sama persis.
4. Generate **puzzle** hanya untuk subjek yang dipakai di puzzle.
5. Simpan semua file sesuai bagian *Penamaan dan folder* di bawah (satu folder per subjek).
6. Jalankan skrip `gabung-mewarnai.mjs`: skrip menggabungkan `outline.png` + `berwarna.png` menjadi `mewarnai.png` (contoh berwarna di pojok kiri bawah). Ini langkah mekanis, tidak memakai AI.

## 3 prompt dasar

**Outline (untuk mewarnai di Paint)**
```
Children's coloring page of a cute {en}, simple friendly cartoon style, thick clean black outline only, pure white background, no shading, no gray, no color fill, large simple shapes with big closed areas that are easy to color, single subject centered with generous white margin on all sides and an empty bottom-left corner, no text, no border, square image.
```

**Berwarna (contoh pewarnaan di pojok kiri bawah, dan gambar untuk Word)**
```
Cute friendly cartoon {en}, flat vector style, thick black outline, filled with only 3 flat colors in total (plus the black outline), no gradients, no shading, simple shapes, pure white background, single subject centered, no text, square image.
```

**Berwarna dari outline (hasilnya disimpan sebagai `berwarna.png`, bukan `mewarnai.png`; pakai jika generator bisa melampirkan gambar referensi)**
```
Color this exact coloring page using only 3 flat colors. Keep the same lines and shapes, no gradients, no shading, pure white background, no text.
```

**Puzzle (sedikit elemen, latar berwarna agar kepingan mudah dibedakan)**
```
Cute friendly cartoon {en}, flat vector style, bright distinct colors, one single main subject filling about 70% of the frame, simple plain pastel background, at most one tiny decoration, no extra objects, no text, square image.
```

## Penamaan dan folder

Satu folder per subjek, nama folder = kode subjek (huruf kecil). Nama subjek tidak dipakai di folder karena disimpan di CSV/database, jadi tidak ada yang perlu diganti kalau nama diubah.

```
aset/gambar/
  hwn-01/
    outline.png     garis hitam saja (bahan gabungan)
    berwarna.png    contoh 3 warna (juga dipakai untuk tugas Word)
    puzzle.png      latar berwarna, objek besar
    mewarnai.png    HASIL GABUNGAN: outline besar + berwarna kecil di pojok kiri bawah
  hwn-02/
  tnm-01/
  ...
```

Aturan:
- Huruf kecil, tanpa spasi, tanpa nama subjek di nama file; kode jangan diganti setelah dipakai.
- PNG persegi 1024x1024 piksel, maksimal sekitar 500 KB per file (kompres bila lebih).
- Tidak perlu lengkap: subjek boleh baru punya sebagian file (mis. hanya `puzzle.png`). Aplikasi hanya memilih subjek yang file-nya tersedia untuk jenis tugas itu.
- `mewarnai.png` dibuat dari `outline.png` + `berwarna.png` oleh skrip penggabung, jangan digambar manual.
- Perkiraan total: 75 subjek x 4 file ≈ 90 MB bila semuanya dibuat.

## Cek kualitas sebelum dipakai

- Outline: garis tertutup (kalau ada celah, warna Fill di Paint bocor), tanpa teks, pojok kiri bawah kosong.
- Berwarna: hanya 3 warna isi, bentuknya sama dengan outline.
- Puzzle: satu objek utama, latar polos berwarna, tidak ada elemen kecil yang banyak.
- Semua: tidak ada tulisan atau huruf aneh, tidak menyerupai karakter bermerek.

## Daftar subjek

### Hewan (HWN)

1. `HWN-01` Kucing (cat)
2. `HWN-02` Anjing (dog)
3. `HWN-03` Kelinci (rabbit)
4. `HWN-04` Ikan (fish)
5. `HWN-05` Burung (bird)
6. `HWN-06` Kupu-kupu (butterfly)
7. `HWN-07` Gajah (elephant)
8. `HWN-08` Jerapah (giraffe)
9. `HWN-09` Singa (lion)
10. `HWN-10` Penyu (turtle)
11. `HWN-11` Katak (frog)
12. `HWN-12` Sapi (cow)
13. `HWN-13` Ayam (chicken)
14. `HWN-14` Bebek (duck)
15. `HWN-15` Lebah (bee)

### Tanaman (TNM)

1. `TNM-01` Bunga matahari (sunflower)
2. `TNM-02` Mawar (rose)
3. `TNM-03` Tulip (tulip)
4. `TNM-04` Pohon (tree)
5. `TNM-05` Kaktus (cactus)
6. `TNM-06` Apel (apple)
7. `TNM-07` Pisang (banana)
8. `TNM-08` Jeruk (orange)
9. `TNM-09` Semangka (watermelon)
10. `TNM-10` Stroberi (strawberry)
11. `TNM-11` Wortel (carrot)
12. `TNM-12` Jagung (corn on the cob)
13. `TNM-13` Daun (leaf)
14. `TNM-14` Nanas (pineapple)
15. `TNM-15` Anggur (bunch of grapes)

### Kendaraan (KND)

1. `KND-01` Mobil (car)
2. `KND-02` Bus (bus)
3. `KND-03` Sepeda (bicycle)
4. `KND-04` Sepeda motor (motorcycle)
5. `KND-05` Kereta api (train)
6. `KND-06` Pesawat (airplane)
7. `KND-07` Kapal (ship)
8. `KND-08` Perahu layar (sailboat)
9. `KND-09` Helikopter (helicopter)
10. `KND-10` Truk (truck)
11. `KND-11` Ambulans (ambulance)
12. `KND-12` Mobil pemadam kebakaran (fire truck)
13. `KND-13` Roket (rocket)
14. `KND-14` Kapal selam (submarine)
15. `KND-15` Traktor (tractor)

### Benda Lain (BLN)

1. `BLN-01` Rumah (house)
2. `BLN-02` Buku (book)
3. `BLN-03` Pensil (pencil)
4. `BLN-04` Tas sekolah (school backpack)
5. `BLN-05` Jam (wall clock)
6. `BLN-06` Payung (umbrella)
7. `BLN-07` Topi (hat)
8. `BLN-08` Sepatu (shoe)
9. `BLN-09` Kacamata (pair of glasses)
10. `BLN-10` Lampu (light bulb)
11. `BLN-11` Gelas (cup)
12. `BLN-12` Kursi (chair)
13. `BLN-13` Balon (balloon)
14. `BLN-14` Kado (gift box)
15. `BLN-15` Komputer (desktop computer)

### Benda Olahraga (OLR)

1. `OLR-01` Bola sepak (soccer ball)
2. `OLR-02` Bola basket (basketball)
3. `OLR-03` Bola voli (volleyball)
4. `OLR-04` Raket bulu tangkis dan kok (badminton racket and shuttlecock)
5. `OLR-05` Raket tenis (tennis racket)
6. `OLR-06` Bet tenis meja (table tennis paddle)
7. `OLR-07` Tongkat dan bola bisbol (baseball bat and ball)
8. `OLR-08` Sepatu roda (roller skate)
9. `OLR-09` Papan skate (skateboard)
10. `OLR-10` Tali lompat (jump rope)
11. `OLR-11` Kacamata renang (swimming goggles)
12. `OLR-12` Sepatu lari (running shoe)
13. `OLR-13` Medali (medal)
14. `OLR-14` Piala (trophy)
15. `OLR-15` Peluit (whistle)

## Saran jumlah awal

Jumlah gambar per sesi belum ditentukan, jadi mulai kecil dulu: 3 subjek per kategori (15 subjek) untuk uji coba. Aplikasi nanti memilih acak dari bank gambar yang tersedia, jadi bank bisa ditambah kapan saja tanpa mengubah kode.