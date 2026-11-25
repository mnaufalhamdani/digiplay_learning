import { AppError } from './appError.js';
import { t } from './i18n.js';

// Pengurai dan penghitung ekspresi kunci template (mis. "a+b+c", "max(a,b)/2", "a>=batas").
// Ditulis sendiri tanpa eval/Function agar isi template tidak pernah dijalankan sebagai kode.
// Tata bahasa (dari prioritas rendah ke tinggi):
//   perbandingan := aditif [ (>= > <= < == !=) aditif ]
//   aditif       := perkalian { (+ -) perkalian }
//   perkalian    := unair { (* /) unair }
//   unair        := - unair | primer
//   primer       := angka | nama | nama ( argumen {, argumen} ) | ( perbandingan )

/** Fungsi yang boleh dipakai di ekspresi beserta jumlah argumen minimalnya dan maksimalnya. */
const FUNGSI = Object.freeze({
  max: { fn: Math.max, min: 1, maks: Infinity },
  min: { fn: Math.min, min: 1, maks: Infinity },
  abs: { fn: Math.abs, min: 1, maks: 1 },
  round: { fn: Math.round, min: 1, maks: 1 },
});

/** Operator pembanding; dua karakter dicek lebih dulu agar ">=" tidak terbaca sebagai ">". */
const PEMBANDING = ['>=', '<=', '==', '!=', '>', '<'];

/** Galat ekspresi tidak valid (pesan aman ditampilkan ke admin). */
function galatEkspresi(ekspresi) {
  return new AppError(t('ekspresi.tidakValid', { ekspresi }), 400);
}

/** Memecah teks ekspresi menjadi token: angka, nama, pembanding, dan simbol + - * / ( ) ,. */
function tokenisasi(ekspresi) {
  const teks = String(ekspresi ?? '');
  const token = [];
  let i = 0;
  while (i < teks.length) {
    const sisa = teks.slice(i);
    const spasi = /^\s+/.exec(sisa);
    const angka = /^\d+(\.\d+)?/.exec(sisa);
    const nama = /^[A-Za-z_]\w*/.exec(sisa);
    const pembanding = PEMBANDING.find((op) => sisa.startsWith(op));
    // urutan pengecekan penting: angka sebelum nama, pembanding dua karakter sebelum simbol
    if (spasi) i += spasi[0].length;
    else if (angka) token.push({ jenis: 'angka', nilai: Number(angka[0]), panjang: angka[0].length });
    else if (nama) token.push({ jenis: 'nama', nilai: nama[0], panjang: nama[0].length });
    else if (pembanding) token.push({ jenis: 'pembanding', nilai: pembanding, panjang: pembanding.length });
    else if ('+-*/(),'.includes(sisa[0])) token.push({ jenis: 'simbol', nilai: sisa[0], panjang: 1 });
    // karakter lain (huruf aneh, titik koma, kutip): ekspresi tidak sah
    else throw galatEkspresi(ekspresi);
    // spasi sudah memajukan posisi sendiri; token lain maju sepanjang tokennya
    if (!spasi) i += token[token.length - 1].panjang;
  }
  return token;
}

/** Mengubah nilai variabel menjadi angka; nilai teks angka ("60") diterima, selain itu galat. */
function angkaVariabel(nama, variabel) {
  // variabel tidak ada di parameter template
  if (!Object.hasOwn(variabel ?? {}, nama)) throw new AppError(t('ekspresi.variabelTidakAda', { nama }), 400);
  const nilai = variabel[nama];
  const angka = typeof nilai === 'number' ? nilai : Number(String(nilai).trim());
  // nilai kosong atau teks non-angka tidak bisa dihitung
  if (String(nilai).trim() === '' || !Number.isFinite(angka)) throw new AppError(t('ekspresi.bukanAngka', { nama }), 400);
  return angka;
}

/** Menghitung perbandingan dua angka sesuai operatornya. */
function bandingkan(kiri, op, kanan) {
  switch (op) {
    case '>=':
      return kiri >= kanan;
    case '<=':
      return kiri <= kanan;
    case '>':
      return kiri > kanan;
    case '<':
      return kiri < kanan;
    case '==':
      return kiri === kanan;
    // satu-satunya sisa dari daftar PEMBANDING
    default:
      return kiri !== kanan;
  }
}

/**
 * Membuat pengurai rekursif untuk satu daftar token; tiap fungsi aturan langsung menghitung nilainya.
 * Pembanding hanya boleh di tingkat paling luar sehingga hasilnya boolean, selain itu angka.
 */
