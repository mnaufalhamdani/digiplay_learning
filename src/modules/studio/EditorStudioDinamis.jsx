'use client';
import dynamic from 'next/dynamic';
import { t } from '@/utils/i18n';
import Card from '@/modules/shared/ui/Card';
import Ikon from '@/modules/shared/ui/Ikon';

/**
 * Editor blok Studio Zippy yang dimuat hanya di browser (tanpa SSR): pustaka Blockly besar, jadi hanya halaman yang
 * memakainya (Studio siswa dan pratinjau tutor) yang mengunduhnya. Dipakai bersama agar pemuatnya tidak digandakan.
 */
const EditorStudioDinamis = dynamic(() => import('./EditorStudio'), {
  ssr: false,
  loading: () => (
    <Card className="flex h-[26rem] items-center justify-center text-muted sm:h-[32rem]">
      <Ikon nama="memuat" className="animate-spin" />
      <span className="ml-2 font-semibold">{t('studio.memuat')}</span>
    </Card>
  ),
});

export default EditorStudioDinamis;
