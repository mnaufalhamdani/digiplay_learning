# KIRO-PLAYBOOK: Delegasi dan Sub-Agent per Modul

Panduan membangun setup **agent utama + sub-agent per modul + steering delegasi** di Kiro IDE. Alur, prompt, dan template tidak terikat bahasa atau framework dan memakai placeholder `<...>`, jadi bisa dipakai untuk modul lain dan proyek lain. Contoh nilai tersedia untuk Node.js, PHP (Yii2, Laravel, CodeIgniter), Flutter, Kotlin, dan Kotlin Compose.

Status pengujian: playbook ini baru diuji end-to-end di satu proyek backend Node.js. Contoh untuk stack lain (bagian 3b dan 7) disusun dari konvensi umum dan belum diuji. Fase 5 (uji batas file) dan fase 7 (uji rencana delegasi) menentukan apakah template perlu disesuaikan di proyek Anda.

Cara pakai cepat:
1. Salin file ini ke root proyek.
2. Isi tabel variabel (bagian 3).
3. Jalankan fase 1 sampai 9 (bagian 4) berurutan, satu prompt per sesi chat, dan jangan lanjut sebelum hasil fase sebelumnya diperiksa. Fase 10 hanya untuk proyek yang `delegation.md`-nya dibuat dari versi lama playbook.

Template A (agent) sudah memuat blok `permissions`, dan Template B (`delegation.md`) sudah memuat bagian pemeliharaan `project-context.md`. Tidak ada prompt tambahan untuk keduanya, kecuali pengujian di fase 5.

---

## 1. Gambaran

Hasil akhir:

```
KIRO-PLAYBOOK.md                  file ini
.kiro/
  steering/
    working-rules.md              aturan kerja umum (di luar playbook ini)
    project-context.md            fakta proyek: struktur, modul, area bersama
    delegation.md                 kapan agent utama mendelegasikan ke sub-agent
  agents/
    <modul>-dev.md                satu agent per modul
```

Pembagian peran:

| Pelaku | Tugas |
|---|---|
| Agent modul (`<modul>-dev`) | Mengubah hanya folder modulnya. Melaporkan usulan perubahan file bersama dan dampak ke luar modul. |
| Agent utama (agent default) | Tugas kecil di satu modul, area bersama, job tanpa agent, modul tanpa agent, dan penggabungan hasil. Meluncurkan sub-agent paralel untuk modul independen. |

Alur satu tugas: agent utama membaca steering, menganalisis ketergantungan, menampilkan rencana singkat, mendelegasikan, lalu menerapkan perubahan file bersama sendiri setelah semua sub-agent selesai.

---

## 2. Konsep dan batasan yang perlu diketahui

- **Workspace harus trusted.** Agent di `.kiro/agents/` tidak dimuat di workspace yang tidak tepercaya.
- **Sesi baru.** Steering dan agent yang baru dibuat terbaca di sesi chat baru.
- **Sub-agent terisolasi.** Tiap sub-agent punya riwayat dan context window sendiri. Mereka berbagi steering, akses workspace, dan konfigurasi permissions, tetapi tidak saling berkomunikasi.
- **Graf tugas tetap.** Rencana sub-agent disusun di awal dan tidak bisa diubah saat berjalan. Karena itu analisis ketergantungan harus dilakukan sebelum sub-agent diluncurkan.
- **Keputusan delegasi dibuat model.** Steering hanya mengarahkan, hasilnya bisa berbeda antar sesi. Selalu periksa `git diff` setelah tugas.
- **Pemilihan agent lewat `description`.** Dokumentasi Kiro tidak memberi panduan format. Tulis spesifik (modul, folder, batas), dan daftarkan agent secara eksplisit di `delegation.md`.
- **Model.** Kosongkan field `model` agar memakai Auto. Dokumentasi tidak menjelaskan apakah sub-agent mewarisi model agent utama.
- **Kredit.** Sub-agent paralel memakai lebih banyak kredit. Catat selisih kredit tiap uji.
- **Tidak memakai Hooks dan Workflows.** Keduanya tidak diperlukan untuk setup ini. Workflows opt-in dan memakai lebih banyak token.
- **Tidak ada test.** Verifikasi memakai pemeriksaan sintaks atau analisis statis (`<PERINTAH_CEK>`), bukan test, mengikuti aturan kerja di `working-rules.md`. Jika proyek Anda tidak punya aturan itu, ganti dengan perintah yang sesuai.

---

## 3. Variabel yang diisi per proyek

### 3a. Variabel umum

| Variabel | Arti | Contoh |
|---|---|---|
| `<PROJECT>` | Nama proyek | proyek-contoh |
| `<STACK>` | Stack singkat | lihat 3b |
| `<MODUL>` | Nama modul atau fitur, huruf kecil, dipakai di nama agent | cash |
| `<PATH_MODUL>` | Folder modul | lihat 3b |
| `<PATH_TAMBAHAN_MODUL>` | Pola path lain milik modul di luar `<PATH_MODUL>` (view, resource, aset). Opsional | lihat 3b |
| `<LAYER_URUTAN>` | Urutan layer dalam modul | lihat 3b |
| `<AREA_BERSAMA>` | File atau folder bersama yang dilarang diedit sub-agent | lihat 3b |
| `<FOLDER_GENERATED>` | Folder atau pola file hasil generate otomatis yang tidak boleh diubah (hapus baris terkait di template jika tidak ada) | lihat 3b |
| `<FILE_USULAN_BERSAMA>` | File bersama yang biasanya butuh tambahan saat fitur berubah (terjemahan, route, registrasi) | lihat 3b |
| `<DI_FILE>` | File atau modul registrasi dependency injection | lihat 3b |
| `<SRC_ROOT>` | Root source | lihat 3b |
| `<JOB_PATH_MODUL>` | Folder job, worker, atau console command milik modul (jika ada) | lihat 3b |
| `<JOB_BERSAMA>` | File job atau jadwal bersama | lihat 3b |
| `<HUB>` | Modul yang dipakai banyak modul lain | notification, email |
| `<PASANGAN>` | Modul yang saling bergantung dua arah | license dan payment |
| `<PERINTAH_CEK>` | Pemeriksaan sintaks atau analisis statis, tanpa membuat test | lihat 3b |

### 3b. Contoh per stack

Contoh umum, sesuaikan dengan struktur proyek Anda. Hanya Node.js yang sudah diuji lewat playbook ini.

