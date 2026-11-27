import { wajibPengguna } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import Card from '@/modules/shared/ui/Card';
import Badge from '@/modules/shared/ui/Badge';
import { PERAN } from '@/enums';
import FormUbahPassword from './FormUbahPassword';
import FormProfil from './FormProfil';

/** Halaman Akun: profil singkat, ubah profil, dan ubah password sendiri (admin maupun tutor). */
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
      {/* dua form berdampingan bila lebar konten cukup (container query, karena menu samping mengurangi lebar) */}
      <div className="@container max-w-4xl">
        <div className="grid gap-6 @2xl:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-[1.15em] font-bold">{t('akun.ubahProfil')}</h2>
            <FormProfil awal={{ nama: sesi.nama, email: sesi.email }} />
          </Card>
          <Card>
            <h2 className="mb-4 text-[1.15em] font-bold">{t('akun.ubahPassword')}</h2>
            <FormUbahPassword />
          </Card>
        </div>
      </div>
    </div>
  );
}
