'use client';
import Link from 'next/link';
import { useArea } from '@/modules/shared/ui/AreaContext';
import { gabungJalur } from '@/utils/jalurArea';
import LogoAplikasi from './LogoAplikasi';

/**
 * Logo aplikasi di header (menaut ke beranda area): logo utama (landscape, sudah memuat tulisan nama) di layar lebar dan
 * logo ikon di HP (di bawah titik patah sm). Nama pelatihan dibaca layar pembaca lewat `alt` logo.
 */
export default function Merek({ branding, keBeranda = true }) {
  const { basis } = useArea();
  const isi = (
    <>
      {/* visibilitas diatur di pembungkus: display bawaan wadah logo akan menimpa kelas hidden bila ditaruh di wadah yang sama */}
      <span className="hidden sm:flex">
        <LogoAplikasi branding={branding} varian="utama" />
      </span>
      <span className="flex sm:hidden">
        <LogoAplikasi branding={branding} varian="ikon" />
      </span>
    </>
  );
  // halaman masuk tidak menaut ke beranda (beranda butuh login)
  if (!keBeranda) return <div className="flex min-w-0 items-center gap-2">{isi}</div>;
  return (
    <Link href={gabungJalur(basis, '/')} className="flex min-w-0 items-center gap-2 rounded-sm">
      {isi}
    </Link>
  );
}
