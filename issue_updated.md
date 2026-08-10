## Checklist Kerja Low Agent — Migrasi Sistem Materi Interaktif Manual

> **Stack Wajib**: Bun + ElysiaJS + Drizzle ORM + MySQL + Tailwind CSS
> **Context**: Menggantikan sistem upload PDF/file dengan sistem konten berbasis input teks manual (Sub-Bab + Glosarium + Audio).

---

### 🔍 HASIL AUDIT SISTEM (Temuan Kritis)

1. Tabel `materiContents` (PDF/file) sudah ada — **JANGAN HAPUS** untuk backward compat proyek lama.
2. `projects.materiType` enum saat ini hanya `["TEKS", "VIDEO"]` — perlu tambah `"MANUAL"`.
3. `PembuatMateriDashboard.tsx` hanya memiliki file uploader — belum ada editor teks manual.
4. `MateriViewer.tsx` menggunakan pdf.js untuk TTS — versi MANUAL akan pakai Web Speech API langsung tanpa ekstraksi PDF.
5. Smart routing, achievement, dan progress tracking sudah berjalan — hanya perlu adaptasi minimal untuk tipe MANUAL.
6. `KetuaTimDashboard.tsx` sudah memiliki dropdown `materiType` — cukup tambah opsi `MANUAL`.

---

### A. TECH STACK CONSISTENCY

- [x] Gunakan Bun sebagai runtime, ElysiaJS sebagai framework, Drizzle ORM untuk query database, MySQL sebagai database. Jangan beralih ke library lain.
- [x] Semua komponen frontend menggunakan Tailwind CSS dengan Alpine.js untuk interaktivitas. Jangan gunakan framework frontend lain.

---

### B. DATABASE SCHEMA (`src/db/schema.ts`)

- [x] **Modifikasi enum `materiType` pada tabel `projects`**: Tambahkan nilai `"MANUAL"` ke enum yang sudah ada (`["TEKS", "VIDEO", "MANUAL"]`). Karena MySQL enum sensitif, buat migration manual: `ALTER TABLE projects MODIFY COLUMN materi_type ENUM('TEKS','VIDEO','MANUAL')`. Jalankan ini sebelum `bunx drizzle-kit push`.
- [x] **Buat tabel `materialSections`**: Kolom: `id` (serial PK), `projectId` (bigint unsigned FK → `projects.id` NOT NULL), `subTitle` (varchar 255), `content` (longtext NOT NULL), `sortOrder` (int default 0), `createdAt` (timestamp defaultNow), `updatedAt` (timestamp defaultNow onUpdateNow).
- [x] **Buat tabel `materialGlossary`**: Kolom: `id` (serial PK), `projectId` (bigint unsigned FK → `projects.id` NOT NULL), `word` (varchar 255 NOT NULL), `definition` (text NOT NULL), `createdAt` (timestamp defaultNow), `updatedAt` (timestamp defaultNow onUpdateNow).
- [x] **JANGAN hapus tabel `materiContents`** — pertahankan untuk proyek lama dengan tipe TEKS/VIDEO (anti-regression).
- [x] Setelah selesai modifikasi schema, jalankan `bunx drizzle-kit generate` lalu `bunx drizzle-kit push`. **Backup database sebelum push.**
- [x] Periksa foreign key: `materialSections.projectId` dan `materialGlossary.projectId` harus `references(() => projects.id)`. Pastikan tidak ada kolom yang duplikat dengan tabel lain.

---

### C. BACKEND ROUTES (`src/routes/projects.ts` + `src/routes/materi.ts`)

- [x] **Buat route `POST /api/projects/:id/sections`**: Simpan array sections ke tabel `materialSections`. Gunakan strategi delete-and-reinsert (identik dengan pattern `/:id/questions`). Validasi: project harus MATERI, status harus DRAFT/REVISI_PAKAR/REVISI_KETUA, dan `project.idPembuat === user.id`. Sanitasi input: escape karakter `<`, `>`, `"`, `'` dari `subTitle` dan `content`.
- [x] **Buat route `GET /api/projects/:id/sections`**: Return array `materialSections` ordered by `sortOrder`.
- [x] **Buat route `POST /api/projects/:id/glossary`**: Simpan array glossary ke tabel `materialGlossary`. Validasi dan sanitasi identik dengan route sections. Validasi panjang: `word` max 255 karakter, `definition` max 2000 karakter.
- [x] **Buat route `GET /api/projects/:id/glossary`**: Return array `materialGlossary`.
- [x] **Modifikasi `GET /api/projects/:id`**: Jika `project.materiType === 'MANUAL'`, sertakan `materialSections` dan `materialGlossary` dalam response object (di samping `materiContents` yang sudah ada). Ubah field response menjadi: `{ ...project, questions, materiContents, materialSections, materialGlossary, history }`.
- [x] **Modifikasi `DELETE /api/projects/:id`**: Tambahkan `await db.delete(materialSections).where(eq(materialSections.projectId, projectId))` dan `await db.delete(materialGlossary).where(eq(materialGlossary.projectId, projectId))` sebelum delete project utama.
- [x] **Di `src/routes/materi.ts`**, modifikasi endpoint `POST /:id/claim-achievement`: tambahkan case `materiType === 'MANUAL'` dengan syarat klaim identik dengan TEKS (`scrollPercentage >= 95 AND timeSpentSeconds >= 120`). Set `achievementType = "MATERI_TEKS_SELESAI"` untuk tipe MANUAL.

