export const PersonalizedGames = ({ games }: { games: any[] }) => {
  if (games.length === 0) return '';

  return `
    <section class="section personalized-games" id="personalized-games">
      <div class="container">
        <div class="section__header reveal">
          <h2 class="section__title" style="color: #1A237E !important; opacity: 1 !important;">✨ Games Untuk Kamu</h2>
          <p class="section__subtitle" style="color: #64748b !important;">Berdasarkan minat yang kamu pilih</p>
        </div>
        
        <div class="personalized-carousel-wrapper reveal">
          <div class="personalized-carousel-track" id="personalized-track">
            ${games.map(game => `
              <div class="personalized-card">
                <div class="personalized-card__badge">${game.category}</div>
                <div class="personalized-card__img-container">
                  <img src="/public/assets/games/game${Math.floor(Math.random() * 4) + 1}.png" alt="${game.title}">
                </div>
                <div class="personalized-card__content">
                  <h3 class="personalized-card__title">${game.title}</h3>
                  <span class="personalized-card__tag">Rekomendasi</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="personalized-controls">
            <button class="p-control-btn prev" onclick="document.getElementById('personalized-track').scrollBy({left: -300, behavior: 'smooth'})">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="p-control-btn next" onclick="document.getElementById('personalized-track').scrollBy({left: 300, behavior: 'smooth'})">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <style>
      .personalized-games {
        background: #f8fafc;
        padding: 80px 0;
        position: relative;
        overflow: hidden;
      }
      .personalized-carousel-wrapper {
        position: relative;
        margin-top: 40px;
      }
      .personalized-carousel-track {
        display: flex;
        gap: 24px;
        overflow-x: auto;
        scroll-behavior: smooth;
        padding: 20px 0;
        scrollbar-width: none; /* Firefox */
      }
      .personalized-carousel-track::-webkit-scrollbar {
        display: none; /* Chrome/Safari */
      }
      .personalized-card {
        flex: 0 0 280px;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        position: relative;
      }
      .personalized-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border-color: #FF5722;
      }
      .personalized-card__badge {
        position: absolute;
        top: 16px;
        left: 16px;
        background: #FF5722;
        color: white;
        padding: 4px 12px;
        border-radius: 50px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        z-index: 10;
      }
      .personalized-card__img-container {
        height: 180px;
        overflow: hidden;
      }
      .personalized-card__img-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .personalized-card__content {
        padding: 20px;
      }
      .personalized-card__title {
        font-size: 16px;
        font-weight: 700;
        color: #1A237E;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .personalized-card__tag {
        font-size: 12px;
        color: #FF5722;
        font-weight: 600;
      }
      .personalized-controls {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 30px;
      }
      .p-control-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: white;
        border: 1px solid #e2e8f0;
        color: #1A237E;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .p-control-btn:hover {
        background: #1A237E;
        color: white;
        border-color: #1A237E;
      }
    </style>
  `;
};
