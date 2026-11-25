import Card from './Card';

/**
 * Tabel di layar lebar yang berubah menjadi daftar kartu di HP (tabel tidak menggulir mendatar).
 * `kolom`: [{ label, isi: (baris) => node, kelas? }]. `kartuHP(baris)` opsional; tanpa itu kartu berisi
 * pasangan label: isi tiap kolom. Tanpa hook, jadi bisa dipakai dari server component maupun client.
 */
export default function TabelResponsif({ kolom, baris, kunciBaris = (b) => b.id, kartuHP = null }) {
  return (
    <>
      <Card className="hidden overflow-hidden p-0 sm:p-0 md:block">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-bg text-muted">
            <tr>
              {kolom.map((k) => (
                <th key={k.label} scope="col" className={`px-4 py-3 font-semibold ${k.kelas ?? ''}`}>
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={kunciBaris(b)} className="border-b border-line align-top last:border-0">
                {kolom.map((k) => (
                  <td key={k.label} className={`px-4 py-3 ${k.kelas ?? ''}`}>
                    {k.isi(b)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ul className="space-y-3 md:hidden">
        {baris.map((b) => (
          <li key={kunciBaris(b)}>
            <Card className="space-y-2">
              {/* kartu khusus dari pemanggil; bila tidak ada, tampilkan semua kolom sebagai label: isi */}
              {kartuHP
                ? kartuHP(b)
                : kolom.map((k) => (
                    <div key={k.label}>
                      <p className="text-[0.85em] text-muted">{k.label}</p>
                      <div>{k.isi(b)}</div>
                    </div>
                  ))}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
