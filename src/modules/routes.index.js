import { healthRoutes } from './health/health.routes';
import { pengaturanRoutes } from './pengaturan/pengaturan.routes';
import { authRoutes } from './auth/auth.routes';
import { tugasRoutes } from './tugas/tugas.routes';
import { posttestRoutes } from './posttest/posttest.routes';
import { sertifikatRoutes } from './sertifikat/sertifikat.routes';
import { karyaRoutes } from './karya/karya.routes';
import { eksporRoutes } from './ekspor/ekspor.routes';
import { studioRoutes } from './studio/studio.routes';

/** Gabungan semua daftar endpoint modul; dipakai satu pintu masuk di src/app/api/v1. */
export const semuaRoutes = [...healthRoutes, ...pengaturanRoutes, ...authRoutes, ...tugasRoutes, ...posttestRoutes, ...sertifikatRoutes, ...karyaRoutes, ...eksporRoutes, ...studioRoutes];
