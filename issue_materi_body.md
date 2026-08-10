# 📋 Cetak Biru Fitur Konten Materi — Logos Lab

> **Role**: High Agent (Architect) → Panduan kerja untuk Low Agent (Developer)
> **Stack Wajib**: Bun + ElysiaJS + Drizzle ORM + MySQL + Tailwind CSS
> **Tanggal**: 17 Mei 2026

---

## 🔍 HASIL AUDIT SISTEM (Phase 1)

### Temuan Kritis dari Codebase Saat Ini:

1. **Role `PEMBUAT_MATERI` sudah ada** di enum `users.role` pada `src/db/schema.ts` (line 10). Tidak perlu rename dari `pembuat_soal`.
2. **Type `MATERI` sudah ada** di enum `projects.type` (line 32). Namun belum ada kolom `materiType` untuk membedakan Teks vs Video.
3. **Route `POST /api/projects`** di `src/routes/projects.ts` (line 49) **hardcode `type: "GAME"`** — harus diubah agar mendukung `MATERI`.
4. **Route `GET /api/projects`** (line 77-88) **tidak ada case untuk `PEMBUAT_MATERI`** — user dengan role ini tidak bisa melihat proyeknya.
5. **Route review `POST /:id/review`** (line 223) hanya menangani `PEMBUAT_GAME` — harus ditambah handling `PEMBUAT_MATERI` dengan smart routing identik.
6. **Dashboard `PEMBUAT_MATERI`** di `src/index.tsx` (line 248-273) masih **placeholder statis** — belum ada komponen fungsional.
7. **KetuaTimDashboard** (line 7) **filter hanya `type === "GAME"`** — perlu opsi untuk menampilkan dan membuat proyek Materi.
8. **Landing Page** (`GamesSection.tsx`, `index.tsx` line 69-74) **hanya menampilkan `type: "GAME"`** — materi yang sudah published belum ditampilkan.
9. **Tabel konten materi belum ada** — perlu tabel baru untuk menyimpan file upload (PDF/PPT/Gambar/Video).
10. **Tabel achievement/reward belum ada** — perlu untuk Smart Recognition.
11. **Auth route** (`src/routes/auth.ts` line 68-69) sudah redirect `PEMBUAT_MATERI` ke `/dashboard/materi` ✅.
12. **ProjectHeader** (`src/views/components/ProjectHeader.tsx`) bisa di-reuse untuk materi, tapi label "TOTAL SOAL" dan "SIMULASI GAME" perlu dikondisikan.

---

## 📐 ARSITEKTUR & TASK LIST

### TASK 1: Database Schema — Tabel Baru & Modifikasi [v]
**File**: `src/db/schema.ts`

**1A. Tambah kolom `materiType` pada tabel `projects`:**
- Tambahkan kolom enum baru: `materiType: mysqlEnum("materi_type", ["TEKS", "VIDEO"]).default(null)`
- Kolom ini nullable karena proyek GAME tidak membutuhkannya.

**1B. Buat tabel `materiContents`:**
- `id`: serial primaryKey
- `projectId`: bigint unsigned, FK ke `projects.id`, NOT NULL
- `contentType`: mysqlEnum `["PDF", "PPT", "IMAGE", "VIDEO", "EMBED_URL"]`, NOT NULL
- `fileUrl`: longtext (base64 data URI atau path), NOT NULL
- `fileName`: varchar(255) — nama file asli
- `fileSize`: int — ukuran file dalam bytes
- `sortOrder`: int default 0 — urutan tampilan jika multi-file
- `createdAt`: timestamp defaultNow
- `updatedAt`: timestamp defaultNow onUpdateNow

**1C. Buat tabel `achievements`:**
- `id`: serial primaryKey
- `userId`: bigint unsigned, FK ke `users.id`, NOT NULL
- `projectId`: bigint unsigned, FK ke `projects.id`, NOT NULL
- `achievementType`: mysqlEnum `["MATERI_TEKS_SELESAI", "MATERI_VIDEO_SELESAI", "GAME_SELESAI"]`, NOT NULL
- `claimedAt`: timestamp defaultNow
- Tambahkan unique constraint pada kombinasi `userId + projectId + achievementType` untuk mencegah klaim duplikat.

