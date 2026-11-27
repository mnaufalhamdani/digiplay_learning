import 'server-only';
import { AppError } from '@/utils/appError';
import { teksJson } from '@/utils/json';
import { t } from '@/utils/i18n';
import { BATAS_LATIHAN, JENIS_GAME_MOUSE, JENIS_LATIHAN, MENU_GAME, MENU_GAME_AWAL, MENU_GAME_DARI_TIPE, MENU_GAME_LEVEL_AWAL } from '@/enums';

/** Usecase latihan (D1.4-D1.6): simpan hasil game mouse dan puzzle, gambar puzzle mode bebas, dan ringkasan pengelola. */
export function buatLatihanUsecase({ latihanModel, gambarModel, sesiModel, tugasUsecase, idGen, acak }) {
  /** Sesi berlangsung siswa atau 403 (di luar sesi latihan hanya mode lihat saja). */
  async function wajibSesi(siswaId) {
    const sesi = await sesiModel.berlangsungSiswa(siswaId);
    if (!sesi) throw new AppError(t('latihan.butuhSesi'), 403);
    return sesi;
  }
  /** Gambar puzzle yang dimainkan harus subjek aktif yang punya puzzle.png; mengembalikan ID-nya. */
  async function idGambarPuzzle(kode) {
    const g = await gambarModel.cariKode(kode);
    if (!g || !g.aktif || !g.punya_puzzle) throw new AppError(t('latihan.gambarTidakAda'), 400);
    return g.id;
  }
  /**
   * Menu game yang terbuka untuk siswa: Puzzle sejak awal, menu dari jenis tugas yang pernah muncul (lintas level, termasuk
   * butir post test) sesuai MENU_GAME_DARI_TIPE, dan menu game level yang lebih rendah dari level tertinggi siswa
   * (MENU_GAME_LEVEL_AWAL). Terbuka selamanya karena diturunkan dari riwayat.
   */
  async function menuGameTerbuka(siswaId) {
    const hasil = await latihanModel.tipeGameSiswa(siswaId, Object.keys(MENU_GAME_DARI_TIPE));
    const levelTertinggi = Number(hasil.find((x) => String(x).startsWith('level:'))?.slice(6)) || 0;
    // siswa di level lebih tinggi (mis. masuk langsung di Level 2 atau 3) memegang game level di bawahnya walau tugasnya tidak muncul
    const dariLevel = Object.entries(MENU_GAME_LEVEL_AWAL).filter(([, awal]) => levelTertinggi > awal).map(([menu]) => menu);
    return [...new Set([...MENU_GAME_AWAL, ...dariLevel, ...hasil.map((x) => MENU_GAME_DARI_TIPE[x]).filter(Boolean)])];
  }
  /** Menolak (403) bila menu game belum terbuka untuk siswa; dipakai penjaga aksi di server. */
  async function wajibMenuTerbuka(siswaId, menu) {
    // menu belum terbuka: tolak walau aksi dipanggil langsung tanpa lewat halaman
    if (!(await menuGameTerbuka(siswaId)).includes(menu)) throw new AppError(t('latihan.menuTerkunci'), 403);
  }
  return {
    menuGameTerbuka,
    wajibMenuTerbuka,
    /**
     * Menyimpan hasil latihan pada sesi berlangsung lalu menyelesaikan tugas yang cocok. Validasi kewajaran:
     * jenis dikenal dan skor tidak melebihi 5 poin per detik.
     */
    async simpan(siswaId, data) {
      const sesi = await wajibSesi(siswaId);
      if (!JENIS_LATIHAN.includes(data.jenis)) throw new AppError(t('latihan.hasilTidakWajar'), 400);
      // game mouse hanya bisa disimpan setelah menunya terbuka (Puzzle selalu terbuka)
      if (data.jenis !== 'puzzle') await wajibMenuTerbuka(siswaId, MENU_GAME.LATIHAN_MOUSE);
      const durasi = Math.max(1, Math.round(data.durasiDetik));
      // skor mustahil untuk durasi itu (mis. dikirim manual): tolak
      if ((data.skor ?? 0) > durasi * BATAS_LATIHAN.maksSkorPerDetik) throw new AppError(t('latihan.hasilTidakWajar'), 400);
      const puzzle = data.jenis === 'puzzle';
      const gambarId = puzzle ? await idGambarPuzzle(data.kode) : null;
      const baris = { id: idGen.generate(), siswaId, sesiId: sesi.id, jenis: data.jenis, gambarId, keping: puzzle ? data.keping : null, skor: puzzle ? null : data.skor, selesai: data.selesai, durasiDetik: durasi, detail: teksJson(data.detail ?? null) };
      await latihanModel.tambah(baris);
      // game mouse dicocokkan per jenis + skor; puzzle per keping + gambar + selesai
      const hasil = puzzle ? { tipe: 'puzzle', keping: data.keping, kode: data.kode, selesai: data.selesai } : { tipe: 'game_mouse', jenis: data.jenis, skor: data.skor };
      return { id: baris.id, ...(await tugasUsecase.selesaikanOtomatis(siswaId, hasil)) };
    },
    /** Satu gambar puzzle acak untuk mode bebas (opsional per kategori). */
    async gambarPuzzle(siswaId, kategori) {
      // hanya membaca bank gambar, tidak menulis data: boleh tanpa sesi berlangsung (hasil tetap butuh sesi di `simpan`)
      const daftar = await gambarModel.puzzleAktif(kategori);
      if (daftar.length === 0) throw new AppError(t('template.belumAdaGambar'), 404);
      const g = daftar[acak(daftar.length)];
      return { kode: g.kode, nama: g.nama };
    },
    /** Ringkasan game mouse dan puzzle seorang siswa untuk pengelola. */
    async statistikSiswa(siswaId) {
      const baris = await latihanModel.statistik(siswaId);
      const per = Object.fromEntries(baris.map((b) => [b.jenis, { jumlah: Number(b.jumlah), skorTerbaik: b.skor_terbaik == null ? null : Number(b.skor_terbaik), jumlahSelesai: Number(b.jumlah_selesai ?? 0) }]));
      return { game: JENIS_GAME_MOUSE.map((j) => ({ jenis: j, jumlah: per[j]?.jumlah ?? 0, skorTerbaik: per[j]?.skorTerbaik ?? null })), puzzleSelesai: per.puzzle?.jumlahSelesai ?? 0 };
    },
  };
}
