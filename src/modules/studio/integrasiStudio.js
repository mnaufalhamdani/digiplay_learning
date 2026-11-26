import * as Blockly from 'blockly/core';
import * as LocaleId from 'blockly/msg/id';
import { t } from '@/utils/i18n';
import { DAFTAR_BLOK_STUDIO, KATEGORI_STUDIO, NAMA_TOPI } from '@/modules/shared/blockly/daftarBlokStudio';
import { BATAS_STUDIO } from '@/modules/shared/blockly/pustakaStudio';
import { WARNA_AREA, sesuaikanUkuran } from '@/modules/blockly/integrasiBlockly';

// Jembatan Studio Zippy ke pustaka Blockly (hanya dimuat di halaman yang memakainya lewat import dinamis tanpa SSR).
// Semua yang khas blok (tampilan, nama bidang, cara dibaca) datang dari DAFTAR_BLOK_STUDIO; berkas ini tidak tahu blok
// apa saja yang ada, jadi menambah blok baru tidak mengubahnya. Program yang dibaca dan dimuat adalah JSON proyek kita
// sendiri (bukan kode hasil generator). Nama tipe Blockly diberi awalan `studio_` agar tidak bentrok dengan blok
// Coding Zippy Level 1 (mis. "ulangi") yang hidup di pustaka Blockly yang sama.

export { sesuaikanUkuran };

/** Awalan tipe Blockly semua blok studio. */
const AWALAN = 'studio_';
/** Tipe blok angka bawaan (bayangan di tiap isian angka). */
const TIPE_ANGKA = `${AWALAN}angka`;
/** Tipe blok teks bawaan (bayangan di tiap isian bebas: angka atau teks). */
const TIPE_TEKS = `${AWALAN}teks`;
/** Kunci tombol "Buat variabel" di flyout kategori Variabel. */
const TOMBOL_VARIABEL = 'STUDIO_BUAT_VARIABEL';
/** Nama bidang/input Blockly dari nama bidang registri. */
const kunciBlockly = (nama) => nama.toUpperCase();
/** Tema yang sudah dibuat (dibuat sekali per nama). */
const tema = {};

/**
 * Sumber data proyek untuk pilihan dinamis (variabel dan sprite). Diatur halaman lewat `aturSumberStudio` dan dibaca
 * saat dropdown dibuka; `tambahan` memuat nilai lama yang dipakai skrip tetapi sudah dihapus dari proyek, agar blok
 * yang merujuknya tetap tampil (dan di penerjemah dianggap 0 atau salah).
 */
const sumber = { variabel: () => ['skor'], sprite: () => [] };
const tambahan = { variabel: new Set(), sprite: new Set() };

/** Mengatur sumber pilihan dinamis: `variabel` = daftar nama, `sprite` = daftar { id, label } sprite lain di proyek. */
export function aturSumberStudio({ variabel, sprite }) {
  sumber.variabel = () => variabel;
  sumber.sprite = () => sprite;
}

/** Pilihan dropdown dinamis untuk `jenis` (variabel atau sprite) dalam bentuk [label, nilai]. */
function opsiDinamis(jenis) {
  const dasar = jenis === 'variabel' ? sumber.variabel().map((nama) => [nama, nama]) : [[t('studio.pilihSprite2'), ''], ...sumber.sprite().map((s) => [s.label, s.id])];
  const ada = new Set(dasar.map((o) => o[1]));
  // nilai yang dipakai skrip tetapi sudah dihapus dari proyek tetap muncul agar blok tidak berubah diam-diam
  for (const nilai of tambahan[jenis]) if (!ada.has(nilai)) dasar.push([jenis === 'variabel' ? nilai : t('studio.spriteDihapus'), nilai]);
  return dasar;
}

/** Membatasi angka ke rentang bidang dan membulatkan bila bidang meminta bilangan bulat. */
function rapikanAngka(nilai, b) {
  const n = Number.isFinite(nilai) ? nilai : b.awal;
  const dalam = Math.min(b.maks, Math.max(b.min, n));
  return b.bulat ? Math.round(dalam) : dalam;
}

