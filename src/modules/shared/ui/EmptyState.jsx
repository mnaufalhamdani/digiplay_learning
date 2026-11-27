import Card from './Card';
import Ikon from './Ikon';

/**
 * Keadaan kosong (mis. hasil filter tidak ada): judul, pesan, dan aksi opsional. `tersemat` = dipakai di dalam kartu
 * lain (mis. kartu grafik): tanpa bingkai dan dengan jarak lebih kecil agar tidak ada kartu di dalam kartu.
 */
export default function EmptyState({ judul, pesan = null, ikon = 'info', aksi = null, tersemat = false }) {
  const isi = (
    <>
      <Ikon nama={ikon} ukuran={tersemat ? '1.5em' : '2em'} className="text-muted" />
      <p className="font-bold">{judul}</p>
      {pesan && <p className="max-w-md text-muted">{pesan}</p>}
      {aksi && <div className="mt-2">{aksi}</div>}
    </>
  );
  // tersemat: pembungkus polos tanpa bingkai
  if (tersemat) return <div className="flex flex-col items-center gap-1 py-6 text-center">{isi}</div>;
  return <Card className="flex flex-col items-center gap-2 py-10 text-center">{isi}</Card>;
}
