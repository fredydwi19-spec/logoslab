export const Sidebar = ({ username, role }: { username: string; role: string }) => {
  const menuItems: { label: string; icon: string; link: string }[] = [
    { label: "Dashboard", icon: "<i class='bi bi-house'></i>", link: `/dashboard/${role.toLowerCase().split('_')[0]}` },
  ];

  if (role === "KETUA_TIM") {
    menuItems.push({ label: "Semua Proyek", icon: "<i class='bi bi-bar-chart'></i>", link: "/dashboard/projects" });
  } else if (role === "PEMBUAT_GAME") {
    menuItems.push({ label: "Proyek Dikerjakan", icon: "<i class='bi bi-controller'></i>", link: "/dashboard/game" });
  } else if (role === "PEMBUAT_MATERI") {
    menuItems.push({ label: "Proyek Saya", icon: "<i class='bi bi-book'></i>", link: "/dashboard/materi" });
  } else if (role === "PAKAR") {
    menuItems.push({ label: "Proyek Dikerjakan", icon: "<i class='bi bi-clipboard-check'></i>", link: "/dashboard/pakar" });
  } else if (role === "USER") {
    menuItems.push({ label: "Pencapaian Saya", icon: "<i class='bi bi-trophy'></i>", link: "/dashboard/user/achievements" });
    menuItems.push({ label: "Adaptive Learning", icon: "<i class='bi bi-brain'></i>", link: "/dashboard/adaptive-learning" });
  }

  return `
    <style>
      .sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .sidebar-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
      .sidebar-scroll::-webkit-scrollbar-thumb { background: #FFC107; border-radius: 4px; }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #FFD54F; }
      /* Firefox */
      .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #FFC107 rgba(0,0,0,0.2); }
    </style>
    <div class="sidebar w-48 bg-[#1A237E] h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-[100]">

      <!-- ① LOGO — fixed top -->
      <div class="flex-shrink-0 p-5 border-b border-white/10 flex flex-col items-center">
        <img src="/public/assets/logo-logoslab.png" alt="Logos LAB" class="h-10 w-auto mb-3 bg-white p-2 rounded-lg shadow-lg"/>
        <div class="text-center">
          <span class="text-base font-bold text-white tracking-widest uppercase">LOGOS LAB</span>
          <p class="text-[8px] text-[#FFC107] font-bold tracking-[0.2em] uppercase mt-1">Dashboard Portal</p>
        </div>
      </div>

      <!-- ② ALL MENUS — scrollable -->
      <div class="sidebar-scroll flex-1 overflow-y-auto py-4 space-y-1 w-full" x-data="{ openBankSoal: false }">

        <!-- Navigasi Utama -->
        <p class="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-1 opacity-50">Navigasi Utama</p>
        ${menuItems.map(item => `
          <a href="${item.link}" class="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
            <span class="mr-3 text-lg transition-transform group-hover:scale-110">${item.icon}</span>
            <span class="font-semibold uppercase tracking-wide text-xs">${item.label}</span>
          </a>
        `).join('')}

        ${(role === "KETUA_TIM" || role === "PEMBUAT_GAME") ? `
        <!-- Bank Soal Dropdown -->
        <div class="w-full">
          <button @click="openBankSoal = !openBankSoal"
            class="w-full flex items-center justify-between px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
            <div class="flex items-center">
              <span class="mr-3 text-lg transition-transform group-hover:scale-110"><i class="bi bi-bank"></i></span>
              <span class="font-semibold uppercase tracking-wide text-xs">Bank Soal</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200" :class="{'rotate-180': openBankSoal}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div x-show="openBankSoal"
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0 -translate-y-1"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-in duration-150"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="bg-black/20 pl-4 py-1 space-y-1" style="display:none;">
            <a href="/dashboard/bank-soal/quiz" class="flex items-center px-5 py-2 text-blue-200 hover:text-[#FFC107] transition-all group">
              <span class="mr-2 text-sm group-hover:scale-110 transition-transform"><i class="bi bi-pencil-square"></i></span>
              <span class="text-xs tracking-wide">Bank Soal Quiz</span>
            </a>
            <a href="/dashboard/bank-soal/ftb" class="flex items-center px-5 py-2 text-blue-200 hover:text-[#FFC107] transition-all group">
              <span class="mr-2 text-sm group-hover:scale-110 transition-transform"><i class="bi bi-fonts"></i></span>
              <span class="text-xs tracking-wide">Bank Soal FTB</span>
            </a>
            <a href="/dashboard/bank-soal/tts" class="flex items-center px-5 py-2 text-blue-200 hover:text-[#FFC107] transition-all group">
              <span class="mr-2 text-sm group-hover:scale-110 transition-transform"><i class="bi bi-puzzle"></i></span>
              <span class="text-xs tracking-wide">Bank Soal TTS</span>
            </a>
          </div>
        </div>
        ` : ''}

        <!-- Konten Publik -->
        <div class="pt-3">
          <p class="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-1 opacity-50">Konten Publik</p>
          <a href="/dashboard/games" class="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
            <span class="mr-3 text-lg group-hover:scale-110 transition-transform"><i class="bi bi-controller"></i></span>
            <span class="font-semibold uppercase tracking-wide text-xs">Game</span>
          </a>
          <a href="/dashboard/materi-list" class="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
            <span class="mr-3 text-lg group-hover:scale-110 transition-transform"><i class="bi bi-journal-richtext"></i></span>
            <span class="font-semibold uppercase tracking-wide text-xs">Materi</span>
          </a>
        </div>

        <!-- Akun -->
        <div class="pt-3">
          <p class="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-1 opacity-50">Akun</p>
          <a href="/profile" class="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
            <span class="mr-3 text-lg group-hover:scale-110 transition-transform"><i class="bi bi-person-circle"></i></span>
            <span class="font-semibold uppercase tracking-wide text-xs">Edit Profil</span>
          </a>
        </div>

      </div>

      <!-- ③ KELUAR — fixed bottom, always visible -->
      <div class="flex-shrink-0 p-4 border-t border-white/10 bg-black/30">
        <a href="/api/auth/logout"
          class="flex items-center justify-center gap-2 w-full py-3 text-[10px] font-black text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-red-900/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Keluar
        </a>
      </div>

    </div>
  `;
};
