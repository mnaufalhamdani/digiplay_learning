import { t } from '@/utils/i18n';
import { DAFTAR_PENILAIAN, TIPE_TEMPLATE } from '@/enums';

// Pembentuk opsi <Select> untuk filter dan form template, dari hasil levelUsecase.pilihan().

/** Nama grup per level, mis. "L1 · Pemula". */
function namaGrup(level) {
  return `${level.kode} · ${level.nama}`;
}

/** Opsi level. */
export function opsiLevel(pilihan) {
  return pilihan.level.map((l) => ({ nilai: l.id, label: namaGrup(l) }));
}

/** Opsi pertemuan dikelompokkan per level, mis. "P8 · Excel 2: rumus dasar". */
export function opsiPertemuan(pilihan) {
  return pilihan.level.map((l) => ({
    grup: namaGrup(l),
    opsi: pilihan.pertemuan.filter((p) => p.levelId === l.id).map((p) => ({ nilai: p.id, label: `P${p.nomor} · ${p.judul}` })),
  }));
}

/** Opsi bagian post test dikelompokkan per level, mis. "B · Pengetahuan Komputer". */
export function opsiBagian(pilihan) {
  return pilihan.level.map((l) => ({
    grup: namaGrup(l),
    opsi: pilihan.bagian.filter((b) => b.levelId === l.id).map((b) => ({ nilai: b.id, label: `${b.kode} · ${b.nama}` })),
  }));
}

/** Opsi tipe template. */
export function opsiTipe() {
  return TIPE_TEMPLATE.map((tipe) => ({ nilai: tipe, label: t(`template.tipe.${tipe}`) }));
}

/** Opsi mode penilaian. */
export function opsiPenilaian() {
  return DAFTAR_PENILAIAN.map((p) => ({ nilai: p, label: t(`template.penilaianLabel.${p}`) }));
}