**Node.js (Express, DI container)** (sudah diuji)
- `<STACK>`: Node.js, Express, DI container (mis. awilix)
- `<PATH_MODUL>`: `src/modules/<modul>`
- `<LAYER_URUTAN>`: routes → controller → usecase → model, validasi lewat schema
- `<AREA_BERSAMA>`: file registrasi DI, file routing utama, konstanta, locales, enums, utils, middlewares, config, `package.json`
- `<FOLDER_GENERATED>`: folder dokumentasi API yang dibuat otomatis (mis. `swagger/`), jika ada
- `<FILE_USULAN_BERSAMA>`: file dokumentasi route/endpoint, file i18n
- `<DI_FILE>`: file container DI (mis. `src/di/container.js`)
- `<SRC_ROOT>`: `src/`
- `<JOB_PATH_MODUL>`: `src/jobs/<modul>/`; `<JOB_BERSAMA>`: file inisialisasi cron dan konstanta queue
- `<PERINTAH_CEK>`: `node --check <file>`

**PHP (Yii2)** (belum diuji)
- `<STACK>`: PHP, Yii2 (basic atau advanced)
- `<PATH_MODUL>`: `modules/<modul>/` (berisi `controllers`, `models`, `views`, `Module.php`). Pada template advanced, mis. `backend/modules/<modul>/`.
- `<LAYER_URUTAN>`: Controller → Service (jika proyek memakainya) → Model (ActiveRecord), aturan validasi di model atau form model. Sesuaikan dengan konvensi tim.
- `<AREA_BERSAMA>`: `config/*.php` (web, console, db, params), `components/`, helper dan behavior bersama, `migrations/`, `composer.json`
- `<FOLDER_GENERATED>`: `runtime/`, `web/assets/`, `vendor/`
- `<FILE_USULAN_BERSAMA>`: `messages/<bahasa>/*.php` (terjemahan), aturan route di konfigurasi `urlManager`
- `<DI_FILE>`: konfigurasi yang mendaftarkan `components` atau `Yii::$container` (mis. `config/web.php`)
- `<SRC_ROOT>`: root aplikasi, tanpa `vendor/` dan `runtime/`
- `<JOB_PATH_MODUL>`: folder console command atau queue job milik modul (jika ada); `<JOB_BERSAMA>`: `config/console.php`, jadwal cron
- `<PERINTAH_CEK>`: `php -l <file>`

**Flutter** (belum diuji)
- `<STACK>`: Flutter, Dart, ditambah library state management dan DI yang dipakai (mis. get_it, Provider, GetX)
- `<PATH_MODUL>`: `lib/features/<modul>/` (atau `lib/modules/<modul>/`)
- `<LAYER_URUTAN>`: Provider → Repository → Controller → UI (sesuai `working-rules.md`)
- `<AREA_BERSAMA>`: `lib/core/` (jaringan, tema, router, DI), file router utama, `pubspec.yaml`, `analysis_options.yaml`, file `.arb` terjemahan
- `<FOLDER_GENERATED>`: pola `*.g.dart`, `*.freezed.dart`, dan file lokalisasi yang di-generate
- `<FILE_USULAN_BERSAMA>`: file router, file `.arb`, registrasi DI
- `<DI_FILE>`: file registrasi DI atau binding (sesuai library yang dipakai)
- `<SRC_ROOT>`: `lib/`
- `<JOB_PATH_MODUL>` dan `<JOB_BERSAMA>`: biasanya tidak ada. Hapus bagian job di template jika memang tidak dipakai.
- `<PERINTAH_CEK>`: `dart analyze <file>`

**Kotlin (Android)** (belum diuji)
- `<STACK>`: Kotlin, Android, Gradle, ditambah library DI (mis. Hilt atau Koin)
- `<PATH_MODUL>`: folder feature package atau modul Gradle, mis. `app/src/main/java/<package>/feature/<modul>/` atau `<modul>/src/main/`
- `<LAYER_URUTAN>`: remoteStore / localStore → Repository → ViewModel (sesuai `working-rules.md`)
- `<AREA_BERSAMA>`: modul core atau common, file modul DI, `build.gradle(.kts)`, `settings.gradle(.kts)`, `libs.versions.toml`, `AndroidManifest.xml`, `res/values/strings.xml`, navigation graph
- `<FOLDER_GENERATED>`: `build/` dan keluaran KSP atau kapt
- `<FILE_USULAN_BERSAMA>`: `strings.xml`, navigation graph, modul DI
- `<DI_FILE>`: file atau modul DI (Hilt `@Module` atau modul Koin)
- `<SRC_ROOT>`: root proyek atau `src/main/` per modul Gradle
- `<JOB_PATH_MODUL>`: worker milik modul (mis. WorkManager), jika ada
- `<PERINTAH_CEK>`: kompilasi modul, mis. `./gradlew :<modul>:compileDebugKotlin` (`gradlew.bat` di Windows)

**Kotlin Compose (Android, Jetpack Compose)** (belum diuji)
- `<STACK>`: Kotlin, Android, Jetpack Compose, Gradle, ditambah library DI (mis. Hilt atau Koin)
- `<PATH_MODUL>`: feature package, mis. `app/src/main/java/<package>/feature/<modul>/` (berisi layar Composable, ViewModel, dan data) atau modul Gradle `<modul>/src/main/`
- `<LAYER_URUTAN>`: remoteStore / localStore → Repository → ViewModel → UI (Composable)
- `<AREA_BERSAMA>`: modul core atau design system (tema, komponen bersama), NavHost atau navigation graph utama, modul DI, `build.gradle(.kts)`, `settings.gradle(.kts)`, `libs.versions.toml`, `AndroidManifest.xml`, `res/values/strings.xml`
- `<FOLDER_GENERATED>`: `build/` dan keluaran KSP atau kapt
- `<FILE_USULAN_BERSAMA>`: `strings.xml`, file navigasi (daftar route layar), modul DI
- `<DI_FILE>`: file atau modul DI (Hilt `@Module` atau modul Koin)
- `<SRC_ROOT>`: root proyek atau `src/main/` per modul Gradle
- `<JOB_PATH_MODUL>`: worker milik modul (mis. WorkManager), jika ada
- `<PERINTAH_CEK>`: kompilasi modul, mis. `./gradlew :<modul>:compileDebugKotlin`

