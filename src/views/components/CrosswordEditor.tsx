export const CrosswordEditorScript = () => `
  <script>
    (function() {
      const init = () => {
        if (typeof Alpine === 'undefined') return;
        if (Alpine.store('cw_editor_init')) return;
        Alpine.store('cw_editor_init', true);

        Alpine.data('crosswordEditor', (project) => ({
          projectId: project ? project.id : null,
          clues: [],
          grid: [],
          gridSize: 15,
          difficulty: 'MEDIUM',
          isSaving: false,
          saveStatus: 'SYNCHRONIZED', // SYNCHRONIZED, LOCAL SAVED, UPLOADING, CLOUD SYNCED
          
          async init() {
            if (!this.projectId) return;
            
            // Load from cloud
            const res = await fetch('/api/crossword/' + this.projectId);
            const json = await res.json();
            if(json.success && json.data) {
              this.clues = json.data.clues || [];
              this.grid = json.data.gridData || [];
              this.gridSize = json.data.gridSize || 15;
              this.difficulty = json.data.difficulty || 'MEDIUM';
            } else {
              this.clues = [{ number: 1, direction: 'ACROSS', clue: '', answer: '', startRow: 0, startCol: 0, explanation: '' }];
              this.generateGrid();
            }
            
            // LocalStorage recovery
            const saved = localStorage.getItem('crossword_draft_' + this.projectId);
            if(saved) {
              const data = JSON.parse(saved);
              if(confirm('Ditemukan perubahan yang belum tersimpan di cloud. Ingin memulihkan?')) {
                this.clues = data.clues;
                this.difficulty = data.difficulty;
                this.gridSize = data.gridSize;
                this.grid = data.grid;
                this.saveStatus = 'LOCAL SAVED';
              }
            }

            this.$watch('clues', val => {
              this.localSave();
              this.generateGrid();
            });
            this.$watch('difficulty', val => this.localSave());
            this.$watch('gridSize', val => {
              this.localSave();
              this.generateGrid();
            });
          },

          addClue() {
            const nextNumber = this.clues.length > 0 ? Math.max(...this.clues.map(c => c.number)) + 1 : 1;
            this.clues.push({ 
              number: nextNumber, 
              direction: 'ACROSS', 
              clue: '', 
              answer: '', 
              startRow: 0, 
              startCol: 0, 
              explanation: '' 
            });
          },

          removeClue(index) {
            this.clues.splice(index, 1);
            // Re-numbering is not strictly required but could be helpful
          },

          localSave() {
            if (!this.projectId) return;
            localStorage.setItem('crossword_draft_' + this.projectId, JSON.stringify({
              clues: this.clues,
              difficulty: this.difficulty,
              gridSize: this.gridSize,
              grid: this.grid
            }));
            this.saveStatus = 'LOCAL SAVED';
          },

          autoGenerateLayout() {
            const size = parseInt(this.gridSize);
            const cluesToPlace = this.clues.filter(c => c.answer && c.answer.trim().length > 1);
            
            if (cluesToPlace.length === 0) {
              alert('Masukkan jawaban minimal 2 huruf untuk generate otomatis.');
              return;
            }

            // Reset positions
            this.clues.forEach(c => {
              c.status = 'UNPLACED';
              c.startRow = -1;
              c.startCol = -1;
            });

            // Sort by length descending
            const sorted = [...cluesToPlace].sort((a, b) => b.answer.length - a.answer.length);

            // Helper to check if a word can be placed
            const canPlace = (word, row, col, dir, currentGrid) => {
              if (dir === 'ACROSS') {
                if (col + word.length > size || col < 0) return false;
                for (let i = 0; i < word.length; i++) {
                  const cell = currentGrid[row][col + i];
                  if (cell.letter && cell.letter !== word[i]) return false;
                  // Adjacent check (simplified: don't touch neighbors horizontally except start/end)
                  // For better quality, we'd check neighbors, but let's keep it simple first.
                }
              } else {
                if (row + word.length > size || row < 0) return false;
                for (let i = 0; i < word.length; i++) {
                  const cell = currentGrid[row + i][col];
                  if (cell.letter && cell.letter !== word[i]) return false;
                }
              }
              return true;
            };

            // Temporary grid for simulation
            const tempGrid = Array(size).fill(null).map(() => Array(size).fill(null).map(() => ({ letter: '' })));

            // Place first word at center
            const first = sorted[0];
            const startR = Math.floor(size / 2);
            const startC = Math.max(0, Math.floor((size - first.answer.length) / 2));
            first.startRow = startR;
            first.startCol = startC;
            first.direction = 'ACROSS';
            first.status = 'PLACED';
            
            for (let i = 0; i < first.answer.length; i++) {
              tempGrid[startR][startC + i].letter = first.answer[i];
            }

            // Place remaining words
            for (let i = 1; i < sorted.length; i++) {
              const clue = sorted[i];
              const word = clue.answer.toUpperCase();
              let placed = false;

              // Try to find intersection
              for (let r = 0; r < size && !placed; r++) {
                for (let c = 0; c < size && !placed; c++) {
                  if (tempGrid[r][c].letter) {
                    const charIdx = word.indexOf(tempGrid[r][c].letter);
                    if (charIdx !== -1) {
                      // Found shared letter, try opposite direction
                      // We need to know the direction of the word already at tempGrid[r][c]
                      // For simplicity, we try BOTH directions and see if one works.
                      const directions = ['ACROSS', 'DOWN'];
                      for (const dir of directions) {
                        const sR = dir === 'ACROSS' ? r : r - charIdx;
                        const sC = dir === 'ACROSS' ? c - charIdx : c;

                        if (canPlace(word, sR, sC, dir, tempGrid)) {
                          clue.startRow = sR;
                          clue.startCol = sC;
                          clue.direction = dir;
                          clue.status = 'PLACED';
                          
                          // Fill temp grid
                          for (let j = 0; j < word.length; j++) {
                            const currR = dir === 'ACROSS' ? sR : sR + j;
                            const currC = dir === 'ACROSS' ? sC + j : sC;
                            tempGrid[currR][currC].letter = word[j];
                          }
                          placed = true;
                          break;
                        }
                      }
                    }
                  }
                }
              }
            }

            this.generateGrid();
            this.localSave();
            
            const unplacedCount = this.clues.filter(c => c.status === 'UNPLACED' && c.answer).length;
            if (unplacedCount > 0) {
              alert(\`Beres! \${unplacedCount} kata tidak bisa ditempatkan secara otomatis karena tidak ada irisan yang valid.\`);
            }
          },

          generateGrid() {
            const size = parseInt(this.gridSize);
            // Create empty grid: Array<Array<{letter:string, isBlack:boolean, number:number|null}>>
            const newGrid = Array(size).fill(null).map(() => 
              Array(size).fill(null).map(() => ({ letter: '', isBlack: true, number: null }))
            );

            // Sort clues to handle numbering correctly if multiple clues start at same cell
            const sortedClues = [...this.clues].sort((a, b) => {
              if (a.startRow !== b.startRow) return a.startRow - b.startRow;
              return a.startCol - b.startCol;
            });

            // Map to keep track of numbers assigned to cells
            const cellNumbers = new Map();

            for (const clue of this.clues) {
              const answer = (clue.answer || '').trim().toUpperCase();
              if (!answer) continue;

              const r = parseInt(clue.startRow);
              const c = parseInt(clue.startCol);
              const dir = clue.direction;

              // Check boundaries
              if (r < 0 || r >= size || c < 0 || c >= size) continue;
              
              // Assign number to start cell if not already assigned
              const cellKey = \`\${r},\${c}\`;
              if (!cellNumbers.has(cellKey)) {
                // Actually, the clue has its own number in this model.
                // In traditional crosswords, number is tied to the cell.
                // But here we use clue.number for simplicity as per requirement.
                newGrid[r][c].number = clue.number;
                cellNumbers.set(cellKey, clue.number);
              } else {
                // If cell already has a number, we might need to display multiple? 
                // Or just use the first one. Requirement says clue has number.
                // Let's ensure the grid reflects the clue number at the start cell.
                newGrid[r][c].number = cellNumbers.get(cellKey);
              }

              for (let i = 0; i < answer.length; i++) {
                const currR = dir === 'ACROSS' ? r : r + i;
                const currC = dir === 'ACROSS' ? c + i : c;

                if (currR >= size || currC >= size) break;

                const cell = newGrid[currR][currC];
                
                // Conflict check
                if (cell.letter && cell.letter !== answer[i]) {
                  // Conflict! Mark as error in UI maybe? 
                  // For now, overwrite or skip.
                }

                cell.letter = answer[i];
                cell.isBlack = false;
              }
            }

            // Flag conflicts
            for (const clue of this.clues) {
              const answer = (clue.answer || '').trim().toUpperCase();
              if (!answer || clue.startRow === -1) continue;
              
              let hasConflict = false;
              for (let i = 0; i < answer.length; i++) {
                const currR = clue.direction === 'ACROSS' ? clue.startRow : parseInt(clue.startRow) + i;
                const currC = clue.direction === 'ACROSS' ? parseInt(clue.startCol) + i : clue.startCol;
                if (currR >= size || currC >= size || newGrid[currR][currC].letter !== answer[i]) {
                  hasConflict = true;
                  break;
                }
              }
              if (hasConflict) clue.status = 'CONFLICT';
              else if (clue.status !== 'UNPLACED') clue.status = 'PLACED';
            }

            this.grid = newGrid;
          },

          async saveToServer() {
            if (this.clues.length < 3) {
              alert('Minimal 3 clue untuk menyimpan ke cloud.');
              return;
            }

            this.isSaving = true;
            this.saveStatus = 'UPLOADING';
            try {
              const res = await fetch('/api/crossword/' + this.projectId + '/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clues: this.clues,
                  gridSize: this.gridSize,
                  difficulty: this.difficulty,
                  score: this.clues.length * (this.difficulty === 'EASY' ? 10 : this.difficulty === 'MEDIUM' ? 20 : 50),
                  gridData: this.grid
                })
              });

              if (res.ok) {
                localStorage.removeItem('crossword_draft_' + this.projectId);
                this.saveStatus = 'CLOUD SYNCED';
                setTimeout(() => { this.saveStatus = 'SYNCHRONIZED'; }, 3000);
              } else {
                alert('Gagal menyimpan ke cloud.');
                this.saveStatus = 'LOCAL SAVED';
              }
            } catch (e) {
              alert('Terjadi kesalahan jaringan.');
              this.saveStatus = 'LOCAL SAVED';
            } finally {
              this.isSaving = false;
            }
          },
          previewGame() {
            this.$dispatch('open-preview', {
              gameType: 'CROSSWORD',
              gridSize: this.gridSize,
              difficulty: this.difficulty,
              clues: this.clues,
              gridData: this.grid
            });
          }
        }));
      };
      if (window.Alpine) init();
      else document.addEventListener('alpine:init', init);
    })();
  </script>
`;

