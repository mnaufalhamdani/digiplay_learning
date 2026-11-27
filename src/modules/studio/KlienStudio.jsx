'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { TINGKAT_BAWAAN, blokTersedia, periksaProyek, proyekBaru } from '@/modules/shared/blockly/daftarBlokStudio';
import { BATAS_STUDIO, DAFTAR_TOMBOL, JENIS_SPRITE, NAMA_LATAR, SPRITE_ZIPPY, WARNA_TEKS, cabutKostum, jalurKostumSprite, labelLatar } from '@/modules/shared/blockly/pustakaStudio';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Card from '@/modules/shared/ui/Card';
import ConfirmDialog from '@/modules/shared/ui/ConfirmDialog';
import Ikon from '@/modules/shared/ui/Ikon';
import Select from '@/modules/shared/ui/Select';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import TombolKembali from '@/modules/shared/ui/TombolKembali';
import { DialogBukaProyek, DialogNamaProyek } from './DialogProyek';
import { DialogSpriteTeks, DialogTingkat, DialogVariabel } from './DialogLevel3';
import DialogSprite from './DialogSprite';
import EditorStudioDinamis from './EditorStudioDinamis';
import KotakTanya from './KotakTanya';
import PanggungStudio from './PanggungStudio';
import { aturBisu } from './pustakaSuara';
import { bukaProyekStudio, hapusKostumStudio, kirimProyekStudio, simpanProyekStudio } from './studio.actions';
import { kirimKostum, siapkanKostum, TIPE_KOSTUM } from './unggahKostum';
import { useMesinStudio } from './useMesinStudio';

/** Satu pesan singkat bernada (sukses/bahaya/info) dengan ikon dan teks. */
function Pesan({ pesan }) {
  if (!pesan) return null;
  const ikon = pesan.nada === 'bahaya' ? 'peringatan' : pesan.nada === 'sukses' ? 'sukses' : 'info';
  return (
    <p role={pesan.nada === 'bahaya' ? 'alert' : 'status'} className={`flex items-start gap-1.5 font-semibold ${pesan.nada === 'bahaya' ? 'text-bad' : pesan.nada === 'sukses' ? 'text-ok' : 'text-muted'}`}>
      <Ikon nama={ikon} className="mt-0.5" />
      <span>{pesan.teks}</span>
    </p>
  );
}

/** Gambar kecil sebuah sprite (kostum yang sedang dipakai), atau "Aa" berwarna untuk sprite teks. */
function GambarKecil({ sprite }) {
  if (sprite.jenis === JENIS_SPRITE.TEKS) {
    const w = WARNA_TEKS[sprite.warna] ?? WARNA_TEKS.putih;
    return (
      <span aria-hidden="true" style={{ color: w.isi, WebkitTextStroke: `1px ${w.tepi}`, paintOrder: 'stroke fill' }} className="flex size-12 items-center justify-center rounded-md bg-[linear-gradient(135deg,#8FD3FF,#2D1B69)] font-display text-[1.3em] font-bold">
        Aa
      </span>
    );
  }
  const jalur = jalurKostumSprite(sprite);
  // eslint-disable-next-line @next/next/no-img-element -- gambar sprite statis dari public/aset atau berkas unggahan
  return <img src={jalur[sprite.kostum] ?? jalur[0]} alt="" draggable={false} className="size-12 object-contain" />;
}

/**
 * Halaman Studio Zippy (siswa): panggung, daftar sprite, editor blok untuk sprite terpilih, dan tombol proyek.
 * Program dijalankan di browser oleh penerjemah bersama (mesinStudio); server tidak menjalankannya. Menyimpan dan
 * mengirim proyek hanya saat sesi berlangsung; di luar sesi siswa bebas bereksperimen. `tugas` (atau null) adalah
 * tugas/butir post test yang membuka Studio ini: { jenis: 'tugas' | 'butir', id, soal, terkirim }.
 * `tingkatBoleh` adalah tingkat proyek yang boleh dibuat siswa (tingkat 3 hanya untuk siswa Level 3); proyek tingkat 3
 * menambah sprite teks, kostum unggahan, variabel buatan sendiri, dan blok Level 3.
 */
