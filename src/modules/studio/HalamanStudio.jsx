import { redirect } from 'next/navigation';
import { ambilDep } from '@/di/container';
import { adalahAppError } from '@/utils/appError';
import { atau404 } from '@/utils/atau404';
import { gabungJalur } from '@/utils/jalurArea';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import { MENU_GAME } from '@/enums';
import { konteksSiswa, wajibMenuTerbuka } from '@/modules/sesi/konteksSiswa';
import KepalaButirStudio from './KepalaButirStudio';
import KlienStudio from './KlienStudio';

/**
 * Konteks pengerjaan dari alamat: `?butir=` (butir praktik post test yang sedang berjalan) atau `?tugas=` (tugas
 * coding_proyek siswa yang masih bisa dikerjakan). Hasil: { tugas, butir } dengan salah satunya terisi atau keduanya null
 * (mode bebas: bereksperimen tanpa tugas). Butir yang tidak sah mengembalikan alamat tujuan pengalihan lewat `alihkan`.
 */
async function bacaKonteks(searchParams, k, dep) {
  const { tugas: tugasId, butir: butirId } = await searchParams;
  if (butirId) {
    try {
      const b = await dep.posttestController.butirStudio({ tugasId: String(butirId) }, k.sesiSiswa);
      return { butir: { jenis: 'butir', id: b.id, soal: b.soal, terkirim: b.terkirim, sisaDetik: b.sisaDetik, levelNama: b.levelNama } };
    } catch (error) {
      // bukan butir milik siswa, tes tidak berjalan, atau waktu habis: kembali ke halaman post test (yang menjelaskan keadaannya)
      if (adalahAppError(error)) return { alihkan: '/post-test' };
      throw error;
    }
  }
  // tugas yang tidak ada, sudah selesai, atau terkunci materi: Studio dibuka dalam mode bebas
  const data = k.sesi && tugasId ? await dep.tugasController.untukLatihan(String(tugasId), k.sesiSiswa) : null;
  if (data?.tipe !== 'coding_proyek') return { tugas: null };
  const ringkas = await dep.studioController.ringkasanKiriman({ tugasId: data.id }, k.sesiSiswa);
  return { tugas: { jenis: 'tugas', id: data.id, soal: data.soal, terkirim: ringkas?.nama ?? null } };
}

/**
 * Halaman Studio Zippy (siswa). Hanya data yang dibutuhkan tampilan yang dikirim ke browser: pustaka sprite, proyek yang
 * dibuka (`?proyek=`), dan konteks tugas/butir. Di luar sesi siswa tetap bisa bereksperimen, tetapi tidak menyimpan.
 * Dari butir post test halaman memakai layar fokus dengan pewaktu yang tetap berdenyut.
 */
export default async function HalamanStudio({ searchParams }) {
  const k = await konteksSiswa();
  const dep = ambilDep();
  // Studio terbuka setelah tugas coding_proyek pertama muncul; mode butir post test (layar fokus) tidak pernah terhalang
  if (!(await searchParams).butir) wajibMenuTerbuka(k, MENU_GAME.STUDIO);
  const konteks = await bacaKonteks(searchParams, k, dep);
  if (konteks.alihkan) redirect(gabungJalur(k.basis, konteks.alihkan));
  const { proyek: proyekId } = await searchParams;
  const [pustaka, tingkat, proyekAwal] = await Promise.all([dep.studioController.pustaka(), dep.studioController.konteksTingkat(null, k.sesiSiswa), proyekId ? atau404(() => dep.studioController.buka({ id: String(proyekId) }, k.sesiSiswa)) : null]);
  const tugas = konteks.butir ?? konteks.tugas ?? null;
  const fokus = Boolean(konteks.butir);
  return (
    <ShellSiswa
      branding={k.branding}
      basis={k.basis}
      mode={fokus ? 'fokus' : 'siswa'}
      intervalPingMs={k.intervalPingMs}
      sesiAktifId={k.sesi?.id ?? null}
      menuTerbuka={k.menuTerbuka}
      kepalaFokus={fokus ? <KepalaButirStudio sisaDetik={konteks.butir.sisaDetik} levelNama={konteks.butir.levelNama} basis={k.basis} /> : null}
    >
      <KlienStudio pustaka={pustaka} tingkatBoleh={tingkat.tingkatBoleh} proyekAwal={proyekAwal} sesiAktif={Boolean(k.sesi)} tugas={tugas && { jenis: tugas.jenis, id: tugas.id, soal: tugas.soal, terkirim: tugas.terkirim }} />
    </ShellSiswa>
  );
}
