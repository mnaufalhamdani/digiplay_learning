import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/** Warna sertifikat: nilai token palet area siswa (design-tokens.css) dan oranye Zippy (design-system.md 7.3). */
const WARNA = Object.freeze({
  krem: '#FFF8EE', // --bg siswa
  ungu: '#6240F0', // --primary siswa
  teks: '#2A2347', // --fg siswa
  redup: '#62598A', // --muted siswa
  garis: '#E9E2F7', // --line siswa
  oranye: '#FF8A1F', // oranye Zippy
  batal: '#C42B31', // --bad siswa
});

/** Ukuran A4 lanskap (point) dan jarak tepi isi. */
const LEBAR = 841.89;
const TINGGI = 595.28;
const TEPI = 70;

/** Berkas font opsional di public/aset/font; tanpa berkas Nunito dipakai Helvetica bawaan PDF. */
const BERKAS_FONT = Object.freeze({ isi: 'Nunito-Regular.ttf', tebal: 'Nunito-Bold.ttf', judul: 'Fredoka-SemiBold.ttf' });
/** Font bawaan PDF (WinAnsi) sebagai cadangan. */
const FONT_BAWAAN = Object.freeze({ isi: 'Helvetica', tebal: 'Helvetica-Bold', judul: 'Helvetica-Bold' });
/** Karakter Windows-1252 di luar Latin-1 yang masih bisa ditulis font bawaan. */
const EKSTRA_WINANSI = new Set([...'€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ']);

/** Mengganti karakter yang tidak bisa ditulis font bawaan (di luar WinAnsi) dengan '?' agar PDF tetap terbentuk. */
function amankanWinAnsi(teks) {
  return [...String(teks ?? '').normalize('NFC')]
    .map((c) => {
      const kode = c.codePointAt(0);
      // ASCII cetak, Latin-1, dan tambahan Windows-1252 aman; sisanya (emoji, aksara lain) diganti
      if ((kode >= 0x20 && kode <= 0x7e) || (kode >= 0xa0 && kode <= 0xff) || EKSTRA_WINANSI.has(c)) return c;
      return kode < 0x20 ? ' ' : '?';
    })
    .join('');
}

/**
 * Pembuat PDF sertifikat (A4 lanskap, satu halaman) dari data snapshot. Font dan maskot dibaca dari `folderAset`
 * sekali lalu disimpan; peringatan font cadangan dicatat ke log satu kali saja.
 */
