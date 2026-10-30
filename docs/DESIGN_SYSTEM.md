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
  - `DRAFT` = abu-abu (`bg-slate-100 text-slate-600 border-slate-200`)
  - `REVIEW_PAKAR`, `REVIEW_KETUA` = biru (`bg-blue-100 text-blue-800 border-blue-200`)
  - `REVISI_PAKAR`, `REVISI_KETUA` = Warning (`bg-orange-100 text-accent-hover border-orange-200`)
  - `ACCEPTED_PAKAR` = Highlight (`bg-highlight text-primary`)
  - `PUBLISHED` = Success (`bg-green-100 text-green-800 border-green-200`)
  - `UNPUBLISHED` = Error (`bg-red-100 text-red-800 border-red-200`)
  - Kelas di atas dipakai sama persis di tabel proyek Ketua (`KetuaTimAllProjects.tsx`), Pakar, Pembuat Game, dan Pembuat Materi. Badge memakai `whitespace-nowrap` agar tidak terpecah.
  - Game terbit yang sedang menambah level tampil dengan label "LEVEL BARU: <status>" dan warna mengikuti status level baru tersebut (fungsi `statusLabel` dan `workflowStatus` di tiap dashboard).
- **Level terkunci (sudah terbit):** tab level diberi ikon gembok (`bi-lock-fill`) atau tulisan "· terbit", dan di atas editor tampil kotak hijau "Level N sudah terbit dan sedang dimainkan, jadi tidak bisa diubah." Tombol simpan dan tambah soal disembunyikan di level itu.
- **Peta level pemain (`/play`):** kartu per level dalam grid (1 kolom HP, 2 tablet, 3 desktop). Lulus = border hijau + ikon `bi-patch-check-fill` + tombol garis "Main Lagi"; terbuka = border Highlight + ikon `bi-unlock-fill` + tombol Accent "Mainkan"; terkunci = abu-abu transparan + ikon `bi-lock-fill` + syarat membuka; "Segera hadir" = kartu garis putus-putus dengan ikon `bi-hourglass-split`.
- **Tab level di jendela Preview/Simulasi (Pakar, Ketua, Pembuat):** baris tab di bawah judul jendela, hanya muncul jika game punya lebih dari 1 level. Tab aktif berlatar Primary dengan teks Highlight; level yang belum terbit diberi label kecil Accent "Baru".
- **Hasil level:** kotak putih dengan persentase besar (hijau jika lulus, Accent jika belum), nilai minimal lulus, dan tombol Level Berikutnya (Accent) / Ulangi Level (garis Primary) / Peta Level (Primary).
- Halaman di luar dashboard yang memakai ikon (`/play`, `/materi`, `/duel`) wajib memuat CSS Bootstrap Icons sendiri.
- **Editor Adventure (`AdventureEditor.tsx`):** warna jenis scene konsisten di kartu dan peta alur: Cerita = biru (`border-blue-200`, badge `bg-blue-100 text-blue-800`, ikon `bi-book`), Tantangan = Highlight (`border-highlight`, badge `bg-highlight text-primary`, ikon `bi-patch-question`), Akhir = hijau (`border-green-200`, badge `bg-green-100 text-green-800`, ikon `bi-flag`). Kode scene tampil sebagai badge `bg-primary text-highlight`. Kotak pemeriksa alur hijau jika siap dikirim, oranye jika masih ada masalah. Peta alur berupa kolom per langkah yang bisa digeser ke samping di HP.
- **Pemain Adventure (`/play`):** satu kartu scene per layar dengan warna jenis scene yang sama seperti editor. Pilihan Cerita berupa tombol lebar bernomor (hover Highlight); opsi Tantangan memakai pola warna Quiz (hijau benar, merah salah) dan kotak umpan balik bergaris putus-putus dengan tombol Primary "Lanjutkan Cerita". Ending menampilkan nilai besar (hijau jika ≥ nilai minimal, Accent jika belum), ayat dalam kutipan bergaris kiri Highlight, dan tombol Accent "Lihat Hasil & Tulis Refleksi". Di bawah kartu tampil daftar "Jejak keputusanmu".
- **Preview Adventure (`AdventurePreview.tsx`):** dua tab di atas isi Preview: "Mainkan" dan "Semua Scene (n)" (tab aktif `bg-primary text-highlight`, lainnya garis abu-abu), plus tombol garis "Mulai Ulang". Kartu scene memakai warna jenis scene dan badge kode scene yang sama dengan editor; di tab Semua Scene, kunci tantangan ditandai hijau tebal "(kunci)", tujuan Benar hijau dan Salah merah. Isi Preview yang tinggi tidak boleh dipusatkan vertikal (pakai `self-start`) agar bagian atasnya tidak terpotong.
- **Halaman depan (`LandingPage.tsx`):** hero bergradasi `from-primary to-primary-dark` dengan ikon besar transparan sebagai hiasan (tanpa gambar latar dari situs luar); tombol utama Accent "Coba Main Sekarang", tombol kedua bergaris putih "Daftar Gratis"; deretan pil jenis game. Kartu game memakai sampul dan label yang sama dengan katalog Jelajah Game. Kartu "Cara bermain" berikon kotak Highlight.
- **Kartu katalog game (`UserGamesPage.tsx`):** sampul setinggi `h-40`. Tanpa gambar sampul, warnanya mengikuti jenis game: Quiz `bg-primary` + ikon Highlight `bi-patch-question-fill`, Fill the Blank `bg-accent` + ikon putih `bi-input-cursor-text`, Word Search `bg-highlight` + ikon Primary `bi-search`, TTS `bg-primary-dark` + ikon Highlight `bi-grid-3x3-gap-fill`, Adventure `bg-success` + ikon putih `bi-signpost-split-fill` (ikon besar transparan di pojok sebagai hiasan). Label jenis game di kiri bawah sampul, label status di kanan atas ("Belum dimainkan" Accent, "Selesai" hijau). Tombol utama: "Lanjutkan" Accent, "Mainkan"/"Main Lagi" Primary. Filter berupa tombol pil (aktif `bg-primary text-highlight`).
- **Layar main Quiz/FTB:** di bawah header ada deretan segmen progres per soal (`bg-green-500` benar, `bg-red-500` salah, `bg-highlight` soal sekarang, `bg-slate-200` belum). Bilah hitung mundur Quiz berwarna Primary dan berubah merah serta berdenyut di 5 detik terakhir. Penanda streak berupa pil Accent dengan ikon `bi-fire`; pop-up "Combo xN!" juga pil Accent. Animasi: `anim-pop` (jawaban benar), `anim-shake` (jawaban salah), `anim-pulse` (waktu hampir habis); semuanya dimatikan bila pengguna memilih *reduce motion*. Ikon umpan balik memakai Bootstrap Icons (`bi-check-circle-fill`, `bi-lightbulb-fill`, `bi-alarm-fill`), bukan emoji.
- **Layar hasil game:** ikon trofi (lulus) atau `bi-arrow-repeat` (belum lulus) dengan lencana persentase Highlight; isi layar hasil bisa digulir di HP. Daftar pembahasan soal yang belum tepat memakai kartu bergaris kiri merah.
- **Tombol "+ Tambah Level":** tombol garis oranye (latar putih, border dan teks Accent) di kolom Aksi tabel proyek Pembuat Game.
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
- Warna palet sudah terdaftar di `public/js/tailwind-config.js` (dimuat tepat setelah script Tailwind CDN di `Layout.tsx`, `MainLayout.tsx`, dan halaman `/materi`, `/play`, `/duel` di `src/index.tsx`). Pakai nama warnanya, jangan menulis kode hex di class:

