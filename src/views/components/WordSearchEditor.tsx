export const WordSearchEditorScript = () => `
  <script>
    (function() {
      const init = () => {
        if (typeof Alpine === 'undefined') return;
        if (Alpine.store('ws_editor_init')) return;
        Alpine.store('ws_editor_init', true);

        Alpine.data('wordSearchEditor', (project) => ({
        projectId: project ? project.id : null,
        words: [],
        grid: [],
        gridSize: 10,
        difficulty: 'EASY',
        isSaving: false,
        
        async init() {
          if (!this.projectId) return;
          const res = await fetch('/api/word-search/' + this.projectId);
          const json = await res.json();
          if(json.success && json.data) {
            this.words = json.data.words || [];
            this.grid = json.data.gridData || [];
            this.gridSize = json.data.gridSize || 10;
            this.difficulty = json.data.difficulty || 'EASY';
          } else {
            this.words = [{ word: '', explanation: '' }];
          }
          
          // LocalStorage recovery
          const saved = localStorage.getItem('ws_editor_' + this.projectId);
          if(saved) {
            const data = JSON.parse(saved);
            if(confirm('Ditemukan perubahan yang belum tersimpan di cloud. Ingin memulihkan?')) {
              this.words = data.words;
              this.difficulty = data.difficulty;
              this.gridSize = data.gridSize;
              this.grid = data.grid;
            }
          }

          this.$watch('words', val => this.localSave());
          this.$watch('difficulty', val => this.localSave());
        },

        updateGridSize() {
          this.gridSize = this.difficulty === 'EASY' ? 10 : this.difficulty === 'MEDIUM' ? 12 : 15;
        },

        addWord() {
          this.words.push({ word: '', explanation: '' });
        },

        removeWord(index) {
          this.words.splice(index, 1);
        },

        localSave() {
          if (!this.projectId) return;
          localStorage.setItem('ws_editor_' + this.projectId, JSON.stringify({
            words: this.words,
            difficulty: this.difficulty,
            gridSize: this.gridSize,
            grid: this.grid
          }));
        },

        generateGrid() {
          const size = this.gridSize;
          const newGrid = Array(size).fill().map(() => Array(size).fill(''));
          const directions = {
            EASY: [[0, 1], [1, 0]],
            MEDIUM: [[0, 1], [1, 0], [0, -1], [-1, 0]],
            HARD: [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]
          };

          const currentDirections = directions[this.difficulty];

          for (const item of this.words) {
            const word = item.word.trim().toUpperCase();
            if (!word) continue;
            
            if (word.length > size) {
              alert(\`Kata "\${word}" terlalu panjang untuk grid \${size}x\${size}\`);
              return;
            }

            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
              const dir = currentDirections[Math.floor(Math.random() * currentDirections.length)];
              const row = Math.floor(Math.random() * size);
              const col = Math.floor(Math.random() * size);

              if (this.canPlace(newGrid, word, row, col, dir)) {
                this.placeWord(newGrid, word, row, col, dir);
                placed = true;
              }
              attempts++;
            }

            if (!placed) {
              alert(\`Gagal menempatkan kata "\${word}". Coba kurangi kata atau ganti difficulty.\`);
              return;
            }
          }

          // Fill empty cells
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (newGrid[r][c] === '') {
                newGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
              }
            }
          }

          this.grid = newGrid;
          this.localSave();
        },

        canPlace(grid, word, row, col, dir) {
          const size = grid.length;
          for (let i = 0; i < word.length; i++) {
            const r = row + i * dir[0];
            const c = col + i * dir[1];
            if (r < 0 || r >= size || c < 0 || c >= size) return false;
            if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
          }
          return true;
        },

        placeWord(grid, word, row, col, dir) {
          for (let i = 0; i < word.length; i++) {
            const r = row + i * dir[0];
            const c = col + i * dir[1];
            grid[r][c] = word[i];
          }
        },

        async saveToServer() {
          if (this.grid.length === 0) {
            alert('Silakan generate grid terlebih dahulu!');
            return;
          }

          this.isSaving = true;
          try {
            const res = await fetch('/api/word-search/' + this.projectId + '/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                words: this.words,
                gridSize: this.gridSize,
                difficulty: this.difficulty,
                score: this.words.length * (this.difficulty === 'EASY' ? 10 : this.difficulty === 'MEDIUM' ? 20 : 50),
                gridData: this.grid
              })
            });

            if (res.ok) {
              localStorage.removeItem('ws_editor_' + this.projectId);
              alert('Data tersimpan ke cloud!');
            } else {
              alert('Gagal menyimpan data.');
            }
          } catch (e) {
            alert('Terjadi kesalahan jaringan.');
          } finally {
            this.isSaving = false;
          }
        }
      }));
      };
      if (window.Alpine) init();
      else document.addEventListener('alpine:init', init);
    })();
  </script>
`;

