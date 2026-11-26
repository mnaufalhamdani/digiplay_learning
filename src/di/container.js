import 'server-only';
import { createContainer, asFunction, asValue, InjectionMode } from 'awilix';
import { ambilPool, buatDb } from '@/config/database';
import { keamananConfig } from '@/config/keamanan.config';
import { logger } from '@/logger/logger';
import IdGenerator from '@/utils/idGenerator';
import { buatPenyimpananFile } from '@/utils/penyimpananFile';
import { cookieSesi, infoPermintaan } from '@/utils/konteksPermintaan';
import { buatHealthModel } from '@/modules/health/health.model';
import { buatHealthUsecase } from '@/modules/health/health.usecase';
import { buatHealthController } from '@/modules/health/health.controller';
import { buatLogModel } from '@/modules/log/log.model';
import { buatLogUsecase } from '@/modules/log/log.usecase';
import { buatPengaturanModel } from '@/modules/pengaturan/pengaturan.model';
import { buatPengaturanUsecase } from '@/modules/pengaturan/pengaturan.usecase';
import { buatPengaturanController } from '@/modules/pengaturan/pengaturan.controller';
import { buatPenggunaModel } from '@/modules/pengguna/pengguna.model';
import { buatPenggunaUsecase } from '@/modules/pengguna/pengguna.usecase';
import { buatPenggunaController } from '@/modules/pengguna/pengguna.controller';
import { buatAuthModel } from '@/modules/auth/auth.model';
import { buatAuthUsecase } from '@/modules/auth/auth.usecase';
import { buatAuthController } from '@/modules/auth/auth.controller';
import { buatLogController } from '@/modules/log/log.controller';
import { buatLevelModel } from '@/modules/level/level.model';
import { buatLevelUsecase } from '@/modules/level/level.usecase';
import { buatLevelController } from '@/modules/level/level.controller';
import { buatGambarModel } from '@/modules/gambar/gambar.model';
import { buatGambarUsecase } from '@/modules/gambar/gambar.usecase';
import { buatGambarController } from '@/modules/gambar/gambar.controller';
import { buatTemplateModel } from '@/modules/template/template.model';
import { buatTemplateUsecase } from '@/modules/template/template.usecase';
import { buatTemplateController } from '@/modules/template/template.controller';
import { buatSiswaModel } from '@/modules/siswa/siswa.model';
import { buatSiswaUsecase } from '@/modules/siswa/siswa.usecase';
import { buatSiswaController } from '@/modules/siswa/siswa.controller';
import { buatTugasModel } from '@/modules/tugas/tugas.model';
import { buatTugasUsecase } from '@/modules/tugas/tugas.usecase';
import { buatTugasController } from '@/modules/tugas/tugas.controller';
import { buatPembayaranModel } from '@/modules/pembayaran/pembayaran.model';
import { buatPembayaranUsecase } from '@/modules/pembayaran/pembayaran.usecase';
import { buatPembayaranController } from '@/modules/pembayaran/pembayaran.controller';
import { buatSesiModel } from '@/modules/sesi/sesi.model';
import { buatSesiUsecase } from '@/modules/sesi/sesi.usecase';
import { buatSesiController } from '@/modules/sesi/sesi.controller';
import { buatMengetikModel } from '@/modules/mengetik/mengetik.model';
import { buatMengetikUsecase } from '@/modules/mengetik/mengetik.usecase';
import { buatMengetikController } from '@/modules/mengetik/mengetik.controller';
import { buatLatihanModel } from '@/modules/latihan/latihan.model';
import { buatLatihanUsecase } from '@/modules/latihan/latihan.usecase';
import { buatLatihanController } from '@/modules/latihan/latihan.controller';
import { buatPosttestModel } from '@/modules/posttest/posttest.model';
import { buatPosttestUsecase } from '@/modules/posttest/posttest.usecase';
import { buatPosttestController } from '@/modules/posttest/posttest.controller';
import { buatSertifikatModel } from '@/modules/sertifikat/sertifikat.model';
import { buatSertifikatUsecase } from '@/modules/sertifikat/sertifikat.usecase';
import { buatSertifikatController } from '@/modules/sertifikat/sertifikat.controller';
import { buatPdfSertifikat } from '@/modules/sertifikat/sertifikat.pdf';
import { buatMateriModel } from '@/modules/materi/materi.model';
import { buatMateriUsecase } from '@/modules/materi/materi.usecase';
import { buatMateriController } from '@/modules/materi/materi.controller';
import { buatBlocklyModel } from '@/modules/blockly/blockly.model';
import { buatBlocklyUsecase } from '@/modules/blockly/blockly.usecase';
import { buatBlocklyController } from '@/modules/blockly/blockly.controller';
import { buatStudioModel } from '@/modules/studio/studio.model';
import { buatStudioUsecase } from '@/modules/studio/studio.usecase';
import { buatStudioController } from '@/modules/studio/studio.controller';
import { buatKaryaModel } from '@/modules/karya/karya.model';
import { buatKaryaUsecase } from '@/modules/karya/karya.usecase';
import { buatKaryaController } from '@/modules/karya/karya.controller';
import { buatRaporUsecase } from '@/modules/rapor/rapor.usecase';
import { buatRaporController } from '@/modules/rapor/rapor.controller';
import { buatEksporModel } from '@/modules/ekspor/ekspor.model';
import { buatEksporUsecase } from '@/modules/ekspor/ekspor.usecase';
import { buatEksporController } from '@/modules/ekspor/ekspor.controller';
import { urlSiswa } from '@/config/area.config';
import { randomInt } from 'node:crypto';
import path from 'node:path';

