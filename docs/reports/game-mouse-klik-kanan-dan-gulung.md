# Game Latihan Mouse: Klik Kanan Ajaib dan Kebun Gulung

## Ringkasan
Dua bug di game Latihan Mouse: menu "Buka" pada Klik Kanan Ajaib tidak berfungsi, dan Kebun Gulung memunculkan galat React saat roda mouse digulung. Keduanya diperbaiki di `GameMouse.jsx`.

## Masalah
- **Klik Kanan Ajaib:** setelah klik kanan, menu buatan muncul. Saat tombol "Buka" diklik, tidak terjadi apa-apa dan skor tidak bertambah. Penyebabnya: handler `onPointerDown` di wadah game menutup menu pada setiap klik kiri, termasuk klik di dalam menu. Pointer down terjadi sebelum `click`, sehingga menu sudah hilang dari DOM sebelum `onClick` tombol "Buka" sempat terpicu.
- **Kebun Gulung:** `tambah()` (yang memanggil `setSkor` milik `AreaGame`) dipanggil dari dalam fungsi updater `setTumbuh((g) => ...)`. Updater dijalankan saat render, jadi `AreaGame` diubah ketika `GameGulung` sedang dirender. Updater juga bisa dijalankan dua kali (Strict Mode di dev), sehingga poin bisa ganda.

## Error
`Cannot update a component (AreaGame) while rendering a different component (GameGulung)` pada `const tambah = useCallback(() => setSkor((s) => s + 1), []);` di `AreaGame.jsx`.

## Solusi
- **Klik Kanan Ajaib:** `onPointerDown` wadah sekarang memanggil `tutupMenu`, yang hanya menutup menu bila klik kiri terjadi di luar elemen `role="menu"`. Klik di dalam menu dibiarkan sampai `onClick` tombol berjalan.
- **Kebun Gulung:** nilai pertumbuhan dipegang di `useRef` (`tumbuhRef`). Penambahan poin dan `setTumbuh` dilakukan langsung di handler roda/sentuh, bukan di dalam updater. Perilaku tampilan (tumbuh, reset di tahap penuh, +1 poin) tidak berubah.

## File diubah
- `src/modules/latihan/GameMouse.jsx`

## File baru
- `docs/reports/game-mouse-klik-kanan-dan-gulung.md`
