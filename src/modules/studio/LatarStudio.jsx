import { DATA_LABIRIN, PANGGUNG } from '@/modules/shared/blockly/pustakaStudio';

// Pustaka latar Studio Zippy: semua berupa SVG yang digambar di kode (tanpa berkas gambar). Koordinat SVG: 480 x 360,
// y ke bawah; data labirin memakai koordinat panggung (pusat di tengah, y ke atas) sehingga dikonversi di sini.

/** Posisi bintang-bintang latar luar angkasa (tetap, bukan acak, agar gambar tidak berkedip saat digambar ulang). */
const BINTANG = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97 + 23) % 480, y: (i * 61 + 11) % 260, r: 0.8 + ((i * 7) % 3) * 0.6 }));

/** Titik-titik bintang segi lima (untuk petak tujuan labirin) di sekitar pusat (cx, cy) dengan jari-jari luar r. */
function titikBintang(cx, cy, r) {
  const titik = [];
  for (let i = 0; i < 10; i += 1) {
    const sudut = (Math.PI / 5) * i - Math.PI / 2;
    const jari = i % 2 === 0 ? r : r * 0.45;
    titik.push(`${(cx + jari * Math.cos(sudut)).toFixed(1)},${(cy + jari * Math.sin(sudut)).toFixed(1)}`);
  }
  return titik.join(' ');
}

