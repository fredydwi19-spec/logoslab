export const CrosswordGameScript = () => `
  <script>
    (function() {
      const init = () => {
        if (typeof Alpine === 'undefined') return;
        if (Alpine.store('cw_game_init')) return;
        Alpine.store('cw_game_init', true);

        Alpine.data('crosswordGame', (project, gameData, isReadOnly = false) => ({
          activeProject: project,
          grid: [],
          gridSize: 15,
          difficulty: 'MEDIUM',
          clues: [],
          
          parseData() {
            if (!gameData) return;
            try {
              // Handle grid
              let rawGrid = gameData.gridData || gameData.grid || [];
              if (typeof rawGrid === 'string') rawGrid = JSON.parse(rawGrid);
              this.grid = Array.isArray(rawGrid) ? JSON.parse(JSON.stringify(rawGrid)) : [];
              
              // Handle clues
              let rawClues = gameData.clues || [];
              if (typeof rawClues === 'string') rawClues = JSON.parse(rawClues);
              this.clues = Array.isArray(rawClues) ? JSON.parse(JSON.stringify(rawClues)) : [];
              
              this.gridSize = gameData.gridSize || 15;
              this.difficulty = gameData.difficulty || 'MEDIUM';
            } catch (e) {
              console.error("Failed to parse crossword data", e);
            }
          },
          
          userGrid: [], // Matrix of letters entered by user
          selectedCell: { r: -1, c: -1 },
          direction: 'ACROSS', // ACROSS or DOWN
          
          score: 0,
          timer: 0,
          timerInterval: null,
          
          showEduModal: false,
          currentExplanation: '',
          currentAnswer: '',
          showSummary: false,
          isReadOnly: isReadOnly,
          // Di /play: huruf jawaban tidak dikirim ke browser, kata yang sudah terisi dicek ke server lewat sesi main ini
          attemptId: gameData?.attemptId || null,
          level: gameData?.level || 1,
          checkingClues: {},
          
          init() {
            this.parseData();
            // Initialize userGrid with empty strings for playable cells
            if (this.grid && this.grid.length > 0) {
              this.userGrid = this.grid.map(row => 
                row.map(cell => cell.isBlack ? '' : '')
              );
            } else {
              this.userGrid = [];
            }

            if (!this.isReadOnly) {
              this.timerInterval = setInterval(() => {
                if (!this.showEduModal && !this.showSummary) this.timer++;
              }, 1000);
            }

            // Keyboard support
            window.addEventListener('keydown', (e) => {
              if (this.selectedCell.r === -1 || this.showEduModal || this.showSummary) return;
              
              if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
                this.handleInput(e.key.toUpperCase());
              } else if (e.key === 'Backspace') {
                this.handleBackspace();
              } else if (e.key === 'ArrowRight') {
                this.moveSelection(0, 1);
              } else if (e.key === 'ArrowLeft') {
                this.moveSelection(0, -1);
              } else if (e.key === 'ArrowUp') {
                this.moveSelection(-1, 0);
              } else if (e.key === 'ArrowDown') {
                this.moveSelection(1, 0);
              }
            });
          },

          formatTime(s) {
            const mins = Math.floor(s / 60);
            const secs = s % 60;
            return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
          },

          selectCell(r, c) {
            if (this.grid[r][c].isBlack) return;
            
            if (this.selectedCell.r === r && this.selectedCell.c === c) {
              // Toggle direction
              this.direction = this.direction === 'ACROSS' ? 'DOWN' : 'ACROSS';
            } else {
              this.selectedCell = { r, c };
            }
          },

          handleInput(char) {
            const { r, c } = this.selectedCell;
            this.userGrid[r][c] = char;
            this.checkWordComplete(r, c);
            this.moveSelectionForward();
          },

          handleBackspace() {
            const { r, c } = this.selectedCell;
            if (this.userGrid[r][c] !== '') {
              this.userGrid[r][c] = '';
            } else {
              this.moveSelectionBackward();
              const newPos = this.selectedCell;
              this.userGrid[newPos.r][newPos.c] = '';
            }
          },

          moveSelectionForward() {
            const { r, c } = this.selectedCell;
            let nextR = r, nextC = c;
            if (this.direction === 'ACROSS') nextC++; else nextR++;
            
            if (nextR < this.gridSize && nextC < this.gridSize && !this.grid[nextR][nextC].isBlack) {
              this.selectedCell = { r: nextR, c: nextC };
            }
          },

          moveSelectionBackward() {
            const { r, c } = this.selectedCell;
            let nextR = r, nextC = c;
            if (this.direction === 'ACROSS') nextC--; else nextR--;
            
            if (nextR >= 0 && nextC >= 0 && !this.grid[nextR][nextC].isBlack) {
              this.selectedCell = { r: nextR, c: nextC };
            }
          },

          moveSelection(dr, dc) {
            let nextR = this.selectedCell.r + dr;
            let nextC = this.selectedCell.c + dc;
            if (nextR >= 0 && nextR < this.gridSize && nextC >= 0 && nextC < this.gridSize && !this.grid[nextR][nextC].isBlack) {
              this.selectedCell = { r: nextR, c: nextC };
            }
          },

          checkWordComplete(r, c) {
            // Check both directions for the word passing through (r,c)
            ['ACROSS', 'DOWN'].forEach(dir => {
              const clue = this.findClueForCell(r, c, dir);
              if (!clue || clue.alreadyFound) return;
              if (this.attemptId) {
                if (this.isWordFilled(clue)) this.checkWordOnServer(clue);
                return;
              }
              if (this.isWordCorrect(clue)) {
                clue.alreadyFound = true;
                this.handleSuccess(clue, clue.answer, clue.explanation);
              }
            });
          },

          clueLength(clue) {
            return clue.answer ? clue.answer.length : (Number(clue.length) || 0);
          },

          wordCells(clue) {
            const startR = parseInt(clue.startRow);
            const startC = parseInt(clue.startCol);
            return Array.from({ length: this.clueLength(clue) }, (_, i) => clue.direction === 'ACROSS' ? [startR, startC + i] : [startR + i, startC]);
          },

          isWordFilled(clue) {
            return this.wordCells(clue).every(([r, c]) => this.userGrid[r] && this.userGrid[r][c]);
          },

          async checkWordOnServer(clue) {
            const clueIndex = this.clues.indexOf(clue);
            const word = this.wordCells(clue).map(([r, c]) => this.userGrid[r][c]).join('');
            if (this.checkingClues[clueIndex] === word) return;
            this.checkingClues[clueIndex] = word;
            try {
              const res = await fetch('/api/projects/' + this.activeProject.id + '/levels/' + this.level + '/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId: this.attemptId, clueIndex, answer: word })
              });
              const json = await res.json();
              if (res.ok && json.isCorrect && !clue.alreadyFound) {
                clue.alreadyFound = true;
                this.handleSuccess(clue, json.answer, json.explanation);
              }
            } catch (e) {
              console.error('Gagal mengecek jawaban TTS:', e);
            } finally {
              delete this.checkingClues[clueIndex];
            }
          },

          isCellInFoundClue(r, c) {
            return this.clues.some(clue => clue.alreadyFound && this.wordCells(clue).some(([cr, cc]) => cr === r && cc === c));
          },

          findClueForCell(r, c, dir) {
            return this.clues.find(clue => {
              if (clue.direction !== dir) return false;
              const startR = parseInt(clue.startRow);
              const startC = parseInt(clue.startCol);
              const len = this.clueLength(clue);
              
              if (dir === 'ACROSS') {
                return r === startR && c >= startC && c < startC + len;
              } else {
                return c === startC && r >= startR && r < startR + len;
              }
            });
          },

          isWordCorrect(clue) {
            const startR = parseInt(clue.startRow);
            const startC = parseInt(clue.startCol);
            const dir = clue.direction;
            const answer = clue.answer.toUpperCase();
            
            for (let i = 0; i < answer.length; i++) {
              const currR = dir === 'ACROSS' ? startR : startR + i;
              const currC = dir === 'ACROSS' ? startC + i : startC;
              if (this.userGrid[currR][currC] !== answer[i]) return false;
            }
            return true;
          },

          handleSuccess(clue, answer, explanation) {
            this.score += this.difficulty === 'EASY' ? 10 : this.difficulty === 'MEDIUM' ? 20 : 50;
            this.currentExplanation = explanation;
            this.currentAnswer = answer;
            this.showEduModal = true;
            
            if (this.clues.every(c => c.alreadyFound)) {
              if (!this.isReadOnly) this.submitScore();
            }
          },

          async submitScore() {
            await fetch('/api/crossword/' + this.activeProject.id + '/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scoreEarned: this.score,
                difficulty: this.difficulty,
                timeSpent: this.timer
              })
            });
          },

          closeEduModal() {
            this.showEduModal = false;
            if (this.clues.every(c => c.alreadyFound)) {
              this.showSummary = true;
              clearInterval(this.timerInterval);
              this.finishLevel();
            }
          },

          // Kirim jawaban clue yang sudah ditemukan ke pemutar level (/play); server yang menilai
          finishLevel() {
            clearInterval(this.timerInterval);
            // Di /play jawaban yang benar sudah tercatat di sesi main server, jadi tidak perlu dikirim lagi
            this.$dispatch('game-level-finish', {});
          },

          getCellStatus(r, c) {
            const char = this.userGrid[r][c];
            if (!char) return '';
            
            // In game, we only show correct/wrong when check button is pressed? 
            // Or live? Requirement says "Check Answer Button".
            // But let's check if the letter is correct for that cell.
            if (this.grid[r][c].letter === undefined) return this.isCellInFoundClue(r, c) ? 'text-green-600' : 'text-primary';
            if (this.grid[r][c].letter === char) return 'text-green-600';
            return 'text-red-600';
          },

          isCellHighlighted(r, c) {
            if (this.selectedCell.r === -1) return false;
            if (this.selectedCell.r === r && this.selectedCell.c === c) return true;
            
            // Highlight row/col based on direction
            const clue = this.findClueForCell(this.selectedCell.r, this.selectedCell.c, this.direction);
            if (clue) {
               const startR = parseInt(clue.startRow);
               const startC = parseInt(clue.startCol);
               const len = this.clueLength(clue);
               if (this.direction === 'ACROSS') {
                 return r === startR && c >= startC && c < startC + len;
               } else {
                 return c === startC && r >= startR && r < startR + len;
               }
            }
            return false;
          }
        }));
      };
      if (window.Alpine) init();
      else document.addEventListener('alpine:init', init);
    })();
  </script>
`;

