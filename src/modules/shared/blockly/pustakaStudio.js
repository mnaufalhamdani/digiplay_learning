import { t } from '@/utils/i18n';

// Pustaka data Studio Zippy yang dipakai bersama oleh validasi (server), penerjemah, dan tampilan (browser):
// ukuran panggung, batas keamanan proyek, daftar latar, tema suara, tombol, dan data labirin. Hanya data murni
// (tanpa DOM dan tanpa akses database) sehingga aman diimpor dari server maupun client.

/** Ukuran panggung seperti Scratch: lebar 480, tinggi 360, pusat (0,0), x -240..240, y -180..180 (y ke atas). */
export const PANGGUNG = Object.freeze({
  lebar: 480,
  tinggi: 360,
  /** Ukuran gambar sprite di panggung (px). */
  ukuranSprite: 56,
  /** Sisi kotak pembatas sprite untuk deteksi sentuhan (px), sedikit lebih kecil dari gambarnya agar tidak terlalu sensitif. */
  kotakSentuh: 40,
  /** Seberapa jauh pusat sprite boleh melewati tepi panggung (px); sprite tidak pernah hilang seluruhnya. */
  lewatTepi: 10,
});

/** Batas keamanan proyek dan penerjemah (penjaga browser dan server dari proyek yang ganas atau terlalu besar). */
export const BATAS_STUDIO = Object.freeze({
  maksSprite: 10,
  maksSkripPerSprite: 20,
  /** Jumlah node (skrip, blok, nilai, syarat) seluruh proyek. */
  maksNode: 2000,
  /** Kedalaman blok wadah (ulangi, selamanya, jika) yang bersarang. */
  maksKedalaman: 5,
  /** Kedalaman nilai/syarat yang bersarang (mis. angka acak di dalam angka acak). */
  maksKedalamanNilai: 6,
  /** Ukuran maksimal proyek sebagai teks JSON (byte). */
  maksUkuranByte: 256 * 1024,
  maksNamaProyek: 60,
  maksTeks: 60,
  /** Jumlah proyek tersimpan per siswa. */
  maksProyek: 30,
  /** Anggaran blok yang dijalankan satu skrip dalam satu bingkai; sisanya ditunda ke bingkai berikutnya. */
  anggaranPerBingkai: 200,
  bingkaiPerDetik: 30,
  // --- Level 3 ---
  /** Variabel buatan sendiri (di luar skor yang selalu ada), panjang nama, dan panjang nama pesan. */
  maksVariabel: 8,
  maksNamaVariabel: 15,
  maksPesan: 20,
  /** Teks sprite teks dan nilai teks variabel. */
  maksTeksSprite: 40,
  maksNilaiTeks: 60,
  /** Kostum unggahan: per sprite, per siswa, ukuran berkas (byte), dan sisi terpanjang gambar setelah diperkecil di browser (px). */
  maksKostumUnggahan: 6,
  maksKostumPerSiswa: 60,
  maksUkuranKostum: 200 * 1024,
  sisiKostum: 256,
  /** Batas hasil hitung angka agar tidak meluap. */
  maksAngka: 999999999,
});

/** Nama sprite Zippy di pustaka sprite (selain subjek gambar). */
export const SPRITE_ZIPPY = 'zippy';
/** Dua kostum Zippy: berkas maskot yang sudah ada di public/aset/maskot. */
export const KOSTUM_ZIPPY = Object.freeze(['zippy-terbang', 'zippy-semangat']);

/**
 * Jalur dua kostum sebuah sprite: subjek gambar memakai berwarna.png (kostum 1) dan outline.png (kostum 2),
 * Zippy memakai dua berkas maskot. Jalur relatif terhadap akar situs.
 */
export function jalurKostum(subjek) {
  if (subjek === SPRITE_ZIPPY) return KOSTUM_ZIPPY.map((n) => `/aset/maskot/${n}.png`);
  return [`/aset/gambar/${subjek}/berwarna.png`, `/aset/gambar/${subjek}/outline.png`];
}

