import 'server-only';
import { AppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { buatKode, kodeValid, normalisasiKode } from '@/utils/kodeAkses';
import { hitungPaginasi } from '@/utils/paginasi';
import { formatNilai, formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import { AKSI_LOG, ATURAN_SERTIFIKAT, KUNCI_PENGATURAN, STATUS_SERTIFIKAT, UKURAN_HALAMAN } from '@/enums';

/** Nama savepoint penerbitan otomatis di dalam transaksi finalisasi post test. */
const TITIK_TERBIT = 'sp_terbit_sertifikat';

/** Nama level untuk snapshot dan PDF, mis. "Level 1 - Pemula". */
function namaLevelSnapshot(pt) {
  return `Level ${Number(pt.level_urutan) || pt.level_kode} - ${pt.level_nama}`;
}

/**
 * Usecase sertifikat (Fase E): terbit otomatis saat post test lulus, batalkan, terbitkan ulang, daftar, PDF sesuai
 * permintaan, dan verifikasi publik lewat token acak. Hanya satu sertifikat `terbit` per (siswa, level).
 */
export function buatSertifikatUsecase({ sertifikatModel, pengaturanUsecase, logUsecase, pdfSertifikat, catatAktivitas, idGen, db, logger, urlSiswa }) {
  let peringatanTandaTanganHilang = false; // peringatan berkas tanda tangan hilang ditulis sekali per proses

  /** Alamat halaman verifikasi publik untuk sebuah token (isi QR dan tautan yang disalin). */
  const urlVerifikasi = (token) => `${urlSiswa.replace(/\/+$/, '')}/verifikasi/${token}`;

  /** Baris sertifikat untuk tampilan: angka dirapikan, tautan verifikasi, dan boleh-tidaknya diterbitkan ulang. */
  function bentuk(b) {
    return {
      ...b,
      nilai_total: Number(b.nilai_total),
      url_verifikasi: urlVerifikasi(b.token_verifikasi),
      // terbit ulang dari baris yang masih terbit, atau dari baris dibatalkan bila tidak ada lagi yang terbit
      bisaTerbitUlang: b.status === STATUS_SERTIFIKAT.TERBIT || !b.aktif_id,
    };
  }

  /** Nomor berikutnya DPL-<kode level>-<YYYYMM>-<urut 4 digit>; urut dihitung per level dan bulan. */
  async function nomorBerikutnya(levelKode, conn) {
    const awalan = `${ATURAN_SERTIFIKAT.awalanNomor}-${levelKode}-${await sertifikatModel.bulanIni(conn)}-`;
    const terakhir = await sertifikatModel.nomorTerakhir(awalan, conn);
    const urut = terakhir ? Number(terakhir.slice(awalan.length)) + 1 : 1;
    return `${awalan}${String(urut).padStart(4, '0')}`;
  }

  /** Menyisipkan sertifikat dengan nomor dan token baru; bentrok UNIQUE nomor/token diulang sampai 5 kali. */
  async function sisipkan(data, conn) {
    for (let i = 0; i < ATURAN_SERTIFIKAT.maksUlang; i += 1) {
      const nomor = await nomorBerikutnya(data.levelKode, conn);
      const token = buatKode(ATURAN_SERTIFIKAT.panjangToken);
      try {
        const id = idGen.generate();
        await sertifikatModel.tambah({ ...data, id, nomor, token }, conn);
        return { id, nomor };
      } catch (error) {
        // nomor diambil penerbitan lain di saat yang sama atau token kebetulan sama: coba lagi; galat lain diteruskan
        if (!adalahDuplikat(error, 'uq_sertifikat_nomor') && !adalahDuplikat(error, 'uq_sertifikat_token')) throw error;
      }
    }
    throw new AppError(t('sertifikat.gagalNomor'), 409);
  }

  /** Membuat sertifikat dari post test lulus dengan snapshot data saat ini (nama siswa, level, nilai), lalu mencatat log. */
  async function terbitkanDari(pt, { penggunaId, menggantikanId, aksi }, conn) {
    const data = { siswaId: pt.siswa_id, levelId: pt.level_id, levelKode: pt.level_kode, postTestId: pt.id, namaSiswa: pt.siswa_nama, namaLevel: namaLevelSnapshot(pt), nilaiTotal: Number(pt.nilai_total), diterbitkanOleh: penggunaId, menggantikanId };
    const baru = await sisipkan(data, conn);
    await catatAktivitas({ penggunaId, aksi, entitas: 'sertifikat', entitasId: baru.id, detail: { nomor: baru.nomor, postTestId: pt.id, siswaId: pt.siswa_id, menggantikanId } }, conn);
    return baru;
  }

  /** Isi penerbitan otomatis: hanya untuk post test final yang lulus dan bila belum ada sertifikat terbit. */
  async function terbitOtomatisDalam(postTestId, conn) {
    const pt = await sertifikatModel.postTest(postTestId, conn);
    // belum final atau tidak lulus: tidak ada yang diterbitkan
    if (!pt || pt.nilai_total == null || Number(pt.lulus) !== 1) return null;
    // sudah ada sertifikat terbit untuk (siswa, level): idempoten, finalisasi berulang tidak membuat ganda
    if (await sertifikatModel.aktif(pt.siswa_id, pt.level_id, conn, true)) return null;
    return terbitkanDari(pt, { penggunaId: null, menggantikanId: null, aksi: AKSI_LOG.TERBIT_SERTIFIKAT }, conn);
  }

  /** Mencatat kegagalan penerbitan otomatis (log aplikasi dan log_aktivitas) tanpa melempar error. */
  async function catatGagal(postTestId, error, conn) {
    logger.error(`Penerbitan sertifikat otomatis gagal untuk post test ${postTestId}`, error);
    try {
      await catatAktivitas({ aksi: AKSI_LOG.GAGAL_TERBIT_SERTIFIKAT, entitas: 'post_test', entitasId: postTestId, detail: { kode: error?.code ?? error?.name ?? 'galat' } }, conn);
    } catch (galatLog) {
      // log pun gagal (mis. koneksi bermasalah): cukup di log aplikasi, finalisasi tetap jalan
      logger.error('Gagal mencatat kegagalan penerbitan sertifikat', galatLog);
    }
  }

  /** Logo PDF sebagai Buffer (selalu ada kecuali berkas bawaan hilang); null bila tidak terbaca. */
  async function logoAman() {
    try {
      // Logo sertifikat, lalu Logo utama, lalu logo landscape bawaan (hanya PNG/JPEG yang bisa dibaca pdfkit)
      return (await pengaturanUsecase.logoSertifikat()).buffer;
    } catch {
      // bahkan berkas bawaan tidak terbaca: PDF tetap dibuat tanpa logo
      return null;
    }
  }

  /**
   * Gambar tanda tangan dari pengaturan sebagai Buffer; null bila belum diunggah atau berkasnya hilang dari disk.
   * Berkas yang hilang dicatat ke log sekali per proses; unduhan PDF tidak boleh gagal karena tanda tangan.
   */
  async function tandaTanganAman(p) {
    // belum pernah diunggah: kondisi normal, tanpa peringatan
    if (!p[KUNCI_PENGATURAN.TANDA_TANGAN_PATH]) return null;
    try {
      return (await pengaturanUsecase.bacaTandaTangan()).buffer;
    } catch {
      // pengaturan menunjuk berkas yang sudah tidak ada: PDF tetap dibuat tanpa tanda tangan
      if (!peringatanTandaTanganHilang) {
        peringatanTandaTanganHilang = true;
        logger.warn('Berkas tanda tangan sertifikat tidak ditemukan di disk; PDF dibuat tanpa tanda tangan.');
      }
      return null;
    }
  }

  return {
    /**
     * Dipanggil finalisasi post test (D2.5) di dalam transaksinya (`conn`). Idempoten. Dijalankan di SAVEPOINT agar
     * kegagalan penerbitan TIDAK menggagalkan finalisasi: galat ditangkap, dicatat, dan tampil sebagai peringatan di detail post test.
     */
    async terbitkanOtomatis(postTestId, conn = null) {
      try {
        // dipanggil tanpa transaksi induk: jalankan dalam transaksi sendiri
        return conn ? await db.titikSimpan(conn, TITIK_TERBIT, (c) => terbitOtomatisDalam(postTestId, c)) : await db.transaction((c) => terbitOtomatisDalam(postTestId, c));
      } catch (error) {
        // penerbitan lain untuk (siswa, level) yang sama menang lebih dulu: hasilnya sudah sesuai
        if (adalahDuplikat(error, 'uq_sertifikat_aktif')) return null;
        await catatGagal(postTestId, error, conn);
        return null;
      }
    },
    /** Admin/tutor membatalkan sertifikat terbit dengan alasan; baris tetap tersimpan. */
    async batalkan(id, alasan, penggunaId) {
      await db.transaction(async (conn) => {
        const s = await sertifikatModel.cariId(id, conn);
        if (!s) throw new AppError(t('sertifikat.tidakAda'), 404);
        // hanya yang masih terbit yang bisa dibatalkan (dicek ulang di UPDATE untuk balapan)
        if ((await sertifikatModel.batalkan(id, alasan, penggunaId, conn)).affectedRows === 0) throw new AppError(t('sertifikat.sudahBatal'), 409);
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.BATAL_SERTIFIKAT, entitas: 'sertifikat', entitasId: id, detail: { nomor: s.nomor, alasan } }, conn);
      });
      return { id };
    },
    /**
     * Terbitkan ulang (satu transaksi): butuh post test lulus pada level itu (terbaru). Sertifikat lama yang masih terbit
     * dibatalkan dengan alasan "Diterbitkan ulang", lalu sertifikat baru dibuat dengan nomor/token baru dan snapshot saat ini.
     */
    async terbitkanUlang(siswaId, levelId, penggunaId) {
      try {
        return await db.transaction(async (conn) => {
          const lulus = await sertifikatModel.lulusTerbaru(siswaId, levelId, conn);
          // tidak ada penerbitan tanpa post test lulus
          if (!lulus) throw new AppError(t('sertifikat.belumLulus'), 409);
          const pt = await sertifikatModel.postTest(lulus.id, conn);
          const lama = await sertifikatModel.aktif(siswaId, levelId, conn, true);
          // sertifikat lama harus dibatalkan lebih dulu karena hanya boleh satu yang terbit (UNIQUE aktif_kunci)
          if (lama) await sertifikatModel.batalkan(lama.id, t('sertifikat.alasanTerbitUlang'), penggunaId, conn);
          const menggantikanId = lama?.id ?? (await sertifikatModel.terbaru(siswaId, levelId, conn))?.id ?? null;
          return terbitkanDari(pt, { penggunaId, menggantikanId, aksi: AKSI_LOG.TERBIT_ULANG_SERTIFIKAT }, conn);
        });
      } catch (error) {
        // dua tutor menekan Terbitkan ulang bersamaan: yang kedua ditolak ramah
        if (adalahDuplikat(error, 'uq_sertifikat_aktif')) throw new AppError(t('sertifikat.sedangDiproses'), 409);
        throw error;
      }
    },
    /** Satu halaman daftar sertifikat beserta info paginasi. */
    async daftar(filter) {
      const total = await sertifikatModel.hitung(filter);
      const pg = hitungPaginasi(total, filter.halaman, UKURAN_HALAMAN);
      return { baris: (await sertifikatModel.daftar(filter, pg)).map(bentuk), total, halaman: pg.halaman, totalHalaman: pg.totalHalaman };
    },
    /** Riwayat sertifikat seorang siswa, termasuk yang dibatalkan dan penggantinya. */
    riwayatSiswa: async (siswaId) => (await sertifikatModel.riwayatSiswa(siswaId)).map(bentuk),
    /** True bila siswa punya sertifikat terbit untuk level itu (layar hasil post test siswa). */
    adaTerbit: async (siswaId, levelId) => Boolean(await sertifikatModel.aktif(siswaId, levelId)),
    /**
     * Status sertifikat untuk detail post test: null bila tidak lulus; selain itu terbit (dengan nomor), dibatalkan,
     * gagal (penerbitan otomatis gagal dan belum pernah terbit), atau belum.
     */
    async statusPostTest(pt) {
      if (pt.lulus !== true) return null;
      const aktif = await sertifikatModel.aktif(pt.siswa_id, pt.level_id);
      if (aktif) return { status: 'terbit', id: aktif.id, nomor: aktif.nomor };
      const pernah = (await sertifikatModel.jumlahDariPostTest(pt.id)) > 0;
      // pernah terbit lalu dibatalkan; bila belum pernah, cek catatan kegagalan penerbitan otomatis
      if (pernah) return { status: 'dibatalkan' };
      const gagal = (await logUsecase.detailTerakhir(AKSI_LOG.GAGAL_TERBIT_SERTIFIKAT, 'post_test', pt.id)) != null;
      return { status: gagal ? 'gagal' : 'belum' };
    },
    /**
     * Membuat PDF sesuai permintaan dari snapshot. `siswaIdOrtu` diisi untuk unduhan orang tua: hanya sertifikat terbit
     * milik anaknya; selain itu 404 (sebab penolakan tidak dibedakan). Sertifikat dibatalkan diberi watermark.
     */
    async pdf(id, siswaIdOrtu = null) {
      const s = await sertifikatModel.cariId(id);
      const milikOrtu = s && s.siswa_id === siswaIdOrtu && s.status === STATUS_SERTIFIKAT.TERBIT;
      if (!s || (siswaIdOrtu && !milikOrtu)) throw new AppError(t('sertifikat.tidakAda'), 404);
      const p = await pengaturanUsecase.ambilPengaturan();
      const branding = await pengaturanUsecase.branding();
      const buffer = await pdfSertifikat.buat({
        nomor: s.nomor,
        namaSiswa: s.nama_siswa,
        namaLevel: s.nama_level,
        nilai: formatNilai(s.nilai_total),
        tanggal: formatTanggal(s.diterbitkan_at),
        urlVerifikasi: urlVerifikasi(s.token_verifikasi),
        namaPelatihan: branding.namaPelatihan,
        namaPerusahaan: branding.namaPerusahaan,
        logo: await logoAman(),
        tandaTangan: await tandaTanganAman(p),
        penandatanganNama: p[KUNCI_PENGATURAN.PENANDATANGAN_NAMA],
        penandatanganJabatan: p[KUNCI_PENGATURAN.PENANDATANGAN_JABATAN],
        dibatalkan: s.status === STATUS_SERTIFIKAT.DIBATALKAN,
      });
      return { buffer, namaFile: `sertifikat-${s.nomor}.pdf` };
    },
    /**
     * Verifikasi publik dari token (tanpa beda huruf besar/kecil). Sah: nomor, nama, level, nilai, tanggal, penerbit.
     * Dibatalkan: nomor dan status saja. Token salah/tidak ada: tidak ditemukan. Tanpa data lain.
     */
    async verifikasi(token) {
      const kode = normalisasiKode(token);
      // format token salah: langsung tidak ditemukan tanpa bertanya ke database
      const s = kodeValid(kode, ATURAN_SERTIFIKAT.panjangToken) ? await sertifikatModel.cariToken(kode) : null;
      if (!s) return { status: 'tidakDitemukan' };
      if (s.status === STATUS_SERTIFIKAT.DIBATALKAN) return { status: 'dibatalkan', nomor: s.nomor };
      const { namaPelatihan, namaPerusahaan } = await pengaturanUsecase.branding();
      return { status: 'sah', nomor: s.nomor, namaSiswa: s.nama_siswa, namaLevel: s.nama_level, nilaiTotal: Number(s.nilai_total), diterbitkanAt: s.diterbitkan_at, penerbit: [namaPelatihan, namaPerusahaan].filter(Boolean).join(' · ') };
    },
  };
}
