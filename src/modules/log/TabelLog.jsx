'use client';

import { useState } from 'react';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';

/** Kolom data log (di luar kolom Detail yang dirender khusus); `isi` menerima baris murni dari server. */
const KOLOM = [
  { label: 'log.waktu', isi: (b) => <span className="whitespace-nowrap">{b.waktu}</span> },
  { label: 'log.pengguna', isi: (b) => b.pengguna_nama ?? <span className="text-muted">{t('log.sistem')}</span> },
  { label: 'log.aksi', isi: (b) => <span className="font-semibold">{b.aksi_label}</span> },
  { label: 'log.entitas', isi: (b) => <span className="break-all">{b.entitas}{b.entitas_id ? ` #${b.entitas_id}` : ''}</span> },
];

/** Jumlah seluruh kolom tabel (kolom data + kolom Detail), dipakai `colSpan` baris detail. */
const JUMLAH_KOLOM = KOLOM.length + 1;

/** Detail dianggap kosong bila null, undefined, atau teks kosong. */
function kosong(detail) {
  return detail == null || (typeof detail === 'string' && detail.trim() === '');
}

/** Teks detail untuk ditampilkan: string apa adanya (tanpa tanda kutip tambahan), selain itu JSON rapi berindentasi 2 spasi. */
function teksDetail(detail) {
  // detail berupa teks biasa: stringify akan menambah tanda kutip ganda yang tidak perlu
  if (typeof detail === 'string') return detail;
  return JSON.stringify(detail, null, 2);
}

/** Isi detail selebar wadahnya: font mono, latar beda tipis, bungkus baris, scroll vertikal saja. */
function IsiDetail({ id, detail }) {
  return (
    <pre id={id} className="max-h-80 overflow-y-auto rounded-md border border-line bg-bg p-3 font-mono text-[0.8em] whitespace-pre-wrap [overflow-wrap:anywhere]">
      {teksDetail(detail)}
    </pre>
  );
}

/** Tombol buka/tutup detail; ikon dan label berganti sesuai keadaan, dengan atribut aksesibilitas. */
function TombolDetail({ terbuka, idIsi, onKlik }) {
  return (
    <Button varian="hantu" ikon={terbuka ? 'sembunyikan' : 'lihat'} aria-expanded={terbuka} aria-controls={idIsi} onClick={onKlik}>
      {terbuka ? t('log.tutupDetail') : t('log.lihatDetail')}
    </Button>
  );
}

/**
 * Tabel log di layar lebar (md ke atas) dan daftar kartu di HP. Detail JSON tampil di bawah baris/kartunya
 * dengan lebar penuh. `baris`: [{ id, waktu, pengguna_nama, aksi_label, entitas, entitas_id, detail }] (data murni,
 * karena fungsi tidak bisa dikirim dari server component). Status buka disimpan per id dan dipakai bersama tabel dan kartu.
 */
export default function TabelLog({ baris }) {
  const [terbuka, setTerbuka] = useState(() => new Set());

  /** Membuka atau menutup detail satu baris tanpa memengaruhi baris lain. */
  function ganti(id) {
    setTerbuka((awal) => {
      const baru = new Set(awal);
      // sudah terbuka: tutup; belum: buka
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  return (
    <>
      <Card className="hidden overflow-hidden p-0 sm:p-0 md:block">
        <table className="w-full text-left">
          <thead className="border-b border-line bg-bg text-muted">
            <tr>
              {KOLOM.map((k) => (
                <th key={k.label} scope="col" className="px-4 py-3 font-semibold">{t(k.label)}</th>
              ))}
              <th scope="col" className="px-4 py-3 font-semibold">{t('log.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => {
              const idIsi = `tabel-detail-log-${b.id}`;
              const buka = terbuka.has(b.id) && !kosong(b.detail);
              return (
                <RowTabel key={b.id} b={b} idIsi={idIsi} buka={buka} onKlik={() => ganti(b.id)} />
              );
            })}
          </tbody>
        </table>
      </Card>
      <ul className="space-y-3 md:hidden">
        {baris.map((b) => {
          const idIsi = `kartu-detail-log-${b.id}`;
          const buka = terbuka.has(b.id) && !kosong(b.detail);
          return (
            <li key={b.id}>
              <Card className="space-y-2">
                {KOLOM.map((k) => (
                  <div key={k.label}>
                    <p className="text-[0.85em] text-muted">{t(k.label)}</p>
                    <div>{k.isi(b)}</div>
                  </div>
                ))}
                <div>
                  <p className="text-[0.85em] text-muted">{t('log.detail')}</p>
                  {/* tanpa detail: cukup tanda "-", tanpa tombol */}
                  {kosong(b.detail) ? <span className="text-muted">-</span> : <TombolDetail terbuka={buka} idIsi={idIsi} onKlik={() => ganti(b.id)} />}
                </div>
                {/* detail di bawah isi kartu, selebar kartu */}
                {buka && <IsiDetail id={idIsi} detail={b.detail} />}
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Satu baris data tabel beserta baris detail tambahan (colSpan penuh) tepat di bawahnya saat terbuka. */
function RowTabel({ b, idIsi, buka, onKlik }) {
  return (
    <>
      {/* garis bawah baris data dihilangkan saat terbuka agar detail terlihat menyatu dengan barisnya */}
      <tr className={`align-top ${buka ? '' : 'border-b border-line last:border-0'}`}>
        {KOLOM.map((k) => (
          <td key={k.label} className="px-4 py-3">{k.isi(b)}</td>
        ))}
        <td className="px-4 py-3">
          {/* tanpa detail: cukup tanda "-", tanpa tombol */}
          {kosong(b.detail) ? <span className="text-muted">-</span> : <TombolDetail terbuka={buka} idIsi={idIsi} onKlik={onKlik} />}
        </td>
      </tr>
      {buka && (
        <tr className="border-b border-line last:border-0">
          <td colSpan={JUMLAH_KOLOM} className="px-4 pb-3">
            <IsiDetail id={idIsi} detail={b.detail} />
          </td>
        </tr>
      )}
    </>
  );
}