export function buatPdfSertifikat({ logger, folderAset }) {
  let aset = null; // { font: {isi, tebal, judul}, bawaan, maskot }

  /** Memuat font TTF (bila lengkap) dan gambar Zippy merayakan (bila ada), sekali per proses. */
  function muatAset() {
    if (aset) return aset;
    const jalur = (nama) => path.join(folderAset, 'font', nama);
    const adaNunito = existsSync(jalur(BERKAS_FONT.isi)) && existsSync(jalur(BERKAS_FONT.tebal));
    let font = FONT_BAWAAN;
    if (adaNunito) {
      // Fredoka opsional untuk judul; tanpa itu judul memakai Nunito tebal
      const judul = existsSync(jalur(BERKAS_FONT.judul)) ? readFileSync(jalur(BERKAS_FONT.judul)) : null;
      font = { isi: readFileSync(jalur(BERKAS_FONT.isi)), tebal: readFileSync(jalur(BERKAS_FONT.tebal)), judul };
    } else {
      logger.warn('Font sertifikat (public/aset/font/Nunito-Regular.ttf dan Nunito-Bold.ttf) tidak ditemukan; PDF memakai Helvetica bawaan.');
    }
    const berkasMaskot = path.join(folderAset, 'maskot', 'zippy-merayakan.png');
    aset = { font, bawaan: !adaNunito, maskot: existsSync(berkasMaskot) ? readFileSync(berkasMaskot) : null };
    return aset;
  }

  /** Mendaftarkan font ke dokumen dengan nama tetap: isi, tebal, judul. */
  function daftarFont(doc, a) {
    doc.registerFont('isi', a.font.isi);
    doc.registerFont('tebal', a.font.tebal);
    doc.registerFont('judul', a.font.judul ?? a.font.tebal);
  }

  /** Menggambar gambar bila bisa; format yang tidak didukung pdfkit (mis. logo WebP) dilewati tanpa menggagalkan PDF. */
  function gambarAman(doc, buffer, x, y, opsi) {
    if (!buffer) return;
    try {
      doc.image(buffer, x, y, opsi);
    } catch (error) {
      // pdfkit hanya mendukung PNG dan JPEG; gambar lain diabaikan
      logger.warn(`Gambar pada sertifikat dilewati: ${error.message}`);
    }
  }

  /**
   * Teks satu baris yang muat di `lebar`: ukuran huruf dikecilkan bertahap sampai `minUkuran`,
   * lalu dipotong dengan "..." bila masih terlalu panjang. Hasil: { teks, ukuran }.
   */
  function pasTeks(doc, teks, font, maksUkuran, minUkuran, lebar) {
    doc.font(font);
    for (let ukuran = maksUkuran; ukuran >= minUkuran; ukuran -= 1) {
      if (doc.fontSize(ukuran).widthOfString(teks) <= lebar) return { teks, ukuran };
    }
    doc.fontSize(minUkuran);
    let potong = teks;
    // masih terlalu lebar pada ukuran terkecil: buang karakter dari belakang sampai muat beserta "..."
    while (potong.length > 1 && doc.widthOfString(`${potong.trimEnd()}...`) > lebar) potong = potong.slice(0, -1);
    return { teks: `${potong.trimEnd()}...`, ukuran: minUkuran };
  }

  /** Menulis satu baris di tengah halaman pada `y` (tanpa pindah baris). */
  function tengah(doc, teks, y, { font, ukuran, warna, spasi = 0 }) {
    doc.font(font).fontSize(ukuran).fillColor(warna).text(teks, 0, y, { width: LEBAR, align: 'center', lineBreak: false, characterSpacing: spasi });
  }

  /**
   * Satu baris di tengah yang terdiri dari beberapa potongan berbeda font/warna (mis. "dengan nilai " + "85").
   * Ukuran dikecilkan bila total lebar melebihi `lebar`.
   */
  function tengahCampur(doc, potongan, y, maksUkuran, lebar) {
    let ukuran = maksUkuran;
    const total = () => potongan.reduce((n, p) => n + doc.font(p.font).fontSize(ukuran).widthOfString(p.teks), 0);
    // baris terlalu panjang (mis. nama level panjang): kecilkan sampai muat, minimal 10 pt
    while (ukuran > 10 && total() > lebar) ukuran -= 1;
    let x = (LEBAR - total()) / 2;
    for (const p of potongan) {
      doc.font(p.font).fontSize(ukuran).fillColor(p.warna).text(p.teks, x, y, { lineBreak: false });
      x += doc.widthOfString(p.teks);
    }
  }

  /** Latar krem dan bingkai tipis ganda (ungu di luar, oranye di dalam). */
  function bingkai(doc) {
    doc.rect(0, 0, LEBAR, TINGGI).fill(WARNA.krem);
    doc.lineWidth(2).strokeColor(WARNA.ungu).rect(20, 20, LEBAR - 40, TINGGI - 40).stroke();
    doc.lineWidth(0.75).strokeColor(WARNA.oranye).rect(28, 28, LEBAR - 56, TINGGI - 56).stroke();
  }

  /** Kepala: logo (kiri), nama pelatihan dan perusahaan (tengah), Zippy merayakan (kanan). */
  function kepala(doc, d, a, aman) {
    gambarAman(doc, d.logo, TEPI - 10, 48, { fit: [70, 70] });
    gambarAman(doc, a.maskot, LEBAR - TEPI - 95, 40, { fit: [105, 140] });
    const nama = pasTeks(doc, aman(d.namaPelatihan), 'tebal', 18, 11, LEBAR - 360);
    tengah(doc, nama.teks, 58, { font: 'tebal', ukuran: nama.ukuran, warna: WARNA.ungu });
    // nama perusahaan boleh kosong di pengaturan
    if (d.namaPerusahaan) {
      const pt = pasTeks(doc, aman(d.namaPerusahaan), 'isi', 11, 8, LEBAR - 360);
      tengah(doc, pt.teks, 82, { font: 'isi', ukuran: pt.ukuran, warna: WARNA.redup });
    }
  }

  /** Isi utama: judul, nama siswa (dipaskan), level, dan nilai. */
  function isi(doc, d, aman) {
    tengah(doc, 'SERTIFIKAT', 118, { font: 'judul', ukuran: 44, warna: WARNA.ungu, spasi: 6 });
    doc.rect(LEBAR / 2 - 40, 176, 80, 4).fill(WARNA.oranye);
    tengah(doc, aman('Diberikan kepada'), 200, { font: 'isi', ukuran: 14, warna: WARNA.redup });
    const nama = pasTeks(doc, aman(d.namaSiswa), 'tebal', 36, 18, 620);
    tengah(doc, nama.teks, 248 - nama.ukuran * 0.6, { font: 'tebal', ukuran: nama.ukuran, warna: WARNA.teks });
    doc.lineWidth(1).strokeColor(WARNA.garis).moveTo(LEBAR / 2 - 230, 284).lineTo(LEBAR / 2 + 230, 284).stroke();
    tengahCampur(doc, [{ teks: aman('telah menyelesaikan '), font: 'isi', warna: WARNA.redup }, { teks: aman(d.namaLevel), font: 'tebal', warna: WARNA.ungu }], 304, 18, 640);
    tengahCampur(doc, [{ teks: aman('dengan nilai '), font: 'isi', warna: WARNA.redup }, { teks: aman(d.nilai), font: 'tebal', warna: WARNA.ungu }], 336, 18, 640);
  }

  /** Kaki kiri: QR verifikasi, nomor sertifikat, dan tanggal terbit. */
  function kakiKiri(doc, d, qr, aman) {
    const y = 412;
    doc.image(qr, TEPI, y, { width: 96, height: 96 });
    doc.font('isi').fontSize(8).fillColor(WARNA.redup).text(aman('Pindai untuk cek keaslian'), TEPI - 10, y + 100, { width: 116, align: 'center', lineBreak: false });
    const x = TEPI + 110;
    doc.font('isi').fontSize(9).fillColor(WARNA.redup).text(aman('Nomor sertifikat'), x, y + 18, { lineBreak: false });
    doc.font('tebal').fontSize(12).fillColor(WARNA.teks).text(aman(d.nomor), x, y + 31, { lineBreak: false });
    doc.font('isi').fontSize(9).fillColor(WARNA.redup).text(aman('Tanggal terbit'), x, y + 54, { lineBreak: false });
    doc.font('tebal').fontSize(12).fillColor(WARNA.teks).text(aman(d.tanggal), x, y + 67, { lineBreak: false });
  }

  /** Kaki kanan: garis tanda tangan, nama dan jabatan penandatangan; bila nama kosong cukup nama pelatihan. */
  function kakiKanan(doc, d, aman) {
    const lebar = 230;
    const x = LEBAR - TEPI - lebar;
    doc.lineWidth(1).strokeColor(WARNA.teks).moveTo(x, 488).lineTo(x + lebar, 488).stroke();
    const tulis = (teks, y, font, maks, warna) => {
      const p = pasTeks(doc, aman(teks), font, maks, 7, lebar);
      doc.font(font).fontSize(p.ukuran).fillColor(warna).text(p.teks, x, y, { width: lebar, align: 'center', lineBreak: false });
    };
    // penandatangan diisi admin: nama tebal, lalu jabatan (atau nama pelatihan bila jabatan kosong)
    if (d.penandatanganNama) {
      tulis(d.penandatanganNama, 494, 'tebal', 12, WARNA.teks);
      tulis(d.penandatanganJabatan || d.namaPelatihan, 511, 'isi', 10, WARNA.redup);
    } else {
      tulis(d.namaPelatihan, 494, 'isi', 11, WARNA.redup);
    }
  }

  /** Watermark miring "DIBATALKAN" untuk sertifikat yang sudah dibatalkan (hanya diunduh pengelola). */
  function watermark(doc) {
    doc.save();
    doc.rotate(-25, { origin: [LEBAR / 2, TINGGI / 2] });
    doc.opacity(0.22);
    tengah(doc, 'DIBATALKAN', TINGGI / 2 - 48, { font: 'tebal', ukuran: 96, warna: WARNA.batal, spasi: 2 });
    doc.restore();
  }

  /** Mengumpulkan keluaran dokumen menjadi satu Buffer setelah doc.end(). */
  function keBuffer(doc) {
    return new Promise((selesai, gagal) => {
      const potongan = [];
      doc.on('data', (c) => potongan.push(c));
      doc.on('end', () => selesai(Buffer.concat(potongan)));
      doc.on('error', gagal);
    });
  }

  return {
    /**
     * Membuat PDF dari data: { nomor, namaSiswa, namaLevel, nilai, tanggal, urlVerifikasi, namaPelatihan, namaPerusahaan,
     * logo (Buffer|null), penandatanganNama, penandatanganJabatan, dibatalkan }. Hasil: Buffer PDF.
     */
    async buat(d) {
      const a = muatAset();
      // font bawaan tidak punya semua karakter: ganti yang di luar jangkauannya dengan '?'
      const aman = a.bawaan ? amankanWinAnsi : (teks) => String(teks ?? '');
      const qr = await QRCode.toBuffer(d.urlVerifikasi, { type: 'png', margin: 1, width: 300, errorCorrectionLevel: 'M', color: { dark: WARNA.teks, light: '#FFFFFF' } });
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: `Sertifikat ${aman(d.nomor)}`, Author: aman(d.namaPelatihan) } });
      const hasil = keBuffer(doc);
      // font TTF dipasang lewat nama tetap; font bawaan cukup dipetakan ke nama yang sama
      if (!a.bawaan) daftarFont(doc, a);
      else daftarFont(doc, { font: FONT_BAWAAN });
      bingkai(doc);
      kepala(doc, d, a, aman);
      isi(doc, d, aman);
      kakiKiri(doc, d, qr, aman);
      kakiKanan(doc, d, aman);
      if (d.dibatalkan) watermark(doc);
      doc.end();
      return hasil;
    },
  };
}
