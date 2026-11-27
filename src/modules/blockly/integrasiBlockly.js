import * as Blockly from 'blockly/core';
import * as LocaleId from 'blockly/msg/id';
import { DAFTAR_BLOK, definisiBlokJson } from '@/modules/shared/blockly/daftarBlok';

// Jembatan ke pustaka Blockly (hanya dimuat di halaman Coding Zippy lewat import dinamis tanpa SSR). Semua yang
// khas blok (tampilan, nama bidang, cara dibaca) datang dari DAFTAR_BLOK; berkas ini tidak tahu blok apa saja yang ada,
// jadi menambah blok baru tidak mengubahnya. Program yang dibaca adalah JSON kita sendiri, bukan kode hasil generator.

/** Warna blok (teks putih di atasnya lolos kontras AA 4.5:1). */
const WARNA_BLOK = {
  blok_mulai: { colourPrimary: '#15803D', colourSecondary: '#22A456', colourTertiary: '#0F5F2D' },
  blok_gerak: { colourPrimary: '#1D4ED8', colourSecondary: '#3B6EF0', colourTertiary: '#1639A6' },
  blok_belok: { colourPrimary: '#7E22CE', colourSecondary: '#9640E2', colourTertiary: '#601BA0' },
  blok_ulangi: { colourPrimary: '#C2410C', colourSecondary: '#E0581F', colourTertiary: '#92300A' },
};
/** Warna area kerja per tema; nilainya sama dengan token area siswa (design-tokens.css). */
export const WARNA_AREA = {
  terang: { workspaceBackgroundColour: '#F3F8FF', toolboxBackgroundColour: '#E2EFFF', toolboxForegroundColour: '#1B2A4D', flyoutBackgroundColour: '#E2EFFF', flyoutForegroundColour: '#1B2A4D', flyoutOpacity: 1, scrollbarColour: '#52617F', scrollbarOpacity: 0.6, insertionMarkerColour: '#1B2A4D', insertionMarkerOpacity: 0.3, selectedGlowColour: '#FF8A1F', replacementGlowColour: '#FF8A1F', cursorColour: '#0A66D8' },
  gelap: { workspaceBackgroundColour: '#0F1A3C', toolboxBackgroundColour: '#1E3672', toolboxForegroundColour: '#EEF4FF', flyoutBackgroundColour: '#1E3672', flyoutForegroundColour: '#EEF4FF', flyoutOpacity: 1, scrollbarColour: '#AFBEE3', scrollbarOpacity: 0.6, insertionMarkerColour: '#EEF4FF', insertionMarkerOpacity: 0.3, selectedGlowColour: '#FFAA4D', replacementGlowColour: '#FFAA4D', cursorColour: '#5DA8FF' },
};
/** Tema yang sudah dibuat (dibuat sekali per nama). */
const tema = {};

/** Menyiapkan Blockly sekali: bahasa Indonesia dan definisi semua blok dari DAFTAR_BLOK. */
let siap = false;
export function siapkanBlockly() {
  if (siap) return;
  Blockly.setLocale(LocaleId);
  Blockly.common.defineBlocksWithJsonArray(definisiBlokJson());
  siap = true;
}

/** Tema Blockly terang atau gelap (turunan tema Zelos yang ramah anak dengan warna blok dan area siswa). */
export function ambilTema(gelap) {
  const nama = gelap ? 'zippy_gelap' : 'zippy_terang';
  tema[nama] ??= Blockly.Theme.defineTheme(nama, {
    base: Blockly.Themes.Zelos,
    blockStyles: WARNA_BLOK,
    componentStyles: WARNA_AREA[gelap ? 'gelap' : 'terang'],
    fontStyle: { family: 'Nunito, ui-sans-serif, system-ui, sans-serif', weight: '700', size: 13 },
  });
  return tema[nama];
}

/** Toolbox datar (flyout) berisi hanya blok dari `blok_tersedia` labirin, sesuai urutannya. */
export function buatToolbox(blokTersedia) {
  return { kind: 'flyoutToolbox', contents: blokTersedia.filter((tipe) => Object.hasOwn(DAFTAR_BLOK, tipe)).map((type) => ({ kind: 'block', type })) };
}

/**
 * Memasang workspace Blockly di `elemen` dengan satu blok "Mulai" yang tidak bisa dihapus atau digeser.
 * `horizontal`: toolbox di atas (layar sempit). Mengembalikan workspace.
 */
export function pasangWorkspace(elemen, { blokTersedia, gelap, horizontal }) {
  siapkanBlockly();
  const ws = Blockly.inject(elemen, {
    toolbox: buatToolbox(blokTersedia),
    theme: ambilTema(gelap),
    renderer: 'zelos',
    // suara dimatikan; media diarahkan ke jalur lokal agar tidak ada permintaan ke server pihak ketiga
    sounds: false,
    media: '/aset/blockly/',
    // tong sampah dan tombol zoom memakai gambar sprite Blockly yang tidak kita sertakan (tanpa berkas gambar baru):
    // blok dihapus dengan menyeretnya kembali ke toolbox atau menekan Delete, dan zoom lewat cubit di layar sentuh
    trashcan: false,
    horizontalLayout: horizontal,
    toolboxPosition: 'start',
    scrollbars: true,
    zoom: { controls: false, wheel: false, pinch: true, startScale: 1, maxScale: 1.6, minScale: 0.6, scaleSpeed: 1.2 },
    move: { scrollbars: true, drag: true, wheel: false },
  });
  Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [{ type: 'mulai', x: 24, y: 24, deletable: false, movable: false }] } }, ws);
  // blok yang tidak tersambung ke "Mulai" dinonaktifkan (abu-abu) supaya jelas tidak ikut dijalankan
  ws.addChangeListener(Blockly.Events.disableOrphans);
  return ws;
}

/** Membaca deretan blok mulai dari `blok` (ikut ke blok berikutnya) menjadi daftar perintah program. */
function bacaRantai(blok) {
  const daftar = [];
  for (let b = blok; b; b = b.getNextBlock()) {
    const def = DAFTAR_BLOK[b.type];
    // blok asing (tidak mungkin dari toolbox kita): dilewati
    if (!def) continue;
    if (def.jenis === 'wadah') daftar.push({ blok: b.type, kali: Number(b.getFieldValue(def.bidangKali)), isi: bacaRantai(b.getInputTargetBlock(def.inputIsi)) });
    else daftar.push({ blok: b.type });
  }
  return daftar;
}

/** Program (format JSON kita) dari workspace: hanya rantai blok yang tersambung ke "Mulai". */
export function programDariWorkspace(ws) {
  const mulai = ws.getTopBlocks(false).find((b) => b.type === 'mulai');
  return bacaRantai(mulai?.getNextBlock() ?? null);
}

/** Mengubah ukuran area kerja mengikuti wadahnya. */
export function sesuaikanUkuran(ws) {
  Blockly.svgResize(ws);
}
