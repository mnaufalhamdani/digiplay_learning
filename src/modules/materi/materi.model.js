import 'server-only';
import { JUMLAH_PERTEMUAN_MATERI } from '@/enums';

/** Kolom materi beserta pertemuan dan levelnya (tanpa kolom isi yang besar). */
const KOLOM_DAFTAR = `p.id AS pertemuan_id, p.nomor, p.judul AS pertemuan_judul,
  l.id AS level_id, l.kode AS level_kode, l.nama AS level_nama, l.urutan AS level_urutan,
  m.id AS materi_id, m.judul, m.aktif, m.updated_at`;
/** Pertemuan digabung dengan levelnya dan materinya (bila sudah ada). */
const DARI_MATERI = `FROM pertemuan p
  JOIN level l ON l.id = p.level_id
  LEFT JOIN materi m ON m.pertemuan_id = p.id`;
/**
 * Syarat "sudah dilalui" sebuah siswa (parameter pertama: siswa_id): pertemuan yang punya sesi untuk siswa itu.
 * Ini definisi Diajarkan yang sama dengan sesiModel.pertemuanLevel (status Diajarkan tidak disimpan, otomatis ada
 * selama sesi ada), tetapi lintas level, dan sudah mencakup sesi yang sedang berlangsung.
 */
const SYARAT_DILALUI = 'EXISTS (SELECT 1 FROM sesi se WHERE se.siswa_id = ? AND se.pertemuan_id = p.id)';

/** Model materi: tabel materi dan materi_baca, termasuk daftar materi yang sudah dilalui seorang siswa. */
export function buatMateriModel({ db }) {
  return {
    /**
     * Status materi satu pertemuan bagi seorang siswa: ID materi aktif (null bila belum ada) dan apakah
     * siswa sudah menekan "Saya sudah paham". Dasar penguncian tugas.
     */
    statusPertemuan(siswaId, pertemuanId, conn) {
      return db.first(
        `SELECT p.id, p.nomor, m.id AS materi_id,
           (SELECT COUNT(*) FROM materi_baca mb WHERE mb.siswa_id = ? AND mb.pertemuan_id = p.id) AS jumlah_baca
         FROM pertemuan p LEFT JOIN materi m ON m.pertemuan_id = p.id AND m.aktif = 1
         WHERE p.id = ?`,
        [siswaId, pertemuanId],
        conn,
      );
    },
    /** Satu materi lengkap (dengan isi) bila pertemuannya sudah dilalui siswa dan materinya aktif; selain itu null. */
    cariDilalui(siswaId, pertemuanId) {
      return db.first(
        `SELECT ${KOLOM_DAFTAR}, m.isi, mb.dibaca_at
         ${DARI_MATERI}
         LEFT JOIN materi_baca mb ON mb.pertemuan_id = p.id AND mb.siswa_id = ?
         WHERE p.id = ? AND p.nomor <= ? AND m.aktif = 1 AND ${SYARAT_DILALUI}`,
        [siswaId, pertemuanId, JUMLAH_PERTEMUAN_MATERI, siswaId],
      );
    },
    /** Daftar materi aktif yang sudah dilalui siswa (semua level), urut level lalu nomor pertemuan; tanpa kolom isi. */
    daftarDilalui(siswaId) {
      return db.rows(
        `SELECT ${KOLOM_DAFTAR}, mb.dibaca_at
         ${DARI_MATERI}
         LEFT JOIN materi_baca mb ON mb.pertemuan_id = p.id AND mb.siswa_id = ?
         WHERE p.nomor <= ? AND m.aktif = 1 AND ${SYARAT_DILALUI}
         ORDER BY l.urutan, p.nomor`,
        [siswaId, JUMLAH_PERTEMUAN_MATERI, siswaId],
      );
    },
    /** Materi aktif beserta waktu baca seorang siswa (detail siswa di backoffice); pertemuan tanpa materi tidak muncul. */
    statusBacaSiswa(siswaId) {
      return db.rows(
        `SELECT m.pertemuan_id, mb.dibaca_at
         FROM materi m LEFT JOIN materi_baca mb ON mb.pertemuan_id = m.pertemuan_id AND mb.siswa_id = ?
         WHERE m.aktif = 1`,
        [siswaId],
      );
    },
    /** Menandai siswa sudah paham; pasangan siswa + pertemuan yang sudah ada diabaikan (idempoten, UNIQUE). */
    simpanBaca({ id, siswaId, pertemuanId }, conn) {
      return db.exec('INSERT IGNORE INTO materi_baca (id, siswa_id, pertemuan_id) VALUES (?, ?, ?)', [id, siswaId, pertemuanId], conn);
    },
    /** Semua pertemuan 1-12 semua level beserta materinya (kosong bila belum diisi), untuk halaman daftar pengelola. */
    daftarPengelola() {
      return db.rows(`SELECT ${KOLOM_DAFTAR} ${DARI_MATERI} WHERE p.nomor <= ? ORDER BY l.urutan, p.nomor`, [JUMLAH_PERTEMUAN_MATERI]);
    },
    /** Satu pertemuan beserta materinya (dengan isi mentah) untuk pratinjau dan editor pengelola; null bila pertemuan tidak ada. */
    cariPengelola(pertemuanId, conn) {
      return db.first(`SELECT ${KOLOM_DAFTAR}, m.isi ${DARI_MATERI} WHERE p.id = ?`, [pertemuanId], conn);
    },
    /** Membuat materi pertemuan atau menimpa isinya bila sudah ada (UNIQUE pertemuan_id); `isi` sudah berupa teks JSON. */
    simpan({ id, pertemuanId, judul, isi, aktif }, conn) {
      return db.exec(
        'INSERT INTO materi (id, pertemuan_id, judul, isi, aktif) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE judul = VALUES(judul), isi = VALUES(isi), aktif = VALUES(aktif)',
        [id, pertemuanId, judul, isi, aktif ? 1 : 0],
        conn,
      );
    },
  };
}
