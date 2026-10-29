export const Navbar = ({ user }: { user: any }) => {
  const isLoggedIn = !!user;
  const rolePath = user?.role ? user.role.toLowerCase().split('_')[0] : 'member';

  return `
    <nav class="header__nav">
      ${isLoggedIn ? `
        <div x-data="{ openProfile: false }" class="relative">
          <button @click="openProfile = !openProfile" @click.away="openProfile = false" class="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 shadow-inner group transition-transform hover:scale-105 bg-gradient-to-br from-[#1A237E] to-blue-600 text-white font-black overflow-hidden ring-2 ring-white hover:ring-[#FFC107]">
            ${user.avatarUrl || user.profilePicture ? `<img src="${user.avatarUrl || user.profilePicture}" alt="${user.name || user.username}" class="w-full h-full object-cover">` : (user.name || user.username).charAt(0).toUpperCase()}
          </button>

          <div x-show="openProfile" style="display:none;" 
               x-transition:enter="transition ease-out duration-200"
               x-transition:enter-start="opacity-0 scale-95"
               x-transition:enter-end="opacity-100 scale-100"
               class="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
            
            <div class="p-3">
              <div class="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-[#1A237E] text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 overflow-hidden">
                  ${user.avatarUrl || user.profilePicture ? `<img src="${user.avatarUrl || user.profilePicture}" alt="${user.name || user.username}" class="w-full h-full object-cover">` : (user.name || user.username).charAt(0).toUpperCase()}
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="font-bold text-slate-800 text-sm truncate">${user.name || user.username}</span>
                  <span class="text-slate-500 text-xs truncate">${user.email || (user.username.toLowerCase().replace(/\s+/g, '') + '@logoslab.com')}</span>
                  <span class="text-[9px] font-black text-[#FF5722] mt-1 tracking-widest uppercase">${user.role ? user.role.replace('_', ' ') : 'MEMBER'}</span>
                </div>
              </div>
            </div>
            
            <div class="border-t border-slate-100 my-1"></div>
            
            <div class="p-2 space-y-1">
              <a href="/dashboard/${rolePath}" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-[#1A237E] hover:bg-slate-50 rounded-lg transition-colors font-medium">
                <i class="bi bi-grid-1x2 text-lg"></i> Dashboard Utama
              </a>
              <a href="/profile" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-[#1A237E] hover:bg-slate-50 rounded-lg transition-colors font-medium">
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
        <button class="btn-login" id="btn-login-trigger">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Masuk / Daftar
        </button>
      `}
    </nav>
    <style>
      .user-dropdown {
        position: relative;
        display: inline-block;
      }
      .user-dropdown__trigger {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 6px 6px 6px 16px;
        border-radius: 50px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .user-dropdown__trigger:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .user-dropdown__info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .user-dropdown__name {
        font-weight: 600;
        font-size: 14px;
      }
      .user-dropdown__avatar {
        width: 32px;
        height: 32px;
        background: var(--clr-accent-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        overflow: hidden;
      }
      .user-dropdown__avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .user-dropdown__menu {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 200px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        padding: 8px;
        display: none;
        flex-direction: column;
        z-index: 1000;
        border: 1px solid #eee;
        animation: slideIn 0.2s ease-out;
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .user-dropdown__menu.active {
        display: flex;
      }
      .user-dropdown__item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        color: #333;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.2s;
      }
      .user-dropdown__item:hover {
        background: #f5f5f5;
        color: var(--clr-accent-primary);
      }
      .user-dropdown__divider {
        height: 1px;
        background: #eee;
        margin: 8px 0;
      }
      .user-dropdown__item--logout {
        color: #f44336;
      }
      .user-dropdown__item--logout:hover {
        background: #fff5f5;
        color: #d32f2f;
      }
    </style>
    <script>
      (function() {
        const trigger = document.getElementById('user-dropdown-trigger');
        const menu = document.getElementById('user-dropdown-menu');
        if (trigger && menu) {
          trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
          });
          document.addEventListener('click', () => {
            menu.classList.remove('active');
          });
        }
      })();
    </script>
  `;
};
