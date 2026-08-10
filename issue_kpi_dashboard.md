## Checklist Kerja Low Agent

### A. Tech Stack Consistency
- [x] Pastikan pengembangan API menggunakan framework **Bun** dan **ElysiaJS**.
- [x] Gunakan **Drizzle ORM** dan MySQL untuk mengeksekusi semua query agregasi statistik.
- [x] Implementasikan styling komponen dashboard secara disiplin menggunakan utility class **Tailwind CSS**.
- [x] Integrasikan library visualisasi data (seperti **Chart.js** atau **ApexCharts**) untuk merender Spider Chart dan Funnel Chart.

### B. Database Schema & Integrity
- [x] **DILARANG KERAS** melakukan refactoring atau mengubah nama role `pembuat_soal` menjadi nama lain pada tabel dan skema database. Pertahankan 4 role resmi (`ketua_tim`, `pakar`, `pembuat_materi`, `pembuat_soal`) agar fitur kuis yang sudah berjalan tidak *break*.
- [x] Rancang query untuk menghitung **Total Proyek Berjalan** yang mengkombinasikan tugas aktif (status di luar PUBLISHED) dari _user_ dengan role `pembuat_materi` dan `pembuat_soal`.
- [x] Rancang query untuk **Log Revisi Kritis**, yaitu menghitung status catatan *review* dari Pakar yang belum direspons oleh pembuat materi/soal.

### C. UI/UX Skill Memory Protocol (V3.0)
- [x] **Struktur & Aksesibilitas UI**: JANGAN menambah sub-menu atau anak menu baru di sidebar. Fitur KPI ini harus langsung tampil di area konten utama sebelah kanan ketika menu "DASHBOARD" utama diklik.
- [x] **Latar & Aksen**: Gunakan skema Deep Navy (`#1A237E`) pada elemen dasar, dan aksen warna Electric Gold (`#FFC107`) serta Vibrant Orange untuk menonjolkan bagian KPI Cards dan grafik interaktif.
- [x] **Tipografi & Fluid Grid**: Implementasikan *Montserrat/Poppins* (Header) dan *Inter/Roboto* (Body). Jangan gunakan ukuran teks statis; pakai class responsif Tailwind (`text-sm md:text-base lg:text-lg`).
- [x] **Layouting Top Row (KPI Cards)**: Rancang grid responsif (Flexbox/Grid) untuk menampilkan 4 metrik: Total Proyek Berjalan, Log Revisi Kritis, Total Pengguna (target statis 1.000 atau dinamis), dan Live User Online.
- [x] **Layouting Middle Row (Charts)**:
      - Tampilkan **Spider Chart 5-Sumbu**: memetakan *Content Velocity*, *Expert Responsiveness*, *User Engagement*, *Passing Rate*, dan *Category Coverage*.
      - Bersanding dengan **Funnel Chart**: memetakan laju konversi alur (Membuka Materi -> Lolos Scroll Tracker -> Mencoba Kuis -> Klaim Achievement).
- [x] **Layouting Bottom Row (Heatmap)**: Rancang visualisasi *Heatmap* mingguan pengguna ala model grid kontribusi GitHub untuk memantau intensitas aktivitas.

### D. Security & Functionality Workflow
- [x] **Validasi Akses Berbasis Role (RBAC)**: Kunci secara penuh halaman DASHBOARD KPI dan endpoint API-nya **KHUSUS** untuk role `ketua_tim`. User dengan role lain tidak boleh melihat atau mengakses data ini.
- [x] **API Agregasi Terpusat**: Rancang **satu** endpoint terpusat di ElysiaJS, yaitu `GET /api/dashboard/kpi-summary`. Endpoint ini harus bertugas mengumpulkan seluruh metrik statistik dari keempat role dan mengembalikannya dalam satu response JSON untuk merender KPI, Spider Chart, Funnel, dan Heatmap sekaligus.

### E. Clean Code Standards
- [x] Implementasikan prinsip DRY. Buat komponen UI terpisah dan *reusable* (misalnya: `KpiCard.tsx`, `SpiderChart.tsx`) agar antarmuka modular.
- [x] Pisahkan logika *query builder* Drizzle ORM yang panjang dan kompleks ke dalam fungsi *service* terpisah dari router ElysiaJS.

### F. Anti-Regression & Stability
- [x] Pastikan stabilitas komponen inti: Dilarang memodifikasi secara destruktif file `Navbar.tsx` dan `Sidebar.tsx`.
- [x] Perhatikan performa: Karena endpoint agregasi melakukan banyak kalkulasi lintas tabel, pertimbangkan optimasi *query* agar tidak memberatkan _database_ saat dashboard dimuat.

---

## ✅ Ringkasan Implementasi (Low Agent Final Report)

**File Baru:**
- `src/services/dashboardService.ts` — Service layer query agregasi KPI (12 query MySQL)
- `src/routes/dashboard.ts` — Route handler `GET /api/dashboard/kpi-summary` dengan RBAC guard `KETUA_TIM`

**File Dimodifikasi:**
- `src/index.tsx` — Register `dashboardRoutes`
- `src/views/components/KetuaTimDashboard.tsx` — Tambah KPI section lengkap (4 KPI Cards, Spider Chart, Funnel Chart, Heatmap) + Alpine.js `kpiDashboard` component + Chart.js 4.4.0 CDN

**Validasi:** Server berjalan OK, TypeScript clean (zero errors di `src/`), tidak ada perubahan pada `Navbar.tsx`, `Sidebar.tsx`, skema DB, atau sistem RBAC.
