import { ARAH, BATAS_PROGRAM, DAFTAR_BLOK, hitungBlok, periksaProgram } from '@/modules/shared/blockly/daftarBlok';

// Penerjemah program Coding Zippy: SATU-SATUNYA sumber kebenaran. Dipakai sama persis oleh tampilan (animasi dan
// umpan balik) dan oleh server (penilaian). Murni: tanpa efek samping dan tanpa akses database. Program ditafsirkan
// langsung dari JSON; tidak ada eval/new Function dan tidak ada kode hasil generator Blockly yang dijalankan.

/** Hasil kosong untuk program yang tidak bisa dijalankan. */
function hasilGagal(alasan, jumlahBlok = 0) {
  return { berhasil: false, alasan, jumlahBlok, jumlahLangkah: 0, jejak: [] };
}

/** Apakah petak (x, y) ada di dalam grid dan bukan dinding. */
function buatPemeriksaPetak(grid) {
  return (x, y) => y >= 0 && y < grid.length && x >= 0 && x < grid[y].length && grid[y][x] !== '#';
}

/**
 * Menjalankan program di labirin.
 * `labirin`: { grid: [string], mulai: { x, y, arah }, bintang: { x, y }, batas_blok, blok_tersedia }.
 * `program`: daftar perintah berurutan, mis. [{ blok: 'maju' }, { blok: 'ulangi', kali: 3, isi: [...] }].
 * Hasil: { berhasil, alasan, jumlahBlok, jumlahLangkah, jejak }.
 *  - alasan (bila gagal): 'tidak_valid' | 'program_kosong' | 'menabrak' | 'belum_sampai' | 'terlalu_banyak_blok';
 *  - jejak: posisi awal lalu satu entri per perintah yang dijalankan, { x, y, arah, aksi } (aksi 'tabrak' = menabrak).
 */
export function simulasiProgram(labirin, program) {
  // bentuk program salah, tipe tidak dikenal/tidak tersedia, atau terlalu besar/dalam: tidak dijalankan sama sekali
  if (periksaProgram(program, { tersedia: labirin.blok_tersedia }).length > 0) return hasilGagal('tidak_valid');
  const jumlahBlok = hitungBlok(program);
  if (program.length === 0) return hasilGagal('program_kosong');
  const bisaDilewati = buatPemeriksaPetak(labirin.grid);
  let keadaan = { x: labirin.mulai.x, y: labirin.mulai.y, arah: ARAH.indexOf(labirin.mulai.arah) };
  const jejak = [{ x: keadaan.x, y: keadaan.y, arah: ARAH[keadaan.arah], aksi: 'mulai' }];
  let jumlahLangkah = 0;
  // sebab berhenti: 'sampai', 'menabrak', atau 'belum_sampai' (batas langkah); null bila perintah habis begitu saja
  let akhir = null;

  /** Menjalankan daftar node; true bila program harus berhenti (sampai bintang, menabrak, atau melewati batas langkah). */
  function jalankan(daftar) {
    for (const node of daftar) {
      const def = DAFTAR_BLOK[node.blok];
      if (def.jenis === 'wadah') {
        for (let i = 0; i < node.kali; i += 1) if (jalankan(node.isi)) return true;
        continue;
      }
      // pengaman: program yang berputar terlalu lama dihentikan agar server tidak menggantung
      if (jumlahLangkah >= BATAS_PROGRAM.maksLangkah) {
        akhir = 'belum_sampai';
        return true;
      }
      jumlahLangkah += 1;
      const baru = def.jalankan(keadaan, { bisaDilewati });
      // menabrak: posisi tidak berubah, hanya dicatat untuk animasi lalu program berhenti dan gagal
      if (baru.menabrak) {
        jejak.push({ x: keadaan.x, y: keadaan.y, arah: ARAH[keadaan.arah], aksi: 'tabrak' });
        akhir = 'menabrak';
        return true;
      }
      keadaan = baru;
      jejak.push({ x: keadaan.x, y: keadaan.y, arah: ARAH[keadaan.arah], aksi: node.blok });
      // mendarat di bintang: perintah sisa tidak dijalankan
      if (node.blok === 'maju' && keadaan.x === labirin.bintang.x && keadaan.y === labirin.bintang.y) {
        akhir = 'sampai';
        return true;
      }
    }
    return false;
  }

  jalankan(program);
  if (akhir === 'sampai') {
    // sampai di bintang tetapi blok melebihi batas: belum berhasil (mendorong pemakaian blok ulangi)
    if (jumlahBlok > labirin.batas_blok) return { berhasil: false, alasan: 'terlalu_banyak_blok', jumlahBlok, jumlahLangkah, jejak };
    return { berhasil: true, alasan: null, jumlahBlok, jumlahLangkah, jejak };
  }
  // menabrak, melewati batas langkah, atau semua perintah habis tanpa mencapai bintang
  return { berhasil: false, alasan: akhir ?? 'belum_sampai', jumlahBlok, jumlahLangkah, jejak };
}
