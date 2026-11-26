import 'server-only';
import { JENIS_BLOCKLY } from '@/enums';

/** Kolom labirin untuk siswa: sengaja TANPA contoh_solusi agar solusi tidak pernah sampai ke browser. */
const KOLOM_SISWA = 'l.id, l.kode, l.nama, l.urutan, l.lebar, l.tinggi, l.grid, l.mulai, l.bintang, l.batas_blok, l.blok_tersedia, l.petunjuk';
/** Penanda: siswa (parameter pertama) pernah berhasil menyelesaikan labirin ini. */
const SUDAH_SELESAI = `EXISTS (SELECT 1 FROM hasil_latihan h WHERE h.siswa_id = ? AND h.labirin_id = l.id AND h.jenis = '${JENIS_BLOCKLY}' AND h.selesai = 1) AS selesai`;

/** Model Coding Zippy: tabel labirin_blockly dan hasil berhasil di hasil_latihan (jenis blockly). */
export function buatBlocklyModel({ db }) {
  return {
    /** Labirin aktif berurutan beserta penanda sudah selesai bagi seorang siswa. */
    daftarAktif(siswaId) {
      return db.rows(`SELECT ${KOLOM_SISWA}, ${SUDAH_SELESAI} FROM labirin_blockly l WHERE l.aktif = 1 ORDER BY l.urutan, l.id`, [siswaId]);
    },
    /** Satu labirin aktif menurut kode (tanpa contoh_solusi) beserta penanda selesai; null bila tidak ada. */
    cariKode(kode, siswaId) {
      return db.first(`SELECT ${KOLOM_SISWA}, ${SUDAH_SELESAI} FROM labirin_blockly l WHERE l.kode = ? AND l.aktif = 1`, [siswaId, kode]);
    },
    /** Kode labirin aktif menurut nama (dipakai tugas yang menyebut nama labirin); null bila tidak ada. */
    cariNama(nama) {
      return db.first('SELECT kode FROM labirin_blockly WHERE nama = ? AND aktif = 1', [nama]);
    },
    /** Menyimpan satu hasil berhasil ke hasil_latihan; `detail` sudah berupa teks JSON. */
    tambahHasil(d, conn) {
      return db.exec(
        `INSERT INTO hasil_latihan (id, siswa_id, sesi_id, jenis, labirin_id, selesai, durasi_detik, detail) VALUES (?, ?, ?, '${JENIS_BLOCKLY}', ?, 1, ?, ?)`,
        [d.id, d.siswaId, d.sesiId, d.labirinId, d.durasiDetik, d.detail],
        conn,
      );
    },
  };
}
