import 'server-only';
import { ambilDep } from '@/di/container';
import { semuaRoutes } from '@/modules/routes.index';
import { validasi } from '@/utils/validasi';
import { AppError } from '@/utils/appError';
import { t } from '@/utils/i18n';
import { AKSES } from '@/enums';
import { sukses, gagal, berkas, normalisasiError } from '@/utils/responseHandler';

/** Membaca input request sesuai `sumber` route: query string, body JSON, atau multipart form. */
async function bacaInput(request, sumber) {
  if (sumber === 'query') return Object.fromEntries(new URL(request.url).searchParams);
  if (sumber === 'form') {
    try {
      return Object.fromEntries((await request.formData()).entries());
    } catch {
      // body bukan multipart/form yang valid
      throw new AppError(t('api.formTidakValid'), 400);
    }
  }
  if (sumber === 'body') {
    try {
      return await request.json();
    } catch {
      // body bukan JSON yang valid: beri pesan jelas, bukan error 500
      throw new AppError(t('api.jsonTidakValid'), 400);
    }
  }
  // route tanpa input
  return undefined;
}

/** Mencari route yang cocok dengan metode dan path; null bila tidak ada. */
function cariRoute(metode, path) {
  return semuaRoutes.find((r) => r.metode === metode && r.path === path) ?? null;
}

/**
 * Perlindungan CSRF sederhana untuk metode yang mengubah data: bila header Origin ada,
 * host-nya harus sama dengan host request. Request tanpa Origin (mis. curl) tetap diizinkan.
 */
function periksaOrigin(request, metode) {
  // GET tidak mengubah data, jadi tidak perlu diperiksa
  if (metode === 'GET') return;
  const origin = request.headers.get('origin');
  // tanpa Origin (curl, skrip server): bukan request lintas situs dari browser
  if (!origin) return;
  let hostOrigin = null;
  try {
    hostOrigin = new URL(origin).host;
  } catch {
    // Origin rusak diperlakukan sama dengan origin asing
  }
  // request dari situs lain (indikasi CSRF): tolak
  if (hostOrigin !== request.headers.get('host')) throw new AppError(t('auth.tidakBerhak'), 403);
}

/** Mengubah hasil controller menjadi Response: berkas biner atau JSON seragam. */
function bentukRespons(hasil) {
  // controller mengembalikan berkas (mis. logo): kirim biner apa adanya
  if (hasil?.__berkas) return berkas(hasil.buffer, hasil.tipe, hasil.namaFile);
  return sukses(hasil);
}

/**
 * Menjalankan satu request HTTP: cari route, periksa Origin dan hak `akses` (sebelum controller),
 * baca dan validasi input, panggil controller dengan (input, sesi), bungkus hasil. Error ditangani di sini.
 */
export async function tanganiRequest(request, metode, segmen) {
  try {
    const route = cariRoute(metode, `/${(segmen ?? []).join('/')}`);
    // path/metode tidak terdaftar: 404 seragam
    if (!route) return gagal(t('api.tidakDitemukan'), 404);
    periksaOrigin(request, metode);
    // route tanpa `akses` dianggap butuh login pengelola (aman bila lupa diisi)
    const sesi = await ambilDep().authController.wajibAkses(route.akses ?? AKSES.PENGGUNA);
    let input = await bacaInput(request, route.sumber);
    // schema tingkat route (opsional); validasi mendalam tetap ada di controller
    if (route.schema) input = validasi(route.schema, input);
    const controller = ambilDep()[route.controller];
    return bentukRespons(await controller[route.fungsi](input, sesi));
  } catch (error) {
    const { status, message, detail } = normalisasiError(error);
    return gagal(message, status, detail);
  }
}
