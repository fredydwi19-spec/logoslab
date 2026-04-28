# Refactor: Base Server ElysiaJS + Drizzle ORM + MySQL

> **Role**: Senior Backend Architect
> **Stack**: Bun · ElysiaJS · Drizzle ORM · MySQL
> **Database**: `logoslab` (sudah ada, sudah memiliki tabel `users`)

---

## Context & Current State

Project ini sudah memiliki scaffolding awal, namun perlu direfactor agar lebih robust dan production-ready. Berikut kondisi yang sudah ada:

| File | Status | Catatan |
|------|--------|---------|
| `src/index.ts` | ✅ Ada | Server Elysia di port 3000, tapi belum ada error handling |
| `src/db/index.ts` | ⚠️ Perlu refactor | Koneksi DB langsung `await` di top-level, tidak ada singleton pattern, tidak ada error handling |
| `src/db/schema.ts` | ⚠️ Perlu update | Schema `users` ada tapi kurang kolom `updated_at` |
| `src/routes/users.ts` | ⚠️ Perlu refactor | CRUD ada tapi import dari `../db` bukan `../db/db`, tidak ada error handling |
| `.env` | ✅ Ada | `DATABASE_URL=mysql://root:mysqldatabase@localhost:3306/logoslab` |

---

## Phase 1: Refactor Database Connection Layer

### 1.1 — Pindahkan koneksi ke `src/db/db.ts` (Singleton Pattern)

- [ ] Buat file baru `src/db/db.ts`
- [ ] Implementasi **singleton pattern** — koneksi hanya dibuat sekali dan di-reuse
- [ ] Gunakan `mysql2/promise` dengan `createPool()` (bukan `createConnection()`) agar lebih tahan terhadap koneksi putus
- [ ] Baca connection string dari `process.env.DATABASE_URL`
- [ ] Tambahkan **try-catch** saat inisialisasi koneksi:
  - Jika gagal, log error message yang jelas (termasuk host/port) lalu `process.exit(1)`
- [ ] Export `db` instance (Drizzle) dan optional export `pool` untuk keperluan health-check
- [ ] Hapus file lama `src/db/index.ts` setelah semua import sudah dipindah

### 1.2 — Update Schema (`src/db/schema.ts`)

- [ ] Tambahkan kolom `updated_at` dengan tipe `timestamp`, default `CURRENT_TIMESTAMP`, dan `ON UPDATE CURRENT_TIMESTAMP`
- [ ] Ubah panjang kolom `name` dari `varchar(255)` menjadi `varchar(100)` sesuai requirement
- [ ] Pastikan semua kolom yang di-export:
  - `id` — serial, auto increment, primary key
  - `name` — varchar(100), NOT NULL
  - `email` — varchar(255), NOT NULL, UNIQUE
  - `created_at` — timestamp, default NOW
  - `updated_at` — timestamp, default NOW, on update NOW
- [ ] Jalankan `bun run db:generate` untuk membuat migration file baru
- [ ] Jalankan `bun run db:migrate` untuk apply perubahan ke database

---

## Phase 2: Setup Elysia Server

### 2.1 — Refactor `src/index.ts`

- [ ] Import `db` dari `./db/db` (bukan `./db`)
- [ ] Tambahkan **global error handler** menggunakan `.onError()` di Elysia:
  - Tangkap error database (koneksi putus, query gagal)
  - Return response JSON `{ error: string, status: number }` yang konsisten
- [ ] Tambahkan **health-check endpoint** `GET /health` yang:
  - Melakukan query sederhana ke DB (misal: `SELECT 1`)
  - Return `{ status: "ok", timestamp: ... }` jika berhasil
  - Return `{ status: "error", message: ... }` jika DB tidak bisa dijangkau
- [ ] Pastikan server tetap listen di port `3000`
- [ ] Log startup message yang mencantumkan port dan status koneksi DB

---

## Phase 3: API Endpoints (Users)

### 3.1 — Refactor `src/routes/users.ts`

- [ ] Update import path: ganti `../db` → `../db/db`
- [ ] **GET `/users`**
  - Query semua data dari tabel `users` menggunakan Drizzle
  - Bungkus dalam try-catch, return `500` jika query gagal
  - Response format: `{ data: User[], count: number }`
