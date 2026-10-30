# Architecture

> Diisi berdasarkan kode website per 29 Oktober 2026 (branch `main`).
> Teks bertanda **[perlu diisi]** belum bisa diketahui dari kode.

## 01 Gambaran Sistem
```
Browser pengguna → Aplikasi Bun + Elysia (port 3000) → Database MySQL
                         ├→ halaman HTML dibuat di server (TSX) + Alpine.js di browser
                         ├→ API JSON di /api/*
                         └→ Layanan luar: Google Gemini (AI chat), Hugging Face / Pollinations (thumbnail AI),
                            SMTP (email verifikasi), Google OAuth (login)
```

Catatan: percobaan memindahkan sebagian halaman ke React (Agustus 2026) beserta fitur tagging soal, rekomendasi adaptif, dan badge **tidak** ada di `main`. Semuanya disimpan di branch `arsip/main-agustus` dan bisa diambil kembali bila diperlukan.

## 02 Tech Stack
| Bagian | Yang dipakai | Versi |
|--------|--------------|-------|
| Bahasa backend | TypeScript (runtime Bun) | Bun 1.x (lokal 1.4.2), TypeScript 5 |
| Framework backend | Elysia | ^1.4.28 |
| Tampilan (frontend) | Komponen TSX yang dirender jadi HTML di server (`@elysiajs/html`) + Alpine.js | `@elysiajs/html` ^1.4.2, Alpine.js 3.x (CDN) |
| Framework CSS | Tailwind CSS (CDN) + `public/css/style.css` | CDN, versi tidak dikunci |
| Ikon | Bootstrap Icons | ^1.13.1 |
| Database | MySQL lewat Drizzle ORM + driver `mysql2` | Drizzle ORM ^0.45.2, drizzle-kit ^0.31.10, mysql2 ^3.22.3 |
| Login | JWT di cookie `auth` (`@elysiajs/jwt`, umur 7 hari), password di-hash dengan bcryptjs, Google OAuth | `@elysiajs/jwt` ^1.4.2, bcryptjs ^3.0.3 |
| Ekspor/impor dokumen | xlsx (impor & template Excel Bank Soal) | ^0.18.5 |
| Email | Nodemailer lewat SMTP | ^8.0.7 |
| AI | Google Gemini (chat), Hugging Face FLUX.1-schnell + Pollinations (thumbnail) | – |
| Hosting | **[perlu diisi]** | |
| Lingkungan lokal | `bun run dev` → http://localhost:3000 | |

## 03 Struktur Folder
```
src/index.tsx              # Titik awal aplikasi: pasang plugin, daftar route, halaman /dashboard/*
src/db/db.ts               # Koneksi MySQL
src/db/schema.ts           # Semua definisi tabel database
src/routes/                # Satu file per bagian fitur
  auth.ts                  #   login, daftar, verifikasi email, Google OAuth
  users.ts                 #   data pengguna
  projects.ts              #   proyek game/materi, review berstatus, soal, materi, thumbnail AI
  bank_soal.ts             #   Bank Soal (API) + impor Excel
  bank_soal_ui.ts          #   halaman Bank Soal
  word_search.ts           #   game Word Search
  crossword.ts             #   game Teka-Teki Silang
  materi.ts                #   progres baca & klaim pencapaian
  dashboard.ts             #   data KPI & ringkasan pengguna
  chat.ts                  #   Diskusi Proyek
  quizDuels.ts             #   Quiz Duel
  journals.ts              #   Jurnal Refleksi
  adventure.ts             #   Game Adventure: ambil & simpan cerita per level (hanya tim proyek)
  levels.ts                #   Peta level pemain, sesi main (mulai/cek jawaban/selesai) & penilaian skor per level
  userDashboard.ts         #   data dashboard pengguna
  ai.ts                    #   Logos AI Assistant
src/services/              # Logika bisnis yang dipakai bersama (dashboardService.ts)
src/utils/mailer.ts        # Pengirim email
src/views/components/AdventureEditor.tsx, AdventurePreview.tsx  # Editor cerita (Pembuat) dan Preview cerita (Pakar, Ketua, Simulasi Pembuat)
src/utils/adventure.ts     # Aturan cerita Adventure: bentuk scene, pemeriksa alur, scene versi pemain
src/utils/level.ts         # Fungsi bantu level (toLevel, findMissingLevel) dan versi soal tanpa kunci jawaban untuk pemain
src/views/layouts/         # Kerangka halaman (Layout.tsx untuk dashboard, MainLayout.tsx untuk publik)
src/views/components/      # Bagian tampilan: dashboard per peran, editor & player game, widget chat
src/views/pages/           # Halaman penuh: Landing, Profil, Duel, Jurnal, Katalog game & materi
src/__tests__/             # Tes (bun test)
drizzle/                   # File migrasi database (dibuat otomatis oleh drizzle-kit), dimulai dari 0000_baseline.sql
public/assets/             # Logo dan gambar resmi
public/css/, public/js/    # CSS dan JS global (public/js/tailwind-config.js = warna palet untuk Tailwind)
public/uploads/            # File yang diunggah pengguna (foto profil)
```

