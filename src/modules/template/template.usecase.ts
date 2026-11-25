import 'server-only';
import { AppError, adalahAppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { uraiJson, teksJson } from '@/utils/json';
import { hitungPaginasi } from '@/utils/paginasi';
import { jawabanHarapan, renderTemplate } from '@/utils/templateRender';
import { validasiTemplate } from '@/utils/templateValidasi';
import { t } from '@/utils/i18n';
import { AKSI_LOG, NOMOR_POST_TEST, UKURAN_HALAMAN } from '@/enums';

/** Jumlah contoh render pada pratinjau. */
const JUMLAH_CONTOH = 5;
/** Kolom isi template yang dibandingkan untuk log perubahan. */
const KOLOM_ISI = ['penilaian', 'kesulitan', 'teks', 'parameter', 'opsi', 'kunci', 'aktif'];

/** Mengubah baris database ke bentuk tampilan: kolom JSON diurai, angka/boolean dirapikan. */
function bentukTemplate(b) {
  return {
    ...b,
    kesulitan: Number(b.kesulitan),
    aktif: Boolean(b.aktif),
    pertemuan_nomor: Number(b.pertemuan_nomor),
    parameter: uraiJson(b.parameter),
    opsi: uraiJson(b.opsi),
    kunci: uraiJson(b.kunci),
  };
}

/** Pasangan sebelum/sesudah untuk kolom yang berubah (dibandingkan sebagai JSON). */
function perubahan(lama, baru) {
  const hasil = {};
  for (const k of KOLOM_ISI) if (JSON.stringify(lama[k] ?? null) !== JSON.stringify(baru[k] ?? null)) hasil[k] = { sebelum: lama[k] ?? null, sesudah: baru[k] ?? null };
  return hasil;
}

/** Usecase template: daftar, detail, pratinjau render, serta tambah/ubah yang hanya tersimpan bila lolos validasiTemplate. */
export function buatTemplateUsecase({ templateModel, levelUsecase, levelModel, gambarUsecase, db, idGen, acak, catatAktivitas }) {
  /** Mengambil template (bentuk tampilan) atau melempar 404. */
  async function wajibAda(id, conn = null) {
    const b = await templateModel.cariId(id, conn);
    if (!b) throw new AppError(t('template.tidakAda'), 404);
    return bentukTemplate(b);
  }
  /** Menolak dengan daftar galat bila template tidak lolos validasi (render 50 kali). */
  async function pastikanValid(tpl) {
    const galat = validasiTemplate(tpl, await gambarUsecase.tersedia(), acak);
    // detail berisi semua galat agar admin bisa memperbaiki sekaligus
    if (galat.length > 0) throw new AppError(t('template.tidakValid'), 400, galat.map((pesan) => ({ kolom: 'template', pesan })));
  }
  /** Memastikan pertemuan ada dan bagian sesuai aturan: wajib di pertemuan 13 (level yang sama), kosong di pertemuan lain. */
  async function pastikanRujukan(pertemuanId, bagianId) {
    const pertemuan = await levelModel.cariPertemuan(pertemuanId);
    if (!pertemuan) throw new AppError(t('level.pertemuanTidakAda'), 400, [{ kolom: 'pertemuanId', pesan: t('level.pertemuanTidakAda') }]);
    const postTest = Number(pertemuan.nomor) === NOMOR_POST_TEST;
    // latihan pertemuan 1-12 tidak boleh menunjuk bagian post test
    if (!postTest) return null;
    const bagian = bagianId ? await levelModel.cariBagian(bagianId) : null;
    // soal post test wajib punya bagian dari level yang sama
    if (!bagian || bagian.level_id !== pertemuan.level_id) throw new AppError(t('template.bagianWajib'), 400, [{ kolom: 'bagianId', pesan: t('template.bagianWajib') }]);
    return bagian.id;
  }
  /** Satu contoh render untuk pratinjau; galat render (mis. bank gambar kosong) dikembalikan sebagai pesan. */
  function contoh(tpl, gambarTersedia) {
    try {
      const r = renderTemplate(tpl, { acak, gambarTersedia });
      const benar = Number(tpl.kunci?.benar);
      return { teks: r.teks, opsi: r.opsi?.map((o) => ({ teks: o.teks, benar: o.indeksAsli === benar })) ?? null, gambar: r.gambar, kunci: r.kunci, jawaban: jawabanHarapan(tpl, r) };
    } catch (error) {
      // galat yang kita kenal ditampilkan di kartu contoh; galat lain diteruskan
      if (!adalahAppError(error)) throw error;
      return { galat: error.message };
    }
  }
  return {
    /** Satu halaman daftar template beserta info paginasi. */
    async daftar(filter) {
      const total = await templateModel.hitung(filter);
      const pg = hitungPaginasi(total, filter.halaman, UKURAN_HALAMAN);
      const baris = (await templateModel.daftar(filter, pg)).map((b) => ({ ...b, aktif: Boolean(b.aktif), pertemuan_nomor: Number(b.pertemuan_nomor) }));
      return { baris, total, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
    },
    /** Detail satu template. */
    detail: (id) => wajibAda(id),
    /** Template latihan aktif sebuah pertemuan (kolom JSON sudah diurai), bahan generate tugas. */
    async aktifLatihan(pertemuanId, conn = null) {
      return (await templateModel.aktifLatihan(pertemuanId, conn)).map((b) => ({
        ...b,
        kesulitan: Number(b.kesulitan),
        parameter: uraiJson(b.parameter),
        opsi: uraiJson(b.opsi),
        kunci: uraiJson(b.kunci),
      }));
    },
    /** Pilihan level, pertemuan, dan bagian untuk filter dan form. */
    pilihan: () => levelUsecase.pilihan(),
    /** Lima contoh render beserta jawaban/kunci yang diharapkan (hanya untuk pengelola). */
    async pratinjau(id) {
      const [tpl, gambarTersedia] = await Promise.all([wajibAda(id), gambarUsecase.tersedia()]);
      return Array.from({ length: JUMLAH_CONTOH }, () => contoh(tpl, gambarTersedia));
    },
    /** Admin membuat template baru; disimpan hanya bila lolos validasi. */
    async tambah(data, pelakuId) {
      const bagianId = await pastikanRujukan(data.pertemuanId, data.bagianId);
      await pastikanValid(data);
      const id = idGen.generate();
      const baris = { ...data, id, bagianId, parameter: teksJson(data.parameter), opsi: teksJson(data.opsi), kunci: teksJson(data.kunci) };
      try {
        await db.transaction(async (conn) => {
          await templateModel.tambah(baris, conn);
          await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.TAMBAH_TEMPLATE, entitas: 'template', entitasId: id, detail: { kode: data.kode } }, conn);
        });
      } catch (error) {
        // kode template sudah dipakai template lain
        if (adalahDuplikat(error, 'uq_template_kode')) throw new AppError(t('template.kodeDipakai'), 409, [{ kolom: 'kode', pesan: t('template.kodeDipakai') }]);
        throw error;
      }
      return { id };
    },
    /** Admin mengubah isi template (tipe tetap); disimpan hanya bila lolos validasi. Perubahan dicatat sebelum/sesudah. */
    async ubah(id, data, pelakuId) {
      const lama = await wajibAda(id);
      await pastikanValid({ ...data, tipe: lama.tipe });
      const ubahan = perubahan(lama, data);
      // tidak ada yang berubah: tidak perlu menulis maupun mencatat log
      if (Object.keys(ubahan).length === 0) return { id };
      await db.transaction(async (conn) => {
        await templateModel.ubah(id, { ...data, parameter: teksJson(data.parameter), opsi: teksJson(data.opsi), kunci: teksJson(data.kunci) }, conn);
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.UBAH_TEMPLATE, entitas: 'template', entitasId: id, detail: { kode: lama.kode, ...ubahan } }, conn);
      });
      return { id };
    },
  };
}
