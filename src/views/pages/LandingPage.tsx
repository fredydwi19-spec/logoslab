import { MainLayout } from "../layouts/MainLayout";
import { escapeHtml } from "../../utils/html";

type LandingStats = { players: number; plays: number; playsByType: { gameType: string; total: number }[] };

const GAME_TYPE_LABELS: Record<string, string> = {
  QUIZ: "Quiz", FILL_THE_BLANK: "Fill the Blank", WORD_SEARCH: "Word Search", CROSSWORD: "Teka-Teki Silang", ADVENTURE: "Adventure Studi Kasus",
};

const GAME_COVERS: Record<string, { icon: string; cover: string; iconColor: string }> = {
  QUIZ: { icon: "bi-patch-question-fill", cover: "bg-primary", iconColor: "text-highlight" },
  FILL_THE_BLANK: { icon: "bi-input-cursor-text", cover: "bg-accent", iconColor: "text-white" },
  WORD_SEARCH: { icon: "bi-search", cover: "bg-highlight", iconColor: "text-primary" },
  CROSSWORD: { icon: "bi-grid-3x3-gap-fill", cover: "bg-primary-dark", iconColor: "text-highlight" },
  ADVENTURE: { icon: "bi-signpost-split-fill", cover: "bg-success", iconColor: "text-white" },
};
const coverOf = (type: string | null) => GAME_COVERS[type ?? ""] ?? { icon: "bi-controller", cover: "bg-primary", iconColor: "text-highlight" };

