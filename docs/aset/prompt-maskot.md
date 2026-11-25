# Prompt Pose Zippy

Zippy adalah sugar glider "Pahlawan Anti-Gaptek", maskot DigiPlay Learning. Dokumen ini berisi prompt untuk membuat pose tambahan yang konsisten dengan gambar referensi `maskot-zippy.png` (pose menunjuk).

Letak berkas ini: `docs/aset/prompt-maskot.md`. Hasil gambar disimpan di `public/aset/maskot/`.

## Cara membuat

1. Lampirkan `maskot-zippy.png` sebagai **gambar referensi karakter** pada setiap pembuatan gambar.
2. Susun prompt dengan urutan: **Deskripsi dasar** + **Pose** + **Aturan** (di bawah).
3. Buat 4 variasi per pose, pilih yang paling mirip dengan referensi (wajah, setelan, lambang petir, warna).
4. Gunakan latar hijau polos (lihat catatan latar) lalu hapus latarnya dengan alat penghapus latar.
5. Potong dengan ruang kosong sekitar 5% di sekeliling, lalu simpan sebagai `zippy-<suasana>.png`.

## Deskripsi dasar (selalu disertakan)

```
Zippy, a cute friendly sugar glider superhero mascot, Pixar-style 3D animation render, soft studio lighting. Big round expressive dark-brown eyes with white highlights, large rounded ears with pink inner ear, soft gray and white fur, small pink nose. Wears an orange hero mask, a royal blue bodysuit with orange trim, orange wristbands, belt and ankle bands, and a glowing white lightning bolt emblem on the chest. Cream-colored gliding membranes between arms and legs with thin glowing cyan circuit-like lines. Fluffy bushy gray tail. Dark gray hands and feet.
```

## Aturan (selalu disertakan di akhir)

```
Keep exactly the same character design, costume, colors, face and proportions as the reference image. Full body visible, centered. Plain solid pure green background (#00FF00), no floor, no shadow, no gradient. No text, no letters, no logo, no watermark, no extra characters, no extra limbs, no props, no confetti.
```

## Pose

| Berkas | Dipakai di | Prompt pose (tempel di antara deskripsi dasar dan aturan) |
|---|---|---|
| `zippy-menunjuk.png` | Beranda, petunjuk tugas | *Sudah ada.* Cukup hapus latar `maskot-zippy.png`. |
| `zippy-sapa.png` | Login, dialog Pulang | `Standing facing the viewer, one hand raised waving hello, the other hand on the hip, big warm smile, friendly welcoming expression.` |
| `zippy-semangat.png` | Pewaktu 5 menit terakhir, game dimulai | `Fist pumped in front, determined excited expression, one knee bent, dynamic energetic stance, wings slightly spread.` |
| `zippy-berpikir.png` | Soal pilihan ganda, memuat singkat | `One finger resting on the chin, head slightly tilted, eyes looking up, curious thoughtful expression, the other hand on the hip.` |
| `zippy-merayakan.png` | Tugas tuntas, lulus post test, sertifikat | `Both arms raised high in celebration, jumping, mouth wide open in joy, wings spread wide, very happy expression.` |
| `zippy-menyemangati.png` | Jawaban salah, tugas dilewati, belum lulus | `Gentle kind smile, one hand held out toward the viewer in an encouraging gesture as if saying "you can do it", head slightly tilted, warm supportive expression, not sad.` |
| `zippy-tidur.png` | Belum absen (mode lihat saja), layar kosong | `Curled up sleeping peacefully, eyes closed, wrapped in its wings and fluffy tail, a small content smile, hero mask still on.` |
| `zippy-terbang.png` | Memuat data | `Gliding through the air with wings fully spread, arms and legs stretched wide, happy determined face, cyan lines glowing on the membranes, seen from the front.` |

Tambahan untuk ikon kecil (favicon, avatar, lencana):

| Berkas | Prompt pose |
|---|---|
| `zippy-wajah.png` | `Close-up head and shoulders portrait, centered, square composition, big friendly smile, looking at the viewer.` (untuk jenis ini, ganti kata "Full body visible" pada aturan dengan "Head and shoulders only") |

## Catatan latar

- Gambar referensi saat ini berlatar putih sehingga bulu putih Zippy (dahi, perut) ikut terhapus saat latar dibuang otomatis. Latar hijau polos mengatasi hal itu karena warna hijau tidak ada pada Zippy.
- Bila generator-mu bisa menghasilkan latar transparan langsung, gunakan itu dan hilangkan kalimat latar hijau dari aturan.
- Setelah menghapus latar, periksa di latar gelap dan latar krem: tidak boleh ada tepi hijau atau bagian bulu yang bolong.

## Daftar cek kualitas

- Wajah, mata, dan telinga sama dengan referensi.
- Topeng oranye, setelan biru, lambang petir, dan garis cyan pada sayap utuh.
- Jari tangan dan kaki wajar (tidak berlebih atau menyatu).
- Tidak ada tulisan, huruf, atau logo yang muncul sendiri.
- Ekspresi ramah. Pose "menyemangati" tidak boleh terlihat sedih atau mengejek.

## Ukuran dan berkas

- Seluruh badan berorientasi potret 3:4 (misalnya 768 x 1024 px); `zippy-wajah.png` persegi 1:1 (512 x 512 px).
- Format PNG bertransparansi (WebP boleh bila dikonversi). Usahakan maksimal sekitar 300 KB per berkas.
- Nama berkas huruf kecil, tanpa spasi: `zippy-<suasana>.png`.
