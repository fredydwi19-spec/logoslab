## Checklist Kerja Low Agent

A. Tech Stack Consistency
- [ ] Buat/ubah skema di `src/db/schema.ts` menggunakan Drizzle ORM untuk tabel `user_game_history`, `user_material_history`, dan `user_badges`.
- [ ] Gunakan Drizzle ORM API (`db.insert`, `db.select`, dll) untuk semua query database tanpa raw SQL.
- [ ] Buat endpoint backend baru untuk menyuplai data ke halaman pencapaian (misal `GET /api/user/achievements`) di ElysiaJS.

B. Database Schema & Integrity
- [ ] Implementasikan tabel `user_game_history` dengan foreign key `userId` dan `gameId` (dengan `onDelete: 'cascade'`), serta field `score`, `isPassed` (boolean), dan `createdAt`.
- [ ] Implementasikan tabel `user_material_history` dengan foreign key `userId` dan `materialId`, serta field `isCompleted`, `timeSpentMinutes`, dan constraint unique kombinasi `(userId, materialId)`.
- [ ] Implementasikan tabel `user_badges` dengan field `userId`, `badgeType` (enum: 'GLOBAL_RANK', 'MILESTONE'), `badgeRankNumber` (1-5), `milestoneName`, `isLocked`, dan `unlockedAt`.

C. UI/UX Skill Memory Protocol
- [ ] Desain antarmuka dengan dominasi warna Deep Navy (#1A237E) untuk header dan font aksen, serta Electric Gold (#FFC107) untuk elemen highlight/progres.
- [ ] Implementasikan UI layout "Koleksi Lencana" di atas dengan lencana warna terang untuk pencapaian aktif dan lencana redup abu-abu (`opacity-70`) dengan gembok untuk yang terkunci.
- [ ] Implementasikan 5 Linear Progress Bar untuk progres ketuntasan minat (Gunakan tag HTML `<progress>` atau `div` berwarna kuning).
- [ ] Implementasikan Datatable Riwayat Game dan Datatable Riwayat Materi dengan konsep grid bimodal (`grid-cols-1 lg:grid-cols-2`). Gunakan class Tailwind untuk membuat baris tabel belang (zebra striping).
- [ ] Wajib menggunakan pustaka Bootstrap Icons (web-font class lokal). Hindari SVG kustom.
  - Peringkat 1-5: `bi-1-circle-fill`, `bi-2-circle-fill`, dst (`text-4xl text-[#FFC107]`).
  - Gembok: `bi-lock-fill` (`text-slate-300 text-4xl`).
  - Lulus/Remedial: `bi-check-circle-fill text-green-500 w-5 h-5` / `bi-exclamation-triangle-fill text-orange-500 w-5 h-5`.
  - Ulang Game: `bi-arrow-clockwise text-[#1A237E] w-5 h-5`.
- [ ] Terapkan tipografi Tailwind (contoh: `text-sm md:text-base` untuk body text, `leading-relaxed` untuk spasi paragraf).

D. Security & Functionality Workflow
- [ ] Implementasikan *Global Rank Engine* secara *event-driven*: Setiap submit game (di rute `POST /api/games/submit`), hitung ulang total skor semua user dan update Top 5 `badgeRankNumber` di tabel `user_badges`. Bungkus fungsi ini di dalam `db.transaction`.
- [ ] Implementasikan *Anti-Cheat Waktu Membaca*: Di rute update materi, hitung `timeSpentMinutes`. Jika waktu kurang dari 2 menit (meskipun scroll 100%), atur `isCompleted` menjadi `false` dan tambahkan notifikasi ke JSON response ("Dibaca Sekilas").
- [ ] Pastikan validasi otorisasi via JWT Cookie di endpoint `/api/user/achievements` agar user hanya dapat mengakses riwayat miliknya sendiri.

E. Clean Code Standards
- [ ] Terapkan prinsip DRY: Buat helper khusus `recalculateGlobalRanks()` di `src/services/achievementService.ts` untuk memisahkan logika dari rute utama ElysiaJS.
- [ ] Enkapsulasi response data dalam JSON yang rapi (terdiri dari objek `dynamicBadges`, `milestoneBadges`, `interestProgress`, `gameHistory`, dan `materialHistory`).

F. Anti-Regression & Stability
- [ ] Dilarang mengubah Navbar dan komponen RBAC (`Layout.tsx`, `auth.ts`).
- [ ] Jalankan `bunx drizzle-kit push` dengan hati-hati untuk memastikan penambahan tabel tidak menghapus tabel existing seperti `users` atau `projects`.
