# Prompt: Selaraskan `project-context.md` dengan Keadaan Project Terbaru

> Cara menjalankan (di chat agen): `Baca docs/prompt/PROMPT_UPDATE_PROJECT_CONTEXT.md lalu kerjakan semua bagian di dalamnya.`

Ini tugas **dokumentasi saja**. Tidak ada kode, database, seed, atau template yang diubah.

## Tujuan

Bagian atas `.kiro/steering/project-context.md` (bagian **0 sampai 12**, dari judul "Letak berkas di project" sampai "Keputusan terbuka / perlu konfirmasi") masih menggambarkan keadaan sebelum beberapa fitur ditambahkan. Bagian "Status pengerjaan" dan seluruh catatan teknisnya sudah diperbarui dan **sudah benar**. Tugasmu: menyelaraskan bagian 0 sampai 12 dengan keadaan project yang sebenarnya, supaya dokumen ini dapat dipercaya dan konsisten.

## Pengecualian dari aturan biasa (khusus tugas ini)

Aturan biasa membatasi pembaruan `project-context.md` hanya pada bagian "Status pengerjaan". **Untuk tugas ini, kamu boleh mengubah bagian 0 sampai 12.** Bagian "Status pengerjaan" dan catatan teknis Fase A sampai Studio Zippy L3 **jangan diubah** (kecuali yang disebut di Tahap 3 butir 2).

## Aturan kerja (wajib)

- **Sumber kebenaran adalah kode dan seed yang ada, bukan ingatanmu.** Sebelum menulis suatu fakta, periksa di kode, `schema.sql`, berkas `seed/`, atau `README.md`. Jangan menebak. Bila fakta tidak bisa dipastikan, jangan ditulis; masukkan ke daftar di catatan akhir.
- Ubah **seperlunya**. Jangan menulis ulang bagian yang sudah benar, jangan mengubah gaya penulisan, dan pertahankan struktur, penomoran, tabel, dan tanda ⚠ yang sudah ada. Jangan menghapus informasi yang masih berlaku.
- **Jangan menghapus kode yang tidak terpakai atau dikomen**, dan tidak ada kode yang diubah dalam tugas ini.
- Jangan membuat test. Jangan membuat `ringkasan-perubahan.md`. Dokumen yang boleh diubah hanya `.kiro/steering/project-context.md` dan, bila perlu, `README.md` (hanya bila ada bagian yang jelas bertentangan dengan keadaan sebenarnya; sebutkan di catatan akhir).
- Tulis dalam Bahasa Indonesia dengan gaya yang sama dengan dokumen sekarang.
- Kerjakan sampai tuntas; berhenti hanya bila butuh keputusan dari pemilik.

## Tahap 1: Audit

Baca seluruh `project-context.md` (bagian 0 sampai 12 dan seluruh "Status pengerjaan"), lalu periksa setiap bagian 0 sampai 12 terhadap keadaan sebenarnya. Hal-hal berikut sudah diketahui usang atau perlu diperiksa; periksa juga hal lain yang kamu temukan sendiri:

