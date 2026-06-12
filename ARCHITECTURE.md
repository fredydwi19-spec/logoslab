# Dokumentasi Arsitektur Logos LAB

Dokumen ini berisi panduan arsitektur tingkat tinggi dari platform Logos LAB, dibangun dengan menggunakan **Bun** sebagai runtime dan **ElysiaJS** sebagai framework backend. Aplikasi ini menggunakan **MySQL** sebagai basis data dan **Drizzle ORM** sebagai alat untuk berinteraksi dengan basis data.

## 1. Sistem Arsitektur Utama

- **Runtime & Framework**: Aplikasi ini berjalan di atas lingkungan [Bun](https://bun.sh/) (`bun run src/index.tsx`) yang dikombinasikan dengan framework [ElysiaJS](https://elysiajs.com/) (`index.tsx`).
- **Konfigurasi Utama (`src/index.tsx`)**:
  - Inisiasi instance utama `new Elysia()`.
  - Menggunakan plugin `@elysiajs/static` untuk menyajikan aset statis dari folder `/public`.
  - Menggunakan plugin `@elysiajs/jwt` untuk manajemen autentikasi JWT dengan *secret key* dari *environment variables*.
  - Melakukan *mount* (pengelompokan) *route* dari file-file terpisah seperti `.use(userRoutes)`, `.use(authRoutes)`, dll.
  - Terdapat *route handler* untuk merender halaman HTML UI, mengambil file dari `/views` dan `public/index.html`.
- **Penanganan Routing & Middleware**:
  - Routing dipecah berdasarkan *domain* fungsional (auth, users, projects, bank_soal, dsb) di folder `src/routes/`.
  - Middleware (hook) sangat sering digunakan di tingkat *group routing* (`.group()`). Contoh: pengecekan cookie JWT (`.onBeforeHandle`) untuk memastikan hanya *user* yang telah login yang dapat mengakses *route* tertentu.
  - Terdapat *derived state* (`.derive()`) untuk mengekstrak informasi JWT ke dalam objek `user` agar dapat digunakan secara seragam di seluruh *handler*.
  - *Error handling* global dikonfigurasi melalui `.onError()`, merespons dengan status 404 jika tidak ditemukan, dan 500 untuk *server error*.

## 2. Peta Kode & Struktur Folder

Repositori ini menggunakan arsitektur berbasis *domain/feature* dengan pemisahan antara urusan data, routing, dan *view*.

- `/drizzle`: Menyimpan riwayat migrasi skema database Drizzle (file `.sql`).
- `/public`: Berisi aset statis (HTML mentah, skrip, gaya) yang disajikan langsung.
- `/src`: Kode sumber utama backend dan *Server-Side Rendering* (SSR) komponen.
  - `/src/db`:
    - `db.ts`: Inisialisasi pool koneksi MySQL (`mysql2/promise`) dan inisialisasi instance Drizzle ORM.
    - `schema.ts`: Definisi seluruh skema tabel, tipe data, relasi, dan enum (Drizzle ORM *Schema*).
  - `/src/routes`: Kumpulan *controller*/*route handler* API dan page renderer.
    - `auth.ts`: Menangani otentikasi (login, pendaftaran, verifikasi email, OAuth Google).
    - `bank_soal.ts` & `bank_soal_ui.ts`: Mengelola data soal (kuis, FTB, TTS), termasuk *import/export* Excel/CSV.
    - `projects.ts`: Menangani siklus hidup proyek game/materi (CRUD, *review* Pakar/Ketua, validasi, submit jawaban).
    - `materi.ts`: Pelacakan *progress* baca/tonton materi dan klaim *achievement*.
    - `dashboard.ts`: *Endpoint* penyedia data agregat metrik KPI, statistik, dan gamifikasi.
    - `ai.ts`: Integrasi dengan Gemini AI.
  - `/src/services`: Menyimpan logika bisnis kompleks yang dipisahkan dari routing.
    - `achievementService.ts`: Mengkalkulasi peringkat (*global ranks*), klaim *badge*, dan *milestones*.
    - `dashboardService.ts`: Mengagregasi data statistik untuk *Spider Chart*, *Funnel*, dan KPI dasbor.
  - `/src/utils`: Menyimpan pustaka utilitas, seperti `mailer.ts` (Nodemailer untuk verifikasi email).
  - `/src/views`: Komponen UI SSR berbasis JSX (menghasilkan string HTML).
    - `/views/components`: Komponen modular seperti *Navbar*, *Sidebar*, antarmuka *Dashboard* berdasarkan peran (Pakar, Ketua Tim, Pembuat), dan *Game Player*.
    - `/views/layouts`: Komponen tata letak (*layout*) pembungkus halaman (misal `Layout.tsx`).
    - `/views/pages`: Komponen spesifik untuk satu halaman penuh (misal `EditProfile.tsx`).
- `package.json` & `bun.lock`: Dependensi proyek, *scripts* (seperti `bun run dev`, migrasi database).
- `drizzle.config.ts`: Konfigurasi *Drizzle Kit* untuk manajemen migrasi basis data.

## 3. Implementasi Database MySQL

Koneksi diatur pada `src/db/db.ts` menggunakan *connection pool* `mysql2/promise` dan Drizzle ORM. Tabel didefinisikan dalam `src/db/schema.ts`. Relasi umumnya diset pada tingkat referensi `FOREIGN KEY` melalui sintaks Drizzle (`.references()`).

Tabel Utama dan Kolom Kunci:
- **`users`**: Data pengguna.
  - PK: `id` (serial/int).
  - Kolom penting: `email` (unique), `role` (enum: KETUA_TIM, PEMBUAT_GAME, PEMBUAT_MATERI, PAKAR, USER), `password` (hash).
- **`projects`**: Entitas inti untuk Game dan Materi.
  - PK: `id`.
  - FK: `id_pembuat` (ke `users.id`), `id_pakar` (ke `users.id`).
  - Kolom penting: `type` (GAME/MATERI), `game_type` (QUIZ, FILL_THE_BLANK, dll), `status` (enum: 'DRAFT', 'REVIEW_PAKAR', 'REVISI_PAKAR', 'ACCEPTED_PAKAR', 'REVIEW_KETUA', 'REVISI_KETUA', 'PUBLISHED', 'UNPUBLISHED').
- **Entitas Game / Soal Spesifik Proyek**:
  - `question_bank` (Kuis biasa), `game_fill_the_blank`, `game_word_search`, `game_crossword`.
  - FK: `project_id` (ke `projects.id`). Menyimpan data soal, opsi, dan kunci jawaban dalam bentuk teks atau JSON string.
- **Entitas Materi Proyek**:
  - `materi_contents`: Menampung lampiran file. Kolom kunci: `id` (PK), `project_id` (FK), `content_type` (enum PDF, PPT, IMAGE, VIDEO, EMBED_URL), `file_url`, `file_name`, `file_size`, dan `sort_order` untuk pengurutan urutan.
  - `material_sections`: Sub-konten materi berjenis 'MANUAL'. Kolom kunci: `id` (PK), `project_id` (FK), `sub_title`, `content` (isi teks artikel), dan `sort_order`.
  - `material_glossary`: Menyimpan daftar istilah/glosarium. Kolom: `id`, `project_id` (FK), `word`, dan `definition`.
- **Bank Soal Global** (Tugas independen dari proyek):
  - `bank_soal_quiz`, `bank_soal_ftb`, `bank_soal_tts`: Mengandung soal global (ditambahkan manual/Excel).
  - FK: `created_by` (ke `users.id`).
- **Aturan Pelabelan Soal (Tagging)**: 
  Setiap baris data di `question_bank` atau `bank_soal_quiz` wajib dihubungkan dengan entitas `tags` melalui tabel jembatan relasional, sehingga setiap butir soal mewakili satu sub-topik kompetensi yang spesifik sebagai acuan deteksi kelemahan siswa.
- **Gamifikasi dan Progress**:
  - `user_game_history`: Menyimpan skor historis permainan. FK: `user_id`, `game_id` (ke `projects`).
  - `user_material_history`, `materi_read_progress`: Laporan analitik durasi dan *scroll*. FK: `user_id`, `project_id`.
  - `user_scores`, `user_badges`, `achievements`: Melacak pencapaian dan poin total. FK: `user_id`.
- **Notifikasi dan Histori**:
  - `notifications`: FK `user_id`, `project_id`.
  - `reviews_history`: Mencatat jejak umpan balik dari Pakar atau Ketua Tim. Kolom kunci: `id` (PK), `project_id` (FK), `reviewer_id` (FK), `feedback` (isi komentar/catatan revisi), `status_given` (keputusan review), `created_at`.

## 4. Daftar Fitur & Alur Logika Saat Ini

- **Autentikasi (JWT) & Google OAuth**
  - Endpoint: `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/google`.
  - Controller: `src/routes/auth.ts`.
  - Tabel: `users`, `verification_tokens`.
  - Logika: Login konvensional memvalidasi hash `bcrypt`, menerbitkan cookie `auth` (JWT). Login Google menukar kode rahasia, mendaftarkan jika belum ada, menerbitkan cookie JWT.
- **Manajemen Proyek & Alur Review**
  - Endpoint: `POST /api/projects`, `PATCH /api/projects/:id`, `POST /api/projects/:id/review`.
  - Controller: `src/routes/projects.ts`.
  - Tabel: `projects`, `reviews_history`, `notifications`.
  - Logika: Berbasis state-machine. Ketua menugaskan draf. Pembuat *submit* revisi ke Pakar. Pakar menyetujui -> ke Ketua. Ketua mem-*publish*. Notifikasi otomatis masuk ke pihak terkait di setiap pergantian status.
- **Manajemen Bank Soal & Import Excel/CSV**
  - Endpoint: `GET /api/bank-soal/quiz|ftb|tts`, `POST /api/bank-soal/import/:type`, `POST /api/bank-soal/auto-generate`.
  - Controller: `src/routes/bank_soal.ts`.
  - Tabel: `bank_soal_quiz`, `bank_soal_ftb`, `bank_soal_tts`, dan tabel soal spesifik proyek (saat auto-generate).
  - Logika: Endpoint dapat mengimpor massal dari format Excel dengan mekanisme pengelompokan (*batching*) `BATCH_SIZE = 500` dan filter soal duplikat. Data dari bank soal kemudian dapat diekstrak otomatis (*auto-generate*) untuk diinjeksikan ke draf proyek game tertentu.
- **Pencapaian (Achievements) & Gamifikasi**
  - Endpoint: `GET /api/dashboard/achievements`, `POST /api/materi/:id/claim-achievement`.
  - Controller: `src/routes/dashboard.ts`, `src/routes/materi.ts`, `src/services/achievementService.ts`.
  - Tabel: `achievements`, `user_badges`, `user_scores`, `user_game_history`.
  - Logika: Mengalkulasi ulang lencana *Global Rank* dan membuka lencana *Milestone* secara dinamis bila pengguna mencapai kriteria (*Progress Tracker* materi atau hasil game).
- **Dasbor Statistik KPI & Spider Chart**
  - Endpoint: `GET /api/dashboard/kpi-summary`, `GET /api/dashboard/user-summary`.
  - Controller: `src/routes/dashboard.ts`, `src/services/dashboardService.ts`.
  - Logika: Melakukan kalkulasi berbasis SQL agresif yang memonitor *Velocity*, *Engagement*, dll., dengan data yang dihasilkan dikembalikan ke *view* untuk divisualisasikan.

## 5. Pola Koding & Best Practices Proyek

- **Validasi JWT via Cookie/Hooks**:
  Keamanan rute menggunakan pengait (*hook*) Elysia `.onBeforeHandle` secara konsisten pada setiap pengelompokan `.group()` atau pada level rute per rute untuk melakukan dekripsi cookie `.auth`.
- **Server-Side Rendering (SSR) via JSX Components**:
  UI utama tidak dibangun dengan reaktivitas klien terpisah (seperti React *client-side* tunggal/SPA), tetapi mengembalikan string HTML yang dikomposisi menggunakan fungsi (komponen JSX tanpa properti state kompleks) yang kemudian di-*hydrate* oleh Tailwind dan terkadang Alpine.js (klien yang disuntik).
- **Penyimpanan Terstruktur via JSON string**:
  Karena menggunakan MySQL konvensional, struktur tak teratur (seperti sel permainan TTS, jawaban teka-teki silang, *fill in the blank*) disimpan sebagai deretan string JSON secara sengaja pada kolom *TEXT/LONGTEXT*. Terdapat pola konsisten mem-*parsing* `JSON.parse` saat pengembalian respons API.
- **Pengecualian Analitik Siswa**: 
  Khusus untuk tabel pelacakan performa, durasi, kemajuan belajar, dan log salah-benar jawaban siswa (seperti `user_game_history` atau tabel log analitik baru), data WAJIB disimpan dalam bentuk kolom relasional standar (flat fields) dan BUKAN JSON string, untuk mendukung efisiensi kalkulasi SQL agresif pada service dasbor.
- **Proteksi Otoritas Berbasis Peran (RBAC)**:
  Terdapat perlindungan pada banyak *endpoint* (cth: `if (user.role !== "KETUA_TIM")`) sebelum melakukan tindakan manipulasi data (CRUD).
- **Format API Response yang Standar**:
  Sebagian besar API merespons dengan format *object* standar jika berhasil: `{ success: true, data: ... }` atau `{ success: true, message: "..." }`. Jika gagal: `{ error: "pesan galat" }` dengan properti `status` HTTP.
  Mengandalkan `.onError()` tingkat atas dari ElysiaJS untuk mencegat *throw Error*, yang mengembalikan status 500 dan properti *stack* untuk *logging*. Blok `try-catch` spesifik hanya membungkus hal yang rumit seperti manipulasi Excel atau panggilan API pihak ketiga (Gemini).
- **Mekanisme State Transition Proyek**:
  Siklus dokumen dari draf hingga dipublikasi dikelola dengan mengubah nilai pada kolom `status` di tabel `projects` secara berurutan. Setiap perubahan status divalidasi berdasarkan *Role* user di rute `POST /api/projects/:id/review`, dan secara otomatis memicu penyisipan (*insert log*) baru di tabel `reviews_history` (menyimpan jejak komentar dan keputusan `status_given`), serta merekam *alert* ke tabel `notifications` agar tim terkait mendapat pemberitahuan seketika terkait aktivitas proyek tersebut.
