import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Hook loader Node untuk skrip: menerjemahkan alias @/ (tsconfig) ke folder src/ dan memuat berkas JSON
// tanpa atribut impor (Next.js mengizinkan `import x from './a.json'`, Node murni tidak).

/** Folder src/ project. */
const SRC = new URL('../src/', import.meta.url);

/** Mencari berkas nyata untuk jalur tanpa ekstensi: berkas .js lalu index.js di dalam folder. */
function lengkapiEkstensi(url) {
  // jalur sudah berekstensi dan berkasnya ada
  if (existsSync(fileURLToPath(url)) && /\.\w+$/.test(url.pathname)) return url;
  const calon = [new URL(`${url.href}.js`), new URL(`${url.href}/index.js`)];
  return calon.find((c) => existsSync(fileURLToPath(c))) ?? url;
}

/** Hook resolve: @/x -> src/x (dengan ekstensi .js bila tidak ditulis). */
export async function resolve(specifier, context, nextResolve) {
  // bukan alias: serahkan ke resolver bawaan Node
  if (!specifier.startsWith('@/')) return nextResolve(specifier, context);
  return nextResolve(lengkapiEkstensi(new URL(specifier.slice(2), SRC)).href, context);
}

/** Hook load: berkas .json dimuat sebagai modul ES dengan ekspor default isinya. */
export async function load(url, context, nextLoad) {
  // selain JSON lokal: pemuat bawaan
  if (!url.startsWith('file:') || !url.endsWith('.json')) return nextLoad(url, context);
  const isi = await readFile(fileURLToPath(url), 'utf8');
  return { format: 'module', source: `export default ${isi};`, shortCircuit: true };
}
