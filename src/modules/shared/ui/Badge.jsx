/** Warna per nada; status selalu berisi teks sehingga tidak bergantung pada warna saja. */
const NADA = {
  netral: 'border border-line bg-bg text-muted',
  primer: 'bg-primary-soft text-primary-text',
  sukses: 'bg-ok-soft text-ok',
  peringatan: 'bg-warn-soft text-warn',
  bahaya: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
};

/** Lencana status kecil (Hadir, Tuntas, Aktif, Admin, dst). */
export default function Badge({ nada = 'netral', className = '', children }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.85em] font-bold ${NADA[nada] ?? NADA.netral} ${className}`}>{children}</span>;
}
