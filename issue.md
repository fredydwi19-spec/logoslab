# Autentikasi Terpadu & Dashboard Profesional (Role-Based)

> **Role**: Lead Fullstack Architect & Security Engineer
> **Objective**: Membangun sistem autentikasi terpadu (Manual & Google OAuth) yang terhubung langsung dengan Dashboard Profesional sesuai Role User.

---

## 1. Database Schema Update (Drizzle)

### Update Tabel `users`
Tambahkan kolom baru untuk mendukung autentikasi dan profil lengkap:
- [ ] `password` — varchar/string (hashed)
- [ ] `google_id` — varchar/string (opsional, untuk OAuth)
- [ ] `role` — Enum: `KETUA_TIM`, `PEMBUAT_GAME`, `PEMBUAT_MATERI`, `PAKAR`, `USER`
- [ ] `username` — varchar/string
- [ ] `profile_picture` — varchar/string (URL gambar)

### Buat Tabel Baru `projects`
Tabel untuk mengelola proyek (materi/game) di dashboard:
- [ ] `id` — primary key, auto increment/uuid
- [ ] `title` — varchar/string
- [ ] `type` — Enum: `GAME`, `MATERI`
- [ ] `status` — Enum: `DRAFT`, `REVIEW`, `ACCEPTED`, `PUBLISHED`
- [ ] `id_pembuat` — FK (Foreign Key) ke tabel `users`
- [ ] `id_pakar` — FK (Foreign Key) ke tabel `users`

**Tugas Migrasi:**
- [ ] Update `src/db/schema.ts` sesuai dengan spesifikasi di atas.
- [ ] Jalankan `bun run db:generate` untuk membuat file migrasi.
- [ ] Jalankan `bun run db:migrate` untuk apply perubahan ke database MySQL.

---

## 2. Sistem Autentikasi & Rute

### Endpoint Login
- [ ] **Login Manual**: Buat endpoint `POST /api/auth/login` yang menerima username/email dan password, validasi hash, dan set cookie/token sesi.
- [ ] **Google OAuth**: Integrasikan login dengan Google (menggunakan library OAuth) dan simpan `google_id`. Jika user baru, buat data otomatis.

### Post-Login Redirect Logic
Setelah proses autentikasi sukses, cek nilai kolom `role` dari user yang login dan arahkan secara dinamis:
- [ ] `KETUA_TIM` ➔ Redirect ke `/dashboard/ketua`
- [ ] `PEMBUAT_GAME` ➔ Redirect ke `/dashboard/game`
- [ ] `PEMBUAT_MATERI` ➔ Redirect ke `/dashboard/materi`
- [ ] `PAKAR` ➔ Redirect ke `/dashboard/pakar`
- [ ] `USER` ➔ Redirect ke `/dashboard/member` (atau arahkan kembali ke Landing Page).

### Middleware & Keamanan Rute
- [ ] Buat plugin Elysia (middleware) untuk mengecek validitas token sesi.
- [ ] Lindungi prefix rute `/dashboard/*` agar hanya bisa diakses oleh user yang sudah login dan rolenya sesuai (Role-Based Access Control / RBAC).

---

## 3. UI Dashboard Profesional (Style: TailAdmin)

Gunakan **@elysiajs/html** untuk me-render HTML dari server dan **Tailwind CSS** untuk styling antarmuka. 

### Struktur Layout
- [ ] Pisahkan arsitektur tampilan ke dalam komponen-komponen yang dapat digunakan ulang (reusable components).
- [ ] Buat **Satu Komponen Base Sidebar** yang isinya dirender dinamis (conditional rendering) tergantung `role` yang dikirimkan oleh backend.

### Elemen Sidebar
- [ ] **Sidebar Brand**: Ganti teks logo biasa menjadi:
  - Baris 1: **[Username]** (Teks Bold)
  - Baris 2: **[Role Name]** (Teks Muted/Lebih kecil)

### Dinamika Menu Berdasarkan Role
- [ ] **Semua Role**: Memiliki akses ke menu **"Edit Profile"** (Berisi form untuk mengubah Username dan Foto Profil).
- [ ] **KETUA_TIM**:
  - Menu "Semua Proyek"
  - Menu "Proyek Game" (Dropdown: Draft, Review, Accept, Publish)
  - Menu "Proyek Materi" (Dropdown: Draft, Review, Accept, Publish)
- [ ] **PEMBUAT_GAME**:
  - Menu "Proyek Saya" (Hanya menampilkan daftar proyek bertipe `GAME` yang di-assign padanya).
