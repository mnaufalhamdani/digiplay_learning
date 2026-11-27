/** Penanda saat memuat: blok berdenyut berwarna token; ukuran dan bentuk diatur lewat `className`. Tidak dibacakan pembaca layar. */
export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-primary-soft ${className}`} />;
}
