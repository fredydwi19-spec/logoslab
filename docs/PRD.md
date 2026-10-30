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
- **Dashboard per peran:** KPI tim untuk Ketua; daftar proyek untuk Pembuat dan Pakar; progres, pencapaian, dan spider chart kemampuan untuk Pengguna. Kartu atas dashboard Pembuat sesuai bidangnya: Pembuat Game melihat "Game Saya Dipublish" dan "Total Game Dipublish di Platform"; Pembuat Materi melihat "Materi Saya Dipublish" dan "Total Materi Dipublish di Platform". Pakar melihat total game dan total materi seluruh platform. Daftar popularitas juga sesuai bidang: Pembuat Game melihat "Game Saya Paling Sering Dimainkan", Pembuat Materi melihat "Materi Saya Paling Sering Diakses". Leaderboard Top 5 di dashboard Pengguna hanya berisi pemain (role USER), diurutkan dari XP tertinggi.
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
- [x] Langkah 4: satu grid per level di editor Word Search dan TTS (tab level di editor, peringatan jika pindah level sebelum disimpan, draf sementara per level di browser, cek level kosong saat dikirim)
- [x] Langkah 5: terbit bertahap (tambah level baru pada game yang sudah terbit tanpa menarik game)
  - [x] 5a: kolom jumlah level terbit dan status review level baru di database
  - [x] 5b: alur di server (Tambah Level Baru, review level baru, kunci level terbit, sembunyikan level belum terbit)
  - [x] 5c: tampilan (tombol "+ Tambah Level" di tabel proyek Pembuat Game, level terbit bergembok di editor Quiz/FTB/Word Search/TTS, badge "LEVEL BARU: …" dan tombol Review di antrean Pakar & tabel Ketua)
  - Menu sidebar **"Proyek Terbit"** untuk Pembuat Game (`/dashboard/pembuat?tab=projects&view=all`) dan Pakar (`/dashboard/pakar?tab=projects&view=all`) membuka tabel "Proyek Telah Dipublikasikan"; tombol "+ Tambah Level" juga ada di sana.
- [x] Langkah 6: peta level, gembok, skor per level, dan "Segera hadir" untuk pemain
  - [x] 6a: server menghitung dan menyimpan skor per level (Quiz, FTB, Word Search, TTS), gembok dicek di server
  - [x] 6b: halaman `/play` menampilkan peta level (lulus ✓ / terbuka / terkunci 🔒 / "Segera hadir"), hasil per level (persentase, nilai minimal, tombol Level Berikutnya / Ulangi / Peta Level), dan TTS bisa dimainkan. Word Search & TTS punya tombol "Selesai & Lihat Hasil".
  - Pengunjung tanpa login hanya bisa memainkan Level 1; menyimpan skor dan membuka level berikutnya perlu login.
- [x] Langkah 7: Preview per level untuk Pakar, Ketua, dan Simulasi Pembuat (tab level di jendela Preview; level yang belum terbit diberi label "Baru" dan Preview langsung dibuka di level baru tersebut; Word Search & TTS memuat grid sesuai level)
- [x] **Kunci jawaban aman dari pemain:** kunci Quiz, FTB, dan TTS tidak lagi dikirim ke browser pemain. Setiap jawaban dicek ke server; tampilan tetap sama (benar/salah dan penjelasan langsung muncul per soal). Quiz & FTB hanya menghitung jawaban pertama, TTS boleh dicoba lagi sampai benar. Skor level dan skor Quiz Duel dihitung server dari sesi main, bukan dari angka kiriman browser.

- [x] **Tampilan dashboard di HP — sidebar:** sidebar disembunyikan di layar kecil dan dibuka lewat tombol menu ☰.
- [x] **Tampilan dashboard di HP — Semua Proyek:** banner tersusun ke bawah, tabel bisa digeser dengan petunjuk, badge status tidak terpecah.
- [x] **Tampilan dashboard di HP — halaman lain:** 14 halaman semua role diperiksa di lebar 390px (tanpa scroll ke samping). Petunjuk geser ditambahkan di tabel Bank Soal, proyek Pembuat Game/Materi, dan antrean Pakar; label spider chart Ketua tidak lagi terpotong.

