---
inclusion: always
---

# Aturan Kerja

## Scope
- Kerjakan hanya bagian yang berkaitan dengan tugas atau case yang diberikan.
- Jangan ubah dokumen atau kode lain yang tidak berkaitan dengan topik.
- Sebelum menulis kode baru, baca dan tiru pola file serupa yang sudah ada di project (struktur, penamaan, cara DI). Jangan mengubah pola yang sudah berjalan.

## Gaya Kode (JS, Flutter, Kotlin)
- Gunakan clean architecture (pisahkan layer domain, data, presentation).
- Gunakan dependency injection; jangan buat dependency langsung di dalam class atau function
- Ikuti struktur layer yang sudah ada di project. Untuk perubahan kecil, ubah file yang sudah ada dulu; jangan menambah file atau layer baru kalau tidak diperlukan.

## Penamaan Layer per Platform

| Peran | Flutter | Kotlin | JS |
|---|---|---|---|
| Komunikasi API luar | Provider | remoteStore | Service |
| Komunikasi database lokal | (di dalam Repository) | localStore | Model |
| Bisnis logika & orkestrasi data | Repository | Repository | UseCase |
| Validasi UI & logika ringan | Controller | VM/ViewModel | Controller |

- **Flutter**: Provider (komunikasi API) → Repository (bisnis logika + komunikasi ke database lokal) → Controller (validasi UI & logika sederhana) → UI (widget).
- **Kotlin**: remoteStore (komunikasi API) / localStore (komunikasi database lokal) → Repository (bisnis logika) → VM/ViewModel (validasi UI & logika sederhana).
- **JS**: Service (komunikasi API lain) / Model (komunikasi database lokal) → UseCase (bisnis logika & komunikasi ke model) → Controller (validasi UI & logika sederhana).

## Dokumentasi
- Setiap function diberi komentar ringkas sebagai dokumentasi, ditulis dalam Bahasa Indonesia.
- Jangan menulis kode baru yang tidak dipakai atau belum dibutuhkan tugas ini.
- Setiap percabangan logika yang tidak trivial di dalam function (if/else, switch/when, try-catch, loop dengan kondisi khusus) diberi komentar singkat yang menjelaskan alasan atau maksud dari cabang tersebut, bukan hanya mengulang apa yang kode sudah tunjukkan. Komentar jenis ini wajib dicek ulang sebelum selesai mengerjakan function, agar tidak ada cabang yang terlewat.
- Contoh: pada `if (code >= 400 && code < 500) { ... }`, tambahkan komentar seperti `/// error dari sisi client (validasi/permission), tidak perlu retry` dibanding tanpa komentar sama sekali.

## Kompleksitas
- Kode tidak terlalu kompleks, tapi tetap efisien. Utamakan perubahan sekecil mungkin yang menyelesaikan tugas.
- Sebelum membuat function, file, atau class baru, cek dulu apakah sudah ada yang bisa dipakai atau diperluas di project. Buat yang baru hanya jika benar-benar perlu, dan jelaskan alasannya singkat.
- Ikuti pola dan ukuran function di file sekitarnya. Jangan memecah function atau membuat file baru hanya demi mengikuti acuan di bawah.
- Acuan berikut hanya sinyal untuk dipertimbangkan saat kode mulai sulit dibaca, bukan target:
  - Nesting (if/for/try bersarang) lebih dari 2-3 level: pertimbangkan early return atau extract ke function terpisah.
  - Function yang sangat panjang (±40-50 baris) atau mengerjakan banyak hal berbeda: pertimbangkan dipecah, jika memang tidak sesuai pola file sekitarnya.
  - Satu function sebaiknya satu tanggung jawab. Contoh yang layak dipecah: function yang sekaligus menangani request API, simpan ke DB lokal, kirim notifikasi, dan validasi form.
  - Logika yang sama berulang di banyak file (minimal 3 tempat): pertimbangkan extract ke helper/base class (contoh: `BaseService` untuk komunikasi API). Jika baru 1-2 tempat, biarkan.

## Testing
- Setiap proses pengerjaan tidak disertai pembuatan test (unit test/widget test/dll), kecuali diminta secara khusus.

## Bug Fix
- Perbaiki bug sampai tuntas, jangan berhenti di tengah kecuali butuh keputusan dari saya.
- Setelah selesai, buat laporan di `docs/reports/<nama-bug>.md` dengan isi:
  - **Ringkasan**: 1-2 kalimat tentang bug dan hasil perbaikannya.
  - **Masalah**: gejala dan akar penyebabnya.
  - **Error**: pesan error atau log yang muncul (cukup bagian relevan, tidak perlu seluruh stack trace).
  - **Solusi**: apa yang diubah dan alasannya.
  - **File diubah**: daftar path file yang dimodifikasi.
  - **File baru**: daftar path file yang dibuat (tulis "tidak ada" kalau kosong).
- Laporan hanya mencatat bug fix ini, tidak perlu menyalin isi kode.

## Kode Tidak Terpakai
- Jangan hapus kode yang tidak dipakai atau yang dikomen, baik kode lama milik project maupun kode yang ditulis dalam proses pengerjaan saat ini. Project ini dikerjakan oleh tim, kode yang dikomen/tidak terpakai kadang sengaja disisakan oleh anggota tim lain untuk dipakai atau dianalisis kemudian hari.
