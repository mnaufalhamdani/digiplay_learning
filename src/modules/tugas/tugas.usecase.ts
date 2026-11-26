import 'server-only';
import { AppError, adalahAppError } from '@/utils/appError';
import { bacaBerkasGambar } from '@/utils/berkasGambar';
import { uraiJson, teksJson } from '@/utils/json';
import { hasilBerkas } from '@/utils/responseHandler';
import { jawabanHarapan, periksaJawaban, renderTemplate } from '@/utils/templateRender';
import { t } from '@/utils/i18n';
import {
  AKSI_LOG,
  JENIS_GAMBAR_UNDUH,
  KUNCI_PENGATURAN,
  PENILAIAN,
  PENUNTASAN,
  STATUS_SESI,
  STATUS_TUGAS,
  TIPE_DIJAWAB_SISWA,
} from '@/enums';

/** Kunci tugas yang aman dikirim ke browser siswa (petunjuk target, bukan jawaban). */
const KUNCI_UNTUK_SISWA = ['jenis', 'min_skor', 'keping', 'teks_ketik', 'min_akurasi', 'min_wpm', 'labirin'];

/**
 * Penuntasan otomatis dari status tugas (C7): tugas diganti diabaikan; semua selesai -> tuntas;
 * ada yang selesai atau dilewati -> tuntas sebagian; selain itu tidak tuntas. Tanpa tugas sama sekali
 * (mis. pertemuan post test) hasilnya null karena tidak ada yang bisa dinilai.
 */
export function penuntasanDari(daftarStatus) {
  const aktif = daftarStatus.filter((s) => s !== STATUS_TUGAS.DIGANTI);
  if (aktif.length === 0) return null;
  if (aktif.every((s) => s === STATUS_TUGAS.SELESAI)) return PENUNTASAN.TUNTAS;
  if (aktif.some((s) => s === STATUS_TUGAS.SELESAI || s === STATUS_TUGAS.DILEWATI)) return PENUNTASAN.SEBAGIAN;
  return PENUNTASAN.TIDAK;
}

