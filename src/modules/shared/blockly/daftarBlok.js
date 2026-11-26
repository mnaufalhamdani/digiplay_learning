import { t } from '@/utils/i18n';

// Daftar blok Coding Zippy: SATU-SATUNYA tempat mendefinisikan sebuah blok. Setiap entri memuat
//   - tampilan Blockly (`tampilan`, JSON blok tanpa `type`, tanpa mengimpor Blockly sehingga aman dipakai server),
//   - cara penerjemah menjalankannya (`jalankan` untuk perintah, bidang `kali`/`isi` untuk wadah),
//   - aturan isian (`kali` min/maks) yang dipakai validasi program.
// Menambah blok baru (mis. percabangan atau variabel di Level 2 dan 3) cukup menambah satu entri di sini lalu
// mendaftarkan namanya di kolom `blok_tersedia` labirin; komponen halaman, penerjemah, dan validasi tidak berubah.
// Blok Level 1 saja yang ada sekarang.

/** Arah hadap berurutan searah jarum jam (belok kanan = indeks + 1). */
export const ARAH = Object.freeze(['atas', 'kanan', 'bawah', 'kiri']);
/** Perpindahan satu petak per arah, sejajar dengan ARAH (x ke kanan, y ke bawah). */
const SELISIH = Object.freeze([
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]);

/** Batas keamanan dan isian program (penjaga server dari program yang ganas). */
export const BATAS_PROGRAM = Object.freeze({
  /** Total perintah (maju/belok) yang boleh dijalankan sebelum program dihentikan. */
  maksLangkah: 500,
  /** Kedalaman blok wadah (ulangi di dalam ulangi) maksimal. */
  maksKedalaman: 3,
  /** Jumlah node program (semua blok termasuk isi wadah) maksimal yang diterima. */
  maksNode: 300,
});

/** Blok bergerak: pindah satu petak ke depan; menabrak bila petak depan dinding atau di luar papan. */
function jalankanMaju(keadaan, { bisaDilewati }) {
  const { dx, dy } = SELISIH[keadaan.arah];
  const x = keadaan.x + dx;
  const y = keadaan.y + dy;
  // petak depan dinding/di luar grid: tetap di tempat dan ditandai menabrak
  if (!bisaDilewati(x, y)) return { ...keadaan, menabrak: true };
  return { ...keadaan, x, y };
}

/** Definisi blok per tipe. `jenis`: 'perintah' (satu langkah) atau 'wadah' (berisi daftar perintah, diulang `kali`). */
export const DAFTAR_BLOK = Object.freeze({
  maju: {
    jenis: 'perintah',
    tampilan: { message0: t('blockly.blok.maju'), style: 'blok_gerak', tooltip: t('blockly.tip.maju') },
    jalankan: jalankanMaju,
  },
  belok_kiri: {
    jenis: 'perintah',
    tampilan: { message0: t('blockly.blok.belok_kiri'), style: 'blok_belok', tooltip: t('blockly.tip.belok_kiri') },
    jalankan: (keadaan) => ({ ...keadaan, arah: (keadaan.arah + 3) % 4 }),
  },
  belok_kanan: {
    jenis: 'perintah',
    tampilan: { message0: t('blockly.blok.belok_kanan'), style: 'blok_belok', tooltip: t('blockly.tip.belok_kanan') },
    jalankan: (keadaan) => ({ ...keadaan, arah: (keadaan.arah + 1) % 4 }),
  },
  ulangi: {
    jenis: 'wadah',
    // jumlah pengulangan: bilangan bulat dalam rentang ini (dipakai blok Blockly, validasi, dan penerjemah)
    kali: Object.freeze({ min: 2, maks: 10 }),
    // nama bidang angka dan input isi pada blok Blockly (dipakai pembaca workspace)
    bidangKali: 'KALI',
    inputIsi: 'ISI',
    tampilan: {
      message0: t('blockly.blok.ulangi'),
      args0: [
        { type: 'field_number', name: 'KALI', value: 2, min: 2, max: 10, precision: 1 },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'ISI' },
      ],
      style: 'blok_ulangi',
      tooltip: t('blockly.tip.ulangi'),
    },
  },
});

/** Blok pangkal program ("Mulai"): bukan perintah, tidak masuk daftar blok tersedia dan tidak dihitung. */
export const BLOK_MULAI = Object.freeze({
  type: 'mulai',
  message0: t('blockly.blok.mulai'),
  nextStatement: null,
  style: 'blok_mulai',
  tooltip: t('blockly.tip.mulai'),
});

