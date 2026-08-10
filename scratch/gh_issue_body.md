## 🧠 Logos AI Assistant — Global Floating Chat Widget

> **Dokumen Perencanaan Strategis** | Dibuat oleh: High Agent Architect
> **Target Integrasi:** Semua halaman dashboard tim (Ketua Tim, Pembuat Game, Pakar)
> **File Utama:** `src/views/layouts/Layout.tsx` | `src/views/components/Sidebar.tsx`

---

## 📋 Ringkasan Temuan Arsitektural (Phase 1 Audit)

Berdasarkan eksplorasi codebase, ditemukan bahwa:
- **Single Layout Entry Point:** Semua halaman dashboard — Ketua Tim, Pembuat Game, dan Pakar — dirender melalui satu komponen tunggal: `src/views/layouts/Layout.tsx`.
- **Sidebar Statis:** `Sidebar.tsx` merender menu berdasarkan prop `role` yang dikirim dari `index.tsx` route handler `/dashboard/:role`.
- **Menu Navigation:** Sidebar saat ini menggunakan `<a href="...">` biasa (full-page reload) — bukan client-side navigation. Ini menjadi **peluang kritis**: riwayat chat AI aman dari reset karena setiap navigasi memang full page load, sehingga solusi persistensi harus menggunakan `sessionStorage` / `localStorage`.
- **Alpine.js** sudah ter-load global melalui CDN di `Layout.tsx` — dapat dimanfaatkan langsung untuk state manajemen widget chat.
- **z-index Landscape:** Modal-modal yang ada (Preview, Create/Edit) menggunakan `z-[50]` hingga `z-[100]`. Widget chat harus menggunakan `z-[200]` agar tidak tertutup.
- **Tidak ada AI route** yang tersedia. Backend endpoint `/api/ai/chat` perlu dibuat baru.
- **DB Schema:** Tidak diperlukan tabel baru untuk MVP. Feedback AI (jempol) cukup disimpan secara client-side pada tahap awal.

---

## 🛠️ Tech Stack (Wajib Dipatuhi)

| Layer | Teknologi |
|---|---|
| Runtime | Bun |
| Backend Framework | ElysiaJS |
| ORM | Drizzle ORM |
| Database | MySQL |
| Frontend State | Alpine.js (sudah tersedia global) |
| Styling | Tailwind CSS (via CDN, sudah tersedia) |
| AI Provider | Google Gemini API (via env variable) |

---

## ✅ Task Checklist untuk Low Agent

### 🔧 A. Backend — Buat AI Chat Endpoint

- [ ] **A1.** Buat file baru: `src/routes/ai.ts`
  - Ekspor `aiRoutes` sebagai Elysia instance dengan prefix `/api/ai`
  - Import dan gunakan `jwt` plugin dari `@elysiajs/jwt` (pola identik dengan `crossword.ts` dan `word_search.ts`)
  - Gunakan `.use(jwt({...}))` sebelum `.onBeforeHandle` untuk menghindari TypeScript error `Property 'jwt' does not exist`

- [ ] **A2.** Implementasikan POST route `/api/ai/chat`:
  - **Body params:** `message: string`, `context: string`
  - `context` berisi string yang mendeskripsikan halaman aktif user (contoh: `'Daftar Proyek — Ketua Tim Dashboard'`)
  - Validasi bahwa `message` tidak kosong dan panjang maksimum 1000 karakter (sanitasi input)
  - Hubungi AI provider melalui HTTP fetch ke Gemini API menggunakan `GEMINI_API_KEY` dari `process.env`
  - **System prompt** yang dikirim ke AI WAJIB mencakup konteks: _"Kamu adalah Logos AI Assistant, asisten cerdas untuk platform Logos LAB — platform pembelajaran Alkitab interaktif. Saat ini user berada di halaman: {context}. Bantu user dengan pertanyaan yang relevan."_
  - Return: `{ success: boolean, reply: string }`
  - Tambahkan error handling jika API key tidak ada atau AI provider gagal merespons

- [ ] **A3.** Daftarkan `aiRoutes` di `src/index.tsx`:
  - Import `aiRoutes` dari `./routes/ai`
  - Tambahkan `.use(aiRoutes)` setelah `.use(crosswordRoutes)`

---

### 🎨 B. Frontend — Buat Komponen `FloatingChatWidget.tsx`

- [ ] **B1.** Buat file baru: `src/views/components/FloatingChatWidget.tsx`
  - Ekspor fungsi `FloatingChatWidget({ role, currentPage }: { role: string, currentPage: string })`
  - Return value adalah string HTML (pola identik dengan komponen lain seperti `Sidebar.tsx`)

