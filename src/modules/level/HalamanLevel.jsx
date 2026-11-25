import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { PERAN } from '@/enums';
import DaftarLevel from './DaftarLevel';

/** Halaman Level dan Materi: level -> 13 pertemuan -> jumlah template, dan bagian post test. Admin bisa mengubah. */
export default async function HalamanLevel() {
  const sesi = await wajibPengguna();
  const struktur = await ambilDep().levelController.struktur();
  return <DaftarLevel struktur={struktur} bolehUbah={sesi.peran === PERAN.ADMIN} />;
}
