import { ambilDep } from '@/di/container';
import { atau404 } from '@/utils/atau404';
import ShellSiswa from '@/modules/layout/ShellSiswa';
import { konteksSiswa } from '@/modules/sesi/konteksSiswa';
import KlienLabirin from './KlienLabirin';

/**
 * Halaman satu labirin Coding Zippy (siswa). Hanya bagian labirin yang dibutuhkan tampilan yang dikirim ke browser
 * (tanpa contoh_solusi). Di luar sesi siswa tetap bisa mencoba, hasilnya tidak tersimpan. `?tugas=` menandai tugas
 * bertipe blockly yang sedang dikerjakan (hanya untuk keterangan; penilaian tetap dicocokkan di server).
 */
export default async function HalamanLabirin({ params, searchParams }) {
  const k = await konteksSiswa();
  const { kode } = await params;
  const { tugas: tugasId } = await searchParams;
  const dep = ambilDep();
  const [l, tugasData] = await Promise.all([
    atau404(() => dep.blocklyController.detail({ kode }, k.sesiSiswa)),
    k.sesi && tugasId ? dep.tugasController.untukLatihan(String(tugasId), k.sesiSiswa) : null,
  ]);
  const labirin = { kode: l.kode, nama: l.nama, lebar: l.lebar, tinggi: l.tinggi, grid: l.grid, mulai: l.mulai, bintang: l.bintang, batas_blok: l.batas_blok, blok_tersedia: l.blok_tersedia, petunjuk: l.petunjuk, sudahSelesai: l.sudahSelesai, berikutnya: l.berikutnya };
  const tugas = tugasData?.tipe === 'blockly' ? { id: tugasData.id, labirin: tugasData.kunci.labirin } : null;
  return (
    <ShellSiswa branding={k.branding} basis={k.basis} mode="siswa" intervalPingMs={k.intervalPingMs} sesiAktifId={k.sesi?.id ?? null}>
      {/* key: pindah ke labirin berikutnya memuat ulang papan dan editor dari awal */}
      <KlienLabirin key={labirin.kode} labirin={labirin} sesiAktif={Boolean(k.sesi)} tugas={tugas} />
    </ShellSiswa>
  );
}
