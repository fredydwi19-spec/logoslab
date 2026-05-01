export const Navbar = ({ user }: { user: any }) => {
  const isLoggedIn = !!user;
  const rolePath = user?.role ? user.role.toLowerCase().split('_')[0] : 'member';

  return `
    <nav class="header__nav">
      ${isLoggedIn ? `
        <div class="user-dropdown" id="user-dropdown">
          <button class="user-dropdown__trigger" id="user-dropdown-trigger">
            <div class="user-dropdown__info">
              <span class="user-dropdown__name">${user.name || user.username}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div class="user-dropdown__avatar">
              ${user.profilePicture ? `<img src="${user.profilePicture}" alt="${user.username}">` : user.username.charAt(0).toUpperCase()}
            </div>
          </button>
          <div class="user-dropdown__menu" id="user-dropdown-menu">
            <a href="/dashboard/${rolePath}" class="user-dropdown__item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </a>
            <a href="/profile/edit" class="user-dropdown__item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Edit Profil
            </a>
            <div class="user-dropdown__divider"></div>
            <a href="/api/auth/logout" class="user-dropdown__item user-dropdown__item--logout">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Keluar
            </a>
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
