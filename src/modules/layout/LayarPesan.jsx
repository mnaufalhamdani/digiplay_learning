import LogoAplikasi from './LogoAplikasi';

/**
 * Layar penuh sederhana untuk 404 dan galat: logo persegi dengan teks di tengah, judul, pesan, dan aksi. Dipasang di luar
 * layout area (halaman 404 dan galat berada di atas layout area), jadi pembungkus `data-area="siswa"` memasang token warna
 * dan huruf area siswa yang ramah anak. Tanpa hook, aman dipakai server maupun client component.
 */
export default function LayarPesan({ branding, judul, pesan, aksi = null }) {
  return (
    <div data-area="siswa" className="grid min-h-dvh place-items-center bg-bg px-4 py-10 font-body text-fg">
      <main className="flex max-w-md flex-col items-center gap-3 text-center">
        <LogoAplikasi branding={branding} varian="persegiTeks" />
        <h1 className="font-display text-[1.6em] font-bold">{judul}</h1>
        <p className="text-muted">{pesan}</p>
        {aksi && <div className="mt-2 flex flex-wrap justify-center gap-2">{aksi}</div>}
      </main>
    </div>
  );
}
