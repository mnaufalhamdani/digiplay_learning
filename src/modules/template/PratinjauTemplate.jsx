'use client';
import { useState, useTransition } from 'react';
import { t } from '@/utils/i18n';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import { pratinjauTemplate } from './template.actions';

/** Satu contoh hasil render: soal, opsi (yang benar ditandai), gambar terpilih, dan jawaban/kunci harapan. */
function KartuContoh({ ke, contoh }) {
  // render gagal (mis. bank gambar kosong): tampilkan alasannya saja
  if (contoh.galat) {
    return (
      <Card className="flex items-start gap-2 font-semibold text-bad">
        <Ikon nama="peringatan" className="mt-0.5" />
        {contoh.galat}
      </Card>
    );
  }
  return (
    <Card className="space-y-3">
      <p className="text-[0.9em] font-bold text-muted">{t('template.contohKe', { ke })}</p>
      <p className="whitespace-pre-wrap">{contoh.teks}</p>
      {contoh.opsi && (
        <ol className="list-[upper-alpha] space-y-1 pl-6">
          {contoh.opsi.map((o, i) => (
            <li key={i} className={o.benar ? 'font-bold text-ok' : ''}>
              {o.teks} {o.benar && <Badge nada="sukses">{t('template.benar')}</Badge>}
            </li>
          ))}
        </ol>
      )}
      {contoh.gambar.length > 0 && <p className="text-muted">{t('template.gambarTerpilih', { daftar: contoh.gambar.map((g) => `${g.nama} (${g.kode}, ${g.jenis})`).join(', ') })}</p>}
      {contoh.jawaban != null && (
        <p className="rounded-md bg-ok-soft p-2 font-semibold text-ok">
          {t('template.jawabanHarapan')}: {contoh.jawaban}
        </p>
      )}
      {contoh.kunci && (
        <details>
          <summary className="cursor-pointer font-semibold">{t('template.kunciHasilRender')}</summary>
          <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-bg p-3 font-mono text-[0.85em] whitespace-pre-wrap break-words">{JSON.stringify(contoh.kunci, null, 2)}</pre>
        </details>
      )}
    </Card>
  );
}

/** Tombol "Contoh hasil": meminta 5 contoh render dari server lalu menampilkannya. */
export default function PratinjauTemplate({ id }) {
  const [hasil, setHasil] = useState({ daftar: null, galat: '' });
  const [memuat, mulai] = useTransition();
  /** Mengambil contoh render baru (tiap tekan hasilnya acak lagi). */
  function muat() {
    mulai(async () => {
      const r = await pratinjauTemplate({ id });
      setHasil(r.ok ? { daftar: r.data, galat: '' } : { daftar: null, galat: r.error });
    });
  }
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[1.15em] font-bold">{t('template.pratinjau')}</h2>
        <Button varian="secondary" ikon="contoh" memuat={memuat} onClick={muat}>
          {hasil.daftar ? t('template.contohLagi') : t('template.contohHasil')}
        </Button>
      </div>
      {hasil.galat && (
        <p role="alert" className="font-semibold text-bad">
          {hasil.galat}
        </p>
      )}
      {hasil.daftar && (
        <div className="grid gap-3 lg:grid-cols-2">
          {hasil.daftar.map((c, i) => (
            <KartuContoh key={i} ke={i + 1} contoh={c} />
          ))}
        </div>
      )}
    </section>
  );
}
