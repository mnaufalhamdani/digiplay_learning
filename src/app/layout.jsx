import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';

// halaman membaca database setiap request, jangan di-prerender saat build
export const dynamic = 'force-dynamic';

// font di-host sendiri oleh next/font (diunduh saat build, tanpa CDN saat dipakai)
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

/** Skrip awal agar mode gelap terpasang sebelum render pertama (mencegah kedipan); pola SKRIP_TEMA DK Docs. */
const SKRIP_TEMA = `try{var s=localStorage.getItem('theme');if(s==='dark'||(!s&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

/** Layout akar: <html>, font, dan skrip tema. Atribut data-area dipasang pembungkus tiap area, bukan di sini. */
export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${fredoka.variable} ${nunito.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
