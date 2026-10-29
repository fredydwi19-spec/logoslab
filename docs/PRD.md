# Product Requirements Document (PRD)

> Diisi berdasarkan kode website per 29 Oktober 2026 (branch `main`) dan draf konsep "Website Logos Lab.pdf".
> Setiap fitur yang selesai dikerjakan dicatat sebagai satu commit di GitHub dengan judul fitur tersebut (lihat `AGENTS.md` bagian 10). Daftar fitur di bawah diperbarui di commit yang sama.
> Teks bertanda **[perlu diisi]** belum bisa diketahui dari kode dan harus diputuskan oleh pemilik proyek.

## 01 Gambaran Produk
- **Nama aplikasi:** Logos LAB
- **Tagline:** "Pengetahuan Alkitab & Berpikir Kritis"
- **Deskripsi:** Ruang belajar Alkitab berbasis web untuk generasi muda, lewat game dan materi yang interaktif. Konten diproduksi oleh tim (ketua, pembuat game, pembuat materi, pakar) melalui alur review di dalam website, lalu dipublikasikan untuk dimainkan dan dipelajari pengguna. Bedanya dengan cara lama: belajar tidak lagi lewat teks panjang yang kaku, tetapi lewat aktivitas yang seru dan terukur.
- **Jenis aplikasi:** gabungan keduanya: halaman publik (landing page, bermain game) dan aplikasi internal yang perlu login (dashboard tim dan dashboard pengguna).
- **Bahasa tampilan:** Bahasa Indonesia

## 02 Masalah
- Literasi Alkitab di kalangan generasi muda rendah.
- Metode pembelajaran formal terasa kaku, membosankan, dan sulit dipahami.
- Belum ada wadah tempat pakar, guru, dan mahasiswa bisa bersama-sama menyusun, meninjau, dan menerbitkan konten belajar Alkitab yang akurat secara teologis.

## 03 Tujuan
**[perlu diisi]** Satu tujuan yang bisa diukur. Contoh bentuknya: "Pada [tahun], [jumlah] game dan materi terbit lewat alur review tim, dan [jumlah] pengguna aktif menyelesaikan minimal satu aktivitas per minggu."

## 04 Pengguna dan Hak Akses
| Peran | Siapa orangnya | Boleh melakukan |
|-------|----------------|-----------------|
| Ketua Tim (`KETUA_TIM`) | koordinator tim konten | membuat proyek dan menugaskan pembuat & pakar; mengubah info proyek selama masih DRAFT; review akhir; publish dan unpublish; mengelola Bank Soal; melihat dashboard KPI tim |
| Pembuat Game (`PEMBUAT_GAME`) | mahasiswa/kontributor | mengisi soal dan isi game pada proyek miliknya selama DRAFT atau REVISI; mengirim proyek untuk direview; mengelola Bank Soal |
| Pembuat Materi (`PEMBUAT_MATERI`) | mahasiswa/kontributor/guru | menyusun materi (section teks, glosarium, lampiran PDF/PPT/gambar/video) pada proyek miliknya; mengirim untuk direview |
| Pakar (`PAKAR`) | dosen/ahli teologi | meninjau proyek yang ditugaskan kepadanya; menyetujui (ACCEPT) atau meminta revisi beserta feedback |
| Pengguna (`USER`) | siswa/anak muda yang mendaftar | memilih minat, bermain game, membaca materi, mengikuti duel kuis, menulis jurnal refleksi, melihat progres dan pencapaian |
| Pengunjung umum | tanpa login | melihat landing page; membuka game dan materi yang sudah terbit (hasil tidak tersimpan) |

## 05 Fitur Inti (Versi 1 — sudah dibuat)
- **Login & pendaftaran:** daftar dengan email + verifikasi lewat email, atau login dengan Google (semua peran).
- **Manajemen proyek berstatus:** proyek game/materi bergerak dari DRAFT → review Pakar → review Ketua → PUBLISHED, dengan riwayat review dan notifikasi otomatis (Ketua, Pembuat, Pakar).
- **Diskusi Proyek:** komentar per proyek atau per soal, bisa diubah menjadi tugas lalu ditandai selesai (Ketua, Pembuat, Pakar).
- **Game Quiz, Fill the Blank, Word Search, Teka-Teki Silang:** editor untuk Pembuat Game, player untuk Pengguna.
- **Bank Soal:** kumpulan soal Quiz/FTB/TTS, impor dari Excel, dan isi otomatis ke proyek game (Ketua, Pembuat Game).
- **Materi:** artikel bersection, glosarium, dan lampiran PDF/PPT/gambar/video/embed (Pembuat Materi), dengan pelacak progres baca (Pengguna).
- **Thumbnail otomatis dengan AI:** membuat gambar sampul proyek dari judulnya (Ketua, Pembuat).
- **Logos AI Assistant:** chat tanya-jawab dengan AI (Google Gemini) (semua peran).
- **Dashboard per peran:** KPI tim untuk Ketua; daftar proyek untuk Pembuat dan Pakar; progres, pencapaian, dan spider chart kemampuan untuk Pengguna.
- **Onboarding minat:** pengguna memilih minat (Biblical Knowledge, Eksegesis & Hermeneutik, Biblical Theory, Homiletika, Apologetika, Lainnya), lalu game yang disarankan menyesuaikan.
- **Quiz Duel:** pengguna menantang pengguna lain mengerjakan quiz yang sama; skor dan waktu dibandingkan.
- **Jurnal Refleksi:** pengguna menulis refleksi pribadi atas quiz atau materi yang sudah diselesaikan.
- **Pencapaian (achievement):** diberikan saat menyelesaikan materi teks, materi video, atau game.

## 06 Di Luar Cakupan (belum dibuat sekarang)
- Forum tanya pakar (Expert Insight Forum)
- Usulan tema dari gereja/komunitas (Community Contribution)
- Jajak pendapat (poll) dan kolom komentar publik
- Learning Path yang disarankan sistem
- Galeri video pendek gaya Reels
- Mode baca gelap / soft grey
- Pencarian berdasarkan tema (Smart Search)
- Formulir lapor bug & masukan
- Jenis game baru (dibahas terpisah)
- Aplikasi mobile Android/iOS

## 07 Ukuran Keberhasilan
**[perlu diisi]** Contoh yang bisa diukur dari data yang sudah tercatat di sistem:
- Jumlah proyek yang terbit per bulan.
- Rata-rata waktu dari DRAFT sampai PUBLISHED.
- Jumlah pengguna yang menyelesaikan minimal satu game/materi per minggu.
- Tidak ada konten yang terbit tanpa persetujuan Pakar.

## 08 Batasan dan Ketentuan
- **Data pribadi/rahasia:** ada. Email, password (disimpan dalam bentuk hash), foto profil, skor, dan jurnal refleksi pengguna. Jurnal refleksi bersifat pribadi dan hanya boleh dilihat pemiliknya. Data pengguna tidak boleh tampil di halaman publik selain nama tampilan.
- **Aturan yang wajib diikuti:**
  - Semua konten wajib lolos review Pakar sebelum terbit (akurasi teologis).
  - UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
  - Gambar dan materi yang diunggah tidak boleh melanggar hak cipta.
- **Tenggat:** **[perlu diisi]**