**PHP (Laravel)** (belum diuji)
- `<STACK>`: PHP, Laravel
- `<PATH_MODUL>`: tergantung struktur. Jika proyek modular (mis. paket nwidart/laravel-modules): `Modules/<Modul>/`. Jika struktur Laravel bawaan: tidak ada satu folder per modul, lihat catatan "struktur berlapis menurut tipe" di bagian 7.
- `<LAYER_URUTAN>`: Route → Controller (validasi lewat FormRequest) → Service atau Action (jika proyek memakainya) → Model (Eloquent). Sesuaikan dengan konvensi tim.
- `<AREA_BERSAMA>`: `routes/*.php`, `config/*.php`, `app/Providers/`, `bootstrap/`, `app/Http/Middleware/`, `database/migrations/`, `composer.json`, file terjemahan di `lang/`
- `<FOLDER_GENERATED>`: `vendor/`, `bootstrap/cache/`, `storage/framework/`, `public/build/`, serta dokumentasi API yang di-generate jika ada
- `<FILE_USULAN_BERSAMA>`: `routes/api.php` atau `routes/web.php`, file di `lang/`, service provider
- `<DI_FILE>`: `app/Providers/AppServiceProvider.php` dan service provider lain yang mendaftarkan binding container
- `<SRC_ROOT>`: `app/` (ditambah `routes/`, `resources/`, `database/` bila relevan)
- `<JOB_PATH_MODUL>`: job (`app/Jobs/`) dan console command (`app/Console/Commands/`) milik modul; `<JOB_BERSAMA>`: `routes/console.php` atau `app/Console/Kernel.php` (penjadwalan), `config/queue.php`
- `<PERINTAH_CEK>`: `php -l <file>`

**PHP (CodeIgniter)** (belum diuji)
- `<STACK>`: PHP, CodeIgniter 4. Untuk CodeIgniter 3, padankan: `application/controllers`, `application/models`, `application/config/routes.php`, `application/language`, dan modul HMVC di `application/modules/<modul>/` jika memakai Modular Extensions.
- `<PATH_MODUL>`: jika modular: `app/Modules/<Modul>/`. Jika struktur bawaan: lihat catatan "struktur berlapis menurut tipe" di bagian 7.
- `<LAYER_URUTAN>`: Controller → Service atau Library (jika proyek memakainya) → Model. Sesuaikan dengan konvensi tim.
- `<AREA_BERSAMA>`: `app/Config/*.php` (Routes, Filters, Services, Database), `app/Filters/`, `app/Helpers/`, `app/Libraries/` bersama, `app/Database/Migrations/`, `app/Language/`, `composer.json`
- `<FOLDER_GENERATED>`: `writable/` (cache, log, sesi) dan `vendor/`
- `<FILE_USULAN_BERSAMA>`: `app/Config/Routes.php`, file di `app/Language/<bahasa>/`, `app/Config/Services.php`
- `<DI_FILE>`: `app/Config/Services.php`
- `<SRC_ROOT>`: `app/`
- `<JOB_PATH_MODUL>`: command Spark (`app/Commands/`) milik modul, jika ada; `<JOB_BERSAMA>`: jadwal cron yang memanggil `php spark`
- `<PERINTAH_CEK>`: `php -l <file>`

**Folder tambahan milik modul (`<PATH_TAMBAHAN_MODUL>`)**

Sebuah fitur sering punya file di luar `<PATH_MODUL>`. Daftarkan semuanya sebagai pola path penuh (mis. `resources/views/cash/**`), dan hapus baris template jika tidak ada.
- Laravel: `resources/views/<modul>/**` dan aset milik modul
- CodeIgniter: `app/Views/<modul>/**`
- Yii2: `views/<modul>/**` jika view tidak berada di dalam folder modul
- Flutter: `assets/<modul>/**` atau `test/` terkait jika dipakai (jangan membuat test kecuali diminta)
- Kotlin dan Kotlin Compose: `res/drawable*/<modul>_*` atau resource milik fitur; `strings.xml` tetap area bersama

---

## 4. Fase kerja dan prompt

Jalankan satu prompt per sesi chat, di Kiro IDE pada repo proyek. Periksa hasil sebelum lanjut.

### Fase 1: Investigasi (hanya baca)

Tujuan: mengetahui modul, area bersama, dan ketergantungan.

````
Tugas: investigasi struktur proyek ini. HANYA BACA. Jangan membuat, mengubah, atau menghapus file apa pun.

Yang perlu dicari:
1. Platform, bahasa, dan struktur folder tingkat atas.
2. Daftar modul atau fitur beserta path foldernya.
3. Untuk tiap modul: layer yang ada dan file entry point-nya.
4. File atau folder bersama yang dipakai banyak modul (DI, routing, konfigurasi, enum, util, middleware, i18n, dokumentasi API). Tandai sebagai area rawan bentrok jika dua tugas paralel mengubahnya.
5. Ketergantungan antar modul, termasuk lewat DI, job, dan tabel, query, atau model/ORM yang sama (SQL langsung, ActiveRecord, Room, dan sejenisnya).
6. Folder atau file yang dibuat otomatis (dokumentasi API, kode hasil generator, hasil build) dan tidak boleh diedit.
7. Cara skema database dikelola (ada migrasi atau tidak, dan di folder mana).
8. Isi .kiro/ yang sudah ada.

Format hasil: tabel modul (nama, path, layer, bergantung ke), daftar area bersama dengan tingkat risiko, dan daftar 2 sampai 4 modul yang paling independen untuk dikerjakan paralel. Akhiri dengan pertanyaan jika ada yang tidak jelas. Berhenti dan tunggu persetujuan saya.
````

Periksa: modul pasangan (dua arah) dan hub (dipakai banyak modul) sudah teridentifikasi.

### Fase 2: project-context.md

Tujuan: fakta proyek yang dibaca agent di setiap sesi. File ini dimuat di setiap interaksi, jadi jaga ringkas (sekitar 120 baris).

````
Tugas: buat SATU file .kiro/steering/project-context.md berisi konteks proyek <PROJECT> untuk dibaca agent di setiap sesi. Jangan mengubah file lain, termasuk working-rules.md dan delegation.md.

Langkah 1, investigasi (hanya baca): verifikasi fakta ke kode. Boleh memakai hasil investigasi sebelumnya sebagai petunjuk awal, tetapi cek setiap fakta ke kode. Yang dicari: stack dan versi utama, entry point, script penting, struktur folder utama, pola modul dan cara DI, daftar modul beserta path dan prefix route atau entry point navigasi (jika ada), modul yang punya job, area bersama beserta risikonya, database dan cara skema dikelola, helper lintas modul.

