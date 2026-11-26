'use client';
import { t } from '@/utils/i18n';
import Ikon from '@/modules/shared/ui/Ikon';
import Maskot from '@/modules/shared/ui/domain/Maskot';

/** Sudut putar ikon panah (yang aslinya menunjuk ke atas) per arah hadap. */
const SUDUT = { atas: 0, kanan: 90, bawah: 180, kiri: 270 };
/** Letak panah di tepi petak yang dihadap Zippy. */
const LETAK_PANAH = {
  atas: 'top-0 left-1/2 -translate-x-1/2',
  kanan: 'right-0 top-1/2 -translate-y-1/2',
  bawah: 'bottom-0 left-1/2 -translate-x-1/2',
  kiri: 'left-0 top-1/2 -translate-y-1/2',
};
/** Geseran kecil ke arah hadap saat Zippy menabrak (persen petak). */
const GESER_TABRAK = { atas: [0, -22], kanan: [22, 0], bawah: [0, 22], kiri: [-22, 0] };
/** Lebar petak maksimal (px) agar papan labirin kecil tidak melebar berlebihan di layar besar. */
const PETAK_MAKS = 72;

/**
 * Satu petak: dinding, jalan, atau jalan berisi bintang (bintang memakai ikon, bukan warna saja). Papan memakai warna tetap
 * (dinding ungu tua, jalan krem) di terang maupun gelap supaya dinding selalu lebih gelap dari jalan dan mudah dibedakan.
 */
function Petak({ dinding, bintang }) {
  if (dinding) return <div aria-hidden="true" className="border border-black/10 bg-[#4C31BB]" />;
  return (
    <div aria-hidden="true" className={`flex items-center justify-center border border-[#E9E2F7] ${bintang ? 'bg-[#FFE7A8]' : 'bg-[#FFF8EE]'}`}>
      {bintang && <Ikon nama="bintang" bobot="fill" ukuran="70%" className="text-[#8F5300]" />}
    </div>
  );
}

/**
 * Papan labirin (CSS grid): jalan, dinding, bintang, dan Zippy yang menghadap sesuai `posisi.arah`.
 * `posisi` = { x, y, arah }; `animasi` menyalakan gerak halus antar petak (mati bila pengguna memilih kurangi gerakan);
 * `tabrak` menggeser Zippy sedikit ke arah dinding sebagai tanda menabrak.
 */
export default function PapanLabirin({ labirin, posisi, animasi = true, tabrak = false }) {
  const { grid, lebar, tinggi, bintang } = labirin;
  const [gx, gy] = tabrak ? GESER_TABRAK[posisi.arah] : [0, 0];
  return (
    <div
      role="img"
      aria-label={t('blockly.papan')}
      className="relative mx-auto w-full overflow-hidden rounded-lg border-2 border-line"
      style={{ aspectRatio: `${lebar} / ${tinggi}`, maxWidth: lebar * PETAK_MAKS }}
    >
      <div className="grid size-full" style={{ gridTemplateColumns: `repeat(${lebar}, 1fr)`, gridTemplateRows: `repeat(${tinggi}, 1fr)` }}>
        {grid.flatMap((baris, y) => [...baris].map((c, x) => <Petak key={`${x}-${y}`} dinding={c === '#'} bintang={x === bintang.x && y === bintang.y} />))}
      </div>
      {/* Zippy: ditempatkan di petaknya lewat persen sehingga ikut mengecil bersama papan */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: `${(posisi.x / lebar) * 100}%`,
          top: `${(posisi.y / tinggi) * 100}%`,
          width: `${100 / lebar}%`,
          height: `${100 / tinggi}%`,
          transform: `translate(${gx}%, ${gy}%)`,
          transition: animasi ? 'left 0.3s ease, top 0.3s ease, transform 0.15s ease' : 'none',
        }}
      >
        <div className="relative size-full p-[10%]">
          <Maskot suasana="wajah" ukuran={PETAK_MAKS} penuh />
          {/* panah di tepi petak yang dihadap Zippy; ikon diputar sesuai arah */}
          <span className={`absolute flex size-[34%] items-center justify-center rounded-full bg-primary text-on-primary ${LETAK_PANAH[posisi.arah]}`}>
            <span className="flex size-3/4 items-center justify-center" style={{ transform: `rotate(${SUDUT[posisi.arah]}deg)` }}>
              <Ikon nama="panah_hadap" bobot="fill" ukuran="100%" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