const renderGameCard = (game: any) => {
  const c = coverOf(game.gameType);
  const levels = game.publishedLevelCount > 1 ? `<span class="bg-slate-100 px-2 py-1 rounded-lg"><i class="bi bi-layers"></i> ${game.publishedLevelCount} level</span>` : "";
  return `
                  <div class="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all hover:-translate-y-1 border border-slate-100 overflow-hidden group flex flex-col">
                    <div class="h-40 relative overflow-hidden flex items-center justify-center ${game.thumbnailUrl ? "bg-slate-100" : c.cover}">
                      ${game.thumbnailUrl
                        ? `<img src="${escapeHtml(game.thumbnailUrl)}" alt="Sampul ${escapeHtml(game.title)}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                        : `<i class="bi ${c.icon} ${c.iconColor} absolute -right-6 -bottom-8 text-[9rem] opacity-15"></i><i class="bi ${c.icon} ${c.iconColor} text-6xl group-hover:scale-110 transition-transform"></i>`}
                      <span class="absolute bottom-3 left-3 bg-white/95 text-[10px] font-black px-3 py-1 rounded-full text-primary shadow uppercase tracking-widest">${GAME_TYPE_LABELS[game.gameType] ?? "Game"}</span>
                    </div>
                    <div class="p-5 flex-1 flex flex-col">
                      <h3 class="text-lg font-black text-slate-800 mb-1 leading-tight line-clamp-2">${escapeHtml(game.title)}</h3>
                      <p class="text-slate-500 text-sm mb-3 line-clamp-2">${escapeHtml(game.description || "Tidak ada deskripsi.")}</p>
                      <div class="flex flex-wrap gap-2 mb-4 text-[11px] font-bold text-slate-500">${levels}</div>
                      <a href="/play/${Number(game.id)}" class="mt-auto w-full py-3 rounded-xl bg-primary text-highlight font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-colors text-center flex items-center justify-center gap-2"><i class="bi bi-play-fill text-base"></i> Coba Main</a>
                    </div>
                  </div>`;
};

const renderMaterialCard = (m: any) => `
                  <a href="/materi/${Number(m.id)}" class="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100 overflow-hidden flex flex-col group">
                    <div class="h-32 bg-primary-dark relative flex items-center justify-center overflow-hidden">
                      ${m.thumbnailUrl
                        ? `<img src="${escapeHtml(m.thumbnailUrl)}" alt="Sampul ${escapeHtml(m.title)}" class="absolute inset-0 w-full h-full object-cover">`
                        : `<i class="bi bi-book-half text-highlight text-5xl group-hover:scale-110 transition-transform"></i>`}
                    </div>
                    <div class="p-5 flex-1 flex flex-col">
                      <h3 class="font-black text-slate-800 leading-tight mb-1 line-clamp-2">${escapeHtml(m.title)}</h3>
                      <p class="text-slate-500 text-sm line-clamp-2 mb-3">${escapeHtml(m.description || "")}</p>
                      <span class="mt-auto text-accent font-black text-xs uppercase tracking-widest flex items-center gap-1">Baca materi <i class="bi bi-arrow-right"></i></span>
                    </div>
                  </a>`;

// Persentase asli permainan per jenis game, dihitung dari log permainan
const renderPlaysByType = (stats: LandingStats) => {
  if (stats.plays === 0) return `<p class="engagement__footer">Belum ada permainan yang tercatat.</p>`;
  return stats.playsByType.map(({ gameType, total }) => {
    const percent = Math.round((total * 100) / stats.plays);
    return `
                  <div class="progress-group">
                    <div class="progress-group__info">
                      <span>${GAME_TYPE_LABELS[gameType] ?? gameType}</span>
                      <span>${percent}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-bar__fill" style="width: ${percent}%"></div>
                    </div>
                  </div>`;
  }).join("");
};

export const LandingPage = ({ games, materials, user, stats }: { games: any[], materials: any[], user?: any, stats: LandingStats }) => {
  // Tombol utama: langsung main game terbaru (Level 1 bisa dimainkan tanpa login)
  const tryHref = games.length > 0 ? `/play/${Number(games[0].id)}` : "#showcase";
  return MainLayout({
    title: "Logos LAB — Edukasi Alkitab dan Berpikir Kritis",
    children: `
      <div>
        <!-- ========== HEADER ========== -->
        <header class="header bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all">
          <div class="container mx-auto p-2 text-sm.5 text-sm rounded-lg flex justify-between items-center">
            <a href="/" class="flex items-center gap-3">
              <img src="/public/assets/logo.png" alt="Logos LAB Logo" class="h-10 w-10">
              <span class="font-black text-2xl text-primary tracking-tight">Logos LAB</span>
            </a>
            <nav class="flex items-center">
              ${user ? `
                <div x-data="{ openProfile: false }" class="relative">
                  <button @click="openProfile = !openProfile" @click.away="openProfile = false" class="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 shadow-inner group transition-transform hover:scale-105 bg-gradient-to-br from-primary to-blue-600 text-white font-black overflow-hidden ring-2 ring-white hover:ring-highlight">
                    ${user.avatarUrl || user.profilePicture ? `<img src="${escapeHtml(user.avatarUrl || user.profilePicture)}" alt="${escapeHtml(user.name || user.username)}" class="w-full h-full object-cover">` : escapeHtml((user.name || user.username).charAt(0).toUpperCase())}
                  </button>

                  <div x-show="openProfile" style="display:none;" 
                       x-transition:enter="transition ease-out duration-200"
                       x-transition:enter-start="opacity-0 scale-95"
                       x-transition:enter-end="opacity-100 scale-100"
                       class="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    
                    <div class="p-3">
                      <div class="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 overflow-hidden">
                          ${user.avatarUrl || user.profilePicture ? `<img src="${escapeHtml(user.avatarUrl || user.profilePicture)}" alt="${escapeHtml(user.name || user.username)}" class="w-full h-full object-cover">` : escapeHtml((user.name || user.username).charAt(0).toUpperCase())}
                        </div>
                        <div class="flex flex-col overflow-hidden">
                          <span class="font-bold text-slate-800 text-sm truncate">${escapeHtml(user.name || user.username)}</span>
                          ${user.email ? `<span class="text-slate-500 text-xs truncate">${escapeHtml(user.email)}</span>` : ""}
                          <span class="text-[9px] font-black text-accent mt-1 tracking-widest uppercase">${user.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="border-t border-slate-100 my-1"></div>
                    
                    <div class="p-2 space-y-1">
                      <a href="${getDashboardPath(user.role)}" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors font-medium">
                        <i class="bi bi-grid-1x2 text-lg"></i> Dashboard Utama
                      </a>
                      <a href="/profile" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors font-medium">
                        <i class="bi bi-person-gear text-lg"></i> Pengaturan Profil
                      </a>
                    </div>
                    
                    <div class="border-t border-slate-100 my-1"></div>
                    
                    <div class="p-2">
                      <a href="/api/auth/logout" class="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold">
                        <i class="bi bi-box-arrow-right text-lg"></i> Keluar
                      </a>
                    </div>
                  </div>
                </div>
              ` : `
                <button id="btn-login-trigger" class="bg-accent hover:bg-accent-hover text-white p-2 text-sm.5 text-sm rounded-lg rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Masuk / Daftar
                </button>
              `}
            </nav>
          </div>
        </header>

        <!-- ========== HERO: ajakan bermain untuk mahasiswa ========== -->
        <section class="relative bg-gradient-to-br from-primary to-primary-dark text-white py-20 lg:py-28 overflow-hidden">
          <i class="bi bi-patch-question-fill absolute -left-10 top-10 text-[12rem] text-white opacity-5"></i>
          <i class="bi bi-signpost-split-fill absolute -right-10 bottom-0 text-[14rem] text-white opacity-5"></i>
          <div class="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            <div class="inline-flex items-center gap-2 bg-white/15 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-white/25">
              <i class="bi bi-controller text-highlight"></i> Game edukasi Alkitab untuk mahasiswa
            </div>
            <h1 class="text-4xl md:text-5xl font-black leading-tight mb-5">
              Uji pemahaman Alkitabmu<br><span class="text-highlight">sambil bermain</span>
            </h1>
            <p class="text-lg md:text-xl text-white/80 max-w-2xl mb-8 leading-relaxed">
              ${user
                ? `Selamat datang kembali, ${escapeHtml(user.name)}! Lanjutkan levelmu dan kejar streak terbaikmu hari ini.`
                : "Quiz berwaktu, teka-teki silang, cari kata, dan studi kasus bercabang. Naik level, kumpulkan XP, lalu tantang temanmu."}
            </p>
            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              ${user
                ? (user.role === "USER"
                  ? `<a href="/dashboard/games" class="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2"><i class="bi bi-play-fill"></i> Lanjutkan Bermain</a>`
                  : `<a href="${getDashboardPath(user.role)}" class="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2"><i class="bi bi-grid-1x2-fill"></i> Buka Dashboard</a>`)
                : `<a href="${tryHref}" class="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2"><i class="bi bi-play-fill"></i> Coba Main Sekarang</a>
                   <button type="button" onclick="document.getElementById('btn-login-trigger').click()" class="bg-white/10 hover:bg-white/20 border-2 border-white/40 text-white px-8 py-4 rounded-full font-bold text-lg transition-all">Daftar Gratis</button>`}
            </div>
            ${user ? "" : `<p class="mt-4 text-sm text-white/70"><i class="bi bi-check-circle-fill text-highlight"></i> Gratis, tanpa daftar: Level 1 setiap game langsung bisa dimainkan</p>`}
            <div class="mt-10 flex flex-wrap justify-center gap-2 text-xs font-bold">
              ${Object.entries(GAME_TYPE_LABELS).map(([type, label]) => `<span class="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1"><i class="bi ${coverOf(type).icon} text-highlight"></i> ${label}</span>`).join("")}
            </div>
          </div>
        </section>

        <!-- ========== CARA BERMAIN ========== -->
        <section class="py-16 bg-white">
          <div class="container mx-auto px-6">
            <h2 class="text-3xl font-black text-primary text-center mb-10">Cara bermain</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              ${[
                ["bi-grid-fill", "1. Pilih game", "Quiz, Fill the Blank, Word Search, Teka-Teki Silang, atau Adventure Studi Kasus."],
                ["bi-stopwatch-fill", "2. Jawab dan pelajari", "Kejar waktu dan streak. Setiap jawaban langsung dibahas, jadi kamu belajar dari yang salah."],
                ["bi-trophy-fill", "3. Naik level", "Lulus untuk membuka level berikutnya, kumpulkan XP, tulis refleksi, dan tantang temanmu duel."],
              ].map(([icon, title, text]) => `
              <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div class="h-12 w-12 rounded-xl bg-highlight text-primary flex items-center justify-center text-2xl mb-4"><i class="bi ${icon}"></i></div>
                <h3 class="font-black text-primary text-lg mb-2">${title}</h3>
                <p class="text-slate-600 text-sm leading-relaxed">${text}</p>
              </div>`).join("")}
            </div>
          </div>
        </section>

        <!-- ========== GAME PILIHAN ========== -->
        <section id="showcase" class="py-20 bg-slate-50">
          <div class="container mx-auto px-6">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-4xl font-black text-primary mb-3">Game yang bisa kamu mainkan</h2>
              <p class="text-slate-500 text-lg">Semua konten sudah diperiksa Pakar Teologi sebelum terbit</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${games.length === 0
                ? `<div class="col-span-full text-center p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200"><i class="bi bi-hourglass-split text-4xl text-slate-300"></i><p class="text-slate-500 font-bold mt-3">Game pertama sedang disiapkan tim Logos LAB. Kembali lagi segera!</p></div>`
                : games.map(renderGameCard).join("")}
            </div>
            ${user === null ? `
            <div class="mt-14 text-center bg-white p-8 rounded-2xl border border-slate-200 max-w-3xl mx-auto shadow-sm">
              <h3 class="text-xl font-black text-primary mb-2">Mau skor dan XP-mu tersimpan?</h3>
              <p class="text-slate-500 mb-5">Daftar gratis untuk membuka semua level, mengikuti duel, dan menulis jurnal refleksi.</p>
              <button type="button" onclick="document.getElementById('btn-login-trigger').click()" class="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all">Daftar / Masuk</button>
            </div>` : ""}
          </div>
        </section>

${materials.length > 0 ? `        <!-- ========== MATERI TERBIT ========== -->
        <section class="py-20 bg-white" id="materi">
          <div class="container mx-auto px-6">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-4xl font-black text-primary mb-3">Materi pembelajaran</h2>
              <p class="text-slate-500 text-lg">Bacaan pendamping untuk memperdalam pemahamanmu</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              ${materials.map(renderMaterialCard).join("")}
            </div>
          </div>
        </section>
` : ""}
        <!-- ========== ENGAGEMENT & STATS SECTION (RESTORED) ========== -->
        <section class="section stats-engagement" id="engagement">
          <div class="container">
            <div class="stats-engagement__grid">
              
              <!-- Column 1: Engagement Platform -->
              <div class="engagement reveal">
                <div class="engagement__header">
                  <h2 class="engagement__title">Game Paling Sering Dimainkan</h2>
                  <div class="engagement__line"></div>
                </div>
                <div class="engagement__list">${renderPlaysByType(stats)}
                </div>
                <p class="engagement__footer">Persentase dari seluruh permainan yang tercatat di Logos LAB.</p>
              </div>

              <!-- Column 2: Live Stats -->
              <div class="live-stats reveal">
                <div class="section__header" style="text-align: left; margin-bottom: var(--space-xl);">
                  <h2 class="section__title">Statistik Live</h2>
                  <p class="section__subtitle">Pertumbuhan komunitas Logos LAB</p>
                </div>
                <div class="live-stats__cards">
                  <div class="stat-card">
                    <span class="stat-card__number" data-count="${stats.players}">${stats.players.toLocaleString("id-ID")}</span>
                    <span class="stat-card__label">Pemain Terdaftar</span>
                  </div>
                  <div class="stat-card">
                    <span class="stat-card__number" data-count="${stats.plays}">${stats.plays.toLocaleString("id-ID")}</span>
                    <span class="stat-card__label">Total Permainan</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- ========== PENJAMINAN MUTU SECTION ========== -->
        <section class="py-24 bg-white relative overflow-hidden">
          <div class="container mx-auto px-6 relative z-10">
            <div class="flex flex-col lg:flex-row items-center gap-16">
              <div class="lg:w-1/2">
                <h2 class="text-4xl font-black text-primary mb-6 leading-tight">Setiap konten diperiksa sebelum kamu mainkan</h2>
                <p class="text-slate-600 text-lg leading-relaxed mb-8">
                  Setiap konten di Logos LAB tidak diterbitkan sembarangan. Kami menerapkan sistem penjaminan mutu teologis berlapis untuk memastikan kebenaran, akurasi, dan relevansi.
                </p>
                <div class="flex flex-col gap-6">
                  <div class="flex gap-4 items-start">
                    <div class="bg-blue-100 text-blue-600 p-3 rounded-2xl"><i class="bi bi-pencil-square text-2xl"></i></div>
                    <div>
                      <h4 class="font-bold text-slate-800 text-lg">Kreator (Pembuat Game/Materi)</h4>
                      <p class="text-slate-500 text-sm mt-1">Merancang soal interaktif dan konten edukasi dengan bantuan AI dan import Excel.</p>
                    </div>
                  </div>
                  <div class="flex gap-4 items-start">
                    <div class="bg-amber-100 text-amber-600 p-3 rounded-2xl"><i class="bi bi-shield-check text-2xl"></i></div>
                    <div>
                      <h4 class="font-bold text-slate-800 text-lg">Pakar (Reviewer Teologi)</h4>
                      <p class="text-slate-500 text-sm mt-1">Menguji coba dan mengaudit setiap materi untuk memastikan tidak ada kesesatan pemahaman.</p>
                    </div>
                  </div>
                  <div class="flex gap-4 items-start">
                    <div class="bg-emerald-100 text-emerald-600 p-3 rounded-2xl"><i class="bi bi-check2-all text-2xl"></i></div>
                    <div>
                      <h4 class="font-bold text-slate-800 text-lg">Ketua Tim (Admin)</h4>
                      <p class="text-slate-500 text-sm mt-1">Melakukan validasi final dan menerbitkan konten untuk dapat dinikmati publik secara gratis.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="lg:w-1/2 relative">
                <div class="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[3rem] transform rotate-3"></div>
                <div class="bg-white p-5 rounded-[3rem] shadow-xl relative border border-slate-100">
                  <div class="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                    <span class="text-xs font-black uppercase text-slate-400 tracking-widest">Alur terbit konten</span>
                    <span class="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Terjaga</span>
                  </div>
                  <div class="flex flex-col gap-4">
                    <div class="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                      <span class="font-bold text-slate-700">1. Ditulis kreator</span>
                      <i class="bi bi-arrow-right text-slate-300"></i>
                    </div>
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <span class="font-bold text-primary">2. Diperiksa Pakar</span>
                      <span class="animate-pulse bg-blue-500 w-2 h-2 rounded-full"></span>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-2xl flex justify-between items-center opacity-70">
                      <span class="font-bold text-slate-700">3. Disetujui Ketua</span>
                      <i class="bi bi-lock text-slate-300"></i>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-2xl flex justify-between items-center opacity-70">
                      <span class="font-bold text-slate-700">4. Terbit untukmu</span>
                      <i class="bi bi-globe text-slate-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <!-- ========== BIBLE VERSE SECTION (RESTORED) ========== -->
        <section class="verse-section" id="verse">
          <div class="verse-section__overlay"></div>
          <div class="container">
            <div class="verse-section__content reveal">
              <h2 class="verse-section__title">Membangun Generasi Berakal Budi</h2>
              <p class="verse-section__text">
                "Tetapi ujilah segala sesuatu dan peganglah yang baik." — 1 Tesalonika 5:21
              </p>
            </div>
          </div>
        </section>

        <!-- ========== FOOTER ========== -->
        <footer class="bg-slate-900 text-slate-400 py-12">
          <div class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-3">
              <img src="/public/assets/logo.png" alt="Logos LAB Logo" class="h-8 w-8 opacity-80 grayscale">
              <span class="font-bold text-white text-xl">Logos LAB</span>
            </div>
            <p class="text-sm">© 2026 Faith Meets Technology. All rights reserved.</p>
            <div class="flex gap-4">
              <a href="#" class="hover:text-white transition-colors"><i class="bi bi-instagram"></i></a>
              <a href="#" class="hover:text-white transition-colors"><i class="bi bi-youtube"></i></a>
              <a href="#" class="hover:text-white transition-colors"><i class="bi bi-globe"></i></a>
            </div>
          </div>
        </footer>

        <!-- ========== UNIFIED AUTH MODAL ========== -->
        <div class="auth-modal" id="auth-modal">
          <div class="auth-container" id="auth-container">
            <button class="close-auth" id="auth-modal-close">&times;</button>
            
            <div class="form-container sign-up-container">
              <form action="#" id="signup-form">
                <h2>Buat Akun</h2>
                <div class="social-container">
                  <a href="/api/auth/google" class="social"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20"></a>
                </div>
                <span>atau gunakan email untuk registrasi</span>
                <input type="text" name="name" placeholder="Nama Lengkap" required />
                <input type="email" name="email" placeholder="Email" required />
                <input type="password" name="password" placeholder="Password" required />
                <input type="password" name="password_confirm" placeholder="Konfirmasi Password" required />
                <div id="signup-error" class="form-error" style="display: none; color: red; font-size: 12px; margin-top: 5px;"></div>
                <div id="signup-success" class="form-success" style="display: none; color: green; font-size: 12px; margin-top: 5px;"></div>
                <button type="submit" class="primary-btn" id="signup-submit-btn">Daftar</button>
              </form>
            </div>
            
            <div class="form-container sign-in-container">
              <form action="#" id="login-form">
                <h2>Masuk</h2>
                <div class="social-container">
                  <a href="/api/auth/google" class="social"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20"></a>
                </div>
                <span>atau gunakan akun email Anda</span>
                <input type="text" name="username" placeholder="Email/Username" required />
                <input type="password" name="password" placeholder="Password" required />
                <a href="#">Lupa password?</a>
                <div id="login-error" class="form-error" style="display: none; color: red; font-size: 12px; margin-bottom: 5px;"></div>
                <button type="submit" class="primary-btn" id="login-submit-btn">Masuk</button>
              </form>
            </div>
            
            <div class="overlay-container">
              <div class="overlay">
                <div class="overlay-panel overlay-left">
                  <h2>Selamat Datang Kembali!</h2>
                  <p>Untuk tetap terhubung dengan kami, silakan login dengan info personal Anda</p>
                  <button class="ghost-btn" id="signIn">Masuk</button>
                </div>
                <div class="overlay-panel overlay-right">
                  <h2>Halo, Teman!</h2>
                  <p>Daftarkan data personal Anda dan mulai perjalanan bersama Logos LAB</p>
                  <button class="ghost-btn" id="signUp">Daftar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `
  });
};

function getDashboardPath(role: string) {
  if (role === 'KETUA_TIM') return '/dashboard/ketua';
  if (role === 'PEMBUAT_GAME' || role === 'PEMBUAT_MATERI') return '/dashboard/pembuat';
  if (role === 'PAKAR') return '/dashboard/pakar';
  return '/dashboard/member';
}

