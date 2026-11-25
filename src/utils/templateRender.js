import { AppError } from './appError.js';
import { t } from './i18n.js';
import { evaluasiEkspresi } from './evaluasiEkspresi.js';

// Fungsi murni untuk template soal/tugas: render parameter acak, periksa jawaban otomatis, dan kunci harapan.
// Dipakai ulang oleh seed (validasi), pratinjau template (Fase B), generate tugas (Fase C), dan post test (Fase D).
// RNG `acak(n)` selalu disuntikkan pemanggil dan mengembalikan bilangan bulat 0 sampai n-1.

/** Penanda parameter di teks: {nama}. */
const POLA_PENANDA = /\{(\w+)\}/g;
/** Teks yang seluruhnya satu penanda, mis. "{skor}": nilainya dipakai apa adanya (angka tetap angka). */
const POLA_PENANDA_TUNGGAL = /^\{(\w+)\}$/;
/** Selisih pembulatan floating point yang diabaikan saat membandingkan angka. */
const EPSILON = 1e-9;

/** Mengganti semua penanda {nama} yang punya nilai; penanda tanpa nilai dibiarkan agar terlihat saat validasi. */
export function gantiPenanda(teks, nilai) {
  return String(teks ?? '').replace(POLA_PENANDA, (asli, nama) => (Object.hasOwn(nilai, nama) ? String(nilai[nama]) : asli));
}

/** Mengganti penanda pada nilai teks di dalam kunci (bertingkat). Nama kunci dan nilai bukan teks tidak diubah. */
function gantiDalamKunci(kunci, nilai) {
  if (typeof kunci === 'string') {
    const tunggal = POLA_PENANDA_TUNGGAL.exec(kunci);
    // "{skor}" menjadi nilai parameter asli (angka tetap angka, mis. min_skor)
    if (tunggal && Object.hasOwn(nilai, tunggal[1])) return nilai[tunggal[1]];
    return gantiPenanda(kunci, nilai);
  }
  if (Array.isArray(kunci)) return kunci.map((isi) => gantiDalamKunci(isi, nilai));
  // objek biasa: telusuri tiap nilainya; null/angka/boolean dikembalikan apa adanya
  if (kunci && typeof kunci === 'object') return Object.fromEntries(Object.entries(kunci).map(([k, v]) => [k, gantiDalamKunci(v, nilai)]));
  return kunci;
}

