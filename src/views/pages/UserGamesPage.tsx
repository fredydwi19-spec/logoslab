export const UserGamesPage = ({ games }: { games: any[] }) => {
  const gamesJson = JSON.stringify(games).replace(/</g, '\\u003c');

  return `
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('userGamesData', function() {
          return {
            items: ${gamesJson},
            search: '',
            filterType: 'ALL', // ALL, IN_PROGRESS, atau jenis game

            // Sampul bawaan per jenis game (dipakai jika game belum punya gambar sampul)
            TYPES: {
              QUIZ: { label: 'Quiz', icon: 'bi-patch-question-fill', cover: 'bg-primary', iconColor: 'text-highlight' },
              FILL_THE_BLANK: { label: 'Fill the Blank', icon: 'bi-input-cursor-text', cover: 'bg-accent', iconColor: 'text-white' },
              WORD_SEARCH: { label: 'Word Search', icon: 'bi-search', cover: 'bg-highlight', iconColor: 'text-primary' },
              CROSSWORD: { label: 'Teka-Teki Silang', icon: 'bi-grid-3x3-gap-fill', cover: 'bg-primary-dark', iconColor: 'text-highlight' },
              ADVENTURE: { label: 'Adventure Studi Kasus', icon: 'bi-signpost-split-fill', cover: 'bg-success', iconColor: 'text-white' }
            },

            typeInfo(type) {
              return this.TYPES[type] || { label: 'Game', icon: 'bi-controller', cover: 'bg-primary', iconColor: 'text-highlight' };
            },

            get availableTypes() {
              return [...new Set(this.items.map(i => i.gameType).filter(Boolean))];
            },

            // Status pemain untuk satu game
            status(game) {
              if (!game.played) return 'NEW';
              if (game.levelCount > 0 && game.passedLevels >= game.levelCount) return 'DONE';
              return 'IN_PROGRESS';
            },

            actionLabel(game) {
              return { NEW: 'Mainkan', IN_PROGRESS: 'Lanjutkan', DONE: 'Main Lagi' }[this.status(game)];
            },

            progressPercent(game) {
              return game.levelCount > 0 ? Math.round(game.passedLevels * 100 / game.levelCount) : 0;
            },

            // Game yang sedang dimainkan tampil paling depan
            get filteredItems() {
              const q = this.search.trim().toLowerCase();
              const order = { IN_PROGRESS: 0, NEW: 1, DONE: 2 };
              return this.items
                .filter(g => !q || (g.title || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q))
                .filter(g => this.filterType === 'ALL' || (this.filterType === 'IN_PROGRESS' ? this.status(g) === 'IN_PROGRESS' : g.gameType === this.filterType))
                .sort((a, b) => order[this.status(a)] - order[this.status(b)]);
            }
          }
        });
      });
    </script>

    <div x-data="userGamesData()" class="space-y-6">

      <!-- Cari dan filter -->
      <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div class="relative">
          <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" x-model="search" placeholder="Cari game..." class="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0 transition-colors font-medium">
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" @click="filterType = 'ALL'" class="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all" :class="filterType === 'ALL' ? 'bg-primary text-highlight' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'">Semua</button>
          <button type="button" x-show="items.some(g => status(g) === 'IN_PROGRESS')" @click="filterType = 'IN_PROGRESS'" class="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all" :class="filterType === 'IN_PROGRESS' ? 'bg-primary text-highlight' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'"><i class="bi bi-hourglass-split"></i> Sedang Dimainkan</button>
          <template x-for="type in availableTypes" :key="type">
            <button type="button" @click="filterType = type" class="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all" :class="filterType === type ? 'bg-primary text-highlight' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'">
              <i class="bi" :class="typeInfo(type).icon"></i> <span x-text="typeInfo(type).label"></span>
            </button>
          </template>
        </div>
      </div>

      <!-- Kartu game -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <template x-for="game in filteredItems" :key="game.id">
          <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden group flex flex-col hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div class="h-40 relative overflow-hidden flex items-center justify-center" :class="game.thumbnailUrl ? 'bg-slate-100' : typeInfo(game.gameType).cover">
              <template x-if="game.thumbnailUrl">
                <img :src="game.thumbnailUrl" :alt="'Sampul ' + game.title" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              </template>
              <template x-if="!game.thumbnailUrl">
                <div class="w-full h-full flex items-center justify-center relative">
                  <i class="bi absolute -right-6 -bottom-8 text-[9rem] opacity-15" :class="[typeInfo(game.gameType).icon, typeInfo(game.gameType).iconColor]"></i>
                  <i class="bi text-6xl transform group-hover:scale-110 transition-transform" :class="[typeInfo(game.gameType).icon, typeInfo(game.gameType).iconColor]"></i>
                </div>
              </template>
              <span class="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate bg-white/95 text-[10px] font-black px-3 py-1 rounded-full text-primary shadow uppercase tracking-widest" x-text="typeInfo(game.gameType).label"></span>
              <span x-show="status(game) === 'DONE'" class="absolute top-3 right-3 bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow uppercase tracking-widest"><i class="bi bi-patch-check-fill"></i> Selesai</span>
              <span x-show="status(game) === 'NEW'" class="absolute top-3 right-3 bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full shadow uppercase tracking-widest">Belum dimainkan</span>
            </div>

            <div class="p-5 flex flex-col flex-1">
              <h3 class="text-lg font-black text-slate-800 mb-1 leading-tight line-clamp-2" x-text="game.title"></h3>
              <p class="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed" x-text="game.description || 'Tidak ada deskripsi.'"></p>
              <div class="flex flex-wrap gap-2 mb-4 text-[11px] font-bold text-slate-500">
                <span class="bg-slate-100 px-2 py-1 rounded-lg"><i class="bi bi-layers"></i> <span x-text="game.levelCount + ' level'"></span></span>
                <span x-show="game.questionCount" class="bg-slate-100 px-2 py-1 rounded-lg"><i class="bi bi-list-check"></i> <span x-text="game.questionCount + ' soal'"></span></span>
              </div>

              <!-- Progres level pemain -->
              <div class="mt-auto mb-4" x-show="game.played">
                <div class="flex justify-between text-[11px] font-black text-slate-500 mb-1">
                  <span>Progres</span>
                  <span x-text="game.passedLevels + ' dari ' + game.levelCount + ' level lulus'"></span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" :class="status(game) === 'DONE' ? 'bg-green-500' : 'bg-highlight'" :style="'width: ' + progressPercent(game) + '%'"></div>
                </div>
              </div>

              <div class="flex gap-2" :class="game.played ? '' : 'mt-auto'">
                <a :href="'/play/' + game.id" class="flex-1 text-center py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                   :class="status(game) === 'IN_PROGRESS' ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-primary text-highlight hover:bg-primary-dark'">
                  <i class="bi text-base" :class="status(game) === 'DONE' ? 'bi-arrow-repeat' : 'bi-play-fill'"></i> <span x-text="actionLabel(game)"></span>
                </a>
                <a x-show="game.gameType === 'QUIZ'" :href="'/play/' + game.id" class="bg-white text-accent px-4 py-3 rounded-xl font-bold hover:bg-accent hover:text-white transition-colors shadow-sm flex items-center justify-center border-2 border-accent" title="Mainkan, lalu tantang teman dengan skor kamu (Duel)" aria-label="Duel">
                  <i class="bi bi-lightning-charge-fill"></i>
                </a>
              </div>
            </div>
          </div>
        </template>

        <template x-if="filteredItems.length === 0">
          <div class="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <i class="bi bi-controller text-5xl text-slate-300"></i>
             <h3 class="text-xl font-bold text-slate-500 mt-4" x-text="items.length === 0 ? 'Belum ada game yang terbit' : 'Tidak ada game yang cocok'"></h3>
             <p class="text-slate-400 mt-2 font-medium" x-text="items.length === 0 ? 'Game baru akan muncul di sini setelah diterbitkan tim Logos LAB.' : 'Coba kata kunci atau filter lain.'"></p>
          </div>
        </template>
      </div>

    </div>
  `;
};
