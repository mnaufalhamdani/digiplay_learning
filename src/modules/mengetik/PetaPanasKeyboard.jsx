import { t } from '@/utils/i18n';
import KeyboardSvg from './KeyboardSvg';

/**
 * Peta panas tombol (SVG QWERTY): makin pekat merah makin sering salah (rasio salah/ketik). Rasio tiap tombol
 * ada di <title> dan daftar 5 tombol terlemah ditulis sebagai teks.
 */
export default function PetaPanasKeyboard({ detail }) {
  const rasio = (k) => (detail[k]?.ketik ? detail[k].salah / detail[k].ketik : 0);
  const lemah = Object.keys(detail)
    .filter((k) => detail[k].salah > 0)
    .sort((a, b) => rasio(b) - rasio(a))
    .slice(0, 5);
  return (
    <div className="space-y-2">
      <KeyboardSvg
        label={t('mengetik.petaPanasLabel')}
        isiTombol={(tb) => (detail[tb.kunci]?.ketik ? { isi: 'var(--bad)', opasitas: 0.12 + Math.min(1, rasio(tb.kunci) * 2.5) * 0.75 } : { isi: 'var(--panel)' })}
        judulTombol={(tb) => (detail[tb.kunci] ? t('mengetik.rasioTombol', { tombol: tb.label, salah: detail[tb.kunci].salah, ketik: detail[tb.kunci].ketik }) : tb.label)}
      />
      <p className="font-semibold">{lemah.length > 0 ? t('mengetik.tombolSeringSalah', { daftar: lemah.map((k) => (k === 'spasi' ? 'spasi' : k.toUpperCase())).join(', ') }) : t('mengetik.belumAdaSalah')}</p>
    </div>
  );
}
