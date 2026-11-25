import 'server-only';
import { ambilDep } from '@/di/container';
import { wajibSiswa } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { keamananConfig } from '@/config/keamanan.config';

/**
 * Bahan bersama halaman siswa yang butuh login: sesi login siswa, branding, awalan jalur, interval ping,
 * dan sesi berlangsung beserta tugasnya (null bila belum diabsen). Dipakai halaman beranda dan latihan.
 */
export async function konteksSiswa() {
  const sesiSiswa = await wajibSiswa();
  const dep = ambilDep();
  const [branding, info, sesi] = await Promise.all([dep.pengaturanController.branding(), infoPermintaan(), dep.sesiController.berandaSiswa(null, sesiSiswa)]);
  return { sesiSiswa, branding, basis: info.basis, sesi, intervalPingMs: keamananConfig.intervalPingDetik * 1000 };
}
