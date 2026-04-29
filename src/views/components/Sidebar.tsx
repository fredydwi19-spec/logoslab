/** @jsx html */
import { html } from "@elysiajs/html";

export const Sidebar = ({ username, role }: { username: string; role: string }) => {
  const getRoleName = (r: string) => {
    switch (r) {
      case "KETUA_TIM": return "Ketua Tim";
      case "PEMBUAT_GAME": return "Pembuat Game";
      case "PEMBUAT_MATERI": return "Pembuat Materi";
      case "PAKAR": return "Pakar";
      default: return "Member";
    }
  };

  const menuItems = [];

  // Common items
  menuItems.push({ label: "Dashboard", icon: "🏠", link: `/dashboard/${role.toLowerCase().split('_')[0]}` });
  menuItems.push({ label: "Edit Profile", icon: "👤", link: "/dashboard/profile" });

  // Role specific items
  if (role === "KETUA_TIM") {
    menuItems.push({ label: "Semua Proyek", icon: "📊", link: "/dashboard/projects" });
    menuItems.push({ label: "Proyek Game", icon: "🎮", link: "/dashboard/projects/game", dropdown: ["Draft Review", "Accept", "Publish"] });
    menuItems.push({ label: "Proyek Materi", icon: "📚", link: "/dashboard/projects/materi", dropdown: ["Draft Review", "Accept", "Publish"] });
  } else if (role === "PEMBUAT_GAME") {
    menuItems.push({ label: "Proyek Saya", icon: "🎮", link: "/dashboard/my-projects" });
  } else if (role === "PEMBUAT_MATERI") {
    menuItems.push({ label: "Proyek Saya", icon: "📚", link: "/dashboard/my-projects" });
  } else if (role === "PAKAR") {
    menuItems.push({ label: "Proyek Saya", icon: "⚖️", link: "/dashboard/validation" });
  }

  return (
    <aside id="sidebar" class="fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform overflow-y-auto">
      <div class="flex flex-col h-full">
        {/* Brand Section */}
        <div class="px-6 py-8 border-b border-slate-800">
          <div class="flex flex-col">
            <span class="text-xl font-bold truncate">{username}</span>
            <span class="text-sm text-slate-400 font-medium">{getRoleName(role)}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav class="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <div class="space-y-1">
              <a href={item.link} class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
                <span class="text-xl">{item.icon}</span>
                <span class="font-medium text-slate-300 group-hover:text-white">{item.label}</span>
              </a>
              {item.dropdown && (
                <div class="ml-9 space-y-1 border-l border-slate-800 pl-4">
                  {item.dropdown.map(d => (
                    <a href="#" class="block py-1 text-sm text-slate-400 hover:text-white transition-colors">{d}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div class="p-4 border-t border-slate-800">
          <a href="/api/auth/logout" class="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <span>🚪</span>
            <span class="font-medium">Logout</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
