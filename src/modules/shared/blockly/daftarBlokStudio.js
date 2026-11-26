import { t } from '@/utils/i18n';
import {
  BATAS_STUDIO,
  DAFTAR_TOMBOL,
  DAFTAR_UKURAN_TEKS,
  DAFTAR_WARNA_TEKS,
  JENIS_SPRITE,
  NAMA_LATAR,
  OPERATOR_BANDING,
  OPERATOR_HITUNG,
  PILIHAN_SUARA,
  POLA_NAMA_VARIABEL,
  SASARAN_SENTUH,
  SPRITE_ZIPPY,
  SUASANA_MUSIK,
  jumlahKostum,
  kunciNama,
  labelLatar,
  labelSuara,
} from '@/modules/shared/blockly/pustakaStudio';

// Daftar blok Studio Zippy: SATU-SATUNYA tempat mendefinisikan sebuah blok studio (mengikuti pola daftarBlok.js milik
// Coding Zippy Level 1). Satu entri memuat
//   - jenis: 'topi' (awal skrip), 'perintah' (satu langkah), 'wadah' (berisi daftar perintah), 'nilai' (angka), 'kondisi' (benar/salah);
//   - kategori: kelompok dan warna di toolbox (lihat KATEGORI_STUDIO);
//   - bidang: isian blok berurutan (angka, teks, pilihan, kondisi, isi) yang dipakai tampilan Blockly, pembaca workspace, dan validasi;
//   - cara penerjemah menjalankan: `jalankan(ctx, node)` untuk topi/perintah/wadah (fungsi biasa atau generator) dan
//     `hitung(ctx, node)` untuk nilai/kondisi.
// Teks tampilan dibaca dari locales dengan kunci `studio.blok.<nama>` (isi `%1 %2 ...` mengikuti urutan bidang; blok
// yang punya bidang `isi` menyisipkan satu pemisah baris tepat sebelum isi) dan `studio.tip.<nama>`.
// Menambah blok baru (mis. blok Level 3) cukup menambah satu entri di sini, teks di locales, dan namanya di
// KONFIGURASI_TOOLBOX; komponen halaman, penerjemah, dan validasi tidak berubah.

/** Kategori toolbox berurutan beserta warna (teks putih di atasnya lolos kontras AA 4.5:1). Nama dan warna dipakai soal. */
export const KATEGORI_STUDIO = Object.freeze([
  { kode: 'kejadian', warna: '#A16207', hat: true },
  { kode: 'gerakan', warna: '#1D4ED8' },
  { kode: 'tampilan', warna: '#7E22CE' },
  { kode: 'suara', warna: '#BE185D' },
  { kode: 'kontrol', warna: '#C2410C' },
  { kode: 'sensor', warna: '#0369A1' },
  { kode: 'operator', warna: '#15803D' },
  { kode: 'variabel', warna: '#B91C1C' },
]);

/** Isian angka (bisa diganti blok nilai): rentang dan nilai awal; `bulat` = harus bilangan bulat. */
const angka = (nama, { awal = 0, min = -1000, maks = 1000, bulat = false } = {}) => ({ nama, jenis: 'angka', awal, min, maks, bulat });
/** Isian teks bebas. */
const teks = (nama, awal, maks = BATAS_STUDIO.maksTeks, min = 0) => ({ nama, jenis: 'teks', awal, maks, min });
/** Isian bebas (Level 3): angka atau teks, bisa diganti blok nilai; dibandingkan/dihitung dengan menerjemahkan teks angka menjadi angka. */
const bebas = (nama, awal = '') => ({ nama, jenis: 'bebas', awal });
/** Isian pilihan dari data proyek (variabel atau sprite): daftarnya dibaca saat dropdown dibuka; nilai lama yang sudah dihapus tetap sah. */
const pilihanDinamis = (nama, sumber, awal, pola) => ({ nama, jenis: 'pilihan', dinamis: sumber, awal, pola });
/** Isian pilihan dari daftar nilai tetap; `label(nilai)` nama yang tampil. */
const pilihan = (nama, nilai, awal, label) => ({ nama, jenis: 'pilihan', nilai, awal, label });
/** Isian syarat (blok kondisi). */
const syarat = (nama) => ({ nama, jenis: 'kondisi' });
/** Isian daftar perintah di dalam blok wadah. */
const isi = (nama = 'isi') => ({ nama, jenis: 'isi' });

