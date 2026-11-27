import { t } from '@/utils/i18n';

/**
 * Batang horizontal berbentuk pil untuk membandingkan beberapa kategori (mis. siswa per level). Tiap baris:
 * { kunci, label, nilai }. Lebar isi relatif terhadap nilai terbesar; angka selalu tertulis di kanan, tidak hanya warna.
 * Server component (tanpa interaksi); tabel data tersembunyi menyertai pembaca layar.
 */
export default function BatangHorizontal({ baris, ringkas, judul, formatNilai = (n) => n.toLocaleString('id-ID') }) {
  const maks = Math.max(1, ...baris.map((b) => b.nilai));
  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">{ringkas}</figcaption>
      <ul aria-hidden="true" className="space-y-3">
        {baris.map((b) => (
          <li key={b.kunci} className="grid grid-cols-[minmax(3.5rem,6rem)_1fr_auto] items-center gap-3">
            <span className="truncate font-semibold" title={b.label}>
              {b.label}
            </span>
            <span className="block h-4 overflow-hidden rounded-full bg-primary-soft">
              <span style={{ width: `${(b.nilai / maks) * 100}%` }} className="batang-melebar block h-full rounded-full bg-primary" />
            </span>
            <span className="min-w-[2ch] text-end font-bold angka-tabular">{formatNilai(b.nilai)}</span>
          </li>
        ))}
      </ul>
      <div className="sr-only">
        <table>
          <caption>{t('beranda.dashboard.grafik.ringkasTabel', { judul: judul ?? ringkas })}</caption>
          <thead>
            <tr>
              <th scope="col">{judul ?? ''}</th>
              <th scope="col">{t('beranda.dashboard.grafik.kolomNilai')}</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.kunci}>
                <th scope="row">{b.label}</th>
                <td>{formatNilai(b.nilai)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