/** Isian bebas dibaca dari teks: teks angka baku ("12", "-3.5") menjadi angka, selain itu tetap teks (dipotong). */
function rapikanBebas(teks) {
  const s = String(teks ?? '');
  const n = Number(s);
  // hanya teks yang persis sama dengan angkanya (tanpa nol di depan, spasi, atau koma) dijadikan angka
  if (s !== '' && Number.isFinite(n) && String(n) === s && Math.abs(n) <= BATAS_STUDIO.maksAngka) return n;
  return s.slice(0, BATAS_STUDIO.maksNilaiTeks);
}

/** Nama ekstensi Blockly untuk satu isian pilihan dinamis. */
const namaEkstensi = (nama, bidang) => `${AWALAN}dinamis_${nama}_${bidang}`;

/** Definisi JSON satu blok Blockly dari entri registri: tampilan, isian, dan sambungan sesuai jenisnya. */
function jsonBlok(nama, def) {
  const args0 = [];
  const ekstensi = [];
  for (const b of def.bidang) {
    const kunci = kunciBlockly(b.nama);
    if (b.jenis === 'angka') args0.push({ type: 'input_value', name: kunci, check: 'Number' });
    // isian bebas menerima blok apa pun (angka atau teks)
    else if (b.jenis === 'bebas') args0.push({ type: 'input_value', name: kunci });
    else if (b.jenis === 'teks') args0.push({ type: 'field_input', name: kunci, text: b.awal, spellcheck: false, maxLength: b.maks });
    else if (b.jenis === 'pilihan' && b.dinamis) {
      // daftar pilihan dibaca dari proyek saat dropdown dibuka (lewat ekstensi); isi awal hanya penampung
      args0.push({ type: 'field_dropdown', name: kunci, options: [[b.awal || '...', b.awal]] });
      ekstensi.push(namaEkstensi(nama, b.nama));
    } else if (b.jenis === 'pilihan') args0.push({ type: 'field_dropdown', name: kunci, options: b.nilai.map((v) => [b.label(v), v]) });
    else if (b.jenis === 'kondisi') args0.push({ type: 'input_value', name: kunci, check: 'Boolean' });
    // isi: pemisah baris lalu daftar perintah (pesan di locales memuat penanda untuk keduanya)
    else if (b.jenis === 'isi') args0.push({ type: 'input_dummy' }, { type: 'input_statement', name: kunci });
  }
  const json = { type: `${AWALAN}${nama}`, message0: t(`studio.blok.${nama}`), style: `${AWALAN}${def.kategori}`, tooltip: t(`studio.tip.${nama}`), inputsInline: true };
  if (args0.length > 0) json.args0 = args0;
  if (ekstensi.length > 0) json.extensions = ekstensi;
  if (def.jenis === 'topi') json.nextStatement = null;
  // blok nilai: angka (Number) atau bebas (null = angka atau teks); blok syarat: Boolean
  else if (def.jenis === 'nilai') json.output = def.keluaran === 'bebas' ? null : 'Number';
  else if (def.jenis === 'kondisi') json.output = 'Boolean';
  else Object.assign(json, { previousStatement: null, nextStatement: null });
  return json;
}

/** Menyiapkan Blockly sekali untuk studio: bahasa Indonesia, blok angka dan teks bawaan, ekstensi pilihan dinamis, dan semua blok dari registri. */
let siap = false;
export function siapkanBlokStudio() {
  if (siap) return;
  Blockly.setLocale(LocaleId);
  // ekstensi: mengganti daftar pilihan dropdown dengan pembaca data proyek
  for (const [nama, def] of Object.entries(DAFTAR_BLOK_STUDIO)) {
    for (const b of def.bidang) {
      if (b.jenis === 'pilihan' && b.dinamis) {
        Blockly.Extensions.register(namaEkstensi(nama, b.nama), function pasangPilihan() {
          this.getField(kunciBlockly(b.nama)).setOptions(() => opsiDinamis(b.dinamis));
        });
      }
    }
  }
  const angka = { type: TIPE_ANGKA, message0: '%1', args0: [{ type: 'field_number', name: 'NILAI', value: 0, min: -99999, max: 99999 }], output: 'Number', style: `${AWALAN}operator` };
  const teks = { type: TIPE_TEKS, message0: '%1', args0: [{ type: 'field_input', name: 'TEKS', text: '', spellcheck: false, maxLength: BATAS_STUDIO.maksNilaiTeks }], output: null, style: `${AWALAN}operator` };
  Blockly.common.defineBlocksWithJsonArray([angka, teks, ...Object.entries(DAFTAR_BLOK_STUDIO).map(([nama, def]) => jsonBlok(nama, def))]);
  siap = true;
}

