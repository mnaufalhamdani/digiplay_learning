import { ambilDep } from '@/di/container';
import { wajibAdmin } from '@/modules/auth/auth.guard';
import DaftarPengguna from './DaftarPengguna';

/** Halaman Pengguna (khusus admin): daftar akun admin/tutor dan aksinya. */
export default async function HalamanPengguna() {
  const sesi = await wajibAdmin();
  const daftar = await ambilDep().penggunaController.daftar();
  return <DaftarPengguna daftar={daftar} idSaya={sesi.id} />;
}