/** Nama latar yang sah. Nama ini dipakai tugas (parameter `tema`), jadi harus persis. */
export const NAMA_LATAR = Object.freeze(['polos', 'taman', 'pantai', 'luar angkasa', 'kota', 'labirin']);
/** Nama tampilan latar. */
export const labelLatar = (kode) => t(`studio.latar.${kode.replace(' ', '_')}`);

/** Tema suara beserta nomor suaranya (3 suara per tema). Nama tema dipakai tugas (parameter `tema_suara`). */
export const TEMA_SUARA = Object.freeze(['hewan', 'musik', 'alam']);
export const NOMOR_SUARA = Object.freeze([1, 2, 3]);
/** Nilai pilihan suara di blok: "<tema>-<nomor>", mis. "hewan-2". */
export const PILIHAN_SUARA = Object.freeze(TEMA_SUARA.flatMap((tema) => NOMOR_SUARA.map((n) => `${tema}-${n}`)));
/** Nama tampilan satu suara, mis. "Hewan 2". */
export const labelSuara = (nilai) => {
  const [tema, nomor] = nilai.split('-');
  return `${t(`studio.tema.${tema}`)} ${nomor}`;
};

/** Tombol keyboard untuk blok "Ketika tombol ditekan": kode blok -> nilai KeyboardEvent.key. */
export const TOMBOL = Object.freeze({ spasi: ' ', kanan: 'ArrowRight', kiri: 'ArrowLeft', atas: 'ArrowUp', bawah: 'ArrowDown' });
export const DAFTAR_TOMBOL = Object.freeze(Object.keys(TOMBOL));

/** Sasaran blok sensor "Menyentuh ...?". */
export const SASARAN_SENTUH = Object.freeze(['tepi', 'dinding', 'tujuan', 'sprite_lain']);
/** Operator pembanding blok operator: lebih besar atau sama dengan, sama dengan, lebih kecil. */
export const OPERATOR_BANDING = Object.freeze(['gt', 'gte', 'eq', 'lt', 'lte']);
/** Operator hitung blok operator Level 3: tambah, kurang, kali, bagi. */
export const OPERATOR_HITUNG = Object.freeze(['tambah', 'kurang', 'kali', 'bagi']);
/** Suasana musik latar Level 3 (nama blok: ceria, tenang, penuh petualangan). */
export const SUASANA_MUSIK = Object.freeze(['ceria', 'tenang', 'petualangan']);

/** Generator acak kecil yang dapat diulang (mulberry32), dipakai membuat labirin yang sama setiap kali. */
function acakBenih(benih) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Membuat latar labirin: 8 x 6 petak (tiap petak 60 px) dengan dinding tipis, satu jalur ke petak tujuan di pojok
 * kanan bawah. Dibuat dengan penelusuran acak yang tetap (benih sama), jadi labirinnya selalu sama dan pasti bisa
 * diselesaikan. Dinding berupa daftar persegi panjang { x1, y1, x2, y2 } (y ke atas) untuk deteksi sentuhan.
 */
