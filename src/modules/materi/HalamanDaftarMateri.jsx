import Link from 'next/link';
import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { formatWaktu } from '@/utils/format';
import { t } from '@/utils/i18n';
import { PERAN } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import TabelResponsif from '@/modules/shared/ui/TabelResponsif';

/** Lencana status satu materi: belum diisi, aktif, atau nonaktif. */
function LencanaMateri({ m }) {
  // pertemuan belum punya materi di database (seed belum memuatnya)
  if (!m.ada) return <Badge nada="peringatan">{t('materi.belumDiisi')}</Badge>;
  return <Badge nada={m.aktif ? 'sukses' : 'netral'}>{t(m.aktif ? 'materi.aktif' : 'materi.nonaktif')}</Badge>;
}

/**
 * Halaman Materi pengelola: 12 pertemuan per level (36 materi), dengan status isi. Admin dan tutor bisa
 * membuka pratinjau; hanya admin yang melihat tombol ubah di halaman pratinjau.
 */
export default async function HalamanDaftarMateri() {
  const sesi = await wajibPengguna();
  const [daftar, info] = await Promise.all([ambilDep().materiController.daftarPengelola(), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  const kolom = [
    { label: t('materi.kolomNomor'), isi: (m) => <span className="font-semibold">P{m.nomor}</span> },
    { label: t('materi.kolomJudul'), isi: (m) => <Link href={href(`/materi/${m.pertemuanId}`)} className="font-semibold text-primary-text underline">{m.judul ?? m.pertemuanJudul}</Link> },
    { label: t('materi.kolomStatus'), isi: (m) => <LencanaMateri m={m} /> },
    { label: t('materi.kolomDiubah'), isi: (m) => (m.ada ? formatWaktu(m.updatedAt) : '-') },
  ];
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[1.5em] font-bold">{t('materi.judul')}</h1>
        <p className="text-muted">{t(sesi.peran === PERAN.ADMIN ? 'materi.petunjukAdmin' : 'materi.petunjukTutor')}</p>
      </div>
      {daftar.map((level) => (
        <section key={level.levelId} className="space-y-3">
          <h2 className="text-[1.15em] font-bold">
            {level.levelKode} · {level.levelNama}
          </h2>
          <TabelResponsif kolom={kolom} baris={level.materi} kunciBaris={(m) => m.pertemuanId} />
        </section>
      ))}
    </div>
  );
}
