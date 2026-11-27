'use client';
import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/** Konteks navigasi filter dashboard: `memuat` (sedang berpindah) dan `pindah(url)`. */
const KonteksDashboard = createContext({ memuat: false, pindah: () => {} });

/** Mengambil konteks navigasi dashboard (dipakai bar filter). */
export function useDashboard() {
  return useContext(KonteksDashboard);
}

/**
 * Pembungkus seluruh isi dashboard. Memegang transisi navigasi: saat filter diganti, halaman dirender ulang di server
 * dan selama itu `data-memuat="true"` dipasang sehingga KartuGrafik menampilkan Skeleton (tanpa layar kosong). Kelas
 * `group/dash` dibaca KartuGrafik; padding bawah menyisakan ruang untuk tombol mengambang di HP.
 */
export default function PembungkusDashboard({ children }) {
  const router = useRouter();
  const [memuat, mulai] = useTransition();
  // dibungkus transisi agar `memuat` tetap true sampai data baru tiba, dan posisi gulir tidak melompat ke atas
  const pindah = useCallback((url) => mulai(() => router.push(url, { scroll: false })), [router]);
  const nilai = useMemo(() => ({ memuat, pindah }), [memuat, pindah]);
  return (
    <KonteksDashboard.Provider value={nilai}>
      <div data-memuat={memuat ? 'true' : 'false'} aria-busy={memuat} className="group/dash space-y-4 pb-20 sm:pb-0">
        {children}
      </div>
    </KonteksDashboard.Provider>
  );
}
