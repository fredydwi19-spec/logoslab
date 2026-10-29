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
- **Diskusi Proyek:** komentar per proyek atau per soal, bisa diubah menjadi tugas lalu ditandai selesai. Hanya Ketua serta Pembuat dan Pakar yang ditugaskan di proyek itu yang bisa membuka dan menulis. "Jadikan Catatan Revisi" hanya untuk Pakar dan Ketua. Ketik `@LogosAI` di awal pesan untuk jawaban AI.
- **Kelola data akun (API `/users`):** hanya Ketua Tim. Halaman publik hanya bisa melihat jumlah pengguna.
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

## 05a Fitur Berikutnya (sedang dikembangkan)
Urutan pengerjaan: Sistem Level lebih dulu, lalu tampilan dashboard di HP, lalu Adventure Studi Kasus.

**Progres Sistem Level:**
- [x] Langkah 1: kolom `level` dan nilai minimal lulus di database
- [x] Langkah 2: Ketua mengisi nilai minimal lulus di form proyek game
- [x] Langkah 3: tab level di editor Quiz dan Fill the Blank (termasuk import CSV dengan kolom `level`, Generate Soal ke level aktif, dan cek level kosong sebelum dikirim)
- [ ] Langkah 4: satu grid per level di editor Word Search dan TTS
- [ ] Langkah 5: peta level, gembok, dan skor per level untuk pemain
- [ ] Langkah 6: Preview per level untuk Pakar dan Ketua

- [x] **Tampilan dashboard di HP — sidebar:** sidebar disembunyikan di layar kecil dan dibuka lewat tombol menu ☰.
- [ ] **Tampilan dashboard di HP — isi halaman:** banner dan tabel Semua Proyek masih terpotong di HP.

- **Sistem Level dalam game:** satu proyek game bisa berisi beberapa level dengan jenis game yang sama (Quiz, Fill the Blank, Word Search, Teka-Teki Silang, dan nanti Adventure).
  - Ketua mengisi nilai minimal lulus level saat membuat proyek (bawaan 70%). Jumlah level per proyek tidak dibatasi.
  - Pembuat Game mengisi soal/grid per level lewat tab "Level 1 | Level 2 | + Tambah Level". Word Search dan TTS: satu grid per level. Import CSV di editor memakai kolom `level` (kosong = level yang sedang dibuka). Level harus berurutan dan tidak boleh kosong saat dikirim ke Pakar.
  - Pakar dan Ketua mereview semua level lewat Preview, lalu memakai fitur revisi proyek yang sudah ada.
  - Pemain melihat peta level; level berikutnya terkunci sampai level sebelumnya lulus dengan nilai minimal. Level yang sudah lulus boleh diulang. Skor dicatat per level.
  - Soal dan grid yang sudah ada otomatis menjadi Level 1; proyek dengan satu level dimainkan seperti biasa.
- **Game Adventure Studi Kasus:** cerita bercabang tentang situasi nyata anak muda atau kisah Alkitab. Pemain memilih respons, pilihannya menentukan alur, dan di tengah cerita ada tantangan soal dari Bank Soal Quiz. Cerita berakhir dengan ending, skor, ayat, dan ajakan menulis Jurnal Refleksi.
  - Dikerjakan sebagai proyek GAME biasa (`game_type = ADVENTURE`) dengan alur yang sama: Ketua menugaskan PIC Pembuat Game dan Pakar → Pembuat mengerjakan → Pakar (accept/revisi) → Ketua (accept/revisi) → terbit.
  - Isi game terdiri dari scene dengan 3 jenis: **Cerita** (2–4 pilihan menuju scene lain), **Tantangan** (soal Bank Soal; jawaban benar/salah menuju scene berbeda), dan **Akhir** (ending + refleksi + ayat).
  - Editor versi 1 berbentuk form: kartu scene dengan dropdown "menuju scene", pemeriksa otomatis (tidak ada jalan buntu, semua scene tercapai, minimal satu ending), peta alur yang bisa dilihat, dan Preview.
  - Pakar dan Ketua mereview dengan mencoba Preview, lalu memakai fitur revisi proyek yang sudah ada (accept/revisi + catatan).

## 06 Di Luar Cakupan (belum dibuat sekarang)
- Forum tanya pakar (Expert Insight Forum)
- Usulan tema dari gereja/komunitas (Community Contribution)
- Jajak pendapat (poll) dan kolom komentar publik
- Learning Path yang disarankan sistem
- Galeri video pendek gaya Reels
- Mode baca gelap / soft grey
- Pencarian berdasarkan tema (Smart Search)
- Formulir lapor bug & masukan
- Jenis game baru selain Adventure: Urutkan Peristiwa, Siapa Aku?/Tebak Gambar, Peta Alkitab, Detektif/Escape Room, Eksplorasi Peta
- Editor Adventure berbentuk peta drag & drop (versi 1 memakai editor form)
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
