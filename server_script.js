
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
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  