## 04 Alur Data
Alur terpenting: proyek konten dari dibuat sampai terbit.
1. Ketua Tim membuat proyek (judul, jenis GAME/MATERI, pembuat, pakar, deadline). Status: `DRAFT`.
2. Pembuat mengisi soal atau materi, lalu klik Kirim. Server mengecek bahwa dia pemilik proyek dan statusnya DRAFT/REVISI. Status menjadi `REVIEW_PAKAR`, dan Pakar mendapat notifikasi.
3. Pakar memilih:
   - ACCEPT → `ACCEPTED_PAKAR`, Ketua mendapat notifikasi.
   - REVISI + feedback → `REVISI_PAKAR`, Pembuat mendapat notifikasi, kembali ke langkah 2.
4. Ketua memilih:
   - ACCEPT → `PUBLISHED`, konten tampil untuk publik.
   - REVISI → `REVISI_KETUA`. Setelah diperbaiki, Pembuat mengirim ulang ke `REVIEW_KETUA` (tidak lewat Pakar lagi).
5. Setiap keputusan dicatat di tabel `reviews_history` dan notifikasinya di tabel `notifications`. Semua perubahan status lewat satu pintu: `POST /api/projects/:id/review`.
6. Ketua bisa menarik konten yang sudah terbit → `UNPUBLISHED`.

**Terbit bertahap (menambah level pada game yang sudah terbit):**
1. Saat proyek terbit, `published_level_count` diisi level tertinggi yang ada.
2. Pembuat Game pemilik proyek memanggil `POST /api/projects/:id/new-level` → `level_review_status = DRAFT`; status proyek tetap `PUBLISHED` (game tetap bisa dimainkan).
3. Pembuat hanya bisa mengubah level di atas `published_level_count` (fungsi `firstEditableLevel` di `src/utils/level.ts`).
4. `POST /api/projects/:id/review` memakai alur yang sama, tetapi yang berubah adalah `level_review_status`. Saat Ketua menerima: `published_level_count` = level tertinggi, `level_review_status` = null.
5. Selain anggota tim proyek (Ketua, Pembuat, Pakar yang ditugaskan), API hanya mengembalikan level ≤ `published_level_count` (fungsi `isProjectTeam`).

## 05 Lingkungan dan Data Rahasia
- Semua password, kunci API, dan pengaturan database disimpan di file `.env`, bukan ditulis langsung di kode.
- File `.env` tidak boleh ikut diunggah ke Git atau dibagikan (sudah tercantum di `.gitignore`).
- `.env.example` berisi nama variabel tanpa nilai rahasia. Variabel yang dipakai kode:
  - Database: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - Login: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - AI: `GEMINI_API_KEY`, `HF_TOKEN`
  - `JWT_SECRET` wajib diisi (buat dengan `openssl rand -hex 32`). Tanpa nilai ini server tidak mau berjalan. Server produksi harus memakai nilai yang berbeda dari laptop.
- **Lokal:** http://localhost:3000
- **Produksi:** **[perlu diisi]**

## 06 Situs Publik
Halaman publik: landing page (`/`), player game (`/play/:id`), viewer materi (`/materi/:id`).
- `robots.txt` memblokir halaman `/dashboard`, `/profile`, `/api`, dan menyebut alamat sitemap. Status: **belum ada**.
- `sitemap.xml` berisi daftar halaman publik. Status: **belum ada**.
- Favicon persegi dan `favicon.ico` di folder publik paling atas. Status: **belum ada**.
- Setiap halaman punya `<title>` dan `<meta name="description">` yang jelas. Status: sudah ada di `MainLayout.tsx`; halaman dashboard hanya punya `<title>`.
- Situs terdaftar di Google Search Console. File verifikasi `google....html` jangan dihapus. Status: **[perlu diisi]**.

