import 'server-only';
import { AppError } from '@/utils/appError';
import { adalahDuplikat } from '@/utils/galatDb';
import { hashPassword, cocokPassword } from '@/utils/kripto';
import { t } from '@/utils/i18n';
import { AKSI_LOG, PERAN } from '@/enums';

/** Usecase pengguna: kelola akun admin/tutor (tanpa hapus) dan ubah password sendiri. */
export function buatPenggunaUsecase({ penggunaModel, db, idGen, catatAktivitas }) {
  /** Mengambil akun atau melempar 404. */
  async function wajibAda(id, conn = null) {
    const akun = await penggunaModel.cariId(id, conn);
    if (!akun) throw new AppError(t('pengguna.tidakAda'), 404);
    return akun;
  }

  /** Menolak perubahan bila akun ini adalah satu-satunya admin aktif. */
  async function pastikanBukanAdminTerakhir(id, conn) {
    const admin = await penggunaModel.adminAktifDikunci(conn);
    // tanpa admin aktif tidak ada yang bisa membuka Pengaturan dan Pengguna lagi
    if (admin.length <= 1 && admin.some((a) => a.id === id)) throw new AppError(t('pengguna.adminTerakhir'), 409);
  }

  return {
    /** Semua akun untuk halaman Pengguna. */
    daftar: () => penggunaModel.daftar(),
    /** Satu akun (tanpa hash password). */
    detail: (id) => wajibAda(id),
    /** Membuat akun baru; email yang sudah dipakai ditolak dengan pesan ramah. */
    async tambah({ nama, email, peran, password }, pelakuId) {
      const id = idGen.generate();
      try {
        await penggunaModel.tambah({ id, nama, email, peran, passwordHash: await hashPassword(password) });
      } catch (error) {
        // indeks unik email bentrok: akun dengan email itu sudah ada
        if (adalahDuplikat(error, 'uq_pengguna_email')) throw new AppError(t('pengguna.emailDipakai'), 409);
        throw error;
      }
      await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.TAMBAH_PENGGUNA, entitas: 'pengguna', entitasId: id, detail: { nama, email, peran } });
      return { id };
    },
    /** Mengubah nama/peran; admin aktif terakhir tidak boleh diturunkan menjadi tutor. */
    async ubah(id, { nama, peran }, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await wajibAda(id, conn);
        // menurunkan admin aktif: pastikan masih ada admin aktif lain
        if (lama.peran === PERAN.ADMIN && peran !== PERAN.ADMIN && lama.aktif) await pastikanBukanAdminTerakhir(id, conn);
        await penggunaModel.ubah(id, { nama, peran }, conn);
        const detail = { sebelum: { nama: lama.nama, peran: lama.peran }, sesudah: { nama, peran } };
        await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.UBAH_PENGGUNA, entitas: 'pengguna', entitasId: id, detail }, conn);
      });
      return { id };
    },
    /** Mengaktifkan/menonaktifkan akun; admin aktif terakhir tidak boleh dinonaktifkan. */
    async ubahAktif(id, aktif, pelakuId) {
      await db.transaction(async (conn) => {
        const lama = await wajibAda(id, conn);
        // menonaktifkan admin: pastikan masih ada admin aktif lain
        if (!aktif && lama.peran === PERAN.ADMIN && lama.aktif) await pastikanBukanAdminTerakhir(id, conn);
        await penggunaModel.ubahAktif(id, aktif, conn);
        const aksi = aktif ? AKSI_LOG.AKTIFKAN_PENGGUNA : AKSI_LOG.NONAKTIFKAN_PENGGUNA;
        await catatAktivitas({ penggunaId: pelakuId, aksi, entitas: 'pengguna', entitasId: id, detail: { sebelum: Boolean(lama.aktif), sesudah: aktif } }, conn);
      });
      return { id };
    },
    /** Admin mengatur ulang password akun lain (password tidak ikut dicatat di log). */
    async resetPassword(id, password, pelakuId) {
      await wajibAda(id);
      await penggunaModel.ubahPassword(id, await hashPassword(password));
      await catatAktivitas({ penggunaId: pelakuId, aksi: AKSI_LOG.RESET_PASSWORD, entitas: 'pengguna', entitasId: id });
      return { id };
    },
    /** Pengguna mengganti password sendiri; wajib password lama yang benar. */
    async ubahPasswordSendiri(penggunaId, { passwordLama, passwordBaru }) {
      const hash = await penggunaModel.ambilHash(penggunaId);
      // password lama salah: tolak tanpa mengubah apa pun
      if (!(await cocokPassword(passwordLama, hash))) throw new AppError(t('akun.passwordLamaSalah'), 400, [{ kolom: 'passwordLama', pesan: t('akun.passwordLamaSalah') }]);
      await penggunaModel.ubahPassword(penggunaId, await hashPassword(passwordBaru));
      await catatAktivitas({ penggunaId, aksi: AKSI_LOG.UBAH_PASSWORD_SENDIRI, entitas: 'pengguna', entitasId: penggunaId });
      return { id: penggunaId };
    },
  };
}
