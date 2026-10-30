import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";

export const PublicGamePlayer = () => {
  return `
    <div x-data="publicGamePlayerData()" @game-level-finish="finishLevel($event.detail)">
      <!-- Game Modal Player -->
      <div x-show="isPlaying" x-cloak x-transition class="fixed inset-0 bg-primary/95 flex items-center justify-center z-[9999] backdrop-blur-xl p-4 md:p-6">
         <!-- Game Container -->
         <div class="bg-white w-full max-w-5xl h-[95vh] md:h-[90vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-4 md:border-8 border-white/20">
            
            <template x-if="isPlaying && !gameFinished && !showLevelMap && activeGame?.gameType !== 'WORD_SEARCH' && activeGame?.gameType !== 'CROSSWORD'">
               <div class="flex flex-col h-full">
                  <!-- Game Header -->
                  <div class="bg-primary px-6 md:px-10 py-2.5 md:py-6 text-white flex justify-between items-center border-b-4 border-highlight">
                     <div class="flex items-center gap-3 md:gap-4">
                        <img src="/public/assets/Logo-LogosLAB.png" class="h-8 md:h-10 w-auto bg-white p-1 rounded-lg" />
                        <div>
                           <h3 class="text-xs md:text-sm font-bold uppercase tracking-widest text-highlight" x-text="activeGame?.title"></h3>
                           <p class="text-[9px] font-medium opacity-60 uppercase tracking-widest" x-text="(levelCount() > 1 ? 'Level ' + currentLevel + ' · ' : '') + 'Soal ' + (currentIndex + 1) + ' dari ' + questions.length"></p>
                        </div>
                     </div>
                     <div class="flex items-center gap-4 md:gap-6">
                        <div class="text-right hidden sm:block">
                           <p class="text-[9px] font-medium uppercase opacity-60">Skor Saat Ini</p>
                           <div class="text-base md:text-lg font-bold text-highlight" x-text="currentScore"></div>
                        </div>
                        <button @click="quitGame()" class="bg-white/10 hover:bg-red-500 text-white p-2 md:p-3 rounded-full transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="h-2 w-full bg-slate-100 relative">
                     <div class="h-full bg-accent transition-all duration-500" :style="'width: ' + ((currentIndex + 1) / questions.length * 100) + '%'"></div>
                  </div>
                  
                  <!-- Question Body -->
                  <div class="flex-1 overflow-y-auto p-6 md:p-6 bg-slate-50 flex items-center justify-center relative">
                     <div class="w-full max-w-3xl text-center">
                        <div class="inline-block bg-primary text-white px-4 py-1 rounded-full text-[9px] md:text-[10px] font-medium uppercase tracking-widest mb-4 md:mb-6" x-text="questions[currentIndex]?.difficulty + ' (+' + (questions[currentIndex]?.score || getPoints(questions[currentIndex]?.difficulty)) + ' POIN)'"></div>
                        
                        <!-- Quiz Content -->
                        <template x-if="activeGame?.gameType === 'QUIZ'">
                          <div>
                            <h2 class="text-base md:text-lg font-bold text-primary mb-4 md:mb-8 leading-relaxed" x-text="questions[currentIndex]?.question"></h2>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                               <template x-for="opt in ['A', 'B', 'C', 'D']">
                                  <button @click="selectAnswer(opt)" 
                                     :class="{
                                        'border-highlight bg-yellow-50 scale-105': selectedAnswer === opt && !showFeedback,
                                        'border-green-500 bg-green-50 shadow-green-100': showFeedback && opt === quizFeedback?.correctAnswer,
                                        'border-red-500 bg-red-50 shadow-red-100': showFeedback && selectedAnswer === opt && opt !== quizFeedback?.correctAnswer,
                                        'border-slate-100 bg-white hover:border-primary hover:shadow-xl hover:-translate-y-1': !showFeedback && selectedAnswer !== opt
                                     }"
                                     class="border-4 p-3 md:p-5 rounded-xl md:rounded-2xl text-left flex items-center gap-3 transition-all group disabled:cursor-default"
                                     :disabled="showFeedback">
                                     <span class="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm transition-colors" 
                                           :class="showFeedback && opt === quizFeedback?.correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-highlight group-hover:text-primary text-slate-400'">
                                        <span x-text="opt"></span>
                                     </span>
                                     <span class="text-primary font-semibold text-xs md:text-sm" x-text="questions[currentIndex] ? questions[currentIndex]['option' + opt] : ''"></span>
                                  </button>
                               </template>
                            </div>
                          </div>
                        </template>

                        <!-- Fill The Blank Content -->
                        <template x-if="activeGame?.gameType === 'FILL_THE_BLANK'">
                          <div class="flex flex-col items-center">
                            <div class="text-lg md:text-base font-medium text-primary mb-10 leading-relaxed bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[3rem] shadow-inner border-2 border-slate-100 w-full" 
                                 x-html="renderFTB(questions[currentIndex])"></div>
                            
                            <div class="mt-4" x-show="!showFeedback">
                              <button @click="checkAnswerFTB()" class="bg-accent text-white px-10 py-2.5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-accent-hover transition-all transform hover:scale-105">PERIKSA JAWABAN</button>
                            </div>
                          </div>
                        </template>

                        <!-- Educational Feedback -->
                        <div x-show="showFeedback" x-transition class="mt-8 md:mt-10 p-6 md:p-5 rounded-2xl md:rounded-2xl text-left border-4 border-dashed"
                             :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                           <div class="flex items-center gap-3 mb-2 md:mb-3">
                              <span class="text-base md:text-lg" x-text="isCorrect ? '✨' : '💡'"></span>
                              <h4 class="font-black uppercase tracking-widest text-xs md:text-sm" :class="isCorrect ? 'text-green-800' : 'text-red-800'">
                                 <span x-text="isCorrect ? 'Jawaban Kamu Tepat!' : 'Belum Tepat, Ini Penjelasannya:'"></span>
                              </h4>
                           </div>
                           
                           <div class="space-y-3">
                             <template x-if="activeGame?.gameType === 'QUIZ'">
                               <p class="text-slate-700 font-bold italic text-sm md:text-base leading-relaxed" x-text="quizFeedback?.explanation"></p>
                             </template>
                             <template x-if="activeGame?.gameType === 'FILL_THE_BLANK'">
                               <div class="space-y-3">
                                 <template x-for="(res, ridx) in submissionResults" :key="ridx">
                                   <div class="text-xs md:text-sm font-bold border-l-4 pl-4 py-1" :class="res.isCorrect ? 'border-green-400 bg-green-100/30' : 'border-red-400 bg-red-100/30'">
                                     <span class="text-primary uppercase tracking-tighter" x-text="res.correctAnswer"></span>: 
                                     <span class="text-slate-500 italic" x-text="res.explanation"></span>
                                   </div>
                                 </template>
                               </div>
                             </template>
                           </div>
                           
                           <div class="mt-4 md:mt-6 flex justify-end">
                              <button @click="nextQuestion()" class="bg-primary text-white px-6 md:px-8 py-2 md:py-2 rounded-full font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg flex items-center gap-2 text-xs md:text-sm">
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
            <template x-if="isPlaying && !gameFinished && !showLevelMap && activeGame?.gameType === 'WORD_SEARCH' && gameData">
               <div class="flex-1 overflow-y-auto bg-slate-50">
                   ${WordSearchGame({ projectVar: 'activeGame', gameDataVar: 'gameData' })}
               </div>
            </template>

            <!-- Crossword (TTS) Gameplay -->
            <template x-if="isPlaying && !gameFinished && !showLevelMap && activeGame?.gameType === 'CROSSWORD' && gameData">
               <div class="flex-1 overflow-y-auto bg-slate-50">
                   ${CrosswordGame({ projectVar: 'activeGame', gameDataVar: 'gameData' })}
               </div>
            </template>

            <!-- Peta Level -->
            <template x-if="showLevelMap">
               <div class="flex flex-col h-full">
                  <div class="bg-primary px-6 md:px-10 py-4 text-white flex justify-between items-center border-b-4 border-highlight">
                     <div class="flex items-center gap-3 min-w-0">
                        <img src="/public/assets/Logo-LogosLAB.png" alt="Logos LAB" class="h-8 md:h-10 w-auto bg-white p-1 rounded-lg" />
                        <div class="min-w-0">
                           <h3 class="text-xs md:text-sm font-bold uppercase tracking-widest text-highlight truncate" x-text="activeGame?.title"></h3>
                           <p class="text-[9px] font-medium opacity-60 uppercase tracking-widest" x-text="'Peta Level · Lulus dengan nilai minimal ' + progress.passPercentage + '%'"></p>
                        </div>
                     </div>
                     <button @click="quitGame()" class="bg-white/10 hover:bg-red-500 text-white px-3 py-2 rounded-full transition-all" aria-label="Tutup"><i class="bi bi-x-lg"></i></button>
                  </div>
                  <div class="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50">
                     <template x-if="!progress.loggedIn">
                        <div class="mb-6 bg-amber-50 border-2 border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                           <i class="bi bi-person-lock text-xl"></i>
                           <span>Kamu bisa mencoba Level 1. Login untuk menyimpan skor dan membuka level berikutnya.</span>
                        </div>
                     </template>
                     <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <template x-for="lv in progress.levels" :key="lv.level">
                           <div class="bg-white rounded-2xl p-5 border-2 shadow-sm flex flex-col gap-3" :class="lv.passed ? 'border-green-300' : (lv.unlocked ? 'border-highlight' : 'border-slate-200 opacity-70')">
                              <div class="flex items-center justify-between">
                                 <span class="text-sm font-black text-primary uppercase tracking-widest" x-text="'Level ' + lv.level"></span>
                                 <span class="text-xl" :class="lv.passed ? 'text-green-600' : (lv.unlocked ? 'text-accent' : 'text-slate-400')">
                                    <i class="bi" :class="lv.passed ? 'bi-patch-check-fill' : (lv.unlocked ? 'bi-unlock-fill' : 'bi-lock-fill')"></i>
                                 </span>
                              </div>
                              <div class="text-xs font-bold text-slate-500" x-show="lv.bestScore > 0" x-text="'Nilai terbaik: ' + lv.percent + '%'"></div>
                              <div class="text-xs font-bold text-slate-400" x-show="!lv.unlocked" x-text="progress.loggedIn ? 'Lulus Level ' + (lv.level - 1) + ' dengan nilai ≥ ' + progress.passPercentage + '% untuk membuka' : 'Login untuk membuka level ini'"></div>
                              <button x-show="lv.unlocked" @click="startLevel(lv.level)" class="mt-auto w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all" :class="lv.passed ? 'bg-white border-2 border-primary text-primary hover:bg-slate-50' : 'bg-accent text-white hover:bg-accent-hover shadow-md'" x-text="lv.passed ? 'Main Lagi' : 'Mainkan'"></button>
                           </div>
                        </template>
                        <template x-if="progress.upcoming">
                           <div class="bg-white/60 rounded-2xl p-5 border-2 border-dashed border-slate-300 flex flex-col gap-2 items-center justify-center text-center">
                              <i class="bi bi-hourglass-split text-2xl text-slate-400"></i>
                              <span class="text-sm font-black text-slate-500 uppercase tracking-widest" x-text="'Level ' + (progress.levels.length + 1)"></span>
                              <span class="text-xs font-bold text-slate-400">Segera hadir</span>
                           </div>
                        </template>
                     </div>
                  </div>
               </div>
            </template>

            <!-- Result Screen -->
            <template x-if="gameFinished && !showLevelMap">
               <div class="h-full flex flex-col items-center justify-center p-6 md:p-6 bg-gradient-to-br from-white to-blue-50 text-center">
                  <div class="w-full max-w-2xl">
                     <div class="mb-6 md:mb-10 relative inline-block">
                        <div class="text-6xl md:text-8xl mb-4 animate-bounce"><i class="bi bi-trophy text-yellow-400"></i></div>
                        <div class="absolute -top-4 -right-4 bg-highlight text-primary h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center font-bold shadow-xl ring-4 ring-white">100</div>
                     </div>
                     
                     <h2 class="text-base md:text-base font-bold text-primary uppercase tracking-widest mb-2">Permainan Selesai!</h2>
                     <p class="text-slate-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-8 md:mb-12">Kerja bagus!</p>

                     <!-- Hasil Level -->
                     <template x-if="levelResult">
                        <div class="mb-8 w-full bg-white p-6 rounded-[2rem] border-2 shadow-lg" :class="levelResult.passed ? 'border-green-300' : 'border-highlight'">
                           <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" x-text="levelCount() > 1 ? 'Hasil Level ' + currentLevel : 'Hasil Permainan'"></div>
                           <div class="text-4xl font-black" :class="levelResult.passed ? 'text-green-600' : 'text-accent'" x-text="levelResult.percent + '%'"></div>
                           <div class="text-xs font-bold text-slate-500 mt-1" x-text="'Nilai minimal lulus: ' + levelResult.passPercentage + '%'"></div>
                           <template x-if="levelResult.needLogin">
                              <p class="mt-3 text-sm font-bold text-amber-700">Skor belum tersimpan. Login untuk menyimpan skor dan membuka level berikutnya.</p>
                           </template>
                           <template x-if="levelResult.error">
                              <p class="mt-3 text-sm font-bold text-red-600" x-text="levelResult.error"></p>
                           </template>
                           <template x-if="!levelResult.needLogin && !levelResult.error">
                              <p class="mt-3 text-sm font-black" :class="levelResult.passed ? 'text-green-700' : 'text-slate-600'" x-text="levelResult.passed ? (levelResult.nextLevel ? 'Lulus! Level ' + levelResult.nextLevel + ' sekarang terbuka.' : (levelResult.upcoming ? 'Lulus! Level berikutnya segera hadir.' : 'Lulus! Semua level selesai.')) : 'Belum lulus. Coba lagi untuk mencapai nilai minimal.'"></p>
                           </template>
                           <div class="mt-5 flex flex-col sm:flex-row gap-3">
                              <button x-show="levelResult.nextLevel" @click="startLevel(levelResult.nextLevel)" class="flex-1 bg-accent text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-accent-hover shadow-md">Level Berikutnya</button>
                              <button @click="startLevel(currentLevel)" class="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50">Ulangi Level</button>
                              <button x-show="levelCount() > 1" @click="openLevelMap()" class="flex-1 bg-primary text-highlight py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark">Peta Level</button>
                           </div>
                        </div>
                     </template>

                     <!-- Stats Grid -->
                     <div x-show="activeGame?.gameType === 'QUIZ' || activeGame?.gameType === 'FILL_THE_BLANK'" class="grid grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-highlight">
                           <div class="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Total Skor</div>
                           <div class="text-base md:text-lg font-bold text-primary"><span x-text="currentScore"></span><span class="text-xs md:text-sm opacity-30"> / <span x-text="maxScore"></span></span></div>
                        </div>
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-green-500">
                           <div class="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Benar</div>
                           <div class="text-base md:text-lg font-bold text-green-600" x-text="correctCount"></div>
                        </div>
                        <div class="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-b-4 border-red-500">
                           <div class="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Salah</div>
                           <div class="text-base md:text-lg font-bold text-red-600" x-text="wrongCount"></div>
                        </div>
                     </div>

                     <!-- Reflection Section -->
                     <div class="mb-8 w-full bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-lg text-left">
                        <label class="block text-primary font-bold text-sm mb-2">Apa renungan atau hal berkesan yang kamu dapatkan hari ini?</label>
                        <textarea x-model="reflectionText" class="w-full h-24 p-4 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0 text-sm font-medium transition-colors" placeholder="Tuliskan renungan pribadimu..."></textarea>
                        <button @click="saveJournal()" class="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2" :class="{'opacity-50 cursor-not-allowed': !reflectionText.trim() || isJournalSaved}" :disabled="!reflectionText.trim() || isJournalSaved">
                          <span x-text="isJournalSaved ? 'Tersimpan ke Jurnal! ✅' : 'Simpan ke Jurnal (+20 XP)'"></span>
                        </button>
                     </div>

                     <div class="space-y-4">
                        <template x-if="!duelId">
                          <button @click="createDuel()" class="w-full bg-accent text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-2xl hover:bg-accent-hover transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                            <span>⚔️ Tantang Teman dengan Kuis Ini</span>
                          </button>
                        </template>
                        <template x-if="duelId">
                          <button @click="submitDuel()" class="w-full bg-green-500 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-2xl hover:bg-green-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                            <span>Kirim Hasil Duel! ⚔️</span>
                          </button>
                        </template>
                        <button @click="quitGame()" class="w-full bg-primary text-highlight py-2.5 md:py-2.5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-primary-dark transition-all shadow-xl transform hover:-translate-y-1">TUTUP HASIL</button>
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
          duelId: null,
          reflectionText: '',
          isJournalSaved: false,
          // --- Level ---
          progress: { passPercentage: 70, levels: [], upcoming: false, loggedIn: false },
          currentLevel: 1,
          showLevelMap: false,
          levelResult: null,
          // Sesi main di server: kunci jawaban tidak dikirim ke browser, tiap jawaban dicek ke server
          attemptId: null,
          finishedAttemptId: null,
          isCheckingAnswer: false,
          quizFeedback: null,

          levelCount() {
            return this.progress.levels.length;
          },

          async loadProgress() {
            try {
              const res = await fetch('/api/projects/' + this.activeGame.id + '/progress');
              const json = await res.json();
              if (json.success) { this.progress = json.data; return; }
            } catch (e) { console.error('Gagal memuat peta level:', e); }
            this.progress = { passPercentage: 70, levels: [{ level: 1, unlocked: true, passed: false, bestScore: 0, percent: 0, maxScore: 0 }], upcoming: false, loggedIn: false };
          },

          async openLevelMap() {
            await this.loadProgress();
            this.gameFinished = false;
            this.levelResult = null;
            this.showLevelMap = true;
          },

          async startLevel(level) {
            const lv = this.progress.levels.find(l => l.level === level);
            if (!lv || !lv.unlocked) { alert('Level ' + level + ' masih terkunci.'); return; }

            this.currentLevel = level;
            this.currentIndex = 0;
            this.currentScore = 0;
            this.correctCount = 0;
            this.wrongCount = 0;
            this.selectedAnswer = null;
            this.showFeedback = false;
            this.userFTBAnswers = [];
            this.submissionResults = [];
            this.quizFeedback = null;
            this.levelResult = null;
            this.gameData = null;
            this.attemptId = null;
            this.finishedAttemptId = null;

            let session;
            try {
              const sRes = await fetch('/api/projects/' + this.activeGame.id + '/levels/' + level + '/start', { method: 'POST' });
              session = await sRes.json();
              if (!sRes.ok) { alert(session.error || 'Level ini belum bisa dimainkan.'); return; }
            } catch (e) { alert('Terjadi kesalahan jaringan.'); return; }
            this.attemptId = session.attemptId;
            this.maxScore = session.maxScore || 0;

            const type = this.activeGame.gameType;
            if (type === 'WORD_SEARCH' || type === 'CROSSWORD') {
              const base = type === 'WORD_SEARCH' ? '/api/word-search/' : '/api/crossword/';
              const gRes = await fetch(base + this.activeGame.id + '?level=' + level);
              const gJson = await gRes.json();
              if (!gJson.success || !gJson.data) { alert('Data level ini tidak ditemukan.'); return; }
              // TTS memakai sesi ini untuk mengecek jawaban ke server
              this.gameData = { ...gJson.data, attemptId: session.attemptId, level };
            } else {
              this.questions = session.questions || [];
              if (this.questions.length === 0) { alert('Level ini belum memiliki soal.'); return; }
            }

            this.showLevelMap = false;
            this.gameFinished = false;
            this.isPlaying = true;
          },

          // Akhir level: jawaban dikirim ke server untuk dinilai & disimpan (perlu login)
          async finishLevel(payload) {
            this.gameFinished = true;
            const localPercent = this.maxScore > 0 ? Math.round(this.currentScore * 100 / this.maxScore) : 0;
            try {
              const res = await fetch('/api/projects/' + this.activeGame.id + '/levels/' + this.currentLevel + '/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...(payload || {}), attemptId: this.attemptId })
              });
              const json = await res.json();
              if (!res.ok) {
                this.levelResult = { error: json.error || 'Skor gagal disimpan.', percent: localPercent, passPercentage: this.progress.passPercentage };
                return;
              }
              this.levelResult = json;
              this.currentScore = json.score;
              this.maxScore = json.maxScore;
              this.finishedAttemptId = json.attemptId;
              if (!json.needLogin) await this.loadProgress();
            } catch (e) {
              this.levelResult = { error: 'Terjadi kesalahan jaringan. Skor belum tersimpan.', percent: localPercent, passPercentage: this.progress.passPercentage };
            }
          },

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
                this.reflectionText = '';
                this.isJournalSaved = false;

                const urlParams = new URLSearchParams(window.location.search);
                this.duelId = urlParams.get('duel');

                await this.loadProgress();
                if (this.progress.levels.length === 0) {
                   alert('Game ini belum memiliki soal.');
                   return;
                }
                // Game bertingkat: tampilkan peta level; game satu level langsung dimainkan
                if (this.levelCount() > 1 || this.progress.upcoming) {
                  this.openLevelMap();
                  this.isPlaying = true;
                } else {
                  await this.startLevel(1);
                }
              } else {
                 alert('Gagal memuat game dari server.');
              }
            } catch (e) {
              console.error('Error fetching game:', e);
              alert('Terjadi kesalahan jaringan.');
            }
          },

          getPoints(diff) {
             const points = { 'MUDAH': 10, 'SEDANG': 20, 'SULIT': 50, 'BONUS': 30 };
             return points[diff] || 10;
          },

          // Kirim satu jawaban ke server; server membalas benar/salah, kunci, dan penjelasan
          async sendAnswer(questionId, answer) {
            const res = await fetch('/api/projects/' + this.activeGame.id + '/levels/' + this.currentLevel + '/answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attemptId: this.attemptId, questionId, answer })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Jawaban gagal dicek.');
            return json;
          },

          async selectAnswer(opt) {
            if (this.showFeedback || this.isCheckingAnswer) return;
            this.selectedAnswer = opt;
            this.isCheckingAnswer = true;
            try {
              const json = await this.sendAnswer(this.questions[this.currentIndex].id, opt);
              this.isCorrect = json.isCorrect;
              this.quizFeedback = { correctAnswer: json.correctAnswer, explanation: json.explanation };
              this.currentScore += json.scoreEarned;
              if (json.isCorrect) this.correctCount++; else this.wrongCount++;
              this.showFeedback = true;
            } catch (e) {
              this.selectedAnswer = null;
              alert(e.message);
            } finally {
              this.isCheckingAnswer = false;
            }
          },

          // Teks FTB dari server sudah dipecah: potongan teks dan kotak isian (tanpa jawaban)
          renderFTB(q) {
            if(!q || !Array.isArray(q.parts)) return '';
            const escapeHtml = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
            const text = q.parts.map(part => 'blank' in part
              ? '<input type="text" class="ftb-input border-b-4 border-highlight outline-none text-center px-4 py-1 text-accent bg-primary/5 rounded-t-xl w-32 mx-2 font-black" placeholder="..." onchange="window.updatePublicFTB(' + Number(part.blank) + ', this.value)">'
              : escapeHtml(part.text)
            ).join('');
            
            window.updatePublicFTB = (idx, val) => {
              this.userFTBAnswers[idx] = val;
            };
            
            return text;
          },

          async checkAnswerFTB() {
            if (this.isCheckingAnswer) return;
            const question = this.questions[this.currentIndex];
            const answer = Array.from({ length: question.blankCount || 0 }, (_, i) => this.userFTBAnswers[i] || '');
            this.isCheckingAnswer = true;
            try {
              const json = await this.sendAnswer(question.id, answer);
              this.isCorrect = json.allCorrect;
              this.currentScore += json.scoreEarned;
              if(this.isCorrect) this.correctCount++; else this.wrongCount++;
              this.submissionResults = json.details;
              this.showFeedback = true;
            } catch (e) {
              alert(e.message);
            } finally {
              this.isCheckingAnswer = false;
            }
          },

          nextQuestion() {
            if(this.currentIndex < this.questions.length - 1) {
              this.currentIndex++;
              this.selectedAnswer = null;
              this.showFeedback = false;
              this.userFTBAnswers = [];
              this.submissionResults = [];
              this.quizFeedback = null;
            } else {
              this.finishLevel();
            }
          },

          quitGame() {
            this.isPlaying = false;
            this.activeGame = null;
            if (window.location.pathname.startsWith('/play/')) {
               window.location.href = '/';
            }
          },

          async createDuel() {
            try {
              const res = await fetch('/api/duels/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId: this.finishedAttemptId })
              });
              const json = await res.json();
              if (json.success) {
                alert('Tantangan Duel berhasil dibuat! Menyalin link...');
                navigator.clipboard.writeText(window.location.origin + json.shareUrl);
                window.location.href = json.shareUrl;
              } else {
                alert('Gagal membuat duel: ' + json.error);
                if (json.error === 'Unauthorized') window.location.href = '/login';
              }
            } catch (e) {
              alert('Terjadi kesalahan saat membuat duel.');
            }
          },

          async submitDuel() {
            if (!this.duelId) return;
            try {
              const res = await fetch('/api/duels/' + this.duelId + '/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId: this.finishedAttemptId })
              });
              const json = await res.json();
              if (json.success) {
                alert('Hasil duel berhasil dikirim!');
                window.location.href = '/duel/' + this.duelId;
              } else {
                alert('Gagal mengirim hasil duel: ' + json.error);
              }
            } catch (e) {
              alert('Terjadi kesalahan saat mengirim hasil duel.');
            }
          },

          async saveJournal() {
            if (!this.reflectionText.trim() || this.isJournalSaved) return;
            try {
              const res = await fetch('/api/journals/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  referenceType: 'QUIZ',
                  referenceId: this.activeGame.id,
                  title: this.activeGame.title,
                  reflectionText: this.reflectionText
                })
              });
              const json = await res.json();
              if (json.success) {
                this.isJournalSaved = true;
                alert('Jurnal berhasil disimpan! Kamu mendapatkan ' + json.xpEarned + ' XP.');
              } else {
                if (json.error === 'Unauthorized') {
                  alert('Silakan login terlebih dahulu untuk menyimpan jurnal.');
                  window.location.href = '/login';
                } else {
                  alert('Gagal menyimpan jurnal.');
                }
              }
            } catch (e) {
              alert('Terjadi kesalahan jaringan.');
            }
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
    ${CrosswordGameScript()}
  `;
};