/** Tema Blockly studio terang atau gelap: turunan Zelos dengan warna kategori dan warna area siswa. */
export function ambilTemaStudio(gelap) {
  const nama = gelap ? 'studio_gelap' : 'studio_terang';
  tema[nama] ??= Blockly.Theme.defineTheme(nama, {
    base: Blockly.Themes.Zelos,
    blockStyles: Object.fromEntries(KATEGORI_STUDIO.map((k) => [`${AWALAN}${k.kode}`, { colourPrimary: k.warna, ...(k.hat ? { hat: 'cap' } : {}) }])),
    componentStyles: WARNA_AREA[gelap ? 'gelap' : 'terang'],
    fontStyle: { family: 'Nunito, ui-sans-serif, system-ui, sans-serif', weight: '700', size: 13 },
  });
  return tema[nama];
}

/** Satu blok untuk toolbox lengkap dengan isian awalnya (angka dan isian bebas memakai blok bayangan bernilai awal). */
function itemToolbox(nama) {
  const def = DAFTAR_BLOK_STUDIO[nama];
  const inputs = {};
  const fields = {};
  for (const b of def.bidang) {
    if (b.jenis === 'angka') inputs[kunciBlockly(b.nama)] = { shadow: { type: TIPE_ANGKA, fields: { NILAI: b.awal } } };
    else if (b.jenis === 'bebas') inputs[kunciBlockly(b.nama)] = { shadow: { type: TIPE_TEKS, fields: { TEKS: String(b.awal) } } };
    else if (b.jenis === 'teks' || b.jenis === 'pilihan') fields[kunciBlockly(b.nama)] = b.awal;
  }
  return { kind: 'block', type: `${AWALAN}${nama}`, inputs, fields };
}

/**
 * Toolbox berkategori (warna per kategori) berisi hanya blok dari `blokTersedia`, sesuai urutan registri. Kategori
 * Variabel Level 3 diawali tombol "Buat variabel" (hanya bila blok variabel buatan sendiri tersedia).
 */
export function buatToolboxStudio(blokTersedia) {
  const contents = KATEGORI_STUDIO.map((k) => {
    const blok = blokTersedia.filter((n) => Object.hasOwn(DAFTAR_BLOK_STUDIO, n) && DAFTAR_BLOK_STUDIO[n].kategori === k.kode).map(itemToolbox);
    const tombol = k.kode === 'variabel' && blokTersedia.includes('atur_variabel') ? [{ kind: 'button', text: t('studio.buatVariabel'), callbackKey: TOMBOL_VARIABEL }] : [];
    return { kind: 'category', name: t(`studio.kategori.${k.kode}`), colour: k.warna, contents: [...tombol, ...blok] };
  }).filter((k) => k.contents.length > 0);
  return { kind: 'categoryToolbox', contents };
}

/**
 * Memasang workspace Blockly studio di `elemen`. Mode edit memakai toolbox berkategori (`horizontal`: toolbox di atas
 * untuk layar sempit); `bacaSaja` memasang susunan blok tanpa toolbox dan tanpa bisa diubah (pratinjau tutor).
 * `onBuatVariabel` dipanggil saat tombol "Buat variabel" di flyout ditekan.
 */
export function pasangWorkspaceStudio(elemen, { blokTersedia, gelap, horizontal = false, bacaSaja = false, onBuatVariabel = null }) {
  siapkanBlokStudio();
  const dasar = {
    theme: ambilTemaStudio(gelap),
    renderer: 'zelos',
    // suara dimatikan; media diarahkan ke jalur lokal agar tidak ada permintaan ke server pihak ketiga
    sounds: false,
    media: '/aset/blockly/',
    // tong sampah dan tombol zoom memakai gambar sprite Blockly yang tidak kita sertakan: hapus dengan menyeret blok
    // kembali ke toolbox atau menekan Delete, zoom lewat cubit di layar sentuh
    trashcan: false,
    scrollbars: true,
    zoom: { controls: false, wheel: false, pinch: true, startScale: 0.9, maxScale: 1.6, minScale: 0.5, scaleSpeed: 1.2 },
    move: { scrollbars: true, drag: true, wheel: false },
  };
  const ws = Blockly.inject(elemen, bacaSaja ? { ...dasar, readOnly: true } : { ...dasar, toolbox: buatToolboxStudio(blokTersedia), horizontalLayout: horizontal, toolboxPosition: 'start' });
  // blok yang tidak tersambung ke blok kejadian dinonaktifkan (abu-abu) supaya jelas tidak ikut dijalankan
  if (!bacaSaja) {
    ws.addChangeListener(Blockly.Events.disableOrphans);
    ws.registerButtonCallback(TOMBOL_VARIABEL, () => onBuatVariabel?.());
  }
  return ws;
}

