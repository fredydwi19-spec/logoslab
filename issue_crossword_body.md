## 🌟 Objective
Membangun modul **Game Teka-Teki Silang (Crossword)** sebagai game edukasi teologis keempat di Logos LAB, terintegrasi penuh dengan sistem kolaborasi tim (Ketua Tim → Pembuat Game → Pakar), skoring, dan leaderboard yang sudah berjalan. Modul ini **HARUS menggunakan file baru** dan **DILARANG KERAS memodifikasi** file modul game yang sudah ada (quiz, fill_the_blank, word_search).

---

## 🛠️ Tech Stack
- **Runtime**: Bun
- **Backend Framework**: ElysiaJS (dengan `@elysiajs/html` untuk SSR)
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Frontend**: Alpine.js (inline) + CSS sesuai design system Logos LAB

---

## 🎨 Visual & Design System

> **WAJIB**: Semua UI mengikuti identitas visual Logos LAB.

- **Primary BG**: Deep Navy (`#1A237E`)
- **Aksen**: Electric Gold (`#FFC107`)
- **Tombol Aksi Utama**: Vibrant Orange (`#FF5722`)
- **Typography**: Montserrat/Poppins (Heading), Inter/Roboto (Body)
- **Logo Asset**: Gunakan path aset resmi `public/assets/Logo LogosLAB.png` (path relatif dari root project)
- **Responsif**: Wajib gunakan fluid grid / media queries agar mobile-friendly

---

## 🔄 Alur Kolaborasi & State Machine (IDENTIK dengan modul lain)

> **DILARANG membuat alur baru.** Gunakan 100% State Machine yang sudah ada di `src/routes/projects.ts`.

### Status States (Identik dengan modul QUIZ/FTB/Word Search)

```
DRAFT → REVIEW_PAKAR → REVISI_PAKAR → ACCEPTED_PAKAR → REVIEW_KETUA → REVISI_KETUA → PUBLISHED
```

### Urutan Peran & Wewenang

| Role | Aksi yang Diizinkan |
|---|---|
| **Ketua Tim** | Membuat proyek & menugaskan Pembuat Game + Pakar. Pilih `CROSSWORD` di dropdown Jenis Game. Review final (Accept → PUBLISHED / Revisi → REVISI_KETUA). |
| **Pembuat Game** | Buat & edit soal saat status `DRAFT`, `REVISI_PAKAR`, `REVISI_KETUA`. Submit → Smart Routing ke Pakar atau Ketua. Bisa Preview game sebelum submit. |
| **Pakar** | Accept (`→ ACCEPTED_PAKAR`) atau Revisi (`→ REVISI_PAKAR`). Hanya bisa aksi saat `REVIEW_PAKAR`. Bisa Preview game sebelum menilai. |

### Smart Routing (Identik dengan modul lain)
- Jika status `REVISI_KETUA` → submit Pembuat → `REVIEW_KETUA` (bypass Pakar)
- Selain itu → submit Pembuat → `REVIEW_PAKAR`

### Log & Notifikasi
- Setiap transisi status **WAJIB** dicatat ke tabel `reviews_history` yang sudah ada
- Kirim notifikasi ke tabel `notifications` yang sudah ada ke pihak terkait

---

## 🗃️ Database Schema Update (Drizzle ORM)

### Tabel Baru: `game_crossword`
Tambahkan tabel baru di `src/db/schema.ts` (jangan ubah tabel lain):

- `id` — serial, PK
- `projectId` — bigint, FK → `projects.id`, notNull
- `clues` — text (JSON string): `Array<{ number: number; direction: 'ACROSS'|'DOWN'; clue: string; answer: string; startRow: number; startCol: number; explanation: string; }>`
- `gridSize` — int (ukuran grid, contoh: 15 = 15x15)
- `difficulty` — mysqlEnum: `EASY`, `MEDIUM`, `HARD`
- `score` — int (skor per kata benar)
- `gridData` — text (JSON string: matriks 2D cell object `Array<Array<{letter:string, isBlack:boolean, number:number|null}>>`)
- `createdAt` / `updatedAt` — timestamp

