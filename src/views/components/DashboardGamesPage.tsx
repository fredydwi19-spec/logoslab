import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";

export const DashboardGamesPage = ({
  games,
  username,
}: {
  games: any[];
  username: string;
}) => {
  const gameTypeLabel: Record<string, string> = {
    QUIZ: "Kuis",
    FILL_THE_BLANK: "Isi Kosong",
    WORD_SEARCH: "Cari Kata",
    CROSSWORD: "TTS",
  };
  const gameTypeBadge: Record<string, string> = {
    QUIZ: "bg-blue-100 text-blue-700",
    FILL_THE_BLANK: "bg-purple-100 text-purple-700",
    WORD_SEARCH: "bg-emerald-100 text-emerald-700",
    CROSSWORD: "bg-orange-100 text-orange-700",
  };

  return `
    <div x-data="dashboardGamePlayer()" x-init="init()">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 class="text-2xl font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-3">
            <span class="w-2 h-8 bg-[#FFC107] rounded-full inline-block"></span>
            Game Tersedia
          </h2>
          <p class="text-slate-500 text-sm mt-1 ml-5">Semua permainan yang telah dipublish oleh tim. Mainkan kapan saja!</p>
        </div>
        <div class="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <i class="bi bi-controller text-[#FF5722] text-xl"></i>
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Game</p>
            <p class="text-xl font-black text-[#1A237E]">${games.length}</p>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button @click="filter = 'ALL'" :class="filter === 'ALL' ? 'bg-[#1A237E] text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          Semua
        </button>
        <button @click="filter = 'QUIZ'" :class="filter === 'QUIZ' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-question-circle mr-1"></i> Kuis
        </button>
        <button @click="filter = 'FILL_THE_BLANK'" :class="filter === 'FILL_THE_BLANK' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-input-cursor-text mr-1"></i> Isi Kosong
        </button>
        <button @click="filter = 'WORD_SEARCH'" :class="filter === 'WORD_SEARCH' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-search mr-1"></i> Cari Kata
        </button>
        <button @click="filter = 'CROSSWORD'" :class="filter === 'CROSSWORD' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-grid-3x3 mr-1"></i> TTS
        </button>
      </div>

      <!-- Games Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        ${
          games.length === 0
            ? `<div class="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div class="text-6xl mb-4 opacity-20">🎮</div>
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada game yang dipublish saat ini.</p>
               </div>`
            : games
                .map(
                  (game) => `
          <div class="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 group transition-all duration-300 hover:-translate-y-1"
               x-show="filter === 'ALL' || filter === '${game.gameType}'">

            <!-- Thumbnail -->
            <div class="relative h-44 bg-gradient-to-br from-[#1A237E] to-blue-600 overflow-hidden cursor-pointer"
                 @click="playGame(${game.id})">
              ${
                game.thumbnailUrl
                  ? `<img src="${game.thumbnailUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />`
                  : `<div class="w-full h-full flex items-center justify-center text-6xl opacity-20">
                      ${game.gameType === "QUIZ" ? "❓" : game.gameType === "FILL_THE_BLANK" ? "✏️" : game.gameType === "WORD_SEARCH" ? "🔍" : "🧩"}
                     </div>`
              }
              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-[#1A237E]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="bg-[#FFC107] text-[#1A237E] font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <i class="bi bi-play-circle-fill text-lg"></i> Mainkan
                </div>
              </div>
              <!-- Type badge -->
              <div class="absolute top-3 left-3">
                <span class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${gameTypeBadge[game.gameType] || "bg-slate-100 text-slate-600"}">
                  ${gameTypeLabel[game.gameType] || game.gameType}
                </span>
              </div>
            </div>

            <!-- Info -->
            <div class="p-5">
              <h3 class="font-bold text-[#1A237E] text-base line-clamp-1 cursor-pointer hover:text-[#FF5722] transition-colors mb-1"
                  @click="playGame(${game.id})">${game.title}</h3>
              <p class="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">${game.description || "Game edukasi interaktif dari Logos LAB."}</p>
              <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <i class="bi bi-person-fill"></i> Logos Team
                </span>
                <button @click="playGame(${game.id})"
                  class="bg-[#FF5722] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest hover:bg-[#E64A19] transition-all shadow-sm hover:shadow-md flex items-center gap-1">
                  <i class="bi bi-play-fill"></i> Main
                </button>
              </div>
            </div>
          </div>
        `
                )
                .join("")
        }
      </div>

      <!-- ===== GAME PLAYER MODAL ===== -->
      <div x-show="isPlaying" x-cloak x-transition
           class="fixed inset-0 bg-[#1A237E]/95 flex items-center justify-center z-[9999] backdrop-blur-xl p-4">
        <div class="bg-white w-full max-w-5xl h-[92vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-8 border-white/20">

          <!-- QUIZ / FTB Player -->
          <template x-if="isPlaying && !gameFinished && activeGame?.gameType !== 'WORD_SEARCH' && activeGame?.gameType !== 'CROSSWORD'">
            <div class="flex flex-col h-full">
              <div class="bg-[#1A237E] px-8 py-4 text-white flex justify-between items-center border-b-4 border-[#FFC107]">
                <div class="flex items-center gap-4">
                  <img src="/public/assets/logo-logoslab.png" class="h-10 w-auto bg-white p-1 rounded-lg" />
                  <div>
                    <h3 class="text-sm font-black uppercase tracking-widest text-[#FFC107]" x-text="activeGame?.title"></h3>
                    <p class="text-[9px] font-bold opacity-60 uppercase tracking-widest" x-text="'Soal ' + (currentIndex + 1) + ' dari ' + questions.length"></p>
                  </div>
                </div>
                <div class="flex items-center gap-6">
                  <div class="text-right">
                    <p class="text-[9px] font-black uppercase opacity-60">Skor</p>
                    <div class="text-2xl font-black text-[#FFC107]" x-text="currentScore"></div>
                  </div>
                  <button @click="quitGame()" class="bg-white/10 hover:bg-red-500 text-white p-3 rounded-full transition-all">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div class="h-2 bg-slate-100">
                <div class="h-full bg-[#FF5722] transition-all duration-500" :style="'width: ' + ((currentIndex + 1) / questions.length * 100) + '%'"></div>
              </div>
              <div class="flex-1 overflow-y-auto p-8 bg-slate-50 flex items-center justify-center">
                <div class="w-full max-w-3xl text-center">
                  <div class="inline-block bg-[#1A237E] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                       x-text="questions[currentIndex]?.difficulty + ' (+' + (questions[currentIndex]?.score || getPoints(questions[currentIndex]?.difficulty)) + ' POIN)'"></div>
                  <!-- Quiz -->
                  <template x-if="activeGame?.gameType === 'QUIZ'">
                    <div>
                      <h2 class="text-xl font-bold text-[#1A237E] mb-8 leading-tight" x-text="questions[currentIndex]?.question"></h2>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <template x-for="opt in ['A', 'B', 'C', 'D']">
                          <button @click="selectAnswer(opt)"
                            :class="{'border-[#FFC107] bg-yellow-50 scale-105': selectedAnswer === opt && !showFeedback,
                                     'border-green-500 bg-green-50': showFeedback && opt === questions[currentIndex]?.correctAnswer,
                                     'border-red-500 bg-red-50': showFeedback && selectedAnswer === opt && opt !== questions[currentIndex]?.correctAnswer,
                                     'border-slate-100 bg-white hover:border-[#1A237E] hover:-translate-y-1': !showFeedback && selectedAnswer !== opt}"
                            class="border-4 p-5 rounded-2xl text-left flex items-center gap-4 transition-all disabled:cursor-default group" :disabled="showFeedback">
                            <span class="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black transition-colors"
                                  :class="showFeedback && opt === questions[currentIndex]?.correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] group-hover:text-[#1A237E] text-slate-400'"
                                  x-text="opt"></span>
                            <span class="text-[#1A237E] font-semibold text-sm" x-text="questions[currentIndex] ? questions[currentIndex]['option' + opt] : ''"></span>
                          </button>
                        </template>
                      </div>
                    </div>
                  </template>
                  <!-- FTB -->
                  <template x-if="activeGame?.gameType === 'FILL_THE_BLANK'">
                    <div class="flex flex-col items-center">
                      <div class="text-lg font-medium text-[#1A237E] mb-8 bg-white p-10 rounded-3xl shadow-inner border-2 border-slate-100 w-full"
                           x-html="renderFTB(questions[currentIndex])"></div>
                      <div x-show="!showFeedback">
                        <button @click="checkAnswerFTB()" class="bg-[#FF5722] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#E64A19] transition-all">
                          PERIKSA JAWABAN
                        </button>
                      </div>
                    </div>
                  </template>
                  <!-- Feedback -->
                  <div x-show="showFeedback" x-transition class="mt-8 p-6 rounded-3xl text-left border-4 border-dashed"
                       :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-2xl" x-text="isCorrect ? '✨' : '💡'"></span>
                      <h4 class="font-black uppercase tracking-widest text-sm" :class="isCorrect ? 'text-green-800' : 'text-red-800'"
                          x-text="isCorrect ? 'Jawaban Tepat!' : 'Belum Tepat, Ini Penjelasannya:'"></h4>
                    </div>
                    <template x-if="activeGame?.gameType === 'QUIZ'">
                      <p class="text-slate-700 font-bold italic text-sm" x-text="questions[currentIndex]?.explanation"></p>
                    </template>
                    <div class="mt-4 flex justify-end">
                      <button @click="nextQuestion()" class="bg-[#1A237E] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg flex items-center gap-2 text-sm">
                        <span x-text="currentIndex === questions.length - 1 ? 'LIHAT HASIL' : 'SOAL BERIKUTNYA'"></span>
                        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Word Search -->
          <template x-if="isPlaying && !gameFinished && activeGame?.gameType === 'WORD_SEARCH' && gameData">
            <div class="flex-1 overflow-y-auto bg-slate-50">
              ${WordSearchGame({ projectVar: "activeGame", gameDataVar: "gameData" })}
            </div>
          </template>

          <!-- Crossword -->
          <template x-if="isPlaying && !gameFinished && activeGame?.gameType === 'CROSSWORD' && gameData">
            <div class="flex-1 overflow-y-auto bg-slate-50">
              ${CrosswordGame({ projectVar: "activeGame", gameDataVar: "gameData" })}
            </div>
          </template>

          <!-- Result Screen -->
          <template x-if="gameFinished && activeGame?.gameType !== 'WORD_SEARCH' && activeGame?.gameType !== 'CROSSWORD'">
            <div class="h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-white to-blue-50 text-center">
              <div class="w-full max-w-xl">
                <div class="text-8xl mb-6 animate-bounce">🏆</div>
                <h2 class="text-3xl font-black text-[#1A237E] uppercase tracking-widest mb-2">Permainan Selesai!</h2>
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Kerja bagus, ${username}!</p>
                <div class="grid grid-cols-3 gap-4 mb-10">
                  <div class="bg-white p-5 rounded-2xl shadow-xl border-b-4 border-[#FFC107]">
                    <div class="text-[10px] font-black text-slate-400 uppercase mb-1">Skor</div>
                    <div class="text-2xl font-black text-[#1A237E]"><span x-text="currentScore"></span><span class="text-xs opacity-30">/<span x-text="maxScore"></span></span></div>
                  </div>
                  <div class="bg-white p-5 rounded-2xl shadow-xl border-b-4 border-green-500">
                    <div class="text-[10px] font-black text-slate-400 uppercase mb-1">Benar</div>
                    <div class="text-2xl font-black text-green-600" x-text="correctCount"></div>
                  </div>
                  <div class="bg-white p-5 rounded-2xl shadow-xl border-b-4 border-red-500">
                    <div class="text-[10px] font-black text-slate-400 uppercase mb-1">Salah</div>
                    <div class="text-2xl font-black text-red-600" x-text="wrongCount"></div>
                  </div>
                </div>
                <button @click="quitGame()" class="w-full bg-[#1A237E] text-[#FFC107] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-2xl">
                  TUTUP & KEMBALI
                </button>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

    <style>[x-cloak]{display:none!important} .ftb-input::placeholder{color:#cbd5e1;opacity:.5}</style>
    <script>
      window.dashboardGamePlayer = function() {
        return {
          filter: 'ALL',
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

          init() {},

          async playGame(id) {
            try {
              const res = await fetch('/api/projects/' + id);
              const json = await res.json();
              if (!json.success) { alert('Gagal memuat game.'); return; }
              this.activeGame = json.data;
              this.questions = json.data.questions || [];
              if (this.activeGame.gameType !== 'WORD_SEARCH' && this.activeGame.gameType !== 'CROSSWORD' && this.questions.length === 0) {
                alert('Game ini belum memiliki soal.'); return;
              }
              this.maxScore = this.questions.reduce((acc, q) => acc + (q.score || this.getPoints(q.difficulty)), 0);
              this.currentIndex = 0; this.currentScore = 0;
              this.correctCount = 0; this.wrongCount = 0;
              this.selectedAnswer = null; this.showFeedback = false;
              this.gameFinished = false; this.gameData = null;
              this.userFTBAnswers = []; this.submissionResults = [];

              if (this.activeGame.gameType === 'WORD_SEARCH') {
                const wsRes = await fetch('/api/word-search/' + id);
                const wsJson = await wsRes.json();
                if (wsJson.success && wsJson.data) { this.gameData = wsJson.data; }
                else { alert('Data Word Search tidak ditemukan.'); return; }
              } else if (this.activeGame.gameType === 'CROSSWORD') {
                const cwRes = await fetch('/api/crossword/' + id);
                const cwJson = await cwRes.json();
                if (cwJson.success && cwJson.data) { this.gameData = cwJson.data; }
                else { alert('Data Crossword tidak ditemukan.'); return; }
              }
              this.isPlaying = true;
            } catch(e) { console.error(e); alert('Terjadi kesalahan jaringan.'); }
          },

          getPoints(diff) {
            return { MUDAH: 10, SEDANG: 20, SULIT: 50, BONUS: 30 }[diff] || 10;
          },

          selectAnswer(opt) {
            if (this.showFeedback) return;
            this.selectedAnswer = opt;
            const q = this.questions[this.currentIndex];
            if (opt === q.correctAnswer) {
              this.currentScore += (q.score || this.getPoints(q.difficulty));
              this.correctCount++; this.isCorrect = true;
            } else { this.wrongCount++; this.isCorrect = false; }
            this.showFeedback = true;
          },

          renderFTB(q) {
            if (!q || !q.fullText) return '';
            let text = q.fullText;
            const sorted = [...(q.answers || [])].sort((a, b) => b.word.length - a.word.length);
            sorted.forEach((ans, i) => {
              text = text.replace(new RegExp(ans.word, 'gi'),
                '<input type="text" class="ftb-input border-b-4 border-[#FFC107] outline-none text-center px-4 py-1 text-[#FF5722] bg-[#1A237E]/5 rounded-t-xl w-32 mx-2 font-black" placeholder="..." onchange="window.__dgpFTB(' + i + ', this.value)">');
            });
            window.__dgpFTB = (idx, val) => { this.userFTBAnswers[idx] = val; };
            return text;
          },

          async checkAnswerFTB() {
            const q = this.questions[this.currentIndex];
            const res = await fetch('/api/projects/' + this.activeGame.id + '/submit', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ questionId: q.id, userAnswers: this.userFTBAnswers })
            });
            const json = await res.json();
            if (json.success) {
              this.isCorrect = json.allCorrect;
              this.currentScore += json.scoreEarned;
              if (this.isCorrect) this.correctCount++; else this.wrongCount++;
              this.submissionResults = json.details;
              this.showFeedback = true;
            }
          },

          nextQuestion() {
            if (this.currentIndex < this.questions.length - 1) {
              this.currentIndex++;
              this.selectedAnswer = null; this.showFeedback = false;
              this.userFTBAnswers = []; this.submissionResults = [];
            } else { this.gameFinished = true; }
          },

          quitGame() { this.isPlaying = false; this.activeGame = null; this.gameFinished = false; }
        };
      };
    </script>
    ${WordSearchGameScript()}
    ${CrosswordGameScript()}
  `;
};
