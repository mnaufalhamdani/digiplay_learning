import HalamanVerifikasi, { metadataVerifikasi } from '@/modules/sertifikat/HalamanVerifikasi';
export const dynamic = 'force-dynamic';
/** Judul tab dan noindex, nofollow. */
export const generateMetadata = metadataVerifikasi;
/** Verifikasi sertifikat publik (dibuka lewat /verifikasi/<token> di host siswa maupun backoffice). */
export default function Page({ params }) {
  return <HalamanVerifikasi params={params} />;
}