/** Awan sederhana dari tiga lingkaran. */
function Awan({ x, y, skala = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`} fill="#FFFFFF" opacity="0.95">
      <ellipse cx="0" cy="0" rx="26" ry="12" />
      <ellipse cx="-14" cy="-8" rx="14" ry="11" />
      <ellipse cx="10" cy="-12" rx="16" ry="13" />
    </g>
  );
}

/** Pohon: batang cokelat dan tajuk hijau. */
function Pohon({ x, y, skala = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <rect x="-5" y="-6" width="10" height="42" rx="3" fill="#8B5E3C" />
      <circle cx="0" cy="-20" r="26" fill="#3FA34D" />
      <circle cx="-16" cy="-8" r="16" fill="#4CB85A" />
      <circle cx="16" cy="-8" r="16" fill="#4CB85A" />
    </g>
  );
}

/** Gedung kota dengan jendela. */
function Gedung({ x, lebar, tinggi, warna }) {
  const jendela = [];
  for (let r = 0; r < Math.floor((tinggi - 16) / 22); r += 1) for (let c = 0; c < Math.floor((lebar - 8) / 18); c += 1) jendela.push({ x: x + 8 + c * 18, y: 270 - tinggi + 10 + r * 22, nyala: (r * 3 + c * 5 + x) % 4 !== 0 });
  return (
    <g>
      <rect x={x} y={270 - tinggi} width={lebar} height={tinggi} fill={warna} />
      {jendela.map((j) => (
        <rect key={`${j.x}-${j.y}`} x={j.x} y={j.y} width="9" height="12" rx="1.5" fill={j.nyala ? '#FFE9A3' : '#7C8DA8'} />
      ))}
    </g>
  );
}

/** Isi SVG per latar. */
const LATAR = {
  polos: () => (
    <>
      <rect width="480" height="360" fill="#FFF8EE" />
      {/* garis bantu tipis: membantu mengira jarak langkah */}
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * 40} y1="0" x2={(i + 1) * 40} y2="360" stroke="#F0E3CF" strokeWidth="1" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={(i + 1) * 40} x2="480" y2={(i + 1) * 40} stroke="#F0E3CF" strokeWidth="1" />
      ))}
    </>
  ),
  taman: () => (
    <>
      <defs>
        <linearGradient id="lt-langit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD3FF" />
          <stop offset="1" stopColor="#E6F7FF" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#lt-langit)" />
      <circle cx="410" cy="56" r="30" fill="#FFD54A" />
      <Awan x={90} y={60} skala={1.2} />
      <Awan x={260} y={40} />
      <path d="M0 250 Q120 200 240 245 T480 235 V360 H0 Z" fill="#8ED16B" />
      <rect y="270" width="480" height="90" fill="#6DBE4A" />
      <Pohon x={70} y={250} />
      <Pohon x={410} y={245} skala={0.85} />
      {[130, 190, 250, 320, 370].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={300 + (i % 3) * 18} r="5" fill={['#FF6B8A', '#FFC93C', '#FFFFFF', '#B58CFF', '#FF9A3C'][i]} />
          <circle cx={x} cy={300 + (i % 3) * 18} r="2" fill="#FFB300" />
        </g>
      ))}
    </>
  ),
  pantai: () => (
    <>
      <defs>
        <linearGradient id="lp-langit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FD0FF" />
          <stop offset="1" stopColor="#DDF3FF" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#lp-langit)" />
      <circle cx="70" cy="60" r="30" fill="#FFD54A" />
      <Awan x={300} y={55} />
      <rect y="150" width="480" height="110" fill="#2E9BE0" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M0 ${175 + i * 28} q30 -14 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0`} fill="none" stroke="#9BDCFF" strokeWidth="3" />
      ))}
      <path d="M0 255 Q240 230 480 255 V360 H0 Z" fill="#F6D78F" />
      <rect y="290" width="480" height="70" fill="#F2CD7C" />
      {/* pohon kelapa */}
      <path d="M390 300 Q400 230 380 170" stroke="#8B5E3C" strokeWidth="9" fill="none" strokeLinecap="round" />
      <g fill="#3FA34D">
        <ellipse cx="350" cy="170" rx="38" ry="10" transform="rotate(-20 350 170)" />
        <ellipse cx="410" cy="165" rx="38" ry="10" transform="rotate(20 410 165)" />
        <ellipse cx="380" cy="150" rx="12" ry="32" />
      </g>
      <circle cx="120" cy="310" r="10" fill="#FF8FA3" />
      <circle cx="200" cy="330" r="7" fill="#FFFFFF" />
    </>
  ),
  'luar angkasa': () => (
    <>
      <defs>
        <linearGradient id="la-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0B1033" />
          <stop offset="1" stopColor="#2D1B69" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#la-bg)" />
      {BINTANG.map((b) => (
        <circle key={`${b.x}-${b.y}`} cx={b.x} cy={b.y} r={b.r} fill="#FFFFFF" opacity="0.85" />
      ))}
      <circle cx="380" cy="90" r="44" fill="#F08A5D" />
      <ellipse cx="380" cy="90" rx="74" ry="14" fill="none" stroke="#FFD9A0" strokeWidth="5" transform="rotate(-18 380 90)" />
      <circle cx="90" cy="250" r="26" fill="#D6D9E8" />
      <circle cx="80" cy="244" r="6" fill="#B7BBD2" />
      <circle cx="102" cy="262" r="4" fill="#B7BBD2" />
      <circle cx="220" cy="320" r="60" fill="#4B6FD8" />
    </>
  ),
  kota: () => (
    <>
      <defs>
        <linearGradient id="lk-langit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ED6FF" />
          <stop offset="1" stopColor="#E8F6FF" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#lk-langit)" />
      <Awan x={120} y={50} />
      <Awan x={360} y={70} skala={0.9} />
      <Gedung x={10} lebar={70} tinggi={150} warna="#7C93C7" />
      <Gedung x={90} lebar={54} tinggi={200} warna="#9AA9D8" />
      <Gedung x={154} lebar={80} tinggi={120} warna="#6E7FB5" />
      <Gedung x={244} lebar={60} tinggi={170} warna="#8A9BCB" />
      <Gedung x={314} lebar={90} tinggi={210} warna="#7385BA" />
      <Gedung x={414} lebar={60} tinggi={140} warna="#9AA9D8" />
      <rect y="270" width="480" height="90" fill="#5B6270" />
      <rect y="262" width="480" height="10" fill="#B9C0CC" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={10 + i * 62} y="312" width="34" height="6" rx="3" fill="#FFE9A3" />
      ))}
    </>
  ),
  labirin: () => {
    const kiri = PANGGUNG.lebar / 2;
    const atas = PANGGUNG.tinggi / 2;
    const tujuan = DATA_LABIRIN.tujuan;
    const pusatX = kiri + (tujuan.x1 + tujuan.x2) / 2;
    const pusatY = atas - (tujuan.y1 + tujuan.y2) / 2;
    return (
      <>
        <rect width="480" height="360" fill="#FFF8EE" />
        {/* petak awal (hijau muda) dan petak tujuan (bintang) */}
        <rect x={kiri + DATA_LABIRIN.mulai.x - 28} y={atas - DATA_LABIRIN.mulai.y - 28} width="56" height="56" rx="10" fill="#CFF1D6" />
        <rect x={pusatX - 28} y={pusatY - 28} width="56" height="56" rx="10" fill="#FFF0B8" />
        <polygon points={titikBintang(pusatX, pusatY, 20)} fill="#FFC93C" stroke="#E09A00" strokeWidth="2" strokeLinejoin="round" />
        {DATA_LABIRIN.dinding.map((d) => (
          <rect key={`${d.x1}-${d.y1}-${d.x2}-${d.y2}`} x={kiri + d.x1} y={atas - d.y2} width={d.x2 - d.x1} height={d.y2 - d.y1} rx="2" fill="#5B4B8A" />
        ))}
      </>
    );
  },
};

/** Latar panggung sebagai SVG yang memenuhi wadahnya; nama latar tidak dikenal memakai latar polos. */
export default function LatarStudio({ latar }) {
  const Isi = LATAR[latar] ?? LATAR.polos;
  return (
    <svg viewBox="0 0 480 360" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full">
      <Isi />
    </svg>
  );
}
