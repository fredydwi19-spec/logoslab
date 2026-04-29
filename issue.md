# Landing Page — Logos LAB

> **Role**: Senior Fullstack Developer & UI Engineer
> **Stack**: Bun · ElysiaJS · Drizzle ORM · MySQL · HTML/CSS/JS
> **Tujuan**: Membangun Landing Page "Logos LAB" yang disajikan via ElysiaJS static file serving.

---

## Konteks Proyek

Proyek **Logos LAB** sudah memiliki backend API (ElysiaJS + Drizzle ORM + MySQL) yang berjalan di port 3000. Plugin `@elysiajs/static` sudah terinstall. Sekarang perlu ditambahkan Landing Page sebagai halaman utama (`/`) yang menampilkan informasi produk, game carousel, materi pembelajaran, dan live counter.

### Teknologi Frontend

- **Pure HTML, CSS, dan Vanilla JS** — tidak perlu framework frontend.
- File statis disajikan menggunakan `@elysiajs/static` dari folder `public/`.
- Data dinamis (user count) diambil via fetch ke endpoint API internal.

---

## Phase 1: Setup Static File Serving

- [ ] Buat folder `public/` di root project
- [ ] Buat sub-folder: `public/css/`, `public/js/`, `public/assets/`
- [ ] Konfigurasi `@elysiajs/static` di `src/index.ts` agar serve folder `public/`
- [ ] Buat route `GET /` yang mengembalikan file `public/index.html`
- [ ] Pastikan static assets (CSS, JS, gambar) bisa diakses via URL

---

## Phase 2: Struktur HTML (`public/index.html`)

Buat satu file HTML utama yang terdiri dari 5 section:

### 2.1 — Header (Navbar)

- [ ] Logo di kiri dengan teks **"Logos LAB"**
- [ ] Menu navigasi di kanan berisi link **"Login"**
- [ ] Sticky/fixed di atas saat scroll

### 2.2 — Hero Section

- [ ] Judul besar: **"Edukasi Alkitab dan Berpikir Kritis"**
- [ ] Paragraf deskripsi singkat tentang visi Logos LAB
- [ ] Tombol CTA: **"Mulai Menjelajah"** (bisa scroll ke section berikutnya atau link ke halaman lain)
- [ ] Background yang menarik (gradient, gambar, atau pattern)

### 2.3 — Section Games Carousel

- [ ] Heading: **"Games Populer"** (atau sejenisnya)
- [ ] Kontainer horizontal slider/carousel berisi thumbnail game
- [ ] Setiap thumbnail berisi gambar + judul game
- [ ] Gunakan placeholder image untuk 4-6 item game
- [ ] Navigasi carousel: tombol panah kiri/kanan atau swipe
- [ ] Implementasi scroll behavior via Vanilla JS

### 2.4 — Section Materi Pembelajaran

- [ ] Heading: **"Materi Pembelajaran"**
- [ ] Grid/list card berisi thumbnail materi
- [ ] Setiap card adalah thumbnail statis dengan dua varian:

  **Tipe PDF:**
  - Thumbnail/cover image
  - Icon kaca pembesar (search icon) di atas thumbnail
  - Button **"Baca"**

  **Tipe Video:**
  - Thumbnail/cover image
  - Play button overlay di tengah thumbnail
  - Button **"Tonton Video"**

- [ ] Gunakan minimal 4 item dummy (2 PDF + 2 Video)

### 2.5 — Footer

- [ ] Teks copyright: **"© 2026 FDS"**
- [ ] Tagline Logos LAB
- [ ] **Live Counter** yang menampilkan:
  - Jumlah user terdaftar — diambil dari endpoint `GET /users` (ambil `count` dari response)
  - Jumlah kunjungan — gunakan variabel dummy (hardcoded atau dari `localStorage`)

---

## Phase 3: Styling (`public/css/style.css`)

- [ ] Design modern & clean (dark mode atau light mode, pilih salah satu yang cocok)
- [ ] Responsive layout — mobile-first, breakpoint untuk tablet dan desktop
- [ ] Smooth scroll antar section
- [ ] Hover effects pada tombol dan card
- [ ] Carousel styling (overflow hidden, snap scroll)
- [ ] Typography yang rapi dan konsisten
- [ ] Animasi ringan (fade-in saat scroll, hover transitions)

---

## Phase 4: JavaScript (`public/js/main.js`)

- [ ] **Carousel logic**: scroll horizontal, tombol next/prev, auto-scroll opsional
- [ ] **Live counter**: `fetch('/users')` → ambil `count` → tampilkan di footer
- [ ] **Variabel kunjungan dummy**: buat angka random atau increment dari `localStorage`
- [ ] **Smooth scroll**: CTA button dan navigasi internal

---

## Phase 5: API Endpoint Tambahan (Opsional)

Jika dibutuhkan endpoint khusus untuk landing page:

- [ ] `GET /api/stats` — return `{ userCount: number, visitCount: number }` 
  - `userCount` query dari DB (`SELECT COUNT(*) FROM users`)
  - `visitCount` bisa dari variabel in-memory (dummy)

---

## Struktur Folder Akhir

```
├── public/
│   ├── index.html            # Landing page utama
│   ├── css/
│   │   └── style.css         # Semua styling
│   ├── js/
│   │   └── main.js           # Carousel, counter, interaksi
│   └── assets/
│       ├── logo.png           # Logo Logos LAB
│       └── games/             # Thumbnail game placeholder
│           ├── game1.png
│           └── ...
├── src/
│   ├── index.ts              # Entry point — tambah static serving + route "/"
│   ├── db/
│   │   ├── db.ts
│   │   └── schema.ts
│   └── routes/
│       └── users.ts
└── ...
```

---

## Checklist Akhir

- [ ] Akses `http://localhost:3000/` → tampil Landing Page
- [ ] Semua section tampil dengan benar (Header, Hero, Games, Materi, Footer)
- [ ] Carousel bisa di-scroll atau diklik panah
- [ ] Card materi menampilkan icon yang sesuai (PDF vs Video)
- [ ] Live counter di footer menampilkan angka user dari DB
- [ ] Responsive di mobile dan desktop
- [ ] Tidak ada error di console browser