/** Nama tipe blok yang dikenal. */
export const TIPE_BLOK = Object.freeze(Object.keys(DAFTAR_BLOK));

/** Definisi JSON semua blok untuk Blockly (`defineBlocksWithJsonArray`): blok perintah/wadah ditambah pangkal "Mulai". */
export function definisiBlokJson() {
  const perintah = Object.entries(DAFTAR_BLOK).map(([type, def]) => ({
    type,
    previousStatement: null,
    nextStatement: null,
    ...def.tampilan,
  }));
  return [BLOK_MULAI, ...perintah];
}

/** Apakah sebuah node program berbentuk objek biasa (bukan array/null). */
function objekBiasa(nilai) {
  return nilai != null && typeof nilai === 'object' && !Array.isArray(nilai);
}

/**
 * Memeriksa program tanpa rekursi (aman untuk program yang bersarang sangat dalam): tiap node harus objek dengan tipe
 * yang dikenal (dan tersedia di labirin bila `tersedia` diberikan), tanpa kunci asing, `kali` bulat dalam rentang,
 * `isi` berupa daftar, kedalaman wadah dan jumlah node dalam batas. Hasil: daftar { jalur, pesan }; kosong = sah.
 */
export function periksaProgram(program, { tersedia = null } = {}) {
  const galat = [];
  if (!Array.isArray(program)) return [{ jalur: [], pesan: t('blockly.galat.programBukanDaftar') }];
  const tumpukan = [{ daftar: program, jalur: [], kedalaman: 0 }];
  let jumlah = 0;
  while (tumpukan.length > 0) {
    const { daftar, jalur, kedalaman } = tumpukan.pop();
    for (const [i, node] of daftar.entries()) {
      const lokasi = [...jalur, i];
      jumlah += 1;
      // terlalu banyak node: berhenti memeriksa lebih jauh, cukup satu pesan
      if (jumlah > BATAS_PROGRAM.maksNode) return [...galat, { jalur: lokasi, pesan: t('blockly.galat.terlaluBesar', { maks: BATAS_PROGRAM.maksNode }) }];
      const def = objekBiasa(node) && Object.hasOwn(DAFTAR_BLOK, node.blok) ? DAFTAR_BLOK[node.blok] : null;
      if (!def) {
        galat.push({ jalur: lokasi, pesan: t('blockly.galat.blokTidakDikenal', { blok: String(node?.blok ?? '') }) });
        continue;
      }
      if (tersedia && !tersedia.includes(node.blok)) galat.push({ jalur: lokasi, pesan: t('blockly.galat.blokTidakTersedia', { blok: node.blok }) });
      const kunciSah = def.jenis === 'wadah' ? ['blok', 'kali', 'isi'] : ['blok'];
      const asing = Object.keys(node).filter((k) => !kunciSah.includes(k));
      if (asing.length > 0) galat.push({ jalur: lokasi, pesan: t('blockly.galat.kunciAsing', { kunci: asing.join(', ') }) });
      if (def.jenis !== 'wadah') continue;
      if (!Number.isInteger(node.kali) || node.kali < def.kali.min || node.kali > def.kali.maks) galat.push({ jalur: [...lokasi, 'kali'], pesan: t('blockly.galat.kali', { min: def.kali.min, maks: def.kali.maks }) });
      // wadah di kedalaman maksimal tidak boleh punya wadah lagi di dalamnya
      if (!Array.isArray(node.isi)) galat.push({ jalur: [...lokasi, 'isi'], pesan: t('blockly.galat.isiBukanDaftar') });
      else if (kedalaman + 1 > BATAS_PROGRAM.maksKedalaman) galat.push({ jalur: lokasi, pesan: t('blockly.galat.terlaluDalam', { maks: BATAS_PROGRAM.maksKedalaman }) });
      else tumpukan.push({ daftar: node.isi, jalur: [...lokasi, 'isi'], kedalaman: kedalaman + 1 });
    }
  }
  return galat;
}

/** Jumlah blok sebuah program (sudah lolos periksaProgram): setiap blok termasuk wadah dan seluruh isinya; "Mulai" tidak dihitung. */
export function hitungBlok(program) {
  let jumlah = 0;
  const tumpukan = [program];
  while (tumpukan.length > 0) {
    for (const node of tumpukan.pop()) {
      jumlah += 1;
      if (DAFTAR_BLOK[node.blok].jenis === 'wadah') tumpukan.push(node.isi);
    }
  }
  return jumlah;
}
