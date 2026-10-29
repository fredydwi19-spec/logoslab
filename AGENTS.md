# Agent Instructions

## 01 Tujuan
File ini berisi aturan bagi AI coding agent (Claude Code, Cursor, Codex) yang bekerja di proyek ini. Ikuti di setiap sesi.

## 02 Sebelum Mulai
- Baca `docs/PRD.md` untuk memahami tujuan dan fitur.
- Baca `docs/DESIGN_SYSTEM.md` sebelum membuat atau mengubah tampilan.
- Baca `docs/ARCHITECTURE.md` sebelum membuat file baru atau menambah library.
- Lihat kode yang sudah ada sebelum membuat yang baru. Ikuti pola, penamaan, dan gaya kode di sekitarnya.

## 03 Tentang Pemilik Proyek
- Pemilik proyek baru memahami dasar-dasar pemrograman. Jelaskan dalam Bahasa Indonesia yang sederhana, tanpa istilah teknis yang tidak perlu.
- Setelah selesai, sebutkan file mana saja yang diubah dan cara mengecek hasilnya di browser.
- Kalau ada langkah yang harus dilakukan pemilik sendiri (unggah ke hosting, ubah pengaturan), tuliskan langkahnya satu per satu.

## 04 Aturan Umum
- Hanya kerjakan yang ada di PRD atau yang diminta. Tanyakan dulu sebelum menambah fitur.
- Pakai fitur bawaan framework (validasi, ORM/query builder, autentikasi, proteksi CSRF) daripada membuat sendiri.
- Ikuti design system. Jangan menambah warna, font, atau library ikon baru.
- Pakai ulang komponen/view yang sudah ada.
- Jangan membuat file yang tidak diperlukan.

## 05 Pedoman Kode
- Nama variabel, fungsi, dan file harus jelas maknanya.
- Tangani semua keadaan: sedang memuat, berhasil, gagal, dan data kosong.
- Semua halaman wajib responsif (bisa dipakai di HP).
- Perubahan struktur database lewat migration, bukan diubah langsung.
- Tampilkan `name` (nama tampilan) kepada pengguna, bukan `username`. `username` hanya dipakai untuk login (huruf kecil tanpa spasi). Tampilkan email asli dari database, jangan dikarang.
- Setiap pekerjaan yang selesai wajib dicatat di dokumen `docs/` yang relevan pada commit yang sama: fitur dan progres di `PRD.md`, struktur/keamanan di `ARCHITECTURE.md`, tampilan di `DESIGN_SYSTEM.md`, aturan kerja di file ini.

## 06 Keamanan (berdasarkan OWASP Top 10:2025)
- **Hak akses:** setiap halaman dan aksi wajib dicek di server, bukan hanya disembunyikan tombolnya. Pengguna tidak boleh melihat atau mengubah data milik unit/pengguna lain.
- **Injeksi:** jangan menyusun query SQL dengan menyambung teks dari input pengguna. Pakai Drizzle ORM atau template `sql` dari `drizzle-orm`.
- **XSS:** tampilan di `src/views/` disusun sebagai teks HTML (`${...}`) yang **tidak** di-escape otomatis. Setiap data dari pengguna (nama, judul, pesan, isi jurnal) wajib di-escape dulu sebelum dimasukkan ke HTML. Di React (branch `main`), JSX sudah meng-escape otomatis.
- **Login:** password wajib di-hash dengan `bcryptjs`, jangan pernah disimpan sebagai teks biasa. JWT disimpan di cookie `auth`.
- **Upload file:** batasi jenis dan ukuran file, ganti nama file, dan jangan izinkan file `.html`, `.js`, atau `.svg` terunggah ke `public/uploads/`.
- **Rahasia:** jangan menulis password, kunci API, atau token di kode. Simpan di `.env`.
- **Mode produksi:** pesan error detail dan mode debug wajib dimatikan di server produksi.
- **Library:** hanya pasang paket dari sumber resmi, dan tanyakan dulu sebelum menambah paket baru.

## 07 Tindakan yang Wajib Ditanyakan Dulu
- Menghapus file, tabel, kolom, atau data.
- Menjalankan migration yang menghapus atau mengubah kolom yang sudah berisi data.
- Mengubah file di server produksi, atau apa pun yang memengaruhi situs live.
- Menambah library, framework, atau layanan baru.
- Force push, menghapus branch, atau mengubah riwayat commit yang sudah ada di GitHub.

## 08 Perintah Penting
```
bun install                       # Pasang dependensi
bun run dev                       # Jalankan server lokal di http://localhost:3000 (otomatis restart saat file berubah)
bun run start                     # Jalankan server tanpa mode watch
bun run db:generate               # Buat file migrasi dari perubahan src/db/schema.ts
bun run db:migrate                # Terapkan migrasi ke database MySQL
bun run db:studio                 # Lihat isi database di browser
bun test                          # Jalankan tes
bunx tsc --noEmit                 # Cek error TypeScript
```

## 09 Kalau Ragu
- Cek folder `docs/` lebih dulu.
- Lihat bagaimana kode yang sudah ada menyelesaikan hal serupa.
- Tanyakan sebelum membuat perubahan besar. Jangan menebak.

## 10 Sistem Kerja Git
- Tidak memakai GitHub Issue, Pull Request, atau branch fitur. Semua pekerjaan langsung di branch `main`.
- Satu fitur atau perbaikan = satu commit. Setelah selesai dikerjakan dan dicek, langsung commit lalu push ke `main` di GitHub.
- Judul commit = judul fitur yang dikerjakan, dalam Bahasa Indonesia, singkat dan jelas. Contoh:
  - `Tambah fitur Quiz Duel`
  - `Perbaiki logo tidak muncul di dashboard Pakar`
  - `Ubah font dashboard ke Poppins dan Inter`
- Sebelum commit, pastikan `bunx tsc --noEmit` tidak menambah error baru dan halaman yang diubah sudah dicek di browser.
- Jangan ikut meng-commit file rahasia atau file bantu: `.env`, `public/uploads/`, skrip sementara (`fix_*.cjs`, `migrate_*.ts`, dll.). Semua sudah tercantum di `.gitignore`.
- Kalau fitur yang dikerjakan mengubah isi `docs/` (fitur baru, tabel baru, warna baru), perbarui dokumennya di commit yang sama.
- Versi GitHub sebelum disamakan dengan versi lokal (29 Okt 2026) disimpan di branch `arsip/main-agustus`. Jangan dihapus; isinya (React SPA, tagging soal, badge) bisa diambil kembali nanti.
