'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gabungJalur } from '@/utils/jalurArea';

/**
 * Menjaga login siswa tetap aktif: ping ke server tiap `intervalMs` selama tab terlihat,
 * dan sekali lagi saat tab kembali terlihat. Balasan 401 berarti login sudah berakhir -> ke halaman masuk.
 * Balasan membawa `sesiAktifId`; bila berbeda dengan sesi saat halaman dirender (tutor baru mengabsen atau
 * menutup sesi), halaman dimuat ulang dari server tanpa muat ulang manual.
 */
export default function PingSesi({ intervalMs, basis, sesiAktifId = null }) {
  const router = useRouter();
  // nilai terakhir yang sudah ditampilkan; diperbarui setiap kali server merender ulang halaman
  const terakhir = useRef(sesiAktifId);
  terakhir.current = sesiAktifId;
  useEffect(() => {
    let berhenti = false;
    /** Mengirim satu ping bila tab terlihat. */
    async function ping() {
      // tab tersembunyi tidak dihitung aktif: biarkan batas tidak aktif berjalan
      if (berhenti || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/v1/auth/ping', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
        // login sudah berakhir di server (tidak aktif, ganti device, ditutup tutor)
        if (res.status === 401) {
          berhenti = true;
          window.location.replace(gabungJalur(basis, '/masuk'));
          return;
        }
        const isi = await res.json();
        // status sesi berubah sejak halaman dirender: ambil tampilan terbaru dari server
        if (res.ok && (isi?.data?.sesiAktifId ?? null) !== terakhir.current) router.refresh();
      } catch {
        // jaringan putus sesaat: coba lagi pada interval berikutnya
      }
    }
    const timer = setInterval(ping, intervalMs);
    document.addEventListener('visibilitychange', ping);
    return () => {
      berhenti = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, [intervalMs, basis, router]);
  return null;
}
