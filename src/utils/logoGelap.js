// Membuat versi tema gelap sebuah logo: bagian berwarna biru tua/gelap yang menyentuh bagian luar logo (tulisan dan garis tepi)
// digeser ke warna terang agar terbaca di latar gelap. Warna cerah (biru, oranye) tidak diubah dan tidak ada latar yang ditambahkan.
// Tanpa 'server-only' agar bisa dipakai skrip Node (scripts/buat-logo-gelap.mjs) dan usecase pengaturan.
import sharp from 'sharp';

/** Warna terang pengganti (biru-putih lembut) untuk bagian yang tadinya gelap. */
const TERANG = [222, 234, 246];
/** Piksel dianggap "gelap" (kandidat) bila kanal terbesarnya <= BATAS; bobot penggantian turun dari 1 (<= PENUH) ke 0 (>= BATAS). */
const BATAS = 120;
const PENUH = 90;
/** Piksel dengan alpha di bawah ini dianggap bagian luar logo (titik awal penelusuran). */
const ALPHA_LUAR = 16;

/**
 * Mengubah gambar logo (PNG/WebP bertransparansi) menjadi PNG versi tema gelap. Hanya piksel gelap yang tersambung ke bagian
 * luar logo lewat piksel transparan atau gelap yang diterangkan, sehingga detail gelap di dalam ikon tetap utuh. Hasil: Buffer PNG
 * dengan ukuran sama. Logo tanpa transparansi (mis. JPEG) tidak punya "bagian luar", jadi hasilnya sama dengan aslinya.
 */
export async function buatLogoGelap(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const maks = (i) => Math.max(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const kandidat = (i) => data[i * 4 + 3] >= ALPHA_LUAR && maks(i) <= BATAS;
  const dikunjungi = new Uint8Array(W * H);
  const antre = [];
  const dorong = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (dikunjungi[i]) return;
    dikunjungi[i] = 1;
    // piksel luar (transparan) hanya diteruskan; piksel gelap ikut diterangkan; selain itu penelusuran berhenti di sini
    if (data[i * 4 + 3] < ALPHA_LUAR || kandidat(i)) antre.push(i);
  };
  // mulai dari seluruh tepi kanvas lalu menyebar lewat piksel transparan dan piksel gelap yang bersebelahan
  for (let x = 0; x < W; x++) { dorong(x, 0); dorong(x, H - 1); }
  for (let y = 0; y < H; y++) { dorong(0, y); dorong(W - 1, y); }
  const hasil = Buffer.from(data);
  while (antre.length) {
    const i = antre.pop();
    const x = i % W;
    const y = (i - x) / W;
    if (data[i * 4 + 3] >= ALPHA_LUAR) {
      // bobot 1 untuk warna gelap pekat, mengecil ke 0 mendekati batas agar peralihan ke warna cerah mulus
      const w = Math.min(1, Math.max(0, (BATAS - maks(i)) / (BATAS - PENUH)));
      for (let k = 0; k < 3; k++) hasil[i * 4 + k] = Math.round(data[i * 4 + k] * (1 - w) + TERANG[k] * w);
    }
    dorong(x + 1, y); dorong(x - 1, y); dorong(x, y + 1); dorong(x, y - 1);
    dorong(x + 1, y + 1); dorong(x - 1, y - 1); dorong(x + 1, y - 1); dorong(x - 1, y + 1);
  }
  return sharp(hasil, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}
