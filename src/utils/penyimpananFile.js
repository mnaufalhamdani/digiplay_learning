import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AppError } from './appError';

/**
 * Penyimpanan berkas di disk (folder UPLOAD_DIR, bawaan uploads/). Nama berkas dibuat aplikasi,
 * tidak pernah memakai nama dari user, dan path selalu dicek tetap di dalam folder unggahan.
 */
export function buatPenyimpananFile() {
  const akar = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

  /** Mengubah path relatif menjadi path absolut dan memastikan tetap di dalam folder unggahan. */
  function resolveAman(pathRelatif) {
    const absolut = path.resolve(/* turbopackIgnore: true */ akar, pathRelatif);
    // path keluar dari folder unggahan: tolak (indikasi manipulasi path)
    if (!absolut.startsWith(akar + path.sep)) throw new AppError('Path berkas tidak valid.', 400);
    return absolut;
  }

  return {
    /** Menyimpan buffer pada path relatif (folder dibuat bila belum ada). */
    async simpanDi(pathRelatif, buffer) {
      const absolut = resolveAman(pathRelatif);
      await fs.mkdir(path.dirname(absolut), { recursive: true });
      await fs.writeFile(absolut, buffer);
      return { pathRelatif };
    },
    /** Membaca isi berkas. */
    async baca(pathRelatif) {
      return fs.readFile(resolveAman(pathRelatif));
    },
    /** Menghapus folder bila sudah kosong (tidak rekursif); folder tidak ada atau masih berisi dibiarkan. */
    async hapusFolderKosong(pathRelatif) {
      try {
        await fs.rmdir(resolveAman(pathRelatif));
      } catch (error) {
        // folder tidak ada atau masih berisi berkas lain: tidak ada yang perlu dihapus
        if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY' && error.code !== 'EEXIST') throw error;
      }
    },
    /** Menghapus berkas; berkas yang sudah tidak ada dianggap tidak masalah. */
    async hapus(pathRelatif) {
      try {
        await fs.unlink(resolveAman(pathRelatif));
      } catch (error) {
        // berkas memang sudah hilang: tujuan penghapusan tercapai, abaikan
        if (error.code !== 'ENOENT') throw error;
      }
    },
  };
}
