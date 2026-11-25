import { NextResponse } from 'next/server';
import { areaDariHost, FOLDER_AREA, HEADER_BASIS } from '@/config/area.config';

/** Jalur publik yang sama di kedua host (verifikasi sertifikat, Fase E). */
const AWALAN_PUBLIK = '/verifikasi';

/** Apakah jalur berada di bawah sebuah folder (persis folder itu atau anaknya). */
function diBawah(pathname, folder) {
  return pathname === folder || pathname.startsWith(`${folder}/`);
}

/**
 * Hostname (tanpa port) dari header Host yang dikirim browser. nextUrl.hostname tidak dipakai karena
 * Next.js bisa mengisinya dengan host server sendiri (mis. localhost), bukan host yang diminta.
 */
function hostnameRequest(request) {
  const host = request.headers.get('host') ?? request.nextUrl.host;
  return host.replace(/:\d+$/, '').toLowerCase();
}

/** Jawaban 404 seragam untuk akses silang antar area. */
function tolak() {
  return new NextResponse('Halaman tidak ditemukan.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/** Menulis ulang request ke jalur tujuan sambil membawa header awalan jalur area untuk tautan. */
function tulisUlang(request, tujuan, basis) {
  const url = request.nextUrl.clone();
  url.pathname = tujuan;
  const headers = new Headers(request.headers);
  headers.set(HEADER_BASIS, basis);
  return NextResponse.rewrite(url, { request: { headers } });
}

/** Jalur verifikasi sertifikat publik: tidak disimpan cache dan tidak diindeks mesin pencari. */
function tulisUlangPublik(request, pathname) {
  const res = tulisUlang(request, `/publik${pathname}`, '');
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

/** Meneruskan request apa adanya (cadangan dev) dengan header awalan jalur area. */
function teruskan(request, basis) {
  const headers = new Headers(request.headers);
  headers.set(HEADER_BASIS, basis);
  return NextResponse.next({ request: { headers } });
}

/**
 * Cadangan dev untuk host yang tidak dikenal (localhost, IP): /siswa/* dan /backoffice/* dibuka langsung.
 * Awalan jalur diisi folder area agar tautan di dalam halaman tetap benar.
 */
function cadanganDev(request) {
  const { pathname } = request.nextUrl;
  // folder area dibuka langsung: teruskan dengan awalan jalur folder itu
  if (diBawah(pathname, FOLDER_AREA.siswa)) return teruskan(request, FOLDER_AREA.siswa);
  if (diBawah(pathname, FOLDER_AREA.pengelola)) return teruskan(request, FOLDER_AREA.pengelola);
  // jalur publik tetap dipetakan agar sama dengan host asli
  if (diBawah(pathname, AWALAN_PUBLIK)) return tulisUlangPublik(request, pathname);
  return NextResponse.next();
}

/**
 * Pengarah domain: host siswa -> src/app/siswa, host backoffice -> src/app/backoffice.
 * Akses langsung ke folder area lain dijawab 404. /api, /_next, /aset, dan berkas statis tidak lewat sini (matcher).
 */
export function proxy(request) {
  const area = areaDariHost(hostnameRequest(request));
  // host tidak dikenal: akses lewat localhost/IP saat pengembangan
  if (!area) return cadanganDev(request);

  const { pathname } = request.nextUrl;
  const folderSendiri = FOLDER_AREA[area];
  const folderLain = area === 'siswa' ? FOLDER_AREA.pengelola : FOLDER_AREA.siswa;
  // akses silang (mis. /backoffice di host siswa) atau jalur internal /publik: selalu 404
  if (diBawah(pathname, folderLain) || diBawah(pathname, '/publik')) return tolak();
  // jalur publik verifikasi sertifikat berlaku di kedua host
  if (diBawah(pathname, AWALAN_PUBLIK)) return tulisUlangPublik(request, pathname);
  return tulisUlang(request, pathname === '/' ? folderSendiri : `${folderSendiri}${pathname}`, '');
}

export const config = {
  // lewati API, aset Next.js, aset publik, dan berkas berekstensi (favicon.ico, gambar, dst)
  matcher: ['/((?!api|_next|aset|.*\\..*).*)'],
};
