import 'server-only';
import { AppError } from '@/utils/appError';

/** Usecase health: memastikan aplikasi bisa menjangkau database. */
export function buatHealthUsecase({ healthModel, logger }) {
  return {
    /** Mengembalikan status sehat; bila database tidak terjangkau melempar AppError 503 tanpa detail internal. */
    async cek() {
      try {
        await healthModel.ping();
      } catch (error) {
        // detail koneksi (host, user) hanya masuk log server, tidak ke pemanggil
        logger.error('Health check: database gagal', error);
        throw new AppError('Database tidak dapat dihubungi.', 503);
      }
      return { status: 'ok', database: 'ok', waktu: new Date().toISOString() };
    },
  };
}
