import 'server-only';
import { AppError } from '@/utils/appError';
import { uraiJson, teksJson } from '@/utils/json';
import { t } from '@/utils/i18n';
import { JENIS_BLOCKLY } from '@/enums';
import { simulasiProgram } from '@/modules/shared/blockly/simulasiProgram';

/** Baris labirin dari database menjadi objek siap pakai penerjemah dan tampilan (kolom JSON diurai, angka dirapikan). */
function bentukLabirin(b) {
  return {
    id: b.id,
    kode: b.kode,
    nama: b.nama,
    urutan: Number(b.urutan),
    lebar: Number(b.lebar),
    tinggi: Number(b.tinggi),
    grid: uraiJson(b.grid),
    mulai: uraiJson(b.mulai),
    bintang: uraiJson(b.bintang),
    batas_blok: Number(b.batas_blok),
    blok_tersedia: uraiJson(b.blok_tersedia),
    petunjuk: b.petunjuk ?? '',
    sudahSelesai: Boolean(Number(b.selesai)),
  };
}

/**
 * Usecase Coding Zippy: daftar dan detail labirin untuk siswa, serta penilaian program di server. Aturan sesi
 * sama dengan game mouse dan puzzle: hasil hanya tersimpan saat sesi berlangsung.
 */
export function buatBlocklyUsecase({ blocklyModel, sesiModel, tugasUsecase, idGen }) {
  /** Sesi berlangsung siswa atau 403 (di luar sesi siswa hanya mencoba, hasil tidak tersimpan). */
  async function wajibSesi(siswaId) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId);
    if (!sesi) throw new AppError(t('blockly.butuhSesi'), 403);
    return sesi;
  }
  /** Labirin aktif menurut kode atau 404. */
  async function wajibLabirin(kode, siswaId) {
    const b = await blocklyModel.cariKode(kode, siswaId);
    if (!b) throw new AppError(t('blockly.labirinTidakAda'), 404);
    return bentukLabirin(b);
  }
  return {
    /** Daftar labirin berurutan beserta tanda sudah selesai (tanpa grid; cukup untuk halaman daftar). */
    async daftar(siswaId) {
      const baris = (await blocklyModel.daftarAktif(siswaId)).map(bentukLabirin);
      return baris.map((l) => ({ kode: l.kode, nama: l.nama, urutan: l.urutan, batas_blok: l.batas_blok, sudahSelesai: l.sudahSelesai }));
    },
    /** Satu labirin untuk halaman main, beserta kode labirin berikutnya (null bila terakhir). */
    async detail(siswaId, kode) {
      const [labirin, semua] = await Promise.all([wajibLabirin(kode, siswaId), blocklyModel.daftarAktif(siswaId)]);
      const urutan = semua.map((b) => b.kode);
      return { ...labirin, berikutnya: urutan[urutan.indexOf(kode) + 1] ?? null };
    },
    /** Kode labirin dari namanya (tugas menyebut nama); null bila tidak ada. */
    async kodeDariNama(nama) {
      return (await blocklyModel.cariNama(nama))?.kode ?? null;
    },
    /**
     * Menilai program siswa di server. Server menjalankan penerjemah sendiri pada labirin dari database dan menentukan
     * berhasil atau tidak; kiriman "berhasil" dari browser tidak ada dan tidak akan dipercaya. Hanya percobaan yang
     * berhasil disimpan (satu baris hasil_latihan), lalu tugas yang cocok otomatis selesai.
     */
    async simpan(siswaId, { kode, program, durasiDetik = 0 }) {
      const sesi = await wajibSesi(siswaId);
      const labirin = await wajibLabirin(kode, siswaId);
      const hasil = simulasiProgram(labirin, program);
      const ringkas = { berhasil: hasil.berhasil, alasan: hasil.alasan, jumlahBlok: hasil.jumlahBlok, jumlahLangkah: hasil.jumlahLangkah };
      // gagal (menabrak, kosong, terlalu banyak blok, ...): tidak disimpan dan tidak ada tugas yang selesai
      if (!hasil.berhasil) return { ...ringkas, tugasSelesai: [] };
      const id = idGen.generate();
      const baris = { id, siswaId, sesiId: sesi.id, labirinId: labirin.id, durasiDetik: Math.round(durasiDetik), detail: teksJson({ jumlahBlok: hasil.jumlahBlok, jumlahLangkah: hasil.jumlahLangkah }) };
      await blocklyModel.tambahHasil(baris);
      // dicocokkan dengan kunci.jenis dan kunci.labirin (nama) tugas bertipe blockly
      const tugas = await tugasUsecase.selesaikanOtomatis(siswaId, { tipe: 'blockly', jenis: JENIS_BLOCKLY, labirin: labirin.nama });
      return { ...ringkas, id, tugasSelesai: tugas.tugasSelesai };
    },
  };
}