export const CrosswordGame = ({ projectVar = 'activeProject', gameDataVar = 'gameData', isReadOnly = 'false' }: { projectVar?: string, gameDataVar?: string, isReadOnly?: string }) => {
  return `
    <div x-data="crosswordGame(${projectVar}, ${gameDataVar}, ${isReadOnly})" 
         class="max-w-6xl mx-auto space-y-8 p-4 animate-in fade-in duration-700">
      
      <!-- Header Stats -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-4">
           <div class="h-14 w-14 bg-highlight rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
           </div>
           <div>
             <h2 class="text-lg font-black text-primary uppercase tracking-tighter" x-text="activeProject.title"></h2>
             <div class="flex items-center gap-2">
               <span class="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded uppercase tracking-widest" x-text="difficulty"></span>
               <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest" x-text="gridSize + 'x' + gridSize + ' GRID'"></span>
             </div>
           </div>
        </div>
        
        <button type="button" x-show="window.location.pathname.startsWith('/play/')" @click="finishLevel()" class="w-full md:w-auto bg-accent text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-accent-hover transition-all">Selesai &amp; Lihat Hasil</button>
        <div class="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div class="bg-white p-3 px-6 rounded-2xl border-2 border-slate-100 shadow-sm text-center">
            <div class="text-[8px] font-black text-slate-400 uppercase tracking-widest">WAKTU</div>
            <div class="text-base font-black text-primary" x-text="formatTime(timer)"></div>
          </div>
          <div class="bg-primary p-3 px-6 rounded-2xl border-b-4 border-highlight shadow-lg text-center">
            <div class="text-[8px] font-black text-blue-200 uppercase tracking-widest">SKOR</div>
            <div class="text-base font-black text-highlight" x-text="score"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Center: Crossword Grid (7 cols) -->
        <div class="lg:col-span-7 flex flex-col items-center">
          <div class="bg-primary p-4 sm:p-5 rounded-[3rem] shadow-2xl border-[10px] border-white/5 relative overflow-hidden flex items-center justify-center">
             <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             
             <div class="relative z-10 select-none">
                <div class="grid gap-px bg-white/20 border border-white/20 shadow-2xl" 
                     :style="'grid-template-columns: repeat(' + gridSize + ', minmax(0, 1fr))'">
                  <template x-for="(row, rIdx) in grid">
                    <template x-for="(cell, cIdx) in row">
                      <div @click="selectCell(rIdx, cIdx)"
                           class="h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 relative cursor-pointer transition-all duration-200"
                           :class="{
                             'bg-[#0D1240]': cell.isBlack,
                             'bg-white': !cell.isBlack && !isCellHighlighted(rIdx, cIdx),
                             'bg-highlight scale-105 z-10 shadow-lg ring-2 ring-white': !cell.isBlack && isCellHighlighted(rIdx, cIdx),
                             'ring-2 ring-accent z-20': selectedCell.r === rIdx && selectedCell.c === cIdx
                           }">
                        
                        <!-- Number Label -->
                        <span x-show="cell.number" 
                              class="absolute top-0.5 left-0.5 text-[6px] md:text-[8px] font-black leading-none"
                              :class="cell.isBlack ? 'text-white/20' : 'text-primary'"
                              x-text="cell.number"></span>
                        
                        <!-- Letter -->
                        <span x-show="!cell.isBlack" 
                              class="w-full h-full flex items-center justify-center font-black text-[10px] md:text-sm uppercase"
                              :class="getCellStatus(rIdx, cIdx)"
                              x-text="userGrid[rIdx][cIdx]"></span>
                      </div>
                    </template>
                  </template>
                </div>
             </div>
          </div>
          
          <div class="mt-6 flex gap-4">
             <button @click="direction = (direction === 'ACROSS' ? 'DOWN' : 'ACROSS')" class="bg-white border-2 border-slate-100 p-2 text-sm.5 text-sm rounded-lg rounded-2xl font-black text-primary text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                ARAH: <span x-text="direction"></span>
             </button>
          </div>
        </div>

        <!-- Right: Clue List (5 cols) -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Across Clues -->
          <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <h3 class="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <div class="h-2 w-2 bg-highlight rounded-full"></div>
                Mendatar (Across)
             </h3>
             <div class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                <template x-for="clue in clues.filter(c => c.direction === 'ACROSS')">
                   <div @click="selectCell(parseInt(clue.startRow), parseInt(clue.startCol)); direction = 'ACROSS'"
                        class="p-3 rounded-xl border-2 cursor-pointer transition-all"
                        :class="{
                          'bg-green-50 border-green-100 opacity-60': clue.alreadyFound,
                          'bg-slate-50 border-transparent hover:border-highlight': !clue.alreadyFound && !(selectedCell.r == clue.startRow && selectedCell.c == clue.startCol && direction == 'ACROSS'),
                          'bg-yellow-50 border-highlight': !clue.alreadyFound && (selectedCell.r == clue.startRow && selectedCell.c == clue.startCol && direction == 'ACROSS')
                        }">
                      <div class="flex gap-3">
                         <span class="font-black text-primary text-xs" x-text="clue.number + '.'"></span>
                         <span class="font-bold text-slate-600 text-[11px] leading-relaxed" x-text="clue.clue"></span>
                      </div>
                   </div>
                </template>
             </div>
          </div>

          <!-- Down Clues -->
          <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <h3 class="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <div class="h-2 w-2 bg-accent rounded-full"></div>
                Menurun (Down)
             </h3>
             <div class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                <template x-for="clue in clues.filter(c => c.direction === 'DOWN')">
                   <div @click="selectCell(parseInt(clue.startRow), parseInt(clue.startCol)); direction = 'DOWN'"
                        class="p-3 rounded-xl border-2 cursor-pointer transition-all"
                        :class="{
                          'bg-green-50 border-green-100 opacity-60': clue.alreadyFound,
                          'bg-slate-50 border-transparent hover:border-highlight': !clue.alreadyFound && !(selectedCell.r == clue.startRow && selectedCell.c == clue.startCol && direction == 'DOWN'),
                          'bg-yellow-50 border-highlight': !clue.alreadyFound && (selectedCell.r == clue.startRow && selectedCell.c == clue.startCol && direction == 'DOWN')
                        }">
                      <div class="flex gap-3">
                         <span class="font-black text-primary text-xs" x-text="clue.number + '.'"></span>
                         <span class="font-bold text-slate-600 text-[11px] leading-relaxed" x-text="clue.clue"></span>
                      </div>
                   </div>
                </template>
             </div>
          </div>
        </div>
      </div>

      <!-- Educational Modal -->
      <div x-show="showEduModal" style="display:none;" class="fixed inset-0 bg-primary/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-4 border-highlight overflow-hidden animate-in zoom-in duration-300">
          <div class="bg-primary p-6 text-center relative overflow-hidden">
            <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div class="relative z-10">
              <div class="h-20 w-20 bg-highlight rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </div>
              <h2 class="text-base font-black text-white uppercase tracking-tighter">Jawaban Benar!</h2>
              <h3 class="text-lg font-black text-highlight mt-2 italic uppercase" x-text="currentAnswer"></h3>
            </div>
          </div>
          <div class="p-6 space-y-8">
            <div class="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 italic text-primary font-bold leading-relaxed text-base text-center" x-text="currentExplanation"></div>
            <button @click="closeEduModal()" class="w-full bg-primary text-white py-2.5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-2xl transform active:scale-95 flex items-center justify-center gap-4 text-xs">
              LANJUTKAN MISI
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Modal -->
      <div x-show="showSummary" style="display:none;" class="fixed inset-0 bg-primary/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4">
        <div class="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl border-[12px] border-white/10 overflow-hidden text-center p-6 py-16 space-y-10 animate-in slide-in-from-bottom duration-700 relative">
          <div class="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-highlight via-accent to-highlight"></div>
          
          <div class="space-y-4">
            <div class="text-[10px] font-black text-accent uppercase tracking-[0.5em]">CROSSWORD COMPLETED</div>
            <h2 class="text-6xl font-black text-primary uppercase tracking-tighter italic leading-none">MASTER<br><span class="text-highlight">ALKITAB</span></h2>
          </div>
          
          <div class="grid grid-cols-2 gap-8 py-6">
            <div class="space-y-1">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL SKOR</div>
              <div class="text-6xl font-black text-accent" x-text="score"></div>
            </div>
            <div class="space-y-1 border-l-2 border-slate-100">
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">WAKTU</div>
              <div class="text-6xl font-black text-primary" x-text="formatTime(timer)"></div>
            </div>
          </div>

          <div class="space-y-4">
            <button @click="window.location.href='/dashboard/user'" class="w-full bg-primary text-highlight py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-base hover:bg-primary-dark transition-all shadow-[0_20px_50px_rgba(26,35,126,0.3)] flex items-center justify-center gap-4 group">
              SELESAI & KEMBALI
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
};
