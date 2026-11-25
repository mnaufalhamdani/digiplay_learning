import { ambilDep } from '@/di/container';
import { t } from '@/utils/i18n';

/** Metadata tiap area: judul tab memakai nama pelatihan dari pengaturan (halaman menambah judulnya sendiri). */
export async function metadataArea() {
  const { namaPelatihan, logoUrl } = await ambilDep().pengaturanController.branding();
  return {
    title: { default: namaPelatihan, template: `%s · ${namaPelatihan}` },
    description: t('app.deskripsi'),
    // logo unggahan dipakai juga sebagai ikon tab bila ada
    icons: logoUrl ? { icon: logoUrl } : undefined,
  };
}