> **Catatan**: Kolom `gameType` di tabel `projects` **sudah memiliki `CROSSWORD`** di enum-nya (cek `src/db/schema.ts` baris 31). Tidak perlu migrasi tambahan untuk itu.

**Checklist Migrasi:**
- [ ] Tambahkan tabel `game_crossword` ke `src/db/schema.ts`
- [ ] Jalankan `bun run db:generate`
- [ ] Jalankan `bun run db:migrate`

---

## 🧩 Modul 1: Penugasan Proyek (Ketua Tim)

> File target: Ekstensi pada `src/views/components/KetuaTimDashboard.tsx` — **hanya tambah opsi dropdown, jangan ubah logika existing**.

- [ ] Tambahkan opsi `<option value="CROSSWORD">Teka-Teki Silang</option>` pada dropdown `gameType` di form penugasan proyek (saat ini ada: QUIZ, FILL_THE_BLANK, WORD_SEARCH)
- [ ] Tambahkan tombol filter `CROSSWORD` di tab bar filter jenis game (sejajar dengan QUIZ, FTB, WORD SEARCH)
- [ ] Pada fungsi `openProject()`, tambahkan branch untuk `CROSSWORD`: fetch `/api/crossword/:id` dan simpan ke `this.gameData`
- [ ] Pada `previewGame()`, tambahkan validasi untuk `CROSSWORD` (cek `gameData` dan `gameData.clues` tersedia)
- [ ] Pada Preview Modal, tambahkan template crossword yang merender `CrosswordGame` saat `activeProject.gameType === 'CROSSWORD'` dan `gameData` tersedia
- [ ] Form penugasan mengirimkan `gameType: "CROSSWORD"` ke endpoint `POST /api/projects` yang sudah ada

---

## 🧩 Modul 2: Editor Soal Crossword (Pembuat Game)

> **File baru**: `src/views/components/CrosswordEditor.tsx`

### Desain Form Editor (konsisten dengan WordSearchEditor)
Form editor menyediakan field berikut per entri clue:
- **Nomor Clue** (auto-increment, read-only display)
- **Arah** — dropdown: `ACROSS` (Mendatar) / `DOWN` (Menurun)
- **Jawaban/Kata** — input text (A-Z saja, auto-uppercase)
- **Posisi Awal** — input Row dan Col (angka, 0-indexed)
- **Pertanyaan/Clue** — textarea kalimat teka-teki
- **Penjelasan Edukatif** — textarea (ditampilkan setelah kata terjawab)
- **Tingkat Kesulitan** — dropdown: EASY / MEDIUM / HARD
- **Tombol Hapus** per entri

### Fitur Wajib Editor
- [ ] Buat `src/views/components/CrosswordEditor.tsx` sebagai file baru
- [ ] **Grid Preview Live**: Setiap perubahan data clue merender otomatis grid crossword visual. Sel berisi huruf berwarna navy, sel hitam berwarna gelap, nomor clue tampil di sudut kiri atas sel
- [ ] **Tombol "Generate Grid"**: Hitung otomatis `gridData` (matriks 2D) berdasarkan daftar clue. Validasi: tidak ada kata yang overlap karakter berbeda di posisi yang sama
- [ ] **Autosave ke localStorage**: Setiap perubahan tersimpan ke localStorage dengan key `crossword_draft_${projectId}`. Tampilkan save indicator (SYNCHRONIZED / LOCAL SAVED / UPLOADING / CLOUD SYNCED) konsisten dengan PembuatGameDashboard
- [ ] **Tombol "Simpan ke Cloud"**: `POST /api/crossword/:projectId/questions` dengan payload `{ clues, gridSize, difficulty, score, gridData }`
- [ ] **Tombol Preview Game**: Membuka Preview Modal dengan CrosswordGame (memanggil `previewGame()` di Alpine.js context)
- [ ] Export fungsi `CrosswordEditorScript()` untuk didaftarkan ke Alpine.js (pola sama dengan `WordSearchEditorScript()`)
- [ ] Validasi minimal: paling sedikit 3 clue sebelum bisa submit ke review

