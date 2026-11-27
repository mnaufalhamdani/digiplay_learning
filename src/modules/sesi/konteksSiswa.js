import 'server-only';
import { notFound } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { wajibSiswa } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { keamananConfig } from '@/config/keamanan.config';

/**
 * Bahan bersama halaman siswa yang butuh login: sesi login siswa, branding, awalan jalur, interval ping,
 * sesi berlangsung beserta tugasnya (null bila belum diabsen), dan menuTerbuka (kunci menu game yang sudah terbuka untuk
 * siswa, diturunkan dari tugas yang pernah muncul). Dipakai halaman beranda dan latihan.
 */
export async function konteksSiswa() {
  const sesiSiswa = await wajibSiswa();
  const dep = ambilDep();
  const [branding, info, sesi, menuTerbuka] = await Promise.all([dep.pengaturanController.branding(), infoPermintaan(), dep.sesiController.berandaSiswa(null, sesiSiswa), dep.latihanController.menuGameTerbuka(null, sesiSiswa)]);
  return { sesiSiswa, branding, basis: info.basis, sesi, menuTerbuka, intervalPingMs: keamananConfig.intervalPingDetik * 1000 };
}

/** Penjaga halaman game: menjawab 404 (seperti menu Materi yang tidak boleh dibuka) bila menunya belum terbuka untuk siswa. */
export function wajibMenuTerbuka(k, menu) {
  // URL langsung ke game yang belum terbuka: tampil seperti halaman yang tidak ada
  if (!k.menuTerbuka.includes(menu)) notFound();
}
