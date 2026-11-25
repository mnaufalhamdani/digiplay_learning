import { metadataArea } from '@/modules/layout/layout.metadata';

export const dynamic = 'force-dynamic';

/** Judul tab area siswa dari nama pelatihan di pengaturan. */
export const generateMetadata = metadataArea;

/** Layout area siswa; pembungkus data-area dipasang oleh ShellSiswa di tiap halaman. */
export default function Layout({ children }) {
  return children;
}