## 07 Pertumbuhan Aplikasi
- Satu fitur = satu file di `src/routes/` (API) + komponen di `src/views/`. Jangan menumpuk semua fitur di `src/index.tsx`.
- Ubah struktur database hanya lewat `src/db/schema.ts` → `bun run db:generate` → `bun run db:migrate`. Jangan membuat tabel lewat skrip SQL manual atau langsung di phpMyAdmin.
- Riwayat migrasi dimulai ulang pada 29 Okt 2026 dengan `drizzle/0000_baseline.sql` (seluruh struktur database saat itu). Database baru (misalnya di server) cukup dibuat kosong lalu jalankan `bun run db:migrate`.
- Jangan memakai `drizzle-kit push`: perintah itu akan menghapus tabel yang tidak ada di `schema.ts`. Database laptop masih menyimpan 8 tabel sisa versi Agustus (`tags`, `user_badges`, dll.) yang sengaja dibiarkan.
- Jangan mengubah kode lewat skrip tambal (`fix_*.cjs`) yang menimpa baris tertentu. Ubah file sumbernya langsung.
- Data yang akan dihitung (skor, durasi, benar/salah) disimpan di kolom biasa, bukan sebagai teks JSON.
- **Waktu "sekarang" ke kolom `timestamp`:** pakai `sql`NOW()`` dari `drizzle-orm`, jangan `new Date()`. Database menyimpan jam lokal (server +08:00), sedangkan Drizzle mengirim `Date` sebagai jam UTC, sehingga hasilnya meleset 8 jam dari `created_at` yang diisi MySQL. Untuk batas waktu, hitung juga di MySQL (contoh: `NOW() - INTERVAL 24 HOUR`).
  - Kolom waktu yang punya nilai bawaan (`defaultNow()`), seperti `played_at` di `game_play_logs`, cukup tidak diisi saat insert.
- ⚠️ Tabel `game_questions_bank` diisi setiap kali soal Fill the Blank proyek disimpan (`POST /api/projects/:id/questions`), tetapi tidak pernah dibaca oleh fitur mana pun. Tabel ini tidak punya kunci unik pada `content`, jadi soal yang sama tersimpan berkali-kali (per 30 Okt 2026: 53 baris, hanya 4 teks berbeda). Bank Soal di menu memakai `bank_soal_ftb`.
- Jangan menambah library, framework, atau layanan baru tanpa memperbarui file ini.

