# Strategic Planning: Fitur Game Quiz Logos LAB

## 1. Visual Guidelines & Assets
- **Primary Colors**: Deep Navy (`#1A237E`) dan Electric Gold (`#FFC107`).
- **Action Buttons**: Vibrant Orange (wajib untuk tombol aksi utama).
- **Typography**: Gunakan Montserrat/Poppins untuk Heading, dan Inter/Roboto untuk Body Text.
- **Logo Asset**: `C:\Users\fredy\GitHub\public\assets\Logo LogosLAB.png`

## 2. Security Blueprint & Vulnerability Identification
**Potensi Kerentanan pada Alur Transisi Status Proyek:**
1. **Broken Access Control**: Endpoint transisi status (`/projects/:id/review`) rentan dipanggil oleh role yang tidak berwenang (misal Pembuat Game memaksa perubahan status ke `ACCEPTED_PAKAR`).
2. **Race Conditions / Data Collision**: Saat fitur Hybrid Autosave menumpuk request sinkronisasi dengan manual save, memicu kerusakan data.
3. **Malicious File Upload (CSV/XLSX Injection)**: Payload XSS atau macro injection yang disisipkan di dalam file spreadsheet saat Import Soal.

**Security Checklist (Input Sanitization & Data Validation):**
- [x] Verifikasi JWT Token dan otorisasi Role secara ketat pada semua endpoint API (hanya `KETUA_TIM` / `PAKAR` yang berhak mengubah status review).
- [x] Validasi alur transisi *State Machine* (mencegah lompatan status yang tidak valid, misal: `DRAFT` langsung ke `PUBLISHED`).
- [x] Implementasi sanitasi input ketat untuk setiap cell yang di-parse dari file CSV/XLSX sebelum masuk ke staging validation.
- [x] Gunakan parameter binding Drizzle ORM untuk mencegah SQL Injection pada *bulk insert* Question Bank.
- [x] Cek *MIME Type* dan ekstensi secara ketat saat upload *import file*.

## 3. Module Breakdown & Execution Checklist (Low Agent)
- [ ] **Modul 1: Penugasan Proyek (Ketua Tim)**
  - [x] Update Drizzle Schema (`projects`, `questionBank`, `reviewsHistory`, `notifications`).
  - [x] Buat Pop-up Form Penugasan dengan Dropdown PIC (Pembuat Game).
  - [x] Integrasikan Hugging Face Inference API (`black-forest-labs/FLUX.1-schnell`) menggunakan `HF_TOKEN` dari `.env` untuk AI Thumbnail Generator.

- [ ] **Modul 2: Produksi Konten (Pembuat Game)**
  - [x] Implementasi UI Editor Soal menggunakan warna standar Logos LAB.
  - [x] Bangun sistem Hybrid Autosave (menyimpan ke LocalStorage secara instan, dan sync ke DB dengan debounce).
  - [x] Bangun fitur Import XLSX/CSV dengan UI *Staging Validation* sebelum disubmit ke Database.

- [ ] **Modul 3: Review & Revisi Berjenjang (Pakar & Ketua)**
  - [x] Buat Dashboard Review dengan filtering berdasarkan Tab status proyek.
  - [x] Buat endpoint API berjenjang untuk *accept/reject/revisi* status proyek.
  - [x] Implementasi pencatatan log `reviewsHistory`.

## 4. Preservation List (Anti-Regression)
Daftar komponen inti yang **TIDAK BOLEH** dirusak atau diubah secara drastis (hanya boleh diekstensi):
- [ ] `src/index.tsx` (Elysia main routing skeleton) - tidak boleh mengubah konfigurasi static/jwt existing.
- [ ] `src/views/layouts/Layout.tsx` (Struktur core Sidebar dan Header).
- [ ] Konfigurasi koneksi database di `src/db/db.ts`.