/** Mengacak urutan salinan array (Fisher-Yates) memakai RNG yang disuntikkan. */
function acakUrutan(daftar, acak) {
  const hasil = [...daftar];
  for (let i = hasil.length - 1; i > 0; i -= 1) {
    const j = acak(i + 1);
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

/** Memilih satu subjek gambar yang belum dipakai tugas ini; bank kosong -> AppError. */
function pilihGambar(jenis, gambarTersedia, terpilih, acak) {
  const bank = (gambarTersedia?.[jenis] ?? []).filter((g) => !terpilih.some((x) => x.kode === g.kode));
  // tidak ada subjek dengan berkas jenis ini (atau semuanya sudah dipakai parameter lain di tugas yang sama)
  if (bank.length === 0) throw new AppError(t('template.belumAdaGambar'), 400);
  const g = bank[acak(bank.length)];
  terpilih.push({ kode: g.kode, nama: g.nama, jenis });
  return g.nama;
}

/** Menentukan nilai satu parameter: daftar -> pilih satu, {min,max} -> bulat acak, {dari:"gambar"} -> subjek gambar. */
function pilihNilai(nama, aturan, { acak, gambarTersedia, gambar }) {
  // daftar nilai: pilih satu secara acak
  if (Array.isArray(aturan) && aturan.length > 0) return aturan[acak(aturan.length)];
  // subjek dari bank gambar; nilai penandanya nama subjek, kodenya disimpan di `gambar`
  if (aturan?.dari === 'gambar') return pilihGambar(aturan.jenis, gambarTersedia, gambar, acak);
  // rentang bilangan bulat inklusif
  if (Number.isInteger(aturan?.min) && Number.isInteger(aturan?.max) && aturan.min <= aturan.max) return aturan.min + acak(aturan.max - aturan.min + 1);
  throw new AppError(t('template.parameterTidakValid', { nama }), 400);
}

/**
 * Merender template menjadi soal untuk satu siswa.
 * Hasil: { teks, opsi (diacak, tiap opsi { teks, indeksAsli }) atau null, nilaiParameter, gambar: [{kode, nama, jenis}], kunci }.
 */
export function renderTemplate(template, { acak, gambarTersedia = {} }) {
  const nilaiParameter = {};
  const gambar = [];
  for (const [nama, aturan] of Object.entries(template.parameter ?? {})) nilaiParameter[nama] = pilihNilai(nama, aturan, { acak, gambarTersedia, gambar });
  // opsi hanya ada pada pilihan ganda; indeksAsli dipakai untuk mencocokkan kunci.benar
  const opsi = Array.isArray(template.opsi) ? acakUrutan(template.opsi.map((o, i) => ({ teks: gantiPenanda(o, nilaiParameter), indeksAsli: i })), acak) : null;
  return { teks: gantiPenanda(template.teks, nilaiParameter), opsi, nilaiParameter, gambar, kunci: gantiDalamKunci(template.kunci ?? null, nilaiParameter) };
}

/**
 * Mengurai jawaban angka siswa. Koma atau titik diterima sebagai desimal dan spasi diabaikan.
 * Titik yang diikuti tepat tiga digit berulang (1.000, 15.000, 1.250.000) dianggap pemisah ribuan,
 * dan boleh diikuti koma desimal (1.250,5). Hasil NaN bila bukan angka.
 */
export function uraiAngka(teks) {
  const bersih = String(teks ?? '').replace(/\s+/g, '');
  // pola ribuan bertitik, opsional dengan koma desimal: buang titiknya dulu
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(bersih)) return Number(bersih.replace(/\./g, '').replace(',', '.'));
  const desimal = bersih.replace(',', '.');
  // selain pola ribuan hanya boleh satu pemisah desimal
  if (!/^-?\d+(\.\d+)?$/.test(desimal)) return Number.NaN;
  return Number(desimal);
}

/** Merapikan jawaban teks untuk dibandingkan: tanpa spasi tepi dan tanpa beda huruf besar/kecil. */
function rapikanTeks(teks) {
  return String(teks ?? '').trim().toLowerCase();
}

/** Teks yang benar untuk kunci `jika` (fungsi IF): `maka` bila syarat terpenuhi, selain itu `lainnya`. */
function teksJika(kunci, nilaiParameter) {
  const terpenuhi = evaluasiEkspresi(kunci.jika, nilaiParameter);
  return gantiPenanda(terpenuhi === true ? kunci.maka : kunci.lainnya, nilaiParameter);
}

/**
 * Memeriksa jawaban tugas `otomatis_jawaban` (pilihan ganda dan excel). `kunci` diambil dari template,
 * `nilaiParameter` dari hasil render yang tersimpan. Mengembalikan true/false.
 * Pilihan ganda: `jawaban` adalah indeksAsli opsi yang dipilih (urutan tersimpan, sebelum diacak).
 */
export function periksaJawaban(template, nilaiParameter, jawaban) {
  const kunci = template.kunci ?? {};
  // pilihan ganda: bandingkan indeks pada urutan opsi tersimpan
  if (template.tipe === 'pilihan_ganda') return String(jawaban ?? '').trim() !== '' && Number(jawaban) === Number(kunci.benar);
  if (kunci.ekspresi != null) {
    const angka = uraiAngka(jawaban);
    // jawaban kosong/bukan angka langsung salah, tidak perlu menghitung kunci
    if (Number.isNaN(angka)) return false;
    const harapan = Number(evaluasiEkspresi(kunci.ekspresi, nilaiParameter));
    return Math.abs(angka - harapan) <= (Number(kunci.toleransi) || 0) + EPSILON;
  }
  // fungsi IF: jawaban berupa teks
  if (kunci.jika != null) return rapikanTeks(jawaban) === rapikanTeks(teksJika(kunci, nilaiParameter));
  // template tanpa kunci yang bisa diperiksa otomatis
  return false;
}

/** Membulatkan angka untuk tampilan kunci (maksimal 2 desimal, tanpa nol di belakang). */
function angkaTampil(nilai) {
  return String(Math.round(Number(nilai) * 100) / 100);
}

/**
 * Jawaban yang diharapkan dalam bentuk teks untuk ditampilkan ke pengelola (pratinjau, pemeriksaan tutor).
 * `render` adalah hasil renderTemplate. Null bila tugas tidak punya jawaban tunggal (mis. dicek tutor).
 */
export function jawabanHarapan(template, render) {
  const kunci = template.kunci ?? {};
  // pilihan ganda: teks opsi yang indeks aslinya sama dengan kunci.benar
  if (template.tipe === 'pilihan_ganda') return render.opsi?.find((o) => o.indeksAsli === Number(kunci.benar))?.teks ?? null;
  if (kunci.ekspresi != null) return angkaTampil(evaluasiEkspresi(kunci.ekspresi, render.nilaiParameter));
  if (kunci.jika != null) return teksJika(kunci, render.nilaiParameter);
  // mengetik: teks yang harus diketik siswa
  if (render.kunci?.teks_ketik != null) return String(render.kunci.teks_ketik);
  return null;
}