**1D. Buat tabel `materiReadProgress`:**
- `id`: serial primaryKey
- `userId`: bigint unsigned, FK ke `users.id`, NOT NULL
- `projectId`: bigint unsigned, FK ke `projects.id`, NOT NULL
- `scrollPercentage`: int default 0 — persentase scroll (0-100)
- `timeSpentSeconds`: int default 0 — durasi baca kumulatif
- `videoWatchedPercentage`: int default 0 — persentase video ditonton
- `isCompleted`: boolean default false — apakah sudah memenuhi syarat
- `updatedAt`: timestamp defaultNow onUpdateNow

> ⚠️ **Catatan Migrasi**: Jalankan `bunx drizzle-kit generate` lalu `bunx drizzle-kit push` setelah schema diubah. Pastikan backup database sebelum push karena ada ALTER TABLE pada `projects`.

---

### TASK 2: Backend Routes — Materi CRUD & Smart Routing [v]
**File**: `src/routes/projects.ts`

**2A. Modifikasi `POST /api/projects` (Create Project):**
- Terima parameter `type` dari body (bisa `"GAME"` atau `"MATERI"`). Jangan hardcode `"GAME"`.
- Jika `type === "MATERI"`, terima juga `materiType` (`"TEKS"` atau `"VIDEO"`).
- `gameType` boleh null jika `type === "MATERI"`.
- Notifikasi tetap dikirim ke `idPembuat` dan `idPakar`.

**2B. Modifikasi `GET /api/projects` (Get Projects by Role):**
- Tambahkan case `PEMBUAT_MATERI`: query proyek dimana `idPembuat === user.id`.
- Logic identik dengan `PEMBUAT_GAME`.

**2C. Modifikasi `POST /:id/review` (Smart Routing Revisi):**
- Tambahkan case `PEMBUAT_MATERI` dengan logic identik `PEMBUAT_GAME`:
  - Jika status `REVISI_KETUA` → kirim ke `REVIEW_KETUA` (bypass Pakar).
  - Selain itu → kirim ke `REVIEW_PAKAR`.
- **Kondisi A (Revisi Pakar)**: submit dari Pembuat Konten → `REVIEW_PAKAR` (kembali ke Pakar).
- **Kondisi B (Revisi Ketua Tim)**: submit dari Pembuat Konten → `REVIEW_KETUA` (bypass Pakar, langsung Ketua).

**2D. Buat route baru `POST /:id/materi-content` (Upload Konten Materi):**
- Validasi: project harus bertipe `MATERI` dan status `DRAFT`/`REVISI_PAKAR`/`REVISI_KETUA`.
- Terima array konten (file base64 atau URL) dan simpan ke tabel `materiContents`.
- Strategi: delete-and-reinsert (sama seperti `/:id/questions`).

**2E. Buat route baru `GET /:id/materi-content` (Get Konten Materi):**
- Return array `materiContents` berdasarkan `projectId`, ordered by `sortOrder`.

**2F. Modifikasi `GET /:id` (Get Project Details):**
- Jika `project.type === "MATERI"`, query `materiContents` dan sertakan dalam response.
- Tambahkan `materiType` dalam select fields.

**2G. Modifikasi `DELETE /:id` (Delete Project):**
- Tambahkan `await db.delete(materiContents).where(eq(materiContents.projectId, projectId))` sebelum delete project.

**2H. Buat route baru untuk Smart Recognition:**

File baru: `src/routes/materi.ts`
- `POST /api/materi/:id/progress` — Update progress baca/tonton user. Body: `{ scrollPercentage, timeSpentSeconds, videoWatchedPercentage }`.
- `POST /api/materi/:id/claim-achievement` — Klaim achievement jika syarat terpenuhi:
  - Teks: `scrollPercentage >= 95 AND timeSpentSeconds >= 120` (2 menit minimum).
  - Video: `videoWatchedPercentage >= 90`.
  - Insert ke tabel `achievements` jika belum ada (cek unique constraint).
- `GET /api/materi/:id/progress` — Get progress user saat ini.
- Semua endpoint memerlukan autentikasi JWT (role `USER`).

> 🔐 **Security**: Sanitasi semua input. Validasi `scrollPercentage` antara 0-100, `timeSpentSeconds` positif. Rate-limit endpoint claim.

---

### TASK 3: Dashboard Ketua Tim — Form Penugasan Materi [v]
**File**: `src/views/components/KetuaTimDashboard.tsx`

**3A. Tambah filter tipe proyek:**
- Di bagian header dashboard, tambahkan toggle/tab: `GAME | MATERI | SEMUA`.
- Filter `allProjects` berdasarkan `project.type`.
- Ubah line 7: jangan hanya filter `type === "GAME"`, tapi gunakan state untuk filter dinamis.