- **Sistem Level dalam game:** satu proyek game bisa berisi beberapa level dengan jenis game yang sama (Quiz, Fill the Blank, Word Search, Teka-Teki Silang, dan nanti Adventure).
  - Ketua mengisi nilai minimal lulus level saat membuat proyek (bawaan 70%). Jumlah level per proyek tidak dibatasi.
  - Pembuat Game mengisi soal/grid per level lewat tab "Level 1 | Level 2 | + Tambah Level". Word Search dan TTS: satu grid per level. Import CSV di editor memakai kolom `level` (kosong = level yang sedang dibuka). Level harus berurutan dan tidak boleh kosong saat dikirim ke Pakar.
  - Pakar dan Ketua mereview semua level lewat Preview, lalu memakai fitur revisi proyek yang sudah ada.
  - Pemain melihat peta level; level berikutnya terkunci sampai level sebelumnya lulus dengan nilai minimal. Level yang sudah lulus boleh diulang. Skor dicatat per level.
  - Soal dan grid yang sudah ada otomatis menjadi Level 1; proyek dengan satu level dimainkan seperti biasa.
  - **Terbit bertahap:** game yang sudah terbit bisa ditambah level baru tanpa ditarik dari pemain.
    - Proyek mencatat **jumlah level terbit** (level yang bisa dimainkan) dan **status level baru** (alur review khusus level tambahan: DRAFT → REVIEW_PAKAR → REVISI_PAKAR/ACCEPTED_PAKAR → REVIEW_KETUA/REVISI_KETUA → diterima). Status proyek tetap PUBLISHED selama proses ini.
    - **Pembuat Game** pemilik proyek menekan "Tambah Level Baru" pada game terbitnya; Ketua mendapat notifikasi.
    - Level yang sudah terbit **dikunci** (tidak bisa diedit); Pembuat hanya mengisi level baru, dan Pakar cukup mereview level baru.
    - Setelah Ketua menerima, jumlah level terbit bertambah dan level baru terbuka untuk pemain. Level yang belum terbit tampil "Segera hadir" dan isinya tidak bisa diambil pemain lewat API.
- **Game Adventure Studi Kasus:** cerita bercabang tentang situasi nyata anak muda atau kisah Alkitab. Pemain memilih respons, pilihannya menentukan alur, dan di tengah cerita ada tantangan soal dari Bank Soal Quiz. Cerita berakhir dengan ending, skor, ayat, dan ajakan menulis Jurnal Refleksi.
  - Dikerjakan sebagai proyek GAME biasa (`game_type = ADVENTURE`) dengan alur yang sama: Ketua menugaskan PIC Pembuat Game dan Pakar → Pembuat mengerjakan → Pakar (accept/revisi) → Ketua (accept/revisi) → terbit.
  - Isi game terdiri dari scene dengan 3 jenis: **Cerita** (2–4 pilihan menuju scene lain), **Tantangan** (soal pilihan ganda yang dipilih dari Bank Soal Quiz lalu disalin ke scene, atau ditulis langsung; jawaban benar/salah menuju scene berbeda), dan **Akhir** (ending + nilai 0–100 + ayat + ajakan refleksi).
  - **Nilai level = nilai ending yang dicapai pemain.** Pembuat memberi nilai di tiap ending (misalnya ending terbaik 100, ending kurang tepat 40). Pemain lulus jika nilai ending ≥ nilai minimal lulus dari Ketua, jadi yang dinilai adalah keputusan pemain. Tantangan menentukan cabang cerita.
  - Mendukung Sistem Level dan terbit bertahap: satu level = satu cerita.
  - Versi 1 hanya teks (tanpa gambar per scene).
  - Editor versi 1 berbentuk form: kartu scene dengan dropdown "menuju scene", pemeriksa otomatis (tidak ada jalan buntu, semua scene tercapai, minimal satu ending), peta alur yang bisa dilihat, dan Preview.
  - Pakar dan Ketua mereview dengan mencoba Preview, lalu memakai fitur revisi proyek yang sudah ada (accept/revisi + catatan).
  - **Progres pengerjaan:**
    - [x] Langkah 1: database (tabel scene + jenis game `ADVENTURE`), API simpan/ambil cerita, pemeriksa alur, cek saat Kirim ke Pakar, dan Ketua bisa membuat proyek Adventure
    - [ ] Langkah 2: editor form untuk Pembuat Game (kartu scene, dropdown "menuju scene", pilih soal dari Bank Soal, pemeriksa otomatis, peta alur, tab level)
    - [ ] Langkah 3: pemain di `/play` (scene per scene dari server, ending, nilai, ayat, ajakan Jurnal Refleksi)
    - [ ] Langkah 4: Preview untuk Pakar, Ketua, dan Simulasi Pembuat
    - ⚠️ Sampai langkah 2 selesai, proyek Adventure belum punya editor di dashboard Pembuat Game.

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
