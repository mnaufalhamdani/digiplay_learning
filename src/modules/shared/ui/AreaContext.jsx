'use client';
import { createContext, useContext, useMemo } from 'react';
import { AREA } from '@/enums';

/** Konteks kecil area tampilan: nama area (bobot ikon, gaya dialog) dan awalan jalur untuk tautan. */
const AreaContext = createContext({ area: AREA.PENGELOLA, basis: '' });

/** Penyedia konteks area; dipasang oleh ShellSiswa dan ShellPengelola. */
export function PenyediaArea({ area, basis = '', children }) {
  const nilai = useMemo(() => ({ area, basis }), [area, basis]);
  return <AreaContext.Provider value={nilai}>{children}</AreaContext.Provider>;
}

/** Membaca area yang sedang aktif. */
export function useArea() {
  return useContext(AreaContext);
}
