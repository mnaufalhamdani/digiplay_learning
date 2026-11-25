import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import FormTemplate from './FormTemplate';

/** Halaman tambah (tanpa `params`) atau ubah template (khusus admin; tutor mendapat 404). */
export default async function HalamanFormTemplate({ params = null }) {
  await wajibAdmin();
  const dep = ambilDep();
  const id = params ? (await params).id : null;
  const [pilihan, awal, info] = await Promise.all([
    dep.templateController.pilihan(),
    // mode ubah: muat template yang diubah; ID tidak dikenal menjadi 404
    id ? atau404(() => dep.templateController.detail({ id })) : null,
    infoPermintaan(),
  ]);
  return (
    <div className="space-y-4">
      <TautanTombol href={gabungJalur(info.basis, awal ? `/template/${awal.id}` : '/template')} varian="hantu" ikon="kembali">
        {t('umum.kembali')}
      </TautanTombol>
      <h1 className="text-[1.5em] font-bold break-all">{awal ? t('template.ubahJudul', { kode: awal.kode }) : t('template.tambah')}</h1>
      <FormTemplate awal={awal} pilihan={pilihan} />
    </div>
  );
}