Langkah 2, tulis file. Front matter: inclusion: always. Bahasa Indonesia, maksimal sekitar 120 baris. Gunakan tabel untuk daftar modul. Bagian: 1) ringkasan proyek, 2) struktur folder, 3) pola modul dan DI, 4) daftar modul, 5) area bersama dan hub, 6) database, 7) konvensi penting yang terlihat di kode, 8) aturan khusus (mis. folder <FOLDER_GENERATED> dibuat otomatis dan tidak boleh diubah).

Aturan: hanya fakta yang sudah diverifikasi. Jika tidak bisa dipastikan, tulis "Belum diverifikasi". Jangan menyalin isi kode, jangan mengulang isi working-rules.md atau delegation.md, dan jangan menulis rahasia (nilai .env, kredensial, token, host, port).

Tampilkan isi file dan jumlah barisnya, sebutkan hal yang tidak bisa diverifikasi, lalu berhenti.
````

Periksa: tidak ada rahasia, daftar modul cocok dengan folder sebenarnya, panjang wajar.

### Fase 3: Agent modul pertama (pilot)

Pilih modul yang paling independen (tanpa dependensi DI, tanpa job). Template ada di bagian 5.

````
Buat SATU custom agent untuk modul <MODUL> di <PATH_MODUL>. Jangan membuat agent lain dan jangan mengubah file lain.

Gunakan "Template A: agent modul" di KIRO-PLAYBOOK.md (root proyek). Isi semua placeholder dari .kiro/steering/project-context.md dan hasil investigasi. Hapus baris opsional yang tidak berlaku (job, folder generated, catatan khusus). Jangan isi field model. Blok permissions sudah ada di template: ganti path-nya ke modul ini. Masukkan folder job dan path tambahan (view, resource, aset) ke match allow dan exclude deny hanya jika modul memilikinya, dan hapus entri yang tidak berlaku.

Jika ragu dengan format file agent, tanya sub-agent introspect. Tampilkan isi file yang dibuat, lalu berhenti dan tunggu saya.
````

Periksa: hanya satu file baru di `.kiro/agents/`, dan tidak ada sisa placeholder `<...>` atau nama modul lain.

### Fase 4: Uji pilot

**4a. Hanya baca (murah).** Di sesi baru:

````
Gunakan agent <MODUL>-dev sebagai sub-agent untuk tugas ini. HANYA BACA, jangan ubah file apa pun.

Tugas: jelaskan alur salah satu endpoint di modul <MODUL> dari awal sampai akhir, lalu sebutkan perubahan file bersama yang akan diperlukan jika kita menambah satu endpoint baru.

Setelah selesai laporkan: apakah tugas dijalankan oleh sub-agent <MODUL>-dev, dan apakah format laporan akhir sesuai aturan agent. Berhenti setelah melapor.
````

**4b. Perubahan kecil.** Jalankan hanya jika 4a berhasil:

````
Gunakan agent <MODUL>-dev sebagai sub-agent untuk tugas kecil ini: <tugas kecil di modul>.

Anda boleh MEMBACA file bersama agar usulannya akurat, tetapi DILARANG mengeditnya. Setelah selesai laporkan file yang diubah dan usulan perubahan file bersama. Berhenti setelah melapor.
````

Periksa setelah tiap uji (lihat bagian 6): `git diff --stat`, daftar file yang berubah, selisih kredit.

### Fase 5: Verifikasi batas file secara teknis (permissions)

Instruksi di prompt agent bukan pembatas teknis. Blok `permissions` di Template A yang menegakkannya. Fase ini hanya membuktikan bahwa rule itu bekerja, lewat agent uji yang tidak punya larangan di prompt-nya. (Di proyek asal, sintaks `deny` dengan `exclude` tidak punya contoh di dokumentasi dan baru terbukti lewat uji ini. Ulangi uji di setiap proyek baru.)

**5a. Buat agent uji sementara:**

````
Buat SATU file: .kiro/agents/boundary-probe.md (agent uji sementara). Jangan mengubah file lain.

Front matter: name: boundary-probe, description: Agent uji sementara untuk menguji permissions, tools: ["read", "write"], dan blok permissions yang sama persis dengan <MODUL>-dev.md.
Isi system prompt hanya satu kalimat: "Lakukan persis yang diminta pengguna." Jangan menambahkan batasan lain.

Tampilkan isi file, lalu berhenti.
````

**5b. Uji di sesi baru:**

````
Gunakan agent boundary-probe untuk membuat file docs/_uji-permissions.txt berisi satu baris teks. Laporkan apakah penulisan berhasil, ditolak, atau meminta persetujuan, beserta pesan yang muncul.
````

Cara membaca hasil:
- Ditolak otomatis dengan pesan rule `deny`: permissions bekerja.
- Muncul prompt persetujuan: `deny` belum diterapkan. Pilih tolak dan selidiki.
- File terbuat tanpa prompt: permissions tidak berlaku. Hapus file manual dan selidiki.

Uji positif: jalankan lagi tugas kecil fase 4b dan pastikan penulisan di folder modul tetap berhasil.

**5c.** Hapus `.kiro/agents/boundary-probe.md` secara manual setelah uji selesai.

### Fase 6: delegation.md

Template ada di bagian 5 (Template B), sudah termasuk bagian pemeliharaan `project-context.md`. Pada langkah ini daftar agent baru berisi agent pilot.

````
Buat SATU file: .kiro/steering/delegation.md. Jangan mengubah file lain, termasuk working-rules.md dan project-context.md.

Gunakan "Template B: delegation.md" di KIRO-PLAYBOOK.md. Isi semua placeholder dari project-context.md. Daftar agent hanya berisi agent yang benar-benar sudah ada di .kiro/agents/. Hapus bagian opsional yang tidak berlaku.

Tampilkan isi file, lalu berhenti dan tunggu saya.
````

Mulai sesi chat baru setelah file dibuat agar steering terbaca.

### Fase 7: Uji rencana delegasi (tanpa eksekusi)

Di sesi baru, satu skenario per sesi, tanpa menyebut sub-agent:

````
Hanya tampilkan rencana delegasi (langkah 1 sampai 4). Jangan mengerjakan atau mengubah apa pun.
Tugas: <skenario>
````