---

### D. FORM UI PEMBUAT KONTEN (`src/views/components/PembuatMateriDashboard.tsx`)

- [x] **Kondisional rendering editor**: Tambahkan kondisi `x-show="activeProject?.materiType === 'MANUAL'"` untuk editor teks manual baru, dan `x-show="activeProject?.materiType !== 'MANUAL'"` untuk file uploader lama. Jangan hapus kode file uploader lama.
- [x] **Tambah Alpine.js state**: Tambahkan properti `sections: []` (array of `{ id, subTitle, content, sortOrder }`) dan `glossaryItems: []` (array of `{ id, word, definition }`). Load keduanya saat `openProject()` dengan fetch ke routes sections dan glossary.
- [x] **Implementasi tombol [+ Tambah Sub-Bab]**: Saat diklik, push object `{ subTitle: '', content: '', sortOrder: this.sections.length }` ke `sections`. Tampilkan setiap item sebagai panel dengan `<input>` untuk `subTitle` dan `<textarea rows="8">` untuk `content`. Sertakan tombol hapus (ikon ×) di pojok kanan panel. Tambahkan indikator urutan (nomor sub-bab).
- [x] **Auto-save sections**: Buat fungsi `saveSections()` yang POST ke `/api/projects/:id/sections`. Panggil dengan debounce 2 detik setiap kali ada perubahan `x-model` pada input sections. Tampilkan status "Menyimpan..." dan "Tersimpan ✓".
- [x] **Implementasi komponen Glossary**: Di bawah area sub-bab, tambahkan section glosarium dengan tombol `[+ Tambah Istilah]`. Setiap item: row dengan `<input placeholder="Kata/Istilah">` + `<input placeholder="Definisi/Arti">` + tombol hapus.
- [x] **Auto-save glossary**: Buat fungsi `saveGlossary()` yang POST ke `/api/projects/:id/glossary`. Debounce 2 detik. Status saving identik dengan sections.
- [x] **Modifikasi `submitForReview()`**: Untuk proyek MANUAL, validasi `this.sections.length > 0 && this.sections[0].content.trim() !== ''` sebelum allow submit.
- [x] **Styling wajib (Protocol V3.0)**: Header panel sub-bab menggunakan `bg-[#1A237E] text-white`. Border panel `border-[#FFC107]`. Tombol tambah `bg-[#FF5722] hover:bg-[#E64A19]`. Textarea menggunakan `leading-relaxed text-sm md:text-base`. Semua ukuran font responsif dengan prefix `sm:`, `md:`.

---

### E. VIEWER PENGGUNA INTERAKTIF (`src/views/components/MateriViewer.tsx`)

