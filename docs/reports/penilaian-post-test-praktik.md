# Penilaian praktik post test tidak bisa dilakukan

## Ringkasan
Butir praktik (`dicek_tutor`) pada post test tidak punya layar penilaian per butir di backoffice, sehingga siswa menunggu terus dan post test sulit difinalisasi. Sekarang tutor/admin menilai tiap butir (skor, catatan), lalu menekan **Finalisasi** setelah semua butir dinilai.

## Masalah
- **Gejala:** di Level 1 pertemuan 13, bagian C (Praktik Mouse, File, dan Paint) dan D (Praktik Word) bermode `dicek_tutor`. Di layar siswa tertulis "Kakak tutor akan memeriksa hasilmu" tanpa pernah berubah. Di backoffice tidak ada daftar butir yang perlu dicek dan tidak ada tombol penilaian per butir.
- **Akar penyebab:** satu-satunya kontrol penilaian adalah satu kolom "Nilai bagian (0-100)" (`FormNilaiBagian`) per bagian. Kolom itu hanya aktif setelah siswa mengumpulkan, tidak menampilkan instruksi, bahan, atau rubrik per butir, tidak menyimpan catatan, dan nilainya tidak berasal dari skor butir. Penanda "siap dinilai" dari siswa juga tidak punya tempat untuk dibalas tutor, sehingga status siswa tidak pernah berubah.
- **Periksa tugas biasa:** tugas latihan (bukan post test) bermode `dicek_tutor` **tidak** punya celah yang sama. Detail sesi (`/absensi/[sesiId]`, `DaftarTugasTutor`) sudah memuat daftar tugas, rubrik, dan tombol **Tandai selesai / Jadikan dilewati / Jadikan belum**, dan penuntasan dihitung dari status itu. Penilaian tugas biasa memang berbentuk status (bukan skor), sesuai `project-context.md`. Tidak ada perubahan pada bagian ini.

## Error
Tidak ada pesan error. Perilaku salah: butir praktik tidak bisa dinilai satu per satu dan status siswa tetap "menunggu".

## Solusi
- **Penyimpanan tanpa perubahan skema:** skor dan catatan disimpan di `tugas_siswa.parameter_hasil.penilaianTutor` (`skor`, `maks`, `catatan`, `dinilaiAt`), penilai di kolom yang sudah ada `tugas_siswa.dinilai_oleh`.
- **Panel penilaian** (`PenilaianPraktik`) di detail post test backoffice: tiap butir `dicek_tutor` menampilkan bagian, instruksi, bahan (nama subjek), jawaban/karya siswa (karya Word/Paint dilihat langsung di komputer siswa, jadi diberi keterangan), rubrik, lencana Menunggu dinilai / Sudah dinilai, dan form skor + catatan + Simpan. Skor dibatasi 0 sampai skor maksimum butir (jumlah poin rubrik, 100 untuk rubrik saat ini): zod di controller (angka 0-100, koma desimal diterima, kosong ditolak) dan usecase (maksimum rubrik).
- **Kapan boleh dinilai:** setelah siswa menandai "Sudah selesai, panggil tutor" (tes masih berjalan) atau setelah post test dikumpulkan. Skor boleh direvisi.
- **Finalisasi:** tombol aktif hanya setelah post test dikumpulkan dan semua butir praktik dinilai; selama belum, tombol nonaktif dan keterangan menyebut jumlah butir yang belum dinilai ("N butir praktik belum dinilai"). Saat ditekan, nilai tiap bagian praktik = rata-rata (skor / maks x 100) butir bagian itu, lalu logika finalisasi yang sudah ada menghitung total, lulus (total >= 70 dan tiap bagian >= 50), dan menerbitkan sertifikat lewat `terbitkanOtomatis` (SAVEPOINT tetap). Setelah final, tombol berubah menjadi **Finalisasi ulang** untuk revisi skor.
- **Siswa:** denyut post test (15 detik) mengirim daftar butir yang sudah dinilai; layar siswa mengganti "Kakak tutor akan memeriksa hasilmu" menjadi "Sudah dinilai kakak tutor" (skor tidak ditampilkan) dan penanda siap dikunci.
- **Akses dan log:** admin dan tutor (`AKSES.PENGGUNA`). Aksi dicatat: `nilai_butir_post_test` (template, skor sebelum/sesudah, maks) dan `finalisasi_post_test`.
- **Kode lama dihapus (atas permintaan pemilik):** `FormNilaiBagian.jsx`, action `simpanNilaiPostTest`, `controller.simpanNilai`, `usecase.simpanNilaiTutor`, `nilaiTutorSchema`, dan kunci teks yang tidak dipakai lagi. `AKSI_LOG.NILAI_POST_TEST` dan labelnya dipertahankan agar baris log lama tetap terbaca.
- **Pengujian manual (HTTP, Siswa Uji Level 1 pertemuan 13):** menilai sebelum siap ditolak; skor kosong, 101, -1, dan "abc" ditolak; butir otomatis dan akses tanpa login ditolak; skor "80,5" tersimpan; finalisasi sebelum dikumpulkan ditolak, setelah dikumpulkan tetapi belum semua dinilai ditolak ("Masih ada 3 butir praktik yang belum dinilai"); setelah semua dinilai total 93.81 lulus, sertifikat `DPL-L1-202611-0001` terbit; revisi skor + finalisasi ulang memberi total 95.63 dan tetap satu sertifikat.
- **Data uji:** post test lama Siswa Uji dan sertifikat Siswa Uji Level 1 dihapus/dibuat ulang oleh pengujian ini (data uji lokal).

## File diubah
- `src/enums/index.js`
- `src/locales/id_ID.json`
- `src/modules/posttest/posttest.model.js`
- `src/modules/posttest/posttest.usecase.ts`
- `src/modules/posttest/posttest.controller.ts`
- `src/modules/posttest/posttest.actions.js`
- `src/modules/posttest/posttest.schema.js`
- `src/modules/posttest/HalamanPostTestPengelola.jsx`
- `src/modules/posttest/KlienPostTest.jsx`

## File baru
- `src/modules/posttest/PenilaianPraktik.jsx`

(File dihapus: `src/modules/posttest/FormNilaiBagian.jsx`.)
