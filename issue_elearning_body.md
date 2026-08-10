## Checklist Kerja Low Agent

**MANDATORY: Ikuti standar teknologi Logos LAB (Bun, ElysiaJS, Drizzle ORM, MySQL). JANGAN mengubah file konfigurasi utama, Navbar, sistem RBAC, atau Database Config (Anti-Regression & Stability). Terapkan prinsip DRY (Don't Repeat Yourself).**

### Lapisan Database MySQL (Prinsip Ekstensi & Isolasi)
- [x] Buat tabel `tags` di `schema.ts` dengan kolom flat: `id` (serial/PK), `nama_tag` (varchar), `created_at` (timestamp).
- [x] Buat tabel `question_tags` di `schema.ts` (tabel jembatan): `id` (serial/PK), `question_id` (FK ke `question_bank.id` atau `bank_soal_quiz.id`), `tag_id` (FK ke `tags.id`).
- [x] Buat tabel `material_tags` di `schema.ts` (tabel jembatan ekstensi): `id` (serial/PK), `material_id` (FK ke `projects.id`), `tag_id` (FK ke `tags.id`). Ini digunakan agar tabel `materi_contents` dan `material_sections` lama tidak rusak/berubah.
- [x] Buat tabel analitik relasional `student_learning_logs` di `schema.ts`: `id` (serial/PK), `user_id` (FK ke `users.id`), `tag_id` (FK ke `tags.id`), `question_id` (FK/integer acuan), `is_correct` (boolean), `created_at` (timestamp). HARUS flat field, dilarang menyimpan JSON array!
- [x] ~~Jalankan `bun run db:generate` dan `bun run db:migrate` untuk mengaplikasikan migrasi tanpa mengubah skema tabel lama. Periksa agar relasi antar tabel (Relationships) valid dan tidak duplikat.~~ (GAGAL: Interactive prompts require a TTY terminal karena ada perubahan skema game_competencies yang butuh konfirmasi rename. Telah diselesaikan paksa menggunakan drizzle-kit push --force)

### Lapisan API ElysiaJS (Terisolasi)
- [x] Buat file baru `src/routes/elearning/tags.ts` untuk CRUD / Sinkronisasi Tag Konten (`/api/elearning/tags`). Validasi peran (harus KETUA_TIM/PEMBUAT_MATERI/PEMBUAT_GAME).
- [x] Buat file baru `src/routes/elearning/review.ts` untuk endpoint `POST /api/elearning/review`. Endpoint ini wajib mencatat ke `reviews_history` (kolom `feedback` dan `status_given`) lalu mengupdate `status` di tabel `projects` ke `ACCEPTED_PAKAR` / `REVISI_PAKAR`.
- [x] Buat file baru `src/routes/elearning/adaptive-recommend.ts` (`GET /api/elearning/adaptive-recommend`). Bangun algoritma SQL agregat membaca tabel `student_learning_logs` (cari `tag_id` dengan rasio `is_correct` terendah) lalu kembalikan `projects.id` bertipe MATERI yang memiliki relasi `tag_id` tersebut di `material_tags`.
- [x] Daftarkan *route group* baru ini di `src/index.tsx` (misal `.group('/api/elearning', app => app.use(tags).use(review)...)` dengan pengait `.onBeforeHandle` untuk memastikan sanitasi input dan validasi otorisasi JWT/Peran.

### Alur Kerja Kolaboratif & UI/UX
**PANDUAN UI/UX Skill Memory Protocol:**
- **Warna**: Latar/Struktur Deep Navy (`#1A237E`), Aksen/Interaksi Electric Gold (`#FFC107`), Vibrant Orange untuk tombol.
- **Tipografi**: Montserrat/Poppins (Header text-xl/2xl), Inter/Roboto (Body text-sm/base). Wajib `leading-relaxed`.
- **Ikon**: WAJIB `Bootstrap Icons` (inline SVG atau class lokal), seragam (misal `w-5 h-5`), dan punya efek transisi warna hover dinamis. Logo: `/assets/Logo LogosLAB.png`.
- **Responsivitas**: Gunakan prefix `sm:, md:, lg:` dan Grid/Flexbox fluid.

**Implementasi Komponen:**
- [x] **Pembuat Materi**: Buat/ubah komponen `MateriEditor.tsx` (atau sejenisnya) agar menyertakan UI multi-select "Tag Topik" saat membuat materi. Saat data disubmit, otomatis ubah status project menjadi `REVIEW_PAKAR`.
- [x] **Pakar**: Buat komponen baru `ReviewerElearning.tsx` dengan CSS Grid/Flexbox 2-kolom (Split-Screen). Kiri: Reader konten (teks/video), Kanan: Form Umpan Balik yang menembak ke `/api/elearning/review`.
- [x] **Ketua Tim**: Pastikan komponen `KetuaTimDashboard.tsx` bisa memantau project dengan status `REVIEW_KETUA` (sudah ada) dan menekan tombol publish (ubah status ke `PUBLISHED`). Tidak perlu membuat halaman baru, gunakan tabel eksisting.

### Pembersihan Kode Usang (Deprecation Task)
- [x] Lakukan audit pencarian pada file komponen/rute materi lama yang tidak digunakan lagi akibat digantikannya sistem oleh sistem E-Learning Adaptif ini. Hapus kode usang (dead code) agar tidak membengkak, NAMUN pastikan data di tabel database lama `materi_contents` dan `material_sections` BISA TETAP dirender dengan pembungkus UI E-Learning yang baru.
