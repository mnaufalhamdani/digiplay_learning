/**
 * Fungsi murni untuk dashboard beranda pengelola: aritmetika bulan, normalisasi filter, dan pembentuk deret grafik dari
 * baris agregasi database. Tanpa akses database, sehingga mudah diperiksa dan dipakai usecase rapor.
 */

/** Batas mundur filter bulan (bulan) bila data tertua lebih lama dari ini. */
export const BATAS_MUNDUR_BULAN = 24;
/** Jumlah bulan pada grafik pembayaran (berakhir di bulan terpilih). */
export const JUMLAH_BULAN_PEMBAYARAN = 6;

/** Dua digit dengan nol di depan. */
const dua = (n) => String(n).padStart(2, '0');

/** Menggeser bulan "YYYY-MM" sebanyak `n` bulan (boleh negatif). */
export function tambahBulan(bulan, n) {
  const [tahun, bln] = bulan.split('-').map(Number);
  const total = tahun * 12 + (bln - 1) + n;
  return `${Math.floor(total / 12)}-${dua((total % 12) + 1)}`;
}

/** Jumlah hari dalam bulan "YYYY-MM". */
export function jumlahHariBulan(bulan) {
  const [tahun, bln] = bulan.split('-').map(Number);
  // hari ke-0 bulan berikutnya = hari terakhir bulan ini
  return new Date(Date.UTC(tahun, bln, 0)).getUTCDate();
}

/** Nama bulan gaya Indonesia dari "YYYY-MM": gaya `panjang` = "November 2026", `pendek` = "Nov". */
export function namaBulan(bulan, gaya = 'panjang') {
  const [tahun, bln] = bulan.split('-').map(Number);
  const opsi = gaya === 'pendek' ? { month: 'short' } : { month: 'long', year: 'numeric' };
  return new Date(Date.UTC(tahun, bln - 1, 1)).toLocaleDateString('id-ID', { ...opsi, timeZone: 'UTC' });
}

/** Tanggal "YYYY-MM-DD" gaya Indonesia dengan nama hari, mis. "Rabu, 12 Nov". */
export function namaHariTanggal(tanggal) {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Rupiah ringkas untuk label grafik yang sempit: "Rp950", "Rp246 rb", "Rp1,5 jt". */
export function rupiahRingkas(nilai) {
  const n = Number(nilai);
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (n >= 1_000) return `Rp${Math.round(n / 1_000).toLocaleString('id-ID')} rb`;
  return `Rp${Math.round(n).toLocaleString('id-ID')}`;
}

/** Awal bulan sebagai tanggal "YYYY-MM-01" (bentuk yang dikirim ke query model). */
export const awalBulan = (bulan) => `${bulan}-01`;

/**
 * Menormalkan filter dari query: bulan yang tidak sah atau di luar rentang [bulanMin, bulan berjalan] kembali ke bulan
 * berjalan, level yang tidak dikenal (bukan level aktif) kembali ke semua level.
 * `waktu` = { hari, tertua } dari database; `levelAktif` = daftar level aktif.
 */
export function normalisasiFilter({ bulan, levelId }, waktu, levelAktif) {
  const bulanBerjalan = waktu.hari.slice(0, 7);
  const batasMundur = tambahBulan(bulanBerjalan, -BATAS_MUNDUR_BULAN);
  const tertua = waktu.tertua ? waktu.tertua.slice(0, 7) : bulanBerjalan;
  // "YYYY-MM" dibandingkan sebagai teks karena formatnya tetap; yang lebih dekat dengan sekarang menang
  const bulanMin = tertua > batasMundur ? tertua : batasMundur;
  const bulanTerpilih = bulan && bulan >= bulanMin && bulan <= bulanBerjalan ? bulan : bulanBerjalan;
  const levelTerpilih = levelId && levelAktif.some((l) => l.id === levelId) ? levelId : null;
  return { bulan: bulanTerpilih, bulanBerjalan, bulanMin, levelId: levelTerpilih, bawaan: bulanTerpilih === bulanBerjalan && !levelTerpilih };
}

/**
 * Deret satu bulan penuh jumlah sesi per hari. Hari tanpa sesi bernilai 0; hari setelah hari ini ditandai `akanDatang`
 * (belum terjadi, berbeda dengan hari lampau yang memang kosong).
 */
export function deretSesiPerHari(bulan, baris, hariIni) {
  const perTanggal = new Map(baris.map((b) => [b.tanggal.slice(0, 10), Number(b.n)]));
  const deret = [];
  for (let hari = 1; hari <= jumlahHariBulan(bulan); hari += 1) {
    const tanggal = `${bulan}-${dua(hari)}`;
    deret.push({ tanggal, hari, n: perTanggal.get(tanggal) ?? 0, akanDatang: tanggal > hariIni, hariIni: tanggal === hariIni });
  }
  return { deret, total: deret.reduce((jumlah, d) => jumlah + d.n, 0) };
}

/** Deret per minggu (1-7, 8-14, 15-21, 22-28, 29-akhir) berisi jumlah sesi tuntas, tuntas sebagian, dan tidak tuntas. */
export function deretPenuntasan(bulan, baris) {
  const hariBulan = jumlahHariBulan(bulan);
  const deret = [];
  for (let minggu = 1; minggu <= Math.ceil(hariBulan / 7); minggu += 1) {
    deret.push({ minggu, dari: (minggu - 1) * 7 + 1, sampai: Math.min(minggu * 7, hariBulan), tuntas: 0, sebagian: 0, tidak: 0 });
  }
  const kolom = { tuntas: 'tuntas', tuntas_sebagian: 'sebagian', tidak_tuntas: 'tidak' };
  for (const b of baris) {
    const item = deret[Number(b.minggu) - 1];
    // hasil di luar tiga nilai yang dikenal (tidak seharusnya ada) diabaikan
    if (item && kolom[b.hasil]) item[kolom[b.hasil]] += Number(b.n);
  }
  return { deret: deret.map((d) => ({ ...d, total: d.tuntas + d.sebagian + d.tidak })) };
}

/** Deret 6 bulan yang berakhir di `bulan`: total rupiah dan jumlah catatan per bulan (bulan tanpa catatan bernilai 0). */
export function deretPembayaran(bulan, baris) {
  const perBulan = new Map(baris.map((b) => [b.bulan, { total: Number(b.total), jumlah: Number(b.n) }]));
  const deret = [];
  for (let i = JUMLAH_BULAN_PEMBAYARAN - 1; i >= 0; i -= 1) {
    const bln = tambahBulan(bulan, -i);
    deret.push({ bulan: bln, total: perBulan.get(bln)?.total ?? 0, jumlah: perBulan.get(bln)?.jumlah ?? 0, terpilih: i === 0 });
  }
  return deret;
}
