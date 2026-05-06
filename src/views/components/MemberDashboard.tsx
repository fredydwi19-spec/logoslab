export const MemberDashboard = ({ publishedGames, username }: { publishedGames: any[], username: string }) => {
  return `
    <div class="space-y-10" x-data="memberDashboardData()">
         
      <!-- Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-gradient-to-br from-[#1A237E] to-blue-700 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
          <div class="absolute -right-4 -bottom-4 text-9xl opacity-10 group-hover:scale-110 transition-transform">⭐</div>
          <div class="relative z-10">
            <h3 class="text-sm font-black uppercase tracking-[0.2em] opacity-80 mb-2">Peringkat Saya</h3>
            <div class="text-4xl font-black mb-2">Level 12</div>
            <p class="text-blue-100 text-xs font-bold uppercase tracking-widest">Pelajar Alkitab Setia</p>
          </div>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden group">
           <div class="absolute -right-4 -bottom-4 text-9xl opacity-5 text-slate-200">🎮</div>
           <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Game Selesai</h3>
           <div class="text-4xl font-black text-[#1A237E]">15</div>
           <div class="mt-4 flex items-center gap-2">
             <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-[#FFC107] w-[65%]"></div>
             </div>
             <span class="text-[10px] font-black text-slate-400">65%</span>
           </div>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden group">
           <div class="absolute -right-4 -bottom-4 text-9xl opacity-5 text-slate-200">💎</div>
           <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Skor</h3>
           <div class="text-4xl font-black text-[#FF5722]">2,450</div>
           <p class="text-[10px] text-slate-400 font-bold mt-2 uppercase">Kumpulkan poin untuk hadiah!</p>
        </div>
      </div>

      <!-- Published Games Grid -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
             <div class="h-8 w-2 bg-[#FFC107] rounded-full"></div>
             <h2 class="text-2xl font-black text-[#1A237E] uppercase tracking-wider">Permainan Tersedia</h2>
          </div>
          <a href="#" class="text-[10px] font-black text-[#FF5722] uppercase tracking-widest hover:underline">Lihat Semua &rarr;</a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          ${publishedGames.map(game => `
            <div class="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-100 group transform hover:-translate-y-2">
               <div class="relative h-48 overflow-hidden cursor-pointer" @click="playGame(${game.id})">
                  <img src="${game.thumbnailUrl || 'https://via.placeholder.com/400x250?text=Logos+LAB'}" class="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#1A237E]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                     <button class="w-full bg-[#FFC107] text-[#1A237E] py-3 rounded-xl font-black uppercase tracking-widest shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">Mainkan Sekarang</button>
                  </div>
                  <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-[#1A237E] uppercase tracking-widest shadow-sm">${game.gameType}</div>
               </div>
               <div class="p-6">
                  <h4 class="text-lg font-black text-[#1A237E] mb-2 group-hover:text-[#FF5722] transition-colors line-clamp-1 cursor-pointer" @click="playGame(${game.id})">${game.title}</h4>
                  <p class="text-slate-500 text-xs font-medium line-clamp-2 mb-4 italic leading-relaxed">${game.description || 'Mari asah pengetahuan Alkitabmu dengan game seru ini!'}</p>
                  <div class="flex items-center justify-between pt-4 border-t border-slate-50">
                     <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Logos Team</span>
                     </div>
                     <span class="text-[10px] font-black text-[#FFC107] bg-[#FFC107]/10 px-2 py-1 rounded-md uppercase tracking-tighter">Baru</span>
                  </div>
               </div>
            </div>
          `).join('')}
          ${publishedGames.length === 0 ? `
            <div class="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
               <div class="text-6xl mb-4 opacity-20">💤</div>
               <p class="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Belum ada permainan yang dirilis saat ini.</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Game Modal Player -->
      <div x-show="isPlaying" x-cloak x-transition class="fixed inset-0 bg-[#1A237E]/95 flex items-center justify-center z-[200] backdrop-blur-xl p-4 md:p-10">
         <!-- Game Container -->
         <div class="bg-white w-full max-w-5xl h-full md:h-[90vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-4 md:border-8 border-white/20">
            
            <template x-if="isPlaying && !gameFinished">
               <div class="flex flex-col h-full">
                  <!-- Game Header -->
                  <div class="bg-[#1A237E] px-6 md:px-10 py-4 md:py-6 text-white flex justify-between items-center border-b-4 border-[#FFC107]">
                     <div class="flex items-center gap-3 md:gap-4">
                        <img src="/public/assets/Logo LogosLAB.png" class="h-8 md:h-10 w-auto bg-white p-1 rounded-lg" />
                        <div>
                           <h3 class="text-xs md:text-sm font-black uppercase tracking-widest text-[#FFC107]" x-text="activeGame?.title"></h3>
                           <p class="text-[8px] md:text-[9px] font-bold opacity-60 uppercase tracking-widest" x-text="'Soal ' + (currentIndex + 1) + ' dari ' + questions.length"></p>
                        </div>
                     </div>
                     <div class="flex items-center gap-4 md:gap-6">
                        <div class="text-right hidden sm:block">
                           <p class="text-[9px] font-black uppercase opacity-60">Skor Saat Ini</p>
                           <div class="text-xl md:text-2xl font-black text-[#FFC107]" x-text="currentScore"></div>
                        </div>
                        <button @click="quitGame()" class="bg-white/10 hover:bg-red-500 text-white p-2 md:p-3 rounded-full transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="h-2 w-full bg-slate-100 relative">
                     <div class="h-full bg-[#FF5722] transition-all duration-500" :style="'width: ' + ((currentIndex + 1) / questions.length * 100) + '%'"></div>
                              <!-- Question Body -->
                  <div class="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50 flex items-center justify-center relative">
                     <div class="w-full max-w-3xl text-center">
                        <div class="inline-block bg-[#1A237E] text-white px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6" x-text="questions[currentIndex]?.difficulty + ' (+' + (questions[currentIndex]?.score || getPoints(questions[currentIndex]?.difficulty)) + ' POIN)'"></div>
                        
                        <!-- Quiz Content -->
                        <template x-if="activeGame?.gameType === 'QUIZ'">
                          <div>
                            <h2 class="text-xl md:text-3xl font-black text-[#1A237E] mb-6 md:mb-12 leading-tight" x-text="questions[currentIndex]?.question"></h2>
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
                                     <span class="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-lg transition-colors" 
                                           :class="showFeedback && opt === questions[currentIndex]?.correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] group-hover:text-[#1A237E] text-slate-400'">
                                        <span x-text="opt"></span>
                                     </span>
                                     <span class="text-[#1A237E] font-black text-sm md:text-lg" x-text="questions[currentIndex] ? questions[currentIndex]['option' + opt] : ''"></span>
                                  </button>
                               </template>
                            </div>
                          </div>
                        </template>

                        <!-- Fill The Blank Content -->
                        <template x-if="activeGame?.gameType === 'FILL_THE_BLANK'">
                          <div class="flex flex-col items-center">
                            <div class="text-xl md:text-2xl font-bold text-[#1A237E] mb-10 leading-relaxed bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-inner border-2 border-slate-100 w-full" 
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

            <!-- Result Screen -->
            <template x-if="gameFinished">
               <div class="h-full flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-br from-white to-blue-50 text-center">
                  <div class="w-full max-w-2xl">
                     <div class="mb-6 md:mb-10 relative inline-block">
                        <div class="text-6xl md:text-8xl mb-4 animate-bounce">🏆</div>
                        <div class="absolute -top-4 -right-4 bg-[#FFC107] text-[#1A237E] h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center font-black shadow-xl ring-4 ring-white">100</div>
                     </div>
                     
                     <h2 class="text-2xl md:text-4xl font-black text-[#1A237E] uppercase tracking-widest mb-2">Permainan Selesai!</h2>
                     <p class="text-slate-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-8 md:mb-12">Kerja bagus, <span x-text="username"></span>!</p>
                     
                     <!-- Stats Grid -->
                     <div class="grid grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-[#FFC107]">
                           <div class="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Skor</div>
                           <div class="text-xl md:text-3xl font-black text-[#1A237E]"><span x-text="currentScore"></span><span class="text-xs md:text-sm opacity-30"> / <span x-text="maxScore"></span></span></div>
                        </div>
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-green-500">
                           <div class="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Benar</div>
                           <div class="text-xl md:text-3xl font-black text-green-600" x-text="correctCount"></div>
                        </div>
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-red-500">
                           <div class="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salah</div>
                           <div class="text-xl md:text-3xl font-black text-red-600" x-text="wrongCount"></div>
                        </div>
                     </div>

                     <div class="space-y-4">
                        <button @click="quitGame()" class="w-full bg-[#1A237E] text-[#FFC107] py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-indigo-900 transition-all shadow-2xl transform hover:scale-105">SIMPAN & SELESAI</button>
                        <p class="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-50">Skor Anda akan tercatat di papan peringkat.</p>
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
      window.memberDashboardData = function() {
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
          username: '${username}',
          isCorrect: false,
          userFTBAnswers: [],
          submissionResults: [],
          
          async playGame(id) {
            console.log('Playing game:', id);
            try {
              const res = await fetch('/api/projects/' + id);
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
            
            // Sort answers by length descending to avoid partial replacement issues
            const sortedAnswers = [...answers].sort((a, b) => b.word.length - a.word.length);
            
            sortedAnswers.forEach((ans, i) => {
              const regex = new RegExp(ans.word, 'gi');
              text = text.replace(regex, '<input type="text" class="ftb-input border-b-4 border-[#FFC107] outline-none text-center px-4 py-1 text-[#FF5722] bg-[#1A237E]/5 rounded-t-xl w-32 mx-2 font-black" placeholder="..." onchange="window.updateMemberFTB(' + i + ', this.value)">');
            });
            
            window.updateMemberFTB = (idx, val) => {
              this.userFTBAnswers[idx] = val;
            };
            
            return text;
          },

          async checkAnswerFTB() {
            const question = this.questions[this.currentIndex];
            const res = await fetch(\`/api/projects/\${this.activeGame.id}/submit\`, {
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
    </script>
  `;
};
