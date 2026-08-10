## Checklist Kerja Low Agent

### A. Tech Stack Consistency
- [ ] Pastikan seluruh pengembangan backend menggunakan **Bun** dan kerangka kerja **ElysiaJS**.
- [ ] Gunakan **Drizzle ORM** untuk mendefinisikan dan melakukan migrasi skema tabel-tabel baru.
- [ ] Konfigurasikan koneksi database dengan driver **MySQL** yang sudah tersedia di proyek.
- [ ] Seluruh styling form dan komponen antarmuka WAJIB menggunakan utility classes **Tailwind CSS**.

### B. Database Schema & Integrity
- [ ] Buat script/rencana migrasi aman menggunakan Drizzle untuk mengubah nilai/nama enum role `pembuat_soal` menjadi `pembuat_konten`.
- [ ] Rancang tabel `materials` berelasi dengan tabel proyek dan users, memuat field: `judul`, `deskripsi`, `jenis` (teks/video), `status`, `pic`, `deadline`, dan `thumbnail`.
- [ ] Rancang tabel `material_sections` berelasi dengan `materials` (Foreign Key ON DELETE CASCADE) dengan field: `sub_title`, `content` (long text), dan `sort_order`.
- [ ] Rancang tabel `material_glossary` berelasi dengan `materials` dengan field: `word` (kata yang di-highlight) dan `definition` (keterangan).
- [ ] Modifikasi skema tabel kuis lama dengan menambahkan kolom `game_type` berjenis enum (`multiple_choice`, `drag_drop`, `fill_blank`, `timeline`) untuk mendongkrak interaktivitas kuis.
- [ ] Periksa kembali integritas relasi antar entitas, hindari duplikasi data pada relasi one-to-many materi ke sub-bab dan kamus.

### C. UI/UX Skill Memory Protocol (V3.0)
- [ ] **Latar & Struktur**: Terapkan warna dasar Deep Navy (`#1A237E`) pada elemen struktural seperti wrapper atau panel utama konten materi.
- [ ] **Aksen & Interaksi**: Gunakan Electric Gold (`#FFC107`) sebagai aksen (highlight istilah sulit) dan Vibrant Orange untuk tombol seperti [+ Tambah Sub-Bab] dan submit.
- [ ] **Tipografi & Scaling**: Gunakan font *Montserrat/Poppins* untuk heading, dan *Inter/Roboto* untuk body text konten materi dengan `leading-relaxed` (line-height 1.5 - 1.6). Gunakan class responsif Tailwind (`text-sm md:text-base`) agar teks scaling sesuai viewport.
- [ ] **Form Input Dinamis**: Rancang antarmuka form bagi Pembuat Konten dengan tombol dinamis [+ Tambah Sub-Bab] yang memicu penambahan blok input baru (judul & textarea). Tambahkan pula tombol [+ Tambah Istilah Sulit] untuk melipatgandakan input berpasangan (Kata dan Definisi).
- [ ] **Layout Main Area Dashboard Ketua Tim**: Bangun grid responsif dengan palet biru-oranye. 
  - *Top Row*: KPI Cards (Proyek Berjalan, Log Revisi Kritis, Total Pengguna, Pengguna Online).
  - *Middle Row*: 5-Axis Spider Chart bersanding dengan Funnel Chart alur kelulusan.
  - *Bottom Row*: Heatmap Aktivitas Mingguan pengguna.
- [ ] Gunakan path logo aplikasi dengan benar bila diperlukan dalam komponen dashboard: `C:\Users\fredy\GitHub\public\assets\Logo LogosLAB.png`.

### D. Security & Functionality Workflow
- [ ] **Tooltip Otomatis (Frontend JS)**: Rancang fungsi JavaScript murni di sisi klien untuk melakukan pemindaian (string replacement) pada teks materi. Cocokkan kata dengan data dari tabel `material_glossary` dan ubah menjadi span HTML interaktif Tailwind (`relative group` dengan elemen keterangan `absolute hidden group-hover:block`).
- [ ] **Integrasi Audio Web Speech API**: Sematkan tombol speaker (🔊) di ujung sub-bab. Tambahkan logika JavaScript yang memanggil `window.speechSynthesis` dengan konfigurasi bahasa `lang = 'id-ID'` untuk membacakan konten sub-bab (menghemat resource server tanpa API TTS eksternal).
- [ ] **Mekanisme Checkpoint Kuis**: Letakkan komponen kuis interaktif di ujung sub-bab terakhir. Kuis harus tervalidasi lulus sebelum fitur *Smart Recognition* (scroll tracker) aktif untuk memicu event klaim *achievement* kelulusan materi.
- [ ] **Dashboard API**: Rancang endpoint ElysiaJS tunggal, `GET /api/dashboard/summary`, yang mengagregasikan semua query ke MySQL (KPI, data Spider Chart, Funnel, Heatmap) untuk menyuplai dashboard Ketua Tim.
- [ ] Terapkan validasi payload form (menggunakan T.Object dari Elysia) untuk mencegah injeksi berbahaya dari input konten panjang dan pastikan hanya user dengan role sesuai yang dapat menambah materi.

### E. Clean Code Standards
- [ ] Patuhi prinsip DRY. Komponen form dan grafik (Chart) wajib dibuat secara modular sehingga dapat digunakan berulang di halaman lain.
- [ ] Pisahkan logika view/template dengan logika route handler ElysiaJS agar *codebase* tetap bersih dan mudah dipelihara.

### F. Anti-Regression & Stability
- [ ] **DILARANG** mengubah fungsionalitas inti dari komponen Navbar, Sistem Role-Based Access Control (RBAC), dan konfigurasi Database.
- [ ] Pastikan alur kerja revisi yang melibatkan Pakar dan Ketua Tim pada tipe materi yang sudah ada tidak rusak. Smart routing harus tetap memperhitungkan transisi status (DRAFT -> REVIEW -> REVISI -> PUBLISHED).
