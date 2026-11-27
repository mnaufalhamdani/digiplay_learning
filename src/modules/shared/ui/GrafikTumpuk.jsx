import { t } from '@/utils/i18n';

/** Kelas warna isi per nama warna token; dipakai segmen dan penanda legenda agar selalu sama. */
const WARNA = { primary: 'bg-primary', sun: 'bg-sun', muted: 'bg-muted/50', ok: 'bg-ok' };

/**
 * Batang bertumpuk horizontal berbentuk pil. Tiap baris: { kunci, label, ket, segmen: [{ nama, nilai, warna }] }; lebar tiap
 * segmen = proporsinya terhadap total baris itu (baris tanpa data tampil sebagai jalur kosong). `ket` = teks kecil di
 * kanan baris (mis. "12 sesi"). Legenda di bawah memuat nama, warna, dan jumlah semua baris, sehingga angka tidak hanya
 * tersampaikan lewat warna. `tanpaLabel` menyembunyikan kolom label (untuk satu baris saja).
 */
export default function GrafikTumpuk({ baris, ringkas, judul, tanpaLabel = false, legenda }) {
  const namaLegenda = legenda ?? baris[0].segmen.map((s) => ({ nama: s.nama, warna: s.warna }));
  const jumlahPerSegmen = namaLegenda.map((l) => baris.reduce((j, b) => j + (b.segmen.find((s) => s.nama === l.nama)?.nilai ?? 0), 0));
  return (
    <figure className="space-y-3">
      <figcaption className="sr-only">{ringkas}</figcaption>
      <ul aria-hidden="true" className="space-y-3">
        {baris.map((b) => {
          const total = b.segmen.reduce((j, s) => j + s.nilai, 0);
          return (
            <li key={b.kunci} className={`grid items-center gap-3 ${tanpaLabel ? 'grid-cols-[1fr_auto]' : 'grid-cols-[minmax(3.5rem,5.5rem)_1fr_auto]'}`}>
              {!tanpaLabel && (
                <span className="truncate font-semibold" title={b.label}>
                  {b.label}
                </span>
              )}
              <span className="batang-melebar flex h-4 gap-0.5 overflow-hidden rounded-full bg-primary-soft">
                {/* segmen bernilai 0 dilewati agar tidak meninggalkan celah kosong di tengah pil */}
                {total > 0 && b.segmen.filter((s) => s.nilai > 0).map((s) => <span key={s.nama} title={`${s.nama}: ${s.nilai}`} style={{ flex: `${s.nilai} 1 0%` }} className={WARNA[s.warna]} />)}
              </span>
              <span className="min-w-[4ch] text-end text-[0.85em] text-muted angka-tabular">{b.ket}</span>
            </li>
          );
        })}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.9em]">
        {namaLegenda.map((l, i) => (
          <li key={l.nama} className="flex items-center gap-2">
            <span aria-hidden="true" className={`inline-block size-3 shrink-0 rounded-full ${WARNA[l.warna]}`} />
            <span>{l.nama}</span>
            <strong className="angka-tabular">{jumlahPerSegmen[i].toLocaleString('id-ID')}</strong>
          </li>
        ))}
      </ul>
      <div className="sr-only">
        <table>
          <caption>{t('beranda.dashboard.grafik.ringkasTabel', { judul: judul ?? ringkas })}</caption>
          <thead>
            <tr>
              <th scope="col">{judul ?? ''}</th>
              {namaLegenda.map((l) => (
                <th key={l.nama} scope="col">
                  {l.nama}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.kunci}>
                <th scope="row">{b.label}</th>
                {namaLegenda.map((l) => (
                  <td key={l.nama}>{b.segmen.find((s) => s.nama === l.nama)?.nilai ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
