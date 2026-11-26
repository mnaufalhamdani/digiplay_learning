import 'server-only';
import { AppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { uraiJson, teksJson } from '@/utils/json';
import { deteksiTipeGambar } from '@/utils/tipeBerkas';
import { tokenAcak } from '@/utils/kripto';
import { t } from '@/utils/i18n';
import { BATAS_STUDIO, JENIS_SPRITE, cabutKostum } from '@/modules/shared/blockly/pustakaStudio';
import { TINGKAT_BAWAAN, blokTersedia, periksaProyek } from '@/modules/shared/blockly/daftarBlokStudio';

/** Ekstensi simpan kostum unggahan per tipe MIME (hanya PNG dan JPEG). */
const EKSTENSI_KOSTUM = { 'image/png': 'png', 'image/jpeg': 'jpg' };

/** Baris proyek dari database menjadi objek siap pakai (kolom isi diurai bila ada). */
function bentukProyek(b) {
  return { id: b.id, nama: b.nama, tingkat: b.tingkat, diubahPada: b.diubah_pada, ...(b.isi === undefined ? {} : { isi: uraiJson(b.isi) }) };
}

/** Semua ID kostum unggahan yang dirujuk sprite-sprite sebuah proyek (tanpa duplikat). */
function rujukanKostum(isi) {
  return [...new Set(isi.sprite.flatMap((s) => (s.jenis === JENIS_SPRITE.TEKS ? [] : (s.kostumUnggahan ?? []))))];
}

/**
 * Usecase Studio Zippy: pustaka sprite, proyek milik siswa (simpan, buka, hapus), kostum unggahan, dan pengiriman proyek
 * ke tugas atau butir post test sebagai salinan beku. Seperti tipe latihan lain, mengubah data hanya boleh saat sesi
 * berlangsung; di luar sesi siswa hanya bereksperimen di browser. Aturan tiap tugas/butir (materi, status, waktu tes)
 * dijaga pemiliknya (tugasUsecase dan posttestUsecase), bukan di sini.
 */
export function buatStudioUsecase({ studioModel, sesiModel, siswaModel, gambarModel, tugasUsecase, posttestUsecase, penyimpananFile, idGen, db, logger }) {
  /** Sesi berlangsung siswa atau 403. */
  async function wajibSesi(siswaId) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId);
    if (!sesi) throw new AppError(t('studio.butuhSesi'), 403);
    return sesi;
  }
  /** Subjek gambar yang boleh jadi sprite: aktif dan punya berwarna.png (kostum 1); outline.png ikut tersedia. */
  async function subjekSprite() {
    return (await gambarModel.daftar({})).filter((g) => Number(g.aktif) === 1 && Number(g.punya_berwarna) === 1);
  }
  /** Proyek milik siswa atau 404 (proyek siswa lain diperlakukan sama dengan tidak ada). */
  async function wajibProyek(id, siswaId, conn = null) {
    const baris = await studioModel.cariMilik(id, siswaId, conn);
    if (!baris) throw new AppError(t('studio.proyekTidakAda'), 404);
    return baris;
  }
  /** Tingkat proyek yang boleh dibuat siswa: l2 untuk semua, l3 hanya bagi siswa yang level berjalannya Level 3 atau lebih. */
  async function tingkatBoleh(siswaId) {
    const siswa = await siswaModel.cariId(siswaId);
    const urutan = Number(String(siswa?.level_kode ?? '').replace(/\D/g, '')) || 0;
    return urutan >= 3 ? ['l3', 'l2'] : ['l2'];
  }
  /** Kostum unggahan milik siswa atau 404. */
  async function wajibKostum(id, siswaId, conn = null) {
    const k = await studioModel.cariKostum(id, conn);
    if (!k || k.siswa_id !== siswaId) throw new AppError(t('studio.kostumTidakAda'), 404);
    return k;
  }
  return {
    /** Pustaka sprite untuk dialog pilih sprite: subjek gambar (kode, nama, kategori); Zippy ditambahkan tampilan. */
    async pustaka() {
      return (await subjekSprite()).map((g) => ({ kode: g.kode, nama: g.nama, kategori: g.kategori }));
    },
    /** Tingkat proyek yang boleh dipakai siswa (urutan pertama = bawaan untuk proyek baru dari tugas atau post test). */
    async konteksTingkat(siswaId) {
      const boleh = await tingkatBoleh(siswaId);
      return { tingkatBoleh: boleh, tingkatBawaan: boleh[0] };
    },
    /** Daftar proyek siswa (tanpa isi). */
    async daftar(siswaId) {
      return (await studioModel.daftar(siswaId)).map(bentukProyek);
    },
    /** Satu proyek milik siswa beserta isinya. */
    async buka(siswaId, id) {
      return bentukProyek(await wajibProyek(id, siswaId));
    },
    /**
     * Menyimpan proyek: tanpa `id` membuat proyek baru (nama unik per siswa, maksimal jumlah proyek, `tingkat` sesuai level
     * siswa), dengan `id` memperbarui isinya (tingkat tetap). Blok harus tersedia pada tingkat proyek, subjek sprite harus
     * ada di bank gambar, dan kostum unggahan harus milik siswa itu. Hasil: { id, nama, tingkat }.
     */
    async simpan(siswaId, { id, nama, isi, tingkat = TINGKAT_BAWAAN }) {
      await wajibSesi(siswaId);
      const lama = id ? await wajibProyek(id, siswaId) : null;
      const tingkatProyek = lama ? lama.tingkat : tingkat;
      // proyek baru tingkat 3 hanya untuk siswa yang levelnya membukanya; proyek lama tidak berubah tingkat
      if (!lama && !(await tingkatBoleh(siswaId)).includes(tingkatProyek)) throw new AppError(t('studio.tingkatTerkunci'), 403);
      const subjek = new Set((await subjekSprite()).map((g) => g.kode));
      // subjek yang tidak ada di bank gambar (atau sudah dinonaktifkan) ditolak dengan pesan jelas
      const galat = periksaProyek(isi, { tersedia: blokTersedia(tingkatProyek), subjek });
      if (galat.length > 0) throw new AppError(galat[0].pesan, 400);
      // rujukan kostum unggahan harus milik siswa ini (bukan milik siswa lain atau sudah dihapus)
      const rujukan = rujukanKostum(isi);
      if (rujukan.length > 0 && (await studioModel.kostumMilik(rujukan, siswaId)).length !== rujukan.length) throw new AppError(t('studio.kostumTidakAda'), 400);
      const teks = teksJson(isi);
      if (lama) {
        await studioModel.ubahIsi(id, siswaId, teks);
        return { id, nama: lama.nama, tingkat: lama.tingkat };
      }
      // batas jumlah proyek agar tabel tidak membengkak
      if ((await studioModel.jumlah(siswaId)) >= BATAS_STUDIO.maksProyek) throw new AppError(t('studio.proyekTerlaluBanyak', { maks: BATAS_STUDIO.maksProyek }), 409);
      const baru = idGen.generate();
      try {
        await studioModel.tambah({ id: baru, siswaId, nama, tingkat: tingkatProyek, isi: teks });
      } catch (error) {
        // nama yang sama sudah dipakai proyek lain milik siswa ini
        if (adalahDuplikat(error, 'uq_proyek_coding_nama')) throw new AppError(t('studio.namaSudahAda'), 409);
        throw error;
      }
      return { id: baru, nama, tingkat: tingkatProyek };
    },
    /** Menghapus proyek milik siswa (kiriman ke tugas yang sudah terkirim tetap utuh karena berupa salinan). */
    async hapus(siswaId, id) {
      await wajibSesi(siswaId);
      if ((await studioModel.hapus(id, siswaId)) === 0) throw new AppError(t('studio.proyekTidakAda'), 404);
      return { id };
    },
    /**
     * Mengirim proyek ke tugas latihan (`jenis` tugas) atau butir post test (`butir`) sebagai salinan beku. Pemilik
     * tugas/butir memeriksa aturannya (milik siswa, sesi/tes berjalan, materi, belum dinilai) dan mencatat bahwa proyek
     * sudah dikirim; kirim ulang menimpa salinan lama. Salinan memuat rujukan kostum unggahan, yang sejak itu terkunci
     * (tidak bisa dihapus siswa). Semuanya dalam satu transaksi. Hasil: { nama }.
     */
    async kirim(siswaId, { proyekId, tugasId, jenis }) {
      await wajibSesi(siswaId);
      return db.transaction(async (conn) => {
        const proyek = await wajibProyek(proyekId, siswaId, conn);
        if (jenis === 'butir') await posttestUsecase.terimaProyek(siswaId, tugasId, proyek.nama, conn);
        else await tugasUsecase.terimaProyek(siswaId, tugasId, proyek.nama, conn);
        await studioModel.simpanKiriman({ id: idGen.generate(), tugasId, nama: proyek.nama, tingkat: proyek.tingkat, isi: typeof proyek.isi === 'string' ? proyek.isi : teksJson(proyek.isi) }, conn);
        return { nama: proyek.nama };
      });
    },
    /** Salinan proyek sebuah tugas/butir beserta isinya (tutor/admin); null bila siswa belum mengirim. */
    async kiriman(tugasId) {
      const baris = await studioModel.kiriman(tugasId);
      if (!baris) return null;
      return { nama: baris.nama, tingkat: baris.tingkat, dikirimPada: baris.dikirim_pada, isi: uraiJson(baris.isi) };
    },
    /** Ringkasan kiriman (tanpa isi) milik siswa itu untuk kartu tugasnya; null bila belum mengirim. */
    async ringkasanKiriman(siswaId, tugasId) {
      const baris = await studioModel.kirimanMilik(tugasId, siswaId);
      return baris ? { nama: baris.nama, dikirimPada: baris.dikirim_pada } : null;
    },
    /**
     * Menyimpan kostum unggahan (gambar dari Paint yang sudah diperkecil dan diubah menjadi PNG di browser) saat sesi
     * berlangsung. Isi berkas diperiksa dari byte awal (hanya PNG atau JPEG), ukuran dan jumlah per siswa dibatasi.
     * Proyek hanya menyimpan rujukan ID-nya. Hasil: { id }.
     */
    async unggahKostum(siswaId, buffer) {
      await wajibSesi(siswaId);
      // ukuran dicek ulang di sini walau controller sudah memeriksa, karena ini aturan bisnis
      if (buffer.length > BATAS_STUDIO.maksUkuranKostum) throw new AppError(t('studio.kostumBesar', { maks: BATAS_STUDIO.maksUkuranKostum / 1024 }), 400);
      const ext = EKSTENSI_KOSTUM[deteksiTipeGambar(buffer)];
      // SVG, WebP, berkas palsu berekstensi gambar, dan format lain ditolak
      if (!ext) throw new AppError(t('studio.kostumTipe'), 400);
      if ((await studioModel.jumlahKostum(siswaId)) >= BATAS_STUDIO.maksKostumPerSiswa) throw new AppError(t('studio.kostumTerlaluBanyak', { maks: BATAS_STUDIO.maksKostumPerSiswa }), 409);
      const berkasPath = `kostum/${siswaId}/${tokenAcak()}.${ext}`;
      await penyimpananFile.simpanDi(berkasPath, buffer);
      const id = idGen.generate();
      try {
        await studioModel.tambahKostum({ id, siswaId, berkasPath, ukuran: buffer.length });
      } catch (error) {
        // penyimpanan database gagal: buang berkas yang terlanjur ditulis agar tidak menjadi sampah
        await penyimpananFile.hapus(berkasPath);
        throw error;
      }
      return { id };
    },
    /**
     * Siswa menghapus kostum unggahannya saat sesi berlangsung. Ditolak bila sudah dirujuk sebuah kiriman beku (supaya
     * tutor tetap melihat proyek yang sama). Rujukan di proyek tersimpan milik siswa itu dicabut dulu, lalu baris dan berkasnya dihapus.
     */
    async hapusKostum(siswaId, id) {
      await wajibSesi(siswaId);
      const kostum = await db.transaction(async (conn) => {
        const k = await wajibKostum(id, siswaId, conn);
        if ((await studioModel.jumlahKirimanMerujuk(id, conn)) > 0) throw new AppError(t('studio.kostumTerkirim'), 409);
        for (const p of await studioModel.proyekMerujuk(id, siswaId, conn)) await studioModel.ubahIsi(p.id, siswaId, teksJson(cabutKostum(uraiJson(p.isi), id)), conn);
        await studioModel.hapusKostum(id, siswaId, conn);
        return k;
      });
      // berkas dihapus setelah baris terhapus, agar tidak ada rujukan ke berkas yang hilang
      await penyimpananFile.hapus(kostum.berkas_path);
      return { id };
    },
    /**
     * Berkas gambar kostum: pengelola boleh semua; siswa dan orang tua hanya milik siswa itu. Selain itu 404, sehingga
     * keberadaan kostum siswa lain tidak bocor.
     */
    async berkasKostum(id, sesi) {
      const k = await studioModel.cariKostum(id);
      const boleh = k && (sesi.peran || k.siswa_id === sesi.siswaId);
      if (!boleh) throw new AppError(t('studio.kostumTidakAda'), 404);
      let buffer;
      try {
        buffer = await penyimpananFile.baca(k.berkas_path);
      } catch {
        // berkas hilang dari disk walau barisnya masih ada
        throw new AppError(t('studio.kostumTidakAda'), 404);
      }
      return { buffer, tipe: deteksiTipeGambar(buffer) ?? 'application/octet-stream' };
    },
    /** Path berkas kostum seorang siswa; dibaca di dalam transaksi hapus siswa sebelum barisnya terhapus CASCADE. */
    berkasKostumSiswa: (siswaId, conn) => studioModel.berkasKostumSiswa(siswaId, conn),
    /** Menghapus berkas kostum dari disk setelah siswa terhapus (kegagalan per berkas dicatat saja), lalu folder `kostum/<siswaId>` bila kosong. */
    async hapusBerkasKostumSiswa(siswaId, daftarPath) {
      for (const p of daftarPath) {
        try {
          await penyimpananFile.hapus(p);
        } catch (error) {
          // berkas terkunci/izin ditolak: lanjutkan berkas lain, catat agar bisa dibersihkan manual
          logger.error(`Gagal menghapus berkas kostum ${p}`, error);
        }
      }
      await penyimpananFile.hapusFolderKosong(`kostum/${siswaId}`);
    },
  };
}
