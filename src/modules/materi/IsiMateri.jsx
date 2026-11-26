import { t } from '@/utils/i18n';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import GambarMateri from './GambarMateri';

/** Kotak "Tujuan belajar" di bagian atas materi. */
function KotakTujuan({ tujuan }) {
  return (
    <Card varian="berwarna" className="space-y-3">
      <h2 className="font-display text-[1.3em] font-bold">{t('materi.tujuan')}</h2>
      <ul className="space-y-2 text-[1.1em]">
        {tujuan.map((x) => (
          <li key={x} className="flex items-start gap-2">
            <Ikon nama="sukses" className="mt-1 text-ok" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Bagian paragraf: judul kecil dan teks yang lega. */
function BagianParagraf({ bagian }) {
  return (
    <section className="space-y-2">
      {bagian.judul && <h2 className="font-display text-[1.4em] font-bold">{bagian.judul}</h2>}
      <p className="text-[1.15em] leading-relaxed whitespace-pre-line">{bagian.teks}</p>
    </section>
  );
}

/** Bagian langkah: daftar bernomor besar, tiap langkah boleh punya gambar. */
function BagianLangkah({ bagian }) {
  return (
    <section className="space-y-3">
      {bagian.judul && <h2 className="font-display text-[1.4em] font-bold">{bagian.judul}</h2>}
      <ol className="space-y-3">
        {bagian.langkah.map((l, i) => (
          <li key={`${i}-${l.teks}`} className="flex items-start gap-3 rounded-lg border border-line bg-panel p-3 sm:p-4">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-[1.4em] font-bold text-on-primary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="sr-only">{t('materi.langkahKe', { nomor: i + 1 })}</p>
              <p className="text-[1.15em] leading-relaxed whitespace-pre-line">{l.teks}</p>
              {l.gambar && <GambarMateri src={l.gambar} />}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Balon kata Zippy: maskot di samping teks "Tahukah kamu?" atau pesan semangat. */
function BagianZippy({ bagian }) {
  return (
    <aside className="flex items-center gap-2 rounded-lg bg-primary-soft p-3 sm:p-4">
      <Maskot suasana="berpikir" ukuran={88} />
      <div className="space-y-1">
        <p className="text-[0.9em] font-bold text-primary-text">{t('materi.kataZippy')}</p>
        <p className="text-[1.1em] leading-relaxed whitespace-pre-line">{bagian.teks}</p>
      </div>
    </aside>
  );
}

/** Gambar tunggal dengan keterangan. */
function BagianGambar({ bagian }) {
  return (
    <figure className="space-y-2">
      <GambarMateri src={bagian.src} alt={bagian.keterangan ?? ''} className="mx-auto" />
      {bagian.keterangan && <figcaption className="text-center text-muted">{bagian.keterangan}</figcaption>}
    </figure>
  );
}

/** Pemilih komponen per tipe bagian. */
const KOMPONEN_BAGIAN = { paragraf: BagianParagraf, langkah: BagianLangkah, zippy: BagianZippy, gambar: BagianGambar };

/**
 * Isi materi (tujuan belajar lalu bagian-bagiannya). Tanpa hook, jadi dipakai halaman siswa maupun pratinjau pengelola.
 * Bagian bertipe tidak dikenal (data lama/rusak di database) dilewati agar halaman tetap terbuka.
 */
export default function IsiMateri({ isi }) {
  const bagian = Array.isArray(isi?.bagian) ? isi.bagian : [];
  const tujuan = Array.isArray(isi?.tujuan) ? isi.tujuan : [];
  return (
    <div className="space-y-6 sm:space-y-8">
      {tujuan.length > 0 && <KotakTujuan tujuan={tujuan} />}
      {bagian.map((b, i) => {
        const Komponen = KOMPONEN_BAGIAN[b?.tipe];
        // tipe tidak dikenal: lewati
        if (!Komponen) return null;
        return <Komponen key={`${i}-${b.tipe}`} bagian={b} />;
      })}
    </div>
  );
}
