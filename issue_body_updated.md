## Checklist Kerja Low Agent

A. Tech Stack Consistency
- [x] Implementasikan tabel junction `game_interests` di `src/db/schema.ts` menggunakan Drizzle ORM sesuai skema (fields: id, projectId, category, createdAt).
- [x] Buat enum `interestCategoryEnum` ("Biblical Knowledge", "Eksegesis & Hermeneutik", "Biblical Theory", "Homiletika", "Apologetika", "Lainnya").
- [x] Gunakan Drizzle ORM untuk melakukan operasi relasional, hindari raw SQL manual jika memungkinkan.
- [x] Buat endpoint backend baru `GET /api/user/dashboard-summary` menggunakan ElysiaJS di file rute terkait (misal: `dashboard.ts` atau `users.ts`).

B. Database Schema & Integrity
- [x] Pastikan tabel `game_interests` memiliki relasi `projectId` ke `projects.id` dengan `onDelete: 'cascade'`.
- [x] Tambahkan composite unique index pada `(projectId, category)` agar tidak ada duplikasi data kategori untuk satu game.
- [x] Buat indeks pada kolom `category` untuk mempercepat proses aggregasi Spider Chart.

C. UI/UX Skill Memory Protocol
- [x] Pastikan root styling dashboard tetap mengacu pada warna Deep Navy (#1A237E) untuk header/card penting dan Electric Gold (#FFC107) untuk aksen.
- [x] Terapkan CSS Grid Bimodal untuk layout responsif: 
  - Top Row (KPI): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Middle Row (Charts): `grid-cols-1 lg:grid-cols-12` (Kiri col-span-5, Kanan col-span-7)
  - Bottom Row: `grid-cols-1 lg:grid-cols-2`
- [x] Wajib menggunakan Bootstrap Icons lokal (via class) dan HAPUS inline SVG kustom. Format wajib: `<i class="bi bi-[nama-ikon] text-[ukuran] text-[warna]"></i>`.
  - Contoh: `<i class="bi bi-fire text-orange-500 text-2xl"></i>` untuk streak, `<i class="bi bi-lightning-charge-fill text-[#FFC107] text-2xl"></i>` untuk XP, dll.
  - Letakkan ikon di dalam `div` rounded-full dengan background tipis.
- [x] Gunakan Tailwind typography scaling: max `text-xl` - `text-2xl` untuk heading, `text-sm` - `text-base` untuk body teks. Selalu tambahkan utility responsif (contoh: `text-sm md:text-base`).
- [x] Gunakan library Chart.js atau ApexCharts untuk merender Spider Chart 5 sumbu dan Line Chart Tren Nilai mingguan. Pastikan chart responsif di dalam kontainernya.

D. Security & Functionality Workflow
- [x] Kalkulasikan skor persentase secara aman di backend. Rumus: `(Sum Skor User) / (Sum Skor Maksimal Game) * 100`. Tangani kasus pembagian nol (Divide by Zero) dengan mereturn `0`.
- [x] Validasi otorisasi di ElysiaJS endpoint untuk memastikan hanya role `USER` (atau yang relevan) yang dapat menarik data `dashboard-summary` mereka sendiri. Data ID user harus diambil dari payload JWT cookie.

E. Clean Code Standards
- [x] Terapkan prinsip DRY: Pisahkan logika kalkulasi Spider Chart dari route handler utama ke sebuah service function/helper jika terlalu panjang.
- [x] Strukturkan JSON response backend agar terenkapsulasi dengan rapi (pisahkan object `kpi`, `spiderChart`, dan `lineChart`) seperti yang dijabarkan pada blueprint perencanaan.

F. Anti-Regression & Stability
- [x] Jangan memodifikasi komponen Navbar dan layout global (`Layout.tsx`) di luar batasan Dashboard Konten.
- [x] Jangan mengubah skema tabel `users` atau `projects` yang sudah ada, cukup tambahkan `game_interests`.
- [x] Pastikan perubahan pada skema di-generate dan di-push (`drizzle-kit push` atau `generate`) ke database lokal dengan aman tanpa membuang tabel lain.
