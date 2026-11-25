import { wajibPengguna } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import Card from '@/modules/shared/ui/Card';
import Badge from '@/modules/shared/ui/Badge';
import { PERAN } from '@/enums';
import FormUbahPassword from './FormUbahPassword';

/** Halaman Akun: profil singkat dan ubah password sendiri (admin maupun tutor). */
export default async function HalamanAkun() {
  const sesi = await wajibPengguna();
  return (
    <div className="space-y-6">
      <h1 className="text-[1.5em] font-bold">{t('akun.judul')}</h1>
      <Card className="space-y-1">
        <p className="font-semibold">{sesi.nama}</p>
        <p className="break-all text-muted">{sesi.email}</p>
        <Badge nada={sesi.peran === PERAN.ADMIN ? 'primer' : 'info'}>{t(`peran.${sesi.peran}`)}</Badge>
      </Card>
      <Card className="max-w-lg">
        <h2 className="mb-4 text-[1.15em] font-bold">{t('akun.ubahPassword')}</h2>
        <FormUbahPassword />
      </Card>
    </div>
  );
}
