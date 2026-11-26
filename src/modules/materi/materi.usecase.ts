import 'server-only';
import { AppError } from '@/utils/appError';
import { uraiJson, teksJson } from '@/utils/json';
import { t } from '@/utils/i18n';
import { AKSI_LOG, JUMLAH_PERTEMUAN_MATERI } from '@/enums';

/** Mengelompokkan baris (sudah terurut level lalu nomor) per level; `bentukItem` mengubah satu baris menjadi item materi. */
function kelompokkanPerLevel(baris, bentukItem) {
  const kelompok = new Map();
  for (const b of baris) {
    // level baru muncul: buat kelompoknya (urutan Map mengikuti urutan baris dari query)
    if (!kelompok.has(b.level_id)) kelompok.set(b.level_id, { levelId: b.level_id, levelKode: b.level_kode, levelNama: b.level_nama, materi: [] });
    kelompok.get(b.level_id).materi.push(bentukItem(b));
  }
  return [...kelompok.values()];
}

/**
 * Usecase materi: kunci tugas sampai siswa menekan "Saya sudah paham", pustaka materi yang sudah dilalui siswa
 * (semua level), serta daftar, pratinjau, dan penyimpanan materi oleh pengelola.
 */
export function buatMateriUsecase({ materiModel, sesiModel, db, idGen, catatAktivitas }) {
  /** Status materi satu pertemuan bagi seorang siswa: { ada, dibaca, terkunci }. */
  async function statusMateri(siswaId, pertemuanId, conn = null) {
    const b = await materiModel.statusPertemuan(siswaId, pertemuanId, conn);
    // pertemuan post test atau materi yang belum diisi: tidak ada yang bisa mengunci tugas (siswa tidak boleh terblokir)
    const ada = Boolean(b?.materi_id) && Number(b.nomor) <= JUMLAH_PERTEMUAN_MATERI;
    const dibaca = Number(b?.jumlah_baca ?? 0) > 0;
    return { ada, dibaca, terkunci: ada && !dibaca };
  }
  return {
    statusMateri,
    /** Apakah tugas pertemuan ini terbuka bagi siswa: materinya belum ada, atau sudah ditandai paham. */
    async tugasTerbuka(siswaId, pertemuanId, conn = null) {
      return !(await statusMateri(siswaId, pertemuanId, conn)).terkunci;
    },
    /** Pustaka materi siswa: hanya pertemuan yang sudah dilalui, dikelompokkan per level dan berurutan; tanpa isi. */
    async daftarSiswa(siswaId) {
      const baris = await materiModel.daftarDilalui(siswaId);
      return kelompokkanPerLevel(baris, (b) => ({ pertemuanId: b.pertemuan_id, nomor: Number(b.nomor), judul: b.judul, sudahPaham: Boolean(b.dibaca_at) }));
    },
    /**
     * Satu materi untuk halaman siswa. Pertemuan yang belum dilalui, tidak punya materi, atau nonaktif dijawab 404
     * yang sama (tidak membocorkan keberadaannya). `bisaPaham` hanya benar untuk pertemuan sesi yang sedang berlangsung.
     */
    async untukSiswa(siswaId, pertemuanId) {
      const [b, sesi] = await Promise.all([materiModel.cariDilalui(siswaId, pertemuanId), sesiModel.berlangsungSiswa(siswaId)]);
      if (!b) throw new AppError(t('materi.tidakAda'), 404);
      const sudahPaham = Boolean(b.dibaca_at);
      const pertemuanSesi = sesi?.pertemuan_id === pertemuanId;
      return {
        pertemuanId: b.pertemuan_id,
        nomor: Number(b.nomor),
        judul: b.judul,
        levelKode: b.level_kode,
        levelNama: b.level_nama,
        isi: uraiJson(b.isi),
        sudahPaham,
        // tombol "Saya sudah paham" hanya untuk materi pertemuan sesi ini yang belum ditandai
        bisaPaham: pertemuanSesi && !sudahPaham,
        pertemuanSesi,
        adaSesi: Boolean(sesi),
      };
    },
    /**
     * Siswa menekan "Saya sudah paham": hanya untuk pertemuan sesi yang sedang berlangsung dan yang punya materi.
     * Idempoten: penekanan ulang tidak mengubah apa pun.
     */
    async tandaiPaham(siswaId, pertemuanId) {
      const sesi = await sesiModel.berlangsungSiswa(siswaId);
      // belum diabsen: tombol seharusnya tidak tampil
      if (!sesi) throw new AppError(t('materi.butuhSesi'), 409);
      // materi lama atau pertemuan lain tidak mengunci apa pun
      if (sesi.pertemuan_id !== pertemuanId) throw new AppError(t('materi.bukanPertemuanSesi'), 409);
      if (!(await statusMateri(siswaId, pertemuanId)).ada) throw new AppError(t('materi.tidakAda'), 404);
      await materiModel.simpanBaca({ id: idGen.generate(), siswaId, pertemuanId });
      return { pertemuanId };
    },
    /** Daftar 36 materi (pertemuan 1-12 semua level) untuk pengelola, per level, termasuk yang belum diisi. */
    async daftarPengelola() {
      const baris = await materiModel.daftarPengelola();
      return kelompokkanPerLevel(baris, (b) => ({
        pertemuanId: b.pertemuan_id,
        nomor: Number(b.nomor),
        pertemuanJudul: b.pertemuan_judul,
        ada: Boolean(b.materi_id),
        judul: b.judul ?? null,
        aktif: b.materi_id ? Boolean(b.aktif) : false,
        updatedAt: b.updated_at ?? null,
      }));
    },
    /** Materi satu pertemuan untuk pratinjau dan editor pengelola; pertemuan post test dan ID tak dikenal dijawab 404. */
    async detailPengelola(pertemuanId) {
      const b = await materiModel.cariPengelola(pertemuanId);
      if (!b || Number(b.nomor) > JUMLAH_PERTEMUAN_MATERI) throw new AppError(t('materi.tidakAda'), 404);
      return {
        pertemuanId: b.pertemuan_id,
        nomor: Number(b.nomor),
        pertemuanJudul: b.pertemuan_judul,
        levelKode: b.level_kode,
        levelNama: b.level_nama,
        ada: Boolean(b.materi_id),
        // materi belum ada: editor dimulai dari judul pertemuan
        judul: b.judul ?? b.pertemuan_judul,
        aktif: b.materi_id ? Boolean(b.aktif) : true,
        isi: uraiJson(b.isi),
      };
    },
    /** Admin menyimpan materi (membuat atau menimpa); isi sudah lolos validasi schema. Tanpa perubahan tidak menulis dan tidak mencatat log. */
    async simpan({ pertemuanId, judul, isi, aktif }, pelakuId) {
      const lama = await materiModel.cariPengelola(pertemuanId);
      // pertemuan post test tidak punya materi
      if (!lama) throw new AppError(t('materi.tidakAda'), 404);
      if (Number(lama.nomor) > JUMLAH_PERTEMUAN_MATERI) throw new AppError(t('materi.pertemuanTanpaMateri'), 400, [{ kolom: 'pertemuanId', pesan: t('materi.pertemuanTanpaMateri') }]);
      const id = lama.materi_id ?? idGen.generate();
      const tidakBerubah = lama.materi_id && lama.judul === judul && Boolean(lama.aktif) === aktif && JSON.stringify(uraiJson(lama.isi)) === JSON.stringify(isi);
      // isi sama persis dengan yang tersimpan: tidak perlu menulis maupun mencatat
      if (tidakBerubah) return { pertemuanId };
      await db.transaction(async (conn) => {
        await materiModel.simpan({ id, pertemuanId, judul, isi: teksJson(isi), aktif }, conn);
        const detail = { level: lama.level_kode, pertemuan: Number(lama.nomor), judul, aktif, baru: !lama.materi_id };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.UBAH_MATERI, entitas: 'materi', entitasId: id, detail }, conn);
      });
      return { pertemuanId };
    },
    /** Status baca seorang siswa untuk detail siswa: { [pertemuanId]: waktu dibaca atau null }; pertemuan tanpa materi tidak ada di peta. */
    async statusBacaSiswa(siswaId) {
      const baris = await materiModel.statusBacaSiswa(siswaId);
      return Object.fromEntries(baris.map((b) => [b.pertemuan_id, b.dibaca_at ?? null]));
    },
  };
}
