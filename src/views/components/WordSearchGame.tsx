export const WordSearchGameScript = () => `
  <script>
    (function() {
      const init = () => {
        if (typeof Alpine === 'undefined') return;
        if (Alpine.store('ws_game_init')) return;
        Alpine.store('ws_game_init', true);

        Alpine.data('wordSearchGame', (project, gameData) => ({
        activeProject: project,
        grid: gameData ? gameData.gridData : [],
        gridSize: gameData ? gameData.gridSize : 10,
        difficulty: gameData ? gameData.difficulty : 'EASY',
        wordsData: gameData ? gameData.words : [], 
        wordsList: gameData ? gameData.words.map(w => w.word) : [],
        
        foundWords: [],
        totalWords: gameData ? gameData.words.length : 0,
        score: 0,
        timer: 0,
        timerInterval: null,
        
        isSelecting: false,
        startCell: null,
        currentCell: null,
        foundCells: [], 
        
        showEduModal: false,
        currentWord: null,
        showSummary: false,
        
        init() {
          this.timerInterval = setInterval(() => {
            if (!this.showEduModal && !this.showSummary) this.timer++;
          }, 1000);
        },

        formatTime(s) {
          const mins = Math.floor(s / 60);
          const secs = s % 60;
          return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
        },

        getCellFromEvent(e) {
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          const el = document.elementFromPoint(clientX, clientY);
          if (!el) return null;
          const cell = el.closest('.cell');
          if (!cell) return null;
          return {
            r: parseInt(cell.dataset.row),
            c: parseInt(cell.dataset.col)
          };
        },

        startSelection(e) {
          if (this.showEduModal || this.showSummary) return;
          const cell = this.getCellFromEvent(e);
          if (cell) {
            this.isSelecting = true;
            this.startCell = cell;
            this.currentCell = cell;
            this.playClick();
          }
        },

        updateSelection(e) {
          if (!this.isSelecting) return;
          const cell = this.getCellFromEvent(e);
          if (cell && (cell.r !== this.currentCell.r || cell.c !== this.currentCell.c)) {
            this.currentCell = cell;
          }
        },

        endSelection() {
          if (!this.isSelecting) return;
          this.isSelecting = false;
          this.checkSelection();
        },

        checkSelection() {
          const selectedCells = this.getSelectedCells();
          if (selectedCells.length === 0) return;
          const word = selectedCells.map(c => this.grid[c.r][c.c]).join('');
          const reversedWord = word.split('').reverse().join('');

          if (this.wordsList.includes(word) && !this.foundWords.includes(word)) {
            this.handleSuccess(word, selectedCells);
          } else if (this.wordsList.includes(reversedWord) && !this.foundWords.includes(reversedWord)) {
            this.handleSuccess(reversedWord, selectedCells);
          }
          
          this.startCell = null;
          this.currentCell = null;
        },

        handleSuccess(word, cells) {
          this.foundWords.push(word);
          // Store as string keys for easy lookup
          cells.forEach(c => {
            if(!this.isCellInFoundWords(c.r, c.c)) {
               this.foundCells.push({r: c.r, c: c.c});
            }
          });
          
          this.score += this.difficulty === 'EASY' ? 10 : this.difficulty === 'MEDIUM' ? 20 : 50;
          this.currentWord = this.wordsData.find(w => w.word === word);
          this.showEduModal = true;
          
          if (this.foundWords.length === this.totalWords) {
            this.submitScore();
          }
        },

        isCellInFoundWords(r, c) {
          return this.foundCells.some(fc => fc.r === r && fc.c === c);
        },

        async submitScore() {
          await fetch('/api/word-search/' + this.activeProject.id + '/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              foundWordsCount: this.foundWords.length,
              totalWords: this.totalWords,
              difficulty: this.difficulty,
              timeSpent: this.timer
            })
          });
        },

        closeEduModal() {
          this.showEduModal = false;
          if (this.foundWords.length === this.totalWords) {
            this.showSummary = true;
            clearInterval(this.timerInterval);
          }
        },

        getSelectedCells() {
          if (!this.startCell || !this.currentCell) return [];
          
          const dr = this.currentCell.r - this.startCell.r;
          const dc = this.currentCell.c - this.startCell.c;
          
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          if (dist === 0) return [this.startCell];

          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          
          // Only allow horizontal, vertical, or 45deg diagonal
          if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [this.startCell];

          const cells = [];
          for (let i = 0; i <= dist; i++) {
            cells.push({
              r: this.startCell.r + i * stepR,
              c: this.startCell.c + i * stepC
            });
          }
          return cells;
        },

        getCellClass(r, c) {
          if (this.isSelecting) {
            const selected = this.getSelectedCells();
            if (selected.some(sc => sc.r === r && sc.c === c)) {
              return 'bg-[#FF5722] text-white scale-110 z-20 shadow-lg ring-2 ring-white';
            }
          }
          return '';
        },

        playClick() {
           if(window.navigator.vibrate) window.navigator.vibrate(10);
        }
      }));
      };
      if (window.Alpine) init();
      else document.addEventListener('alpine:init', init);
    })();
  </script>
`;

