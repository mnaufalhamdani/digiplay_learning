/** Panjang minimum SESSION_SECRET; sama dengan src/config/keamanan.config.js. */
const MIN_PANJANG_SECRET = 32;

/**
 * Menghentikan start aplikasi dengan pesan jelas bila SESSION_SECRET kosong atau terlalu pendek.
 * Next.js sudah memuat .env sebelum berkas ini dibaca, jadi process.env sudah terisi di sini.
 */
function pastikanSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? '';
  // rahasia pendek mudah ditebak: cookie sesi bisa dipalsukan, jadi aplikasi tidak boleh jalan
  if (secret.length < MIN_PANJANG_SECRET) {
    throw new Error(
      `SESSION_SECRET wajib diisi di .env, minimal ${MIN_PANJANG_SECRET} karakter. ` +
        'Buat dengan: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
    );
  }
}

/** Daftar host (tanpa skema) untuk area siswa dan backoffice dari .env, termasuk varian port dev. */
function daftarHostArea() {
  const host = [process.env.HOST_SISWA, process.env.HOST_BACKOFFICE].filter(Boolean);
  const port = process.env.PORT ?? '3000';
  return [...host, ...host.map((h) => `${h}:${port}`)];
}

pastikanSessionSecret();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // mysql2 dan awilix dijalankan native di server, tidak di-bundle
  // pdfkit membaca data font bawaan dari foldernya sendiri, jadi ikut dijalankan native bersama qrcode (Fase E)
  serverExternalPackages: ['mysql2', 'awilix', 'pdfkit', 'qrcode'],
  // Saat development Next.js memblokir aset dev (JS, HMR) dari origin selain localhost.
  // Host area (siswa.localhost, backoffice.localhost) dan jaringan lokal diizinkan agar halaman tetap hydrate.
  allowedDevOrigins: [process.env.HOST_SISWA, process.env.HOST_BACKOFFICE, '192.168.*.*', '10.*.*.*', '*.local'].filter(Boolean),
  /** Header keamanan untuk semua respons (F5): tanpa sniffing tipe, tanpa iframe, referrer seperlunya, tanpa kamera/mikrofon/lokasi. */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  experimental: {
    // Server Actions hanya diterima dari host area sendiri (perlindungan CSRF bawaan Next.js).
    // Di belakang reverse proxy, header Host / x-forwarded-host harus diteruskan apa adanya.
    serverActions: { allowedOrigins: daftarHostArea() },
  },
};

export default nextConfig;
