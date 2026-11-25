import 'server-only';
import { cookies, headers } from 'next/headers';
import { HEADER_BASIS } from '@/config/area.config';
import { keamananConfig } from '@/config/keamanan.config';

/** IP cadangan bila tidak ada informasi alamat (kolom percobaan_login.ip wajib terisi). */
const IP_TIDAK_DIKETAHUI = '0.0.0.0';

/**
 * Penyimpan cookie sesi untuk request yang sedang berjalan (next/headers).
 * Cookie selalu httpOnly, sameSite=lax, path=/, secure di produksi, dan TANPA atribut Domain
 * sehingga cookie host siswa tidak pernah terkirim ke host backoffice dan sebaliknya.
 */
export const cookieSesi = {
  /** Membaca nilai cookie; null bila tidak ada. */
  async baca(nama) {
    return (await cookies()).get(nama)?.value ?? null;
  },
  /** Menyimpan cookie dengan masa berlaku (detik); tanpa masa berlaku = cookie sesi browser. */
  async simpan(nama, nilai, maxAgeDetik = null) {
    const opsi = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
    // masa berlaku diisi: cookie bertahan setelah browser ditutup sampai waktunya habis
    if (maxAgeDetik) opsi.maxAge = maxAgeDetik;
    (await cookies()).set(nama, nilai, opsi);
  },
  /** Menghapus cookie. */
  async hapus(nama) {
    (await cookies()).delete(nama);
  },
};

/**
 * IP klien dari x-forwarded-for, dibaca dari KANAN. Tiap proxy menambahkan alamat pengirimnya di belakang,
 * jadi entri ke-N dari kanan (N = jumlah proxy tepercaya) adalah alamat yang dicatat proxy kita sendiri.
 * Entri di sebelah kirinya bisa dikirim klien dan tidak dipercaya. Tanpa proxy, Next.js mengisi header ini
 * dengan alamat koneksi hanya bila klien tidak mengirimnya, sehingga lingkungan produksi wajib memakai reverse proxy.
 */
function ipKlien(nilaiHeader) {
  const daftar = String(nilaiHeader ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // header kosong (seharusnya tidak terjadi karena Next.js mengisinya): kolom ip tetap wajib terisi
  if (daftar.length === 0) return IP_TIDAK_DIKETAHUI;
  // rantai lebih pendek dari jumlah proxy yang disetel (salah konfigurasi): pakai entri paling kiri yang ada
  return daftar[Math.max(0, daftar.length - keamananConfig.jumlahProxyTepercaya)];
}

/** Informasi request: IP klien (lihat ipKlien), user agent ringkas, dan awalan jalur area. */
export async function infoPermintaan() {
  const h = await headers();
  const ip = ipKlien(h.get('x-forwarded-for'));
  return {
    ip: ip.slice(0, 45),
    perangkat: (h.get('user-agent') ?? '').slice(0, 255) || null,
    basis: h.get(HEADER_BASIS) ?? '',
  };
}
