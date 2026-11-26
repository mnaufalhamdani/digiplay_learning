'use client';
import { useEffect, useMemo, useState } from 'react';
import { t } from '@/utils/i18n';
import { formatWaktu } from '@/utils/format';
import { blokTersedia } from '@/modules/shared/blockly/daftarBlokStudio';
import { DAFTAR_TOMBOL, JENIS_SPRITE } from '@/modules/shared/blockly/pustakaStudio';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import { aturBisu } from './pustakaSuara';
import EditorStudioDinamis from './EditorStudioDinamis';
import KotakTanya from './KotakTanya';
import PanggungStudio from './PanggungStudio';
import { useMesinStudio } from './useMesinStudio';
import { ambilKirimanStudio } from './studio.actions';

/** Keadaan awal proyek sebagai tampilan panggung (sebelum dijalankan). */
const tampilanAwal = (proyek) => ({ latar: proyek.latar, variabel: proyek.variabel, tampilSkor: false, monitor: [], pertanyaan: null, sprite: proyek.sprite.map((s) => ({ ...s, kata: '' })) });
/** Nama sprite untuk tab dan pilihan: tulisan sprite teks atau kode subjek gambar. */
const namaSprite = (s) => (s.jenis === JENIS_SPRITE.TEKS ? `“${s.teks}”` : s.subjek);

/** Pratinjau hanya-baca proyek yang dikirim siswa: panggung, tombol Jalankan/Berhenti, dan susunan blok per sprite. */
function IsiPratinjau({ kiriman }) {
  const proyek = kiriman.isi;
  const mesin = useMesinStudio();
  const [bisu, setBisu] = useState(false);
  const [lihatBlok, setLihatBlok] = useState(false);
  const [spriteId, setSpriteId] = useState(proyek.sprite[0]?.id ?? null);
  const awal = useMemo(() => tampilanAwal(proyek), [proyek]);
  const aktif = proyek.sprite.find((s) => s.id === spriteId) ?? proyek.sprite[0];
  // suara pratinjau mengikuti tombol bisukan
  useEffect(() => aturBisu(bisu), [bisu]);
  return (
    <div className="space-y-3">
      <div className="mx-auto w-full max-w-xl space-y-2">
        <PanggungStudio tampilan={mesin.tampilan ?? awal} onKlik={mesin.jalan ? mesin.klik : null} onTombol={mesin.jalan ? mesin.tekan : null} />
        {/* tutor boleh menjawab blok Tanya di pratinjau */}
        <KotakTanya pertanyaan={mesin.jalan ? (mesin.tampilan?.pertanyaan ?? null) : null} onJawab={mesin.jawab} />
        <div className="flex flex-wrap items-center gap-2">
          {mesin.jalan ? (
            <Button varian="bahaya" ikon="berhenti" onClick={mesin.berhenti}>
              {t('studio.berhenti')}
            </Button>
          ) : (
            <Button varian="sukses" ikon="bendera" onClick={() => mesin.mulai(proyek)}>
              {t('studio.jalankan')}
            </Button>
          )}
          <Button varian="secondary" ikon={bisu ? 'bisu' : 'suara'} aria-pressed={bisu} onClick={() => setBisu((v) => !v)}>
            {t(bisu ? 'studio.suaraMati' : 'studio.suaraNyala')}
          </Button>
          {mesin.jalan && (
            <span className="flex flex-wrap gap-1" aria-label={t('studio.tombolKeyboard')}>
              {DAFTAR_TOMBOL.map((k) => (
                <Button key={k} varian="hantu" onClick={() => mesin.tekan(k)}>
                  {t(`studio.tombol.${k}`)}
                </Button>
              ))}
            </span>
          )}
        </div>
      </div>
      <Button varian="secondary" ikon="lihat" aria-expanded={lihatBlok} onClick={() => setLihatBlok((v) => !v)}>
        {t(lihatBlok ? 'studio.sembunyikanBlok' : 'studio.lihatBlok')}
      </Button>
      {lihatBlok && (
        <div className="space-y-2">
          <div role="tablist" aria-label={t('studio.daftarSprite')} className="flex flex-wrap gap-1.5">
            {proyek.sprite.map((s, i) => (
              <button key={s.id} type="button" role="tab" aria-selected={s.id === aktif?.id} onClick={() => setSpriteId(s.id)} className={`min-h-11 rounded-full border-2 px-3 font-bold ${s.id === aktif?.id ? 'border-primary bg-primary-soft text-primary-text' : 'border-line bg-panel'}`}>
                {t('studio.spriteKe', { nomor: i + 1 })} ({namaSprite(s)})
              </button>
            ))}
          </div>
          <EditorStudioDinamis blokTersedia={blokTersedia(kiriman.tingkat)} skrip={aktif?.skrip ?? []} kunciSprite={`kiriman:${aktif?.id ?? 'kosong'}`} variabel={Object.keys(proyek.variabel)} spriteLain={proyek.sprite.map((s, i) => ({ id: s.id, label: `${i + 1}. ${namaSprite(s)}` }))} bacaSaja />
        </div>
      )}
    </div>
  );
}

/**
 * Karya bertipe coding_proyek pada kartu tugas/butir post test untuk tutor dan admin: memuat salinan proyek yang
 * dikirim siswa (diambil saat kartu tampil), lalu menampilkan pratinjau panggung tanpa editor. Tanpa kiriman, hanya
 * keterangan bahwa siswa belum mengirim. Penilaian tetap memakai panel yang sudah ada di kartu induknya.
 */
export default function PratinjauKiriman({ tugasId }) {
  const [kiriman, setKiriman] = useState(undefined);
  const [galat, setGalat] = useState('');
  // salinan diambil sekali saat kartu tampil; undefined = memuat, null = belum ada kiriman
  useEffect(() => {
    let batal = false;
    ambilKirimanStudio({ tugasId }).then((r) => {
      if (batal) return;
      if (!r.ok) return setGalat(r.error);
      setKiriman(r.data);
    });
    return () => {
      batal = true;
    };
  }, [tugasId]);
  return (
    <section aria-label={t('studio.karyaSiswa')} className="space-y-2 rounded-lg border-2 border-line p-3">
      <p className="flex flex-wrap items-center gap-2 font-bold">
        <Ikon nama="studio" />
        {t('studio.karyaSiswa')}
        {kiriman && (
          <span className="font-semibold text-muted">
            {t('studio.kirimanInfo', { nama: kiriman.nama, waktu: formatWaktu(kiriman.dikirimPada) })}
          </span>
        )}
      </p>
      {galat && <p role="alert" className="font-semibold text-bad">{galat}</p>}
      {!galat && kiriman === undefined && <p className="text-muted">{t('studio.memuatKiriman')}</p>}
      {!galat && kiriman === null && <p className="text-muted">{t('studio.belumKirim')}</p>}
      {/* isi yang bukan proyek sah (rusak di database) tidak dipratinjau */}
      {kiriman && Array.isArray(kiriman.isi?.sprite) && <IsiPratinjau kiriman={kiriman} />}
    </section>
  );
}
