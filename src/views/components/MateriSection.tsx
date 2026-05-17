export const MateriSection = ({ allMateris }: { allMateris: any[] }) => {
  return `
    <section class="section materi-layout" id="materi" style="background: #f8fafc; padding: 100px 0;">
      <div class="container">
        
        <div class="section__header reveal" style="text-align: center; margin-bottom: 60px;">
          <h2 class="section__title" style="color: #1A237E !important; margin: 0;">Materi Pembelajaran</h2>
          <p class="section__subtitle" style="margin: 8px 0 0 0;">Perdalam pengetahuan Anda dengan materi teks dan video</p>
        </div>
        
        <div class="materi-grid">
          ${allMateris.map(materi => `
            <a href="/materi/${materi.id}" style="text-decoration:none; color:inherit; display:block;">
              <div class="materi-card reveal">
                <div class="materi-card__img">
                  <img src="${materi.thumbnailUrl || '/public/assets/games/game1.png'}" alt="${materi.title}" onerror="this.src='/public/assets/games/game1.png'">
                  <div class="materi-card__badge ${materi.materiType === 'VIDEO' ? 'badge-video' : 'badge-teks'}">
                    ${materi.materiType === 'VIDEO' ? '🎬 Video' : '📄 Teks'}
                  </div>
                </div>
                <div class="materi-card__info">
                  <h3>${materi.title}</h3>
                  <p class="category">${materi.category || 'Edukasi'}</p>
                </div>
              </div>
            </a>
          `).join('')}
          ${allMateris.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8; font-weight: bold;">
              Belum ada materi pembelajaran yang dipublikasikan.
            </div>
          ` : ''}
        </div>

      </div>
    </section>

    <style>
      .materi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 32px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .materi-card {
        background: white;
        border-radius: 24px;
        overflow: hidden;
        border: 2px solid #e2e8f0;
        transition: all 0.3s;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .materi-card:hover {
        transform: translateY(-8px);
        border-color: #1A237E;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .materi-card__img {
        height: 160px;
        position: relative;
      }
      .materi-card__img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .materi-card__badge {
        position: absolute;
        bottom: 12px;
        right: 12px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
        backdrop-filter: blur(4px);
      }
      .badge-video {
        background: rgba(26, 35, 126, 0.9);
        color: #FFC107;
      }
      .badge-teks {
        background: rgba(255, 193, 7, 0.9);
        color: #1A237E;
      }
      .materi-card__info {
        padding: 20px;
        flex: 1;
      }
      .materi-card__info h3 {
        font-size: 18px;
        color: #1A237E;
        margin: 0 0 8px 0;
        font-weight: 800;
        line-height: 1.3;
      }
      .materi-card__info .category {
        font-size: 12px;
        color: #64748b;
        margin: 0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    </style>
  `;
};
