import { DAFTAR_BLOK_STUDIO, keAngka } from '@/modules/shared/blockly/daftarBlokStudio';
import { BATAS_STUDIO, DATA_LABIRIN, JENIS_SPRITE, PANGGUNG, bersinggungan, kotakDari, kunciNama } from '@/modules/shared/blockly/pustakaStudio';

// Penerjemah waktu-nyata Studio Zippy. Murni: tanpa DOM, tanpa eval/new Function, dan tanpa kode hasil generator
// Blockly; program ditafsirkan langsung dari JSON proyek lewat daftar blok (daftarBlokStudio.js). Tiap skrip
// berjalan sebagai coroutine (generator) yang diputar satu bingkai demi satu bingkai oleh `langkah`, sehingga
// `selamanya`, `ulangi`, dan `tunggu` berjalan bersamaan antar sprite tanpa membekukan halaman. Satu skrip hanya
// menjalankan blok sampai batas anggaran per bingkai; sisanya ditunda ke bingkai berikutnya. Skrip yang menunggu
// (tunggu, tunggu sampai, tanya) tidak memakai anggaran.

/** Batas pusat sprite (px): boleh sedikit melewati tepi panggung, tidak pernah hilang seluruhnya. */
const BATAS_X = PANGGUNG.lebar / 2 + PANGGUNG.lewatTepi;
const BATAS_Y = PANGGUNG.tinggi / 2 + PANGGUNG.lewatTepi;
/** Batas panjang antrean pesan dan teks jawaban (penjaga dari skrip yang mengirim tanpa henti). */
const MAKS_ANTRE_PESAN = 50;
const MAKS_JAWABAN = 100;

/** Membatasi angka ke rentang; bukan angka dianggap 0. */
const jepit = (n, min, maks) => Math.min(maks, Math.max(min, Number.isFinite(n) ? n : 0));

/** Keadaan awal dunia dari proyek: latar, variabel, dan salinan tiap sprite (dengan kolom `kata` untuk balon ucapan). */
function bangunDunia(proyek) {
  return {
    latar: proyek.latar,
    variabel: { ...proyek.variabel, skor: Number(proyek.variabel?.skor) || 0 },
    tampilSkor: false,
    /** Variabel buatan sendiri yang monitornya tampil di panggung (nama persis seperti di `variabel`). */
    monitor: new Set(),
    berhenti: false,
    /** Jawaban terakhir blok Tanya. */
    jawaban: '',
    /** Antrean pertanyaan yang menunggu jawaban: { teks, selesai }; hanya yang pertama ditampilkan. */
    pertanyaan: [],
    /** Antrean nama pesan (sudah dinormalisasi) yang dikirim dan dibagikan pada awal bingkai berikutnya. */
    pesan: [],
    sprite: proyek.sprite.map((s) => ({
      id: s.id,
      jenis: s.jenis ?? JENIS_SPRITE.GAMBAR,
      subjek: s.subjek,
      teks: s.teks,
      ukuran: s.ukuran,
      warna: s.warna,
      kostumUnggahan: s.kostumUnggahan ?? [],
      x: s.x,
      y: s.y,
      // sprite teks tidak berputar dan tidak punya kostum
      arah: s.arah ?? 90,
      kostum: s.kostum ?? 0,
      tampil: s.tampil,
      kata: '',
    })),
  };
}

/**
 * Membuat mesin untuk satu proyek. `efek`: `bunyi(tema, nomor)` memainkan suara, `musik(suasana)` memulai musik latar,
 * `hentikanMusik()` mematikannya (semuanya opsional); `acak(n)` mengembalikan bilangan bulat 0..n-1 (disuntikkan).
 * Mesin: mulaiBendera(), tekanTombol(kode), klikSprite(id), jawab(teks), langkah(dtMs), hentikan(), berjalan(), tampilan().
 */
