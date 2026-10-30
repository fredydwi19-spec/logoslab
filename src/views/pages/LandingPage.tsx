import { MainLayout } from "../layouts/MainLayout";

export const LandingPage = ({ games, user }: { games: any[], user?: any }) => {
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
                    ${user.avatarUrl || user.profilePicture ? `<img src="${user.avatarUrl || user.profilePicture}" alt="${user.name || user.username}" class="w-full h-full object-cover">` : (user.name || user.username).charAt(0).toUpperCase()}
                  </button>

                  <div x-show="openProfile" style="display:none;" 
                       x-transition:enter="transition ease-out duration-200"
                       x-transition:enter-start="opacity-0 scale-95"
                       x-transition:enter-end="opacity-100 scale-100"
                       class="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    
                    <div class="p-3">
                      <div class="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 overflow-hidden">
                          ${user.avatarUrl || user.profilePicture ? `<img src="${user.avatarUrl || user.profilePicture}" alt="${user.name || user.username}" class="w-full h-full object-cover">` : (user.name || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div class="flex flex-col overflow-hidden">
                          <span class="font-bold text-slate-800 text-sm truncate">${user.name || user.username}</span>
                          <span class="text-slate-500 text-xs truncate">${user.email || (user.username.toLowerCase().replace(/\s+/g, '') + '@logoslab.com')}</span>
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
                  Masuk Workspace
                </button>
              `}
            </nav>
          </div>
        </header>

        <!-- ========== HERO SECTION ========== -->
        <section class="relative bg-gradient-to-br from-primary to-[#3949AB] text-white py-24 lg:py-32 overflow-hidden">
          <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div class="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-white/30">
              <span class="text-highlight">✨</span> Platform Edukasi Interaktif
            </div>
            <h1 class="text-4xl md:text-4xl font-black leading-tight mb-6">
              <span class="text-highlight">Edukasi Alkitab</span><br>dan Berpikir Kritis
            </h1>
            <p class="text-lg md:text-xl text-blue-100 max-w-2xl mb-10 leading-relaxed font-light">
              ${user === null 
                ? 'Bergabunglah sekarang untuk memainkan seluruh kuis Alkitab dan kumpulkan poin XP!' 
                : `Selamat datang kembali, ${user.name}! Siap melanjutkan petualangan Alkitab hari ini?`}
            </p>
            ${user === null 
              ? `<button id="btn-login-trigger-hero" onclick="document.getElementById('btn-login-trigger').click()" class="bg-white text-primary hover:bg-slate-50 px-6 py-3 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-3">
                  Masuk / Daftar Sekarang
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>`
              : `<a href="${getDashboardPath(user.role)}" class="bg-primary text-white hover:bg-blue-900 px-6 py-3 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-3">
                  Buka Dashboard Saya →
                </a>`
            }
          </div>
        </section>

        <!-- ========== SHOWCASE SECTION ========== -->
        <section id="showcase" class="py-24 bg-slate-50">
          <div class="container mx-auto px-6">
            <div class="text-center mb-16">
              <h2 class="text-4xl font-black text-primary mb-4">🎮 Showcase Game Publik</h2>
              <p class="text-slate-500 text-lg">Karya interaktif terbaik dari komunitas kreator Logos LAB</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              ${games.length === 0 ? 
                `<div class="col-span-full text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <p class="text-slate-400 font-medium text-lg">Belum ada game yang dipublikasikan.</p>
                 </div>` : 
                games.slice(0, 3).map(game => `
                  <div class="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-shadow border border-slate-100 overflow-hidden group flex flex-col">
                    <div class="h-48 bg-gradient-to-tr from-slate-100 to-slate-50 flex flex-col items-center justify-center p-6 border-b border-slate-100 relative overflow-hidden">
                      ${game.thumbnailUrl ? 
                        `<img src="${game.thumbnailUrl}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500">` : 
                        `<span class="text-6xl mb-2 transform group-hover:scale-110 transition-transform">${getGameIcon(game.gameType)}</span>`
                      }
                      <span class="absolute top-4 right-4 bg-white/90 backdrop-blur text-xs font-black px-3 py-1 rounded-full text-primary shadow-sm uppercase tracking-wider">
                        ${game.gameType?.replace('_', ' ') || 'GAME'}
                      </span>
                    </div>
                    <div class="p-6 flex-1 flex flex-col">
                      <h3 class="text-xl font-bold text-slate-800 mb-2 leading-tight">${game.title}</h3>
                      <p class="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">${game.description || 'Tidak ada deskripsi.'}</p>
                      ${user === null
                        ? `<button onclick="document.getElementById('btn-login-trigger').click()" class="btn-play-game w-full py-2 rounded-xl bg-blue-50 text-primary font-bold hover:bg-primary hover:text-white transition-colors text-center inline-block">Coba Demo</button>`
                        : `<a href="/play/${game.id}" class="btn-play-game w-full py-2 rounded-xl bg-blue-50 text-primary font-bold hover:bg-primary hover:text-white transition-colors text-center inline-block">Mainkan Sekarang</a>`
                      }
                    </div>
                  </div>
                `).join('')
              }
            </div>
            
            ${user === null ? `
            <div class="mt-16 text-center bg-blue-50 p-8 rounded-2xl border border-blue-100 max-w-3xl mx-auto">
              <h3 class="text-xl font-bold text-primary mb-4">Ingin mengakses seluruh game & materi Alkitab serta mencatat poin XP?</h3>
              <button onclick="document.getElementById('btn-login-trigger').click()" class="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
                Masuk / Daftar Sekarang
              </button>
            </div>
            ` : ''}
          </div>
        </section>

        <!-- ========== MATERI PEMBELAJARAN (RESTORED) ========== -->
        <section class="section materi" id="materi">
          <div class="container">
            <div class="section__header reveal">
              <h2 class="section__title">📚 Materi Pembelajaran</h2>
              <p class="section__subtitle">Pelajari Alkitab melalui berbagai format yang mudah dipahami</p>
            </div>
            <div class="materi__grid">

              <!-- PDF Card 1 -->
              <div class="materi-card reveal">
                <div class="materi-card__thumb">
                  <div class="materi-card__placeholder materi-card__placeholder--pdf">📖</div>
                  <div class="materi-card__overlay">
                    <div class="materi-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                  </div>
                  <span class="materi-card__type-badge materi-card__type-badge--pdf">PDF</span>
                </div>
                <div class="materi-card__body">
                  <h3 class="materi-card__title">Pengantar Perjanjian Baru</h3>
                  <p class="materi-card__desc">Memahami konteks sejarah, penulis, dan tema utama setiap kitab dalam Perjanjian Baru.</p>
                  <button class="materi-card__action materi-card__action--pdf" id="btn-baca-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    Baca
                  </button>
                </div>
              </div>

              <!-- PDF Card 2 -->
              <div class="materi-card reveal">
                <div class="materi-card__thumb">
                  <div class="materi-card__placeholder materi-card__placeholder--pdf">🧠</div>
                  <div class="materi-card__overlay">
                    <div class="materi-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                  </div>
                  <span class="materi-card__type-badge materi-card__type-badge--pdf">PDF</span>
                </div>
                <div class="materi-card__body">
                  <h3 class="materi-card__title">Dasar Berpikir Kritis</h3>
                  <p class="materi-card__desc">Panduan lengkap untuk mengembangkan kemampuan berpikir kritis dalam mempelajari teks Alkitab.</p>
                  <button class="materi-card__action materi-card__action--pdf" id="btn-baca-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    Baca
                  </button>
                </div>
              </div>

              <!-- Video Card 1 -->
              <div class="materi-card reveal">
                <div class="materi-card__thumb">
                  <div class="materi-card__placeholder materi-card__placeholder--video">🏛️</div>
                  <div class="materi-card__overlay">
                    <div class="materi-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                  <span class="materi-card__type-badge materi-card__type-badge--video">Video</span>
                </div>
                <div class="materi-card__body">
                  <h3 class="materi-card__title">Sejarah Israel Kuno</h3>
                  <p class="materi-card__desc">Perjalanan bangsa Israel dari masa Abraham hingga kehancuran Bait Allah kedua.</p>
                  <button class="materi-card__action materi-card__action--video" id="btn-tonton-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Tonton Video
                  </button>
                </div>
              </div>

              <!-- Video Card 2 -->
              <div class="materi-card reveal">
                <div class="materi-card__thumb">
                  <div class="materi-card__placeholder materi-card__placeholder--video">✝️</div>
                  <div class="materi-card__overlay">
                    <div class="materi-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                  <span class="materi-card__type-badge materi-card__type-badge--video">Video</span>
                </div>
                <div class="materi-card__body">
                  <h3 class="materi-card__title">Perumpamaan Yesus</h3>
                  <p class="materi-card__desc">Memahami makna mendalam di balik perumpamaan-perumpamaan yang diajarkan Yesus.</p>
                  <button class="materi-card__action materi-card__action--video" id="btn-tonton-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Tonton Video
                  </button>
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
                <h2 class="text-4xl font-black text-primary mb-6 leading-tight">Sistem Penjaminan Mutu & Kolaborasi Lintas Peran</h2>
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
                    <span class="text-xs font-black uppercase text-slate-400 tracking-widest">Workflow Engine</span>
                    <span class="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Secure</span>
                  </div>
                  <div class="flex flex-col gap-4">
                    <div class="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                      <span class="font-bold text-slate-700">1. Draft Created</span>
                      <i class="bi bi-arrow-right text-slate-300"></i>
                    </div>
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <span class="font-bold text-primary">2. Review Pakar</span>
                      <span class="animate-pulse bg-blue-500 w-2 h-2 rounded-full"></span>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-2xl flex justify-between items-center opacity-70">
                      <span class="font-bold text-slate-700">3. Finalisasi Ketua</span>
                      <i class="bi bi-lock text-slate-300"></i>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-2xl flex justify-between items-center opacity-70">
                      <span class="font-bold text-slate-700">4. Published</span>
                      <i class="bi bi-globe text-slate-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== ENGAGEMENT & STATS SECTION (RESTORED) ========== -->
        <section class="section stats-engagement" id="engagement">
          <div class="container">
            <div class="stats-engagement__grid">
              
              <!-- Column 1: Engagement Platform -->
              <div class="engagement reveal">
                <div class="engagement__header">
                  <h2 class="engagement__title">Engagement Platform</h2>
                  <div class="engagement__line"></div>
                </div>
                <div class="engagement__list">
                  <div class="progress-group">
                    <div class="progress-group__info">
                      <span>Games Interaktif</span>
                      <span>85%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-bar__fill" style="width: 85%"></div>
                    </div>
                  </div>
                  <div class="progress-group">
                    <div class="progress-group__info">
                      <span>Materi Video</span>
                      <span>70%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-bar__fill" style="width: 70%"></div>
                    </div>
                  </div>
                  <div class="progress-group">
                    <div class="progress-group__info">
                      <span>Membaca PDF</span>
                      <span>55%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-bar__fill" style="width: 55%"></div>
                    </div>
                  </div>
                  <div class="progress-group">
                    <div class="progress-group__info">
                      <span>Forum Diskusi</span>
                      <span>40%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-bar__fill" style="width: 40%"></div>
                    </div>
                  </div>
                </div>
                <p class="engagement__footer">Data menunjukkan bahwa metode gamifikasi sangat efektif dalam meningkatkan durasi belajar user.</p>
              </div>

              <!-- Column 2: Live Stats -->
              <div class="live-stats reveal">
                <div class="section__header" style="text-align: left; margin-bottom: var(--space-xl);">
                  <h2 class="section__title">Statistik Live</h2>
                  <p class="section__subtitle">Pertumbuhan komunitas Logos LAB</p>
                </div>
                <div class="live-stats__cards">
                  <div class="stat-card">
                    <span class="stat-card__number" id="user-count">—</span>
                    <span class="stat-card__label">Pengguna Terdaftar</span>
                  </div>
                  <div class="stat-card">
                    <span class="stat-card__number" id="visit-count">—</span>
                    <span class="stat-card__label">Total Kunjungan</span>
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

function getGameIcon(type: string) {
  switch(type) {
    case 'QUIZ': return '🎯';
    case 'FILL_THE_BLANK': return '🧩';
    case 'WORD_SEARCH': return '🔎';
    case 'CROSSWORD': return '📝';
    case 'ADVENTURE': return '🧭';
    default: return '🎮';
  }
}

function getDashboardPath(role: string) {
  if (role === 'KETUA_TIM') return '/dashboard/ketua';
  if (role === 'PEMBUAT_GAME' || role === 'PEMBUAT_MATERI') return '/dashboard/pembuat';
  if (role === 'PAKAR') return '/dashboard/pakar';
  return '/dashboard/member';
}

