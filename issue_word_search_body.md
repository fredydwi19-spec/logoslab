## 🌟 Objective
Membangun modul **Game Word Search** sebagai game edukasi teologis ketiga di Logos LAB, secara penuh terintegrasi dengan sistem kolaborasi, skoring, dan leaderboard yang sudah berjalan. Modul ini **HARUS menggunakan file baru** dan **DILARANG KERAS memodifikasi** file `game_quiz` maupun `game_fill_the_blank`.

---

## 🛠️ Tech Stack
- **Runtime**: Bun
- **Backend Framework**: ElysiaJS (dengan `@elysiajs/html` untuk SSR)
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Frontend**: Alpine.js (atau vanilla JS inline) + CSS sesuai design system Logos LAB

---

## 🎨 Visual & Design System

> **WAJIB**: Semua UI mengikuti identitas visual Logos LAB.

- **Primary BG**: Deep Navy (`#1A237E`)
- **Aksen**: Electric Gold (`#FFC107`)
- **Tombol Aksi Utama**: Vibrant Orange (`#FF5722`)
- **Typography**: Montserrat/Poppins (Heading), Inter/Roboto (Body)
- **Logo Asset**: Gunakan path aset resmi `public/assets/Logo LogosLAB.png` (pastikan path relatif dari root project sudah benar di serve static config `src/index.tsx`)
- **Responsif**: Wajib gunakan fluid grid / media queries agar mobile-friendly

---

## 🔄 Alur Kolaborasi & State Management (IDENTIK dengan modul Quiz & Fill the Blank)

> **DILARANG membuat alur baru.** Duplikasi 100% State Machine yang sudah ada di `src/routes/projects.ts`.

### Status States (Identik dengan modul sebelumnya)

```
DRAFT → REVIEW_PAKAR → REVISI_PAKAR → ACCEPTED_PAKAR → REVIEW_KETUA → REVISI_KETUA → PUBLISHED
```

### Urutan Peran & Wewenang

| Role | Aksi yang Diizinkan |
|---|---|
| **Pembuat Game** | Buat & edit soal (hanya saat `DRAFT`, `REVISI_PAKAR`, `REVISI_KETUA`). Submit ke review (DRAFT/REVISI → REVIEW_PAKAR atau REVIEW_KETUA sesuai Smart Routing). |
| **Pakar** | Accept (`→ ACCEPTED_PAKAR`) atau Revisi (`→ REVISI_PAKAR`). Hanya bisa aksi saat status `REVIEW_PAKAR`. |
| **Ketua Tim** | Accept (`→ PUBLISHED`) atau Revisi (`→ REVISI_KETUA`). Bisa aksi saat `ACCEPTED_PAKAR` atau `REVIEW_KETUA`. **Ketua Tim memiliki wewenang override** dan bisa melakukan review ulang kapan saja. Ketua Tim juga yang membuat proyek dan menugaskan Pembuat Game. |

### Smart Routing (Identik dengan Quiz/FTB)
- Jika status saat ini `REVISI_KETUA`, submit Pembuat → `REVIEW_KETUA` (langsung ke Ketua, bypass Pakar).
- Selain itu, submit Pembuat → `REVIEW_PAKAR`.

### Log & Notifikasi
- Setiap transisi status **WAJIB** dicatat ke tabel `reviews_history` yang sudah ada.
- Kirim notifikasi ke tabel `notifications` yang sudah ada ke pihak terkait.

---

## 🗃️ Database Schema Update (Drizzle ORM)

### Tabel Baru: `game_word_search`
Tambahkan tabel baru di `src/db/schema.ts` (jangan ubah tabel lain):

- `id` — serial, PK
- `projectId` — bigint, FK → `projects.id`
- `words` — text (JSON string): `Array<{ word: string; explanation: string; }>` (kata + penjelasan teologis)
- `gridSize` — int (ukuran grid, misal: 10 = 10x10)
- `difficulty` — mysqlEnum: `EASY`, `MEDIUM`, `HARD`
- `score` — int (skor per kata ditemukan)
- `gridData` — text (JSON string: matriks karakter 2D yang sudah di-generate, bisa di-regenerate)
- `createdAt` / `updatedAt` — timestamp

