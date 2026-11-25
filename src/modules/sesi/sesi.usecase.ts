import 'server-only';
import { AppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { karakterTerlarang, normalisasiKode } from '@/utils/kodeAkses';
import { formatTanggal } from '@/utils/format';
import { t } from '@/utils/i18n';
import {
  AKSI_LOG,
  ALASAN_BERAKHIR,
  JENIS_KODE,
  JUMLAH_PERTEMUAN_MATERI,
  KUNCI_PENGATURAN,
  NOMOR_POST_TEST,
  STATUS_SESI,
  STATUS_SISWA,
} from '@/enums';

/** Baris sesi untuk tampilan: angka dan boolean dirapikan, penuntasan akhir beserta sumbernya. */
function bentukSesi(b) {
  const akhir = b.penuntasan_tutor ?? b.penuntasan_otomatis ?? null;
  return {
    ...b,
    pertemuan_nomor: Number(b.pertemuan_nomor),
    lama_detik: Number(b.lama_detik),
    tugas_total: Number(b.tugas_total),
    tugas_selesai: Number(b.tugas_selesai),
    login_aktif: Boolean(Number(b.login_aktif)),
    penuntasan_akhir: akhir,
    // sumber status akhir: pilihan tutor menang bila ada (COALESCE)
    penuntasan_sumber: b.penuntasan_tutor ? 'tutor' : akhir ? 'otomatis' : null,
  };
}

/** Menempelkan daftar tutor (dan catatannya) ke tiap sesi. */
function gabungTutor(daftarSesi, tutor) {
  return daftarSesi.map((s) => ({ ...s, tutor: tutor.filter((x) => x.sesi_id === s.id).map((x) => ({ id: x.pengguna_id, nama: x.nama, catatan: x.catatan, updated_at: x.updated_at })) }));
}

/**
 * Usecase sesi: absen masuk (C1), penutupan sesi oleh siswa (Pulang) atau tutor (C5), catatan dan penuntasan
 * oleh tutor (C4), daftar sesi berlangsung (C3), beranda siswa (C6), dan riwayat kehadiran (C9).
 */
export function buatSesiUsecase({ sesiModel, tugasUsecase, pembayaranUsecase, authModel, authUsecase, siswaModel, penggunaModel, pengaturanUsecase, logUsecase, db, idGen, catatAktivitas }) {
  /** Mengambil sesi (bentuk tampilan) atau melempar 404. */
  async function wajibSesi(id, conn = null) {
    const b = await sesiModel.cariId(id, conn);
    if (!b) throw new AppError(t('sesi.tidakAda'), 404);
    return bentukSesi(b);
  }
  /** Siswa aktif beserta level berjalan dari kode siswa yang diinput tutor; kode orang tua ditolak dengan pesan khusus. */
  async function siswaDariKode(masukan, conn = null) {
    const kode = normalisasiKode(masukan);
    const terlarang = karakterTerlarang(kode);
    // karakter di luar alfabet (O, I, 0, 1, simbol) ditolak dengan menyebut karakternya
    if (terlarang.length > 0) throw new AppError(t('auth.kodeKarakterTerlarang', { karakter: terlarang.join(', ') }), 400);
    const panjang = await pengaturanUsecase.angka(KUNCI_PENGATURAN.PANJANG_KODE_AKSES);
    if (kode.length !== panjang) throw new AppError(t('auth.kodePanjang', { panjang }), 400);
    const data = await authModel.cariKodeAktif(kode);
    if (!data) throw new AppError(t('sesi.kodeTidakDikenal'), 404);
    // kode orang tua hanya untuk melihat rapor, bukan untuk absen
    if (data.jenis === JENIS_KODE.ORTU) throw new AppError(t('sesi.kodeOrtu'), 400);
    if (data.status !== STATUS_SISWA.AKTIF) throw new AppError(t('sesi.siswaNonaktif'), 403);
    const siswa = await siswaModel.cariId(data.siswa_id, conn);
    // siswa harus sedang menjalani sebuah level agar pertemuannya jelas
    if (!siswa?.siswa_level_id) throw new AppError(t('sesi.tanpaLevel'), 409);
    return siswa;
  }
  /** Daftar pertemuan level siswa beserta tanda sudah pernah hadir, dan pertemuan bawaan (nomor terkecil yang belum ada sesinya). */
  async function pertemuanSiswa(siswa, conn = null) {
    const daftar = (await sesiModel.pertemuanLevel(siswa.level_id, siswa.siswa_level_id, conn)).map((p) => ({ id: p.id, nomor: Number(p.nomor), judul: p.judul, jenis: p.jenis, hadir: Number(p.jumlah_sesi) > 0 }));
    // semua pertemuan sudah pernah dihadiri: bawaan pertemuan terakhir (post test)
    const bawaan = daftar.find((p) => !p.hadir) ?? daftar[daftar.length - 1];
    return { daftar, bawaanId: bawaan?.id ?? null };
  }
  /** Kehadiran pertemuan 1-12 pada level berjalan dan apakah syarat post test terpenuhi. */
  async function kehadiran(siswaLevelId, conn = null) {
    const [hadir, butuh, pengecualian] = await Promise.all([
      sesiModel.hitungHadir(siswaLevelId, JUMLAH_PERTEMUAN_MATERI, conn),
      pengaturanUsecase.angka(KUNCI_PENGATURAN.KEHADIRAN_MIN_POST_TEST),
      sesiModel.pengecualian(siswaLevelId, conn),
    ]);
    return { hadir, dari: JUMLAH_PERTEMUAN_MATERI, butuh, pengecualian, memenuhi: pengecualian || hadir >= butuh };
  }
  /** Menolak absen bila siswa masih punya sesi berlangsung (termasuk dari hari lain); detail membawa ID sesi untuk tombol Tutup sesi itu. */
  async function tolakBilaBerlangsung(siswaId, conn) {
    const lama = await sesiModel.berlangsungSiswa(siswaId, conn);
    if (lama) throw new AppError(t('sesi.masihBerlangsung', { tanggal: formatTanggal(lama.tanggal) }), 409, { kode: 'berlangsung', sesiId: lama.id });
  }
  /** Syarat kehadiran pertemuan post test; detail membawa data untuk tombol Izinkan pengecualian. */
  async function periksaSyaratPostTest(siswa, conn) {
    const k = await kehadiran(siswa.siswa_level_id, conn);
    if (!k.memenuhi) throw new AppError(t('sesi.kehadiranKurang', { hadir: k.hadir, dari: k.dari, butuh: k.butuh }), 409, { kode: 'kehadiran', siswaLevelId: siswa.siswa_level_id, ...k });
  }
  /** ID tutor tambahan yang sah: unik, bukan pelaku sendiri, dan akunnya masih aktif. */
  async function tutorTambahanSah(daftar, pelakuId) {
    const unik = [...new Set(daftar)].filter((id) => id !== pelakuId);
    for (const id of unik) if (!(await penggunaModel.cariAktif(id))) throw new AppError(t('sesi.tutorTidakAktif'), 400);
    return unik;
  }
  /** Isi transaksi absen masuk: sesi, tutor, pembayaran (opsional), dan tugas. */
  async function buatSesi(siswa, pertemuan, { tutorTambahan, jumlah, keterangan }, pelakuId, conn) {
    const sesiId = idGen.generate();
    await sesiModel.tambah({ id: sesiId, siswaId: siswa.id, siswaLevelId: siswa.siswa_level_id, pertemuanId: pertemuan.id }, conn);
    for (const penggunaId of [pelakuId, ...tutorTambahan]) await sesiModel.tambahTutor({ id: idGen.generate(), sesiId, penggunaId }, conn);
    // pembayaran hanya dicatat bila salah satu isiannya diisi
    if (jumlah != null || keterangan) await pembayaranUsecase.simpan({ siswaId: siswa.id, sesiId, jumlah, keterangan }, pelakuId, conn);
    // pertemuan post test tidak punya tugas biasa (post test dikerjakan di Fase D2)
    const tugas = pertemuan.nomor < NOMOR_POST_TEST ? await tugasUsecase.generate(sesiId, pertemuan.id, conn) : { dibuat: 0, dilewati: [] };
    const detail = { siswaId: siswa.id, pertemuan: pertemuan.nomor, tutor: [pelakuId, ...tutorTambahan], tugasDibuat: tugas.dibuat, templateDilewati: tugas.dilewati };
    await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.ABSEN_MASUK, entitas: 'sesi', entitasId: sesiId, detail }, conn);
    return { sesiId, tugas };
  }
  /** Menutup sesi (idempoten): penuntasan otomatis disimpan dan login perangkat siswa diakhiri dengan `alasan`. */
  async function akhiriSesi(sesiId, { alasan, penggunaId = null }) {
    return db.transaction(async (conn) => {
      const sesi = await sesiModel.kunci(sesiId, conn);
      if (!sesi) throw new AppError(t('sesi.tidakAda'), 404);
      // sudah ditutup sebelumnya: hasilnya sama, tidak ada yang diubah
      if (sesi.status === STATUS_SESI.SELESAI) return { id: sesiId, sudahSelesai: true };
      const penuntasan = await tugasUsecase.hitungPenuntasan(sesiId, conn);
      await sesiModel.tutup(sesiId, penuntasan, conn);
      await authUsecase.akhiriLoginSiswa(sesi.siswa_id, alasan, conn);
      const aksi = alasan === ALASAN_BERAKHIR.PULANG ? AKSI_LOG.PULANG : AKSI_LOG.TUTUP_SESI;
      await catatAktivitas({ penggunaId, aksi, entitas: 'sesi', entitasId: sesiId, detail: { siswaId: sesi.siswa_id, penuntasanOtomatis: penuntasan } }, conn);
      return { id: sesiId, sudahSelesai: false };
    });
  }
  /** Memastikan sesi masih berlangsung (aksi yang hanya masuk akal selama siswa hadir). */
  async function wajibBerlangsung(sesiId, conn) {
    const sesi = await sesiModel.kunci(sesiId, conn);
    if (!sesi) throw new AppError(t('sesi.tidakAda'), 404);
    if (sesi.status !== STATUS_SESI.BERLANGSUNG) throw new AppError(t('sesi.sudahSelesai'), 409);
    return sesi;
  }
  return {
    /** Langkah pertama form absen: siswa dari kode, pertemuan level berjalan dengan bawaan, dan sesi yang belum ditutup. */
    async cekKode(kode) {
      const siswa = await siswaDariKode(kode);
      const [pertemuan, berlangsung] = await Promise.all([pertemuanSiswa(siswa), sesiModel.berlangsungSiswa(siswa.id)]);
      return {
        siswa: { id: siswa.id, nama: siswa.nama },
        level: { kode: siswa.level_kode, nama: siswa.level_nama },
        pertemuan: pertemuan.daftar,
        bawaanId: pertemuan.bawaanId,
        sesiBerlangsung: berlangsung ? { id: berlangsung.id, tanggal: berlangsung.tanggal } : null,
      };
    },
    /** Absen masuk (C1) dalam satu transaksi. Hasil: ringkasan sesi baru untuk ditampilkan ke tutor. */
    async absenMasuk(data, pelakuId) {
      const tutorTambahan = await tutorTambahanSah(data.tutorTambahan, pelakuId);
      try {
        return await db.transaction(async (conn) => {
          const siswa = await siswaDariKode(data.kode, conn);
          const pertemuan = (await pertemuanSiswa(siswa, conn)).daftar.find((p) => p.id === data.pertemuanId);
          // pertemuan dari level lain tidak boleh dipakai
          if (!pertemuan) throw new AppError(t('sesi.pertemuanBukanLevel'), 400, [{ kolom: 'pertemuanId', pesan: t('sesi.pertemuanBukanLevel') }]);
          await tolakBilaBerlangsung(siswa.id, conn);
          if (pertemuan.nomor === NOMOR_POST_TEST) await periksaSyaratPostTest(siswa, conn);
          const { sesiId, tugas } = await buatSesi(siswa, pertemuan, { ...data, tutorTambahan }, pelakuId, conn);
          return { sesiId, siswaNama: siswa.nama, levelKode: siswa.level_kode, pertemuanNomor: pertemuan.nomor, pertemuanJudul: pertemuan.judul, tugasDibuat: tugas.dibuat, templateDilewati: tugas.dilewati };
        });
      } catch (error) {
        // dua tutor mengabsen siswa yang sama bersamaan: UNIQUE aktif_kunci menolak yang kalah balapan
        if (!adalahDuplikat(error, 'uq_sesi_aktif')) throw error;
        const lama = await sesiModel.berlangsungSiswa((await siswaDariKode(data.kode)).id);
        throw new AppError(t('sesi.masihBerlangsung', { tanggal: formatTanggal(lama?.tanggal) }), 409, { kode: 'berlangsung', sesiId: lama?.id ?? null });
      }
    },
    /** Tutor mengizinkan siswa ikut post test walau kehadirannya kurang (dicatat ke log). */
    async izinkanPengecualian(siswaLevelId, pelakuId) {
      await db.transaction(async (conn) => {
        await sesiModel.izinkanPengecualian(siswaLevelId, conn);
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.IZINKAN_PENGECUALIAN, entitas: 'siswa_level', entitasId: siswaLevelId }, conn);
      });
      return { siswaLevelId };
    },
    /** Tutor lain bergabung ke sesi berlangsung (Ikut menangani). */
    async ikutMenangani(sesiId, penggunaId) {
      await db.transaction(async (conn) => {
        await wajibBerlangsung(sesiId, conn);
        const hasil = await sesiModel.tambahTutor({ id: idGen.generate(), sesiId, penggunaId }, conn);
        // sudah tercatat sebelumnya (INSERT IGNORE tidak menambah baris): tidak perlu dicatat lagi
        if (hasil.affectedRows > 0) await catatAktivitas({ penggunaId, aksi: AKSI_LOG.IKUT_MENANGANI, entitas: 'sesi', entitasId: sesiId }, conn);
      });
      return { id: sesiId };
    },
    akhiriSesi,
    /** Tutor menutup sesi (siswa lupa pulang); login siswa diakhiri dengan alasan ditutup_tutor. */
    tutupOlehTutor: (sesiId, penggunaId) => akhiriSesi(sesiId, { alasan: ALASAN_BERAKHIR.DITUTUP_TUTOR, penggunaId }),
    /** Siswa menekan Pulang: sesi berlangsungnya ditutup dan login perangkatnya diakhiri. */
    async pulang(siswaId) {
      const sesiId = await sesiModel.idBerlangsung(siswaId);
      // tombol Pulang hanya tampil saat sesi berlangsung; bila sesinya sudah ditutup tutor, beri tahu dengan ramah
      if (!sesiId) throw new AppError(t('sesi.tidakAdaSesiAktif'), 409);
      return akhiriSesi(sesiId, { alasan: ALASAN_BERAKHIR.PULANG });
    },
    /** Tutor memilih penuntasan (atau null = kembali ke otomatis); dicatat ke log. */
    async ubahPenuntasan(sesiId, nilai, penggunaId) {
      await db.transaction(async (conn) => {
        const lama = await wajibSesi(sesiId, conn);
        await sesiModel.ubahPenuntasanTutor(sesiId, nilai, penggunaId, conn);
        const detail = { sebelum: lama.penuntasan_tutor, sesudah: nilai, otomatis: lama.penuntasan_otomatis };
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_PENUNTASAN, entitas: 'sesi', entitasId: sesiId, detail }, conn);
      });
      return { id: sesiId };
    },
    /** Menyimpan catatan tutor yang sedang login; tutor harus sudah tercatat di sesi (Ikut menangani). */
    async simpanCatatan(sesiId, catatan, penggunaId) {
      await wajibSesi(sesiId);
      const hasil = await sesiModel.simpanCatatan(sesiId, penggunaId, catatan);
      // baris sesi_tutor belum ada: tutor ini belum ikut menangani sesi
      if (hasil.affectedRows === 0) throw new AppError(t('sesi.belumIkutMenangani'), 403);
      return { id: sesiId };
    },
    /** Detail sesi untuk pengelola: tugas, tutor dan catatan, penuntasan (otomatis real-time bila berlangsung), pembayaran, peringatan. */
    async detail(sesiId) {
      const sesi = await wajibSesi(sesiId);
      const [tugas, tutor, pembayaran, logAbsen] = await Promise.all([
        tugasUsecase.daftarUntukTutor(sesiId),
        sesiModel.tutorSesi([sesiId]),
        pembayaranUsecase.daftarSesi(sesiId),
        logUsecase.detailTerakhir(AKSI_LOG.ABSEN_MASUK, 'sesi', sesiId),
      ]);
      const berlangsung = sesi.status === STATUS_SESI.BERLANGSUNG;
      // selama berlangsung penuntasan otomatis dihitung dari status tugas saat ini; setelah ditutup memakai nilai tersimpan
      const otomatis = berlangsung ? tugasUsecase.penuntasanDari(tugas.map((x) => x.status)) : sesi.penuntasan_otomatis;
      const akhir = bentukSesi({ ...sesi, penuntasan_otomatis: otomatis });
      return { ...gabungTutor([akhir], tutor)[0], tugas, pembayaran, templateDilewati: logAbsen?.templateDilewati ?? [] };
    },
    /** Semua sesi berlangsung beserta tutornya (halaman Absensi). */
    async daftarBerlangsung() {
      const daftar = (await sesiModel.daftarBerlangsung()).map(bentukSesi);
      return gabungTutor(daftar, await sesiModel.tutorSesi(daftar.map((s) => s.id)));
    },
    /** Jumlah sesi berlangsung (lencana menu). */
    jumlahBerlangsung: () => sesiModel.jumlahBerlangsung(),
    /** Pilihan tutor tambahan: akun aktif selain pelaku. */
    async pilihanTutor(kecualiId) {
      return (await penggunaModel.daftar()).filter((p) => p.aktif && p.id !== kecualiId).map((p) => ({ id: p.id, nama: p.nama }));
    },
    /** ID sesi berlangsung siswa (untuk ping dan sinkron otomatis halaman siswa). */
    sesiAktifId: (siswaId) => sesiModel.idBerlangsung(siswaId),
    /** Data beranda siswa: sesi berlangsung beserta tugas (tanpa kunci jawaban), atau null bila belum absen. */
    async berandaSiswa(siswaId) {
      const b = await sesiModel.berlangsungSiswa(siswaId);
      // belum diabsen tutor: beranda menampilkan mode lihat saja
      if (!b) return null;
      const sesi = bentukSesi(b);
      return {
        id: sesi.id,
        jamMasuk: sesi.jam_masuk,
        lamaDetik: sesi.lama_detik,
        levelId: sesi.level_id,
        levelKode: sesi.level_kode,
        levelNama: sesi.level_nama,
        siswaLevelId: sesi.siswa_level_id,
        pertemuanNomor: sesi.pertemuan_nomor,
        pertemuanJudul: sesi.pertemuan_judul,
        tugas: await tugasUsecase.daftarUntukSiswa(sesi.id),
      };
    },
    /** Riwayat sesi dan kehadiran level berjalan seorang siswa (detail siswa, C9). */
    async riwayatSiswa(siswaId) {
      const siswa = await siswaModel.cariId(siswaId);
      if (!siswa) throw new AppError(t('dataSiswa.tidakAda'), 404);
      const daftar = (await sesiModel.riwayatSiswa(siswaId)).map(bentukSesi);
      const [tutor, hadir] = await Promise.all([sesiModel.tutorSesi(daftar.map((s) => s.id)), siswa.siswa_level_id ? kehadiran(siswa.siswa_level_id) : null]);
      return { sesi: gabungTutor(daftar, tutor), kehadiran: hadir };
    },
  };
}
