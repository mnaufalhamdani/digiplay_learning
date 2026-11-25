/** Gaya per varian kartu. */
const VARIAN = {
  polos: 'border border-line bg-panel',
  terangkat: 'border border-line bg-panel shadow-[0_6px_20px_-8px_var(--line)]',
  berwarna: 'bg-primary-soft',
};

/** Pembungkus utama konten dengan sudut membulat dari token area. */
export default function Card({ varian = 'polos', as: Tag = 'section', className = '', children, ...sisa }) {
  return (
    <Tag className={`rounded-lg p-4 sm:p-6 ${VARIAN[varian] ?? VARIAN.polos} ${className}`} {...sisa}>
      {children}
    </Tag>
  );
}
