import { register } from 'node:module';

// Dipasang lewat `node --import ./scripts/_alias.mjs` agar skrip bisa memakai utilitas aplikasi di src/
// (alias @/ dan impor berkas JSON) persis seperti saat dijalankan Next.js. Lihat _aliasHooks.mjs.
register('./_aliasHooks.mjs', import.meta.url);
