import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { t } from '@/utils/i18n';
import { JENIS_EKSPOR, MAKS_BARIS_EKSPOR } from '@/enums';
import { kelasTombol } from '@/modules/shared/ui/kelasTombol';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';
import Select from '@/modules/shared/ui/Select';
import TextField from '@/modules/shared/ui/TextField';

/** Ikon tombol unduh per jenis ekspor. */
const IKON = { siswa: 'siswa', kehadiran: 'absensi', 'post-test': 'target', pembayaran: 'bayar' };

/**
 * Halaman Ekspor (F3, admin dan tutor): satu form filter (level, dari, sampai) dengan tombol unduh per jenis.
 * Form GET biasa: tiap tombol mengirim filter ke /api/v1/ekspor/<jenis> (formAction), browser mengunduh CSV-nya.
 */
export default async function HalamanEkspor() {
  await wajibPengguna();
  const level = await ambilDep().siswaController.pilihanLevel();
  const opsiLevel = [{ nilai: '', label: t('umum.semua') }, ...level.map((l) => ({ nilai: l.id, label: `${l.kode} · ${l.nama}` }))];
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-[1.5em] font-bold">{t('ekspor.judul')}</h1>
        <p className="text-muted">{t('ekspor.petunjuk', { maks: MAKS_BARIS_EKSPOR.toLocaleString('id-ID') })}</p>
      </div>
      <Card as="form" method="get" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label={t('ekspor.level')} name="level" opsi={opsiLevel} defaultValue="" />
          <TextField label={t('ekspor.dari')} name="dari" type="date" />
          <TextField label={t('ekspor.sampai')} name="sampai" type="date" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {JENIS_EKSPOR.map((j) => (
            <button key={j} type="submit" formAction={`/api/v1/ekspor/${j}`} className={kelasTombol({ varian: 'secondary', penuh: true })}>
              <Ikon nama={IKON[j]} />
              {t(`ekspor.unduh.${j}`)}
            </button>
          ))}
        </div>
        <p className="text-[0.9em] text-muted">{t('ekspor.catatanFilter')}</p>
      </Card>
    </div>
  );
}
