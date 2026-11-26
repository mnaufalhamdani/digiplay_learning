'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/utils/i18n';
import { gabungJalur } from '@/utils/jalurArea';
import { useArea } from '@/modules/shared/ui/AreaContext';
import Badge from '@/modules/shared/ui/Badge';
import Button from '@/modules/shared/ui/Button';
import Ikon from '@/modules/shared/ui/Ikon';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import Maskot from '@/modules/shared/ui/domain/Maskot';
import { tandaiPaham } from './materi.actions';

/**
 * Bagian bawah materi dengan penanda akhir (sentinel) dan tombol "Saya sudah paham".
 * Tombol hanya ada bila `bisaPaham` (materi pertemuan sesi berlangsung yang belum ditandai) dan baru aktif setelah
 * penanda akhir terlihat di layar (IntersectionObserver). Selain itu hanya mode baca dengan tombol kembali.
 */
export default function PenutupMateri({ pertemuanId, bisaPaham, sudahPaham, pertemuanSesi, adaSesi }) {
  const router = useRouter();
  const { basis } = useArea();
  const penanda = useRef(null);
  const [sampaiAkhir, setSampaiAkhir] = useState(false);
  const [galat, setGalat] = useState('');
  const [memuat, mulai] = useTransition();

  // pantau penanda akhir; sekali terlihat, tombol tetap aktif walau siswa menggulir naik lagi
  useEffect(() => {
    if (!bisaPaham) return undefined;
    // browser tanpa IntersectionObserver: anggap sudah sampai agar siswa tidak terblokir
    if (typeof IntersectionObserver === 'undefined') {
      setSampaiAkhir(true);
      return undefined;
    }
    const pengamat = new IntersectionObserver((entri) => {
      if (entri.some((e) => e.isIntersecting)) {
        setSampaiAkhir(true);
        pengamat.disconnect();
      }
    });
    pengamat.observe(penanda.current);
    return () => pengamat.disconnect();
  }, [bisaPaham]);

  /** Menyimpan "sudah paham" lalu membuka daftar tugas pertemuan ini (beranda). */
  function paham() {
    setGalat('');
    mulai(async () => {
      const r = await tandaiPaham({ pertemuanId });
      // ditolak (mis. sesi sudah ditutup tutor): tampilkan pesan ramah dan tetap di halaman ini
      if (!r.ok) return setGalat(r.error);
      router.push(gabungJalur(basis, '/'));
      router.refresh();
    });
  }

  // mode baca: tanpa tombol paham; materi sesi yang sudah dipahami kembali ke tugas, selain itu ke pustaka materi
  if (!bisaPaham) {
    return (
      <div className="space-y-4 border-t-2 border-line pt-6">
        {sudahPaham && (
          <Badge nada="sukses">
            <Ikon nama="sukses" />
            {t('materi.sudahPaham')}
          </Badge>
        )}
        {/* sentinel tidak dipakai di mode baca */}
        <p className="text-muted">{t('materi.modeBaca')}</p>
        {!adaSesi && <p className="font-semibold">{t('materi.tungguAbsen')}</p>}
        <div className="flex flex-wrap gap-3">
          {pertemuanSesi ? (
            <TautanTombol href={gabungJalur(basis, '/')} ukuran="lg" ikon="kembali">
              {t('materi.kembaliTugas')}
            </TautanTombol>
          ) : (
            <TautanTombol href={gabungJalur(basis, '/materi')} varian="secondary" ukuran="lg" ikon="kembali">
              {t('materi.kembaliDaftar')}
            </TautanTombol>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* penanda akhir materi: bila ini sudah terlihat di layar, siswa dianggap sudah membaca sampai bawah */}
      <div ref={penanda} aria-hidden="true" className="h-px" />
      <div className="flex flex-col items-center gap-3 rounded-lg bg-primary-soft p-4 text-center sm:p-6">
        <Maskot suasana={sampaiAkhir ? 'merayakan' : 'menunjuk'} ukuran={100} />
        <p className="font-display text-[1.3em] font-bold">{t(sampaiAkhir ? 'materi.siapPaham' : 'materi.pahamPetunjuk')}</p>
        <Button ukuran="lg" ikon="sukses" disabled={!sampaiAkhir} memuat={memuat} onClick={paham}>
          {t('materi.paham')}
        </Button>
        {galat && (
          <p role="alert" className="flex items-center gap-1.5 font-semibold text-bad">
            <Ikon nama="peringatan" />
            {galat}
          </p>
        )}
      </div>
    </div>
  );
}
