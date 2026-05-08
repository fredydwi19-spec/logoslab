import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { ProjectHeader } from "./ProjectHeader";

export const PakarDashboard = ({ myProjects }: { myProjects: any[] }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');

  return `
    <script id="pakarProjectsData" type="application/json">${myProjectsJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pakarDashboard', () => ({
          tab: 'REVIEW',
          search: '',
          activeProject: null,
          questions: [],
          gameData: null,
          feedback: '',
          showPreview: false,
          showAuditLog: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          isCorrect: false,
          userFTBAnswers: [],
          allProjects: JSON.parse(document.getElementById('pakarProjectsData').textContent || '[]'),

          filteredProjects() {
            return this.allProjects.filter(p => {
              let show = false;
              if (this.tab === 'REVIEW') show = ['REVIEW_PAKAR'].includes(p.status);
              else if (this.tab === 'REVISI') show = ['REVISI_PAKAR'].includes(p.status);
              else if (this.tab === 'ACCEPT') show = ['ACCEPTED_PAKAR', 'REVIEW_KETUA', 'REVISI_KETUA', 'PUBLISHED'].includes(p.status);
              if (this.search && show) {
                show = p.title.toLowerCase().includes(this.search.toLowerCase());
              }
              return show;
            });
          },

          async openProject(id) {
            try {
              const res = await fetch('/api/projects/' + id);
              const json = await res.json();
              if (json.success) {
                this.activeProject = json.data;
                this.questions = json.data.questions || [];
                this.feedback = '';
                this.gameData = null;
                this.showAuditLog = false;
                if (this.activeProject.gameType === 'WORD_SEARCH') {
                  const wsRes = await fetch('/api/word-search/' + id);
                  const wsJson = await wsRes.json();
                  if (wsJson.success && wsJson.data) this.gameData = wsJson.data;
                }
              } else {
                alert('Gagal memuat proyek: ' + (json.error || 'Terjadi kesalahan'));
              }
            } catch (err) {
              console.error('openProject error:', err);
              alert('Gagal terhubung ke server.');
            }
          },

          closeProject() {
            this.activeProject = null;
            this.showAuditLog = false;
            this.showPreview = false;
            this.feedback = '';
          },

          previewGame() {
            if (this.activeProject?.gameType !== 'WORD_SEARCH' && this.questions.length === 0) {
              alert("Belum ada soal untuk di-preview.");
              return;
            }
            if (this.activeProject?.gameType === 'WORD_SEARCH' && (!this.gameData || !this.gameData.gridData)) {
              alert("Data grid Word Search belum tersedia.");
              return;
            }
            this.currentQuestionIndex = 0;
            this.selectedAnswer = null;
            this.showExplanation = false;
            this.isCorrect = false;
            this.userFTBAnswers = [];
            this.showPreview = true;
          },

          checkAnswerQuiz(opt) {
            if (this.showExplanation) return;
            this.selectedAnswer = opt;
            this.isCorrect = opt === this.questions[this.currentQuestionIndex].correctAnswer;
            this.showExplanation = true;
          },

          renderFTB(q) {
            if (!q || !q.fullText) return '';
            let text = q.fullText;
            const answers = q.answers || [];
            const sortedAnswers = [...answers].sort((a, b) => b.word.length - a.word.length);
            sortedAnswers.forEach((ans, i) => {
              const regex = new RegExp(ans.word, 'gi');
              text = text.replace(regex, '<input type="text" class="ftb-input border-b-2 border-blue-800 outline-none text-center px-2 text-orange-600 bg-slate-50 rounded-t w-24 mx-1" placeholder="..." onchange="window.updatePakarFTB(' + i + ', this.value)">');
            });
            window.updatePakarFTB = (idx, val) => { this.userFTBAnswers[idx] = val; };
            return text;
          },

          checkAnswerFTB() {
            const q = this.questions[this.currentQuestionIndex];
            const answers = q.answers || [];
            let allCorrect = true;
            answers.forEach((ans, i) => {
              const userVal = (this.userFTBAnswers[i] || '').trim().toLowerCase();
              if (userVal !== ans.word.trim().toLowerCase()) allCorrect = false;
            });
            this.isCorrect = allCorrect;
            this.showExplanation = true;
          },

          nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
              this.currentQuestionIndex++;
              this.selectedAnswer = null;
              this.showExplanation = false;
              this.userFTBAnswers = [];
            } else {
              this.showPreview = false;
            }
          },

          prevQuestion() {
            if (this.currentQuestionIndex > 0) {
              this.currentQuestionIndex--;
              this.selectedAnswer = null;
              this.showExplanation = false;
              this.userFTBAnswers = [];
            }
          },

          async submitReview(statusGiven) {
            if (statusGiven === 'REVISI' && !this.feedback) {
              alert("Mohon isi masukan/feedback untuk revisi.");
              return;
            }
            const res = await fetch('/api/projects/' + this.activeProject.id + '/review', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ statusGiven, feedback: this.feedback })
            });
            if (res.ok) window.location.reload();
            else {
              const err = await res.json();
              alert("Gagal submit review: " + (err.error || 'Terjadi kesalahan'));
            }
          }
        }));
      });
    </script>

    <div class="bg-white p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" x-data="pakarDashboard()">
      <!-- Header -->
      <div class="bg-[#1A237E] p-6 border-b-4 border-[#FFC107] flex items-center justify-between">
        <h2 class="text-xl font-black text-white uppercase tracking-widest">Audit &amp; Kurasi Konten</h2>
        <span class="text-[10px] font-black text-[#FFC107] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">Expert Access</span>
      </div>

      <div class="p-8">
        <!-- List View -->
        <div x-show="!activeProject">
          <h2 class="text-lg font-bold text-[#1A237E] mb-1 flex items-center gap-2 uppercase tracking-tighter">
            <span class="h-5 w-1 bg-[#FFC107] rounded-full"></span>
            Antrean Review Proyek
          </h2>
          <p class="text-xs text-slate-400 font-bold mb-6">Proyek yang ditugaskan kepada Anda</p>
          <div class="flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
            <div class="flex space-x-2">
              <button @click="tab = 'REVIEW'" :class="tab === 'REVIEW' ? 'bg-[#1A237E] text-white' : 'bg-white text-slate-500 border-2 border-slate-100'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">BUTUH REVIEW</button>
              <button @click="tab = 'REVISI'" :class="tab === 'REVISI' ? 'bg-[#FF5722] text-white' : 'bg-white text-slate-500 border-2 border-slate-100'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">DALAM REVISI</button>
              <button @click="tab = 'ACCEPT'" :class="tab === 'ACCEPT' ? 'bg-green-600 text-white' : 'bg-white text-slate-500 border-2 border-slate-100'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">SELESAI</button>
            </div>
            <div class="relative w-full md:w-64">
              <input type="text" x-model="search" placeholder="Cari Judul Proyek..." class="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-[#FFC107] outline-none font-bold shadow-inner">
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 text-sm">
                  <th class="pb-4 font-semibold">ID</th>
                  <th class="pb-4 font-semibold">Judul</th>
                  <th class="pb-4 font-semibold">Jenis</th>
                  <th class="pb-4 font-semibold">Status</th>
                  <th class="pb-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-slate-600">
                <template x-for="p in filteredProjects()" :key="p.id">
                  <tr class="border-b border-slate-50 hover:bg-blue-50/50 transition-all group">
                    <td class="py-5 font-bold text-[#1A237E]" x-text="'#G' + p.id"></td>
                    <td class="py-5 font-black text-slate-800 text-base group-hover:text-[#1A237E] transition-colors" x-text="p.title"></td>
                    <td class="py-5">
                      <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-black uppercase border border-slate-200" x-text="p.gameType"></span>
                    </td>
                    <td class="py-5">
                      <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
                        :class="{
                          'bg-yellow-100 text-yellow-800 border border-yellow-200': p.status === 'DRAFT',
                          'bg-blue-100 text-blue-800 border border-blue-200': p.status === 'REVIEW_PAKAR' || p.status === 'REVIEW_KETUA',
                          'bg-red-100 text-red-800 border border-red-200': p.status === 'REVISI_PAKAR' || p.status === 'REVISI_KETUA',
                          'bg-green-100 text-green-800 border border-green-200': p.status === 'ACCEPTED_PAKAR' || p.status === 'PUBLISHED',
                          'bg-slate-100 text-slate-600 border border-slate-200': !['DRAFT','REVIEW_PAKAR','REVIEW_KETUA','REVISI_PAKAR','REVISI_KETUA','ACCEPTED_PAKAR','PUBLISHED'].includes(p.status)
                        }"
                        x-text="p.status.replace(/_/g, ' ')">
                      </span>
                    </td>
                    <td class="py-5 text-right">
                      <button @click="openProject(p.id)" class="bg-[#1A237E] text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-indigo-900 transition-all shadow-md uppercase tracking-widest">DETAIL</button>
                    </td>
                  </tr>
                </template>
                <template x-if="filteredProjects().length === 0">
                  <tr><td colspan="5" class="text-center py-12 text-slate-400 italic font-medium">Tidak ada proyek dalam antrean ini.</td></tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detail View -->
        <div x-show="activeProject" style="display: none;" class="space-y-6">
          <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 font-bold transition-colors">
            ← Kembali
          </button>

          ${ProjectHeader()}

          <template x-if="activeProject && ['REVIEW_PAKAR', 'REVISI_PAKAR'].includes(activeProject.status)">
            <div class="bg-white p-8 border-2 border-slate-100 rounded-2xl shadow-xl">
              <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <span class="h-3 w-3 bg-[#FF5722] rounded-full animate-pulse"></span>
                Lembar Evaluasi Pakar
              </h4>
              <textarea x-model="feedback" class="w-full border-2 border-slate-100 rounded-xl p-4 h-40 focus:border-[#1A237E] outline-none font-medium transition-all mb-6 shadow-inner" placeholder="Tuliskan catatan teknis atau instruksi revisi..."></textarea>
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="submitReview('REVISI')" class="flex-1 bg-white border-4 border-[#FF5722] text-[#FF5722] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg">MINTA REVISI</button>
                <button @click="submitReview('ACCEPT')" class="flex-1 bg-[#1A237E] text-[#FFC107] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg">VERIFIKASI &amp; SETUJUI</button>
              </div>
            </div>
          </template>

          <template x-if="activeProject && !['REVIEW_PAKAR','DRAFT','REVISI_PAKAR'].includes(activeProject.status)">
            <div class="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 text-center">
              <p class="text-slate-500 font-bold text-sm">Proyek ini berstatus <span class="font-black text-[#1A237E] uppercase" x-text="activeProject?.status.replace(/_/g,' ')"></span> dan tidak memerlukan tindakan.</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Preview Modal -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
        <div class="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
          <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-red-500 z-10 text-3xl font-black">&times;</button>
          <div class="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-widest border-b-4 border-[#FFC107]">
            SIMULASI GAME: <span x-text="activeProject?.title" class="text-[#FFC107]"></span>
          </div>
          <div class="p-8 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center">
            <div class="text-center w-full max-w-2xl space-y-6">
              <template x-if="activeProject?.gameType === 'WORD_SEARCH' && gameData">
                <div class="w-full">
                  ${WordSearchGame({ projectVar: 'activeProject', gameDataVar: 'gameData' })}
                </div>
              </template>
              <template x-if="activeProject?.gameType !== 'WORD_SEARCH'">
                <div>
                  <div class="inline-block bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + questions.length"></div>
                  <template x-if="activeProject?.gameType === 'QUIZ'">
                    <div>
                      <h3 class="text-2xl font-black text-[#1A237E] mb-8 leading-relaxed" x-text="questions[currentQuestionIndex]?.question"></h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <template x-for="opt in ['A','B','C','D']">
                          <button @click="checkAnswerQuiz(opt)"
                            :class="{
                              'border-yellow-400 bg-yellow-50': selectedAnswer === opt && !showExplanation,
                              'border-green-500 bg-green-50': showExplanation && opt === questions[currentQuestionIndex].correctAnswer,
                              'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== questions[currentQuestionIndex].correctAnswer,
                              'border-slate-100 bg-white hover:border-yellow-300': !showExplanation && selectedAnswer !== opt
                            }"
                            class="border-4 p-5 rounded-2xl text-[#1A237E] font-black transition-all text-left flex items-center gap-3"
                            :disabled="showExplanation">
                            <span class="h-8 w-8 rounded-lg flex items-center justify-center font-black bg-slate-100 shrink-0" x-text="opt"></span>
                            <span x-text="questions[currentQuestionIndex]['option' + opt]"></span>
                          </button>
                        </template>
                      </div>
                    </div>
                  </template>
                  <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                    <div>
                      <div class="text-xl font-bold text-[#1A237E] mb-8 leading-relaxed bg-white p-6 rounded-2xl shadow-inner border-2 border-slate-100" x-html="renderFTB(questions[currentQuestionIndex])"></div>
                      <button @click="checkAnswerFTB()" x-show="!showExplanation" class="bg-[#FF5722] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest">PERIKSA JAWABAN</button>
                    </div>
                  </template>
                  <div x-show="showExplanation" class="mt-6 p-5 rounded-2xl border-2 border-dashed text-left" :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                    <p class="font-black text-sm uppercase" :class="isCorrect ? 'text-green-700' : 'text-red-700'" x-text="isCorrect ? 'Benar!' : 'Belum Tepat!'"></p>
                    <p class="text-sm text-slate-600 mt-1 italic" x-text="questions[currentQuestionIndex]?.explanation"></p>
                  </div>
                  <div class="flex gap-4 mt-6 justify-center">
                    <button @click="prevQuestion()" x-show="currentQuestionIndex > 0" class="bg-slate-100 text-slate-700 px-6 py-2 rounded-xl font-black">← Prev</button>
                    <button @click="nextQuestion()" x-show="showExplanation" class="bg-[#1A237E] text-white px-6 py-2 rounded-xl font-black" x-text="currentQuestionIndex < questions.length - 1 ? 'Berikutnya →' : 'Selesai Review'"></button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${WordSearchGameScript()}
  `;
};