- [x] **Kondisional rendering**: Bungkus viewer lama (PDF/iframe/video) dengan `x-show` yang hanya aktif jika `materiType !== 'MANUAL'`. Bungkus viewer baru (teks) dengan `x-show="project?.materiType === 'MANUAL'"`. **Jangan hapus viewer lama** (anti-regression).
- [x] **Render sections**: Untuk mode MANUAL, render setiap section sebagai kartu terpisah. Tampilkan `subTitle` sebagai `<h2 class="text-xl md:text-2xl font-bold text-[#1A237E]">`. Render `content` menggunakan `x-html="applyTooltips(section.content)"` dengan `class="leading-relaxed text-sm md:text-base max-w-2xl mx-auto"`.
- [x] **Implementasi fungsi `applyTooltips(text)`**: Fungsi Alpine.js ini menerima string teks dan menggunakan `this.glossary` array. Untuk setiap item glossary, lakukan regex replace `\bword\b` (case-insensitive) dengan markup tooltip Tailwind. Markup tooltip: `<span class="relative group cursor-pointer font-bold text-[#FFC107] underline decoration-dotted">${word}<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1A237E] text-white text-xs font-normal p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-relaxed pointer-events-none">${definition}</span></span>`. Urutkan glossary dari kata terpanjang ke terpendek sebelum replace untuk mencegah partial replacement.
- [x] **Tombol Speaker 🔊 per sub-bab**: Di header setiap kartu section, tambahkan tombol speaker. Saat diklik, panggil `speakSection(idx)`. Fungsi ini: (1) strip HTML tags dari `content` menggunakan regex `/<[^>]*>/g`, (2) buat `SpeechSynthesisUtterance` dengan `lang = 'id-ID'`, (3) implementasi toggle Pause/Resume, (4) saat berpindah section atau menutup viewer, auto-cancel dengan `window.speechSynthesis.cancel()`. State: `speakingIdx: null` dan `isPaused: false`.
- [x] **Tombol "Bacakan Semua" 🔊**: Di header viewer, tombol yang membacakan semua section berurutan menggunakan antrian (looping melalui sections, panggil `speakSection` secara sekuensial melalui `onend` event).
- [x] **Slot Kuis di akhir materi**: Di bawah section terakhir, tambahkan blok: fetch `questions` dari data proyek yang sudah di-load. Jika `questions.length > 0`, render kuis interaktif. **Reuse pola quiz engine dari preview modal di `PakarDashboard.tsx` atau `KetuaTimDashboard.tsx`** — jangan duplikasi kode. Kuis ini berfungsi sebagai syarat kelulusan materi.
- [x] **Scroll & Timer tracking**: Pertahankan logic Intersection Observer dan timer yang sudah ada untuk tracking progress. Untuk tipe MANUAL, target "Akhir Dokumen" ditempatkan setelah section terakhir (identik dengan TEKS).

---

### F. KETUA TIM DASHBOARD (`src/views/components/KetuaTimDashboard.tsx`)

- [x] Di dropdown Jenis Materi di form modal (sekitar baris 589-592), tambahkan: `<option value="MANUAL">Materi Teks Manual (Sub-Bab + Glosarium)</option>`. Opsi ini akan membuat proyek dengan `materiType = 'MANUAL'`.
- [x] Di filter tab MATERI (sekitar baris 338-342), tambahkan tombol filter: `<button @click="filterType = 'MANUAL'">MANUAL</button>`.

---

### G. PAKAR DASHBOARD (`src/views/components/PakarDashboard.tsx`)

- [x] Di preview modal (sekitar baris 423-441), tambahkan blok `x-if="activeProject?.materiType === 'MANUAL'"`: fetch dan render sections sebagai daftar teks terstruktur sederhana (tanpa tooltip, cukup heading + paragraf) agar Pakar bisa membaca konten untuk review.

---

### H. SECURITY & RBAC

- [x] Sanitasi semua input text dari routes baru: escape HTML entities sebelum simpan ke DB.
- [x] Validasi otorisasi ketat: hanya `PEMBUAT_MATERI` dengan `project.idPembuat === user.id` yang bisa akses routes sections/glossary.
- [x] Validasi status proyek: reject save jika status bukan DRAFT/REVISI_PAKAR/REVISI_KETUA.
- [x] Validasi panjang field: `word` max 255, `definition` max 2000, `subTitle` max 255, `content` max 50.000 karakter. Return 400 jika melebihi.

---

### I. CLEAN CODE & DRY

- [x] Reuse komponen `ProjectHeader` — jangan duplikasi HTML header proyek.
- [x] Reuse fungsi `getUserName(id)` dan `isReadOnly()` yang sudah ada di `PembuatMateriDashboard`.
- [x] Extractkan fungsi `applyTooltips()` sebagai method Alpine.js yang dapat dipanggil ulang di viewer publik maupun preview modal.
- [x] Reuse pattern quiz engine yang sudah ada — jangan tulis ulang logic quiz dari nol.

---

### J. ANTI-REGRESSION CHECKLIST

- [x] `Navbar.tsx` — **DILARANG dimodifikasi**.
- [x] `src/routes/auth.ts` — **DILARANG dimodifikasi**.
- [x] `src/db/db.ts` dan `drizzle.config.ts` — **DILARANG dimodifikasi**.
- [x] Semua game editor dan player (Quiz, FTB, Word Search, Crossword) — **DILARANG terganggu**.
- [x] Tabel `materiContents` — **DILARANG dihapus**. Proyek lama `materiType: 'TEKS'` dan `'VIDEO'` harus tetap bisa dibuka dan dirender dengan viewer lama.
- [x] Route `GET/POST /api/projects` untuk semua tipe GAME harus tetap berfungsi identik.
- [x] Smart routing (`REVISI_KETUA` → bypass Pakar) yang sudah ada di `POST /:id/review` harus tetap berjalan untuk semua tipe.