---

## 🧩 Modul 2B: Integrasi Editor di PembuatGameDashboard

> File target: Ekstensi `src/views/components/PembuatGameDashboard.tsx` — **hanya tambah branch CROSSWORD, jangan ubah logika QUIZ/FTB/Word Search**.

- [ ] Import `CrosswordEditor` dan `CrosswordEditorScript` dari `./CrosswordEditor`
- [ ] Pada `openProject()`: tambahkan branch CROSSWORD — fetch `/api/crossword/:id` dan simpan ke `this.gameData`
- [ ] Pada `previewGame()`: tambahkan guard untuk CROSSWORD (validasi `gameData` dan `gameData.clues.length > 0`)
- [ ] Pada `submitForReview()`: tambahkan guard CROSSWORD (cek `gameData?.clues?.length >= 3`)
- [ ] Di Editor View: tambahkan template crossword yang merender `CrosswordEditor` saat `activeProject.gameType === 'CROSSWORD'` (sejajar dengan Word Search template yang ada)
- [ ] Di Preview Modal (showPreview): tambahkan template crossword yang merender `CrosswordGame` saat game type CROSSWORD dan gameData tersedia
- [ ] Daftarkan `${CrosswordEditorScript()}` dan `${CrosswordGameScript()}` di akhir return template

---

## 🧩 Modul 3: Review Berjenjang (Pakar)

> File target: Ekstensi `src/views/components/PakarDashboard.tsx` — **hanya tambah branch CROSSWORD**.

- [ ] Import `CrosswordGame` dan `CrosswordGameScript` dari `./CrosswordGame`
- [ ] Pada `openProject()`: tambahkan branch CROSSWORD — fetch `/api/crossword/:id` dan simpan ke `this.gameData`
- [ ] Pada `previewGame()`: tambahkan guard untuk CROSSWORD
- [ ] Di Preview Modal: tambahkan template crossword yang merender `CrosswordGame` (read-only review mode)
- [ ] Pastikan tombol **MINTA REVISI** dan **VERIFIKASI & SETUJUI** tetap menggunakan endpoint `POST /api/projects/:id/review` yang sudah ada
- [ ] Review history dari `reviews_history` tetap ditampilkan via `ProjectHeader` yang sudah ada
- [ ] Daftarkan `${CrosswordGameScript()}` di akhir return template

---

## 🧩 Modul 4: Review Final (Ketua Tim)

> File target: Ekstensi `src/views/components/KetuaTimDashboard.tsx` — **hanya tambah branch CROSSWORD di preview modal**.

- [ ] Di Preview Modal Ketua: tambahkan template crossword yang merender `CrosswordGame` saat game type CROSSWORD dan gameData tersedia
- [ ] Tombol **MINTA REVISI** (`submitReview('REVISI')`) dan **SETUJUI & PUBLISH** (`submitReview('ACCEPT')`) sudah ada — tidak perlu diubah
- [ ] Daftarkan `${CrosswordGameScript()}` dan `${CrosswordEditorScript()}` di akhir return template

---

## 🧩 Modul 5: Gameplay Engine (Member/User)

> **File baru**: `src/views/components/CrosswordGame.tsx`

