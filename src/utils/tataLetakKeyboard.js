// Tata letak QWERTY sederhana untuk KeyboardVisual dan PetaPanasKeyboard. Tiap tombol: label, kunci detail_tombol,
// lebar (satuan tombol), dan jari yang dianjurkan untuk mengetik 10 jari.

/** Jari: kode -> label teks dan indeks warna (kelingking, manis, tengah, telunjuk, jempol). */
export const JARI = Object.freeze({
  kk: { label: 'kelingking kiri', warna: 0 },
  mk: { label: 'jari manis kiri', warna: 1 },
  tk: { label: 'jari tengah kiri', warna: 2 },
  lk: { label: 'telunjuk kiri', warna: 3 },
  lt: { label: 'telunjuk kanan', warna: 3 },
  tt: { label: 'jari tengah kanan', warna: 2 },
  mt: { label: 'jari manis kanan', warna: 1 },
  kt: { label: 'kelingking kanan', warna: 0 },
  jp: { label: 'jempol', warna: 4 },
});

/** Membuat baris tombol dari deret karakter dan deret kode jari yang sejajar. */
function baris(karakter, jari, geser) {
  return { geser, tombol: [...karakter].map((c, i) => ({ label: c.toUpperCase(), kunci: c, lebar: 1, jari: jari[i] })) };
}

/** Empat baris huruf/angka + baris spasi. `geser` = jarak awal baris (satuan tombol). */
export const BARIS_KEYBOARD = Object.freeze([
  baris('1234567890', ['kk', 'mk', 'tk', 'lk', 'lk', 'lt', 'lt', 'tt', 'mt', 'kt'], 0),
  baris('qwertyuiop', ['kk', 'mk', 'tk', 'lk', 'lk', 'lt', 'lt', 'tt', 'mt', 'kt'], 0.5),
  baris("asdfghjkl;'", ['kk', 'mk', 'tk', 'lk', 'lk', 'lt', 'lt', 'tt', 'mt', 'kt', 'kt'], 0.75),
  baris('zxcvbnm,./', ['kk', 'mk', 'tk', 'lk', 'lk', 'lt', 'lt', 'tt', 'mt', 'kt'], 1.25),
  { geser: 3, tombol: [{ label: 'SPASI', kunci: 'spasi', lebar: 6, jari: 'jp' }] },
]);

/** Mencari tombol untuk sebuah karakter (huruf besar memakai tombol huruf kecilnya); null bila tidak ada di tata letak. */
export function cariTombol(karakter) {
  const kunci = karakter === ' ' ? 'spasi' : String(karakter ?? '').toLowerCase();
  for (const b of BARIS_KEYBOARD) {
    const tombol = b.tombol.find((x) => x.kunci === kunci);
    if (tombol) return tombol;
  }
  return null;
}