**3B. Tambah tombol "Tugaskan Pembuatan Materi":**
- Letakkan di samping tombol "+ TAMBAH PROYEK BARU" yang sudah ada.
- Warna: `bg-[#FF5722]` (Vibrant Orange) konsisten dengan UI.
- RBAC: hanya tampil untuk `KETUA_TIM`.

**3C. Buat Modal/Form Penugasan Materi:**
- Reuse pattern modal `createGameModal` yang sudah ada.
- Field form:
  - Judul Materi (text, required)
  - Deskripsi Materi (textarea)
  - Instruksi Pengerjaan (textarea)
  - **Jenis Materi**: Dropdown `TEKS` / `VIDEO` (required)
  - Klasifikasi Minat (multi-select, reuse `availableCategories`)
  - PIC Pembuat Konten: Dropdown user dengan role `PEMBUAT_MATERI`
  - PIC Pakar: Dropdown user dengan role `PAKAR`
  - Deadline (date input)
  - Thumbnail (file upload)
- Submit: `POST /api/projects` dengan `type: "MATERI"` dan `materiType`.

**3D. Query Pembuat Materi:**
- Di `src/index.tsx`, pada case `KETUA_TIM`, tambahkan query: `pembuatMateriData = await db.select().from(users).where(eq(users.role, "PEMBUAT_MATERI"))`.
- Pass ke `KetuaTimDashboard` sebagai prop `pembuatMateris`.

**3E. Tabel list proyek harus menampilkan kolom "Tipe":**
- Tambah kolom "Tipe" di tabel yang menunjukkan badge `GAME` atau `MATERI`.

---

### TASK 4: Dashboard Pembuat Materi (Komponen Baru) [v]
**File baru**: `src/views/components/PembuatMateriDashboard.tsx`

**4A. Struktur umum:**
- Reuse pola dari `PembuatGameDashboard.tsx` (Alpine.js data pattern, tab panel, project list).
- Import dan gunakan `ProjectHeader` yang sudah ada.
- Tab panel status identik: Draft, Review Pakar, Revisi Pakar, Review Ketua, Revisi Ketua.

**4B. Modifikasi ProjectHeader untuk Materi:**
- Di `ProjectHeader.tsx`, kondisikan label berdasarkan tipe proyek:
  - Jika MATERI: ubah "TOTAL SOAL" → "KONTEN MATERI", ubah "SIMULASI GAME" → "PREVIEW MATERI".
  - Gunakan parameter tambahan `projectType` yang dikirim dari parent.

**4C. Editor Konten Materi (Kondisional UI):**
- **Jika `materiType === "TEKS"`:**
  - Tampilkan area upload dokumen: PDF, PPT, Gambar (accept: `.pdf,.ppt,.pptx,.png,.jpg,.jpeg`).
  - Multiple file upload diizinkan.
  - Preview: tampilkan PDF menggunakan `<iframe>` atau gambar langsung di `<img>`.
  - Simpan via `POST /:id/materi-content`.

- **Jika `materiType === "VIDEO"`:**
  - Tampilkan area upload video (accept: `.mp4,.webm`) ATAU input URL embed (YouTube/Vimeo).
  - Preview: gunakan `<video>` tag untuk file upload, atau `<iframe>` untuk embed URL.
  - Simpan via `POST /:id/materi-content`.

**4D. Tombol Preview Dinamis:**
- Materi Teks: Modal fullscreen dengan konten dibaca langsung, gunakan `max-w-2xl` dan `leading-relaxed` per Protokol V3.0.
- Materi Video: Modal fullscreen dengan video player, kontrol play/pause.

**4E. Tombol Submit untuk Review:**
- Reuse smart routing logic: jika `REVISI_KETUA` → kirim ke Ketua Tim, selain itu → kirim ke Pakar.
- Validasi: minimal 1 file konten harus sudah diupload sebelum submit.

**4F. Integrasi di `src/index.tsx`:**
- Import `PembuatMateriDashboard`.
- Pada case `PEMBUAT_MATERI` (line 248), ganti placeholder dengan komponen fungsional.
- Query data yang diperlukan: `myProjectsData` (filter `idPembuat === userId` dan type `MATERI`), `publishedProjectsData`, `allUsersData`.

---

### TASK 5: Pakar & Ketua Preview (Modal Preview Materi) [v]
**File**: `src/views/components/PakarDashboard.tsx` & `src/views/components/KetuaTimDashboard.tsx`