/** Angka dari nilai bebas: angka apa adanya, atau teks angka (koma desimal boleh) menjadi angka; null bila bukan angka. */
export function keAngka(nilai) {
  if (typeof nilai === 'number') return Number.isFinite(nilai) ? nilai : null;
  if (typeof nilai !== 'string' || nilai.trim() === '') return null;
  const n = Number(nilai.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
/** Angka (bukan angka menjadi 0), dibatasi ke rentang wajar. */
const angkaAman = (nilai) => Math.max(-BATAS_STUDIO.maksAngka, Math.min(BATAS_STUDIO.maksAngka, keAngka(nilai) ?? 0));
/** Membandingkan dua nilai bebas: dua-duanya angka dibandingkan sebagai angka, selain itu sebagai teks (huruf besar kecil diabaikan). */
function bandingkanNilai(a, b, op) {
  const na = keAngka(a);
  const nb = keAngka(b);
  const [x, y] = na !== null && nb !== null ? [na, nb] : [String(a).toLowerCase(), String(b).toLowerCase()];
  if (op === 'gt') return x > y;
  if (op === 'gte') return x >= y;
  if (op === 'lt') return x < y;
  if (op === 'lte') return x <= y;
  return x === y;
}

/** Sudut dalam radian. */
const radian = (derajat) => (derajat * Math.PI) / 180;
/** Arah baru setelah diputar, selalu 0 sampai kurang dari 360. */
const putar = (arah, derajat) => (((arah + derajat) % 360) + 360) % 360;
/** Label pilihan yang diterjemahkan dari locales: kunci = awalan + nilai. */
const labelDari = (awalan) => (nilai) => t(`${awalan}.${nilai}`);

/** Definisi blok per nama. Nama dipakai di program JSON (`blok`/`kejadian`), locales, dan KONFIGURASI_TOOLBOX. */
const DAFTAR_L2 = Object.freeze({
  // --- Kejadian ---
  bendera: { jenis: 'topi', kategori: 'kejadian', bidang: [], jalankan: () => {} },
  tombol: { jenis: 'topi', kategori: 'kejadian', bidang: [pilihan('tombol', DAFTAR_TOMBOL, 'spasi', labelDari('studio.tombol'))], jalankan: () => {} },

  // --- Gerakan ---
  gerak: {
    jenis: 'perintah',
    kategori: 'gerakan',
    bidang: [angka('langkah', { awal: 10 })],
    jalankan(ctx, n) {
      const langkah = ctx.nilai(n.langkah);
      // arah 0 = atas, 90 = kanan (searah jarum jam), seperti Scratch
      ctx.pindahKe(ctx.sprite.x + langkah * Math.sin(radian(ctx.sprite.arah)), ctx.sprite.y + langkah * Math.cos(radian(ctx.sprite.arah)));
    },
  },
  putar_kanan: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('derajat', { awal: 15, min: -360, maks: 360 })], jalankan: (ctx, n) => { ctx.sprite.arah = putar(ctx.sprite.arah, ctx.nilai(n.derajat)); } },
  putar_kiri: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('derajat', { awal: 15, min: -360, maks: 360 })], jalankan: (ctx, n) => { ctx.sprite.arah = putar(ctx.sprite.arah, -ctx.nilai(n.derajat)); } },
  pantul: { jenis: 'perintah', kategori: 'gerakan', bidang: [], jalankan: (ctx) => ctx.pantul() },
  ke_posisi: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('x'), angka('y')], jalankan: (ctx, n) => ctx.pindahKe(ctx.nilai(n.x), ctx.nilai(n.y)) },
  atur_x: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('x')], jalankan: (ctx, n) => ctx.pindahKe(ctx.nilai(n.x), ctx.sprite.y) },
  atur_y: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('y')], jalankan: (ctx, n) => ctx.pindahKe(ctx.sprite.x, ctx.nilai(n.y)) },
  ubah_x: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('x', { awal: 10 })], jalankan: (ctx, n) => ctx.pindahKe(ctx.sprite.x + ctx.nilai(n.x), ctx.sprite.y) },
  ubah_y: { jenis: 'perintah', kategori: 'gerakan', bidang: [angka('y', { awal: 10 })], jalankan: (ctx, n) => ctx.pindahKe(ctx.sprite.x, ctx.sprite.y + ctx.nilai(n.y)) },

  // --- Tampilan ---
  katakan: { jenis: 'perintah', kategori: 'tampilan', bidang: [teks('teks', 'Halo!')], jalankan: (ctx, n) => { ctx.sprite.kata = n.teks; } },
  kostum_berikutnya: { jenis: 'perintah', kategori: 'tampilan', bidang: [], jalankan: (ctx) => { ctx.sprite.kostum = (ctx.sprite.kostum + 1) % jumlahKostum(ctx.sprite); } },
  ganti_latar: { jenis: 'perintah', kategori: 'tampilan', bidang: [pilihan('tema', NAMA_LATAR, 'taman', labelLatar)], jalankan: (ctx, n) => { ctx.dunia.latar = n.tema; } },
  tampilkan: { jenis: 'perintah', kategori: 'tampilan', bidang: [], jalankan: (ctx) => { ctx.sprite.tampil = true; } },
  sembunyikan: { jenis: 'perintah', kategori: 'tampilan', bidang: [], jalankan: (ctx) => { ctx.sprite.tampil = false; } },

  // --- Suara ---
  mainkan_suara: { jenis: 'perintah', kategori: 'suara', bidang: [pilihan('suara', PILIHAN_SUARA, 'hewan-1', labelSuara)], jalankan: (ctx, n) => ctx.bunyi(n.suara) },

  // --- Kontrol ---
  ulangi: {
    jenis: 'wadah',
    kategori: 'kontrol',
    bidang: [angka('kali', { awal: 10, min: 1, maks: 100, bulat: true }), isi()],
    *jalankan(ctx, n) {
      const kali = Math.min(1000, Math.max(0, Math.floor(ctx.nilai(n.kali))));
      for (let i = 0; i < kali && !ctx.dihentikan(); i += 1) {
        yield* ctx.isi(n.isi);
        // satu putaran per bingkai agar gerakan terlihat dan halaman tidak membeku
        yield;
      }
    },
  },
  selamanya: {
    jenis: 'wadah',
    kategori: 'kontrol',
    bidang: [isi()],
    *jalankan(ctx, n) {
      while (!ctx.dihentikan()) {
        yield* ctx.isi(n.isi);
        // satu putaran per bingkai; juga mencegah perulangan kosong menggantung
        yield;
      }
    },
  },
  jika: {
    jenis: 'wadah',
    kategori: 'kontrol',
    bidang: [syarat('syarat'), isi()],
    *jalankan(ctx, n) {
      // syarat kosong dianggap salah
      if (ctx.syarat(n.syarat)) yield* ctx.isi(n.isi);
    },
  },
  tunggu: {
    jenis: 'perintah',
    kategori: 'kontrol',
    bidang: [angka('detik', { awal: 1, min: 0, maks: 10 })],
    *jalankan(ctx, n) {
      yield* ctx.menunggu(ctx.nilai(n.detik) * 1000);
    },
  },
  hentikan_semua: { jenis: 'perintah', kategori: 'kontrol', bidang: [], jalankan: (ctx) => ctx.hentikanSemua() },

  // --- Sensor ---
  menyentuh: { jenis: 'kondisi', kategori: 'sensor', bidang: [pilihan('sasaran', SASARAN_SENTUH, 'tepi', labelDari('studio.sasaran'))], hitung: (ctx, n) => ctx.sentuh(n.sasaran) },

  // --- Operator ---
  angka_acak: {
    jenis: 'nilai',
    kategori: 'operator',
    bidang: [angka('a', { awal: 1 }), angka('b', { awal: 10 })],
    hitung(ctx, n) {
      const a = Math.round(ctx.nilai(n.a));
      const b = Math.round(ctx.nilai(n.b));
      const bawah = Math.min(a, b);
      return bawah + ctx.acak(Math.max(a, b) - bawah + 1);
    },
  },
  bandingkan: {
    jenis: 'kondisi',
    kategori: 'operator',
    // Level 3 menambah pilihan lebih besar dari / lebih kecil atau sama dengan dan mengizinkan teks; proyek L2 lama (angka) tetap sama
    bidang: [bebas('a', '0'), pilihan('op', OPERATOR_BANDING, 'gte', labelDari('studio.op')), bebas('b', '0')],
    hitung: (ctx, n) => bandingkanNilai(ctx.bebas(n.a), ctx.bebas(n.b), n.op),
  },

  // --- Variabel (satu variabel bawaan: skor) ---
  skor: { jenis: 'nilai', kategori: 'variabel', bidang: [], hitung: (ctx) => ctx.dunia.variabel.skor },
  atur_skor: { jenis: 'perintah', kategori: 'variabel', bidang: [angka('n', { awal: 0, min: -99999, maks: 99999 })], jalankan: (ctx, n) => { ctx.dunia.variabel.skor = ctx.nilai(n.n); } },
  ubah_skor: { jenis: 'perintah', kategori: 'variabel', bidang: [angka('n', { awal: 1, min: -99999, maks: 99999 })], jalankan: (ctx, n) => { ctx.dunia.variabel.skor += ctx.nilai(n.n); } },
  tampilkan_skor: { jenis: 'perintah', kategori: 'variabel', bidang: [], jalankan: (ctx) => { ctx.dunia.tampilSkor = true; } },
});

