# Implementasi Onboarding Minat User & Pembaruan Halaman Profil

**Role**: Senior UX Engineer & Fullstack Developer
**Task**: Implementasikan sistem Onboarding Minat User dan pembaruan Halaman Profil sesuai identitas visual Logos Lab.

---

### 1. Pembaruan Skema Database (Drizzle ORM)
Tambahkan kolom baru pada tabel `users` untuk melacak status onboarding dan preferensi user:
- **hasOnboarded**: `boolean` (default: `false`).
- **interests**: `text` atau `json` (untuk menyimpan pilihan kategori minat).

### 2. Spesifikasi Komponen Modal Onboarding
Modal interaktif yang muncul otomatis pada Landing Page jika user login dengan status `hasOnboarded = false`.
- **Konten**: Pilihan 5 kategori (Biblical Knowledge, Eksegesis & Hermeneutik, Biblical Theory, Homiletika, Apologetika).
- **Fitur**: Mendukung multi-select dengan feedback visual saat dipilih.
- **Behavior**: Tombol simpan akan mengupdate database dan menutup modal secara permanen bagi user tersebut.

### 3. Halaman Profil Baru (`/profile`)
Merombak halaman `/profile/edit` menjadi halaman `/profile` yang lebih komprehensif.
- **Visual**: Latar belakang **Soft Grey (#F5F5F5)** dengan container **Pure White**.
- **Fitur Role USER**: 
    - **Bagian 1**: Edit Nama & Foto Profil (Gunakan frame "Shield of Knowledge" untuk estetika).
    - **Bagian 2**: Edit Minat (Checkbox/Toggle 5 kategori minat).
- **Fitur Role Lain**: Hanya menampilkan Bagian 1 (Manajemen identitas dasar).

### 4. Section "Games Untuk Mu" (Khusus Role USER)
Penambahan section carousel dinamis di antara Hero Section dan Games Populer.
- **Logic**: Menampilkan daftar game yang kategorinya cocok dengan data di kolom `interests` user.
- **Visual**: Aksen **Vibrant Orange (#FF5722)** pada border atau shadow carousel untuk memberikan kesan personalisasi yang eksklusif.

---

### Skema Routing (High Level - ElysiaJS)
```typescript
// Profile Management & Onboarding
app.group("/profile", (app) => 
  app.onBeforeHandle(authMiddleware)
     .get("/", renderProfilePageView)      // Halaman profil baru
     .post("/update", handleProfileUpdate) // Update identitas
     .post("/onboarding", handleOnboarding) // Submit minat pertama kali
);
```

### Checklist Pengerjaan
- [ ] **Migrasi DB**: Tambah kolom `has_onboarded` dan `interests` di tabel users.
- [ ] **Onboarding Modal**: Implementasi pop-up modal interaktif di Landing Page.
- [ ] **Profile View Update**: Buat layout `/profile` dengan conditional rendering (USER vs Lainnya).
- [ ] **Personalized Carousel**: Implementasi section "Games Untuk Mu" dengan logic filtering minat.
- [ ] **UI Refinement**: Implementasi frame "Shield of Knowledge" dan skema warna Soft Grey.
