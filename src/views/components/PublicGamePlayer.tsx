import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";

export const PublicGamePlayer = () => {
  return `
    <div x-data="publicGamePlayerData()">
      <!-- Game Modal Player -->
      <div x-show="isPlaying" x-cloak x-transition class="fixed inset-0 bg-[#1A237E]/95 flex items-center justify-center z-[200] backdrop-blur-xl p-4 md:p-10">
         <!-- Game Container -->
         <div class="bg-white w-full max-w-5xl h-full md:h-[90vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-4 md:border-8 border-white/20">
            
            <template x-if="isPlaying && !gameFinished && activeGame?.gameType !== 'WORD_SEARCH'">
               <div class="flex flex-col h-full">
                  <!-- Game Header -->
                  <div class="bg-[#1A237E] px-6 md:px-10 py-4 md:py-6 text-white flex justify-between items-center border-b-4 border-[#FFC107]">
                     <div class="flex items-center gap-3 md:gap-4">
                        <img src="/public/assets/logo-logoslab.png" class="h-8 md:h-10 w-auto bg-white p-1 rounded-lg" />
                        <div>
                           <h3 class="text-xs md:text-sm font-bold uppercase tracking-widest text-[#FFC107]" x-text="activeGame?.title"></h3>
                           <p class="text-[9px] font-medium opacity-60 uppercase tracking-widest" x-text="'Soal ' + (currentIndex + 1) + ' dari ' + questions.length"></p>
                        </div>
                     </div>
                     <div class="flex items-center gap-4 md:gap-6">
                        <div class="text-right hidden sm:block">
                           <p class="text-[9px] font-medium uppercase opacity-60">Skor Saat Ini</p>
                           <div class="text-xl md:text-2xl font-bold text-[#FFC107]" x-text="currentScore"></div>
                        </div>
                        <button @click="quitGame()" class="bg-white/10 hover:bg-red-500 text-white p-2 md:p-3 rounded-full transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="h-2 w-full bg-slate-100 relative">
                     <div class="h-full bg-[#FF5722] transition-all duration-500" :style="'width: ' + ((currentIndex + 1) / questions.length * 100) + '%'"></div>
                  </div>
                  
                  <!-- Question Body -->
                  <div class="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50 flex items-center justify-center relative">
                     <div class="w-full max-w-3xl text-center">
                        <div class="inline-block bg-[#1A237E] text-white px-4 py-1 rounded-full text-[9px] md:text-[10px] font-medium uppercase tracking-widest mb-4 md:mb-6" x-text="questions[currentIndex]?.difficulty + ' (+' + (questions[currentIndex]?.score || getPoints(questions[currentIndex]?.difficulty)) + ' POIN)'"></div>
                        
                        <!-- Quiz Content -->
                        <template x-if="activeGame?.gameType === 'QUIZ'">
                          <div>
                            <h2 class="text-lg md:text-2xl font-bold text-[#1A237E] mb-6 md:mb-12 leading-tight" x-text="questions[currentIndex]?.question"></h2>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                               <template x-for="opt in ['A', 'B', 'C', 'D']">
                                  <button @click="selectAnswer(opt)" 
                                     :class="{
                                        'border-[#FFC107] bg-yellow-50 scale-105': selectedAnswer === opt && !showFeedback,
                                        'border-green-500 bg-green-50 shadow-green-100': showFeedback && opt === questions[currentIndex]?.correctAnswer,
                                        'border-red-500 bg-red-50 shadow-red-100': showFeedback && selectedAnswer === opt && opt !== questions[currentIndex]?.correctAnswer,
                                        'border-slate-100 bg-white hover:border-[#1A237E] hover:shadow-xl hover:-translate-y-1': !showFeedback && selectedAnswer !== opt
                                     }"
                                     class="border-4 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] text-left flex items-center gap-3 md:gap-5 transition-all group disabled:cursor-default"
                                     :disabled="showFeedback">
                                     <span class="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-sm md:text-lg transition-colors" 
                                           :class="showFeedback && opt === questions[currentIndex]?.correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] group-hover:text-[#1A237E] text-slate-400'">
                                        <span x-text="opt"></span>
                                     </span>
                                     <span class="text-[#1A237E] font-semibold text-sm md:text-base" x-text="questions[currentIndex] ? questions[currentIndex]['option' + opt] : ''"></span>
                                  </button>
                               </template>
                            </div>
                          </div>
                        </template>

                        <!-- Fill The Blank Content -->
                        <template x-if="activeGame?.gameType === 'FILL_THE_BLANK'">
                          <div class="flex flex-col items-center">
                            <div class="text-lg md:text-xl font-medium text-[#1A237E] mb-10 leading-relaxed bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-inner border-2 border-slate-100 w-full" 
                                 x-html="renderFTB(questions[currentIndex])"></div>
                            
                            <div class="mt-4" x-show="!showFeedback">
                              <button @click="checkAnswerFTB()" class="bg-[#FF5722] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#E64A19] transition-all transform hover:scale-105">PERIKSA JAWABAN</button>
                            </div>
                          </div>
                        </template>

                        <!-- Educational Feedback -->
                        <div x-show="showFeedback" x-transition class="mt-8 md:mt-10 p-6 md:p-8 rounded-2xl md:rounded-3xl text-left border-4 border-dashed"
                             :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                           <div class="flex items-center gap-3 mb-2 md:mb-3">
                              <span class="text-xl md:text-2xl" x-text="isCorrect ? '✨' : '💡'"></span>
                              <h4 class="font-black uppercase tracking-widest text-xs md:text-sm" :class="isCorrect ? 'text-green-800' : 'text-red-800'">
                                 <span x-text="isCorrect ? 'Jawaban Kamu Tepat!' : 'Belum Tepat, Ini Penjelasannya:'"></span>
                              </h4>
                           </div>
                           
                           <div class="space-y-3">
                             <template x-if="activeGame?.gameType === 'QUIZ'">
                               <p class="text-slate-700 font-bold italic text-sm md:text-base leading-relaxed" x-text="questions[currentIndex]?.explanation"></p>
                             </template>
                             <template x-if="activeGame?.gameType === 'FILL_THE_BLANK'">
                               <div class="space-y-3">
                                 <template x-for="(res, ridx) in submissionResults" :key="ridx">
                                   <div class="text-xs md:text-sm font-bold border-l-4 pl-4 py-1" :class="res.isCorrect ? 'border-green-400 bg-green-100/30' : 'border-red-400 bg-red-100/30'">
                                     <span class="text-[#1A237E] uppercase tracking-tighter" x-text="res.correctAnswer"></span>: 
                                     <span class="text-slate-500 italic" x-text="res.explanation"></span>
                                   </div>
                                 </template>
                               </div>
                             </template>
                           </div>
                           
                           <div class="mt-4 md:mt-6 flex justify-end">
                              <button @click="nextQuestion()" class="bg-[#1A237E] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg flex items-center gap-2 text-xs md:text-sm">
                                 <span x-text="currentIndex === questions.length - 1 ? 'LIHAT HASIL AKHIR' : 'SOAL BERIKUTNYA'"></span>
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </template>

            <!-- Word Search Gameplay -->
            <template x-if="isPlaying && !gameFinished && activeGame?.gameType === 'WORD_SEARCH' && gameData">
               <div class="flex-1 overflow-y-auto bg-slate-50">
                   ${WordSearchGame({ projectVar: 'activeGame', gameDataVar: 'gameData' })}
               </div>
            </template>

            <!-- Result Screen -->
            <template x-if="gameFinished && activeGame?.gameType !== 'WORD_SEARCH'">
               <div class="h-full flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-br from-white to-blue-50 text-center">
                  <div class="w-full max-w-2xl">
                     <div class="mb-6 md:mb-10 relative inline-block">
                        <div class="text-6xl md:text-8xl mb-4 animate-bounce">🏆</div>
                        <div class="absolute -top-4 -right-4 bg-[#FFC107] text-[#1A237E] h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center font-bold shadow-xl ring-4 ring-white">100</div>
                     </div>
                     
                     <h2 class="text-xl md:text-3xl font-bold text-[#1A237E] uppercase tracking-widest mb-2">Permainan Selesai!</h2>
                     <p class="text-slate-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-8 md:mb-12">Kerja bagus!</p>
                     
                     <!-- Stats Grid -->
                     <div class="grid grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-[#FFC107]">
                           <div class="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Total Skor</div>
                           <div class="text-xl md:text-2xl font-bold text-[#1A237E]"><span x-text="currentScore"></span><span class="text-xs md:text-sm opacity-30"> / <span x-text="maxScore"></span></span></div>
                        </div>
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-green-500">
                           <div class="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Benar</div>
                           <div class="text-xl md:text-2xl font-bold text-green-600" x-text="correctCount"></div>
                        </div>
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-red-500">
                           <div class="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Salah</div>
                           <div class="text-xl md:text-2xl font-bold text-red-600" x-text="wrongCount"></div>
                        </div>
                     </div>

                     <div class="space-y-4">
                        <button @click="quitGame()" class="w-full bg-[#1A237E] text-[#FFC107] py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-indigo-900 transition-all shadow-2xl transform hover:scale-105">TUTUP HASIL</button>
                     </div>
                  </div>
               </div>
            </template>

         </div>
      </div>
    </div>
    <style>
      [x-cloak] { display: none !important; }
      .ftb-input::placeholder { color: #cbd5e1; opacity: 0.5; }
    </style>
    
    <script>
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
    </script>
    ${WordSearchGameScript()}
  `;
};