## 08 Aturan Keamanan yang Sudah Diterapkan
- **Login:** JWT di cookie `auth`, ditandatangani dengan `JWT_SECRET` dari `.env` (wajib; tidak ada nilai cadangan di kode). Isi sesi: `id`, `role`, `username`, `name`, `email`, `avatarUrl`.
- **`/users`:** hanya Ketua Tim (login + role dicek di server). Hash password tidak pernah dikirim. `/users/count` publik, hanya berisi jumlah pengguna.
- **Diskusi Proyek (`/api/projects/:id/chats`, `/api/chats/*`):** hanya Ketua serta Pembuat/Pakar yang ditugaskan di proyek. Ubah komentar menjadi catatan revisi hanya Pakar dan Ketua.
- **Jurnal:** pengguna hanya bisa melihat dan menghapus jurnal miliknya sendiri.
- **Upload foto profil:** hanya JPG/PNG/WebP, maksimal 2 MB, nama file dibuat ulang oleh server (`avatar-<id>-<waktu>.<ext>`).
- **Nilai minimal lulus level:** server hanya menerima angka bulat 1–100.
- **Isi game yang belum terbit:** detail proyek, Word Search, dan TTS hanya bisa dibuka anggota tim proyek jika belum terbit; pemain hanya menerima level yang sudah terbit.
- **Level terbit dikunci:** simpan soal, simpan grid, dan Generate Soal menolak level ≤ `published_level_count` ("Level N sudah terbit dan dikunci").
- **Tambah Level Baru:** hanya Pembuat Game pemilik proyek, hanya pada game `PUBLISHED`, dan tidak bisa dimulai dua kali.
- **Kunci jawaban tidak dikirim ke pemain:** untuk pemain dan pengunjung, `GET /api/projects/:id` mengirim Quiz tanpa `correctAnswer`/`explanation`, FTB tanpa `fullText`/`answers` (diganti `parts`: potongan teks dan kotak isian, plus `blankCount`), dan TTS tanpa `answer`/`explanation` (diganti `length`). `GET /api/crossword/:id` untuk pemain juga tanpa huruf di `gridData`. Anggota tim proyek tetap menerima data lengkap untuk editor dan Preview. Fungsi bantunya `publicQuizQuestion`, `publicFtbQuestion`, `publicCrosswordClues`, `publicCrosswordGrid` di `src/utils/level.ts`.
- **Sesi main (`level_attempts`) dan skor dihitung di server:**
  1. `POST /api/projects/:id/levels/:level/start` membuat sesi (`attemptId`, UUID) dan mengirim soal level itu (tanpa kunci). Level harus terbit dan terbuka (Level 1, atau level sebelumnya lulus dengan nilai ≥ `pass_percentage`); pengunjung tanpa login hanya Level 1.
  2. `POST /api/projects/:id/levels/:level/answer` (`attemptId` + `questionId`/`clueIndex` + `answer`) mengecek satu jawaban dan membalas benar/salah. Quiz & FTB: hanya **jawaban pertama** yang dicatat (menjawab ulang tidak mengubahnya); kunci dan penjelasan baru dikirim setelah menjawab. TTS: boleh mencoba lagi; jawaban dan penjelasan hanya dikirim jika benar.
  3. `POST /api/projects/:id/levels/:level/finish` (`attemptId`, Word Search menambah `foundWords`) menilai dari jawaban yang tercatat di sesi, lalu menutup sesi (tidak bisa dipakai lagi). Pemain login: skor disimpan ke `user_scores` (kolom `level`). Pengunjung: hasil dikirim dengan `needLogin: true` tanpa disimpan. Angka skor dari browser selalu diabaikan.
  - Sesi hanya bisa dipakai pemiliknya (sesi pengunjung tidak bisa dipakai akun lain, dan sebaliknya).
  - **Pembersihan otomatis** (`cleanupStaleAttempts` di `levels.ts`, dijalankan dari `src/index.tsx` saat server menyala lalu setiap 1 jam): sesi yang belum selesai dan sesi pengunjung yang sudah selesai dihapus setelah 24 jam. Sesi pemain login yang sudah selesai tetap disimpan.
  - **Adventure:** `start` hanya mengirim scene awal (versi pemain dari `publicAdventureScene`: tanpa tujuan pilihan, tanpa kunci). Sesi menyimpan posisi pemain (`{ current, path }`). `answer` menerima `sceneKey` + `choiceIndex` (Cerita) atau `sceneKey` + `answer` (Tantangan); `sceneKey` wajib sama dengan posisi sekarang (selain itu 409, jadi pemain tidak bisa melompati scene), lalu server membalas scene berikutnya (dan untuk Tantangan: benar/salah, kunci, penjelasan). `finish` ditolak jika belum sampai scene Akhir; nilai = `ending_score` dari ending yang dicapai (nilai maksimal 100). Batas 500 langkah per sesi.
