import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { menuUntukPeran } from './menuPengelola';
import ShellPengelola from './ShellPengelola';

/** Layout halaman pengelola yang butuh login: guard, lalu kerangka dengan menu sesuai peran dan lencana jumlah sesi berlangsung. */
export default async function LayoutPengelola({ children }) {
  const sesi = await wajibPengguna();
  const dep = ambilDep();
  const [branding, info, jumlahSesi] = await Promise.all([dep.pengaturanController.branding(), infoPermintaan(), dep.sesiController.jumlahBerlangsung()]);
  // lencana hanya pada menu Absensi dan hanya bila ada sesi berlangsung
  const menu = menuUntukPeran(sesi.peran).map((m) => (m.jalur === '/absensi' && jumlahSesi > 0 ? { ...m, lencana: jumlahSesi } : m));
  return (
    <ShellPengelola branding={branding} basis={info.basis} pengguna={{ nama: sesi.nama, peran: sesi.peran }} menu={menu}>
      {children}
    </ShellPengelola>
  );
}
