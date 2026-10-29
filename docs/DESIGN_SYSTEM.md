# Design System

> Diisi berdasarkan Brand Guidelines Logos LAB dan kode website per 29 Oktober 2026.
> Selalu tulis warna dalam kode hex. Bagi AI, "biru" bisa berarti seratus warna berbeda.

## 01 Identitas Visual
- **Kesan yang ingin ditampilkan:** profesional, modern, segar, kredibel, tidak kuno
- **Logo:**
  - Logo lengkap: `public/assets/Logo-LogosLAB.png` → dipanggil dengan `/public/assets/Logo-LogosLAB.png` (huruf besar/kecil harus sama persis)
  - Logo ikon: `public/assets/logo.png` → `/public/assets/logo.png`
- **Favicon:** file persegi (48×48, 96×96, 192×192 px) plus favicon.ico. Jangan memakai logo yang tidak persegi. Status: **belum ada**.

## 02 Palet Warna
| Nama | Hex | Dipakai untuk |
|------|-----|---------------|
| Primary | #1A237E | Header, sidebar, judul, elemen utama (Deep Navy) |
| Primary Dark | #121858 | Gradasi dan latar gelap |
| Accent | #FF5722 | Tombol utama (CTA), badge notifikasi (Vibrant Orange) |
| Accent Hover | #E64A19 | Tombol utama saat disorot |
| Highlight | #FFC107 | Penanda progres, garis aksen judul, ikon kuis (Electric Gold) |
| Background | #F5F5F5 | Latar halaman (Soft Grey) |
| Surface | #FFFFFF | Latar kartu dan form |
| Text | #1E293B | Teks utama |
| Muted | #64748B | Teks keterangan |
| Success | #16A34A | Status berhasil/terbit, jawaban benar |
| Warning | #FF5722 | Status perlu revisi |
| Error | #DC2626 | Pesan error, tombol hapus, jawaban salah |

## 03 Tipografi
- **Font judul:** Poppins (cadangan: Montserrat), dimuat dari Google Fonts
- **Font isi:** Inter (cadangan: Roboto, system-ui, sans-serif), dimuat dari Google Fonts
- **H1:** 30px, Bold (Poppins)
- **H2:** 24px, Semibold (Poppins)
- **H3:** 20px, Semibold (Poppins)
- **Isi teks:** 16px, Regular (Inter)
- **Keterangan kecil:** 14px, Regular (Inter). Label sangat kecil (10–12px) hanya untuk badge.
- Font dimuat di `src/views/layouts/Layout.tsx` (dashboard) dan `public/css/style.css` (halaman publik).

## 04 Jarak (Spacing)
Pakai kelipatan 4/8 px: 4, 8, 12, 16, 24, 32, 48, 64 (di Tailwind: `1, 2, 3, 4, 6, 8, 12, 16`).

## 05 Sudut Membulat (Border Radius)
- Input, badge: 8px (`rounded-lg`)
- Tombol: 12px (`rounded-xl`)
- Kartu, modal: 16px (`rounded-2xl`)
- Avatar: bulat penuh (`rounded-full`)

## 06 Komponen
- **Tombol utama:** latar Accent #FF5722, teks putih, radius tombol, hover #E64A19
- **Tombol sekunder:** latar putih, border 1px abu-abu, teks Primary
- **Tombol hapus:** latar Error, wajib ada konfirmasi sebelum menghapus
- **Input:** border 1px abu-abu, border Primary saat fokus, label di atas input, pesan error merah di bawah input
- **Tabel:** header tebal, baris bergaris tipis, bisa digeser ke samping di layar HP (`overflow-x-auto`). Di HP tampilkan petunjuk "Geser tabel ke samping →" di atas tabel (`md:hidden`). Badge di dalam tabel memakai `whitespace-nowrap` agar tidak terpecah dua baris.
- **Judul halaman dashboard:** teks Primary, huruf besar, dengan garis vertikal Highlight #FFC107 di kirinya
- **Badge status proyek:**
  - `DRAFT` = abu-abu
  - `REVIEW_PAKAR`, `REVIEW_KETUA` = biru
  - `REVISI_PAKAR`, `REVISI_KETUA` = Warning
  - `ACCEPTED_PAKAR` = Highlight (teks Primary)
  - `PUBLISHED` = Success
  - `UNPUBLISHED` = Error
  - ⚠️ Tabel Semua Proyek (`KetuaTimAllProjects.tsx`) masih memakai warna lain: DRAFT kuning, PUBLISHED abu-abu, ACCEPTED_PAKAR hijau. Perlu diseragamkan.
- **Grafik (Chart.js):** di layar di bawah 640px, label panjang dipecah per kata (array) dan ukuran huruf label 10px agar tidak terpotong di tepi grafik (contoh: spider chart di `KetuaTimDashboard.tsx`).
- **Modal dan panel samping:** harus berada di atas sidebar. Sidebar memakai `z-[100]`, jadi modal memakai `z-[150]` ke atas (contoh: form proyek `z-[150]`, Diskusi Proyek `z-[210]`/`z-[220]`).
- **Jawaban Logos AI:** format Markdown sederhana (tebal, miring, poin, judul) ditampilkan rapi; teks di-escape dulu sebelum diubah menjadi HTML.
- **Notifikasi:** pesan sukses/gagal muncul di atas halaman setelah menyimpan. Lonceng notifikasi di header dengan badge Accent.

## 07 Ikon
Bootstrap Icons (`<i class="bi bi-..."></i>`). Pakai itu saja; jangan memakai emoji sebagai ikon tombol atau menu.

## 08 Ukuran Layar (Breakpoints)
- HP: di bawah 640px
- Tablet: 640–1024px
- Desktop: di atas 1024px
- **Sidebar dashboard:** di layar 1024px ke atas selalu tampil di kiri (lebar 192px). Di bawah 1024px tersembunyi dan dibuka lewat tombol ☰ di header, tampil sebagai panel geser dengan latar gelap; ditutup dengan ✕, klik latar, atau tombol Esc. Status buka/tutup disimpan di `mobileNavOpen` pada `<body>` di `Layout.tsx`.
- **Banner halaman di HP:** judul di atas, tombol di bawahnya dengan lebar sama (`flex-col md:flex-row`, tombol `flex-1 md:flex-none`).

## 09 Framework CSS
Tailwind CSS (lewat CDN) + variabel warna di `public/css/style.css`.
- Daftarkan warna di atas pada konfigurasi tema Tailwind (`tailwind.config` di `Layout.tsx`), lalu pakai nama seperti `bg-primary` dan `bg-accent`. Jangan menulis kode hex langsung di class.
- ⚠️ Saat ini kode masih menulis hex langsung (`bg-[#1A237E]`) dan di beberapa tempat memakai `bg-indigo-900` sebagai pengganti navy. Keduanya harus diganti bertahap.

## Aturan
- Jangan memakai warna di luar palet ini.
- Warna Accent dan Highlight hanya untuk elemen interaktif atau penanda, bukan latar blok besar.
- Teks di atas Highlight #FFC107 memakai warna Primary, bukan putih (kontras putih di atas kuning tidak cukup).
- Utamakan tampilan HP. Setiap halaman wajib bisa dipakai di HP.
- Kontras teks harus cukup dibaca (minimal standar WCAG AA).
- Setiap gambar wajib punya teks `alt`.
- Perubahan warna, font, atau komponen dicatat di file ini pada commit yang sama dengan perubahan kodenya (lihat `AGENTS.md` bagian 10).