| Class | Hex |
|-------|-----|
| `primary` | #1A237E |
| `primary-dark` | #121858 (dipakai untuk efek hover tombol Primary) |
| `accent` | #FF5722 |
| `accent-hover` | #E64A19 |
| `highlight` | #FFC107 |
| `success` | #16A34A |
| `error` | #DC2626 |
| `muted` | #64748B |

  Contoh: `bg-primary`, `text-highlight`, `hover:bg-accent-hover`, `border-highlight/30`, `from-primary`.
- Halaman baru yang memuat Tailwind CDN wajib ikut memuat `/public/js/tailwind-config.js` tepat setelahnya.
- Warna tambahan dari Tailwind bawaan (misalnya `slate`, `blue`, `green-100`) tetap boleh untuk latar lembut dan badge sesuai aturan di §06.

## Aturan
- Jangan memakai warna di luar palet ini.
- Warna Accent dan Highlight hanya untuk elemen interaktif atau penanda, bukan latar blok besar.
- Teks di atas Highlight #FFC107 memakai warna Primary, bukan putih (kontras putih di atas kuning tidak cukup).
- Utamakan tampilan HP. Setiap halaman wajib bisa dipakai di HP.
- Kontras teks harus cukup dibaca (minimal standar WCAG AA).
- Setiap gambar wajib punya teks `alt`.
- Perubahan warna, font, atau komponen dicatat di file ini pada commit yang sama dengan perubahan kodenya (lihat `AGENTS.md` bagian 10).