export const WordSearchEditor = ({ projectVar = 'activeProject' }: { projectVar?: string }) => {
  return `
    <div x-data="wordSearchEditor(${projectVar})" class="space-y-10 animate-in fade-in duration-500">
      <div class="w-full">
        <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 bg-[#FFC107] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1A237E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div>
              <h2 class="text-xl md:text-2xl font-bold text-[#1A237E] uppercase tracking-tighter leading-none">Editor Word Search</h2>
              <p class="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-[0.2em] mt-2">Generate tantangan pencarian kata teologis</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3 w-full xl:w-auto">
            <button @click="generateGrid()" class="flex-1 xl:flex-none bg-[#1A237E] text-[#FFC107] px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-indigo-900 transition-all shadow-xl flex items-center justify-center gap-2 border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               GENERATE GRID
            </button>
            <button @click="saveToServer()" :disabled="isSaving" class="flex-1 xl:flex-none bg-[#FF5722] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-[#E64A19] transition-all shadow-xl flex items-center justify-center gap-2 border-b-4 border-orange-950 active:border-b-0 active:translate-y-1 disabled:opacity-50">
               <span x-text="isSaving ? 'SAVING...' : 'SIMPAN KE CLOUD'"></span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <!-- Left: Input Form -->
          <div class="space-y-6">
            <div class="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Difficulty & Ukuran Grid</label>
              <div class="grid grid-cols-3 gap-4">
                <template x-for="diff in ['EASY', 'MEDIUM', 'HARD']">
                  <button @click="difficulty = diff; updateGridSize()" 
                          :class="difficulty === diff ? 'bg-[#1A237E] text-[#FFC107] border-[#1A237E]' : 'bg-white text-slate-400 border-slate-200'"
                          class="py-3 rounded-xl border-2 font-black text-xs transition-all uppercase tracking-widest shadow-sm"
                          x-text="diff"></button>
                </template>
              </div>
              <div class="mt-4 text-[10px] font-bold text-slate-500 italic">
                <span x-show="difficulty === 'EASY'">Grid 10x10. Kata: Horizontal & Vertikal.</span>
                <span x-show="difficulty === 'MEDIUM'">Grid 12x12. Kata: + Terbalik.</span>
                <span x-show="difficulty === 'HARD'">Grid 15x15. Semua arah + Diagonal.</span>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-sm md:text-base font-semibold text-[#1A237E] uppercase tracking-widest">Daftar Kata Teologis</h3>
                <button @click="addWord()" class="text-[#FF5722] font-semibold text-xs md:text-sm uppercase tracking-widest flex items-center gap-1 hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                  Tambah Baris
                </button>
              </div>

              <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <template x-for="(item, index) in words" :key="index">
                  <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3 animate-in slide-in-from-left duration-300">
                    <div class="flex gap-3">
                      <div class="flex-1">
                        <input type="text" x-model="item.word" @input="item.word = item.word.toUpperCase()" placeholder="KATA (CONTOH: IMAN)" 
                               class="w-full border-b-2 border-slate-100 focus:border-[#1A237E] outline-none py-2 font-black text-[#1A237E] placeholder:text-slate-300">
                      </div>
                      <button @click="removeWord(index)" class="text-slate-300 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                      </button>
                    </div>
                    <textarea x-model="item.explanation" placeholder="Penjelasan Teologis..." 
                              class="w-full bg-slate-50 rounded-lg p-3 text-xs font-medium text-slate-600 outline-none focus:ring-1 ring-[#1A237E] h-16 resize-none"></textarea>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Right: Grid Preview -->
          <div class="space-y-6">
            <div class="bg-[#1A237E] p-4 sm:p-8 rounded-[2.5rem] shadow-2xl border-4 border-[#FFC107] relative overflow-hidden flex items-center justify-center min-h-[400px] md:min-h-[500px]">
              <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <div x-show="grid.length > 0" class="relative z-10 w-full flex justify-center">
                <div class="grid gap-1 bg-[#1A237E]/50 p-2 rounded-xl" :style="'grid-template-columns: repeat(' + gridSize + ', minmax(0, 1fr))'">
                  <template x-for="(row, rIdx) in grid">
                    <template x-for="(char, cIdx) in row">
                      <div class="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 bg-white/10 border border-white/20 rounded flex items-center justify-center font-black text-white text-[10px] sm:text-xs md:text-lg transition-all hover:bg-[#FFC107] hover:text-[#1A237E] cursor-default"
                           x-text="char"></div>
                    </template>
                  </template>
                </div>
              </div>

              <div x-show="grid.length === 0" class="text-center space-y-4">
                <div class="h-20 w-20 bg-white/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </div>
                <p class="text-white/40 font-black uppercase tracking-widest text-xs">Grid belum di-generate</p>
              </div>
            </div>

            <div class="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100">
               <h4 class="text-[10px] font-black text-[#FF5722] uppercase tracking-widest mb-2 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Tips Pembuatan
               </h4>
               <ul class="text-[10px] font-bold text-orange-800 space-y-1 list-disc pl-4">
                 <li>Gunakan kata minimal 3 huruf.</li>
                 <li>Pastikan penjelasan teologis akurat dan ringkas.</li>
                 <li>Klik "Generate Grid" setiap kali mengubah daftar kata.</li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