1. **Letak berkas (bagian 0):** daftar berkas dan folder harus mencakup seed `materi-level-1/2/3.json` dan `labirin-blockly.json`, folder `docs/prompt/` beserta prompt-prompt di dalamnya, `docs/reports/`, `public/aset/mengetik/posisi-jari.png`, `uploads/kostum/<siswaId>/`, dan modul/folder baru (`src/modules/materi/`, `src/modules/blockly/`, `src/modules/studio/`, `src/modules/shared/blockly/`). Periksa nama persisnya di repo.
2. **Judul pertemuan (bagian 2):** L1 P11 masih "Coding visual 1 (Scratch Jr / Code.org)" dan L2 P09 sampai P11 masih "Scratch 1/2/3". Samakan dengan `seed/level-pertemuan.json` sekarang ("Coding visual 1 (blok kode)", "Coding 1: sprite, gerak, suara", "Coding 2: percabangan dan perulangan", "Coding 3: game sederhana"), dan deskripsi L3 ("...Excel, dan coding dasar"). Periksa isi bagian 2 lainnya (rincian isi tiap level) terhadap seed.
3. **Penilaian (bagian 5):** keterangan `dicek_tutor` yang menyebut "Scratch"; bagian D post test L2 ("praktik Scratch") menjadi **"Praktik Coding"**; bagian C dan D L3. Sebutkan tipe tugas yang berlaku (`pilihan_ganda`, `excel`, `coding`, `lainnya`, `blockly`, `coding_proyek`, dan `scratch` yang masih terdaftar tetapi tidak dipakai template mana pun). Tambahkan cara penilaian praktik oleh tutor (panel skor, catatan, rubrik, Finalisasi) bila belum ada.
4. **Bank soal dan materi (bagian 6):** tambahkan penjelasan materi pertemuan (berkas seed `materi-level-*.json`, 36 materi untuk pertemuan 1 sampai 12, format `isi`), penguncian tugas sampai "Saya sudah paham", menu Materi (hanya materi yang sudah dilalui), dan tombol "Baca materi". Perbarui jumlah template dan keterangan template bila berubah. Tulis bahwa instruksi tugas memakai "Unduh bahan" langsung di instruksi dan menu Bahan sudah dihilangkan. Tulis bahwa tugas menggambar/mewarnai hanya memakai 75 subjek gambar.
5. **Fitur (bagian 7):** perbarui daftar fitur. Galeri karya tidak lagi menyebut "link proyek Scratch". Tambahkan Materi, Coding Zippy (labirin Blockly L1), Studio Zippy (L2 dan L3), dan penilaian praktik tutor. Pertahankan fitur lain.
6. **Arsitektur dan modul (bagian 8):** daftar modul beserta tabelnya harus mencakup modul baru dan tabel baru (`materi`, `materi_baca`, `labirin_blockly`, `proyek_coding`, `proyek_kiriman`, `kostum_unggahan`, dan tabel lain yang ditambahkan). Periksa jumlah tabel total di `schema.sql`.
7. **Rencana pengerjaan (bagian 11)** dan **keputusan terbuka (bagian 12):** tandai item yang sudah selesai atau sudah diputuskan; tinggalkan yang masih terbuka. Jangan menghapus riwayat keputusan; pindahkan yang sudah diputuskan menjadi catatan "diputuskan" bila pola dokumen mendukung.
8. **Bagian lain (1, 3, 4, 9, 10):** periksa saja; ubah hanya bila ada pernyataan yang jelas bertentangan dengan kode.

Catat hasil audit (daftar bagian dan baris yang berbeda) untuk laporan di catatan akhir.

## Tahap 2: Perbarui bagian 0 sampai 12

Terapkan hasil audit dengan perubahan sekecil mungkin yang membuat dokumen akurat. Untuk setiap perubahan, pastikan dasarnya ada di kode, seed, schema, atau README. Jangan menambah klaim yang tidak bisa kamu periksa.

## Tahap 3: Pemeriksaan akhir

1. Cari di seluruh `project-context.md` kata **"Scratch"**, **"Code.org"**, dan **"Sound"/"Backdrop"**. Setiap kemunculan yang tersisa harus berupa: (a) catatan bahwa tipe `scratch` masih terdaftar tetapi tidak dipakai, atau (b) riwayat keputusan lama yang memang sengaja dipertahankan. Kemunculan lain diperbaiki.
2. Satu-satunya perubahan yang boleh di dalam "Status pengerjaan": tambahkan satu sub-bagian pendek **"Catatan teknis penyelarasan dokumen"** di akhir bagian itu (sebelum "Perbandingan fitur..." bila lebih natural) yang berisi: tanggal pengerjaan, daftar bagian yang diubah, dan hal-hal yang tidak bisa dipastikan. Bagian status lain tidak disentuh.
3. Pastikan penomoran, tabel Markdown, dan tautan di dokumen masih rapi (tidak rusak).
4. Bila `README.md` ada bagian yang jelas usang (mis. menyebut Scratch), perbaiki seperlunya dan sebutkan di catatan akhir.

## Selesai

Tidak perlu laporan di `docs/reports/` (ini bukan bug fix). Tulis di akhir balasan:
1. Daftar bagian `project-context.md` yang diubah beserta ringkasan perubahan tiap bagian.
2. Daftar hal yang **tidak bisa dipastikan** dan butuh keputusan atau konfirmasi pemilik.
3. Bila `README.md` ikut diubah, bagian mana.