export default function KlienStudio({ pustaka, proyekAwal, sesiAktif, tugas, tingkatBoleh = [TINGKAT_BAWAAN] }) {
  const router = useRouter();
  const { basis } = useArea();
  const mesin = useMesinStudio();
  const [proyek, setProyek] = useState(() => proyekAwal?.isi ?? proyekBaru());
  const [meta, setMeta] = useState({ id: proyekAwal?.id ?? null, nama: proyekAwal?.nama ?? null, tingkat: proyekAwal?.tingkat ?? tingkatBoleh[0] });
  const [versi, setVersi] = useState(0);
  const [aktifId, setAktifId] = useState(() => (proyekAwal?.isi ?? proyekBaru()).sprite[0]?.id ?? null);
  const [kotor, setKotor] = useState(false);
  const [bisu, setBisu] = useState(false);
  const [pesan, setPesan] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [simpanSebagai, setSimpanSebagai] = useState(false);
  const [lanjutKirim, setLanjutKirim] = useState(false);
  const [galatNama, setGalatNama] = useState('');
  const [hapusSprite, setHapusSprite] = useState(null);
  const [hapusKostum, setHapusKostum] = useState(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [tertunda, setTertunda] = useState(null);
  const [terkirim, setTerkirim] = useState(tugas?.terkirim ?? null);
  const [memuat, mulai] = useTransition();
  const kolomBerkas = useRef(null);

  const l3 = meta.tingkat === 'l3';
  const BLOK = useMemo(() => blokTersedia(meta.tingkat), [meta.tingkat]);
  const aktif = proyek.sprite.find((s) => s.id === aktifId) ?? proyek.sprite[0] ?? null;
  const aktifGambar = aktif && aktif.jenis !== JENIS_SPRITE.TEKS ? aktif : null;
  /** Kunci ruang kerja editor: berganti saat proyek dimuat ulang atau sprite berganti. */
  const kunciSprite = `${versi}:${aktif?.id ?? 'kosong'}`;
  const kunciRef = useRef(kunciSprite);
  kunciRef.current = kunciSprite;
  const awal = useMemo(() => ({ latar: proyek.latar, variabel: proyek.variabel, tampilSkor: false, monitor: [], pertanyaan: null, sprite: proyek.sprite.map((s) => ({ ...s, kata: '' })) }), [proyek]);
  /** Nama tampilan sebuah sprite: nama subjek, "Zippy", atau tulisan sprite teks. */
  const namaSprite = useCallback((s) => (s.jenis === JENIS_SPRITE.TEKS ? `“${s.teks}”` : s.subjek === SPRITE_ZIPPY ? t('studio.zippy') : (pustaka.find((g) => g.kode === s.subjek)?.nama ?? s.subjek)), [pustaka]);
  // pilihan dropdown blok: nama variabel proyek dan sprite lain (selain yang sedang disunting)
  const namaVariabel = useMemo(() => ['skor', ...Object.keys(proyek.variabel).filter((k) => k !== 'skor')], [proyek.variabel]);
  const spriteLain = useMemo(() => proyek.sprite.map((s, i) => ({ id: s.id, label: `${i + 1}. ${namaSprite(s)}` })).filter((s) => s.id !== aktif?.id), [proyek.sprite, aktif?.id, namaSprite]);

  // tombol bisukan memengaruhi pustaka suara terpusat
  useEffect(() => aturBisu(bisu), [bisu]);

  // perubahan belum tersimpan: peringatan saat menutup tab dan saat menekan tautan di dalam aplikasi
  useEffect(() => {
    if (!kotor) return undefined;
    const peringatan = (e) => e.preventDefault();
    /** Tautan internal ditahan dulu dan ditanyakan lewat ConfirmDialog (navigasi di dalam aplikasi tidak memicu beforeunload). */
    const klik = (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || e.defaultPrevented) return;
      const url = new URL(a.href, window.location.href);
      // tautan keluar situs atau ke halaman yang sama tidak perlu ditahan
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      setTertunda({ jenis: 'pergi', href: a.getAttribute('href') });
    };
    window.addEventListener('beforeunload', peringatan);
    document.addEventListener('click', klik, true);
    return () => {
      window.removeEventListener('beforeunload', peringatan);
      document.removeEventListener('click', klik, true);
    };
  }, [kotor]);

  /** Mengubah proyek: menandai belum tersimpan dan mengembalikan panggung ke tampilan awal. */
  const ubah = useCallback(
    (fn) => {
      setProyek(fn);
      setKotor(true);
      mesin.reset();
    },
    [mesin.reset], // eslint-disable-line react-hooks/exhaustive-deps -- reset stabil; objek mesin berganti tiap render
  );
  /** Skrip dari editor: hanya diterima bila berasal dari ruang kerja sprite yang sedang tampil. */
  const saatSkripBerubah = useCallback(
    (skrip, kunci) => {
      if (kunci !== kunciRef.current) return;
      const id = kunci.slice(kunci.indexOf(':') + 1);
      ubah((p) => ({ ...p, sprite: p.sprite.map((s) => (s.id === id ? { ...s, skrip } : s)) }));
    },
    [ubah],
  );
  /** Posisi awal sprite diatur dengan menyeretnya di panggung. */
  const geserSprite = useCallback((id, x, y) => ubah((p) => ({ ...p, sprite: p.sprite.map((s) => (s.id === id ? { ...s, x, y } : s)) })), [ubah]);
  /** Mengubah satu sprite lewat fungsi `fn(sprite)`. */
  const ubahSprite = (id, fn) => ubah((p) => ({ ...p, sprite: p.sprite.map((s) => (s.id === id ? fn(s) : s)) }));
  /** Mengganti proyek yang sedang dibuka (baru atau hasil Buka); ruang kerja editor dimuat ulang. */
  function muatProyek(isi, metaBaru, tingkat) {
    mesin.reset();
    setProyek(isi);
    setMeta(metaBaru ?? { id: null, nama: null, tingkat });
    setAktifId(isi.sprite[0]?.id ?? null);
    setVersi((v) => v + 1);
    setKotor(false);
    setPesan(null);
  }
  /** Menjalankan `aksi` setelah siswa setuju membuang perubahan yang belum tersimpan (langsung bila tidak ada). */
  function denganKonfirmasi(aksi) {
    if (kotor) setTertunda({ jenis: 'aksi', aksi });
    else aksi();
  }
  /** Proyek baru: bila siswa boleh memakai lebih dari satu tingkat, ditanya dulu tingkatnya. */
  function klikProyekBaru() {
    if (tingkatBoleh.length > 1) return setDialog('tingkat');
    denganKonfirmasi(() => muatProyek(proyekBaru(), null, tingkatBoleh[0]));
  }

  /** Bendera hijau: proyek diperiksa dulu agar pesan galatnya ramah, lalu dijalankan dari keadaan awal. */
  function bendera() {
    const galat = periksaProyek(proyek, { tersedia: BLOK });
    // proyek tidak sah (mis. angka di luar rentang): jelaskan, jangan dijalankan
    if (galat.length > 0) return setPesan({ teks: galat[0].pesan, nada: 'bahaya' });
    setPesan(null);
    mesin.mulai(proyek);
    // panggung difokus agar tombol keyboard langsung diterima
    document.getElementById('panggung-studio')?.focus();
  }

  /** Menyimpan proyek; hasil { id, nama } atau { galat }. `sebagai` selalu membuat proyek baru bernama `nama`. */
  async function lakukanSimpan({ nama, sebagai }) {
    const baru = sebagai || !meta.id;
    const r = await simpanProyekStudio({ id: baru ? undefined : meta.id, nama: baru ? nama : meta.nama, isi: proyek, tingkat: meta.tingkat });
    if (!r.ok) return { galat: r.error };
    setMeta({ id: r.data.id, nama: r.data.nama, tingkat: r.data.tingkat });
    setKotor(false);
    return r.data;
  }
  /** Mengirim proyek tersimpan `id` ke tugas/butir yang membuka Studio ini. */
  async function kirimSekarang(id) {
    const r = await kirimProyekStudio({ proyekId: id, tugasId: tugas.id, jenis: tugas.jenis });
    // ditolak (sesi ditutup, sudah dinilai tutor, waktu tes habis): tampilkan alasannya
    if (!r.ok) return setPesan({ teks: r.error, nada: 'bahaya' });
    setTerkirim(r.data.nama);
    setPesan({ teks: t('studio.berhasilKirim', { nama: r.data.nama }), nada: 'sukses' });
  }
  /** Tombol Simpan: proyek yang sudah punya nama disimpan langsung, yang baru meminta nama dulu. */
  function klikSimpan() {
    // di luar sesi tidak ada yang disimpan
    if (!sesiAktif) return setPesan({ teks: t('studio.tidakTersimpan'), nada: 'info' });
    if (!meta.id) return bukaDialogNama(false, false);
    mulai(async () => {
      const h = await lakukanSimpan({});
      setPesan(h.galat ? { teks: h.galat, nada: 'bahaya' } : { teks: t('studio.tersimpan', { nama: h.nama }), nada: 'sukses' });
    });
  }
  /** Membuka dialog nama (Simpan pertama, Simpan sebagai, atau sebelum Kirim). */
  function bukaDialogNama(sebagai, kirim) {
    if (!sesiAktif) return setPesan({ teks: t('studio.tidakTersimpan'), nada: 'info' });
    setSimpanSebagai(sebagai);
    setLanjutKirim(kirim);
    setGalatNama('');
    setDialog('nama');
  }
  /** Dialog nama dikirim: simpan, lalu kirim bila itu tujuannya. */
  function simpanDariDialog(nama) {
    mulai(async () => {
      const h = await lakukanSimpan({ nama, sebagai: simpanSebagai });
      // nama bentrok atau ditolak: tampil di dalam dialog
      if (h.galat) return setGalatNama(h.galat);
      setDialog(null);
      if (lanjutKirim) await kirimSekarang(h.id);
      else setPesan({ teks: t('studio.tersimpan', { nama: h.nama }), nada: 'sukses' });
    });
  }
  /** Tombol Kirim (hanya saat dibuka dari tugas/butir): simpan dulu bila perlu, lalu kirim salinan ke tugas/butir. */
  function klikKirim() {
    if (!sesiAktif) return setPesan({ teks: t('studio.tidakTersimpan'), nada: 'info' });
    // proyek belum punya nama: minta nama dulu, pengiriman dilanjutkan setelah tersimpan
    if (!meta.id) return bukaDialogNama(false, true);
    mulai(async () => {
      let id = meta.id;
      if (kotor) {
        const h = await lakukanSimpan({});
        if (h.galat) return setPesan({ teks: h.galat, nada: 'bahaya' });
        id = h.id;
      }
      await kirimSekarang(id);
    });
  }
  /** Membuka proyek tersimpan dari dialog Buka. */
  function bukaProyek(id) {
    denganKonfirmasi(() =>
      mulai(async () => {
        const r = await bukaProyekStudio({ id });
        if (!r.ok) return setPesan({ teks: r.error, nada: 'bahaya' });
        muatProyek(r.data.isi, { id: r.data.id, nama: r.data.nama, tingkat: r.data.tingkat });
        setDialog(null);
      }),
    );
  }

  /** Menambahkan sprite baru ke proyek (posisi awal tersebar agar tidak bertumpuk) dan menjadikannya aktif. */
  function tambahSpriteBaru(bentuk) {
    setDialog(null);
    // batas jumlah sprite per proyek
    if (proyek.sprite.length >= BATAS_STUDIO.maksSprite) return setPesan({ teks: t('studio.spriteTerlaluBanyak', { maks: BATAS_STUDIO.maksSprite }), nada: 'bahaya' });
    const nomor = proyek.sprite.reduce((m, s) => Math.max(m, Number(s.id.slice(1)) || 0), 0) + 1;
    const dasar = { id: `s${nomor}`, x: ((nomor * 70) % 300) - 150, y: ((nomor * 55) % 200) - 100, tampil: true, skrip: [] };
    const baru = bentuk.jenis === JENIS_SPRITE.TEKS ? { ...dasar, jenis: JENIS_SPRITE.TEKS, ...bentuk.data } : { ...dasar, subjek: bentuk.kode, arah: 90, kostum: 0 };
    ubah((p) => ({ ...p, sprite: [...p.sprite, baru] }));
    setAktifId(baru.id);
  }
  /** Menambah sprite gambar dari pustaka. */
  const tambahSprite = (kode) => tambahSpriteBaru({ kode });
  /** Menyimpan dialog sprite teks: sprite baru, atau mengubah sprite teks yang sedang dipilih. */
  function simpanSpriteTeks(data) {
    if (dialog === 'ubahTeks' && aktif) {
      setDialog(null);
      return ubahSprite(aktif.id, (s) => ({ ...s, ...data }));
    }
    tambahSpriteBaru({ jenis: JENIS_SPRITE.TEKS, data });
  }
  /** Menghapus sprite terpilih (sudah dikonfirmasi); sprite lain menjadi aktif. */
  function hapusAktif() {
    const sisa = proyek.sprite.filter((s) => s.id !== hapusSprite);
    ubah((p) => ({ ...p, sprite: sisa }));
    setAktifId(sisa[0]?.id ?? null);
    setHapusSprite(null);
  }

  /** Variabel buatan sendiri baru (bernilai 0) ditambahkan ke proyek. */
  const buatVariabel = (nama) => ubah((p) => ({ ...p, variabel: { ...p.variabel, [nama]: 0 } }));
  /** Variabel dihapus dari proyek; blok yang masih merujuknya dianggap bernilai 0 saat dijalankan. */
  const hapusVariabel = (nama) =>
    ubah((p) => {
      const { [nama]: _hapus, ...sisa } = p.variabel;
      return { ...p, variabel: sisa };
    });

  /** Memilih berkas gambar dari Paint: diperkecil di browser, diunggah, lalu ditambahkan sebagai kostum terakhir sprite aktif. */
  async function unggahKostum(file) {
    if (!file || !aktifGambar) return;
    // kostum unggahan hanya bisa disimpan saat sesi berlangsung (sama seperti menyimpan proyek)
    if (!sesiAktif) return setPesan({ teks: t('studio.kostumButuhSesi'), nada: 'info' });
    if ((aktifGambar.kostumUnggahan?.length ?? 0) >= BATAS_STUDIO.maksKostumUnggahan) return setPesan({ teks: t('studio.kostumPenuh', { maks: BATAS_STUDIO.maksKostumUnggahan }), nada: 'bahaya' });
    setMengunggah(true);
    setPesan(null);
    try {
      const siap = await siapkanKostum(file);
      if (siap.galat) return setPesan({ teks: siap.galat, nada: 'bahaya' });
      const hasil = await kirimKostum(siap.blob);
      if (hasil.galat) return setPesan({ teks: hasil.galat, nada: 'bahaya' });
      ubahSprite(aktifGambar.id, (s) => ({ ...s, kostumUnggahan: [...(s.kostumUnggahan ?? []), hasil.id], kostum: 2 + (s.kostumUnggahan?.length ?? 0) }));
      setPesan({ teks: t('studio.kostumTerunggah'), nada: 'sukses' });
    } finally {
      setMengunggah(false);
      if (kolomBerkas.current) kolomBerkas.current.value = '';
    }
  }
  /** Menghapus kostum unggahan yang sudah dikonfirmasi: ditolak server bila sudah dirujuk kiriman tugas. */
  function hapusKostumTerpilih() {
    const { id } = hapusKostum;
    mulai(async () => {
      const r = await hapusKostumStudio({ id });
      setHapusKostum(null);
      // ditolak (sudah terkirim ke tugas, sesi ditutup): kostum tetap ada dan alasannya ditampilkan
      if (!r.ok) return setPesan({ teks: r.error, nada: 'bahaya' });
      ubah((p) => cabutKostum(p, id));
      setPesan({ teks: t('studio.kostumTerhapus'), nada: 'sukses' });
    });
  }

  const tombolKeyboard = mesin.jalan ? mesin.tekan : null;
  const opsiLatar = NAMA_LATAR.map((n) => ({ nilai: n, label: labelLatar(n) }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* dari tugas atau butir post test: kembali ke halaman asal (dashboard/post test); dibuka dari menu: ke beranda */}
        {tugas ? (
          <TombolKembali cadangan={gabungJalur(basis, tugas.jenis === 'butir' ? '/post-test' : '/')} />
        ) : (
          <TautanTombol href={gabungJalur(basis, '/')} varian="hantu" ikon="kembali">
            {t('umum.kembali')}
          </TautanTombol>
        )}
        <h1 className="font-display text-[1.6em] font-bold">{t('studio.judul')}</h1>
        <Badge nada={kotor ? 'peringatan' : 'netral'}>
          {meta.nama ?? t('studio.tanpaNama')}
          {kotor && <span> · {t('studio.belumTersimpan')}</span>}
        </Badge>
        <Badge nada="info">{t(`studio.tingkatLencana.${meta.tingkat}`)}</Badge>
      </div>

      {tugas && (
        <Card className="space-y-2">
          <p className="flex items-center gap-1.5 font-bold">
            <Badge nada="info">{t('studio.tugasIni')}</Badge>
          </p>
          <p className="whitespace-pre-wrap text-[1.1em]">{tugas.soal}</p>
          {terkirim && (
            <p className="flex items-center gap-1.5 font-semibold text-ok">
              <Ikon nama="sukses" />
              {t('studio.proyekTerkirim', { nama: terkirim })}
            </p>
          )}
        </Card>
      )}
      {!sesiAktif && (
        <p className="flex items-center gap-2 rounded-lg bg-warn-soft p-3 font-semibold text-warn">
          <Ikon nama="info" />
          {t('studio.belumAbsen')}
        </p>
      )}

      {/* baris proyek: baru, buka, simpan, simpan sebagai, dan kirim (bila dibuka dari tugas/butir) */}
      <div className="flex flex-wrap items-center gap-2">
        <Button varian="secondary" ikon="proyek_baru" disabled={mesin.jalan} onClick={klikProyekBaru}>
          {t('studio.proyekBaru')}
        </Button>
        <Button varian="secondary" ikon="buka" disabled={mesin.jalan} onClick={() => setDialog('buka')}>
          {t('studio.buka')}
        </Button>
        <Button ikon="simpan" memuat={memuat} disabled={mesin.jalan} onClick={klikSimpan}>
          {t('umum.simpan')}
        </Button>
        <Button varian="secondary" disabled={mesin.jalan || memuat} onClick={() => bukaDialogNama(true, false)}>
          {t('studio.simpanSebagai')}
        </Button>
        {tugas && (
          <Button varian="sukses" ukuran="lg" ikon="kirim" memuat={memuat} disabled={mesin.jalan} onClick={klikKirim}>
            {t(tugas.jenis === 'butir' ? 'studio.kirimKeButir' : 'studio.kirimKeTugas')}
          </Button>
        )}
      </div>
      <Pesan pesan={pesan} />

      {/* layar sempit: panggung di atas, editor di bawahnya; layar lebar: berdampingan */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Card className="space-y-3 self-start">
          <div className="flex flex-wrap items-center gap-2">
            {mesin.jalan ? (
              <Button varian="bahaya" ukuran="lg" ikon="berhenti" onClick={mesin.berhenti}>
                {t('studio.berhenti')}
              </Button>
            ) : (
              <Button varian="sukses" ukuran="lg" ikon="bendera" onClick={bendera}>
                {t('studio.bendera')}
              </Button>
            )}
            <Button varian="secondary" ikon={bisu ? 'bisu' : 'suara'} aria-pressed={bisu} onClick={() => setBisu((v) => !v)}>
              {t(bisu ? 'studio.suaraMati' : 'studio.suaraNyala')}
            </Button>
          </div>
          <PanggungStudio tampilan={mesin.tampilan ?? awal} idPanggung="panggung-studio" terpilih={aktif?.id ?? null} onPilih={mesin.jalan ? null : setAktifId} onGeser={mesin.jalan ? null : geserSprite} onKlik={mesin.jalan ? mesin.klik : null} onTombol={tombolKeyboard} />
          {/* blok Tanya: kotak jawaban muncul selama ada pertanyaan yang menunggu */}
          <KotakTanya pertanyaan={mesin.jalan ? (mesin.tampilan?.pertanyaan ?? null) : null} onJawab={mesin.jawab} />
          <div className="flex flex-wrap items-center gap-1" aria-label={t('studio.tombolKeyboard')}>
            <span className="mr-1 text-[0.9em] text-muted">{mesin.jalan ? t('studio.tekanTombol') : t('studio.tekanBendera')}</span>
            {DAFTAR_TOMBOL.map((k) => (
              <Button key={k} varian="hantu" disabled={!mesin.jalan} onClick={() => mesin.tekan(k)}>
                {t(`studio.tombol.${k}`)}
              </Button>
            ))}
          </div>

          <div className="space-y-3 border-t-2 border-line pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-[1.15em] font-bold">{t('studio.daftarSprite')}</h2>
              <div className="flex flex-wrap gap-2">
                <Button varian="secondary" ikon="tambah" disabled={mesin.jalan} onClick={() => setDialog('sprite')}>
                  {t('studio.tambahSprite')}
                </Button>
                {l3 && (
                  <Button varian="secondary" ikon="tambah" disabled={mesin.jalan} onClick={() => setDialog('teks')}>
                    {t('studio.tambahSpriteTeks')}
                  </Button>
                )}
                <Button varian="hantu" ikon="hapus" disabled={mesin.jalan || !aktif} onClick={() => setHapusSprite(aktif.id)}>
                  {t('studio.hapusSprite')}
                </Button>
              </div>
            </div>
            {proyek.sprite.length === 0 ? (
              <p className="text-muted">{t('studio.tanpaSprite')}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {proyek.sprite.map((s) => (
                  <li key={s.id}>
                    <button type="button" disabled={mesin.jalan} aria-pressed={s.id === aktif?.id} onClick={() => setAktifId(s.id)} className={`flex w-20 flex-col items-center gap-1 rounded-lg border-2 p-1.5 ${s.id === aktif?.id ? 'border-primary bg-primary-soft' : 'border-line bg-panel'}`}>
                      <GambarKecil sprite={s} />
                      <span className="w-full truncate text-center text-[0.8em] font-semibold">{namaSprite(s)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {aktif?.jenis === JENIS_SPRITE.TEKS && (
              <Button varian="secondary" ikon="ubah" disabled={mesin.jalan} onClick={() => setDialog('ubahTeks')}>
                {t('studio.ubahSpriteTeks')}
              </Button>
            )}
            {aktifGambar && (
              <div className="space-y-3">
                <fieldset className="space-y-1.5" disabled={mesin.jalan}>
                  <legend className="font-semibold">{t('studio.kostum')}</legend>
                  <div className="flex flex-wrap items-center gap-2">
                    {jalurKostumSprite(aktifGambar).map((src, k) => (
                      <span key={src} className="relative">
                        <button type="button" aria-pressed={aktifGambar.kostum === k} aria-label={t('studio.kostumKe', { nomor: k + 1 })} onClick={() => ubahSprite(aktifGambar.id, (s) => ({ ...s, kostum: k }))} className={`rounded-lg border-2 p-1 ${aktifGambar.kostum === k ? 'border-primary bg-primary-soft' : 'border-line bg-panel'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- gambar kostum statis atau berkas unggahan */}
                          <img src={src} alt="" draggable={false} className="size-12 object-contain" />
                        </button>
                        {/* hanya kostum unggahan (setelah dua kostum bawaan) yang bisa dihapus */}
                        {k >= 2 && (
                          <button type="button" aria-label={t('studio.hapusKostumAria', { nomor: k + 1 })} onClick={() => setHapusKostum({ id: aktifGambar.kostumUnggahan[k - 2], nomor: k + 1 })} className="absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full border-2 border-line bg-panel text-bad">
                            <Ikon nama="hapus" ukuran="0.9em" />
                          </button>
                        )}
                      </span>
                    ))}
                    {l3 && (
                      <>
                        <input ref={kolomBerkas} type="file" accept={TIPE_KOSTUM.join(',')} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => unggahKostum(e.target.files?.[0])} />
                        <Button varian="secondary" ikon="unggah" memuat={mengunggah} disabled={mesin.jalan} onClick={() => kolomBerkas.current?.click()}>
                          {t('studio.unggahKostum')}
                        </Button>
                      </>
                    )}
                  </div>
                  {l3 && <p className="text-[0.85em] text-muted">{t('studio.unggahPetunjuk', { maks: BATAS_STUDIO.maksKostumUnggahan })}</p>}
                </fieldset>
                <Select label={t('studio.pilihLatar')} value={proyek.latar} disabled={mesin.jalan} onChange={(e) => ubah((p) => ({ ...p, latar: e.target.value }))} opsi={opsiLatar} />
              </div>
            )}
            {!aktifGambar && <Select label={t('studio.pilihLatar')} value={proyek.latar} disabled={mesin.jalan} onChange={(e) => ubah((p) => ({ ...p, latar: e.target.value }))} opsi={opsiLatar} />}
          </div>
        </Card>
        <div className="space-y-2">
          {aktif && <p className="font-bold">{t('studio.blokUntuk', { nama: namaSprite(aktif) })}</p>}
          <EditorStudioDinamis blokTersedia={BLOK} skrip={aktif?.skrip ?? []} kunciSprite={kunciSprite} variabel={namaVariabel} spriteLain={spriteLain} onGanti={saatSkripBerubah} onBuatVariabel={() => setDialog('variabel')} terkunci={mesin.jalan || !aktif} />
          {mesin.jalan && <p className="font-semibold text-muted">{t('studio.berjalan')}</p>}
        </div>
      </div>

      <DialogSprite terbuka={dialog === 'sprite'} pustaka={pustaka} onPilih={tambahSprite} onTutup={() => setDialog(null)} />
      {/* dialog fitur Level 3 hanya dipasang untuk proyek tingkat 3 */}
      {l3 && (
        <DialogSpriteTeks terbuka={dialog === 'teks' || dialog === 'ubahTeks'} awal={dialog === 'ubahTeks' && aktif ? { teks: aktif.teks, ukuran: aktif.ukuran, warna: aktif.warna } : null} onSimpan={simpanSpriteTeks} onTutup={() => setDialog(null)} />
      )}
      {l3 && (
        <DialogVariabel terbuka={dialog === 'variabel'} variabel={namaVariabel} onBuat={buatVariabel} onHapus={hapusVariabel} onTutup={() => setDialog(null)} />
      )}
      <DialogTingkat
        terbuka={dialog === 'tingkat'}
        tingkatBoleh={tingkatBoleh}
        onPilih={(k) => {
          setDialog(null);
          denganKonfirmasi(() => muatProyek(proyekBaru(), null, k));
        }}
        onTutup={() => setDialog(null)}
      />
      <DialogBukaProyek terbuka={dialog === 'buka'} sesiAktif={sesiAktif} onBuka={bukaProyek} onTutup={() => setDialog(null)} />
      <DialogNamaProyek terbuka={dialog === 'nama'} awal={meta.nama ?? ''} memuat={memuat} galat={galatNama} onSimpan={simpanDariDialog} onTutup={() => setDialog(null)} />
      <ConfirmDialog
        terbuka={hapusSprite !== null}
        judul={t('studio.hapusSpriteJudul')}
        pesan={t('studio.hapusSpritePesan')}
        labelYa={t('studio.hapus')}
        labelBatal={t('siswa.tidakJadi')}
        nada="bahaya"
        maskot="menyemangati"
        onYa={hapusAktif}
        onBatal={() => setHapusSprite(null)}
      />
      <ConfirmDialog
        terbuka={hapusKostum !== null}
        judul={t('studio.hapusKostumJudul')}
        pesan={t('studio.hapusKostumPesan', { nomor: hapusKostum?.nomor ?? '' })}
        labelYa={t('studio.hapus')}
        labelBatal={t('siswa.tidakJadi')}
        nada="bahaya"
        maskot="menyemangati"
        memuat={memuat}
        onYa={hapusKostumTerpilih}
        onBatal={() => setHapusKostum(null)}
      />
      <ConfirmDialog
        terbuka={tertunda !== null}
        judul={t('studio.buangJudul')}
        pesan={t('studio.buangPesan')}
        labelYa={t('studio.buangYa')}
        labelBatal={t('siswa.tidakJadi')}
        nada="bahaya"
        maskot="berpikir"
        onYa={() => {
          const nanti = tertunda;
          setTertunda(null);
          setKotor(false);
          // tautan yang ditahan dilanjutkan; aksi (proyek baru/buka) dijalankan
          if (nanti.jenis === 'pergi') router.push(nanti.href);
          else nanti.aksi();
        }}
        onBatal={() => setTertunda(null)}
      />
    </div>
  );
}