- **Peta level:** `GET /api/projects/:id/progress` (publik) mengembalikan tiap level terbit: `maxScore`, `bestScore`, `percent`, `passed`, `unlocked`, ditambah `upcoming` (ada level baru sedang direview). Tanpa login hanya Level 1 yang terbuka.
- **Hapus proyek** (hanya Ketua) menghapus proyek beserta semua data yang merujuknya dalam satu transaksi database: isi game/materi, riwayat review, notifikasi, diskusi proyek, serta data pemain (`user_scores`, `achievements`, `materi_read_progress`, `quiz_duels`, `user_journals`, `game_play_logs`, `material_access_logs`). Jika satu langkah gagal, tidak ada yang terhapus. Jendela konfirmasi memperingatkan bahwa data pemain ikut terhapus. Tabel baru yang merujuk `projects` wajib ditambahkan ke daftar hapus ini, kecuali relasinya sudah `ON DELETE CASCADE` (contoh: `level_attempts`).
- `POST /api/crossword/:id/submit` dan `POST /api/word-search/:id/submit` tidak menyimpan skor (hanya membalas pesan). Satu-satunya jalan menyimpan skor game adalah endpoint `finish` di atas.
- **Pemutar game publik (`/play/:id`, `PublicGamePlayer.tsx`):** memainkan Quiz, FTB, Word Search, dan TTS lewat sesi main di atas. TTS mengecek setiap kata yang sudah terisi penuh ke endpoint `answer`. Komponen Word Search/TTS mengirim event `game-level-finish` saat selesai (Word Search berisi `foundWords`); pemutar meneruskannya ke endpoint `finish`.
- **Quiz Duel:** `POST /api/duels/create` dan `POST /api/duels/:id/submit` hanya menerima `attemptId` dari sesi Quiz yang sudah selesai milik pemain itu. Skor diambil dari sesi, waktu dihitung dari mulai sampai selesai sesi. Duel memakai soal dari level sesi penantang.
- **Simpan soal (`POST /api/projects/:id/questions`) dan Generate Soal (`POST /api/bank-soal/auto-generate`):** hanya Pembuat yang ditugaskan di proyek itu (Generate Soal juga boleh oleh Ketua).
- **Kirim ke Pakar:** server menolak jika ada level yang kosong (level harus 1, 2, 3, ... tanpa celah). Quiz & Fill the Blank: tiap level minimal 1 soal. Word Search & TTS: tiap level punya grid dengan minimal 1 kata/clue.
- **Grid Word Search & TTS per level:** `GET /api/word-search/:id?level=N` dan `GET /api/crossword/:id?level=N` (tanpa `level` = Level 1) mengembalikan `data` level itu dan `levelCount`. Simpan (`POST .../questions`) menyertakan `level`; satu baris tabel per level. Fungsi bantu nomor level ada di `src/utils/level.ts`.
- **Game Adventure (`game_adventure_scenes`):** satu baris = satu scene (`scene_key` unik per proyek + level; jenis `STORY`/`CHALLENGE`/`ENDING`). Pilihan scene Cerita disimpan di kolom `choices` (JSON `[{ text, next }]`); tantangan memakai kolom soal biasa (`question`, `option_a`–`option_d`, `correct_answer`, `next_correct`, `next_wrong`); Akhir memakai `ending_score` (0–100), `verse`, `reflection`. Relasi ke `projects` memakai `ON DELETE CASCADE`.
  - `GET /api/adventure/:id?level=N` hanya untuk tim proyek (pemain dan pengunjung ditolak 403); mengembalikan `scenes`, `levelCount`, dan `errors` dari pemeriksa alur.
  - **Preview tim** (`AdventurePreview.tsx`) memakai data lengkap dari `GET /api/adventure/:id?level=N` dan menjalankan alur langsung di browser. Ini aman karena endpoint itu hanya untuk tim proyek. Pemain di `/play` tetap memakai alur dari server.
  - `POST /api/adventure/:id/check` (`scenes`) menjalankan pemeriksa alur tanpa menyimpan (hanya tim proyek). Dipakai editor agar aturan pemeriksa hanya ditulis di satu tempat.
  - `POST /api/adventure/:id/scenes` (`level`, `scenes`) hanya Pembuat Game yang ditugaskan, mengganti seluruh scene level itu dalam satu transaksi. Draf yang belum lengkap boleh disimpan; balasannya berisi `errors`. Level terbit dikunci seperti jenis game lain.
  - **Pemeriksa alur** (`validateAdventure` di `src/utils/adventure.ts`): tepat satu scene awal (bukan Akhir), judul dan isi terisi, Cerita punya 2–4 pilihan, Tantangan lengkap dengan kunci, semua tujuan ada dan bukan dirinya sendiri, minimal satu Akhir, ada ending dengan nilai ≥ nilai minimal lulus, semua scene tercapai dari awal, dan tidak ada putaran yang tidak pernah sampai ke Akhir. **Kirim ke Pakar ditolak** jika ada level yang belum lolos pemeriksa.

## 09 Repositori dan Alur Commit
- **Repositori:** https://github.com/fredydwi19-spec/logoslab
- **Branch kerja:** `main` (satu-satunya branch aktif). Branch `arsip/main-agustus` adalah cadangan versi Agustus 2026.
- **Alur:** kerjakan fitur → cek di browser → commit dengan judul fitur → push ke `main`. Tanpa issue dan pull request. Aturan lengkap ada di `AGENTS.md` bagian 10.
- File yang tidak boleh masuk GitHub dicatat di `.gitignore`: `.env`, `public/uploads/`, dan skrip bantu sementara.