export const CrosswordEditor = ({ projectVar = 'activeProject' }: { projectVar?: string }) => {
  return `
    <div x-data="crosswordEditor(${projectVar})" class="space-y-10 animate-in fade-in duration-500">
      <div class="w-full">
        <!-- Header Section -->
        <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 bg-[#FFC107] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1A237E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-black text-[#1A237E] uppercase tracking-tighter leading-none">Editor Teka-Teki Silang</h2>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Penyusun Crossword Edukatif</span>
                <span class="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span :class="{
                  'text-green-500': saveStatus === 'SYNCHRONIZED' || saveStatus === 'CLOUD SYNCED',
                  'text-orange-500': saveStatus === 'LOCAL SAVED',
                  'text-blue-500': saveStatus === 'UPLOADING'
                }" class="text-[9px] font-black uppercase tracking-widest" x-text="saveStatus"></span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3 w-full xl:w-auto">
            <button @click="autoGenerateLayout()" class="flex-1 xl:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-2 border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               GENERATE GRID OTOMATIS
            </button>
            <button @click="saveToServer()" :disabled="isSaving" class="flex-1 xl:flex-none bg-[#FF5722] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#E64A19] transition-all shadow-xl flex items-center justify-center gap-2 border-b-4 border-orange-950 active:border-b-0 active:translate-y-1 disabled:opacity-50">
               <svg x-show="!isSaving" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
               <span x-text="isSaving ? 'UPLOADING...' : 'SIMPAN KE CLOUD'"></span>
            </button>
            <button @click="previewGame()" class="flex-1 xl:flex-none bg-[#1A237E] text-[#FFC107] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-900 transition-all shadow-xl flex items-center justify-center gap-2 border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               PREVIEW GAME
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <!-- Left Panel: Form Input (7 cols) -->
          <div class="xl:col-span-7 space-y-8">
            <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
              <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-1">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tingkat Kesulitan</label>
                  <div class="grid grid-cols-3 gap-2">
                    <template x-for="diff in ['EASY', 'MEDIUM', 'HARD']">
                      <button @click="difficulty = diff" 
                              :class="difficulty === diff ? 'bg-[#1A237E] text-[#FFC107] border-[#1A237E] shadow-lg scale-105' : 'bg-slate-50 text-slate-400 border-slate-100'"
                              class="py-3 rounded-xl border-2 font-black text-[10px] transition-all uppercase tracking-widest"
                              x-text="diff"></button>
                    </template>
                  </div>
                </div>
                <div class="md:w-1/3">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Ukuran Grid</label>
                  <select x-model="gridSize" class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-black text-[#1A237E] outline-none focus:border-[#FFC107] transition-all cursor-pointer">
                    <option value="10">10 x 10</option>
                    <option value="12">12 x 12</option>
                    <option value="15">15 x 15</option>
                    <option value="20">20 x 20</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-between items-center pt-4 border-t border-slate-50">
                <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest flex items-center gap-2">
                  Daftar Clue & Jawaban
                  <span class="bg-[#1A237E] text-[#FFC107] text-[10px] px-2 py-0.5 rounded-full" x-text="clues.length"></span>
                </h3>
                <button @click="addClue()" class="bg-[#FFC107] text-[#1A237E] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                  Tambah Clue
                </button>
              </div>

              <div class="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <template x-for="(clue, index) in clues" :key="index">
                  <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 relative group animate-in slide-in-from-bottom-4 duration-300">
                    <button @click="removeClue(index)" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    </button>

                    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <!-- Basic Info -->
                      <div class="md:col-span-2">
                        <div class="flex justify-between items-center mb-1">
                          <label class="block text-[10px] font-black text-slate-500 uppercase">Nomor</label>
                          <template x-if="clue.status === 'UNPLACED'">
                            <span class="text-[8px] font-black text-red-500 animate-pulse">! UNPLACED</span>
                          </template>
                          <template x-if="clue.status === 'CONFLICT'">
                            <span class="text-[8px] font-black text-orange-500 animate-pulse">! CONFLICT</span>
                          </template>
                        </div>
                        <input type="number" x-model="clue.number" class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-black text-[#1A237E] outline-none focus:border-[#FFC107] transition-all" :class="clue.status === 'UNPLACED' ? 'border-red-200' : (clue.status === 'CONFLICT' ? 'border-orange-200' : '')">
                      </div>
                      <div class="md:col-span-4">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">Arah</label>
                        <select x-model="clue.direction" class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-black text-[#1A237E] outline-none focus:border-[#FFC107] transition-all appearance-none cursor-pointer">
                          <option value="ACROSS">Mendatar (Across)</option>
                          <option value="DOWN">Menurun (Down)</option>
                        </select>
                      </div>
                      <div class="md:col-span-6">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">Jawaban (A-Z)</label>
                        <input type="text" x-model="clue.answer" @input="clue.answer = clue.answer.toUpperCase().replace(/[^A-Z]/g, '')" placeholder="CONTOH: IMAN" class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-black text-[#FF5722] placeholder:text-slate-300 outline-none focus:border-[#FFC107] transition-all">
                      </div>

                      <!-- Position -->
                      <div class="md:col-span-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">Baris (Row)</label>
                        <input type="number" x-model="clue.startRow" class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-black text-[#1A237E] outline-none focus:border-[#FFC107] transition-all">
                      </div>
                      <div class="md:col-span-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">Kolom (Col)</label>
                        <input type="number" x-model="clue.startCol" class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-black text-[#1A237E] outline-none focus:border-[#FFC107] transition-all">
                      </div>
                      <div class="md:col-span-6">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">Pertanyaan / Clue</label>
                        <input type="text" x-model="clue.clue" placeholder="Pertanyaan untuk jawaban ini..." class="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#FFC107] transition-all">
                      </div>

                      <!-- Explanation -->
                      <div class="md:col-span-12">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-1">Penjelasan Edukatif</label>
                        <textarea x-model="clue.explanation" placeholder="Penjelasan yang tampil setelah kata terjawab..." class="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-600 placeholder:text-slate-300 outline-none focus:border-[#FFC107] transition-all h-24 resize-none"></textarea>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Right Panel: Preview (5 cols) -->
          <div class="xl:col-span-5 space-y-8">
             <div class="bg-[#1A237E] p-6 sm:p-10 rounded-[3rem] shadow-2xl border-8 border-white/10 relative overflow-hidden flex items-center justify-center min-h-[500px]">
                <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                
                <div class="relative z-10 w-full overflow-auto max-h-[450px] p-2 flex justify-center custom-scrollbar">
                  <div class="grid gap-px bg-white/20 border border-white/20 shadow-2xl" 
                       :style="'grid-template-columns: repeat(' + gridSize + ', minmax(0, 1fr))'">
                    <template x-for="(row, rIdx) in grid">
                      <template x-for="(cell, cIdx) in row">
                        <div class="h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 relative transition-all duration-300"
                             :class="cell.isBlack ? 'bg-[#0D1240]' : 'bg-white hover:bg-[#FFC107] group'">
                          
                          <!-- Number Label -->
                          <span x-show="cell.number" 
                                class="absolute top-0.5 left-0.5 text-[6px] md:text-[8px] font-black leading-none"
                                :class="cell.isBlack ? 'text-white/20' : 'text-[#1A237E]'"
                                x-text="cell.number"></span>
                          
                          <!-- Letter (Visible for editor preview) -->
                          <span x-show="!cell.isBlack" 
                                class="w-full h-full flex items-center justify-center font-black text-[#1A237E] text-[10px] md:text-sm uppercase"
                                x-text="cell.letter"></span>
                        </div>
                      </template>
                    </template>
                  </div>
                </div>

                <!-- Floating Label -->
                <div class="absolute bottom-6 right-6 bg-[#FFC107] text-[#1A237E] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                  LIVE PREVIEW
                </div>
             </div>

             <!-- Guidelines -->
             <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
                <h4 class="text-xs font-black text-[#1A237E] uppercase tracking-widest flex items-center gap-2">
                  <div class="h-2 w-2 bg-[#FF5722] rounded-full animate-pulse"></div>
                  Panduan Penyusunan
                </h4>
                <ul class="space-y-3">
                  <li class="flex gap-3">
                    <div class="h-5 w-5 bg-orange-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#FF5722] shrink-0">1</div>
                    <p class="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Tentukan posisi awal (Baris & Kolom) mulai dari 0.</p>
                  </li>
                  <li class="flex gap-3">
                    <div class="h-5 w-5 bg-orange-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#FF5722] shrink-0">2</div>
                    <p class="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Gunakan grid yang cukup besar agar kata tidak terpotong.</p>
                  </li>
                  <li class="flex gap-3">
                    <div class="h-5 w-5 bg-orange-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#FF5722] shrink-0">3</div>
                    <p class="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Pastikan penjelasan edukatif memberikan wawasan teologis yang baik.</p>
                  </li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