| Skenario | Rencana yang diharapkan |
|---|---|
| Tugas kecil di satu modul | Dikerjakan agent utama langsung |
| Dua modul beragen, independen | Paralel ke agent masing-masing |
| Perubahan area bersama (middleware, config) dan satu modul | Area bersama oleh agent utama lebih dulu |
| Satu modul beragen dan satu modul tanpa agent | Modul tanpa agent oleh agent utama |
| Dua modul beragen yang bergantung lewat tabel atau DI | Berurutan, penyedia dulu, dan bertanya jika asumsi DB tidak bisa diverifikasi |
| Modul hub atau pasangan | Tanpa paralel |

Jika rencana menyimpang, perketat kalimat di `delegation.md` (mis. ubah "disarankan" menjadi "WAJIB").

### Fase 8: Uji paralel nyata

Butuh minimal dua agent modul yang independen.

````
Jalankan dua sub-agent SECARA PARALEL:
- <MODUL_A>-dev: <tugas kecil di modul A>
- <MODUL_B>-dev: <tugas kecil di modul B>

Sub-agent DILARANG mengedit file bersama. Setelah keduanya selesai: gabungkan usulan perubahan file bersama tanpa duplikat, terapkan hanya yang diperlukan satu file pada satu waktu, jalankan <PERINTAH_CEK> pada semua file yang diubah, lalu laporkan file yang diubah per agent dan file bersama yang Anda ubah. Jangan membuat test. Berhenti setelah melapor.
````

Setelah itu kembalikan perubahan uji jika hanya uji (periksa juga folder yang diabaikan git).

### Fase 9: Menambah modul berikutnya

Ulangi per modul. Jangan menambah banyak sekaligus.

````
Buat SATU custom agent untuk modul <MODUL_BARU> di <PATH_MODUL_BARU>. Ubah hanya dua file: .kiro/agents/<MODUL_BARU>-dev.md (baru) dan .kiro/steering/delegation.md (tambah baris di daftar agent).

Gunakan .kiro/agents/<MODUL_PILOT>-dev.md sebagai acuan struktur, termasuk blok permissions (ganti path ke modul baru). Sesuaikan:
- Jika modul punya job di <JOB_PATH_MODUL_BARU>, masukkan folder itu ke batas file, ke match allow, dan ke exclude deny. File job bersama (<JOB_BERSAMA>) tetap dilarang.
- Jika modul termasuk <HUB> atau <PASANGAN>, jangan buat agent. Tampilkan alasannya dan berhenti.
- Tambahkan catatan khusus modul jika memakai enum atau tabel yang dipakai modul lain.
Tampilkan diff kedua file, lalu berhenti.
````

Lalu ulangi uji rencana (fase 7) minimal untuk satu skenario yang melibatkan modul baru.

### Fase 10 (opsional): Menambah pemeliharaan ke delegation.md versi lama

Lewati fase ini jika `delegation.md` Anda dibuat dari Template B versi sekarang, karena bagian pemeliharaan sudah ada di dalamnya. Jalankan hanya jika file itu dibuat dari versi lama dan belum punya bagian "## Pemeliharaan project-context.md". Aturannya ditaruh di `delegation.md`, bukan di `working-rules.md`, karena aturan umum itu berlaku untuk banyak proyek:

````
Edit SATU file: .kiro/steering/delegation.md. Bagian lain dan front matter tidak diubah. Tambahkan bagian "## Pemeliharaan project-context.md" setelah bagian "Laporan" (Bahasa Indonesia, singkat), berisi:

- Setelah tugas selesai, agent utama memperbarui .kiro/steering/project-context.md HANYA jika tugas mengubah hal struktural: modul ditambah, dihapus, atau diganti nama; prefix route berubah; job, worker, atau cron baru; registrasi atau dependensi baru di <DI_FILE>; area bersama baru; script berubah. Bug fix dan perubahan di dalam satu fungsi tidak memicu pembaruan.
- Edit hanya bagian yang terdampak, jangan menulis ulang seluruh file, dan jangan menulis rahasia.
- Sub-agent dilarang mengedit file ini. Agent utama yang memperbaruinya setelah semua sub-agent selesai.
- Ini pengecualian dari aturan Scope di working-rules.md. Laporkan perubahannya di bagian laporan sebagai file bersama yang diubah.
- Jika ragu apakah perlu diperbarui, jangan ubah. Tulis usulannya di laporan.

Tampilkan diff-nya, lalu berhenti.
````

---

## 5. Template

### Template A: agent modul

Simpan sebagai `.kiro/agents/<MODUL>-dev.md`. Baris bertanda `[opsional]` atau `[hapus butir ini ...]` dihapus jika tidak berlaku, termasuk teks penanda itu sendiri.

````
---
name: <MODUL>-dev
description: Menangani perubahan modul <MODUL> di <PATH_MODUL> (<daftar layer>). Tidak menangani modul lain.
tools: ["read", "write", "shell"]
permissions:
  rules:
    - capability: fs_write
      match: ["<PATH_MODUL>/**", "<PATH_TAMBAHAN_MODUL>", "<JOB_PATH_MODUL>/**"]
      effect: allow
    - capability: fs_write
      match: ["**"]
      exclude: ["<PATH_MODUL>/**", "<PATH_TAMBAHAN_MODUL>", "<JOB_PATH_MODUL>/**"]
      effect: deny
---

Kamu adalah agent khusus modul `<MODUL>` pada proyek <PROJECT> (<STACK>).

## Batas file

Hanya boleh mengubah file di:
- `<PATH_MODUL>/`
- `<PATH_TAMBAHAN_MODUL>` [opsional: hanya jika modul punya view, resource, atau aset di luar folder modul]
- `<JOB_PATH_MODUL>` [opsional: hanya jika modul punya folder job sendiri]

DILARANG mengedit file bersama berikut:
- <AREA_BERSAMA, satu butir per baris>
- seluruh `<FOLDER_GENERATED>` (dibuat otomatis, jangan diubah, tidak perlu dilaporkan) [opsional]

Jika tugas butuh perubahan di file bersama, jangan edit. Catat di laporan akhir file mana yang perlu diubah dan baris apa yang perlu ditambahkan.

[opsional] Catatan: modul ini memakai <enum/tabel> yang juga dipakai modul <modul lain>. File itu boleh dibaca tetapi dilarang diedit. Jika nilainya perlu diubah, laporkan di laporan akhir.

## Cara kerja

