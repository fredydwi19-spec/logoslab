export const GamesSection = ({ allGames, popularGames }: { allGames: any[], popularGames: any[] }) => {
  return `
    <section class="section games-layout" id="games">
      <div class="container">
        <div class="games-grid-main">
          
          <!-- Left Column: All Games (70%) -->
          <div class="games-main-content">
            <div class="section__header reveal" style="text-align: left; margin-bottom: 40px;">
              <h2 class="section__title" style="color: #1A237E !important; margin: 0;">Games</h2>
              <p class="section__subtitle" style="margin: 8px 0 0 0;">Koleksi lengkap permainan edukatif Logos Lab</p>
            </div>
            
            <div class="all-games-grid">
              ${allGames.slice(0, 25).map(game => `
                <a href="javascript:void(0)" onclick="if(window.triggerPublicGame) window.triggerPublicGame(${game.id})" style="text-decoration:none; color:inherit; display:block;">
                  <div class="game-card-mini reveal">
                    <div class="game-card-mini__img">
                      <img src="/public/assets/games/game${Math.floor(Math.random() * 4) + 1}.png" alt="${game.title}">
                    </div>
                    <div class="game-card-mini__info">
                      <h3>${game.title}</h3>
                      <span>${game.category || 'General'}</span>
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>

          <!-- Right Column: Popular Games (30%) -->
          <div class="games-sidebar">
            <div class="sidebar-header">
              <h2 class="sidebar-title">Games Populer</h2>
              <div class="sidebar-line"></div>
            </div>
            
            <div class="popular-scroll-list">
              ${popularGames.slice(0, 10).map((game, index) => `
                <a href="javascript:void(0)" onclick="if(window.triggerPublicGame) window.triggerPublicGame(${game.id})" style="text-decoration:none; color:inherit; display:block;">
                  <div class="popular-item reveal">
                    <div class="popular-item__rank">${index + 1}</div>
                    <div class="popular-item__img">
                      <img src="/public/assets/games/game${Math.floor(Math.random() * 4) + 1}.png" alt="${game.title}">
                    </div>
                    <div class="popular-item__info">
                      <h4>${game.title}</h4>
                      <p>${game.category || 'Edukasi'}</p>
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    </section>

    <style>
      .games-layout {
        padding: 100px 0;
        background: white;
      }
      .games-grid-main {
        display: grid;
        grid-template-columns: 70% 30%;
        gap: 48px;
      }
      
      /* Left Column */
      .all-games-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 24px;
      }
      .game-card-mini {
        background: #f8fafc;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        transition: all 0.3s;
      }
      .game-card-mini:hover {
        transform: translateY(-5px);
        border-color: #FF5722;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      }
      .game-card-mini__img {
        height: 120px;
      }
      .game-card-mini__img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .game-card-mini__info {
        padding: 16px;
      }
      .game-card-mini__info h3 {
        font-size: 14px;
        font-weight: 700;
        color: #1A237E;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .game-card-mini__info span {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
        text-transform: uppercase;
      }

      /* Right Column */
      .games-sidebar {
        background: #1A237E;
        border-radius: 32px;
        padding: 32px;
        height: fit-content;
        position: sticky;
        top: 100px;
        color: white;
      }
      .sidebar-title {
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 12px;
        font-family: 'Poppins', sans-serif;
      }
      .sidebar-line {
        width: 40px;
        height: 4px;
        background: #FF5722;
        border-radius: 2px;
        margin-bottom: 24px;
      }
      .popular-scroll-list {
        max-height: 600px;
        overflow-y: auto;
        padding-right: 10px;
      }
      .popular-scroll-list::-webkit-scrollbar {
        width: 4px;
      }
      .popular-scroll-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
      }
      .popular-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .popular-item:last-child {
        border-bottom: none;
      }
      .popular-item__rank {
        font-size: 24px;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.2);
        min-width: 30px;
      }
      .popular-item__img {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
      }
      .popular-item__img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .popular-item__info h4 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 120px;
      }
      .popular-item__info p {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
      }

      @media (max-width: 992px) {
        .games-grid-main {
          grid-template-columns: 1fr;
        }
        .games-sidebar {
          position: static;
        }
      }
    </style>
  `;
};
