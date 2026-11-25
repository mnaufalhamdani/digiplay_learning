/**
 * Bilah kemajuan berbentuk pil dengan label teks (tidak mengandalkan warna saja).
 * Isian beranimasi lebar; transisi dimatikan bila pengguna memilih kurangi gerakan.
 */
export default function ProgressBar({ nilai, maks, label }) {
  const persen = maks > 0 ? Math.round((Math.min(nilai, maks) / maks) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <p className="font-bold">{label}</p>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={maks} aria-valuenow={nilai} aria-label={label} className="h-4 w-full overflow-hidden rounded-full border-2 border-line bg-bg">
        <div className="h-full rounded-full bg-ok transition-[width] duration-[var(--dur-lambat)] motion-reduce:transition-none" style={{ width: `${persen}%` }} />
      </div>
    </div>
  );
}
