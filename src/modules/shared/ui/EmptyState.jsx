import Card from './Card';
import Ikon from './Ikon';

/** Keadaan kosong (mis. hasil filter tidak ada): judul, pesan, dan aksi opsional. */
export default function EmptyState({ judul, pesan = null, ikon = 'info', aksi = null }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <Ikon nama={ikon} ukuran="2em" className="text-muted" />
      <p className="font-bold">{judul}</p>
      {pesan && <p className="max-w-md text-muted">{pesan}</p>}
      {aksi && <div className="mt-2">{aksi}</div>}
    </Card>
  );
}