- [ ] **B2.** Struktur HTML Widget (Posisi & Z-index):
  - Container utama: `position: fixed; bottom: 2rem; right: 2rem; z-index: 200;` — gunakan Tailwind class `fixed bottom-8 right-8 z-[200]`
  - Widget terdiri dari 2 state yang dikelola Alpine.js: **collapsed** (hanya tombol bulat) dan **expanded** (panel chat penuh)

- [ ] **B3.** Desain Tombol Toggle (Collapsed State):
  - Tombol bulat berdiameter 64px dengan background `#FF5722` (Vibrant Orange)
  - Ikon: SVG chat bubble
  - Efek hover: `scale-110` dan `shadow-2xl`
  - Badge notifikasi animasi pulse berwarna `#FFC107` jika ada pesan belum dibaca

- [ ] **B4.** Desain Panel Chat (Expanded State):
  - **Dimensi:** lebar 380px, tinggi 520px, `border-radius: 1.5rem`
  - **Header Panel:** Background `#1A237E` (Deep Navy), teks putih. Tampilkan logo Logos LAB (`/public/assets/logo-logoslab.png`) di sisi kiri, judul "Logos AI Assistant", dan tombol close (×) di kanan
  - **Sub-header:** Satu baris teks kecil berwarna `#FFC107` yang menampilkan halaman aktif: `"📍 {currentPage}"` — ini adalah implementasi **Context-Aware Assistance**
  - **Area Percakapan:** Scrollable, background `#F8FAFC`. Bubble pesan user rata kanan (background `#1A237E`, teks putih). Bubble pesan AI rata kiri (background putih, border `#E2E8F0`)
  - **Feedback Row ("Was this helpful?"):** Di bawah setiap bubble respons AI, tampilkan dua tombol ikon: 👍 dan 👎. Saat diklik, berikan visual feedback (tombol berubah warna menjadi `#FFC107` untuk 👍 dan `#FF5722` untuk 👎) dan simpan ke state Alpine agar tidak dapat diklik dua kali
  - **Input Area:** `<textarea>` dengan placeholder "Tanya sesuatu...", border `#1A237E` saat fokus. Tombol kirim berwarna `#FF5722`

- [ ] **B5.** Implementasikan Alpine.js Data Object untuk widget:
  - `isOpen: false` — state collapsed/expanded
  - `messages: []` — array objek `{ role: 'user'|'ai', text: string, id: number, feedback: null|'up'|'down' }`
  - `inputText: ''` — binding ke textarea
  - `isLoading: false` — tampilkan animasi "typing..." (tiga titik animasi) saat menunggu respons AI
  - `currentPage` — di-inject dari prop saat render server-side
  - Method `sendMessage()`: Ambil `inputText`, tambahkan ke `messages` sebagai pesan user, lakukan fetch ke `/api/ai/chat`, tampilkan respons sebagai bubble AI
  - Method `giveFeedback(messageId, type)`: Update properti `feedback` pada pesan di array `messages`
  - Method `saveToStorage()` dan `loadFromStorage()`: Gunakan `sessionStorage.setItem('logosai_chat', JSON.stringify(this.messages))` dan load saat `init()` — ini memastikan **riwayat chat tidak hilang** saat navigasi antar menu sidebar

---

### 🔌 C. Integrasi Global di Layout.tsx

- [ ] **C1.** Tambahkan import `FloatingChatWidget` di `src/views/layouts/Layout.tsx`:
  - `import { FloatingChatWidget } from '../components/FloatingChatWidget';`

- [ ] **C2.** Update signature fungsi `Layout`:
  - Tambahkan `currentPage?: string` ke parameter object. Default value: sama dengan `title`

- [ ] **C3.** Injeksikan widget hanya untuk role tim (bukan USER role):
  - Tambahkan kondisi: `const showChatWidget = role !== 'USER';`
  - Inject widget tepat sebelum tag penutup `</body>` agar tidak mengganggu flow dokumen

- [ ] **C4.** Update semua pemanggilan `Layout()` di `src/index.tsx`:
  - Saat render halaman dashboard, kirim `currentPage` yang bermakna berdasarkan konten aktif. Contoh: `currentPage: 'Manajemen Proyek — Ketua Tim'`

---

### ⚡ D. Performance — Lazy Loading