/** Nama blok (tanpa awalan) dari tipe Blockly. */
const namaDariTipe = (tipe) => tipe.slice(AWALAN.length);

/** Membaca semua isian satu blok menjadi objek bidang program (angka dirapikan ke rentangnya). */
function bacaBidang(blok, def) {
  const hasil = {};
  for (const b of def.bidang) {
    const kunci = kunciBlockly(b.nama);
    if (b.jenis === 'angka') {
      const target = blok.getInputTargetBlock(kunci);
      // bayangan angka atau blok nilai (angka acak, skor) yang dipasang di isian
      if (!target) hasil[b.nama] = b.awal;
      else if (target.type === TIPE_ANGKA) hasil[b.nama] = rapikanAngka(Number(target.getFieldValue('NILAI')), b);
      else hasil[b.nama] = bacaBlokNilai(target);
    } else if (b.jenis === 'bebas') {
      const target = blok.getInputTargetBlock(kunci);
      // bayangan teks (angka baku menjadi angka) atau blok nilai
      if (!target) hasil[b.nama] = rapikanBebas(b.awal);
      else if (target.type === TIPE_TEKS) hasil[b.nama] = rapikanBebas(target.getFieldValue('TEKS'));
      else hasil[b.nama] = bacaBlokNilai(target);
    } else if (b.jenis === 'teks') hasil[b.nama] = String(blok.getFieldValue(kunci) ?? '').slice(0, b.maks);
    else if (b.jenis === 'pilihan') hasil[b.nama] = blok.getFieldValue(kunci);
    else if (b.jenis === 'kondisi') {
      const target = blok.getInputTargetBlock(kunci);
      // syarat kosong dibaca null (dianggap salah)
      hasil[b.nama] = target ? bacaBlokNilai(target) : null;
    } else if (b.jenis === 'isi') hasil[b.nama] = bacaRantai(blok.getInputTargetBlock(kunci));
  }
  return hasil;
}

/** Membaca satu blok nilai/syarat (reporter) menjadi node program. */
function bacaBlokNilai(blok) {
  const nama = namaDariTipe(blok.type);
  return { blok: nama, ...bacaBidang(blok, DAFTAR_BLOK_STUDIO[nama]) };
}

/** Membaca deretan perintah mulai dari `blok` (ikut ke blok berikutnya) menjadi daftar node program. */
function bacaRantai(blok) {
  const daftar = [];
  for (let b = blok; b; b = b.getNextBlock()) {
    // blok yang dinonaktifkan pengguna tidak ikut dijalankan
    if (!b.isEnabled()) continue;
    const nama = namaDariTipe(b.type);
    daftar.push({ blok: nama, ...bacaBidang(b, DAFTAR_BLOK_STUDIO[nama]) });
  }
  return daftar;
}

/** Daftar skrip (format JSON proyek) dari workspace: hanya rantai yang tersambung ke blok kejadian yang aktif. */
export function skripDariWorkspace(ws) {
  return ws
    .getTopBlocks(true)
    .filter((b) => b.isEnabled() && NAMA_TOPI.includes(namaDariTipe(b.type)))
    .map((b) => {
      const nama = namaDariTipe(b.type);
      const posisi = b.getRelativeToSurfaceXY();
      return { kejadian: nama, ...bacaBidang(b, DAFTAR_BLOK_STUDIO[nama]), isi: bacaRantai(b.getNextBlock()), x: Math.round(posisi.x), y: Math.round(posisi.y) };
    });
}