/** Teks dirapikan untuk dibandingkan (spasi tepi dan spasi ganda diabaikan). */
function rapiTeks(teks) {
  return String(teks ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Apakah sebuah hasil latihan web memenuhi target satu tugas (D1.6). Hasil: { cocok } atau, untuk mengetik
 * yang teksnya sama tetapi target belum tercapai, { hampir: { minWpm, minAkurasi } }.
 */
export function cocokHasil(tugas, hasil) {
  const kunci = tugas.ph.kunci ?? {};
  if (tugas.tipe === 'game_mouse') return { cocok: kunci.jenis === hasil.jenis && Number(hasil.skor) >= Number(kunci.min_skor) };
  if (tugas.tipe === 'puzzle') return { cocok: Number(kunci.keping) === Number(hasil.keping) && Boolean(hasil.selesai) && tugas.ph.gambar?.[0]?.kode === hasil.kode };
  // Coding Zippy: hasil berhasil (sudah dinilai di server) untuk labirin yang namanya sama dengan yang diminta tugas
  if (tugas.tipe === 'blockly') return { cocok: kunci.jenis === hasil.jenis && kunci.labirin === hasil.labirin };
  // mengetik: hanya hasil mode latihan untuk teks tugas itu sendiri
  if (hasil.mode !== 'latihan' || rapiTeks(kunci.teks_ketik) !== rapiTeks(hasil.teks)) return { cocok: false };
  const minWpm = Number(kunci.min_wpm) || 0;
  const minAkurasi = Number(kunci.min_akurasi) || 0;
  if (hasil.wpm >= minWpm && hasil.akurasi >= minAkurasi) return { cocok: true };
  return { cocok: false, hampir: { minWpm, minAkurasi } };
}

/** Isi parameter_hasil sebuah tugas dari hasil render (C2.4). */
function isiParameterHasil(render) {
  return { nilai: render.nilaiParameter, gambar: render.gambar, opsi: render.opsi ?? [], kunci: render.kunci, percobaan: 0 };
}

/** Baris tugas dari database dengan parameter_hasil diurai. */
function bentukDasar(b) {
  const ph = uraiJson(b.parameter_hasil) ?? {};
  return { ...b, kesulitan: Number(b.kesulitan), benar: b.benar == null ? null : Boolean(b.benar), ph };
}

/** Teks jawaban siswa untuk tutor: pilihan ganda ditampilkan sebagai teks opsinya. */
function jawabanTampil(tugas) {
  // belum pernah menjawab
  if (tugas.jawaban == null) return null;
  if (tugas.tipe !== 'pilihan_ganda') return tugas.jawaban;
  return tugas.ph.opsi?.find((o) => String(o.indeksAsli) === String(tugas.jawaban))?.teks ?? tugas.jawaban;
}

/** Nama berkas unduhan yang ramah, mis. "mewarnai-bola-sepak.png" (hanya huruf kecil, angka, tanda hubung). */
export function namaUnduhan(jenis, nama) {
  const slug = String(nama ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${jenis}-${slug || 'gambar'}.png`;
}

/**
 * Usecase tugas: generate tugas saat absen, jawaban otomatis, Ganti tugas, Lewati, perubahan status oleh tutor,
 * penuntasan otomatis, dan unduh bahan gambar.
 */
export function buatTugasUsecase({ tugasModel, sesiModel, templateUsecase, gambarUsecase, pengaturanUsecase, materiUsecase, catatAktivitas, idGen, acak, folderGambar, db }) {
  /** Salinan array dengan urutan acak (Fisher-Yates, RNG disuntikkan). */
  function acakUrutan(daftar) {
    const hasil = [...daftar];
    for (let i = hasil.length - 1; i > 0; i -= 1) {
      const j = acak(i + 1);
      [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
    }
    return hasil;
  }
  /**
   * Urutan kandidat template: bila kedua jenis penilaian tersedia, masing-masing minimal sepertiga jumlah tugas
   * ditaruh paling depan, sisanya acak. Template yang gagal dirender nanti diganti kandidat berikutnya.
   */
  function urutanKandidat(daftar, jumlah) {
    const otomatis = acakUrutan(daftar.filter((d) => d.penilaian === PENILAIAN.OTOMATIS));
    const tutor = acakUrutan(daftar.filter((d) => d.penilaian === PENILAIAN.TUTOR));
    // hanya satu jenis yang tersedia: cukup urutan acak biasa
    if (otomatis.length === 0 || tutor.length === 0) return acakUrutan(daftar);
    const minimal = Math.ceil(jumlah / 3);
    const depan = [...otomatis.slice(0, minimal), ...tutor.slice(0, minimal)];
    return [...depan, ...acakUrutan(daftar.filter((d) => !depan.includes(d)))];
  }
  /** Render template; null bila template butuh gambar tetapi bank gambarnya kosong (dilewati, diganti yang lain). */
  function renderAtauLewati(tpl, gambarTersedia) {
    try {
      return renderTemplate(tpl, { acak, gambarTersedia });
    } catch (error) {
      // galat render yang kita kenal (bank gambar kosong): lewati template ini; selain itu teruskan
      if (!adalahAppError(error)) throw error;
      return null;
    }
  }
  /** Menyisipkan satu tugas dari template yang sudah dirender. */
  async function simpanTugas(sesiId, tpl, render, menggantikanId, conn) {
    const id = idGen.generate();
    await tugasModel.tambah({ id, sesiId, templateId: tpl.id, menggantikanId, soalTeks: render.teks, parameterHasil: teksJson(isiParameterHasil(render)) }, conn);
    return id;
  }
  /** Mengambil tugas milik siswa (terkunci) atau 404; tugas siswa lain diperlakukan sama dengan tidak ada. */
  async function wajibTugasSiswa(tugasId, siswaId, conn) {
    const tugas = await tugasModel.cariId(tugasId, conn, true);
    if (!tugas || tugas.siswa_id !== siswaId) throw new AppError(t('tugas.tidakAda'), 404);
    return bentukDasar(tugas);
  }
  /** Mengambil tugas (terkunci) untuk tutor atau 404. */
  async function wajibTugas(tugasId, conn) {
    const tugas = await tugasModel.cariId(tugasId, conn, true);
    if (!tugas) throw new AppError(t('tugas.tidakAda'), 404);
    return bentukDasar(tugas);
  }
  /** Aksi siswa hanya boleh selama sesinya berlangsung. */
  function pastikanSesiBerlangsung(tugas) {
    if (tugas.sesi_status !== STATUS_SESI.BERLANGSUNG) throw new AppError(t('tugas.sesiSelesai'), 409);
  }
  /** Tugas siswa terkunci bila materi pertemuannya ada tetapi belum ditandai "Saya sudah paham" (materi belum ada: tidak terkunci). */
  async function pastikanMateriDibaca(tugas, conn = null) {
    if (!(await materiUsecase.tugasTerbuka(tugas.siswa_id, tugas.pertemuan_id, conn))) throw new AppError(t('tugas.materiBelumDibaca'), 403);
  }
  /** Menghitung ulang penuntasan otomatis sesi yang sudah selesai (status tugas diubah tutor setelah pulang). */
  async function segarkanPenuntasan(tugas, conn) {
    // sesi berlangsung: penuntasan dihitung langsung saat ditampilkan dan disimpan saat ditutup
    if (tugas.sesi_status !== STATUS_SESI.SELESAI) return;
    await sesiModel.ubahPenuntasanOtomatis(tugas.sesi_id, penuntasanDari(await tugasModel.statusSesi(tugas.sesi_id, conn)), conn);
  }
  return {
    penuntasanDari,
    /**
     * Generate tugas untuk sesi baru (C2): template latihan aktif pertemuan dipilih acak tanpa pengulangan
     * sebanyak `jumlah_tugas_per_sesi`. Template yang butuh gambar tetapi bank gambarnya kosong dilewati
     * dan diganti kandidat lain. Hasil: { dibuat, dilewati: [kode template yang tidak bisa dirender] }.
     */
    async generate(sesiId, pertemuanId, conn) {
      const [daftar, gambarTersedia, jumlah] = await Promise.all([
        templateUsecase.aktifLatihan(pertemuanId, conn),
        gambarUsecase.tersedia(),
        pengaturanUsecase.angka(KUNCI_PENGATURAN.JUMLAH_TUGAS_PER_SESI),
      ]);
      const dilewati = [];
      let dibuat = 0;
      for (const tpl of urutanKandidat(daftar, jumlah)) {
        // jumlah tugas sudah cukup: kandidat sisanya tidak dipakai
        if (dibuat >= jumlah) break;
        const render = renderAtauLewati(tpl, gambarTersedia);
        if (!render) {
          dilewati.push(tpl.kode);
          continue;
        }
        await simpanTugas(sesiId, tpl, render, null, conn);
        dibuat += 1;
      }
      // peringatan hanya bermakna bila tugas yang terbentuk kurang dari yang diminta
      return { dibuat, dilewati: dibuat < Math.min(jumlah, daftar.length) ? dilewati : [] };
    },
    /** Penuntasan otomatis sesi saat ini (C7). */
    async hitungPenuntasan(sesiId, conn = null) {
      return penuntasanDari(await tugasModel.statusSesi(sesiId, conn));
    },
    /** Tugas sesi untuk tutor: status, jawaban siswa, jawaban harapan, dan rubrik (rubrik template atau rubrik bawaan pengaturan). */
    async daftarUntukTutor(sesiId) {
      const [baris, rubrikBawaan] = await Promise.all([tugasModel.daftarSesi(sesiId), pengaturanUsecase.rubrikBawaan()]);
      return baris.map((b) => {
        const tugas = bentukDasar(b);
        const render = { opsi: tugas.ph.opsi, nilaiParameter: tugas.ph.nilai ?? {}, kunci: tugas.ph.kunci };
        const harapan = tugas.penilaian === PENILAIAN.OTOMATIS ? jawabanHarapan({ tipe: tugas.tipe, kunci: tugas.ph.kunci }, render) : null;
        return { ...tugas, ph: undefined, parameter_hasil: undefined, gambar: tugas.ph.gambar ?? [], percobaan: tugas.ph.percobaan ?? 0, rubrik: tugas.ph.kunci?.rubrik ?? rubrikBawaan, jawabanTampil: jawabanTampil(tugas), jawabanHarapan: harapan };
      });
    },
    /** Tugas sesi untuk siswa: tanpa kunci jawaban (hanya petunjuk target), opsi tanpa penanda benar. */
    async daftarUntukSiswa(sesiId) {
      return (await tugasModel.daftarSesi(sesiId)).map((b) => {
        const tugas = bentukDasar(b);
        const kunci = Object.fromEntries(Object.entries(tugas.ph.kunci ?? {}).filter(([k]) => KUNCI_UNTUK_SISWA.includes(k)));
        return {
          id: tugas.id,
          status: tugas.status,
          tipe: tugas.tipe,
          penilaian: tugas.penilaian,
          soal: tugas.soal_teks,
          opsi: tugas.ph.opsi ?? [],
          gambar: tugas.ph.gambar ?? [],
          kunci,
          jawaban: tugas.jawaban,
          benar: tugas.benar,
          percobaan: tugas.ph.percobaan ?? 0,
        };
      });
    },
    /**
     * Siswa mengirim jawaban (C6.4): hanya tugas otomatis bertipe pilihan ganda/excel milik siswa itu pada
     * sesi berlangsung. Jawaban salah boleh dicoba lagi tanpa batas. Hasil: { benar }.
     */
    async kirimJawaban(tugasId, jawaban, siswaId) {
      return db.transaction(async (conn) => {
        const tugas = await wajibTugasSiswa(tugasId, siswaId, conn);
        pastikanSesiBerlangsung(tugas);
        // materi pertemuan belum dibaca: tugas masih terkunci
        await pastikanMateriDibaca(tugas, conn);
        // tugas di aplikasi lain, game, atau mengetik tidak dijawab lewat kolom ini
        if (tugas.penilaian !== PENILAIAN.OTOMATIS || !TIPE_DIJAWAB_SISWA.includes(tugas.tipe)) throw new AppError(t('tugas.bukanJawaban'), 400);
        // tugas yang sudah selesai/dilewati/diganti tidak dinilai ulang
        if (tugas.status !== STATUS_TUGAS.BELUM) throw new AppError(t('tugas.sudahTidakBelum'), 409);
        const benar = periksaJawaban({ tipe: tugas.tipe, kunci: tugas.ph.kunci }, tugas.ph.nilai ?? {}, jawaban);
        const parameterHasil = teksJson({ ...tugas.ph, percobaan: (tugas.ph.percobaan ?? 0) + 1 });
        await tugasModel.simpanJawaban(tugasId, { jawaban, benar, parameterHasil }, conn);
        return { benar };
      });
    },
    /**
     * Ganti tugas (C6.5) oleh siswa (`pelaku.siswaId`) atau tutor (`pelaku.penggunaId`): template lain pada pertemuan
     * yang sama yang belum dipakai di sesi ini, utamakan kesulitan sama atau lebih rendah. Tugas lama menjadi diganti.
     */
    async gantiTugas(tugasId, pelaku) {
      return db.transaction(async (conn) => {
        const lama = pelaku.siswaId ? await wajibTugasSiswa(tugasId, pelaku.siswaId, conn) : await wajibTugas(tugasId, conn);
        pastikanSesiBerlangsung(lama);
        // hanya siswa yang terkunci materi; tutor boleh mengganti tugas kapan saja selama sesi berlangsung
        if (pelaku.siswaId) await pastikanMateriDibaca(lama, conn);
        // tugas yang sudah selesai atau sudah diganti tidak perlu diganti lagi
        if (lama.status === STATUS_TUGAS.SELESAI || lama.status === STATUS_TUGAS.DIGANTI) throw new AppError(t('tugas.tidakBisaDiganti'), 409);
        const terpakai = await tugasModel.templateTerpakai(lama.sesi_id, conn);
        const calon = (await templateUsecase.aktifLatihan(lama.pertemuan_id, conn)).filter((tpl) => !terpakai.includes(tpl.id));
        const mudah = acakUrutan(calon.filter((tpl) => tpl.kesulitan <= lama.kesulitan));
        const gambarTersedia = await gambarUsecase.tersedia();
        for (const tpl of [...mudah, ...acakUrutan(calon.filter((x) => !mudah.includes(x)))]) {
          const render = renderAtauLewati(tpl, gambarTersedia);
          // template ini butuh gambar yang belum tersedia: coba calon berikutnya
          if (!render) continue;
          await tugasModel.ubahStatus(tugasId, STATUS_TUGAS.DIGANTI, null, conn);
          const baruId = await simpanTugas(lama.sesi_id, tpl, render, tugasId, conn);
          const detail = { sesiId: lama.sesi_id, dari: lama.template_kode, ke: tpl.kode, baruId };
          // penggantian oleh tutor dicatat ke log; penggantian oleh siswa cukup terlihat dari menggantikan_id
          if (pelaku.penggunaId) await catatAktivitas({ penggunaId: pelaku.penggunaId, aksi: AKSI_LOG.GANTI_TUGAS, entitas: 'tugas_siswa', entitasId: tugasId, detail }, conn);
          return { id: baruId };
        }
        throw new AppError(t('tugas.tidakAdaPengganti'), 409);
      });
    },
    /**
     * Dipanggil setelah hasil latihan web tersimpan (D1.6): tugas `belum` bertipe sama pada sesi berlangsung siswa
     * yang targetnya tercapai menjadi selesai. Hasil: { tugasSelesai: [id], hampir } (hampir = target mengetik belum tercapai).
     */
    async selesaikanOtomatis(siswaId, hasil) {
      const sesiId = await sesiModel.idBerlangsung(siswaId);
      // di luar sesi berlangsung tidak ada tugas yang bisa diselesaikan
      if (!sesiId) return { tugasSelesai: [], hampir: null };
      return db.transaction(async (conn) => {
        const tugasSelesai = [];
        let hampir = null;
        const belum = await tugasModel.belumTipe(sesiId, hasil.tipe, conn);
        // materi pertemuan belum dibaca: tugas terkunci, jadi hasil latihan bebas tidak boleh menyelesaikannya
        if (belum.length > 0 && !(await materiUsecase.tugasTerbuka(siswaId, belum[0].pertemuan_id, conn))) return { tugasSelesai, hampir };
        for (const b of belum) {
          const cek = cocokHasil(bentukDasar(b), hasil);
          if (cek.cocok) {
            await tugasModel.tandaiSelesaiOtomatis(b.id, conn);
            tugasSelesai.push(b.id);
          } else if (cek.hampir) hampir = cek.hampir;
        }
        return { tugasSelesai, hampir };
      });
    },
    /** Tugas latihan web milik siswa yang masih bisa dikerjakan (untuk membuka game/puzzle/mengetik dari kartu tugas); null bila tidak. */
    async untukLatihan(tugasId, siswaId) {
      const b = tugasId ? await tugasModel.cariId(tugasId) : null;
      // tugas siswa lain, sudah selesai, atau sesinya ditutup: halaman dibuka dalam mode bebas
      if (!b || b.siswa_id !== siswaId || b.status !== STATUS_TUGAS.BELUM || b.sesi_status !== STATUS_SESI.BERLANGSUNG) return null;
      // materi pertemuan belum dibaca: tugas terkunci, halaman dibuka tanpa tugas (mode bebas)
      if (!(await materiUsecase.tugasTerbuka(siswaId, b.pertemuan_id))) return null;
      const tugas = bentukDasar(b);
      const kunci = Object.fromEntries(Object.entries(tugas.ph.kunci ?? {}).filter(([k]) => KUNCI_UNTUK_SISWA.includes(k)));
      return { id: tugas.id, tipe: tugas.tipe, soal: tugas.soal_teks, kunci, gambar: tugas.ph.gambar ?? [] };
    },
    /**
     * Menerima proyek Studio Zippy yang dikirim siswa ke tugas bertipe coding_proyek (dipanggil studioUsecase dalam
     * transaksinya, yang menyimpan salinan proyeknya). Aturan sama dengan tugas lain: milik siswa itu, sesi berlangsung,
     * materi sudah dipahami, dan belum dinilai tutor. Nama proyek dicatat sebagai jawaban tugas. Boleh dikirim ulang.
     */
    async terimaProyek(siswaId, tugasId, nama, conn) {
      const tugas = await wajibTugasSiswa(tugasId, siswaId, conn);
      pastikanSesiBerlangsung(tugas);
      await pastikanMateriDibaca(tugas, conn);
      // hanya tugas proyek Studio Zippy yang menerima kiriman proyek
      if (tugas.tipe !== 'coding_proyek') throw new AppError(t('tugas.bukanProyek'), 400);
      // sudah ditandai selesai/dilewati/diganti: kiriman tidak lagi mengubah apa yang dinilai
      if (tugas.status !== STATUS_TUGAS.BELUM) throw new AppError(t('tugas.sudahTidakBelum'), 409);
      await tugasModel.simpanKiriman(tugasId, nama, conn);
    },
    /** Siswa melewati tugas (status dilewati; tidak memblokir Pulang). */
    async lewati(tugasId, siswaId) {
      await db.transaction(async (conn) => {
        const tugas = await wajibTugasSiswa(tugasId, siswaId, conn);
        pastikanSesiBerlangsung(tugas);
        await pastikanMateriDibaca(tugas, conn);
        // hanya tugas yang belum dikerjakan yang bisa dilewati
        if (tugas.status !== STATUS_TUGAS.BELUM) throw new AppError(t('tugas.sudahTidakBelum'), 409);
        await tugasModel.ubahStatus(tugasId, STATUS_TUGAS.DILEWATI, null, conn);
      });
      return { id: tugasId };
    },
    /**
     * Tutor mengubah status tugas (selesai/dilewati/belum), termasuk menandai tugas dicek tutor selesai.
     * Boleh juga setelah siswa pulang; penuntasan otomatis sesi selesai ikut dihitung ulang. Dicatat ke log.
     */
    async ubahStatusTutor(tugasId, status, penggunaId) {
      await db.transaction(async (conn) => {
        const tugas = await wajibTugas(tugasId, conn);
        // tugas yang sudah diganti sudah tidak berlaku
        if (tugas.status === STATUS_TUGAS.DIGANTI) throw new AppError(t('tugas.sudahDiganti'), 409);
        await tugasModel.ubahStatus(tugasId, status, penggunaId, conn);
        await segarkanPenuntasan(tugas, conn);
        const detail = { sesiId: tugas.sesi_id, template: tugas.template_kode, sebelum: tugas.status, sesudah: status };
        await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_STATUS_TUGAS, entitas: 'tugas_siswa', entitasId: tugasId, detail }, conn);
      });
      return { id: tugasId };
    },
    /**
     * Unduh bahan (C6.6): subjek `kode` harus tercantum di parameter_hasil tugas milik siswa itu dengan jenis
     * mewarnai atau berwarna. Hasilnya berkas PNG sebagai attachment bernama ramah.
     */
    async unduh(tugasId, kode, siswaId) {
      const tugas = await tugasModel.cariId(tugasId);
      // tugas siswa lain diperlakukan sama dengan tidak ada
      if (!tugas || tugas.siswa_id !== siswaId) throw new AppError(t('tugas.tidakAda'), 404);
      // bahan tugas ikut terkunci sampai materi dibaca
      await pastikanMateriDibaca(tugas);
      const gambar = (bentukDasar(tugas).ph.gambar ?? []).find((g) => g.kode === kode && JENIS_GAMBAR_UNDUH.includes(g.jenis));
      if (!gambar) throw new AppError(t('tugas.bahanTidakAda'), 404);
      const buffer = await bacaBerkasGambar(folderGambar, gambar.kode, gambar.jenis);
      // berkas dihapus dari folder setelah tugas dibuat
      if (!buffer) throw new AppError(t('tugas.bahanTidakAda'), 404);
      return hasilBerkas(buffer, 'image/png', namaUnduhan(gambar.jenis, gambar.nama));
    },
  };
}
