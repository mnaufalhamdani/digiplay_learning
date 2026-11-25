'use client';
import Link from 'next/link';
import { useArea } from '@/modules/shared/ui/AreaContext';
import { gabungJalur } from '@/utils/jalurArea';

/** Logo dan nama pelatihan dari pengaturan; menaut ke beranda area. */
export default function Merek({ branding, keBeranda = true }) {
  const { basis } = useArea();
  const isi = (
    <>
      {branding.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- logo unggahan disajikan lewat route berkas
        <img src={branding.logoUrl} alt="" className="h-9 w-auto max-w-[8rem] rounded-sm object-contain" />
      )}
      <span className="font-display text-[1.1em] font-bold leading-tight">{branding.namaPelatihan}</span>
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
