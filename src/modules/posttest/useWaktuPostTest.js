import { useEffect, useRef, useState } from 'react';
import { WAKTU_POST_TEST } from '@/enums';

/**
 * Waktu post test: tampilan menghitung mundur dari nilai server, lalu disinkronkan lewat denyut tiap 15 detik
 * saat halaman terlihat. Server yang memutuskan waktu habis (dan mengumpulkan); `habis()` dipanggil saat itu.
 * `saatDenyut(data)` menerima balasan tiap denyut (mis. daftar butir praktik yang baru dinilai tutor).
 * Dipakai halaman post test dan halaman Studio Zippy dari butir praktik (waktu tetap berjalan di sana).
 */
export function useWaktu(awal, habis, saatDenyut) {
  const [sisa, setSisa] = useState(awal);
  const panggil = useRef(habis);
  panggil.current = habis;
  const panggilDenyut = useRef(saatDenyut);
  panggilDenyut.current = saatDenyut;
  useEffect(() => {
    let berhenti = false;
    /** Satu denyut ke server; balasannya menggantikan hitungan tampilan. */
    async function denyut() {
      if (berhenti || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/v1/posttest/denyut', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
        const isi = await res.json();
        // login berakhir atau tes sudah dikumpulkan: muat ulang agar halaman menyesuaikan
        if (!res.ok || isi.data.selesai) return panggil.current();
        setSisa(isi.data.sisaDetik);
        panggilDenyut.current?.(isi.data);
      } catch {
        // jaringan putus sesaat: coba lagi pada denyut berikutnya
      }
    }
    const jam = setInterval(() => setSisa((s) => Math.max(0, s - 1)), 1000);
    const timer = setInterval(denyut, WAKTU_POST_TEST.intervalDenyutDetik * 1000);
    document.addEventListener('visibilitychange', denyut);
    return () => {
      berhenti = true;
      clearInterval(jam);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', denyut);
    };
  }, []);
  // hitungan tampilan habis: minta server memeriksa sekarang juga (server yang mengumpulkan)
  useEffect(() => {
    if (sisa > 0) return;
    fetch('/api/v1/posttest/denyut', { method: 'POST', credentials: 'same-origin', cache: 'no-store' }).finally(() => panggil.current());
  }, [sisa]);
  return sisa;
}
