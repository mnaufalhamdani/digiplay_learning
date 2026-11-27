import 'server-only';
import { AppError } from '@/utils/appError';
import { adaOutline, penandaBerkasGambar } from '@/utils/berkasGambar';
import { hitungPaginasi } from '@/utils/paginasi';
import { t } from '@/utils/i18n';
import { AKSI_LOG, BERKAS_GAMBAR, JENIS_GAMBAR, UKURAN_HALAMAN } from '@/enums';

/** URL publik berkas subjek (disajikan langsung dari public/aset/gambar, tanpa route khusus). */
function urlBerkas(kode, berkas) {
  return `/aset/gambar/${kode}/${berkas}.png`;
}

/** Bentuk tampilan satu subjek: penanda boolean, berkas yang belum ada, dan URL pratinjau berwarna. */
function bentukGambar(g) {
  const punya = Object.fromEntries(JENIS_GAMBAR.map((j) => [j, Boolean(g[`punya_${j}`])]));
  return {
    id: g.id,
    kode: g.kode,
    kategori: g.kategori,
    nama: g.nama,
    namaEn: g.nama_en,
    aktif: Boolean(g.aktif),
    punya,
    kurang: JENIS_GAMBAR.filter((j) => !punya[j]),
    urlPratinjau: punya.berwarna ? urlBerkas(g.kode, 'berwarna') : null,
  };
}

/** Usecase gambar: daftar, detail, aktif/nonaktif, pindai ulang berkas, dan bank gambar per jenis untuk template. */
export function buatGambarUsecase({ gambarModel, db, catatAktivitas, folderGambar }) {
  /** Mengambil subjek atau melempar 404. */
  async function wajibAda(id, conn = null) {
    const g = await gambarModel.cariId(id, conn);
    if (!g) throw new AppError(t('gambar.tidakAda'), 404);
    return g;
  }
  return {
    /** Daftar subjek sesuai filter. */
    async daftar(filter) {
      return (await gambarModel.daftar(filter)).map(bentukGambar);
    },
    /** Satu halaman subjek sesuai filter: { baris, total, halaman, totalHalaman }. */
    async halaman(filter) {
      const total = await gambarModel.hitung(filter);
      // halaman di luar jangkauan dirapikan ke halaman terakhir oleh hitungPaginasi
      const pg = hitungPaginasi(total, filter.halaman ?? 1, UKURAN_HALAMAN);
      const baris = await gambarModel.halaman(filter, { batas: pg.batas, offset: pg.offset });
      return { baris: baris.map(bentukGambar), total, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
    },
    /** Detail subjek beserta empat berkasnya (outline, berwarna, puzzle, mewarnai) dan ada tidaknya. */
    async detail(id) {
      const g = bentukGambar(await wajibAda(id));
      const outline = await adaOutline(folderGambar, g.kode);
      const berkas = BERKAS_GAMBAR.map((jenis) => {
        // outline tidak punya penanda di tabel; ada tidaknya dicek langsung di disk
        const ada = jenis === 'outline' ? outline : g.punya[jenis];
        return { jenis, ada, url: ada ? urlBerkas(g.kode, jenis) : null };
      });
      return { ...g, berkas };
    },
    /** Admin mengaktifkan/menonaktifkan subjek; subjek nonaktif tidak dipilih untuk tugas baru. */
    async ubahAktif(id, aktif, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await wajibAda(id, conn);
        await gambarModel.ubahAktif(id, aktif, conn);
        const aksi = aktif ? AKSI_LOG.AKTIFKAN_GAMBAR : AKSI_LOG.NONAKTIFKAN_GAMBAR;
        await catatAktivitas({ penggunaId: pelakuId, aksi, entitas: 'gambar', entitasId: id, detail: { kode: lama.kode, sebelum: Boolean(lama.aktif), sesudah: aktif } }, conn);
      });
      return { id };
    },
    /** Admin memindai ulang folder berkas dan memperbarui penanda punya_* yang berubah. */
    async pindaiUlang(pelakuId) {
      const semua = await gambarModel.semua();
      const berubah = [];
      for (const g of semua) {
        const penanda = await penandaBerkasGambar(folderGambar, g.kode);
        // hanya subjek yang penandanya beda dengan database yang ditulis
        if (JENIS_GAMBAR.some((j) => Number(g[`punya_${j}`]) !== penanda[`punya_${j}`])) berubah.push({ id: g.id, kode: g.kode, penanda });
      }
      await db.transaction(async (conn) => {
        for (const b of berubah) await gambarModel.ubahPenanda(b.id, b.penanda, conn);
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.PINDAI_GAMBAR, entitas: 'gambar', detail: { diperiksa: semua.length, berubah: berubah.map((b) => b.kode) } }, conn);
      });
      return { diperiksa: semua.length, diperbarui: berubah.length };
    },
    /** Bank gambar per jenis untuk render template: { mewarnai|berwarna|puzzle: [{ kode, nama }] } (hanya subjek aktif). */
    async tersedia() {
      const baris = await gambarModel.tersedia();
      return Object.fromEntries(JENIS_GAMBAR.map((j) => [j, baris.filter((g) => Number(g[`punya_${j}`]) === 1).map((g) => ({ kode: g.kode, nama: g.nama }))]));
    },
  };
}
