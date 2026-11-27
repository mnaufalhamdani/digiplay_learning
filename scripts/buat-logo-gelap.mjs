// Membuat versi tema gelap dari tiga logo bawaan (public/aset/logo): tulisan "Learning" dan garis tepi ikon yang berwarna
// biru tua digeser ke warna terang agar terbaca di latar gelap. Warna cerah (biru, oranye) tidak diubah dan tidak ada latar putih.
// Algoritmanya ada di src/utils/logoGelap.js (dipakai juga untuk logo unggahan admin).
// Jalankan: node scripts/buat-logo-gelap.mjs   (hasil: logo-landscape-gelap.png, logo-persegi-gelap.png, logo-persegi-teks-gelap.png).
// Bisa diulang kapan saja; berkas gelap boleh diganti versi dari desainer.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buatLogoGelap } from '../src/utils/logoGelap.js';

const FOLDER = path.join(process.cwd(), 'public', 'aset', 'logo');
const BERKAS = ['logo-landscape', 'logo-persegi', 'logo-persegi-teks'];

for (const nama of BERKAS) {
  const hasil = await buatLogoGelap(await fs.readFile(path.join(FOLDER, `${nama}.png`)));
  await fs.writeFile(path.join(FOLDER, `${nama}-gelap.png`), hasil);
  console.log(`${nama}-gelap.png dibuat (${hasil.length} byte)`);
}