**5A. Tambah kondisional preview untuk tipe MATERI:**
- Di preview modal kedua dashboard, tambahkan:
  - `x-if="activeProject?.type === 'MATERI' && activeProject?.materiType === 'TEKS'"` → render dokumen viewer.
  - `x-if="activeProject?.type === 'MATERI' && activeProject?.materiType === 'VIDEO'"` → render video player.
- Fetch konten materi via `GET /api/projects/:id/materi-content`.

**5B. Review form tetap sama:**
- Tombol "MINTA REVISI" dan "SETUJUI & PUBLISH" sudah ada dan bisa digunakan apa adanya.
- Smart routing di backend sudah menangani logic yang benar.

---

### TASK 6: Landing Page — Tampilkan Materi Published [v]
**File**: `src/index.tsx`, `src/views/components/GamesSection.tsx`

**6A. Query materi published:**
- Di route `GET /` pada `index.tsx`, tambahkan query:
  ```
  const allMateris = await db.select().from(projects).where(
    and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED"))
  ).limit(25);
  ```

**6B. Buat komponen `MateriSection.tsx`:**
- File baru: `src/views/components/MateriSection.tsx`
- Layout grid mirip `GamesSection.tsx` tapi dengan ikon/badge berbeda untuk Teks vs Video.
- Setiap card menampilkan: thumbnail, judul, kategori, badge tipe (📄 Teks / 🎬 Video).
- Klik card → buka viewer/player di halaman khusus atau modal.

**6C. Inject `MateriSection` di landing page:**
- Tambahkan section baru di `index.tsx` setelah section Games.

---

### TASK 7: Smart Recognition — Frontend & Backend [v]
**File baru**: `src/views/components/MateriViewer.tsx`

**7A. Viewer Materi Teks (Intersection Observer + Timer):**
- Buat komponen viewer dengan Alpine.js.
- Implementasi **Intersection Observer API** pada elemen footer/akhir dokumen:
  - Deteksi apakah user sudah scroll sampai bawah dokumen.
  - Gunakan `threshold: 0.8` pada observer.
- Implementasi **Timer sederhana**:
  - Mulai timer saat halaman materi dibuka.
  - Minimum 120 detik (2 menit) harus tercapai.
- Setiap 10 detik, kirim progress ke `POST /api/materi/:id/progress`.
- Jika `scrollPercentage >= 95 AND timeSpentSeconds >= 120`:
  - Tampilkan tombol "Klaim Achievement" yang memanggil `POST /api/materi/:id/claim-achievement`.

**7B. Viewer Materi Video (Media Event Listener):**
- Gunakan `<video>` tag dengan event listeners:
  - `ontimeupdate`: track progress waktu.
  - `onended`: set `videoWatchedPercentage = 100`.
  - Hitung persentase: `(currentTime / duration) * 100`.
  - Deteksi skip ekstrem: jika `currentTime` lompat > 30 detik dari posisi terakhir, reset progress.
- Jika `videoWatchedPercentage >= 90`:
  - Tampilkan tombol "Klaim Achievement".

**7C. UI Achievement:**
- Setelah klaim berhasil, tampilkan animasi konfetti/badge.
- Warna badge: Electric Gold `#FFC107` di atas Deep Navy `#1A237E`.

---

### TASK 8: Registrasi Route Baru di Entry Point [v]
**File**: `src/index.tsx`

- Import `materiRoutes` dari `src/routes/materi.ts`.
- Tambahkan `.use(materiRoutes)` setelah `.use(crosswordRoutes)`.
- Update `pageContextMap` untuk `PEMBUAT_MATERI`: `'Workspace Konten — Pembuat Materi'`.

---

## 🎨 UI/UX SKILL MEMORY PROTOCOL V3.0

Semua komponen baru **WAJIB** mematuhi aturan berikut:

| Aspek | Aturan |
|-------|--------|
| **Latar** | Deep Navy `#1A237E` |
| **Aksen** | Electric Gold `#FFC107` |
| **Tombol Interaktif** | Vibrant Orange `#FF5722` |
| **Font Header** | Montserrat / Poppins |
| **Font Body** | Inter / Roboto |
| **Base Size** | 16px (1rem) |
| **Heading** | `text-xl` (mobile) → `text-2xl` (desktop) |
| **Body** | `text-sm` (mobile) → `text-base` (desktop) |
| **Line Height** | `leading-relaxed` wajib untuk teks konten panjang |
| **Responsivitas** | Wajib prefix `sm:`, `md:`, `lg:` pada setiap font size |
| **Grid** | CSS Grid/Flexbox dengan media queries |
| **Constraint** | Dilarang ukuran font statis `px` tanpa responsive fallback |
| **Logo** | `C:\Users\fredy\GitHub\public\assets\Logo LogosLAB.png` |

