import { notFound } from 'next/navigation';
import { adalahAppError } from './appError';

/**
 * Menjalankan pembacaan data untuk halaman detail. ID tidak sah (400) atau data tidak ada (404)
 * ditampilkan sebagai halaman 404, bukan galat server.
 */
export async function atau404(fn) {
  try {
    return await fn();
  } catch (error) {
    // galat lain (mis. database mati) tetap diteruskan sebagai galat server
    if (adalahAppError(error) && (error.status === 400 || error.status === 404)) notFound();
    throw error;
  }
}