- [ ] **D1.** Implementasikan Lazy Loading untuk panel chat:
  - Gunakan atribut Alpine.js `x-show="isOpen"` (bukan `x-if`) pada panel chat agar DOM tetap ada namun tersembunyi — menghindari re-render berat
  - Tambahkan `x-transition` untuk animasi smooth saat buka/tutup: `x-transition:enter="transition ease-out duration-300"` dengan `translate-y-4` sebagai starting state
  - Fetch ke `/api/ai/chat` hanya dipanggil saat user menekan tombol kirim (event-driven), bukan saat load halaman

- [ ] **D2.** Pastikan script widget tidak memblokir render utama:
  - Semua JavaScript Alpine.js sudah di-load dengan `defer` di `Layout.tsx` — widget otomatis mengikuti pola ini dan tidak memerlukan perubahan tambahan

---

### 🛡️ E. Anti-Regression Checklist

- [ ] **E1. Sidebar Tidak Berubah:** Dilarang keras mengubah `Sidebar.tsx`. Widget hanya disuntikkan di `Layout.tsx` tepat sebelum `</body>`.
- [ ] **E2. z-index Aman:** Verifikasi bahwa `z-[200]` tidak bertabrakan dengan modal lain. Referensi z-index saat ini: Sidebar=`z-[100]`, Modal Preview=`z-[100]`, Create Modal=`z-50`, Header=`z-40`. Widget di `z-[200]` aman.
- [ ] **E3. Navbar Tidak Berubah:** Komponen `Navbar.tsx` (untuk landing page) tidak tersentuh sama sekali.
- [ ] **E4. RBAC Tidak Berubah:** Endpoint `/api/ai/chat` boleh diakses oleh semua role tim. Route auth dan RBAC middleware yang ada tidak perlu dimodifikasi.
- [ ] **E5. Database Config Tidak Berubah:** File `src/db/db.ts` dan `src/db/schema.ts` tidak perlu diubah untuk MVP fitur ini.
- [ ] **E6. Klik Sidebar Tetap Berfungsi:** Widget menggunakan `pointer-events: none` pada container saat collapsed agar tidak memblokir area klik di sekitarnya. Hanya tombol toggle yang `pointer-events: auto`.
- [ ] **E7. Test Manual Regresi:** Setelah implementasi, lakukan klik pada setiap item menu sidebar untuk memastikan navigasi halaman berfungsi normal.

---

### 🎨 F. UI/UX Consistency (Brand Guidelines)

| Elemen | Spesifikasi |
|---|---|
| Header Widget | Background `#1A237E` (Deep Navy) |
| Tombol Toggle | Background `#FF5722` (Vibrant Orange) |
| Aksen & Feedback Positif | `#FFC107` (Electric Gold) |
| Latar Percakapan | `#F8FAFC` (Soft Grey) |
| Font | Sudah inherit `Outfit` dari `Layout.tsx` |
| Logo Path | `/public/assets/logo-logoslab.png` |
| Responsivitas | Di mobile (< 640px), lebar panel menjadi `calc(100vw - 2rem)` maksimum |

---

## 🔒 Security & Clean Code Standards

- **Input Sanitasi:** Pada `/api/ai/chat`, strip tag HTML dari `message` sebelum dikirim ke AI provider
- **Rate Limiting Sederhana:** Jika `message` kosong atau > 1000 karakter, return error 400 tanpa memanggil API eksternal
- **API Key:** Gunakan `process.env.GEMINI_API_KEY` — JANGAN hardcode. Tambahkan key ini ke file `.env`
- **DRY Principle:** `FloatingChatWidget.tsx` harus berdiri sendiri sebagai komponen tunggal. Tidak boleh ada duplikasi logika chat di masing-masing Dashboard component
- **Modularitas:** Pisahkan fungsi helper AI (system prompt builder, response parser) ke dalam fungsi terpisah di dalam `ai.ts` agar mudah dirawat

---

## 📁 File yang Akan Dibuat/Dimodifikasi

| Status | File |
|---|---|
| 🆕 Baru | `src/routes/ai.ts` |
| 🆕 Baru | `src/views/components/FloatingChatWidget.tsx` |
| ✏️ Edit | `src/views/layouts/Layout.tsx` |
| ✏️ Edit | `src/index.tsx` |
| ✏️ Edit | `.env` (tambah `GEMINI_API_KEY`) |

---

## ⛔ Batasan Low Agent (EXECUTION BAN)

> Dokumen ini adalah **Logic Plan Only**. Low Agent DILARANG copy-paste blok kode ini langsung. Gunakan dokumen ini sebagai panduan teknis untuk menulis implementasi mandiri dengan sintaks yang tepat dan bersih.

---

*Rencana ini telah diaudit dan dinyatakan matang untuk dieksekusi. ✅ Siap diserahkan ke Low Agent.*
