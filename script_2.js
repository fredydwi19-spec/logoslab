
      window.publicGamePlayerData = function() {
        return {
          activeGame: null,
          questions: [],
          isPlaying: false,
          currentIndex: 0,
          selectedAnswer: null,
          showFeedback: false,
          currentScore: 0,
          maxScore: 0,
          correctCount: 0,
          wrongCount: 0,
          gameFinished: false,
          gameData: null,
          isCorrect: false,
          userFTBAnswers: [],
          submissionResults: [],
          
          async playGame(id) {
            console.log('Playing public game:', id);
            try {
              const res = await fetch('/api/projects/' + id);
              if (res.status === 401) {
                  alert('Silakan login untuk memainkan game ini.');
                  if(document.getElementById('btn-login-trigger')){
                      document.getElementById('btn-login-trigger').click();
                  }
                  return;
              }
              const json = await res.json();
              if(json.success) {
                this.activeGame = json.data;
                this.questions = json.data.questions || [];
                if(this.questions.length === 0) {
                   alert('Game ini belum memiliki soal.');
                   return;
                }
                this.maxScore = this.questions.reduce((acc, q) => acc + (q.score || this.getPoints(q.difficulty)), 0);
                this.currentIndex = 0;
                this.currentScore = 0;
                this.correctCount = 0;
                this.wrongCount = 0;
                this.selectedAnswer = null;
                this.showFeedback = false;
                this.gameFinished = false;
                this.userFTBAnswers = [];
                this.submissionResults = [];
                this.gameData = null;

                if (this.activeGame.gameType === 'WORD_SEARCH') {
                  const wsRes = await fetch('/api/word-search/' + id);
                  const wsJson = await wsRes.json();
                  if (wsJson.success && wsJson.data) {
                    this.gameData = wsJson.data;
                  } else {
                    alert('Data Word Search tidak ditemukan.');
                    return;
                  }
                }

                this.isPlaying = true;
              } else {
                 alert('Gagal memuat game dari server.');
              }
            } catch (e) {
              console.error('Error fetching game:', e);
              alert('Terjadi kesalahan jaringan.');
            }
          },

          getPoints(diff) {
             const points = { 'RENDAH': 10, 'SEDANG': 20, 'SULIT': 50, 'BONUS': 30 };
             return points[diff] || 10;
          },

          selectAnswer(opt) {
            if(this.showFeedback) return;
            this.selectedAnswer = opt;
            
            if(opt === this.questions[this.currentIndex].correctAnswer) {
               this.currentScore += (this.questions[this.currentIndex].score || this.getPoints(this.questions[this.currentIndex].difficulty));
               this.correctCount++;
               this.isCorrect = true;
            } else {
               this.wrongCount++;
               this.isCorrect = false;
            }
            this.showFeedback = true;
          },

          renderFTB(q) {
            if(!q || !q.fullText) return '';
            let text = q.fullText;
            const answers = q.answers || [];
            
            const sortedAnswers = [...answers].sort((a, b) => b.word.length - a.word.length);
            
            sortedAnswers.forEach((ans, i) => {
              const regex = new RegExp(ans.word, 'gi');
              text = text.replace(regex, '<input type="text" class="ftb-input border-b-4 border-[#FFC107] outline-none text-center px-4 py-1 text-[#FF5722] bg-[#1A237E]/5 rounded-t-xl w-32 mx-2 font-black" placeholder="..." onchange="window.updatePublicFTB(' + i + ', this.value)">');
            });
            
            window.updatePublicFTB = (idx, val) => {
              this.userFTBAnswers[idx] = val;
            };
            
            return text;
          },

          async checkAnswerFTB() {
            const question = this.questions[this.currentIndex];
            const res = await fetch('/api/projects/' + this.activeGame.id + '/submit', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                questionId: question.id,
                userAnswers: this.userFTBAnswers
              })
            });
            const json = await res.json();
            if(json.success) {
              this.isCorrect = json.allCorrect;
              this.currentScore += json.scoreEarned;
              if(this.isCorrect) this.correctCount++; else this.wrongCount++;
              this.submissionResults = json.details;
              this.showFeedback = true;
            }
          },

          nextQuestion() {
            if(this.currentIndex < this.questions.length - 1) {
              this.currentIndex++;
              this.selectedAnswer = null;
              this.showFeedback = false;
              this.userFTBAnswers = [];
              this.submissionResults = [];
            } else {
              this.gameFinished = true;
            }
          },

          quitGame() {
            this.isPlaying = false;
            this.activeGame = null;
          }
        };
      };
      
      // Global hook for Alpine component so links can trigger the game
      window.triggerPublicGame = function(id) {
          const gameEl = document.querySelector('[x-data="publicGamePlayerData()"]');
          if (gameEl && gameEl.__x) {
              gameEl.__x.$data.playGame(id);
          } else if (gameEl && Alpine) {
              Alpine.$data(gameEl).playGame(id);
          } else {
              // Wait for Alpine to init
              document.addEventListener('alpine:initialized', () => {
                  const el = document.querySelector('[x-data="publicGamePlayerData()"]');
                  Alpine.$data(el).playGame(id);
              }, {once: true});
          }
      };
    