- Ikuti pola modul yang sudah ada: <LAYER_URUTAN>.
- Baca file di `<PATH_MODUL>/` dan satu modul lain sebagai acuan pola sebelum menulis kode.
- Jangan membuat layer atau file baru jika tidak perlu.
- Jangan mengubah modul lain.
- Dilarang menjalankan perintah git yang mengubah state (commit, checkout, restore, reset, stash, clean, push, merge, rebase). Boleh `git status`, `git diff`, dan `git log` (hanya baca).
- Setelah selesai, jalankan `<PERINTAH_CEK>` pada setiap file yang diubah dan sertakan hasilnya di laporan.

## Hubungan dengan bagian lain

1. **Fungsi reusable:** boleh MEMAKAI (import/panggil) fungsi yang sudah ada di folder util, enum, dan konstanta bersama. Dilarang mengubahnya. Sebelum menulis fungsi baru, cek dulu apakah sudah ada yang serupa di folder util. Fungsi yang hanya dipakai modul ini boleh ditulis di folder modul. Jika butuh fungsi bersama baru atau perubahan pada fungsi bersama, jangan edit, laporkan sebagai usulan.
2. **Middleware, filter, atau interceptor:** [hapus butir ini jika stack tidak punya] pakai yang sudah ada dan pasang di tempat yang sama dengan modul lain, mengikuti pola modul lain. Dilarang mengubah file middleware, filter, atau interceptor bersama.
3. **Komunikasi dengan modul lain:** ikuti pola komunikasi antar modul yang sudah ada (DI container, interface, atau layanan bersama). Jangan mengimpor kelas internal modul lain secara langsung. Pakai hanya dependensi yang sudah terdaftar di `<DI_FILE>`. Jika butuh dependensi baru, laporkan sebagai usulan untuk file itu.
4. **Jobs/cron/queue/worker:** [hapus butir ini jika stack tidak punya; pilih satu] (a) modul ini tidak punya job sendiri. Jika perubahan memengaruhi job atau butuh job baru, jangan edit folder job, laporkan. (b) job modul ini ada di `<JOB_PATH_MODUL>` dan boleh diubah. Jangan mengedit `<JOB_BERSAMA>`, laporkan sebagai usulan.
5. **Dampak ke luar:** sebelum mengubah atau menghapus nama fungsi, parameter, bentuk respons, atau query/kolom/tabel, cari pemakainya di seluruh `<SRC_ROOT>` (hanya baca; termasuk `<DI_FILE>`, folder job, modul lain, dan modul yang membaca tabel yang sama lewat query atau model langsung). Jangan mengedit pemakai di luar batas modul.
6. **Generator dan migrasi:** jangan menjalankan perintah generator, build penuh, atau migrasi database kecuali diminta eksplisit, karena dapat mengubah banyak file di luar batas modul.

## Laporan akhir

Tulis tiga daftar:
1. File yang diubah (path lengkap).
2. Perubahan file bersama yang diperlukan, berisi file, dan baris yang perlu ditambahkan. Tulis "tidak ada" jika kosong.
3. Dampak ke luar modul: daftar pemakai di luar modul yang terkena perubahan (path dan alasan), atau "tidak ada".

Aturan: sebelum menulis "tidak ada" pada daftar perubahan file bersama, WAJIB MEMBACA (bukan mengedit) <FILE_USULAN_BERSAMA> untuk mencari entri atau key yang terkait dengan endpoint, fungsi, atau pesan yang diubah atau dihapus. Jika ada yang terkait, tulis di usulan.
````

Catatan template A:
- Blok `permissions` di front matter adalah pembatas teknis tulis file. Hapus entri `<PATH_TAMBAHAN_MODUL>` dan `<JOB_PATH_MODUL>/**` dari `match` dan `exclude` jika modul tidak punya (jangan tinggalkan placeholder). `<PATH_TAMBAHAN_MODUL>` diisi pola path penuh, dan boleh lebih dari satu entri. Fase 5 membuktikan blok ini bekerja.
- Tulis `description` spesifik (modul, folder, batas). Dokumentasi Kiro tidak memberi panduan format untuk field ini.

### Template B: delegation.md

Simpan sebagai `.kiro/steering/delegation.md`.

````
---
inclusion: always
---

# Aturan Delegasi ke Sub-Agent

## Agent modul yang tersedia
- `<MODUL_A>-dev`: modul `<PATH_MODUL_A>`
- `<MODUL_B>-dev`: modul `<PATH_MODUL_B>`

## Kapan mendelegasikan
Prosedur untuk setiap tugas yang menyentuh kode:

1. Tentukan modul apa saja yang disentuh tugas.
2. Sebelum meluncurkan sub-agent, analisis ketergantungan (hanya baca): lihat `<DI_FILE>` dan cari pemakai kelas atau fungsi publik modul itu (usecase, repository, service, model) di `<SRC_ROOT>` (job, modul lain). Selain pemakai lewat DI, cari juga modul lain yang memakai tabel atau kolom yang sama lewat query atau model langsung, karena itu juga ketergantungan kontrak (penyedia: modul yang menulis atau mengubah tabel). Tentukan apakah tugas mengubah kontrak (nama fungsi, parameter, bentuk respons, tabel/kolom) yang dipakai modul lain di tugas yang sama.
3. Putuskan:
   - Satu modul, tugas kecil: kerjakan langsung, tanpa sub-agent.
   - Satu modul, tugas besar (banyak file atau lapisan): delegasikan ke agent modul tersebut.
   - Satu modul yang mengubah kontrak yang dipakai modul lain: tetap lakukan analisis dampak di langkah 2 dan laporkan pemakai yang terdampak, sekalipun dikerjakan langsung.
   - Dua modul atau lebih yang independen (tidak ada kontrak yang saling dipakai): WAJIB delegasikan paralel ke agent modul masing-masing. Aturan ini hanya menghitung modul yang punya agent.
   - Dua modul atau lebih dengan ketergantungan kontrak: kerjakan berurutan. Modul penyedia dulu, lalu modul pemakai, dengan laporan penyedia sebagai masukan. Paralel hanya untuk bagian yang benar-benar independen.
   - Modul pasangan (<PASANGAN>) dan modul hub (<HUB>): jangan paralel. Kerjakan langsung oleh agent utama atau berurutan.
   - Modul tanpa agent khusus: kerjakan langsung oleh agent utama. Jangan memakai agent modul lain untuk modul itu.
   - Area bersama (<AREA_BERSAMA>): dikerjakan langsung oleh agent utama, bukan sub-agent. Jika tugas yang sama juga mengubah modul, kerjakan area bersama lebih dulu (sebagai penyedia), baru delegasikan modulnya.
   - Job: dikerjakan langsung oleh agent utama, kecuali folder job itu masuk batas file sebuah agent modul. Jangan mengedit `<JOB_BERSAMA>` lewat sub-agent.
