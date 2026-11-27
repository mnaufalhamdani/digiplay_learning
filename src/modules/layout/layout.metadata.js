import { ambilDep } from '@/di/container';
import { t } from '@/utils/i18n';

/** Metadata tiap area: judul tab memakai nama pelatihan dari pengaturan (halaman menambah judulnya sendiri); ikon tab tetap dari src/app. */
export async function metadataArea() {
  const { namaPelatihan } = await ambilDep().pengaturanController.branding();
  return {
    title: { default: namaPelatihan, template: `%s · ${namaPelatihan}` },
    description: t('app.deskripsi'),
    // ikon tab bersifat tetap: berkas src/app/favicon.ico, icon.png, dan apple-icon.png (dikenali Next.js), bukan logo unggahan
    // icons: logoUrl ? { icon: logoUrl } : undefined,
  };
}
