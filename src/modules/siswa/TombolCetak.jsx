'use client';
import { t } from '@/utils/i18n';
import Button from '@/modules/shared/ui/Button';

/** Tombol membuka dialog cetak browser (tidak ikut tercetak). */
export default function TombolCetak() {
  return (
    <Button ikon="cetak" onClick={() => window.print()}>
      {t('dataSiswa.cetak')}
    </Button>
  );
}
