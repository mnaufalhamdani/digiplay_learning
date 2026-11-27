import { t } from '@/utils/i18n';

/**
 * Branding cadangan (logo bawaan statis) untuk layar yang tidak bisa membaca pengaturan: halaman galat (client component)
 * dan 404 bila database tidak terjangkau.
 */
export const BRANDING_LOGO_BAWAAN = Object.freeze({
  namaPelatihan: t('app.nama'),
  logo: Object.freeze({
    utama: '/aset/logo/logo-landscape.png',
    ikon: '/aset/logo/logo-persegi.png',
    persegiTeks: '/aset/logo/logo-persegi-teks.png',
    sertifikat: '/aset/logo/logo-landscape.png',
  }),
  logoGelap: Object.freeze({
    utama: '/aset/logo/logo-landscape-gelap.png',
    ikon: '/aset/logo/logo-persegi-gelap.png',
    persegiTeks: '/aset/logo/logo-persegi-teks-gelap.png',
    sertifikat: null,
  }),
});

/** Ukuran dasar tiap varian logo (tinggi tetap, lebar mengikuti rasio). */
const UKURAN = Object.freeze({
  utama: 'h-10 w-auto max-w-[12rem]',
  ikon: 'size-9',
  persegiTeks: 'size-32',
});

/**
 * Logo aplikasi dari `branding.logo[varian]` (unggahan admin atau bawaan), satu komponen untuk semua tempat:
 * `utama` (landscape), `ikon` (persegi tanpa teks), dan `persegiTeks` (persegi dengan teks). Logo ditampilkan apa adanya di atas
 * latar halaman, tanpa wadah atau latar putih di sekelilingnya. Tulisan "Learning" dan garis tepi pada logo bawaan berwarna
 * biru tua dan tidak terbaca di latar gelap, jadi logo bawaan punya versi gelap (`branding.logoGelap`) yang dipasang berdampingan
 * dan dipilih lewat CSS (`dark:`), sehingga tidak perlu menunggu skrip tema dan tanpa kedipan. Logo unggahan PNG/WebP bertransparansi punya versi gelap
 * yang dibuat otomatis oleh server (src/utils/logoGelap.js); JPEG dipakai apa adanya di kedua tema. `className` mengatur penempatan. Tanpa hook, aman di server maupun client component.
 */
export default function LogoAplikasi({ branding, varian = 'utama', className = '' }) {
  const ukuran = `${UKURAN[varian] ?? UKURAN.utama} object-contain`;
  const gelap = branding.logoGelap?.[varian] ?? null;
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo unggahan disajikan lewat route berkas atau berkas bawaan statis */}
      <img src={branding.logo[varian]} alt={branding.namaPelatihan} loading="lazy" className={`${ukuran} ${gelap ? 'dark:hidden' : ''}`} />
      {/* versi tema gelap (logo bawaan saja): disembunyikan di tema terang; lazy agar tidak diunduh selama tersembunyi */}
      {gelap && (
        // eslint-disable-next-line @next/next/no-img-element -- berkas bawaan statis
        <img src={gelap} alt={branding.namaPelatihan} loading="lazy" className={`hidden dark:block ${ukuran}`} />
      )}
    </span>
  );
}