/** Blok tambahan Level 3 (kategori dan warna sama dengan Level 2). Dipanggil lewat KONFIGURASI_TOOLBOX.l3. */
const DAFTAR_L3 = Object.freeze({
  // --- Kejadian ---
  diklik: { jenis: 'topi', kategori: 'kejadian', bidang: [], jalankan: () => {} },
  kirim_pesan: { jenis: 'perintah', kategori: 'kejadian', bidang: [teks('pesan', 'mulai', BATAS_STUDIO.maksPesan, 1)], jalankan: (ctx, n) => ctx.kirimPesan(n.pesan) },
  menerima_pesan: { jenis: 'topi', kategori: 'kejadian', bidang: [teks('pesan', 'mulai', BATAS_STUDIO.maksPesan, 1)], jalankan: () => {} },

  // --- Tampilan ---
  katakan_selama: {
    jenis: 'perintah',
    kategori: 'tampilan',
    bidang: [teks('teks', 'Halo!'), angka('detik', { awal: 2, min: 0, maks: 10 })],
    *jalankan(ctx, n) {
      ctx.sprite.kata = n.teks;
      yield* ctx.menunggu(ctx.nilai(n.detik) * 1000);
      // balon dihapus hanya bila belum diganti blok katakan lain selama menunggu
      if (ctx.sprite.kata === n.teks) ctx.sprite.kata = '';
    },
  },

  // --- Suara ---
  mainkan_musik: { jenis: 'perintah', kategori: 'suara', bidang: [pilihan('suasana', SUASANA_MUSIK, 'ceria', labelDari('studio.musik'))], jalankan: (ctx, n) => ctx.musik(n.suasana) },
  hentikan_musik: { jenis: 'perintah', kategori: 'suara', bidang: [], jalankan: (ctx) => ctx.hentikanMusik() },

  // --- Kontrol ---
  jika_tidak: {
    jenis: 'wadah',
    kategori: 'kontrol',
    bidang: [syarat('syarat'), isi('isi'), isi('lainnya')],
    *jalankan(ctx, n) {
      // syarat kosong dianggap salah, jadi cabang "jika tidak" yang berjalan
      yield* ctx.isi(ctx.syarat(n.syarat) ? n.isi : n.lainnya);
    },
  },
  tunggu_sampai: {
    jenis: 'perintah',
    kategori: 'kontrol',
    bidang: [syarat('syarat')],
    *jalankan(ctx, n) {
      // menunggu tidak memakai anggaran blok: tiap bingkai hanya memeriksa syaratnya
      while (!ctx.syarat(n.syarat) && !ctx.dihentikan()) yield;
    },
  },

  // --- Sensor ---
  menyentuh_sprite: { jenis: 'kondisi', kategori: 'sensor', bidang: [pilihanDinamis('sprite', 'sprite', '', /^[a-z0-9_-]{0,20}$/)], hitung: (ctx, n) => ctx.sentuhSprite(n.sprite) },
  tanya: {
    jenis: 'perintah',
    kategori: 'sensor',
    bidang: [teks('teks', 'Siapa namamu?')],
    *jalankan(ctx, n) {
      yield* ctx.tanya(n.teks);
    },
  },
  jawaban: { jenis: 'nilai', keluaran: 'bebas', kategori: 'sensor', bidang: [], hitung: (ctx) => ctx.dunia.jawaban },

  // --- Operator ---
  hitung_angka: {
    jenis: 'nilai',
    kategori: 'operator',
    bidang: [bebas('a', '0'), pilihan('op', OPERATOR_HITUNG, 'tambah', labelDari('studio.hitung')), bebas('b', '0')],
    hitung(ctx, n) {
      const a = ctx.nilai(n.a);
      const b = ctx.nilai(n.b);
      if (n.op === 'kurang') return angkaAman(a - b);
      if (n.op === 'kali') return angkaAman(a * b);
      // bagi dengan 0 menghasilkan 0 (tidak melempar galat)
      if (n.op === 'bagi') return b === 0 ? 0 : angkaAman(a / b);
      return angkaAman(a + b);
    },
  },
  gabung: { jenis: 'nilai', keluaran: 'bebas', kategori: 'operator', bidang: [bebas('a', 'Halo '), bebas('b', 'Zippy')], hitung: (ctx, n) => `${ctx.bebas(n.a)}${ctx.bebas(n.b)}`.slice(0, 200) },
  dan: { jenis: 'kondisi', kategori: 'operator', bidang: [syarat('a'), syarat('b')], hitung: (ctx, n) => ctx.syarat(n.a) && ctx.syarat(n.b) },
  atau: { jenis: 'kondisi', kategori: 'operator', bidang: [syarat('a'), syarat('b')], hitung: (ctx, n) => ctx.syarat(n.a) || ctx.syarat(n.b) },
  bukan: { jenis: 'kondisi', kategori: 'operator', bidang: [syarat('a')], hitung: (ctx, n) => !ctx.syarat(n.a) },

  // --- Variabel (buatan sendiri; `skor` Level 2 tetap ada) ---
  variabel: { jenis: 'nilai', keluaran: 'bebas', kategori: 'variabel', bidang: [pilihanDinamis('nama', 'variabel', 'skor', POLA_NAMA_VARIABEL)], hitung: (ctx, n) => ctx.ambilVariabel(n.nama) },
  atur_variabel: {
    jenis: 'perintah',
    kategori: 'variabel',
    bidang: [pilihanDinamis('nama', 'variabel', 'skor', POLA_NAMA_VARIABEL), bebas('nilai', '0')],
    jalankan: (ctx, n) => ctx.aturVariabel(n.nama, ctx.bebas(n.nilai)),
  },
  ubah_variabel: {
    jenis: 'perintah',
    kategori: 'variabel',
    bidang: [pilihanDinamis('nama', 'variabel', 'skor', POLA_NAMA_VARIABEL), angka('n', { awal: 1, min: -99999, maks: 99999 })],
    // nilai teks diperlakukan sebagai 0 ditambah angka
    jalankan: (ctx, n) => ctx.aturVariabel(n.nama, angkaAman(angkaAman(ctx.ambilVariabel(n.nama)) + ctx.nilai(n.n))),
  },
  tampilkan_variabel: { jenis: 'perintah', kategori: 'variabel', bidang: [pilihanDinamis('nama', 'variabel', 'skor', POLA_NAMA_VARIABEL)], jalankan: (ctx, n) => ctx.monitorVariabel(n.nama, true) },
  sembunyikan_variabel: { jenis: 'perintah', kategori: 'variabel', bidang: [pilihanDinamis('nama', 'variabel', 'skor', POLA_NAMA_VARIABEL)], jalankan: (ctx, n) => ctx.monitorVariabel(n.nama, false) },
});