function buatLabirin() {
  const kolom = 8;
  const baris = 6;
  const petak = 60;
  const tebal = 4;
  const acak = acakBenih(7);
  // dinding vertikal v[r][c] di sisi kiri petak (c, r); horizontal h[r][c] di sisi atas petak (c, r); semua mulai tertutup
  const v = Array.from({ length: baris }, () => Array(kolom + 1).fill(true));
  const h = Array.from({ length: baris + 1 }, () => Array(kolom).fill(true));
  const dikunjungi = Array.from({ length: baris }, () => Array(kolom).fill(false));
  // penelusuran dengan tumpukan (bukan rekursi) dari petak kiri atas
  const tumpukan = [[0, 0]];
  dikunjungi[0][0] = true;
  while (tumpukan.length > 0) {
    const [c, r] = tumpukan[tumpukan.length - 1];
    const tetangga = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([x, y]) => x >= 0 && x < kolom && y >= 0 && y < baris && !dikunjungi[y][x]);
    // buntu: mundur ke petak sebelumnya
    if (tetangga.length === 0) {
      tumpukan.pop();
      continue;
    }
    const [nx, ny] = tetangga[Math.floor(acak() * tetangga.length)];
    // buka dinding di antara petak sekarang dan tetangganya
    if (nx !== c) v[r][Math.max(c, nx)] = false;
    else h[Math.max(r, ny)][c] = false;
    dikunjungi[ny][nx] = true;
    tumpukan.push([nx, ny]);
  }
  const kiri = -PANGGUNG.lebar / 2;
  const atas = PANGGUNG.tinggi / 2;
  const dinding = [];
  for (let r = 0; r < baris; r += 1) {
    for (let i = 0; i <= kolom; i += 1) {
      if (v[r][i]) dinding.push({ x1: kiri + i * petak - tebal, x2: kiri + i * petak + tebal, y1: atas - (r + 1) * petak - tebal, y2: atas - r * petak + tebal });
    }
  }
  for (let j = 0; j <= baris; j += 1) {
    for (let c = 0; c < kolom; c += 1) {
      if (h[j][c]) dinding.push({ x1: kiri + c * petak - tebal, x2: kiri + (c + 1) * petak + tebal, y1: atas - j * petak - tebal, y2: atas - j * petak + tebal });
    }
  }
  const pusatTujuan = { x: kiri + (kolom - 0.5) * petak, y: atas - (baris - 0.5) * petak };
  return {
    petak,
    dinding,
    // petak tujuan (bintang): kotak 36 px di tengah petak kanan bawah
    tujuan: { x1: pusatTujuan.x - 18, x2: pusatTujuan.x + 18, y1: pusatTujuan.y - 18, y2: pusatTujuan.y + 18 },
    // posisi awal yang disarankan: tengah petak kiri atas
    mulai: { x: kiri + 0.5 * petak, y: atas - 0.5 * petak },
  };
}

/** Data latar labirin (dibuat sekali saat modul dimuat). */
export const DATA_LABIRIN = Object.freeze(buatLabirin());