### Fitur Gameplay Wajib
- [ ] Buat `src/views/components/CrosswordGame.tsx` sebagai file baru
- [ ] **Render Grid Interaktif**: Render matriks crossword dari `gridData`. Sel hitam tidak bisa diklik, sel putih bisa diisi huruf
- [ ] **Clue Panel**: Panel di bawah/samping grid menampilkan daftar clue ACROSS dan DOWN dengan nomor
- [ ] **Cell Selection**: Klik sel → highlight sel aktif sesuai arah yang dipilih. Klik dua kali → ganti arah (ACROSS ↔ DOWN)
- [ ] **Input Keyboard**: Mengetik huruf mengisi sel aktif dan maju ke sel berikutnya. Backspace menghapus dan mundur
- [ ] **Check Answer Button**: Validasi semua jawaban. Sel benar = warna hijau, salah = merah
- [ ] **Educational Pop-up**: Setelah satu kata lengkap terjawab benar → tampilkan `explanation` kata tersebut dalam modal kecil
- [ ] **Skor & Timer**: Hitung skor berdasarkan jumlah kata benar × skor per difficulty. Tampilkan timer. Summary modal di akhir game
- [ ] Export fungsi `CrosswordGame({ projectVar, gameDataVar })` dan `CrosswordGameScript()` (pola sama dengan `WordSearchGame`)
- [ ] **Preview/Read-Only Mode**: Ketika dipanggil dari dashboard, game berjalan penuh tetapi skor tidak dikirim ke server

### Integrasi Skoring
- [ ] Skor per kata: `EASY = 10`, `MEDIUM = 20`, `HARD = 50`
- [ ] Simpan skor ke tabel `user_scores` via endpoint `POST /api/crossword/:projectId/submit`
- [ ] Pastikan skor terakumulasi di Leaderboard global yang sudah berjalan

---

## 🔌 API Endpoints Baru

> **Buat file baru**: `src/routes/crossword.ts`. **JANGAN modifikasi `projects.ts` atau `word_search.ts`**.
> Referensi pola: lihat `src/routes/word_search.ts` sebagai template.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| `GET` | `/api/crossword/:projectId` | All (RBAC existing) | Ambil data crossword (clues + gridData) |
| `POST` | `/api/crossword/:projectId/questions` | PEMBUAT_GAME / KETUA_TIM | Simpan/update data crossword (upsert) |
| `POST` | `/api/crossword/:projectId/submit` | USER | Submit skor gameplay |

**Detail Implementasi Routes:**
- Gunakan middleware JWT yang sudah ada di `src/routes/projects.ts` sebagai referensi (pola `onBeforeHandle` + `derive`)
- Endpoint GET: izinkan akses publik hanya jika status proyek `PUBLISHED`; otherwise butuh auth
- Endpoint POST questions: validasi `project.status` harus dalam `['DRAFT', 'REVISI_PAKAR', 'REVISI_KETUA']`
- Endpoint POST questions: validasi `project.idPembuat === user.id` (jika role PEMBUAT_GAME)
- Daftarkan route di `src/index.tsx`: `app.use(crosswordRoutes)` (hanya tambah 1 baris import + 1 baris use)

---

## 🔐 Security Blueprint & Vulnerability Checklist

- [ ] **Broken Access Control**: Validasi role di setiap endpoint. Pembuat Game tidak bisa memanggil endpoint review. Pakar tidak bisa edit soal
- [ ] **Input Sanitization**: Sanitasi semua input `answer` (strip HTML, batasi ke A-Z saja, auto-uppercase) sebelum disimpan ke grid
- [ ] **Grid Data Validation**: Validasi `gridData` di server: pastikan hanya berisi sel valid (karakter A-Z atau sel hitam). Re-generate/re-validate di server, jangan percaya raw data client
- [ ] **Clue Answer Consistency**: Validasi bahwa setiap `answer` dalam clue konsisten dengan karakter di `gridData` pada posisi `startRow`/`startCol` sesuai `direction`
- [ ] **SQL Injection**: Gunakan parameter binding Drizzle ORM untuk semua query (default Drizzle — jangan gunakan raw query)
- [ ] **State Machine Enforcement**: Validasi transisi status di server; jangan percaya status yang dikirim client
- [ ] **Score Tampering**: Hitung ulang skor di server berdasarkan clue yang benar; jangan hanya percaya nilai dari body request

