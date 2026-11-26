import { useCallback, useEffect, useRef, useState } from 'react';
import { BATAS_STUDIO } from '@/modules/shared/blockly/pustakaStudio';
import { buatMesinStudio } from '@/modules/shared/blockly/mesinStudio';
import { hentikanMusik, mainkanSuara, mulaiMusik, siapkanSuara } from './pustakaSuara';

/** Selang satu bingkai (ms): sekitar 30 bingkai per detik. */
const SELANG = 1000 / BATAS_STUDIO.bingkaiPerDetik;

/**
 * Menjalankan proyek Studio Zippy di browser (dipakai editor siswa dan pratinjau tutor). Mesin dibuat dari proyek
 * yang diberikan saat `mulai`; selama `jalan`, satu bingkai dijalankan tiap ~33 ms dan keadaan panggung disalin ke
 * `tampilan` untuk digambar. `berhenti` menghentikan semua skrip tetapi keadaan terakhir tetap terlihat; `reset`
 * menghapusnya (kembali ke tampilan awal proyek). `tekan(kode)` meneruskan tombol keyboard ke mesin.
 */
export function useMesinStudio() {
  const mesin = useRef(null);
  const [jalan, setJalan] = useState(false);
  const [tampilan, setTampilan] = useState(null);

  // selama jalan: satu bingkai tiap selang; berhenti otomatis saat komponen dilepas atau jalan dimatikan
  useEffect(() => {
    if (!jalan) return undefined;
    const id = setInterval(() => {
      mesin.current.langkah(SELANG);
      setTampilan(mesin.current.tampilan());
    }, SELANG);
    return () => clearInterval(id);
  }, [jalan]);
  // komponen dilepas: hentikan skrip yang masih hidup
  useEffect(() => () => mesin.current?.hentikan(), []);

  /** Bendera hijau: mesin baru dari `proyek`, dunia kembali ke keadaan awal, lalu semua skrip bendera berjalan. */
  const mulai = useCallback((proyek) => {
    // dipanggil dari klik pengguna: membuka kunci suara browser
    siapkanSuara();
    mesin.current = buatMesinStudio(proyek, { efek: { bunyi: mainkanSuara, musik: mulaiMusik, hentikanMusik } });
    mesin.current.mulaiBendera();
    setTampilan(mesin.current.tampilan());
    setJalan(true);
  }, []);
  /** Menghentikan semua skrip; keadaan terakhir tetap tampil. */
  const berhenti = useCallback(() => {
    mesin.current?.hentikan();
    setJalan(false);
  }, []);
  /** Menghentikan dan menghapus keadaan jalan (panggung kembali ke tampilan awal proyek). */
  const reset = useCallback(() => {
    mesin.current?.hentikan();
    setJalan(false);
    setTampilan(null);
  }, []);
  /** Tombol keyboard (kode blok: spasi, kanan, kiri, atas, bawah) ditekan; hanya bermakna saat jalan. */
  const tekan = useCallback((kode) => {
    mesin.current?.tekanTombol(kode);
  }, []);

  /** Sprite diklik di panggung (blok "Ketika sprite ini diklik"); hanya bermakna saat jalan. */
  const klik = useCallback((id) => {
    mesin.current?.klikSprite(id);
  }, []);
  /** Jawaban siswa untuk pertanyaan blok Tanya yang sedang tampil; panggung digambar ulang agar kotak isian hilang. */
  const jawab = useCallback((teks) => {
    mesin.current?.jawab(teks);
    setTampilan(mesin.current.tampilan());
  }, []);

  return { jalan, tampilan, mulai, berhenti, reset, tekan, klik, jawab };
}