export const WordSearchGame = ({ projectVar = 'activeProject', gameDataVar = 'gameData' }: { projectVar?: string, gameDataVar?: string }) => {
  return `
    <div x-data="wordSearchGame(\${projectVar}, \${gameDataVar})" 
         class="max-w-4xl mx-auto space-y-8 p-4 animate-in fade-in duration-700">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-4">
           <div class="h-14 w-14 bg-[#FFC107] rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#1A237E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <div>
             <h2 class="text-2xl font-black text-[#1A237E] uppercase tracking-tighter" x-text="activeProject.title"></h2>
             <div class="flex items-center gap-2">
               <span class="text-[10px] font-black bg-[#1A237E] text-white px-2 py-0.5 rounded uppercase tracking-widest" x-text="difficulty"></span>
               <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest" x-text="gridSize + 'x' + gridSize + ' GRID'"></span>
             </div>
           </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div class="bg-white p-3 px-6 rounded-2xl border-2 border-slate-100 shadow-sm text-center">
            <div class="text-[8px] font-black text-slate-400 uppercase tracking-widest">WAKTU</div>
            <div class="text-xl font-black text-[#1A237E]" x-text="formatTime(timer)"></div>
          </div>
          <div class="bg-[#1A237E] p-3 px-6 rounded-2xl border-b-4 border-[#FFC107] shadow-lg text-center">
            <div class="text-[8px] font-black text-blue-200 uppercase tracking-widest">SKOR</div>
            <div class="text-xl font-black text-[#FFC107]" x-text="score"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Word List -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest mb-6 flex items-center gap-2">
              <span class="h-2 w-2 bg-[#FFC107] rounded-full animate-ping"></span>
              Kata Tersembunyi:
            </h3>
            <div class="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <template x-for="w in wordsList">
                <div class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-500"
                     :class="foundWords.includes(w) ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-transparent text-slate-700'">
                  <div class="h-5 w-5 rounded-lg flex items-center justify-center transition-all" :class="foundWords.includes(w) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'">
                    <svg x-show="foundWords.includes(w)" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                    <span x-show="!foundWords.includes(w)" class="text-[8px] font-black" x-text="w[0]"></span>
                  </div>
                  <span class="font-black text-xs uppercase tracking-wider" :class="foundWords.includes(w) ? 'line-through opacity-40' : ''" x-text="w"></span>
                </div>
              </template>
            </div>
          </div>

          <div class="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100">
             <p class="text-[10px] font-bold text-orange-800 leading-relaxed italic">"Temukan kata-kata di samping pada grid dengan cara menarik garis (drag) pada huruf-hurufnya. Kata bisa mendatar, menurun, atau diagonal!"</p>
          </div>
        </div>

        <!-- Right: Game Grid -->
        <div class="lg:col-span-2">
          <div class="bg-[#1A237E] p-4 sm:p-10 rounded-[3.5rem] shadow-2xl border-[12px] border-white/5 relative overflow-hidden flex items-center justify-center min-h-[450px]">
            <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <!-- Selection Layer (Canvas for smoother lines if needed, but we'll use CSS for now) -->
            <div class="relative z-10 select-none touch-none" 
                 @mousedown="startSelection" 
                 @mousemove="updateSelection" 
                 @mouseup="endSelection"
                 @touchstart.prevent="startSelection" 
                 @touchmove.prevent="updateSelection" 
                 @touchend.prevent="endSelection"
                 @mouseleave="endSelection">
              
              <div class="grid gap-1 bg-[#1A237E]/30 p-3 rounded-2xl backdrop-blur-sm" :style="'grid-template-columns: repeat(' + gridSize + ', minmax(0, 1fr))'">
                <template x-for="(row, rIdx) in grid">
                  <template x-for="(char, cIdx) in row">
                    <div :data-row="rIdx" :data-col="cIdx"
                         class="h-7 w-7 sm:h-9 sm:w-9 md:h-11 md:w-11 flex items-center justify-center font-black text-white text-[10px] sm:text-sm md:text-xl rounded-lg transition-all duration-150 cursor-pointer cell relative"
                         :class="getCellClass(rIdx, cIdx)">
                      <span class="relative z-10" x-text="char"></span>
                      <!-- Correct background for found words -->
                      <div x-show="isCellInFoundWords(rIdx, cIdx)" class="absolute inset-0 bg-[#FFC107] rounded-lg shadow-inner transform scale-90"></div>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Educational Modal -->
      <div x-show="showEduModal" style="display:none;" class="fixed inset-0 bg-[#1A237E]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-4 border-[#FFC107] overflow-hidden animate-in zoom-in duration-300">
          <div class="bg-[#1A237E] p-10 text-center relative overflow-hidden">
            <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div class="relative z-10">
              <div class="h-24 w-24 bg-[#FFC107] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-[#1A237E]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </div>
              <h2 class="text-4xl font-black text-white uppercase tracking-tighter">Luar Biasa!</h2>
              <p class="text-blue-200 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Wawasan Teologis Baru:</p>
              <h3 class="text-5xl font-black text-[#FFC107] mt-2 italic" x-text="currentWord?.word"></h3>
            </div>
          </div>
          <div class="p-10 space-y-8">
            <div class="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 italic text-[#1A237E] font-bold leading-relaxed text-lg text-center" x-text="currentWord?.explanation"></div>
            <button @click="closeEduModal()" class="w-full bg-[#1A237E] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all shadow-2xl transform active:scale-95 flex items-center justify-center gap-4">
              LANJUTKAN MISI
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Modal -->
      <div x-show="showSummary" style="display:none;" class="fixed inset-0 bg-[#1A237E]/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4">
        <div class="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl border-[12px] border-white/10 overflow-hidden text-center p-12 py-16 space-y-10 animate-in slide-in-from-bottom duration-700 relative">
          <div class="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#FFC107] via-[#FF5722] to-[#FFC107]"></div>
          
          <div class="space-y-4">
            <div class="text-[10px] font-black text-[#FF5722] uppercase tracking-[0.5em]">MISSION COMPLETED</div>
            <h2 class="text-6xl font-black text-[#1A237E] uppercase tracking-tighter italic leading-none">PAKAR KATA!<br><span class="text-[#FFC107]">TERLATIH</span></h2>
          </div>
          
          <div class="grid grid-cols-2 gap-8 py-6">
            <div class="space-y-1">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL SKOR</div>
              <div class="text-6xl font-black text-[#FF5722]" x-text="score"></div>
            </div>
            <div class="space-y-1 border-l-2 border-slate-100">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">WAKTU</div>
              <div class="text-6xl font-black text-[#1A237E]" x-text="formatTime(timer)"></div>
            </div>
          </div>

          <div class="space-y-4">
            <button @click="window.location.href='/dashboard/user'" class="w-full bg-[#1A237E] text-[#FFC107] py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xl hover:bg-indigo-900 transition-all shadow-[0_20px_50px_rgba(26,35,126,0.3)] flex items-center justify-center gap-4 group">
              KEMBALI KE DASHBOARD
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <button @click="window.location.reload()" class="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] hover:text-[#1A237E] transition-colors py-2 block w-full">MAINKAN ULANG TANTANGAN</button>
          </div>
        </div>
      </div>
    </div>
  `;
};