4. Tampilkan rencana singkat (modul, urutan, alasan satu kalimat), lalu langsung jalankan tanpa menunggu persetujuan.
5. Setelah semua selesai: baca bagian "Dampak ke luar modul" dari tiap laporan, gabungkan usulan file bersama, periksa sendiri <FILE_USULAN_BERSAMA>, lalu terapkan satu file pada satu waktu. Jika ada pemakai di luar lingkup tugas yang terdampak, jangan ubah otomatis. Laporkan kepada saya. Jalankan `<PERINTAH_CEK>` pada semua file yang diubah (oleh siapa pun) dan laporkan hasilnya. Jangan membuat test.

## Kapan berhenti dan bertanya
Meskipun rencana dijalankan otomatis, BERHENTI dan tanya saya sebelum mengubah kode jika:
- (a) tugas bergantung pada asumsi penting yang tidak bisa diverifikasi dari repo (mis. kolom atau tabel DB, perilaku klien);
- (b) instruksi punya beberapa tafsir dengan hasil berbeda;
- (c) perubahan menyentuh folder util, middleware, config, atau enum bersama.

Jika instruksi sudah eksplisit meminta penghapusan atau perubahan yang membuat klien lama gagal, lanjutkan, dan tulis peringatannya di laporan sebagai "Dampak ke klien".

## File bersama
- Sub-agent dilarang mengedit file bersama.
- Setelah semua sub-agent selesai, agent utama memeriksa sendiri <FILE_USULAN_BERSAMA>, lalu menerapkan hanya perubahan yang diperlukan, satu file pada satu waktu, tanpa menyentuh baris lain.
- [opsional] Dilarang mengubah file apa pun di `<FOLDER_GENERATED>` (oleh agent utama maupun sub-agent). File di sana dibuat otomatis. Perubahan di sana tidak perlu diusulkan atau dilaporkan.

## Laporan
Setelah selesai, laporkan file yang diubah per agent dan file bersama yang diubah.
- Jika tugas adalah bug fix, agent utama menulis laporan bug fix sesuai `working-rules.md` setelah semua sub-agent selesai, dengan menggabungkan laporan mereka. Sub-agent tidak menulis di luar batas modulnya.

## Pemeliharaan project-context.md
- Setelah tugas selesai, agent utama memperbarui `.kiro/steering/project-context.md` HANYA jika tugas mengubah hal struktural: modul ditambah, dihapus, atau diganti nama; prefix route berubah; job, worker, atau cron baru; registrasi atau dependensi baru di `<DI_FILE>`; area bersama baru; script berubah. Bug fix dan perubahan di dalam satu fungsi tidak memicu pembaruan.
- Edit hanya bagian yang terdampak, jangan menulis ulang seluruh file, dan jangan menulis rahasia.
- Sub-agent dilarang mengedit file ini. Agent utama yang memperbaruinya setelah semua sub-agent selesai.
- Ini pengecualian dari aturan Scope di `working-rules.md`. Laporkan perubahannya di bagian laporan sebagai file bersama yang diubah.
- Jika ragu apakah perlu diperbarui, jangan ubah. Tulis usulannya di laporan.
````

Catatan template B: bagian "Pemeliharaan project-context.md" hanya relevan jika `project-context.md` sudah dibuat (fase 2 selalu mendahului fase 6).

---

## 6. Verifikasi setelah tiap tugas

Laporan agent pernah tidak cocok dengan kondisi file (mis. edit yang hilang saat respons terputus). Jangan hanya mengandalkan laporan.

1. **Ringkasan perubahan:**
   ```
   git status --short
   git diff --stat
   ```
2. **Semua file yang berubah dalam satu jam terakhir**, termasuk yang diabaikan git. Windows PowerShell:
   ```
   Get-ChildItem -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\(node_modules|vendor|build|\.dart_tool|\.gradle|\.git)\\' -and $_.LastWriteTime -gt (Get-Date).AddMinutes(-60) } | Select-Object -ExpandProperty FullName
   ```
   Linux/macOS:
   ```
   find . \( -path ./node_modules -o -path ./vendor -o -path ./build -o -path ./.dart_tool -o -path ./.gradle -o -path ./.git \) -prune -o -type f -mmin -60 -print
   ```
   Sesuaikan daftar folder yang dikecualikan dengan stack Anda (dependensi dan hasil build).
3. **Batas file:** hanya folder modul yang boleh berubah, ditambah file bersama yang memang diusulkan dan disetujui.
4. **Kredit:** catat selisih kredit sebelum dan sesudah tugas.
5. **Perilaku:** sub-agent dipakai atau tidak sesuai harapan, dan tidak ada pertanyaan yang tidak relevan.
6. **File yang tidak dilacak git:** `.kiro/agents/` dan `.kiro/steering/` baru terlihat di `git status` setelah ditambahkan. Putuskan bersama tim sebelum commit, karena steering `inclusion: always` berlaku untuk semua orang.

---

## 7. Adaptasi ke proyek lain

1. Salin `KIRO-PLAYBOOK.md` ke root proyek baru.
2. Isi tabel variabel (bagian 3) dari hasil fase 1.
3. Sesuaikan penamaan layer dengan platform (lihat aturan layer di `working-rules.md`):

| Platform | Layer yang dipakai di template (`<LAYER_URUTAN>`) |
|---|---|
| JS | Service / Model → UseCase → Controller (plus schema validasi jika ada) |
| Flutter | Provider → Repository → Controller → UI |
| Kotlin | remoteStore / localStore → Repository → ViewModel |
| Kotlin Compose | remoteStore / localStore → Repository → ViewModel → UI (Composable) |
| PHP (Yii2) | Belum didefinisikan di `working-rules.md`. Usulan: Controller → Service → Model (ActiveRecord). |
| PHP (Laravel) | Belum didefinisikan di `working-rules.md`. Usulan: Controller (FormRequest) → Service atau Action → Model (Eloquent). |
| PHP (CodeIgniter) | Belum didefinisikan di `working-rules.md`. Usulan: Controller → Service atau Library → Model. |

Untuk ketiga baris PHP, tentukan dulu sesuai konvensi tim, lalu tambahkan barisnya ke `working-rules.md` agar agent konsisten.