---

## 🛡️ Anti-Regression: Preservation List

Komponen berikut **TIDAK BOLEH** diubah strukturnya (hanya boleh diekstensi):

- [ ] `src/index.tsx` — Jangan ubah konfigurasi JWT, static file, dan plugin existing. Hanya tambahkan `import` dan `app.use(crosswordRoutes)`
- [ ] `src/views/layouts/Layout.tsx` — Jangan ubah struktur core Sidebar dan Header
- [ ] `src/db/db.ts` — Jangan ubah konfigurasi koneksi database
- [ ] `src/db/schema.ts` — Hanya TAMBAHKAN tabel `game_crossword`. Jangan modifikasi kolom tabel lain yang sudah ada
- [ ] `src/routes/projects.ts` — Hanya baca sebagai referensi RBAC. **JANGAN MODIFIKASI**
- [ ] `src/routes/word_search.ts` — **JANGAN MODIFIKASI**
- [ ] `src/views/components/Navbar.tsx` — **JANGAN diubah**
- [ ] `src/views/components/WordSearchEditor.tsx` — **JANGAN diubah**
- [ ] `src/views/components/WordSearchGame.tsx` — **JANGAN diubah**
- [ ] Semua logika QUIZ dan FILL_THE_BLANK di `PembuatGameDashboard.tsx` — hanya ekstensi, jangan ubah logika existing

---

## ✅ Execution Checklist (Summary for Low Agent)

### Tahap 1: Database
- [ ] Tambah tabel `game_crossword` di `src/db/schema.ts`
- [ ] Jalankan `bun run db:generate` dan `bun run db:migrate`

### Tahap 2: Backend (File Baru)
- [ ] Buat `src/routes/crossword.ts` dengan 3 endpoint (GET, POST questions, POST submit)
- [ ] Daftarkan route di `src/index.tsx`

### Tahap 3: Frontend (File Baru)
- [ ] Buat `src/views/components/CrosswordEditor.tsx` (editor soal + grid generator + live preview + autosave)
- [ ] Buat `src/views/components/CrosswordGame.tsx` (gameplay engine + cell selection + check answer + educational popup + scoring)

### Tahap 4: Frontend (Ekstensi File Existing)
- [ ] Ekstensi `KetuaTimDashboard.tsx`: tambah opsi CROSSWORD di dropdown form penugasan + tab filter + openProject branch + preview modal branch
- [ ] Ekstensi `PembuatGameDashboard.tsx`: tambah branch CROSSWORD di openProject, previewGame, submitForReview, editor view, preview modal
- [ ] Ekstensi `PakarDashboard.tsx`: tambah branch CROSSWORD di openProject, previewGame, preview modal

### Tahap 5: Integrasi & Testing
- [ ] Uji alur penuh: Penugasan (Ketua, pilih CROSSWORD) → Edit Soal + Preview (Pembuat) → Submit → Review Pakar (preview + accept/revisi) → Review Ketua (preview + publish) → Gameplay (USER) → Skor di Leaderboard
- [ ] Verifikasi semua modul lain (QUIZ, FTB, WORD_SEARCH) tidak terpengaruh (regression test)
- [ ] Verifikasi Preview Game berfungsi di ketiga role (Pembuat, Pakar, Ketua) dengan CrosswordGame yang sama

---

## 🚦 Status Konfirmasi
> ✅ **Rencana ini sudah matang dan siap dieksekusi oleh Low Agent.** Semua keputusan arsitektural dibuat berdasarkan telaah mendalam terhadap modul QUIZ, Fill the Blank, dan Word Search yang sudah berjalan. Low Agent dapat langsung memulai dari **Tahap 1: Database**.