/** Isian dan input untuk satu node program dalam format serialisasi Blockly. */
function negaraBidang(def, node) {
  const fields = {};
  const inputs = {};
  for (const b of def.bidang) {
    const kunci = kunciBlockly(b.nama);
    const nilai = node[b.nama];
    if (b.jenis === 'angka') {
      const bayangan = { type: TIPE_ANGKA, fields: { NILAI: typeof nilai === 'number' ? nilai : b.awal } };
      // angka biasa menjadi bayangan; blok nilai dipasang di atas bayangan agar bisa dilepas kembali ke angka
      inputs[kunci] = typeof nilai === 'object' && nilai !== null ? { shadow: { type: TIPE_ANGKA, fields: { NILAI: b.awal } }, block: negaraBlok(nilai) } : { shadow: bayangan };
    } else if (b.jenis === 'bebas') {
      const bayangan = { type: TIPE_TEKS, fields: { TEKS: String(typeof nilai === 'object' && nilai !== null ? b.awal : (nilai ?? b.awal)) } };
      inputs[kunci] = typeof nilai === 'object' && nilai !== null ? { shadow: { type: TIPE_TEKS, fields: { TEKS: String(b.awal) } }, block: negaraBlok(nilai) } : { shadow: bayangan };
    } else if (b.jenis === 'teks' || b.jenis === 'pilihan') fields[kunci] = nilai;
    else if (b.jenis === 'kondisi') {
      if (nilai) inputs[kunci] = { block: negaraBlok(nilai) };
    } else if (b.jenis === 'isi') {
      const pertama = negaraRantai(nilai);
      if (pertama) inputs[kunci] = { block: pertama };
    }
  }
  return { fields, inputs };
}

/** Satu node program menjadi blok serialisasi (tanpa `next`). */
function negaraBlok(node) {
  const nama = node.blok ?? node.kejadian;
  return { type: `${AWALAN}${nama}`, ...negaraBidang(DAFTAR_BLOK_STUDIO[nama], node) };
}

/** Daftar perintah menjadi rantai blok bersambung lewat `next`; null bila kosong. Dibangun dari ujung agar tanpa rekursi. */
function negaraRantai(daftar) {
  let berikut = null;
  for (let i = daftar.length - 1; i >= 0; i -= 1) {
    const blok = negaraBlok(daftar[i]);
    if (berikut) blok.next = { block: berikut };
    berikut = blok;
  }
  return berikut;
}

/** Nilai pilihan dinamis (nama variabel dan ID sprite) yang dipakai skrip; dikumpulkan tanpa rekursi. */
function kumpulkanDinamis(skripDaftar) {
  const hasil = { variabel: new Set(), sprite: new Set() };
  const tumpukan = [...skripDaftar];
  while (tumpukan.length > 0) {
    const node = tumpukan.pop();
    if (node === null || typeof node !== 'object') continue;
    if (Array.isArray(node)) {
      tumpukan.push(...node);
      continue;
    }
    const def = DAFTAR_BLOK_STUDIO[node.blok ?? node.kejadian];
    if (def) for (const b of def.bidang) if (b.jenis === 'pilihan' && b.dinamis && typeof node[b.nama] === 'string') hasil[b.dinamis].add(node[b.nama]);
    for (const nilai of Object.values(node)) if (nilai !== null && typeof nilai === 'object') tumpukan.push(nilai);
  }
  return hasil;
}

/**
 * Mengosongkan workspace lalu memuat daftar skrip sprite (ruang kerja satu sprite). Peristiwa dimatikan selama memuat
 * supaya tidak dianggap perubahan oleh pengguna, dan riwayat urungkan dibersihkan. Skrip tanpa posisi ditumpuk ke bawah.
 */
export function muatSkrip(ws, skripDaftar) {
  // nilai lama yang sudah dihapus dari proyek disiapkan lebih dulu agar dropdown tidak menggantinya diam-diam
  const dipakai = kumpulkanDinamis(skripDaftar);
  tambahan.variabel = dipakai.variabel;
  tambahan.sprite = dipakai.sprite;
  Blockly.Events.disable();
  try {
    const blocks = skripDaftar.map((s, i) => {
      const pertama = negaraRantai(s.isi);
      return { ...negaraBlok(s), x: s.x ?? 24, y: s.y ?? 24 + i * 170, ...(pertama ? { next: { block: pertama } } : {}) };
    });
    Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks } }, ws);
    ws.clearUndo();
  } finally {
    Blockly.Events.enable();
  }
}
