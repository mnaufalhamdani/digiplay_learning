import { t } from './i18n.js';
import { adalahAppError } from './appError.js';
import { evaluasiEkspresi, variabelEkspresi } from './evaluasiEkspresi.js';
import { renderTemplate } from './templateRender.js';
import { DAFTAR_PENILAIAN, JENIS_GAMBAR, JENIS_BLOCKLY, JENIS_GAMBAR_UNDUH, JENIS_GAME_MOUSE, KEPING_PUZZLE, PENILAIAN, TIPE_DICEK_TUTOR_SAJA, TIPE_TEMPLATE } from '../enums/index.js';

// Validasi template sebelum disimpan (seed dan halaman Template). Hasilnya daftar pesan galat (kosong = valid).

/** Berapa kali template dirender untuk menguji parameter acak. */
const JUMLAH_RENDER = 50;
/** Penanda parameter di teks: {nama}. */
const POLA_PENANDA = /\{(\w+)\}/g;

/** Objek biasa (bukan array/null). */
function objekBiasa(nilai) {
  return nilai != null && typeof nilai === 'object' && !Array.isArray(nilai);
}

/** Semua teks di dalam nilai bertingkat (opsi, kunci), untuk mencari penanda. */
function kumpulkanTeks(nilai, hasil = []) {
  if (typeof nilai === 'string') hasil.push(nilai);
  else if (Array.isArray(nilai)) nilai.forEach((isi) => kumpulkanTeks(isi, hasil));
  // objek: hanya nilainya yang diperiksa, nama kuncinya tidak
  else if (objekBiasa(nilai)) Object.values(nilai).forEach((isi) => kumpulkanTeks(isi, hasil));
  return hasil;
}

/** Nama penanda {nama} yang muncul di sekumpulan teks. */
function namaPenanda(daftarTeks) {
  return new Set(daftarTeks.flatMap((teks) => [...teks.matchAll(POLA_PENANDA)].map((m) => m[1])));
}

/** Bentuk kolom JSON, tipe, penilaian, dan teks. */
function periksaDasar(tpl, galat) {
  if (!TIPE_TEMPLATE.includes(tpl.tipe)) galat.add(t('template.galat.tipe', { tipe: String(tpl.tipe) }));
  if (!DAFTAR_PENILAIAN.includes(tpl.penilaian)) galat.add(t('template.galat.penilaian', { penilaian: String(tpl.penilaian) }));
  if (typeof tpl.teks !== 'string' || tpl.teks.trim() === '') galat.add(t('template.galat.teksKosong'));
  if (tpl.parameter != null && !objekBiasa(tpl.parameter)) galat.add(t('template.galat.bentukParameter'));
  if (tpl.opsi != null && !Array.isArray(tpl.opsi)) galat.add(t('template.galat.bentukOpsi'));
  if (tpl.kunci != null && !objekBiasa(tpl.kunci)) galat.add(t('template.galat.bentukKunci'));
}

/** Aturan tiap parameter: daftar tidak kosong, rentang {min,max} bulat, atau {dari:"gambar", jenis} yang dikenal. */
function periksaParameter(parameter, galat) {
  for (const [nama, aturan] of Object.entries(parameter)) {
    const daftarSah = Array.isArray(aturan) && aturan.length > 0 && aturan.every((v) => ['string', 'number'].includes(typeof v));
    const gambarSah = aturan?.dari === 'gambar' && JENIS_GAMBAR.includes(aturan.jenis);
    const rentangSah = Number.isInteger(aturan?.min) && Number.isInteger(aturan?.max) && aturan.min <= aturan.max;
    // bukan salah satu dari tiga bentuk yang dikenal
    if (!daftarSah && !gambarSah && !rentangSah) galat.add(t('template.galat.aturanParameter', { nama }));
  }
}

/** Nama parameter yang memilih gambar bahan unduhan (jenis mewarnai atau berwarna). */
function parameterBahan(parameter) {
  return Object.entries(parameter)
    .filter(([, aturan]) => aturan?.dari === 'gambar' && JENIS_GAMBAR_UNDUH.includes(aturan.jenis))
    .map(([nama]) => nama);
}

