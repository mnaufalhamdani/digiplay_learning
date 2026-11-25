import LayoutPengelola from '@/modules/layout/LayoutPengelola';

/** Semua halaman backoffice yang butuh login memakai kerangka pengelola (guard ada di dalamnya). */
export default function Layout({ children }) {
  return <LayoutPengelola>{children}</LayoutPengelola>;
}
