// Rumus dan olahan data mengetik (fungsi murni). Dipakai browser (HUD langsung) dan server (hitung ulang, adaptif, post test).

/** Pembulatan 2 desimal. */
function bulat2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** WPM = (karakter benar / 5) / menit. */
export function hitungWpm(jumlahBenar, durasiDetik) {
  // belum ada waktu berjalan: hindari pembagian dengan nol
  if (!(durasiDetik > 0)) return 0;
  return bulat2(jumlahBenar / 5 / (durasiDetik / 60));
}

/** Akurasi = ketikan benar / seluruh ketikan x 100 (ketikan salah yang dihapus tetap terhitung). */
export function hitungAkurasi(jumlahBenar, jumlahDiketik) {
  // belum mengetik apa pun dianggap 100 agar HUD tidak menakutkan di awal
  if (!(jumlahDiketik > 0)) return 100;
  return bulat2((jumlahBenar / jumlahDiketik) * 100);
}

/** Konsistensi = 100 x (1 - simpangan baku / rata-rata) dari WPM per segmen 5 detik; null bila kurang dari 10 detik. */
export function hitungKonsistensi(wpmSegmen, durasiDetik) {
  // data terlalu pendek untuk dibandingkan antarsegmen
  if (durasiDetik < 10 || wpmSegmen.length < 2) return null;
  const rata = wpmSegmen.reduce((a, b) => a + b, 0) / wpmSegmen.length;
  if (rata <= 0) return 0;
  const sb = Math.sqrt(wpmSegmen.reduce((a, b) => a + (b - rata) ** 2, 0) / wpmSegmen.length);
  return bulat2(Math.min(100, Math.max(0, 100 * (1 - sb / rata))));
}

/** Kunci detail_tombol untuk satu karakter: huruf kecil, spasi memakai "spasi". */
export function kunciTombol(karakter) {
  return karakter === ' ' ? 'spasi' : String(karakter).toLowerCase();
}

/** Bintang pelajaran: 0 belum tercapai, 1 target, 2 = WPM >= 1,2 x target, 3 = WPM >= 1,5 x target dan akurasi >= 97. */
export function hitungBintang(wpm, akurasi, targetWpm, targetAkurasi) {
  // target belum tercapai
  if (wpm < targetWpm || akurasi < targetAkurasi) return 0;
  if (wpm >= 1.5 * targetWpm && akurasi >= 97) return 3;
  return wpm >= 1.2 * targetWpm ? 2 : 1;
}

/**
 * Nilai bagian tes mengetik post test: min(100, 100 x WPM / target) x (akurasi / 100), 2 desimal.
 * Satu-satunya tempat rumus ini agar mudah diubah.
 */
export function hitungNilaiMengetik(wpm, akurasi, targetWpm) {
  // target tidak diatur: nilai hanya dari akurasi
  const kecepatan = Number(targetWpm) > 0 ? Math.min(100, (100 * Number(wpm)) / Number(targetWpm)) : 100;
  return bulat2(kecepatan * (Number(akurasi) / 100));
}

/** Menggabungkan banyak detail_tombol menjadi satu { tombol: { ketik, salah } }. */
export function gabungDetailTombol(daftarDetail) {
  const hasil = {};
  for (const detail of daftarDetail) {
    for (const [k, v] of Object.entries(detail ?? {})) {
      hasil[k] ??= { ketik: 0, salah: 0 };
      hasil[k].ketik += Number(v?.ketik) || 0;
      hasil[k].salah += Number(v?.salah) || 0;
    }
  }
  return hasil;
}

/** Sampai `maks` tombol dengan rasio salah tertinggi (minimal `minKetik` ketikan, ada kesalahan, spasi diabaikan). */
export function tombolLemah(detail, maks = 5, minKetik = 5) {
  return Object.entries(detail)
    .filter(([k, v]) => k !== 'spasi' && v.ketik >= minKetik && v.salah > 0)
    .sort((a, b) => b[1].salah / b[1].ketik - a[1].salah / a[1].ketik)
    .slice(0, maks)
    .map(([k]) => k);
}

/**
 * Teks latihan adaptif 40-60 karakter dari kata-kata `sumber` yang memuat tombol lemah (urutan acak, RNG disuntikkan).
 * Bila kata yang cocok kurang, ditambah deret dari tombol itu sendiri (mis. "kkk sks").
 */
export function susunTeksAdaptif(tombol, sumber, acak) {
  const kata = [...new Set(sumber.flatMap((t) => String(t).toLowerCase().split(/\s+/)))].filter((k) => /^[a-z;,./]+$/.test(k) && tombol.some((x) => k.includes(x)));
  const bagian = [];
  let panjang = 0;
  // ambil kata acak sampai minimal 40 karakter, tanpa melewati 60
  while (kata.length > 0 && panjang < 40) {
    const [k] = kata.splice(acak(kata.length), 1);
    if (panjang + k.length + 1 > 60) continue;
    bagian.push(k);
    panjang += k.length + 1;
  }
  // kata yang cocok habis sebelum 40 karakter: lengkapi dengan deret tombol lemah
  for (let i = 0; panjang < 40 && tombol.length > 0; i += 1) {
    const deret = tombol[i % tombol.length].repeat(3);
    bagian.push(deret);
    panjang += deret.length + 1;
  }
  return bagian.join(' ').slice(0, 60).trim();
}
