import { z } from 'zod';
import { queryId, queryTanggal } from '@/utils/schemaDasar';

/** Filter ekspor dari query string: `level` (ID level), `dari`, `sampai` (YYYY-MM-DD); nilai tidak sah diabaikan. */
export const filterEksporSchema = z
  .object({ level: queryId, dari: queryTanggal, sampai: queryTanggal })
  .transform(({ level, dari, sampai }) => ({ levelId: level ?? null, dari: dari ?? null, sampai: sampai ?? null }));