/**
 * Aturan instruksi bahan: tidak menyebut "menu Bahan" (unduhan ada langsung di instruksi), tidak menyebut nama subjek
 * bahan unduhan (penandanya tidak boleh ada di teks), dan harus memakai kata "bahan" agar tombol Unduh bahan bermakna.
 */
function periksaBahan(tpl, parameter, galat) {
  if (/menu\s+bahan/i.test(tpl.teks ?? '')) galat.add(t('template.galat.menuBahan'));
  const bahan = parameterBahan(parameter);
  // tanpa gambar unduhan tidak ada aturan lain
  if (bahan.length === 0) return;
  const dalamTeks = namaPenanda([tpl.teks ?? '']);
  for (const nama of bahan) if (dalamTeks.has(nama)) galat.add(t('template.galat.namaBahanDiTeks', { nama }));
  if (!/\bbahan\b/i.test(tpl.teks ?? '')) galat.add(t('template.galat.bahanTanpaKata'));
}

/** Setiap penanda punya parameter, dan setiap parameter dipakai (teks, opsi, kunci, ekspresi, atau jika). */
function periksaPenanda(tpl, parameter, galat) {
  const kunci = objekBiasa(tpl.kunci) ? tpl.kunci : {};
  const penanda = namaPenanda([tpl.teks ?? '', ...kumpulkanTeks(tpl.opsi), ...kumpulkanTeks(kunci)]);
  const variabel = [...variabelEkspresi(kunci.ekspresi), ...variabelEkspresi(kunci.jika)];
  for (const nama of penanda) if (!Object.hasOwn(parameter, nama)) galat.add(t('template.galat.penandaTanpaParameter', { nama }));
  for (const nama of variabel) if (!Object.hasOwn(parameter, nama)) galat.add(t('template.galat.variabelTanpaParameter', { nama }));
  // gambar bahan unduhan dipilih lewat parameter tetapi namanya sengaja tidak ditulis di instruksi
  const terpakai = new Set([...penanda, ...variabel, ...parameterBahan(parameter)]);
  for (const nama of Object.keys(parameter)) if (!terpakai.has(nama)) galat.add(t('template.galat.parameterTidakTerpakai', { nama }));
}

/** Kunci wajib per tipe untuk tugas yang dinilai otomatis. */
function periksaKunciOtomatis(tpl, kunci, galat) {
  // tugas di aplikasi lain (Word, Paint, Scratch, ...) tidak punya jawaban yang bisa dicocokkan
  if (TIPE_DICEK_TUTOR_SAJA.includes(tpl.tipe)) galat.add(t('template.galat.harusDicekTutor', { tipe: tpl.tipe }));
  if (tpl.tipe === 'excel' && kunci.ekspresi == null && kunci.jika == null) galat.add(t('template.galat.excelTanpaKunci'));
  if (kunci.jika != null && (typeof kunci.maka !== 'string' || typeof kunci.lainnya !== 'string')) galat.add(t('template.galat.jikaTanpaHasil'));
  if (kunci.toleransi != null && !(typeof kunci.toleransi === 'number' && kunci.toleransi >= 0)) galat.add(t('template.galat.toleransi'));
  if (tpl.tipe === 'mengetik' && (typeof kunci.teks_ketik !== 'string' || kunci.teks_ketik.trim() === '')) galat.add(t('template.galat.teksKetik'));
  if (tpl.tipe === 'game_mouse' && (!JENIS_GAME_MOUSE.includes(kunci.jenis) || kunci.min_skor == null)) galat.add(t('template.galat.gameMouse'));
  if (tpl.tipe === 'puzzle' && !KEPING_PUZZLE.includes(kunci.keping)) galat.add(t('template.galat.keping'));
  // Coding Zippy: dicocokkan dengan hasil_latihan.jenis dan nama labirin yang berhasil diselesaikan
  if (tpl.tipe === 'blockly' && (kunci.jenis !== JENIS_BLOCKLY || typeof kunci.labirin !== 'string' || kunci.labirin.trim() === '')) galat.add(t('template.galat.blockly'));
}