> **Catatan**: Kolom `gameType` di tabel `projects` sudah memiliki `WORD_SEARCH` di enum-nya (cek `src/db/schema.ts` baris 31). Tidak perlu migrasi tambahan untuk itu.

**Checklist Migrasi:**
- [x] Tambahkan tabel `game_word_search` ke `src/db/schema.ts`
- [x] Jalankan `bun run db:generate`
- [x] Jalankan `bun run db:migrate` (Applied manually, verified table existence)

---

## 🧩 Modul 1: Penugasan Proyek (Ketua Tim)

> File target: Ekstensi pada `src/views/components/KetuaTimDashboard.tsx` (hanya tambahkan section/tab baru, jangan ubah logika existing).

- [x] Tambahkan opsi `WORD_SEARCH` pada dropdown `gameType` di form penugasan proyek.
- [x] Form mengirimkan `gameType: "WORD_SEARCH"` ke endpoint `POST /api/projects` yang sudah ada.
- [x] Ketua Tim dapat melihat daftar proyek Word Search terpisah (tab/filter) di dashboard-nya.
- [x] Trigger AI Thumbnail Generator (`POST /api/projects/generate-thumbnail`) tetap berfungsi untuk game tipe ini.

---

## 🧩 Modul 2: Editor Soal Word Search (Pembuat Game)

> **File baru**: `src/views/components/WordSearchEditor.tsx`

- [x] Buat `src/views/components/WordSearchEditor.tsx`.
- [x] Input Kata & Penjelasan Teologis: Minimal 5 kata, maksimal sesuai ukuran grid.
- [x] Auto-Grid Generator: Tombol "Generate Grid" yang mengisi kata secara acak (Horizontal, Vertikal, Diagonal).
- [x] Live Preview: Tampilan grid secara real-time di sisi kanan editor.
- [x] Autosave & Sync: Simpan ke `localStorage` saat mengetik, tombol "Simpan ke Cloud" untuk sinkronisasi ke DB.

---

## 🧩 Modul 3: Review Berjenjang (Pakar & Ketua Tim)

> File target: Ekstensi halaman review di `PakarDashboard.tsx` dan `KetuaTimDashboard.tsx`.

- [ ] Tampilkan detail proyek Word Search: daftar kata + penjelasan teologis, dan **Live Preview Grid (read-only)**.
- [ ] Gunakan endpoint review yang sudah ada: `POST /api/projects/:id/review`.
- [ ] Tampilkan riwayat review dari `reviews_history` yang sudah ada.
- [x] Tampilkan detail proyek Word Search: daftar kata + penjelasan teologis, dan **Live Preview Grid (read-only)**.
- [x] Gunakan endpoint review yang sudah ada: `POST /api/projects/:id/review`.
- [x] Tampilkan riwayat review dari `reviews_history` yang sudah ada.
- [x] Pastikan tombol Accept/Revisi mengikuti state machine yang sudah didefinisikan.

---

## 🧩 Modul 4: Gameplay Engine (Member/User)

> **File baru**: `src/views/components/WordSearchGame.tsx`

- [x] Buat `src/views/components/WordSearchGame.tsx`.
- [x] Drag-to-Select Logic: Implementasi pemilihan huruf dengan klik+tahan+seret (Mouse/Touch).
- [x] Found Word Highlights: Beri warna permanen pada kata yang sudah ditemukan.
- [x] Educational Pop-up: Tampilkan penjelasan teologis segera setelah sebuah kata ditemukan.
- [x] Gameplay Summary & Scoring: Tampilkan total skor dan waktu di akhir permainan.

### Integrasi Skoring
- [x] Skor per kata: `EASY = 10`, `MEDIUM = 20`, `HARD = 50`.
- [x] Simpan skor ke tabel `user_scores` (integrasi dengan leaderboard global).
- [x] Endpoint: `POST /api/word-search/:projectId/submit`. dan disimpan ke tabel `user_scores`.
- [x] Pastikan skor terakumulasi di **Leaderboard global** yang sudah berjalan.

---

## 🔌 API Endpoints Baru

> Buat file baru `src/routes/word_search.ts`. **JANGAN modifikasi `projects.ts`.**

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| `GET` | `/api/word-search/:projectId` | All (sesuai RBAC existing) | [x] |
| `POST` | `/api/word-search/:projectId/questions` | Pembuat Game | [x] |
| `POST` | `/api/word-search/:projectId/submit` | USER | [x] |