/** Apakah dua persegi panjang { x1, x2, y1, y2 } bersinggungan (menempel saja tidak dihitung). */
export function bersinggungan(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/** Kotak pembatas sprite di (x, y) untuk deteksi sentuhan. */
export function kotakSprite(x, y) {
  const s = PANGGUNG.kotakSentuh / 2;
  return { x1: x - s, x2: x + s, y1: y - s, y2: y + s };
}

// ---------------------------------------------------------------------------------------------------------------
// Level 3: sprite teks, kostum unggahan, nama variabel dan pesan
// ---------------------------------------------------------------------------------------------------------------

/** Jenis sprite: gambar (subjek atau Zippy, punya kostum) atau teks (tulisan di panggung, tanpa kostum). */
export const JENIS_SPRITE = Object.freeze({ GAMBAR: 'gambar', TEKS: 'teks' });
/** Tinggi huruf sprite teks (px panggung) per pilihan ukuran. */
export const UKURAN_TEKS = Object.freeze({ kecil: 18, sedang: 28, besar: 40, sangat_besar: 56 });
/**
 * Warna sprite teks: isi huruf dan garis tepinya. Tiap pasangan dipilih agar terbaca di semua latar
 * (huruf terang bergaris tepi gelap; hitam bergaris tepi putih).
 */
export const WARNA_TEKS = Object.freeze({
  putih: { isi: '#FFFFFF', tepi: '#1F1B3A' },
  kuning: { isi: '#FFD54A', tepi: '#1F1B3A' },
  oranye: { isi: '#FF9A3C', tepi: '#1F1B3A' },
  merah: { isi: '#FF6B6B', tepi: '#1F1B3A' },
  hijau: { isi: '#4ADE80', tepi: '#1F1B3A' },
  biru: { isi: '#60A5FA', tepi: '#1F1B3A' },
  ungu: { isi: '#C4A3FF', tepi: '#1F1B3A' },
  hitam: { isi: '#1F1B3A', tepi: '#FFFFFF' },
});
export const DAFTAR_UKURAN_TEKS = Object.freeze(Object.keys(UKURAN_TEKS));
export const DAFTAR_WARNA_TEKS = Object.freeze(Object.keys(WARNA_TEKS));

/** Pola nama variabel buatan sendiri: huruf, angka, dan spasi, 1 sampai 15 karakter. */
export const POLA_NAMA_VARIABEL = /^[A-Za-z0-9 ]{1,15}$/;
/** Kunci pembanding nama (variabel dan pesan): tanpa spasi tepi dan tidak membedakan huruf besar kecil. */
export const kunciNama = (nama) => String(nama ?? '').trim().toLowerCase();
/** Alamat gambar sebuah kostum unggahan (disajikan lewat route HTTP studio; pengelola, pemilik, dan orang tua boleh membaca). */
export const urlKostumUnggahan = (id) => `/api/v1/studio/kostum/berkas?id=${encodeURIComponent(id)}`;

/** Jumlah kostum sebuah sprite: gambar punya dua kostum bawaan ditambah unggahan; teks tidak punya kostum (dihitung 1). */
export function jumlahKostum(sprite) {
  if (sprite.jenis === JENIS_SPRITE.TEKS) return 1;
  return 2 + (sprite.kostumUnggahan?.length ?? 0);
}

/** Daftar alamat gambar semua kostum sebuah sprite gambar: dua kostum bawaan lalu kostum unggahan berurutan. */
export function jalurKostumSprite(sprite) {
  return [...jalurKostum(sprite.subjek), ...(sprite.kostumUnggahan ?? []).map(urlKostumUnggahan)];
}

/** Ukuran kotak pembatas sprite teks (px panggung) dari panjang teks dan tinggi hurufnya (perkiraan). */
export function ukuranKotakTeks(teks, ukuran) {
  const tinggi = UKURAN_TEKS[ukuran] ?? UKURAN_TEKS.sedang;
  return { lebar: Math.max(tinggi, String(teks ?? '').length * tinggi * 0.55), tinggi: tinggi * 1.3 };
}

/** Kotak pembatas sebuah sprite (gambar atau teks) di posisinya untuk deteksi sentuhan. */
export function kotakDari(sprite) {
  if (sprite.jenis !== JENIS_SPRITE.TEKS) return kotakSprite(sprite.x, sprite.y);
  const { lebar, tinggi } = ukuranKotakTeks(sprite.teks, sprite.ukuran);
  return { x1: sprite.x - lebar / 2, x2: sprite.x + lebar / 2, y1: sprite.y - tinggi / 2, y2: sprite.y + tinggi / 2 };
}


/**
 * Mencabut rujukan kostum unggahan `kostumId` dari proyek: ID dibuang dari daftar kostum unggahan tiap sprite, kostum
 * aktif yang menunjuk kostum itu kembali ke kostum pertama, dan yang menunjuk kostum sesudahnya bergeser satu.
 * Dipakai browser (saat siswa menghapus kostum) dan server (membersihkan proyek tersimpan). Mengembalikan proyek baru.
 */
export function cabutKostum(proyek, kostumId) {
  return {
    ...proyek,
    sprite: proyek.sprite.map((s) => {
      const indeks = (s.kostumUnggahan ?? []).indexOf(kostumId);
      // sprite ini tidak memakai kostum itu
      if (indeks < 0) return s;
      const posisi = 2 + indeks;
      return { ...s, kostumUnggahan: s.kostumUnggahan.filter((k) => k !== kostumId), kostum: s.kostum === posisi ? 0 : s.kostum > posisi ? s.kostum - 1 : s.kostum };
    }),
  };
}