/** Mendaftarkan satu modul (model -> usecase -> controller) ke container sebagai singleton. */
function daftarModul(container, nama, { model, usecase, controller }) {
  container.register({
    [`${nama}Model`]: asFunction(model).singleton(),
    [`${nama}Usecase`]: asFunction(usecase).singleton(),
    [`${nama}Controller`]: asFunction(controller).singleton(),
  });
}

/**
 * Membangun container DI global. Dependency TIDAK dibuat di dalam class/function:
 * model menerima `db`, usecase menerima model, controller menerima usecase.
 */
function buatContainer() {
  const container = createContainer({ injectionMode: InjectionMode.PROXY, strict: true });
  container.register({
    db: asFunction(() => buatDb(ambilPool())).singleton(),
    logger: asValue(logger),
    keamanan: asValue(keamananConfig),
    penyimpananFile: asFunction(buatPenyimpananFile).singleton(),
    // cookie dan header request berjalan (next/headers), dipakai controller auth
    cookieSesi: asValue(cookieSesi),
    infoPermintaan: asValue(infoPermintaan),
    // Pembuat ID semua primary key. Kelasnya disimpan di globalThis agar state (timestamp & counter)
    // satu untuk seluruh bundle Next.js; bila tidak, tiap salinan bundle bisa menghasilkan ID kembar.
    idGen: asValue({ generate: () => (globalThis.__digiplayIdGenerator ??= IdGenerator).generate() }),
    // masa cache memori pengaturan (ms); dibersihkan saat pengaturan diubah
    cachePengaturanMs: asValue(30_000),
    // RNG untuk render template: acak(n) -> bilangan bulat 0..n-1 dari crypto (disuntikkan, bukan dibuat di usecase)
    acak: asValue((n) => randomInt(n)),
    // folder berkas subjek gambar (dipindai untuk penanda punya_*)
    folderGambar: asValue(path.join(process.cwd(), 'public', 'aset', 'gambar')),
    // alamat situs siswa yang dicetak di kartu kode
    urlSiswa: asValue(urlSiswa()),
  });

  daftarModul(container, 'health', { model: buatHealthModel, usecase: buatHealthUsecase, controller: buatHealthController });
  // log: controller untuk halaman Log; modul lain mencatat lewat helper catatAktivitas
  daftarModul(container, 'log', { model: buatLogModel, usecase: buatLogUsecase, controller: buatLogController });
  container.register({
    catatAktivitas: asFunction(({ logUsecase }) => logUsecase.catatAktivitas).singleton(),
  });
  daftarModul(container, 'pengaturan', { model: buatPengaturanModel, usecase: buatPengaturanUsecase, controller: buatPengaturanController });
  daftarModul(container, 'pengguna', { model: buatPenggunaModel, usecase: buatPenggunaUsecase, controller: buatPenggunaController });
  daftarModul(container, 'auth', { model: buatAuthModel, usecase: buatAuthUsecase, controller: buatAuthController });
  daftarModul(container, 'level', { model: buatLevelModel, usecase: buatLevelUsecase, controller: buatLevelController });
  daftarModul(container, 'gambar', { model: buatGambarModel, usecase: buatGambarUsecase, controller: buatGambarController });
  daftarModul(container, 'template', { model: buatTemplateModel, usecase: buatTemplateUsecase, controller: buatTemplateController });
  daftarModul(container, 'siswa', { model: buatSiswaModel, usecase: buatSiswaUsecase, controller: buatSiswaController });
  daftarModul(container, 'tugas', { model: buatTugasModel, usecase: buatTugasUsecase, controller: buatTugasController });
  daftarModul(container, 'pembayaran', { model: buatPembayaranModel, usecase: buatPembayaranUsecase, controller: buatPembayaranController });
  daftarModul(container, 'sesi', { model: buatSesiModel, usecase: buatSesiUsecase, controller: buatSesiController });
  daftarModul(container, 'mengetik', { model: buatMengetikModel, usecase: buatMengetikUsecase, controller: buatMengetikController });
  daftarModul(container, 'latihan', { model: buatLatihanModel, usecase: buatLatihanUsecase, controller: buatLatihanController });
  daftarModul(container, 'posttest', { model: buatPosttestModel, usecase: buatPosttestUsecase, controller: buatPosttestController });
  // sertifikat (Fase E): PDF dibuat sesuai permintaan oleh pdfSertifikat (font dan maskot dari public/aset)
  container.register({
    folderAset: asValue(path.join(process.cwd(), 'public', 'aset')),
    pdfSertifikat: asFunction(buatPdfSertifikat).singleton(),
  });
  daftarModul(container, 'sertifikat', { model: buatSertifikatModel, usecase: buatSertifikatUsecase, controller: buatSertifikatController });
  // materi: kunci tugas sampai siswa paham dan pustaka materi (dipakai sesi dan tugas)
  daftarModul(container, 'materi', { model: buatMateriModel, usecase: buatMateriUsecase, controller: buatMateriController });
  // blockly (Coding Zippy): labirin dan penilaian program di server; hasil disimpan di hasil_latihan
  daftarModul(container, 'blockly', { model: buatBlocklyModel, usecase: buatBlocklyUsecase, controller: buatBlocklyController });
  // studio (Studio Zippy, Level 2): proyek siswa dan salinan proyek yang dikirim ke tugas/butir post test
  daftarModul(container, 'studio', { model: buatStudioModel, usecase: buatStudioUsecase, controller: buatStudioController });
  daftarModul(container, 'karya', { model: buatKaryaModel, usecase: buatKaryaUsecase, controller: buatKaryaController });
  daftarModul(container, 'ekspor', { model: buatEksporModel, usecase: buatEksporUsecase, controller: buatEksporController });
  // rapor: agregator tanpa tabel sendiri, jadi tanpa model
  container.register({
    raporUsecase: asFunction(buatRaporUsecase).singleton(),
    raporController: asFunction(buatRaporController).singleton(),
  });
  return container;
}

/**
 * Mengambil container tunggal. Disimpan di globalThis agar hot reload saat dev
 * tidak membuat container (dan koneksi) baru berulang kali.
 */
export function ambilContainer() {
  // container belum ada: bangun sekali saja
  if (!globalThis.__digiplayContainer) globalThis.__digiplayContainer = buatContainer();
  return globalThis.__digiplayContainer;
}

/** Jalan pintas ke cradle container: ambilDep().authController, dst. */
export function ambilDep() {
  return ambilContainer().cradle;
}
