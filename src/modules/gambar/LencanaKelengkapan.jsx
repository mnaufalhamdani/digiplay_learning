import { t } from '@/utils/i18n';
import Badge from '@/modules/shared/ui/Badge';

/** Lencana status subjek: nonaktif, lengkap, atau berkas apa saja yang belum ada (selalu berteks). */
export default function LencanaKelengkapan({ g }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {!g.aktif && <Badge nada="netral">{t('pengguna.nonaktif')}</Badge>}
      {/* lengkap = mewarnai, berwarna, dan puzzle tersedia */}
      {g.kurang.length === 0 ? (
        <Badge nada="sukses">{t('gambar.lengkap')}</Badge>
      ) : (
        <Badge nada="peringatan">{t('gambar.kurang', { berkas: g.kurang.map((j) => t(`gambar.berkas.${j}`)).join(', ') })}</Badge>
      )}
    </span>
  );
}