> **RBAC**: Gunakan middleware JWT yang sudah ada di `src/routes/projects.ts` sebagai referensi. Jangan ubah middleware itu.

---

## 🔐 Security Blueprint & Vulnerability Checklist

- [ ] **Broken Access Control**: Validasi role secara ketat di setiap endpoint baru. Pembuat Game tidak bisa memanggil endpoint review; Pakar tidak bisa edit soal.
- [ ] **Input Sanitization**: Sanitasi semua input kata (strip HTML, batasi karakter ke A-Z saja) sebelum diproses ke grid generator.
- [ ] **Grid Data Validation**: Validasi bahwa `gridData` yang disimpan adalah matriks 2D valid (karakter A-Z saja). Re-generate atau re-validate di server; jangan percaya data mentah dari client.
- [ ] **SQL Injection**: Gunakan parameter binding Drizzle ORM untuk semua query (default Drizzle, jangan gunakan raw query).
- [ ] **State Machine Enforcement**: Validasi transisi status di server; jangan percaya status yang dikirim client secara mentah.
- [ ] **Score Tampering**: Hitung ulang skor di server berdasarkan kata yang ditemukan; jangan hanya percaya nilai skor dari body request.

---

## 🛡️ Anti-Regression: Preservation List

Komponen berikut **TIDAK BOLEH** diubah strukturnya (hanya boleh diekstensi):

- [ ] `src/index.tsx` — Jangan ubah konfigurasi JWT, static file, dan plugin existing. Hanya tambahkan `import` dan `app.use(wordSearchRoutes)`.
- [ ] `src/views/layouts/Layout.tsx` — Jangan ubah struktur core Sidebar dan Header.
- [ ] `src/db/db.ts` — Jangan ubah konfigurasi koneksi database.
- [ ] `src/db/schema.ts` — Hanya TAMBAHKAN tabel `game_word_search`. Jangan modifikasi kolom tabel lain yang sudah ada.
- [ ] `src/routes/projects.ts` — Hanya baca sebagai referensi RBAC. **JANGAN MODIFIKASI**.
- [ ] `src/views/components/Navbar.tsx` — **JANGAN diubah**.
- [ ] `src/views/components/PembuatGameDashboard.tsx` — Hanya ekstensi jika diperlukan untuk menambah tab Word Search. Logika Quiz dan FTB tidak boleh rusak.

---

## ✅ Execution Checklist (Summary for Low Agent)

### Database
- [x] Tambah tabel `game_word_search` di `src/db/schema.ts`
- [x] Jalankan `bun run db:generate` dan `bun run db:migrate`

### Backend (File Baru)
- [x] Buat `src/routes/word_search.ts` dengan endpoint GET, POST questions, POST submit
- [x] Daftarkan route di `src/index.tsx` with `app.use(wordSearchRoutes)`

### Frontend (File Baru)
- [x] Buat `src/views/components/WordSearchEditor.tsx` (editor soal + auto-grid generator + live preview)
- [x] Buat `src/views/components/WordSearchGame.tsx` (gameplay engine + educational popup + summary modal)

### Frontend (Ekstensi File Existing)
- [x] Ekstensi `KetuaTimDashboard.tsx`: tambah opsi WORD_SEARCH di form penugasan dan tab filter
- [x] Ekstensi `PakarDashboard.tsx`: tampilkan Word Search preview (read-only) di halaman review
- [x] Ekstensi `PembuatGameDashboard.tsx`: tambah tab Word Search Editor

### Integrasi & Testing
- [x] Uji alur penuh: Penugasan (Ketua) → Edit Soal + Preview (Pembuat) → Submit → Review Pakar → Review Ketua → Published → Gameplay (USER) → Skor di Leaderboard
- [ ] Verifikasi modul Quiz dan Fill the Blank tidak terpengaruh (regression test)

---

## 🚦 Status Konfirmasi
> ✅ **Rencana ini sudah matang dan siap dieksekusi oleh Low Agent.** Semua keputusan arsitektural telah dibuat berdasarkan penelaahan mendalam terhadap modul Quiz dan Fill the Blank yang sudah ada. Low Agent dapat langsung memulai dari bagian **Database Schema**.
