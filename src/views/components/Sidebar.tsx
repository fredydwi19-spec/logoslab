export const Sidebar = ({ username, role }: { username: string; role: string }) => {
  const menuItems: { label: string; icon: string; link: string }[] = [
    { label: "Dashboard", icon: "🏠", link: `/dashboard/${role.toLowerCase().split('_')[0]}` },
  ];

  if (role === "KETUA_TIM") {
    menuItems.push({ label: "Semua Proyek", icon: "📊", link: "/dashboard/projects" });
  } else if (role === "PEMBUAT_GAME") {
    menuItems.push({ label: "Proyek Dikerjakan", icon: "🎮", link: "/dashboard/game" });
  } else if (role === "PEMBUAT_MATERI") {
    menuItems.push({ label: "Proyek Saya", icon: "📚", link: "/dashboard/materi" });
  } else if (role === "PAKAR") {
    menuItems.push({ label: "Proyek Dikerjakan", icon: "⚖️", link: "/dashboard/pakar" });
  } else if (role === "USER") {
    menuItems.push({ label: "Pencapaian Saya", icon: "🏆", link: "/dashboard/user" });
  }

  return `
    <div class="sidebar w-48 bg-[#1A237E] h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-[100]">
      <!-- Brand Area -->
      <div class="p-5 border-b border-white/10 flex flex-col items-center">
        <img src="/public/assets/logo-logoslab.png" alt="Logos LAB" class="h-10 w-auto mb-3 bg-white p-2 rounded-lg shadow-lg"/>
        <div class="text-center">
          <span class="text-base font-bold text-white tracking-widest uppercase">LOGOS LAB</span>
          <p class="text-[8px] text-[#FFC107] font-bold tracking-[0.2em] uppercase mt-1">Dashboard Portal</p>
        </div>
      </div>
      
      <!-- Menu Navigation -->
      <div class="flex-1 mt-5 space-y-1">
        <p class="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-2 opacity-50">Navigasi Utama</p>
        ${menuItems.map(item => `
          <a href="${item.link}" class="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
            <span class="mr-3 text-lg transition-transform group-hover:scale-110">${item.icon}</span>
            <span class="font-semibold uppercase tracking-wide text-xs">${item.label}</span>
          </a>
        `).join('')}
      </div>

      <!-- Action Footer -->
      <div class="p-4 space-y-2 bg-black/20 border-t border-white/5">
        <a href="/" class="flex items-center justify-center gap-2 w-full py-2.5 text-[10px] font-bold text-white bg-[#FF5722] hover:bg-[#E64A19] rounded-lg transition-all shadow-lg uppercase tracking-widest">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
           KE BERANDA
        </a>
        <a href="/api/auth/logout" class="flex items-center justify-center gap-2 w-full py-2.5 text-[10px] font-bold text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all uppercase tracking-widest border border-white/10">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           LOGOUT
        </a>
      </div>
    </div>
  `;
};
