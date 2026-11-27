import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur, jalurQuery } from '@/utils/jalurArea';
import Paginasi from '@/modules/shared/ui/Paginasi';
import DaftarPengguna from './DaftarPengguna';
/** Halaman Pengguna (khusus admin): daftar akun admin/tutor (berpaginasi) dan aksinya. */
export default async function HalamanPengguna({ searchParams }) {
  const sesi = await wajibAdmin();
  const [data, info] = await Promise.all([ambilDep().penggunaController.halaman(await searchParams), infoPermintaan()]);
  return (
    <div className="space-y-4">
      <DaftarPengguna daftar={data.baris} idSaya={sesi.id} />
      <Paginasi halaman={data.halaman} totalHalaman={data.totalHalaman} total={data.total} hrefHalaman={(n) => gabungJalur(info.basis, jalurQuery('/pengguna', { halaman: n }))} />
    </div>
  );
}
