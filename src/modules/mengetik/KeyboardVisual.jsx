import { t } from '@/utils/i18n';
import { cariTombol, JARI } from '@/utils/tataLetakKeyboard';
import KeyboardSvg from './KeyboardSvg';

/** Warna per jari (token): kelingking, manis, tengah, telunjuk, jempol. */
const WARNA_JARI = ['var(--info)', 'var(--ok)', 'var(--sun)', 'var(--primary)', 'var(--bad)'];

/**
 * Keyboard yang menyorot tombol berikutnya dengan warna jari yang dianjurkan; nama jari juga ditulis
 * sebagai teks (tidak mengandalkan warna saja).
 */
export default function KeyboardVisual({ karakter }) {
  const berikut = karakter == null ? null : cariTombol(karakter);
  const jari = berikut ? JARI[berikut.jari] : null;
  return (
    <div className="space-y-2">
      <KeyboardSvg
        label={t('mengetik.keyboardLabel')}
        isiTombol={(tb) => (berikut && tb.kunci === berikut.kunci ? { isi: WARNA_JARI[jari.warna], opasitas: 0.85, tebal: true } : { isi: 'var(--panel)' })}
      />
      <p className="text-center font-semibold text-muted" aria-live="polite">
        {/* karakter di luar tata letak (mis. tanda seru): cukup sebut karakternya */}
        {berikut ? t('mengetik.tombolBerikut', { tombol: berikut.label, jari: jari.label }) : karakter ? t('mengetik.ketikKarakter', { karakter }) : ''}
        {karakter && karakter !== karakter.toLowerCase() && ` ${t('mengetik.pakaiShift')}`}
      </p>
    </div>
  );
}
