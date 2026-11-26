import { NOMOR_SUARA, TEMA_SUARA } from '@/modules/shared/blockly/pustakaStudio';

// Pustaka suara Studio Zippy, TERPUSAT di berkas ini: tiga tema (hewan, musik, alam) masing-masing tiga suara pendek
// yang disintesis dengan Web Audio (osilator dan derau), tanpa berkas suara. Pemilik boleh menggantinya dengan berkas
// suara sungguhan nanti: cukup ubah isi `mainkanSuara` (atau peta SUARA) tanpa menyentuh blok, penerjemah, atau halaman.
// Browser hanya mengizinkan suara setelah ada interaksi pengguna, jadi `siapkanSuara` dipanggil dari klik tombol Jalankan.

let konteks = null;
let bisu = false;
/** Volume utama: semua suara dan musik melewatinya sehingga bisukan berlaku seketika. */
let master = null;

/** Konteks audio bersama; dibuat saat pertama dibutuhkan. Null bila browser tidak mendukung Web Audio. */
function ambilKonteks() {
  if (typeof window === 'undefined') return null;
  if (!konteks) {
    const Audio = window.AudioContext ?? window.webkitAudioContext;
    // browser tanpa Web Audio: tidak ada suara, program tetap berjalan
    if (!Audio) return null;
    konteks = new Audio();
  }
  return konteks;
}

/** Titik keluar semua suara (volume utama); dibuat saat pertama dibutuhkan. */
function keluaran(k) {
  if (!master) {
    master = k.createGain();
    master.gain.value = bisu ? 0 : 1;
    master.connect(k.destination);
  }
  return master;
}

/** Membuka kunci suara (kebijakan autoplay): panggil dari penanganan klik/tombol pengguna. */
export function siapkanSuara() {
  const k = ambilKonteks();
  if (k && k.state === 'suspended') k.resume();
}

/** Menyalakan atau membisukan semua suara studio. */
export function aturBisu(nilai) {
  bisu = Boolean(nilai);
  // musik latar yang sedang berbunyi ikut diam seketika (volume utama 0), dan kembali bunyi saat suara dinyalakan lagi
  if (master) master.gain.value = bisu ? 0 : 1;
}

/** Apakah suara sedang dibisukan. */
export const sedangBisu = () => bisu;

/** Satu nada: osilator dengan bentuk gelombang, frekuensi awal (opsional meluncur ke frekuensi akhir), dan selubung volume. */
function nada(k, { awal = 0, durasi = 0.2, bentuk = 'sine', dari, ke = dari, volume = 0.25 }) {
  const osc = k.createOscillator();
  const gain = k.createGain();
  const t0 = k.currentTime + awal;
  osc.type = bentuk;
  osc.frequency.setValueAtTime(dari, t0);
  // meluncur ke frekuensi akhir sepanjang durasi
  if (ke !== dari) osc.frequency.exponentialRampToValueAtTime(ke, t0 + durasi);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durasi);
  osc.connect(gain).connect(keluaran(k));
  osc.start(t0);
  osc.stop(t0 + durasi + 0.05);
}

/** Derau (desis) dengan filter: untuk hujan, angin, dan drum. `sapuan` mengubah frekuensi filter dari awal ke akhir. */
function derau(k, { awal = 0, durasi = 0.5, jenis = 'lowpass', frekuensi = 1000, sapuan = null, volume = 0.2 }) {
  const jumlah = Math.floor(k.sampleRate * durasi);
  const buffer = k.createBuffer(1, jumlah, k.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < jumlah; i += 1) data[i] = Math.random() * 2 - 1;
  const sumber = k.createBufferSource();
  const filter = k.createBiquadFilter();
  const gain = k.createGain();
  const t0 = k.currentTime + awal;
  sumber.buffer = buffer;
  filter.type = jenis;
  filter.frequency.setValueAtTime(frekuensi, t0);
  if (sapuan) filter.frequency.exponentialRampToValueAtTime(sapuan, t0 + durasi);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durasi);
  sumber.connect(filter).connect(gain).connect(keluaran(k));
  sumber.start(t0);
}