/** Semua blok studio: Level 2 lalu Level 3 (urutan ini juga urutan di toolbox per kategori). */
export const DAFTAR_BLOK_STUDIO = Object.freeze({ ...DAFTAR_L2, ...DAFTAR_L3 });

/**
 * Konfigurasi toolbox per tingkat proyek (kolom `proyek_coding.tingkat`): nama konfigurasi dan blok yang tampil,
 * berurutan. Level 3 menambah entri `l3` (atau memperpanjang daftarnya) setelah blok barunya didaftarkan di atas.
 */
export const KONFIGURASI_TOOLBOX = Object.freeze({
  l2: {
    nama: 'studio l2',
    blokTersedia: Object.freeze(Object.keys(DAFTAR_L2)),
  },
  l3: {
    nama: 'studio l3',
    blokTersedia: Object.freeze(Object.keys(DAFTAR_BLOK_STUDIO)),
  },
});
/** Tingkat proyek yang dikenal. */
export const TINGKAT_STUDIO = Object.freeze(Object.keys(KONFIGURASI_TOOLBOX));
/** Tingkat bawaan proyek baru. */
export const TINGKAT_BAWAAN = 'l2';

/** Blok yang tersedia pada satu tingkat (bawaan bila tingkat tidak dikenal). */
export function blokTersedia(tingkat) {
  return (KONFIGURASI_TOOLBOX[tingkat] ?? KONFIGURASI_TOOLBOX[TINGKAT_BAWAAN]).blokTersedia;
}

