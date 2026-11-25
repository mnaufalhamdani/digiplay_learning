/** Warna potongan konfeti (token, bukan warna keras). */
const WARNA = ['var(--primary)', 'var(--sun)', 'var(--ok)', 'var(--info)', 'var(--bad)'];
/** Jumlah potongan; posisi dan jeda dibuat tetap (tanpa acak) agar hasil render server dan klien sama. */
const POTONGAN = Array.from({ length: 28 }, (_, i) => ({ kiri: (i * 37) % 100, jeda: (i % 7) * 0.15, durasi: 2.2 + (i % 5) * 0.3, warna: WARNA[i % WARNA.length], putar: (i * 47) % 360 }));

/**
 * Perayaan konfeti sekali jatuh (saat semua tugas selesai, lulus). Dekoratif dan tidak menghalangi klik.
 * Disembunyikan sepenuhnya bila pengguna memilih kurangi gerakan.
 */
export default function Konfeti({ tampil }) {
  // tidak sedang merayakan
  if (!tampil) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden motion-reduce:hidden">
      {POTONGAN.map((p, i) => (
        <span
          key={i}
          className="konfeti absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${p.kiri}%`, background: p.warna, animationDelay: `${p.jeda}s`, animationDuration: `${p.durasi}s`, transform: `rotate(${p.putar}deg)` }}
        />
      ))}
    </div>
  );
}