function buatPengurai(token, variabel, ekspresi) {
  let posisi = 0;
  const lihat = () => token[posisi];
  /** Maju satu token bila token saat ini adalah simbol `nilai`. */
  function ambilSimbol(nilai) {
    // hanya simbol yang dicocokkan, supaya nama/angka tidak tertukar dengan operator
    if (lihat()?.jenis === 'simbol' && lihat().nilai === nilai) {
      posisi += 1;
      return true;
    }
    return false;
  }
  /** Memastikan nilai hasil sub-ekspresi berupa angka (perbandingan tidak boleh dipakai di tengah hitungan). */
  function angka(nilai) {
    if (typeof nilai !== 'number') throw galatEkspresi(ekspresi);
    return nilai;
  }
  /** Argumen fungsi dipisah koma, diakhiri kurung tutup. */
  function argumen() {
    const daftar = [angka(aditif())];
    while (ambilSimbol(',')) daftar.push(angka(aditif()));
    if (!ambilSimbol(')')) throw galatEkspresi(ekspresi);
    return daftar;
  }
  /** Pemanggilan fungsi bawaan (max, min, abs, round). */
  function panggilFungsi(nama) {
    const fungsi = FUNGSI[nama.toLowerCase()];
    // nama fungsi di luar daftar yang diizinkan
    if (!fungsi) throw new AppError(t('ekspresi.fungsiTidakDikenal', { nama }), 400);
    const args = argumen();
    // jumlah argumen salah (mis. abs(a,b) atau max())
    if (args.length < fungsi.min || args.length > fungsi.maks) throw galatEkspresi(ekspresi);
    return fungsi.fn(...args);
  }
  /** Angka, variabel, fungsi, atau ekspresi dalam kurung. */
  function primer() {
    const tk = lihat();
    // token habis di tengah ekspresi (mis. "a+")
    if (!tk) throw galatEkspresi(ekspresi);
    posisi += 1;
    if (tk.jenis === 'angka') return tk.nilai;
    // nama diikuti kurung buka = pemanggilan fungsi; selain itu variabel
    if (tk.jenis === 'nama') return ambilSimbol('(') ? panggilFungsi(tk.nilai) : angkaVariabel(tk.nilai, variabel);
    if (tk.jenis === 'simbol' && tk.nilai === '(') {
      const isi = perbandingan();
      if (!ambilSimbol(')')) throw galatEkspresi(ekspresi);
      return isi;
    }
    // operator di posisi yang salah (mis. "*a")
    throw galatEkspresi(ekspresi);
  }
  /** Minus unair, boleh bertumpuk ("--a"). */
  function unair() {
    return ambilSimbol('-') ? -angka(unair()) : primer();
  }
  /** Perkalian dan pembagian (kiri ke kanan); pembagian dengan nol ditolak. */
  function perkalian() {
    let nilai = unair();
    for (;;) {
      if (ambilSimbol('*')) nilai = angka(nilai) * angka(unair());
      else if (ambilSimbol('/')) {
        const pembagi = angka(unair());
        // pembagian dengan nol menghasilkan Infinity yang tidak bermakna sebagai jawaban
        if (pembagi === 0) throw new AppError(t('ekspresi.bagiNol'), 400);
        nilai = angka(nilai) / pembagi;
      } else return nilai;
    }
  }
  /** Penjumlahan dan pengurangan (kiri ke kanan). */
  function aditif() {
    let nilai = perkalian();
    for (;;) {
      if (ambilSimbol('+')) nilai = angka(nilai) + angka(perkalian());
      else if (ambilSimbol('-')) nilai = angka(nilai) - angka(perkalian());
      else return nilai;
    }
  }
  /** Tingkat paling luar: aditif, opsional diikuti satu pembanding. */
  function perbandingan() {
    const kiri = aditif();
    // tidak ada pembanding: hasilnya angka biasa
    if (lihat()?.jenis !== 'pembanding') return kiri;
    const op = token[posisi].nilai;
    posisi += 1;
    return bandingkan(angka(kiri), op, angka(aditif()));
  }
  return {
    /** Mengurai seluruh token; sisa token di akhir berarti ekspresi tidak sah (mis. "a b"). */
    hitung() {
      const hasil = perbandingan();
      if (posisi < token.length) throw galatEkspresi(ekspresi);
      return hasil;
    },
  };
}

/**
 * Menghitung ekspresi dengan nilai variabel dari parameter template.
 * Hasil: angka, atau boolean bila ekspresi memakai pembanding (untuk syarat `jika`).
 * Ekspresi tidak valid, variabel tidak ada, atau pembagian nol -> AppError.
 */
export function evaluasiEkspresi(ekspresi, variabel = {}) {
  const token = tokenisasi(ekspresi);
  // ekspresi kosong tidak punya nilai
  if (token.length === 0) throw galatEkspresi(ekspresi);
  return buatPengurai(token, variabel, ekspresi).hitung();
}

/** Nama variabel yang dipakai sebuah ekspresi (tanpa nama fungsi); kosong bila ekspresi tidak sah. */
export function variabelEkspresi(ekspresi) {
  let token;
  try {
    token = tokenisasi(ekspresi);
  } catch {
    // ekspresi rusak: kesalahannya dilaporkan saat dihitung, bukan di sini
    return [];
  }
  const nama = token.filter((tk, i) => tk.jenis === 'nama' && !(token[i + 1]?.jenis === 'simbol' && token[i + 1].nilai === '('));
  return [...new Set(nama.map((tk) => tk.nilai))];
}
