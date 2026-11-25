import { ambilDep } from '@/di/container';
import { wajibPengguna } from '@/modules/auth/auth.guard';
import { infoPermintaan } from '@/utils/konteksPermintaan';
import { gabungJalur } from '@/utils/jalurArea';
import { atau404 } from '@/utils/atau404';
import { t } from '@/utils/i18n';
import { PERAN } from '@/enums';
import Card from '@/modules/shared/ui/Card';
import TautanTombol from '@/modules/shared/ui/TautanTombol';
import LencanaTemplate from './LencanaTemplate';
import PratinjauTemplate from './PratinjauTemplate';

/** Blok JSON terformat (parameter, opsi, kunci); kosong ditulis "tidak ada". */
function BlokJson({ judul, nilai }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold">{judul}</h3>
      {/* kolom NULL: tidak perlu blok kode kosong */}
      {nilai == null ? (
        <p className="text-muted">{t('template.tidakAdaIsi')}</p>
      ) : (
        <pre className="overflow-x-auto rounded-md border border-line bg-bg p-3 font-mono text-[0.85em] whitespace-pre-wrap break-words">{JSON.stringify(nilai, null, 2)}</pre>
      )}
    </div>
  );
}

/** Detail template: letak, isi mentah, pratinjau contoh render, dan tombol ubah untuk admin. */
export default async function HalamanDetailTemplate({ params }) {
  const sesi = await wajibPengguna();
  const { id } = await params;
  const [tpl, info] = await Promise.all([atau404(() => ambilDep().templateController.detail({ id })), infoPermintaan()]);
  const href = (jalur) => gabungJalur(info.basis, jalur);
  return (
    <div className="space-y-4">
      <TautanTombol href={href('/template')} varian="hantu" ikon="kembali">
        {t('template.kembali')}
      </TautanTombol>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-[1.5em] font-bold break-all">{tpl.kode}</h1>
          <p className="text-muted">
            {tpl.level_nama} ({tpl.level_kode}) · P{tpl.pertemuan_nomor} {tpl.pertemuan_judul}
            {tpl.bagian_kode ? ` · ${t('template.bagian')} ${tpl.bagian_kode} ${tpl.bagian_nama}` : ''}
          </p>
          <LencanaTemplate tpl={tpl} />
          <p className="text-muted">{t('template.kesulitanNilai', { nilai: tpl.kesulitan })}</p>
        </div>
        {sesi.peran === PERAN.ADMIN && (
          <TautanTombol href={href(`/template/${tpl.id}/ubah`)} varian="secondary" ikon="ubah">
            {t('umum.ubah')}
          </TautanTombol>
        )}
      </div>
      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold">{t('template.teks')}</h2>
          <p className="whitespace-pre-wrap">{tpl.teks}</p>
        </div>
        <BlokJson judul={t('template.parameter')} nilai={tpl.parameter} />
        <BlokJson judul={t('template.opsi')} nilai={tpl.opsi} />
        <BlokJson judul={t('template.kunci')} nilai={tpl.kunci} />
      </Card>
      <PratinjauTemplate id={tpl.id} />
    </div>
  );
}