/** Aturan pilihan ganda (4 opsi, kunci.benar 0-3) dan kunci per tipe. */
function periksaKunci(tpl, galat) {
  const kunci = objekBiasa(tpl.kunci) ? tpl.kunci : {};
  if (tpl.tipe === 'pilihan_ganda') {
    // pilihan ganda selalu dinilai otomatis dari indeks kunci
    if (tpl.penilaian !== PENILAIAN.OTOMATIS) galat.add(t('template.galat.pgHarusOtomatis'));
    if (!Array.isArray(tpl.opsi) || tpl.opsi.length !== 4) galat.add(t('template.galat.opsiEmpat'));
    if (!Number.isInteger(kunci.benar) || kunci.benar < 0 || kunci.benar > 3) galat.add(t('template.galat.kunciBenar'));
    return;
  }
  // tugas yang dicek tutor cukup punya rubrik (boleh kosong: pakai rubrik bawaan)
  if (tpl.penilaian === PENILAIAN.OTOMATIS) periksaKunciOtomatis(tpl, kunci, galat);
}

/** Memeriksa satu hasil render: opsi unik, ekspresi wajar, dan mencatat hasil syarat `jika`. */
function periksaSatuRender(tpl, hasil, galat, hasilJika) {
  const kunci = objekBiasa(tpl.kunci) ? tpl.kunci : {};
  if (hasil.opsi && new Set(hasil.opsi.map((o) => o.teks.trim())).size !== hasil.opsi.length) galat.add(t('template.galat.opsiKembar'));
  if (kunci.ekspresi != null) {
    const nilai = evaluasiEkspresi(kunci.ekspresi, hasil.nilaiParameter);
    const bulat = Math.abs(nilai - Math.round(nilai)) < 1e-9;
    if (typeof nilai !== 'number' || !Number.isFinite(nilai)) galat.add(t('template.galat.ekspresiBukanAngka'));
    else if (nilai < 0) galat.add(t('template.galat.ekspresiNegatif'));
    // hasil berkoma hanya boleh bila ada toleransi (siswa diminta membulatkan)
    else if (!bulat && !(Number(kunci.toleransi) > 0)) galat.add(t('template.galat.ekspresiTidakBulat'));
  }
  if (kunci.jika != null) {
    const syarat = evaluasiEkspresi(kunci.jika, hasil.nilaiParameter);
    // syarat harus berupa perbandingan (true/false), bukan angka
    if (typeof syarat !== 'boolean') galat.add(t('template.galat.jikaBukanPerbandingan'));
    else hasilJika.add(syarat);
  }
}

/** Merender berulang kali; galat render (gambar kosong, ekspresi rusak) dicatat sekali lalu berhenti. */
function periksaRender(tpl, gambarTersedia, acak, galat) {
  const hasilJika = new Set();
  for (let i = 0; i < JUMLAH_RENDER; i += 1) {
    try {
      periksaSatuRender(tpl, renderTemplate(tpl, { acak, gambarTersedia }), galat, hasilJika);
    } catch (error) {
      // galat yang kita kenal (AppError) pesannya aman ditampilkan; selain itu teruskan
      if (!adalahAppError(error)) throw error;
      galat.add(error.message);
      return;
    }
  }
  // syarat IF yang selalu sama membuat salah satu jawaban tidak pernah muncul
  if (tpl.kunci?.jika != null && hasilJika.size === 1) galat.add(t('template.galat.jikaSatuHasil'));
}

/**
 * Memvalidasi template: bentuk kolom, parameter, penanda, kunci per tipe, lalu render JUMLAH_RENDER kali.
 * `gambarTersedia`: { mewarnai|berwarna|puzzle: [{kode, nama}] }. `acak(n)`: RNG yang disuntikkan.
 * Mengembalikan daftar pesan galat; kosong berarti template valid.
 */
export function validasiTemplate(tpl, gambarTersedia, acak) {
  const galat = new Set();
  periksaDasar(tpl, galat);
  // bentuk dasar salah: pemeriksaan lanjutan akan menghasilkan galat yang membingungkan
  if (galat.size > 0) return [...galat];
  const parameter = tpl.parameter ?? {};
  periksaParameter(parameter, galat);
  periksaPenanda(tpl, parameter, galat);
  periksaBahan(tpl, parameter, galat);
  periksaKunci(tpl, galat);
  // render hanya bila aturan statis sudah benar
  if (galat.size === 0) periksaRender(tpl, gambarTersedia, acak, galat);
  return [...galat];
}
