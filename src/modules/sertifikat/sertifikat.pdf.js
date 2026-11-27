import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/** Warna sertifikat: angka tetap palet biru-oranye (PDF tidak membaca token CSS); krem sengaja tetap sebagai kertas hangat. */
const WARNA = Object.freeze({
  krem: '#FFF8EE', // kertas hangat (tidak mengikuti --bg siswa)
  biru: '#0A56B8', // biru judul, bingkai, dan nilai
  teks: '#1B2A4D', // navy teks utama (= --fg siswa)
  redup: '#52617F', // teks sekunder (= --muted siswa)
  garis: '#D9E6F8', // garis tipis (= --line siswa)
  oranye: '#E88A2E', // aksen oranye: bingkai dalam dan garis pemisah
  batal: '#C42B31', // --bad siswa
});

/** Ukuran A4 lanskap (point) dan jarak tepi isi. */
const LEBAR = 841.89;
const TINGGI = 595.28;
const TEPI = 70;
/** Posisi garis tanda tangan (y) dan kotak maksimal gambar tanda tangan [lebar, tinggi] dalam point. */
const GARIS_TANDA_TANGAN_Y = 488;
/** Posisi atas (y) dan kotak maksimal logo di kepala sertifikat [lebar, tinggi] dalam point. */
const LOGO_Y = 28;
const LOGO_KOTAK = Object.freeze([180, 56]);
const TANDA_TANGAN_KOTAK = Object.freeze([160, 60]);

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
  let peringatanTandaTangan = false; // peringatan tanda tangan tak terbaca ditulis sekali per proses

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

  /** Latar krem dan bingkai tipis ganda (biru di luar, oranye di dalam). */
  function bingkai(doc) {
    doc.rect(0, 0, LEBAR, TINGGI).fill(WARNA.krem);
    doc.lineWidth(2).strokeColor(WARNA.biru).rect(20, 20, LEBAR - 40, TINGGI - 40).stroke();
    doc.lineWidth(0.75).strokeColor(WARNA.oranye).rect(28, 28, LEBAR - 56, TINGGI - 56).stroke();
  }

  /** Kepala: logo di tengah atas, nama pelatihan dan perusahaan di bawahnya, Zippy merayakan (kanan). */
  function kepala(doc, d, a, aman) {
    // logo di atas, rata tengah, dimuat dalam kotak LOGO_KOTAK tanpa mengubah rasio
    const [kotakLebar, kotakTinggi] = LOGO_KOTAK;
    gambarAman(doc, d.logo, (LEBAR - kotakLebar) / 2, LOGO_Y, { fit: LOGO_KOTAK, align: 'center', valign: 'center' });
    gambarAman(doc, a.maskot, LEBAR - TEPI - 95, 40, { fit: [105, 140] });
    // dengan logo, nama pelatihan dan perusahaan turun ke bawah logo; tanpa logo tetap di posisi semula
    const yNama = d.logo ? LOGO_Y + kotakTinggi + 4 : 58;
    const nama = pasTeks(doc, aman(d.namaPelatihan), 'tebal', d.logo ? 13 : 18, 11, LEBAR - 360);
    tengah(doc, nama.teks, yNama, { font: 'tebal', ukuran: nama.ukuran, warna: WARNA.biru });
    // nama perusahaan boleh kosong di pengaturan
    if (d.namaPerusahaan) {
      const pt = pasTeks(doc, aman(d.namaPerusahaan), 'isi', d.logo ? 9 : 11, 8, LEBAR - 360);
      tengah(doc, pt.teks, yNama + (d.logo ? 16 : 24), { font: 'isi', ukuran: pt.ukuran, warna: WARNA.redup });
    }
  }

  /** Isi utama: judul, nama siswa (dipaskan), level, dan nilai. */
  function isi(doc, d, aman) {
    tengah(doc, 'SERTIFIKAT', 118, { font: 'judul', ukuran: 44, warna: WARNA.biru, spasi: 6 });
    doc.rect(LEBAR / 2 - 40, 176, 80, 4).fill(WARNA.oranye);
    tengah(doc, aman('Diberikan kepada'), 200, { font: 'isi', ukuran: 14, warna: WARNA.redup });
    const nama = pasTeks(doc, aman(d.namaSiswa), 'tebal', 36, 18, 620);
    tengah(doc, nama.teks, 248 - nama.ukuran * 0.6, { font: 'tebal', ukuran: nama.ukuran, warna: WARNA.teks });
    doc.lineWidth(1).strokeColor(WARNA.garis).moveTo(LEBAR / 2 - 230, 284).lineTo(LEBAR / 2 + 230, 284).stroke();
    tengahCampur(doc, [{ teks: aman('telah menyelesaikan '), font: 'isi', warna: WARNA.redup }, { teks: aman(d.namaLevel), font: 'tebal', warna: WARNA.biru }], 304, 18, 640);
    tengahCampur(doc, [{ teks: aman('dengan nilai '), font: 'isi', warna: WARNA.redup }, { teks: aman(d.nilai), font: 'tebal', warna: WARNA.biru }], 336, 18, 640);
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

  /**
   * Gambar tanda tangan (PNG transparan) di atas garis, rata tengah terhadap blok penandatangan, dimuat dalam
   * kotak TANDA_TANGAN_KOTAK tanpa mengubah rasio. Gagal dibaca pdfkit: dilewati dan dicatat sekali per proses.
   */
  function tandaTangan(doc, buffer, x, lebar) {
    if (!buffer) return;
    const [kotakLebar, kotakTinggi] = TANDA_TANGAN_KOTAK;
    try {
      doc.image(buffer, x + (lebar - kotakLebar) / 2, GARIS_TANDA_TANGAN_Y - 2 - kotakTinggi, { fit: TANDA_TANGAN_KOTAK, align: 'center', valign: 'bottom' });
    } catch (error) {
      // berkas rusak atau bukan PNG yang bisa dibaca pdfkit: ruang kosong untuk tanda tangan manual tetap ada
      if (!peringatanTandaTangan) {
        peringatanTandaTangan = true;
        logger.warn(`Tanda tangan sertifikat dilewati: ${error.message}`);
      }
    }
  }
  /** Kaki kanan: tanda tangan, garis, nama dan jabatan penandatangan; bila nama kosong cukup nama pelatihan. */
  function kakiKanan(doc, d, aman) {
    const lebar = 230;
    const x = LEBAR - TEPI - lebar;
    tandaTangan(doc, d.tandaTangan, x, lebar);
    doc.lineWidth(1).strokeColor(WARNA.teks).moveTo(x, GARIS_TANDA_TANGAN_Y).lineTo(x + lebar, GARIS_TANDA_TANGAN_Y).stroke();
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
     * logo (Buffer|null), tandaTangan (Buffer PNG|null), penandatanganNama, penandatanganJabatan, dibatalkan }. Hasil: Buffer PDF.
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