- [ ] **PEMBUAT_MATERI**:
  - Menu "Proyek Saya" (Hanya menampilkan daftar proyek bertipe `MATERI` - Teks/Video).
- [ ] **PAKAR**:
  - Menu "Proyek Saya" (Menampilkan daftar proyek Game atau Materi yang sedang menunggu proses validasi atau review).

---

## 4. Checklist Teknis Implementasi

1. [ ] Update skema Drizzle dan apply migrasi ke database.
2. [ ] Install dan konfigurasi Tailwind CSS serta plugin pendukung (jika belum ada).
3. [ ] Konfigurasi `@elysiajs/html` sebagai renderer template HTML.
4. [ ] Implementasikan endpoint Authentication (Manual & OAuth).
5. [ ] Implementasikan session management (JWT / Cookie).
6. [ ] Buat Middleware proteksi rute RBAC (Role-Based Access Control).
7. [ ] Buat struktur komponen Base HTML (Sidebar, Header, Content).
8. [ ] Implementasikan logika render dinamis pada Sidebar sesuai role.
9. [ ] Siapkan halaman Dashboard dummy untuk tiap-tiap role.
10. [ ] Lakukan testing flow (Login ➔ Cek Role ➔ Redirect ➔ Render Sidebar Dinamis).

<br><br>

# Fitur Sign Up (Pendaftaran) & Verifikasi Email

> **Role**: Security & Backend Architect
> **Task**: Tambahkan fitur Sign Up (Pendaftaran) dan Verifikasi Email ke dalam sistem autentikasi.

---

## 1. Alur Pendaftaran (Sign Up)

- **Form UI**: Buat halaman pendaftaran dengan input: Nama Lengkap, Email, dan Password (tambahkan validasi konfirmasi password).
- **Logic Backend**:
  - Simpan data user baru ke tabel `users`.
  - Set default status `is_verified: false` (perlu tambahkan kolom `is_verified` bertipe boolean di skema Drizzle).
  - Set Role default saat mendaftar menjadi `USER`.
  - Gunakan `bcrypt` untuk melakukan proses hashing pada password sebelum disimpan ke database.

## 2. Sistem Konfirmasi Email (Security)

- **Email Provider**: Instal library pengirim email, misalnya `nodemailer` atau integrasikan penyedia layanan seperti Gmail SMTP / Resend API.
- **Verification Token**: 
  - Buat tabel baru bernama `verification_tokens` (berisi ID, Token String, ID User, Waktu Kedaluwarsa).
  - Setelah user klik daftar, generate token unik secara acak, lalu simpan ke dalam tabel tersebut.
- **Email Template**: Kirimkan email otomatis kepada user yang memuat link konfirmasi. (Contoh format: `http://localhost:3000/verify-email?token=...`).
- **Action Endpoint**: Buat endpoint untuk menangani link tersebut. Jika token valid dan belum kedaluwarsa, ubah status `is_verified` user menjadi `true` di database.

## 3. Keamanan Login & Rute (Login Security)

- Pastikan user yang mencoba login harus dicek status `is_verified`-nya.
- Jika `is_verified === false`, blokir akses login dan tampilkan pesan "Tolong cek email Anda untuk verifikasi" atau arahkan ke halaman peringatan.

## 4. Integrasi Dashboard

- Setelah verifikasi email sukses, arahkan user secara otomatis ke Dashboard Member (`/dashboard/member`) dan beri token sesi login (opsional) atau minta login ulang.

---

## 5. Checklist Setup & Migrasi

### Setup SMTP Email
- [ ] Daftar / siapkan akun SMTP (misalnya menggunakan akun Google App Password atau Resend API Key).
- [ ] Tambahkan kredensial SMTP ke file `.env` (misal: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- [ ] Setup fungsi pengirim email (mailer) terpusat pada file helper `src/utils/mailer.ts` menggunakan library seperti `nodemailer`.

### Migrasi Database (Tabel & Kolom Baru)
- [ ] **Tabel `users`**: Tambahkan kolom `is_verified` dengan tipe boolean dan nilai default `false`.
- [ ] **Tabel `verification_tokens`**: Buat tabel baru dengan kolom:
  - `id` (Primary Key)
  - `user_id` (Foreign Key ke tabel users)
  - `token` (String unik)
  - `expires_at` (Timestamp/Datetime kedaluwarsa)
- [ ] Jalankan perintah `bun run db:generate` untuk membuat file migrasi SQL.
- [ ] Jalankan perintah `bun run db:migrate` untuk menerapkan skema baru ke database MySQL.