4. Sesuaikan `<PERINTAH_CEK>` dengan stack (contoh di bagian 3b). Pilih yang tidak membuat test.
5. Sesuaikan `<AREA_BERSAMA>`. Cari file yang dipakai banyak modul dan sering diedit bersama (registrasi DI, routing, konstanta, i18n, enum, util, middleware, konfigurasi). Daftar ini menentukan batas sub-agent, jadi periksa dengan teliti di fase 1.
6. Hilangkan baris opsional yang tidak berlaku (folder generated, job, enum bersama).
7. Jalankan fase 1 sampai 9 apa adanya. Jangan lompat ke fase 9 sebelum fase 5 dan 7 lolos di proyek itu.

### Hal yang sering berbeda antar stack

Periksa butir ini di fase 1 sebelum membuat agent pertama:

- **Definisi modul.** Bisa berupa folder `modules/<modul>` (Yii2, CodeIgniter modular, Laravel modular), feature folder (Flutter), atau feature package atau modul Gradle (Kotlin dan Kotlin Compose). Tentukan satu definisi dan pakai konsisten untuk semua agent.
- **Struktur berlapis menurut tipe.** Struktur bawaan Laravel, CodeIgniter, dan Yii2 basic mengelompokkan file menurut jenis (`Controllers/`, `Models/`, `views/`), bukan per fitur, sehingga satu modul tersebar di beberapa folder. Dua cara menanganinya: (a) pindahkan ke struktur modular lebih dulu, atau (b) definisikan batas modul dengan pola nama file di `<PATH_MODUL>` dan `<PATH_TAMBAHAN_MODUL>`, mis. `app/Http/Controllers/Cash*.php`, `app/Models/Cash*.php`, `resources/views/cash/**`. Cara (b) lebih rapuh, karena file baru dengan nama di luar pola ditolak oleh `permissions`. Uji dengan fase 5 dan 4b sebelum mengandalkannya.
- **Dependency injection.** Mungkin tidak ada container terpusat, atau tersebar di beberapa file (mis. GetX, Provider, Hilt, Koin). Daftarkan semua file registrasinya di `<DI_FILE>`.
- **Kode hasil generator.** build_runner, KSP/kapt, Gii, dan publish asset menghasilkan file yang tidak boleh diedit. Masukkan ke `<FOLDER_GENERATED>`.
- **Migrasi database.** Jika ada folder migrasi (mis. `migrations/` di Yii2, skema Room), anggap itu area bersama: sub-agent mengusulkan, agent utama yang membuat migrasi.
- **Job.** Bisa tidak ada (umum di aplikasi mobile). Hapus butir job di template jika begitu.
- **Pola path di `permissions`.** Dokumentasi tidak menjelaskan apakah `match` dihitung dari root workspace atau path absolut. Fase 5 membuktikannya. Pada workspace multi-root atau monorepo, uji dengan path yang benar.
- **Perintah cek.** Pilih perintah yang cepat dan tidak mengubah file. Hindari build penuh atau generator sebagai perintah cek.

---

## 8. Batasan dan hal yang belum terverifikasi

- **Delegasi tidak deterministik.** Keputusan memakai sub-agent dibuat model, dan bisa berbeda antar sesi.
- **Batas file via `permissions` hanya mencakup tool tulis file.** Tool `shell` tidak otomatis terikat. Dokumentasi tidak menjelaskan bagaimana redirect atau perintah shell dihitung terhadap rule `fs_write`. Agent masih bisa menulis lewat shell secara teori. Pemeriksaan `git diff` dan daftar file berubah (bagian 6) tetap diperlukan.
- **Sintaks `deny` dengan `exclude`** tidak punya contoh di dokumentasi. Terbukti bekerja di proyek asal lewat fase 5, tetapi ulangi uji di proyek baru.
- **Prompt persetujuan.** Rule `allow` milik sub-agent tidak menghilangkan prompt persetujuan jika policy sesi induk tidak punya rule untuk call itu. Alur otomatis bisa terputus oleh prompt.
- **Hooks.** Dokumentasi tidak menjelaskan apakah hook di `.kiro/hooks/` berjalan untuk tool call sub-agent. Setup ini tidak memakai hook.
- **Pewarisan model.** Tidak dijelaskan apakah sub-agent memakai model agent utama atau `model` miliknya.
- **Format `description`.** Tidak ada panduan resmi untuk pemilihan otomatis. Daftarkan agent eksplisit di `delegation.md`.
- **Hasil uji bersifat sampel.** Satu uji per skenario tidak menjamin konsistensi. Amati beberapa tugas nyata sebelum percaya sepenuhnya.
- **Baru diuji di satu stack.** Playbook ini baru diuji end-to-end di proyek backend Node.js. Contoh untuk Yii2, Laravel, CodeIgniter, Flutter, Kotlin, dan Kotlin Compose (bagian 3b) belum diuji. Perlakukan fase 5 dan 7 sebagai uji kelayakan template di stack Anda, dan sesuaikan template jika hasilnya menyimpang.

---

## 9. Troubleshooting

| Gejala | Kemungkinan penyebab dan tindakan |
|---|---|
| Agent modul tidak pernah dipanggil | Workspace belum trusted, sesi belum baru setelah file dibuat, atau nama di `delegation.md` tidak sama dengan `name` di file agent. Perketat kalimat di steering ("WAJIB"). |
| Agent mengerjakan tugas dua modul sendirian | Keputusan model. Perketat steering, atau sebut "paralel per modul" di prompt tugas. |
| Agent mengedit file bersama | Cek apakah blok `permissions` ada dan lolos uji fase 5. Periksa apakah penulisan lewat shell. |
| Muncul prompt persetujuan di tengah alur | Perilaku permissions untuk sub-agent. Tambahkan rule workspace di `permissions.yaml` jika ingin tanpa prompt. |
| Edit agent tidak ada di file | Respons terputus sebelum tersimpan. Verifikasi dengan `git diff`, lalu ulangi edit. |
| Agent bertanya terlalu sering | Longgarkan butir (a) sampai (c) di "Kapan berhenti dan bertanya". |
| Perubahan di folder yang diabaikan git tidak terlihat | Pakai daftar file berubah (bagian 6, butir 2). |
| `project-context.md` mulai usang | Pastikan `delegation.md` punya bagian pemeliharaan (jika belum, jalankan fase 10), lalu perbarui bagian yang terdampak. Tinjau berkala. |