/** Nama-nama blok berjenis topi (awal skrip). */
export const NAMA_TOPI = Object.freeze(Object.keys(DAFTAR_BLOK_STUDIO).filter((n) => DAFTAR_BLOK_STUDIO[n].jenis === 'topi'));

/** Apakah nilai berupa objek biasa (bukan array/null). */
function objekBiasa(nilai) {
  return nilai != null && typeof nilai === 'object' && !Array.isArray(nilai);
}

/** Proyek kosong: satu sprite Zippy di tengah panggung, latar taman, skor 0. */
export function proyekBaru() {
  return {
    versi: 1,
    latar: 'taman',
    variabel: { skor: 0 },
    sprite: [{ id: 's1', subjek: SPRITE_ZIPPY, x: 0, y: 0, arah: 90, kostum: 0, tampil: true, skrip: [] }],
  };
}

/**
 * Memeriksa proyek tanpa rekursi (aman untuk proyek yang bersarang sangat dalam). Yang diperiksa: kunci dan nilai
 * tingkat atas, tiap sprite (id unik, subjek, posisi, arah, kostum), tiap skrip dan blok (tipe dikenal dan tersedia,
 * kunci tanpa tambahan, isian dalam rentang, pilihan sah), kedalaman bersarang, dan jumlah node. `tersedia` = daftar
 * blok yang boleh dipakai (null = semua); `subjek` = himpunan kode subjek yang ada (null = tidak diperiksa).
 * Hasil: daftar { jalur, pesan }; kosong berarti sah. Berhenti mengumpulkan setelah 20 galat.
 */