/** Resep tiap suara: "<tema>-<nomor>". */
const SUARA = {
  // hewan: meong, guk-guk, kicau
  'hewan-1': (k) => {
    nada(k, { dari: 700, ke: 450, durasi: 0.35, bentuk: 'triangle' });
    nada(k, { awal: 0.38, dari: 520, ke: 380, durasi: 0.3, bentuk: 'triangle' });
  },
  'hewan-2': (k) => {
    nada(k, { dari: 230, ke: 180, durasi: 0.14, bentuk: 'square', volume: 0.15 });
    nada(k, { awal: 0.2, dari: 230, ke: 170, durasi: 0.14, bentuk: 'square', volume: 0.15 });
  },
  'hewan-3': (k) => {
    for (let i = 0; i < 4; i += 1) nada(k, { awal: i * 0.1, dari: 1800 + (i % 2) * 500, ke: 2400, durasi: 0.08, volume: 0.15 });
  },
  // musik: tangga nada, xilofon, drum
  'musik-1': (k) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nada(k, { awal: i * 0.14, dari: f, durasi: 0.25, bentuk: 'triangle' }));
  },
  'musik-2': (k) => {
    [880, 1108.7, 880].forEach((f, i) => nada(k, { awal: i * 0.18, dari: f, durasi: 0.4, bentuk: 'sine', volume: 0.3 }));
  },
  'musik-3': (k) => {
    nada(k, { dari: 140, ke: 50, durasi: 0.25, volume: 0.5 });
    derau(k, { awal: 0.3, durasi: 0.15, jenis: 'highpass', frekuensi: 4000, volume: 0.15 });
    nada(k, { awal: 0.45, dari: 140, ke: 50, durasi: 0.25, volume: 0.5 });
  },
  // alam: hujan, angin, air
  'alam-1': (k) => derau(k, { durasi: 0.9, jenis: 'highpass', frekuensi: 2500, volume: 0.18 }),
  'alam-2': (k) => derau(k, { durasi: 0.9, jenis: 'bandpass', frekuensi: 300, sapuan: 1200, volume: 0.3 }),
  'alam-3': (k) => {
    for (let i = 0; i < 4; i += 1) nada(k, { awal: i * 0.12, dari: 500 + i * 120, ke: 900 + i * 150, durasi: 0.1, volume: 0.18 });
  },
};

/** Memainkan satu suara tema (`hewan`, `musik`, `alam`) dan nomor 1 sampai 3; nama tidak dikenal diabaikan. */
export function mainkanSuara(tema, nomor) {
  const resep = SUARA[`${tema}-${nomor}`];
  // dibisukan, tema/nomor tidak dikenal, atau browser tanpa Web Audio: tidak ada suara
  if (bisu || !resep || !TEMA_SUARA.includes(tema) || !NOMOR_SUARA.includes(nomor)) return;
  const k = ambilKonteks();
  if (!k) return;
  if (k.state === 'suspended') k.resume();
  resep(k);
}

// ---------------------------------------------------------------------------------------------------------------
// Musik latar (Level 3): tiga suasana berupa pola melodi satu birama yang berulang. Disintesis dengan osilator di
// berkas yang sama, jadi mengganti dengan berkas suara sungguhan cukup mengubah `mulaiMusik` dan `hentikanMusik`.
// ---------------------------------------------------------------------------------------------------------------

/** Pola tiap suasana: tempo (ketukan per menit), gelombang melodi, 8 nada melodi per birama (0 = hening), dan nada bas per birama. */
const MUSIK = {
  ceria: { bpm: 132, bentuk: 'triangle', melodi: [523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 783.99, 1046.5], bas: [130.81, 196, 130.81, 196] },
  tenang: { bpm: 72, bentuk: 'sine', melodi: [392, 0, 440, 0, 523.25, 0, 440, 0], bas: [98, 98, 130.81, 130.81] },
  petualangan: { bpm: 150, bentuk: 'square', melodi: [329.63, 392, 440, 392, 329.63, 293.66, 329.63, 440], bas: [82.41, 82.41, 110, 98] },
};
/** Musik yang sedang berjalan: { suasana, pewaktu } atau null. Hanya satu musik berbunyi pada satu waktu. */
let musikAktif = null;

/** Menjadwalkan satu birama musik mulai sekarang (8 nada melodi + 4 nada bas). */
function jadwalkanBirama(k, pola) {
  const ketuk = 60 / pola.bpm / 2;
  pola.melodi.forEach((f, i) => {
    // nada 0 = jeda
    if (f > 0) nada(k, { awal: i * ketuk, dari: f, durasi: ketuk * 0.9, bentuk: pola.bentuk, volume: 0.07 });
  });
  pola.bas.forEach((f, i) => nada(k, { awal: i * ketuk * 2, dari: f, durasi: ketuk * 1.8, bentuk: 'sine', volume: 0.1 }));
}

/** Mematikan musik latar (tidak ada efek bila tidak sedang berbunyi). */
export function hentikanMusik() {
  if (musikAktif) clearInterval(musikAktif.pewaktu);
  musikAktif = null;
}

/** Memulai musik latar `suasana` (ceria, tenang, petualangan); mengganti musik yang sedang berbunyi. Nama tidak dikenal diabaikan. */
export function mulaiMusik(suasana) {
  const pola = MUSIK[suasana];
  // suasana tidak dikenal atau browser tanpa Web Audio: tidak ada musik
  const k = pola ? ambilKonteks() : null;
  if (!k) return;
  hentikanMusik();
  if (k.state === 'suspended') k.resume();
  const panjangBirama = (60 / pola.bpm / 2) * 8;
  jadwalkanBirama(k, pola);
  // satu birama dijadwalkan tepat sebelum birama sebelumnya selesai, jadi musik berulang tanpa putus
  musikAktif = { suasana, pewaktu: setInterval(() => jadwalkanBirama(k, pola), panjangBirama * 1000) };
}