- [ ] **POST `/users`**
  - Input body: `{ name: string }` — hanya field `name` yang diterima (email opsional, hapus jika tidak diperlukan, atau buat opsional)
  - Validasi menggunakan `t.Object()` dari Elysia
  - Bungkus insert dalam try-catch:
    - Tangkap duplicate entry error (email unique constraint)
    - Return `409 Conflict` untuk duplicate
    - Return `500` untuk error lainnya
  - Response sukses: `{ data: { id, name, ... }, message: "User created" }`
- [ ] **Opsional** — Pertahankan endpoint yang sudah ada (`GET /:id`, `PUT /:id`, `DELETE /:id`) tapi tambahkan try-catch di masing-masing

---

## Phase 4: Validasi & Testing

### 4.1 — Manual Test dengan curl

Setelah semua perubahan selesai, jalankan server lalu test:

- [ ] **Start server**
  ```bash
  bun run dev
  ```

- [ ] **Test health-check**
  ```bash
  curl.exe http://127.0.0.1:3000/health
  ```
  Expected: `{ "status": "ok", "timestamp": "..." }`

- [ ] **Test GET /users** (harus return array, mungkin kosong)
  ```bash
  curl.exe http://127.0.0.1:3000/users
  ```
  Expected: `{ "data": [...], "count": 0 }`

- [ ] **Test POST /users** (tambah user baru)
  ```bash
  curl.exe -X POST http://127.0.0.1:3000/users -H "Content-Type: application/json" -d "{\"name\": \"Test User\"}"
  ```
  Expected: `{ "data": { "id": 1, "name": "Test User" }, "message": "User created" }`

- [ ] **Test GET /users** lagi (harus ada 1 data)
  ```bash
  curl.exe http://127.0.0.1:3000/users
  ```
  Expected: `{ "data": [{ "id": 1, "name": "Test User", ... }], "count": 1 }`

### 4.2 — Automated Test (Opsional)

- [ ] Buat file `src/__tests__/users.test.ts`
- [ ] Gunakan `bun:test` bawaan Bun
- [ ] Test minimal:
  ```typescript
  import { describe, it, expect } from "bun:test";

  const BASE_URL = "http://127.0.0.1:3000";

  describe("Users API", () => {
    it("GET /health should return ok", async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
    });

    it("GET /users should return array", async () => {
      const res = await fetch(`${BASE_URL}/users`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("POST /users should create user", async () => {
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bun Tester" }),
      });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.name).toBe("Bun Tester");
    });
  });
  ```
- [ ] Tambahkan script di `package.json`: `"test": "bun test"`
- [ ] Jalankan: `bun test` (pastikan server sudah berjalan di terminal lain)

---

## Phase 5: Cleanup

- [ ] Hapus `src/db/index.ts` (sudah diganti `src/db/db.ts`)
- [ ] Hapus file `prompt.txt`, `issue.md`, `bun.lock` dari tracking jika tidak diperlukan
- [ ] Pastikan `.env` ada di `.gitignore`
- [ ] Pastikan `node_modules/` ada di `.gitignore`
- [ ] Commit semua perubahan dan push

---

## Struktur Folder Akhir

```
├── src/
│   ├── index.ts              # Entry point — Elysia server, port 3000
│   ├── db/
│   │   ├── db.ts             # Singleton DB connection (pool + drizzle)
│   │   └── schema.ts         # Drizzle schema (users table)
│   ├── routes/
│   │   └── users.ts          # User CRUD endpoints
│   └── __tests__/
│       └── users.test.ts     # API integration tests (opsional)
├── drizzle/                  # Generated migration files
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── .env                      # (gitignored)
├── .env.example
└── .gitignore
```

---

## Error Handling Checklist

- [ ] Koneksi DB gagal saat startup → log error, `process.exit(1)`
- [ ] Query gagal saat runtime → return `500` dengan pesan error
- [ ] Duplicate entry (unique constraint) → return `409 Conflict`
- [ ] Invalid request body → return `400 Bad Request` (otomatis dari Elysia `t.Object()`)
- [ ] Route tidak ditemukan → return `404 Not Found` (default Elysia)
