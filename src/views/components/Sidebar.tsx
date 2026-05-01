export const Sidebar = ({ username, role }: { username: string; role: string }) => {
  const menuItems: { label: string; icon: string; link: string }[] = [
    { label: "Dashboard", icon: "🏠", link: `/dashboard/${role.toLowerCase().split('_')[0]}` },
  ];

  if (role === "KETUA_TIM") {
    menuItems.push({ label: "Semua Proyek", icon: "📊", link: "/dashboard/projects" });
  } else if (role === "PEMBUAT_GAME") {
    menuItems.push({ label: "Proyek Saya", icon: "🎮", link: "/dashboard/game" });
  } else if (role === "PEMBUAT_MATERI") {
    menuItems.push({ label: "Proyek Saya", icon: "📚", link: "/dashboard/materi" });
  } else if (role === "PAKAR") {
    menuItems.push({ label: "Proyek Review", icon: "⚖️", link: "/dashboard/pakar" });
  } else if (role === "USER") {
    menuItems.push({ label: "Pencapaian Saya", icon: "🏆", link: "/dashboard/user" });
  }

  const roleName = role.replace('_', ' ');

  return `
    <div class="sidebar w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col">
      <div class="p-8 flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
        <span class="text-xl font-bold text-slate-800">Logos LAB</span>
      </div>
      
      <div class="flex-1 mt-4">
        <p class="px-8 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu Utama</p>
        ${menuItems.map(item => `
          <a href="${item.link}" class="flex items-center px-8 py-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <span class="mr-3 text-lg">${item.icon}</span>
            <span class="font-medium">${item.label}</span>
          </a>
        `).join('')}
      </div>

      <div class="p-4 border-t border-slate-100 bg-slate-50">
        <div class="flex items-center gap-3 p-2">
          <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            ${username.charAt(0).toUpperCase()}
          </div>
          <div class="overflow-hidden">
            <p class="text-sm font-bold text-slate-800 truncate">${username}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-tight">${roleName}</p>
          </div>
        </div>
        <a href="/api/auth/logout" class="mt-4 block w-full text-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100">
          Keluar (Logout)
        </a>
      </div>
    </div>
  `;
};
