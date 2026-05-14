import { Sidebar } from "../components/Sidebar";
import { FloatingChatWidget } from "../components/FloatingChatWidget";

export const Layout = ({ children, title, username, role, notifications = [], currentPage }: { children: string; title: string; username: string; role: string; notifications?: any[]; currentPage?: string }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  // Show AI widget for all team roles (not for regular USER)
  const showChatWidget = role !== 'USER';
  const widgetPageContext = currentPage || title;
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} | Logos LAB Dashboard</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #1A237E; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #FFC107; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    </head>
    <body class="bg-[#F8FAFC] text-slate-900">
      <div class="flex">
        ${Sidebar({ username, role })}
        
        <div class="flex-1 ml-64 min-h-screen flex flex-col">
          <!-- Main Header -->
          <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-5 flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3">
               <div class="h-6 w-1 bg-[#FFC107] rounded-full"></div>
               <h1 class="text-xl font-black text-[#1A237E] uppercase tracking-widest">${title}</h1>
            </div>
            
            <div class="flex items-center gap-8">
              <!-- Notification Center -->
              <div x-data="{ open: false }" class="relative">
                <button @click="open = !open" class="relative text-slate-400 hover:text-[#1A237E] transition-all transform hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  ${unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg ring-2 ring-white">${unreadCount}</span>` : ''}
                </button>
                
                <div x-show="open" @click.away="open = false" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100" style="display:none;" class="absolute right-0 mt-4 w-96 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden ring-8 ring-black/5">
                  <div class="bg-[#1A237E] px-6 py-4 flex justify-between items-center">
                    <span class="text-xs font-black text-white uppercase tracking-widest">Pusat Notifikasi</span>
                    ${unreadCount > 0 ? `<span class="bg-[#FFC107] text-[#1A237E] text-[9px] font-black px-3 py-1 rounded-full uppercase">${unreadCount} Pesan Baru</span>` : ''}
                  </div>
                  <div class="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
                    ${notifications.length === 0 ? '<div class="p-10 text-center text-xs text-slate-400 font-bold italic uppercase tracking-widest opacity-50">Tidak ada notifikasi baru.</div>' : notifications.map(n => `
                      <a href="/dashboard/${role.toLowerCase().split('_')[0]}" class="block p-6 hover:bg-slate-50 transition-all ${!n.isRead ? 'bg-blue-50/30' : ''} group">
                        <p class="text-sm text-slate-800 ${!n.isRead ? 'font-black' : 'font-medium'} group-hover:text-[#1A237E] transition-colors">${n.message}</p>
                        <p class="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-tighter">${new Date(n.createdAt).toLocaleString('id-ID')}</p>
                      </a>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- User Profile (Corner Right) -->
              <div class="flex items-center gap-4 bg-slate-50 p-2 pr-6 rounded-full border border-slate-100 shadow-inner">
                <div class="h-10 w-10 rounded-full bg-gradient-to-br from-[#1A237E] to-blue-600 flex items-center justify-center text-white font-black shadow-lg ring-2 ring-white">
                  ${username.charAt(0).toUpperCase()}
                </div>
                <div class="text-left">
                  <div class="text-xs font-black text-[#1A237E] uppercase tracking-wide leading-none">${username}</div>
                  <div class="text-[8px] text-[#FF5722] font-black uppercase tracking-[0.2em] mt-1">${role.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
          </header>

          <!-- Main Content View -->
          <main class="flex-1 p-10">
            ${children}
          </main>

          <!-- System Footer -->
          <footer class="px-10 py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
            &copy; 2026 LOGOS LAB PRODUCTION &bull; FAITH MEETS TECHNOLOGY
          </footer>
        </div>
      </div>
      ${showChatWidget ? FloatingChatWidget({ role, currentPage: widgetPageContext }) : ''}
    </body>
    </html>
  `;
};
