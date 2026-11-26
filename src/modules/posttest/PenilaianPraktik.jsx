'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { PENILAIAN, STATUS_POST_TEST } from '@/enums';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import TextArea from '@/modules/shared/ui/TextArea';
import TextField from '@/modules/shared/ui/TextField';
import Toast from '@/modules/shared/ui/Toast';
import PratinjauKiriman from '@/modules/studio/PratinjauKiriman';
import { finalisasiPostTest, nilaiButirPostTest } from './posttest.actions';

/** Panel penilaian satu butir praktik: skor 0 sampai skor maksimum rubrik, catatan, dan tombol Simpan (bisa direvisi). */
function FormNilaiButir({ ptId, x, boleh }) {
  const router = useRouter();
  const [skor, setSkor] = useState(x.skor == null ? '' : String(x.skor));
  const [catatan, setCatatan] = useState(x.catatan ?? '');
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState('');
  const [memuat, mulai] = useTransition();
  /** Menyimpan skor dan catatan; galat validasi (mis. skor melebihi maksimum) tampil di kolom skor. */
  function simpan(e) {
    e.preventDefault();
    mulai(async () => {
      const r = await nilaiButirPostTest({ id: ptId, tugasId: x.id, skor, catatan });
      if (!r.ok) return setGalat(r.error);
      setGalat('');
      setToast(t('posttest.skorTersimpan'));
      router.refresh();
    });
  }
  return (
    <form onSubmit={simpan} className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end" noValidate>
      <TextField label={t('posttest.skorButir', { maks: x.maks })} inputMode="decimal" value={skor} onChange={(e) => setSkor(e.target.value)} galat={galat || null} disabled={!boleh} />
      <TextArea label={t('posttest.catatanButir')} rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} disabled={!boleh} maxLength={500} />
      <Button type="submit" ikon="sukses" memuat={memuat} disabled={!boleh || skor.trim() === ''}>
        {t('umum.simpan')}
      </Button>
      <Toast pesan={toast} onTutup={() => setToast('')} />
    </form>
  );
}

/** Satu butir praktik: bagian, instruksi, bahan, jawaban/karya siswa, rubrik, status, dan panel penilaian. */
function KartuButirPraktik({ ptId, x, namaBagian, boleh }) {
  return (
    <Card as="article" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">{namaBagian}</span>
        <span className="break-all text-muted">{x.template_kode}</span>
        <Badge nada={x.dinilai ? 'sukses' : 'peringatan'}>{t(x.dinilai ? 'posttest.butirDinilai' : 'posttest.butirMenunggu')}</Badge>
        <Badge nada={x.siapDinilai ? 'sukses' : 'netral'}>{t(x.siapDinilai ? 'posttest.siapDinilai' : 'posttest.belumSiap')}</Badge>
      </div>
      <p className="whitespace-pre-wrap">{x.soal}</p>
      {x.bahan.length > 0 && <p className="text-muted">{t('posttest.bahanButir', { daftar: x.bahan.map((g) => `${g.nama} (${g.jenis})`).join(', ') })}</p>}
      {/* karya dikerjakan di aplikasi lain (Word, Paint, dll.) sehingga diperiksa langsung di komputer siswa */}
      <p>
        {t('detailSesi.jawabanSiswa')}: <strong>{x.jawaban ?? t('posttest.karyaDiKomputer')}</strong>
      </p>
      {/* proyek Studio Zippy yang dikirim siswa ke butir ini: pratinjau panggung hanya-baca, dijalankan tutor */}
      {x.tipe === 'coding_proyek' && <PratinjauKiriman tugasId={x.id} />}
      <details>
        <summary className="cursor-pointer font-semibold">{t('detailSesi.rubrik')}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          {x.rubrik.map((r) => (
            <li key={r.kriteria}>
              {r.kriteria} ({r.poin})
            </li>
          ))}
        </ul>
      </details>
      {x.dinilai && x.dinilai_nama && <p className="text-[0.9em] text-muted">{t('posttest.dinilaiOleh', { nama: x.dinilai_nama })}</p>}
      <FormNilaiButir key={`${x.id}-${x.skor}-${x.catatan}`} ptId={ptId} x={x} boleh={boleh} />
    </Card>
  );
}

/**
 * Daftar butir praktik (dicek tutor) satu post test beserta tombol Finalisasi. Finalisasi nonaktif selama masih ada
 * butir yang belum dinilai (jumlahnya ditampilkan); setelah final tombolnya menjadi Finalisasi ulang untuk revisi skor.
 */
export default function PenilaianPraktik({ pt }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [toast, setToast] = useState({ pesan: '', nada: 'sukses' });
  const [memuat, mulai] = useTransition();
  const praktik = pt.butir.filter((x) => x.penilaian === PENILAIAN.TUTOR);
  // tanpa butir praktik pada percobaan ini (mis. tes ulang bagian soal saja) tidak ada yang dinilai tutor
  if (praktik.length === 0) return null;
  const selesai = pt.status === STATUS_POST_TEST.SELESAI;
  const sudahFinal = pt.nilai_total != null;
  /** Menjalankan finalisasi; hasil null berarti masih ada bagian lain yang belum bernilai. */
  function finalisasi() {
    mulai(async () => {
      const r = await finalisasiPostTest({ id: pt.id });
      setKonfirmasi(false);
      if (!r.ok) return setToast({ pesan: r.error, nada: 'bahaya' });
      setToast({ pesan: t(r.data.final ? 'posttest.finalisasiSukses' : 'posttest.finalisasiBelumLengkap'), nada: 'sukses' });
      router.refresh();
    });
  }
  /** Keterangan di samping tombol Finalisasi: siswa belum mengumpulkan, jumlah butir menunggu, atau semuanya sudah dinilai. */
  const keterangan = !selesai ? t('posttest.menungguSiswa') : pt.praktikMenunggu > 0 ? t('posttest.sisaBelumDinilai', { jumlah: pt.praktikMenunggu }) : t('posttest.semuaDinilai');
  return (
    <section className="space-y-3" aria-label={t('posttest.praktikJudul')}>
      <h2 className="text-[1.2em] font-bold">{t('posttest.praktikJudul')}</h2>
      <p className="text-muted">{t('posttest.praktikBantuan')}</p>
      {praktik.map((x) => {
        const bagian = pt.bagian.find((b) => b.id === x.bagian_id);
        return <KartuButirPraktik key={x.id} ptId={pt.id} x={x} namaBagian={bagian ? `${bagian.kode}. ${bagian.nama}` : ''} boleh={selesai || x.siapDinilai} />;
      })}
      <div className="flex flex-wrap items-center gap-3">
        <Button varian="sukses" ikon="sertifikat" disabled={!pt.bisaFinalisasi} onClick={() => setKonfirmasi(true)}>
          {t(sudahFinal ? 'posttest.finalisasiUlang' : 'posttest.finalisasi')}
        </Button>
        <span role="status" className="font-semibold">
          {keterangan}
        </span>
      </div>
      <ConfirmDialog terbuka={konfirmasi} judul={t('posttest.finalisasiJudul')} pesan={t('posttest.finalisasiPesan')} labelYa={t(sudahFinal ? 'posttest.finalisasiUlang' : 'posttest.finalisasi')} memuat={memuat} onYa={finalisasi} onBatal={() => setKonfirmasi(false)} />
      <Toast pesan={toast.pesan} nada={toast.nada} onTutup={() => setToast({ pesan: '', nada: 'sukses' })} />
    </section>
  );
}