---

## 🔒 SECURITY & RBAC CHECKLIST

- [ ] Validasi `user.role` pada setiap endpoint materi (KETUA_TIM untuk create, PEMBUAT_MATERI untuk edit konten, PAKAR untuk review).
- [ ] Sanitasi input: strip HTML tags dari judul/deskripsi, validasi tipe file upload.
- [ ] File upload size limit: max 10MB untuk dokumen, max 50MB untuk video.
- [ ] Rate limiting pada endpoint claim-achievement (max 1 request per detik per user).
- [ ] Validasi status proyek sebelum allow edit (hanya DRAFT/REVISI_PAKAR/REVISI_KETUA).

---

## 🧹 CLEAN CODE & DRY PRINCIPLES

- [ ] Reuse `ProjectHeader` component — jangan duplikasi.
- [ ] Reuse pattern Alpine.js data dari `PembuatGameDashboard` untuk `PembuatMateriDashboard`.
- [ ] Reuse `reviewsHistory` tabel yang sudah ada untuk log revisi materi.
- [ ] Reuse pattern tab panel & status badge styling dari dashboard yang sudah ada.
- [ ] Extractkan fungsi helper `isReadOnly()`, `getUserName()`, `submitForReview()` yang berulang.

---

## 🚫 ANTI-REGRESSION CHECKLIST

Komponen berikut **DILARANG DIUBAH** strukturnya:
- [ ] `Navbar.tsx` — Tidak boleh dimodifikasi.
- [ ] `RBAC System` (auth.ts) — Logika login/signup tidak boleh diubah.
- [ ] `Database Config` (db.ts, drizzle.config.ts) — Koneksi database tidak boleh diubah.
- [ ] Semua game editor/player (WordSearch, Crossword, Quiz, FTB) — Tidak boleh terganggu.
- [ ] Route `/api/projects` GET dan POST untuk GAME harus tetap berfungsi identik.

---

## 📁 RINGKASAN FILE YANG TERPENGARUH

### File yang Dimodifikasi:
| File | Perubahan |
|------|-----------|
| `src/db/schema.ts` | Tambah kolom `materiType`, tabel `materiContents`, `achievements`, `materiReadProgress` |
| `src/routes/projects.ts` | Ubah hardcode type, tambah case PEMBUAT_MATERI, tambah materi content routes |
| `src/index.tsx` | Query pembuatMateri, import dashboard baru, inject MateriSection, register route baru |
| `src/views/components/KetuaTimDashboard.tsx` | Tambah filter tipe, tombol & form penugasan materi |
| `src/views/components/PakarDashboard.tsx` | Tambah preview materi di modal |
| `src/views/components/ProjectHeader.tsx` | Kondisional label GAME vs MATERI |

### File Baru:
| File | Deskripsi |
|------|-----------|
| `src/views/components/PembuatMateriDashboard.tsx` | Dashboard lengkap untuk role Pembuat Materi |
| `src/views/components/MateriSection.tsx` | Section materi di landing page |
| `src/views/components/MateriViewer.tsx` | Viewer + Smart Recognition untuk end user |
| `src/routes/materi.ts` | Routes untuk progress tracking & achievement claim |

---

## ⚡ URUTAN EKSEKUSI YANG DIREKOMENDASIKAN

1. **Schema & Migrasi** (Task 1) — Fondasi database harus selesai duluan.
2. **Backend Routes** (Task 2) — API harus ready sebelum frontend.
3. **Ketua Tim Dashboard** (Task 3) — Agar bisa assign proyek materi.
4. **Pembuat Materi Dashboard** (Task 4) — Agar bisa mengerjakan materi.
5. **Pakar & Ketua Preview** (Task 5) — Agar bisa review materi.
6. **Landing Page** (Task 6) — Tampilkan materi published.
7. **Smart Recognition** (Task 7) — Fitur tambahan setelah core selesai.
8. **Entry Point Registration** (Task 8) — Final wiring.

---

> ⏳ **Status**: Cetak biru ini MENUNGGU PERSETUJUAN dari Freddy sebelum Low Agent boleh mulai eksekusi.