export function buatMesinStudio(proyek, { efek = {}, acak = (n) => Math.floor(Math.random() * n) } = {}) {
  let dunia = bangunDunia(proyek);
  /** Coroutine yang sedang hidup: { kunci, ctx, gen }. */
  let korutin = [];
  /** Waktu mesin berjalan (ms), dipakai blok tunggu. */
  let waktu = 0;

  /** Nama variabel persis seperti di dunia dari nama apa pun (tidak membedakan huruf besar kecil); null bila tidak ada. */
  function kunciVariabel(nama) {
    const cari = kunciNama(nama);
    return Object.keys(dunia.variabel).find((k) => kunciNama(k) === cari) ?? null;
  }

  /** Konteks yang dipakai blok untuk satu skrip pada satu sprite. */
  function buatKonteks(sprite) {
    const ctx = {
      sprite,
      dunia,
      /** Sisa anggaran blok pada bingkai ini; diatur ulang penjadwal sebelum tiap putaran. */
      sisa: BATAS_STUDIO.anggaranPerBingkai,
      acak,
      /** Nilai bebas (angka atau teks) dari isian biasa atau blok nilai; kosong dianggap teks kosong. */
      bebas(x) {
        if (x == null) return '';
        if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
        if (typeof x === 'string') return x;
        const hasil = DAFTAR_BLOK_STUDIO[x.blok].hitung(ctx, x);
        return typeof hasil === 'number' && !Number.isFinite(hasil) ? 0 : hasil;
      },
      /** Nilai angka: nilai bebas yang teks angkanya diterjemahkan menjadi angka; selain itu 0. */
      nilai(x) {
        return keAngka(ctx.bebas(x)) ?? 0;
      },
      /** Nilai benar/salah dari blok syarat; kosong dianggap salah. */
      syarat(x) {
        if (x == null) return false;
        return Boolean(DAFTAR_BLOK_STUDIO[x.blok].hitung(ctx, x));
      },
      /** Menjalankan daftar perintah berurutan (generator); menunda ke bingkai berikutnya bila anggaran habis. */
      *isi(daftar) {
        for (const node of daftar) {
          // "hentikan semua" sudah dipanggil: sisa blok tidak dijalankan
          if (dunia.berhenti) return;
          // anggaran bingkai habis: lanjutkan di bingkai berikutnya (program ganas tidak menggantung tab)
          if (ctx.sisa <= 0) yield;
          ctx.sisa -= 1;
          const hasil = DAFTAR_BLOK_STUDIO[node.blok].jalankan(ctx, node);
          // blok wadah/tunggu berupa generator: dijalankan bersarang
          if (hasil && typeof hasil.next === 'function') yield* hasil;
        }
      },
      /** Menunggu `ms` milidetik waktu mesin. */
      *menunggu(ms) {
        const sampai = waktu + Math.max(0, ms);
        while (waktu < sampai && !dunia.berhenti) yield;
      },
      /** Bertanya: pertanyaan masuk antrean dan skrip ini menunggu sampai siswa menjawab (skrip lain tetap berjalan). */
      *tanya(teks) {
        const item = { teks: String(teks), selesai: false };
        dunia.pertanyaan.push(item);
        while (!item.selesai && !dunia.berhenti) yield;
      },
      /** Mengirim pesan; skrip penerimanya dimulai pada awal bingkai berikutnya. */
      kirimPesan(nama) {
        if (dunia.pesan.length < MAKS_ANTRE_PESAN) dunia.pesan.push(kunciNama(nama));
      },
      /** Nilai variabel menurut nama; variabel yang tidak ada (mis. sudah dihapus) bernilai 0. */
      ambilVariabel(nama) {
        const k = kunciVariabel(nama);
        return k === null ? 0 : dunia.variabel[k];
      },
      /** Mengisi variabel yang ada (angka dibatasi rentang wajar, teks dipotong); variabel yang tidak ada diabaikan. */
      aturVariabel(nama, nilai) {
        const k = kunciVariabel(nama);
        if (k === null) return;
        // skor selalu angka; variabel lain boleh angka atau teks
        if (k === 'skor' || typeof nilai === 'number') dunia.variabel[k] = jepit(keAngka(nilai) ?? 0, -BATAS_STUDIO.maksAngka, BATAS_STUDIO.maksAngka);
        else dunia.variabel[k] = String(nilai).slice(0, BATAS_STUDIO.maksNilaiTeks);
      },
      /** Menampilkan atau menyembunyikan monitor sebuah variabel di panggung. */
      monitorVariabel(nama, tampil) {
        const k = kunciVariabel(nama);
        if (k === null) return;
        if (k === 'skor') dunia.tampilSkor = tampil;
        else if (tampil) dunia.monitor.add(k);
        else dunia.monitor.delete(k);
      },
      musik: (suasana) => efek.musik?.(suasana),
      hentikanMusik: () => efek.hentikanMusik?.(),
      /** Memindahkan sprite ke (x, y) dengan batas tepi panggung. */
      pindahKe(x, y) {
        sprite.x = jepit(x, -BATAS_X, BATAS_X);
        sprite.y = jepit(y, -BATAS_Y, BATAS_Y);
      },
      /** Pantul jika menyentuh tepi: arah dibalik pada sumbu yang menabrak, lalu sprite dikembalikan ke dalam panggung. */
      pantul() {
        const rad = (sprite.arah * Math.PI) / 180;
        let dx = Math.sin(rad);
        let dy = Math.cos(rad);
        const setengahLebar = PANGGUNG.lebar / 2;
        const setengahTinggi = PANGGUNG.tinggi / 2;
        // setengah ukuran kotak pembatas sprite ini (gambar: kotak sentuh tetap; teks: sesuai tulisannya)
        const kotak = kotakDari(sprite);
        const sx = (kotak.x2 - kotak.x1) / 2;
        const sy = (kotak.y2 - kotak.y1) / 2;
        let kena = false;
        if (sprite.x - sx <= -setengahLebar && dx < 0) {
          dx = -dx;
          sprite.x = -setengahLebar + sx;
          kena = true;
        } else if (sprite.x + sx >= setengahLebar && dx > 0) {
          dx = -dx;
          sprite.x = setengahLebar - sx;
          kena = true;
        }
        if (sprite.y - sy <= -setengahTinggi && dy < 0) {
          dy = -dy;
          sprite.y = -setengahTinggi + sy;
          kena = true;
        } else if (sprite.y + sy >= setengahTinggi && dy > 0) {
          dy = -dy;
          sprite.y = setengahTinggi - sy;
          kena = true;
        }
        // tidak sedang menyentuh tepi: arah tidak berubah
        if (kena) sprite.arah = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      },
      /** Apakah sprite menyentuh `sasaran`: tepi, dinding (latar labirin), tujuan (latar labirin), atau sprite lain. */
      sentuh(sasaran) {
        const kotak = kotakDari(sprite);
        if (sasaran === 'tepi') return kotak.x1 <= -PANGGUNG.lebar / 2 || kotak.x2 >= PANGGUNG.lebar / 2 || kotak.y1 <= -PANGGUNG.tinggi / 2 || kotak.y2 >= PANGGUNG.tinggi / 2;
        if (sasaran === 'dinding') return dunia.latar === 'labirin' && DATA_LABIRIN.dinding.some((d) => bersinggungan(kotak, d));
        if (sasaran === 'tujuan') return dunia.latar === 'labirin' && bersinggungan(kotak, DATA_LABIRIN.tujuan);
        // sprite lain: hanya yang terlihat, dan sprite ini sendiri harus terlihat
        return sprite.tampil && dunia.sprite.some((s) => s !== sprite && s.tampil && bersinggungan(kotak, kotakDari(s)));
      },
      /** Apakah sprite ini menyentuh sprite tertentu (menurut ID); sprite yang sudah dihapus dari proyek dianggap tidak tersentuh. */
      sentuhSprite(id) {
        const lain = dunia.sprite.find((s) => s.id === id);
        // sprite tujuan tidak ada, sama dengan sprite ini, atau salah satunya disembunyikan
        if (!lain || lain === sprite || !lain.tampil || !sprite.tampil) return false;
        return bersinggungan(kotakDari(sprite), kotakDari(lain));
      },
      /** Memainkan suara "<tema>-<nomor>". */
      bunyi(nilai) {
        const [tema, nomor] = String(nilai).split('-');
        efek.bunyi?.(tema, Number(nomor));
      },
      hentikanSemua() {
        dunia.berhenti = true;
      },
      dihentikan: () => dunia.berhenti,
    };
    return ctx;
  }

  /** Menjalankan satu skrip sampai selesai. */
  function* jalankanSkrip(ctx, skrip) {
    yield* ctx.isi(skrip.isi);
  }

  /** Memulai coroutine untuk satu skrip; coroutine lama skrip yang sama (sprite dan indeks sama) diganti. */
  function mulaiSkrip(spriteProyek, skrip, indeks) {
    const sprite = dunia.sprite.find((s) => s.id === spriteProyek.id);
    const kunci = `${spriteProyek.id}:${indeks}`;
    korutin = korutin.filter((k) => k.kunci !== kunci);
    const ctx = buatKonteks(sprite);
    korutin.push({ kunci, ctx, gen: jalankanSkrip(ctx, skrip) });
  }

  /** Memulai semua skrip yang kejadiannya cocok; `idSprite` (opsional) membatasi pada satu sprite. */
  function mulaiKejadian(cocok, idSprite = null) {
    for (const sp of proyek.sprite) {
      if (idSprite !== null && sp.id !== idSprite) continue;
      sp.skrip.forEach((skrip, i) => cocok(skrip) && mulaiSkrip(sp, skrip, i));
    }
  }

  /** Semua skrip berhenti, antrean dibersihkan, dan musik latar dimatikan (dipakai Berhenti dan Hentikan semua). */
  function hentikanSemuaSkrip() {
    korutin = [];
    dunia.pertanyaan = [];
    dunia.pesan = [];
    efek.hentikanMusik?.();
  }

  return {
    /** Bendera hijau: dunia dikembalikan ke keadaan awal proyek, lalu semua skrip bendera dimulai. */
    mulaiBendera() {
      efek.hentikanMusik?.();
      dunia = bangunDunia(proyek);
      korutin = [];
      waktu = 0;
      mulaiKejadian((s) => s.kejadian === 'bendera');
    },
    /** Tombol keyboard `kode` (spasi, kanan, kiri, atas, bawah) ditekan: skrip tombol itu dimulai (atau diulang). */
    tekanTombol(kode) {
      dunia.berhenti = false;
      mulaiKejadian((s) => s.kejadian === 'tombol' && s.tombol === kode);
    },
    /** Sprite `id` diklik di panggung: skrip "Ketika sprite ini diklik" milik sprite itu dimulai (atau diulang). */
    klikSprite(id) {
      dunia.berhenti = false;
      mulaiKejadian((s) => s.kejadian === 'diklik', id);
    },
    /** Jawaban siswa untuk pertanyaan yang sedang tampil; skrip yang bertanya dilanjutkan dan jawaban disimpan. */
    jawab(teks) {
      const item = dunia.pertanyaan.shift();
      // tidak ada pertanyaan yang menunggu (mis. sudah dihentikan): jawaban diabaikan
      if (!item) return;
      dunia.jawaban = String(teks ?? '').slice(0, MAKS_JAWABAN);
      item.selesai = true;
    },
    /** Maju satu bingkai: `dtMs` ditambahkan ke waktu mesin lalu tiap coroutine dijalankan sampai menyerahkan bingkai. */
    langkah(dtMs) {
      waktu += dtMs;
      // pesan yang dikirim pada bingkai sebelumnya dibagikan ke semua skrip penerima di semua sprite
      for (const nama of dunia.pesan.splice(0)) mulaiKejadian((s) => s.kejadian === 'menerima_pesan' && kunciNama(s.pesan) === nama);
      for (const k of [...korutin]) {
        k.ctx.sisa = BATAS_STUDIO.anggaranPerBingkai;
        const r = k.gen.next();
        // skrip selesai (tidak ada perulangan tanpa akhir): dilepas dari daftar
        if (r.done) korutin = korutin.filter((x) => x !== k);
        // "hentikan semua": seluruh skrip berhenti saat itu juga
        if (dunia.berhenti) {
          hentikanSemuaSkrip();
          dunia.berhenti = false;
          break;
        }
      }
    },
    /** Berhenti: semua skrip dan musik dihentikan, keadaan terakhir tetap terlihat. */
    hentikan() {
      hentikanSemuaSkrip();
    },
    /** Apakah masih ada skrip yang berjalan. */
    berjalan: () => korutin.length > 0,
    /** Salinan keadaan dunia untuk digambar (termasuk pertanyaan yang sedang menunggu jawaban dan monitor variabel). */
    tampilan() {
      return {
        latar: dunia.latar,
        variabel: { ...dunia.variabel },
        tampilSkor: dunia.tampilSkor,
        monitor: [...dunia.monitor].map((nama) => ({ nama, nilai: dunia.variabel[nama] })),
        pertanyaan: dunia.pertanyaan[0]?.teks ?? null,
        sprite: dunia.sprite.map((s) => ({ ...s })),
      };
    },
  };
}
