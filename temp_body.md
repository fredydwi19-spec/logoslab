### 🎯 Refactor: Konversi Presisi Dashboard All-Role ke React SPA Components

#### 📌 Deskripsi Tugas
Mengonversi seluruh komponen tampilan (*views*) Dashboard untuk semua peran pengguna (Ketua Tim, Pembuat Game, Pembuat Materi, Pakar, dan Member/Siswa) dari struktur SSR lama di `src/views/components/` menjadi komponen reaktif berbasis **React SPA (`src/pages/dashboard/`)**, serta menyambungkannya secara asinkron ke REST API JSON ElysiaJS yang sudah ada.

---

#### 📐 ATURAN VISUAL & PROPORSI (MANDATORI V4.0)
- **60% (Warna Dominan):** Off-White / Light Gray / Glassmorphic Container (`bg-slate-50`, `bg-white/90 shadow-sm`).
- **30% (Struktur & Navigasi):** Header card, Sidebar, dan elemen struktural menggunakan Deep Navy (`#1A237E` / `text-[#1A237E]`).
- **10% (Aksen & Aksi):** **Vibrant Orange** (`bg-orange-500 hover:bg-orange-600 transition-colors text-white`) KHUSUS untuk tombol interaktif utama CTA (seperti "Buat Proyek Baru", "Mulai Kuis", "Review").
- **Path Logo Official:** `/public/assets/Logo LogosLAB.png`.

---

#### 🛠️ TASK LIST PENGERJAAN (CHECKLIST LOW AGENT)

- [x] **FASE 1: Struktur Folder & Konversi Komponen React (`src/pages/dashboard/`)**
  - [x] Buat folder baru `src/pages/dashboard/`.
  - [x] Konversi file views dari `src/views/components/` menjadi komponen React (`.tsx`):
    - [x] `KetuaTimDashboard.tsx`
    - [x] `PembuatGameDashboard.tsx`
    - [x] `PembuatMateriDashboard.tsx`
    - [x] `PakarDashboard.tsx`
    - [x] `MemberDashboard.tsx`
    - [x] `MemberAchievements.tsx`
  - [x] Lakukan penyesuaian sintaks JSX: `class=` $\rightarrow$ `className=`, `for=` $\rightarrow$ `htmlFor=`, dan *self-closing tags* (`/>`) pada tag mandiri.

- [x] **FASE 2: Fetching Data REST API JSON & State Management**
  - [x] Hubungkan `KetuaTimDashboard.tsx` ke endpoint `GET /api/dashboard/kpi-summary`.
  - [x] Hubungkan `MemberDashboard.tsx` ke endpoint `GET /api/dashboard/user-summary` (termasuk rendering data Spider Chart).
  - [x] Hubungkan `MemberAchievements.tsx` ke endpoint `GET /api/dashboard/achievements`.
  - [x] Tambahkan indikator *loading state* dan penanganan kesalahan (*error handling*) visual pada tiap komponen.

- [x] **FASE 3: Dynamic Role Routing React SPA (`src/main.tsx`)**
  - [x] Buat wrapper component `DashboardPage.tsx` yang membaca *role* user dari autentikasi JWT/cookie.
  - [x] Atur *conditional rendering* di `DashboardPage.tsx` untuk menampilkan sub-dashboard yang sesuai dengan peran user (Ketua Tim, Pakar, Pembuat Konten, atau Member).
  - [x] Merekam rute `/dashboard` dan `/app/dashboard` pada router React di `src/main.tsx`.

- [x] **FASE 4: Re-bundle & Anti-Regression Check**
  - [x] Jalankan kompilasi ulang bundle Bun:
    `bun build src/main.tsx --outdir ./public/dist`
  - [x] Pastikan skema Drizzle ORM, database MySQL, dan rute backend REST API ElysiaJS di `src/routes/dashboard.ts` TIDAK ADA yang diubah.
  - [x] Verifikasi di browser bahwa tampilan tiap role 100% presisi dan identik dengan versi aslinya.