export function periksaProyek(proyek, { tersedia = null, subjek = null } = {}) {
  const galat = [];
  /** Mencatat satu galat (dibatasi agar pesan tidak membanjir). */
  const tambah = (jalur, kunci, param = {}) => {
    if (galat.length < 20) galat.push({ jalur, pesan: t(kunci, param) });
  };
  /** Kunci yang tidak dikenal pada sebuah objek. */
  const periksaKunci = (obj, sah, jalur) => {
    const asing = Object.keys(obj).filter((k) => !sah.includes(k));
    if (asing.length > 0) tambah(jalur, 'studio.galat.kunciAsing', { kunci: asing.join(', ') });
  };
  if (!objekBiasa(proyek)) return [{ jalur: [], pesan: t('studio.galat.bukanObjek') }];
  periksaKunci(proyek, ['versi', 'latar', 'variabel', 'sprite'], []);
  if (proyek.versi !== 1) tambah(['versi'], 'studio.galat.versi');
  if (!NAMA_LATAR.includes(proyek.latar)) tambah(['latar'], 'studio.galat.latar', { latar: String(proyek.latar) });
  // `skor` selalu ada (angka); variabel buatan sendiri (Level 3) berupa nama unik tanpa membedakan huruf besar kecil
  if (!objekBiasa(proyek.variabel) || !Number.isFinite(proyek.variabel.skor) || Math.abs(proyek.variabel.skor) > 99999) tambah(['variabel'], 'studio.galat.variabel');
  else {
    const buatan = Object.keys(proyek.variabel).filter((k) => k !== 'skor');
    if (buatan.length > BATAS_STUDIO.maksVariabel) tambah(['variabel'], 'studio.galat.jumlahVariabel', { maks: BATAS_STUDIO.maksVariabel });
    const kunciPakai = new Set(['skor']);
    for (const nama of buatan) {
      const nilaiVar = proyek.variabel[nama];
      // nama: huruf, angka, spasi (tanpa spasi tepi), unik, dan bukan "skor"
      if (!POLA_NAMA_VARIABEL.test(nama) || nama !== nama.trim() || kunciPakai.has(kunciNama(nama))) tambah(['variabel', nama], 'studio.galat.namaVariabel', { maks: BATAS_STUDIO.maksNamaVariabel });
      kunciPakai.add(kunciNama(nama));
      const nilaiSah = (typeof nilaiVar === 'number' && Number.isFinite(nilaiVar) && Math.abs(nilaiVar) <= BATAS_STUDIO.maksAngka) || (typeof nilaiVar === 'string' && nilaiVar.length <= BATAS_STUDIO.maksNilaiTeks);
      if (!nilaiSah) tambah(['variabel', nama], 'studio.galat.nilaiVariabel');
    }
  }
  if (!Array.isArray(proyek.sprite) || proyek.sprite.length > BATAS_STUDIO.maksSprite) {
    tambah(['sprite'], 'studio.galat.jumlahSprite', { maks: BATAS_STUDIO.maksSprite });
    return galat;
  }

  // antrean pekerjaan: sprite -> skrip -> daftar perintah/nilai/syarat, semuanya lewat tumpukan (tanpa rekursi)
  const tumpukan = [];
  const idPakai = new Set();
  for (const [i, sp] of proyek.sprite.entries()) {
    const jalur = ['sprite', i];
    if (!objekBiasa(sp)) {
      tambah(jalur, 'studio.galat.spriteBukanObjek');
      continue;
    }
    // jenis sprite: tanpa `jenis` berarti gambar (proyek Level 2 lama tetap sah)
    const teksSprite = sp.jenis === JENIS_SPRITE.TEKS;
    if (sp.jenis !== undefined && !Object.values(JENIS_SPRITE).includes(sp.jenis)) tambah([...jalur, 'jenis'], 'studio.galat.jenisSprite');
    periksaKunci(sp, teksSprite ? ['id', 'jenis', 'teks', 'ukuran', 'warna', 'x', 'y', 'tampil', 'skrip'] : ['id', 'jenis', 'subjek', 'x', 'y', 'arah', 'kostum', 'kostumUnggahan', 'tampil', 'skrip'], jalur);
    if (typeof sp.id !== 'string' || !/^[a-z0-9_-]{1,20}$/.test(sp.id) || idPakai.has(sp.id)) tambah([...jalur, 'id'], 'studio.galat.idSprite');
    idPakai.add(sp.id);
    if (teksSprite) {
      if (typeof sp.teks !== 'string' || sp.teks.length < 1 || sp.teks.length > BATAS_STUDIO.maksTeksSprite) tambah([...jalur, 'teks'], 'studio.galat.teksSprite', { maks: BATAS_STUDIO.maksTeksSprite });
      if (!DAFTAR_UKURAN_TEKS.includes(sp.ukuran)) tambah([...jalur, 'ukuran'], 'studio.galat.ukuranTeks');
      if (!DAFTAR_WARNA_TEKS.includes(sp.warna)) tambah([...jalur, 'warna'], 'studio.galat.warnaTeks');
    } else {
      // subjek harus Zippy atau subjek gambar yang ada (bila daftar subjek diberikan)
      if (typeof sp.subjek !== 'string' || !/^[a-z0-9-]{1,20}$/.test(sp.subjek) || (subjek && sp.subjek !== SPRITE_ZIPPY && !subjek.has(sp.subjek))) tambah([...jalur, 'subjek'], 'studio.galat.subjek', { subjek: String(sp.subjek) });
      if (!Number.isFinite(sp.arah) || Math.abs(sp.arah) > 360) tambah([...jalur, 'arah'], 'studio.galat.arah');
      // kostum unggahan: rujukan (ID teks angka) unik, maksimal 6; kostum aktif harus salah satu kostum yang ada
      const unggahan = sp.kostumUnggahan;
      const unggahanSah = unggahan === undefined || (Array.isArray(unggahan) && unggahan.length <= BATAS_STUDIO.maksKostumUnggahan && unggahan.every((k) => typeof k === 'string' && /^\d{1,20}$/.test(k)) && new Set(unggahan).size === unggahan.length);
      if (!unggahanSah) tambah([...jalur, 'kostumUnggahan'], 'studio.galat.kostumUnggahan', { maks: BATAS_STUDIO.maksKostumUnggahan });
      if (!Number.isInteger(sp.kostum) || sp.kostum < 0 || sp.kostum >= jumlahKostum({ kostumUnggahan: unggahanSah ? unggahan : [] })) tambah([...jalur, 'kostum'], 'studio.galat.kostum');
    }
    for (const [kunci, maks] of [['x', 480], ['y', 360]]) if (!Number.isFinite(sp[kunci]) || Math.abs(sp[kunci]) > maks) tambah([...jalur, kunci], 'studio.galat.posisi', { maks });
    if (typeof sp.tampil !== 'boolean') tambah([...jalur, 'tampil'], 'studio.galat.tampil');
    if (!Array.isArray(sp.skrip) || sp.skrip.length > BATAS_STUDIO.maksSkripPerSprite) {
      tambah([...jalur, 'skrip'], 'studio.galat.jumlahSkrip', { maks: BATAS_STUDIO.maksSkripPerSprite });
      continue;
    }
    for (const [k, skrip] of sp.skrip.entries()) tumpukan.push({ peran: 'topi', node: skrip, jalur: [...jalur, 'skrip', k], kedalaman: 0 });
  }

  let jumlah = 0;
  while (tumpukan.length > 0 && galat.length < 20) {
    const kerja = tumpukan.pop();
    // daftar perintah: tiap anggota adalah satu perintah/wadah
    if (kerja.peran === 'daftar') {
      for (const [i, node] of kerja.daftar.entries()) tumpukan.push({ peran: 'perintah', node, jalur: [...kerja.jalur, i], kedalaman: kerja.kedalaman });
      continue;
    }
    jumlah += 1;
    // terlalu banyak node: berhenti memeriksa lebih jauh, cukup satu pesan
    if (jumlah > BATAS_STUDIO.maksNode) {
      tambah(kerja.jalur, 'studio.galat.terlaluBesar', { maks: BATAS_STUDIO.maksNode });
      break;
    }
    const { peran, node, jalur, kedalaman } = kerja;
    /** Kedalaman nilai/syarat bersarang (terpisah dari kedalaman wadah); 0 untuk perintah dan skrip. */
    const dalamNilai = kerja.dalamNilai ?? 0;
    const kunciNama = peran === 'topi' ? 'kejadian' : 'blok';
    const def = objekBiasa(node) && typeof node[kunciNama] === 'string' && Object.hasOwn(DAFTAR_BLOK_STUDIO, node[kunciNama]) ? DAFTAR_BLOK_STUDIO[node[kunciNama]] : null;
    // jenis yang cocok dengan tempatnya: perintah boleh perintah atau wadah; selainnya harus sama
    const jenisSah = peran === 'perintah' ? ['perintah', 'wadah'] : [peran];
    if (!def || !jenisSah.includes(def.jenis)) {
      tambah(jalur, 'studio.galat.blokTidakDikenal', { blok: String(node?.[kunciNama] ?? '') });
      continue;
    }
    if (tersedia && !tersedia.includes(node[kunciNama])) tambah(jalur, 'studio.galat.blokTidakTersedia', { blok: node[kunciNama] });
    // skrip (topi) selalu punya `isi` dan boleh membawa posisi di ruang kerja
    const kunciSah = [kunciNama, ...def.bidang.map((b) => b.nama), ...(peran === 'topi' ? ['isi', 'x', 'y'] : [])];
    periksaKunci(node, kunciSah, jalur);
    if (peran === 'topi') {
      for (const k of ['x', 'y']) if (node[k] !== undefined && (!Number.isFinite(node[k]) || Math.abs(node[k]) > 20000)) tambah([...jalur, k], 'studio.galat.posisiRuang');
      if (!Array.isArray(node.isi)) tambah([...jalur, 'isi'], 'studio.galat.isiBukanDaftar');
      else tumpukan.push({ peran: 'daftar', daftar: node.isi, jalur: [...jalur, 'isi'], kedalaman: 0 });
    }
    for (const b of def.bidang) {
      const nilai = node[b.nama];
      const lokasi = [...jalur, b.nama];
      if (b.jenis === 'angka') {
        // angka biasa atau blok nilai (mis. angka acak, skor) yang bersarang
        if (objekBiasa(nilai)) {
          if (dalamNilai + 1 > BATAS_STUDIO.maksKedalamanNilai) tambah(lokasi, 'studio.galat.nilaiTerlaluDalam', { maks: BATAS_STUDIO.maksKedalamanNilai });
          else tumpukan.push({ peran: 'nilai', node: nilai, jalur: lokasi, kedalaman, dalamNilai: dalamNilai + 1 });
        } else if (!Number.isFinite(nilai) || nilai < b.min || nilai > b.maks || (b.bulat && !Number.isInteger(nilai))) tambah(lokasi, 'studio.galat.angka', { min: b.min, maks: b.maks });
      } else if (b.jenis === 'bebas') {
        // isian bebas: angka, teks pendek, atau blok nilai
        if (objekBiasa(nilai)) {
          if (dalamNilai + 1 > BATAS_STUDIO.maksKedalamanNilai) tambah(lokasi, 'studio.galat.nilaiTerlaluDalam', { maks: BATAS_STUDIO.maksKedalamanNilai });
          else tumpukan.push({ peran: 'nilai', node: nilai, jalur: lokasi, kedalaman, dalamNilai: dalamNilai + 1 });
        } else if (!((typeof nilai === 'number' && Number.isFinite(nilai) && Math.abs(nilai) <= BATAS_STUDIO.maksAngka) || (typeof nilai === 'string' && nilai.length <= BATAS_STUDIO.maksNilaiTeks))) tambah(lokasi, 'studio.galat.nilaiBebas', { maks: BATAS_STUDIO.maksNilaiTeks });
      } else if (b.jenis === 'teks') {
        if (typeof nilai !== 'string' || nilai.length > b.maks || nilai.length < (b.min ?? 0)) tambah(lokasi, 'studio.galat.teks', { maks: b.maks });
      } else if (b.jenis === 'pilihan') {
        // pilihan dinamis (variabel/sprite proyek): cukup berpola benar, karena yang dipilih bisa sudah dihapus dari proyek
        const pilihanSah = b.dinamis ? typeof nilai === 'string' && b.pola.test(nilai) : b.nilai.includes(nilai);
        if (!pilihanSah) tambah(lokasi, 'studio.galat.pilihan', { nilai: String(nilai) });
      } else if (b.jenis === 'kondisi') {
        // syarat kosong (null) sah dan dianggap salah
        if (objekBiasa(nilai)) {
          if (dalamNilai + 1 > BATAS_STUDIO.maksKedalamanNilai) tambah(lokasi, 'studio.galat.nilaiTerlaluDalam', { maks: BATAS_STUDIO.maksKedalamanNilai });
          else tumpukan.push({ peran: 'kondisi', node: nilai, jalur: lokasi, kedalaman, dalamNilai: dalamNilai + 1 });
        } else if (nilai !== null) tambah(lokasi, 'studio.galat.syarat');
      } else if (b.jenis === 'isi') {
        if (!Array.isArray(nilai)) tambah(lokasi, 'studio.galat.isiBukanDaftar');
        // wadah di kedalaman maksimal tidak boleh punya isi lagi
        else if (kedalaman + 1 > BATAS_STUDIO.maksKedalaman) tambah(jalur, 'studio.galat.terlaluDalam', { maks: BATAS_STUDIO.maksKedalaman });
        else tumpukan.push({ peran: 'daftar', daftar: nilai, jalur: lokasi, kedalaman: kedalaman + 1 });
      }
    }
  }
  return galat;
}

/** Jumlah blok (skrip, perintah, nilai, syarat) sebuah proyek yang sudah lolos periksaProyek; untuk ringkasan tampilan. */
export function hitungBlokProyek(proyek) {
  let jumlah = 0;
  const tumpukan = proyek.sprite.flatMap((s) => s.skrip);
  while (tumpukan.length > 0) {
    const node = tumpukan.pop();
    if (!objekBiasa(node)) continue;
    jumlah += 1;
    for (const nilai of Object.values(node)) {
      if (Array.isArray(nilai)) tumpukan.push(...nilai);
      else if (objekBiasa(nilai)) tumpukan.push(nilai);
    }
  }
  return jumlah;
}
