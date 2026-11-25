'use client';
import { useState } from 'react';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';

/** Kode ditampilkan per 4 karakter agar mudah dibacakan, mis. "ABCD EFGH". */
function kelompokkan(kode) {
  return String(kode ?? '').replace(/(.{4})(?=.)/g, '$1 ');
}

/** Menyalin teks ke clipboard; cadangan textarea untuk browser tanpa izin Clipboard API (mis. HTTP non-localhost). */
export async function salinTeks(teks) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    // Clipboard API ditolak: pakai cara lama lewat elemen sementara
    const el = document.createElement('textarea');
    el.value = teks;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}

/**
 * Satu kode akses dengan label, tombol Salin, dan (opsional) tampil/sembunyi.
 * `bisaSembunyi` true: kode awalnya disembunyikan (detail siswa); false: langsung tampil (setelah mendaftar).
 */
export default function TampilanKode({ label, kode, bisaSembunyi = false }) {
  const [tampil, setTampil] = useState(!bisaSembunyi);
  const [tersalin, setTersalin] = useState(false);
  /** Menyalin kode lalu menampilkan "Tersalin" sebentar. */
  async function salin() {
    // gagal menyalin (sangat jarang): biarkan label tombol apa adanya
    if (!(await salinTeks(kode))) return;
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  }
  return (
    <div className="space-y-2">
      <p className="font-semibold">{label}</p>
      <p className="font-mono text-[1.5em] font-bold tracking-widest" aria-live="polite">
        {/* kode tidak ada (mis. data lama): beri tanda, jangan kotak kosong */}
        {!kode ? '-' : tampil ? kelompokkan(kode) : '•••• ••••'}
      </p>
      <div className="flex flex-wrap gap-2">
        {bisaSembunyi && (
          <Button varian="secondary" ikon={tampil ? 'sembunyikan' : 'lihat'} onClick={() => setTampil((v) => !v)} disabled={!kode}>
            {t(tampil ? 'dataSiswa.sembunyikan' : 'dataSiswa.tampilkan')}
          </Button>
        )}
        <Button varian="secondary" ikon={tersalin ? 'sukses' : 'salin'} onClick={salin} disabled={!kode}>
          {t(tersalin ? 'dataSiswa.tersalin' : 'dataSiswa.salin')}
        </Button>
      </div>
    </div>
  );
}
