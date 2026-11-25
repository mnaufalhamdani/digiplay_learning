import { metadataArea } from '@/modules/layout/layout.metadata';

export const dynamic = 'force-dynamic';

/** Judul tab area pengelola dari nama pelatihan di pengaturan. */
export const generateMetadata = metadataArea;

/** Layout area pengelola; pembungkus data-area dipasang oleh kerangka halaman. */
export default function Layout({ children }) {
  return children;
}
