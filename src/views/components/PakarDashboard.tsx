import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";
import { ProjectHeader } from "./ProjectHeader";

export const PakarDashboard = ({ myProjects, publishedProjects, allUsers }: { myProjects: any[], publishedProjects: any[], allUsers: any[] }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');
  const publishedProjectsJson = JSON.stringify(publishedProjects).replace(/</g, '\\u003c');
  const allUsersJson = JSON.stringify(allUsers).replace(/</g, '\\u003c');

  return `
    <script id="pakarProjectsData" type="application/json">${myProjectsJson}</script>
    <script id="pakarPublishedData" type="application/json">${publishedProjectsJson}</script>
    <script id="pakarUsersData" type="application/json">${allUsersJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pakarDashboard', () => ({
          tab: 'REVIEW_PAKAR',
          search: '',
          searchPublished: '',
          viewMode: new URLSearchParams(window.location.search).get('view') === 'all' ? 'all' : 'active',
          activeProject: null,
          questions: [],
          materiContents: [],
          gameData: null,
          feedback: '',
          showPreview: false,
          showAuditLog: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          isCorrect: false,
          userFTBAnswers: [],
          speakingIdx: null,
          unlockedIdx: 0,
          isReading: false,
          isPaused: false,
          allProjects: JSON.parse(document.getElementById('pakarProjectsData').textContent || '[]'),
          publishedProjects: JSON.parse(document.getElementById('pakarPublishedData').textContent || '[]'),
          allUsers: JSON.parse(document.getElementById('pakarUsersData').textContent || '[]'),

          getUserName(id) {
            const u = this.allUsers.find(u => u.id === id);
            return u ? u.name : '-';
          },


          filteredProjects() {
            return this.allProjects.filter(p => {
              let show = false;
              if (this.tab === 'REVIEW_PAKAR')  show = p.status === 'REVIEW_PAKAR';
              else if (this.tab === 'REVISI_PAKAR') show = p.status === 'REVISI_PAKAR';
              else if (this.tab === 'ACCEPTED')  show = p.status === 'ACCEPTED_PAKAR';
              else if (this.tab === 'KETUA')     show = ['REVIEW_KETUA', 'REVISI_KETUA'].includes(p.status);
              if (this.search && show) {
                show = p.title.toLowerCase().includes(this.search.toLowerCase());
              }
              return show;
            });
          },

          filteredPublishedProjects() {
            return this.publishedProjects.filter(p =>
              !this.searchPublished || p.title.toLowerCase().includes(this.searchPublished.toLowerCase())
            );
          },

          async openProject(id) {
            try {
              const res = await fetch('/api/projects/' + id);
              const json = await res.json();
              if (json.success) {
                this.activeProject = json.data;
                this.questions = json.data.questions || [];
                this.materiContents = json.data.materiContents || [];
                this.feedback = '';
                this.gameData = null;
                this.showAuditLog = false;
                if (this.activeProject.gameType === 'WORD_SEARCH') {
                  const wsRes = await fetch('/api/word-search/' + id);
                  const wsJson = await wsRes.json();
                  if (wsJson.success && wsJson.data) this.gameData = wsJson.data;
                } else if (this.activeProject.gameType === 'CROSSWORD') {
                  const cwRes = await fetch('/api/crossword/' + id);
                  const cwJson = await cwRes.json();
                  if (cwJson.success && cwJson.data) this.gameData = cwJson.data;
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
            this.materiContents = [];
            this.showAuditLog = false;
            this.showPreview = false;
            this.feedback = '';
            this.stopSpeech();
          },

          // MANUAL Audio & Tooltips Logic
          speakingIdx: null,
          isReading: false,
          isPaused: false,
          
          stopSpeech() {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            this.isReading = false;
            this.isPaused = false;
            this.speakingIdx = null;
          },

          speakSection(idx) {
            const sections = this.activeProject?.materialSections || [];
            const section = sections[idx];
            if (!section) return;

            if (this.speakingIdx === idx) {
              if (this.isPaused) {
                window.speechSynthesis.resume();
                this.isPaused = false;
              } else {
                window.speechSynthesis.pause();
                this.isPaused = true;
              }
              return;
            }

            window.speechSynthesis.cancel();
            const plainText = section.content.replace(/<[^>]*>/g, '');
            this.speakingIdx = idx;
            this.isReading = true;
            this.isPaused = false;

            const utterance = new SpeechSynthesisUtterance(plainText);
            utterance.lang = 'id-ID';
            utterance.onend = () => {
              this.speakingIdx = null;
              this.isReading = false;
              this.isPaused = false;
            };
            window.speechSynthesis.speak(utterance);
          },

          speakAllSections() {
            const sections = this.activeProject?.materialSections || [];
            if (sections.length === 0) return;
            
            if (this.isReading) {
               this.stopSpeech();
               return;
            }

            let currentIndex = 0;
            this.isReading = true;
            this.isPaused = false;
            window.speechSynthesis.cancel();

            const speakNext = () => {
              if (currentIndex >= sections.length || !this.isReading) {
                this.stopSpeech();
                return;
              }
              
              this.speakingIdx = currentIndex;
              const plainText = sections[currentIndex].content.replace(/<[^>]*>/g, '');
              const utterance = new SpeechSynthesisUtterance(plainText);
              utterance.lang = 'id-ID';
              
              utterance.onend = () => {
                currentIndex++;
                speakNext();
              };
              
              window.speechSynthesis.speak(utterance);
            };

            speakNext();
          },

          applyTooltips(text) {
             if (!text) return "";
             let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
             const glossary = this.activeProject?.materialGlossary || [];
             
             const sorted = [...glossary].sort((a, b) => b.word.length - a.word.length);
             
             sorted.forEach(g => {
                const regex = new RegExp(\`\\\\b(\${g.word})\\\\b\`, 'gi');
                html = html.replace(regex, (match) => {
                  return \`<span class="relative group cursor-help font-bold text-[#FF5722] border-b-2 border-dotted border-[#FF5722] hover:bg-orange-50 transition-colors rounded px-1">\${match}<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1A237E] text-white text-xs font-normal p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 leading-relaxed pointer-events-none">\${g.definition}</span></span>\`;
                });
             });
             return html;
          },

          previewGame() {
            if (this.activeProject?.type === 'MATERI') {
              const hasManualContent = this.activeProject?.materiType === 'MANUAL' && this.activeProject?.materialSections?.length > 0;
              const hasFileContent = this.activeProject?.materiType !== 'MANUAL' && this.materiContents.length > 0;
              
              if (!hasManualContent && !hasFileContent) {
                alert("Belum ada konten materi untuk di-preview.");
                return;
              }
              this.showPreview = true;
              return;
            }

            if (this.activeProject?.gameType !== 'WORD_SEARCH' && this.questions.length === 0) {
              alert("Belum ada soal untuk di-preview.");
              return;
            }
            if (this.activeProject?.gameType === 'WORD_SEARCH' && (!this.gameData || !this.gameData.gridData)) {
              alert("Data grid Word Search belum tersedia.");
              return;
            }
            if (this.activeProject?.gameType === 'CROSSWORD' && (!this.gameData || !this.gameData.clues)) {
              alert("Data Crossword belum tersedia.");
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
        <h2 class="text-lg md:text-xl font-bold text-white uppercase tracking-widest" x-text="viewMode === 'all' ? 'Semua Proyek Saya' : 'Audit &amp; Kurasi Konten'"></h2>
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black text-[#FFC107] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">Expert Access</span>
          <div class="flex gap-2" x-show="!activeProject">
            <a href="/dashboard/pakar" :class="viewMode === 'active' ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-white/10 text-white'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Proyek Dikerjakan</a>
            <a href="/dashboard/pakar?view=all" :class="viewMode === 'all' ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-white/10 text-white'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Semua Proyek Saya</a>
          </div>
        </div>
      </div>

      <div class="p-8">
        <!-- ======= VIEW: PROYEK DIKERJAKAN (ACTIVE) ======= -->
        <div x-show="viewMode === 'active' && !activeProject">
          <!-- Header + Search -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <h2 class="text-base md:text-lg font-semibold text-[#1A237E] mb-1 flex items-center gap-2 uppercase tracking-tighter">
                <span class="h-5 w-1 bg-[#FFC107] rounded-full"></span>
                Antrean Review Proyek
              </h2>
              <p class="text-xs md:text-sm text-slate-400 font-medium">Proyek yang ditugaskan kepada Anda sebagai Pakar</p>
            </div>
            <div class="relative w-full md:w-64">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" x-model="search" placeholder="Cari Judul Proyek..." class="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:border-[#FFC107] outline-none shadow-inner">
            </div>
          </div>

          <!-- Tab Panel -->
          <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <!-- Tab Bar -->
            <div class="flex overflow-x-auto bg-[#1A237E]">
              <button @click="tab = 'REVIEW_PAKAR'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="tab === 'REVIEW_PAKAR' ? 'bg-white text-blue-600 border-blue-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                🔍 Review Pakar
              </button>
              <button @click="tab = 'REVISI_PAKAR'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="tab === 'REVISI_PAKAR' ? 'bg-white text-orange-600 border-orange-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i class="bi bi-pencil-square"></i> Revisi Pakar
              </button>
              <button @click="tab = 'ACCEPTED'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="tab === 'ACCEPTED' ? 'bg-white text-green-600 border-green-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i class="bi bi-check-circle"></i> Disetujui Pakar
              </button>
              <button @click="tab = 'KETUA'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="tab === 'KETUA' ? 'bg-white text-indigo-700 border-indigo-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i class="bi bi-award"></i> Proses Ketua
              </button>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto bg-white">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr class="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                  <th class="px-6 py-4 font-black">Judul Proyek</th>
                  <th class="px-6 py-4 font-black">Jenis</th>
                  <th class="px-6 py-4 font-black">Deadline</th>
                  <th class="px-6 py-4 font-black">PIC Pembuat</th>
                  <th class="px-6 py-4 font-black">Status</th>
                  <th class="px-6 py-4 font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-slate-600 divide-y divide-slate-50">
                <template x-for="p in filteredProjects()" :key="p.id">
                  <tr class="hover:bg-blue-50/40 transition-all group">
                    <td class="px-6 py-5">
                      <div class="font-semibold text-slate-800 text-base md:text-lg leading-tight group-hover:text-[#1A237E] transition-colors" x-text="p.title"></div>
                      <div class="text-[10px] text-slate-400 font-bold mt-0.5" x-text="(p.type === 'MATERI' ? '#M' : '#G') + p.id"></div>
                    </td>
                    <td class="px-6 py-5">
                      <span x-show="p.type === 'GAME'" class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-black uppercase border border-slate-200" x-text="p.gameType || '-'"></span>
                      <span x-show="p.type === 'MATERI'" class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black uppercase border border-emerald-200" x-text="p.materiType || '-'"></span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-slate-700 font-bold" x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-sm md:text-base font-medium text-slate-700" x-text="getUserName(p.idPembuat)"></span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
                        :class="{
                          'bg-blue-100 text-blue-800 border border-blue-200': p.status === 'REVIEW_PAKAR',
                          'bg-orange-100 text-orange-800 border border-orange-200': p.status === 'REVISI_PAKAR',
                          'bg-green-100 text-green-800 border border-green-200': p.status === 'ACCEPTED_PAKAR',
                          'bg-indigo-100 text-indigo-800 border border-indigo-200': p.status === 'REVIEW_KETUA',
                          'bg-red-100 text-red-800 border border-red-200': p.status === 'REVISI_KETUA',
                        }"
                        x-text="p.status.replace(/_/g, ' ')">
                      </span>
                    </td>
                    <td class="px-6 py-5 text-right">
                      <button @click="openProject(p.id)" class="bg-[#1A237E] text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-900 transition-all shadow-md uppercase tracking-widest">REVIEW</button>
                    </td>
                  </tr>
                </template>
                <template x-if="filteredProjects().length === 0">
                  <tr><td colspan="6" class="text-center py-16 text-slate-400 italic font-bold">
                    <div class="text-4xl mb-3 opacity-30">📭</div>
                    <div class="text-xs uppercase tracking-widest">Tidak ada proyek dalam antrean ini.</div>
                  </td></tr>
                </template>
              </tbody>
            </table>
            </div><!-- /overflow-x-auto bg-white -->
          </div><!-- /tab-panel -->
        </div><!-- /viewMode active -->

        <!-- ======= VIEW: SEMUA PROYEK SAYA (PUBLISHED) ======= -->
        <div x-show="viewMode === 'all' && !activeProject">
          <div class="mb-6">
            <h2 class="text-lg font-black text-[#1A237E] flex items-center gap-2 uppercase tracking-tighter">
              <span class="h-5 w-1 bg-green-500 rounded-full"></span>
              Proyek Telah Dipublikasikan
            </h2>
            <p class="text-xs text-slate-400 font-bold mt-1">Game yang sudah live dan pernah Anda review (Read-Only)</p>
          </div>

          <div class="flex justify-end mb-6">
            <div class="relative w-full md:w-72">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" x-model="searchPublished" placeholder="Cari judul game..." class="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:border-green-400 outline-none shadow-inner">
            </div>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr class="text-slate-400 text-xs uppercase tracking-widest">
                  <th class="px-6 py-4 font-black">Judul Game</th>
                  <th class="px-6 py-4 font-black">Jenis Game</th>
                  <th class="px-6 py-4 font-black">Deadline</th>
                  <th class="px-6 py-4 font-black">Tanggal Publish</th>
                  <th class="px-6 py-4 font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-slate-600 divide-y divide-slate-50">
                <template x-for="p in filteredPublishedProjects()" :key="p.id">
                  <tr class="hover:bg-green-50/40 transition-all group">
                    <td class="px-6 py-5">
                      <div class="font-black text-slate-800 group-hover:text-green-700 transition-colors" x-text="p.title"></div>
                      <div class="text-[10px] text-slate-400 font-bold mt-0.5" x-text="'#G' + p.id"></div>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-black uppercase border border-green-200" x-text="p.gameType || '-'"></span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-slate-700 font-bold" x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td class="px-6 py-5">
                      <div class="flex items-center gap-2">
                        <span class="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span class="text-green-700 font-black text-sm" x-text="p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                      </div>
                    </td>
                    <td class="px-6 py-5 text-right">
                      <button @click="openProject(p.id)" class="bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-md uppercase tracking-widest">LIHAT DETAIL</button>
                    </td>
                  </tr>
                </template>
                <template x-if="filteredPublishedProjects().length === 0">
                  <tr><td colspan="5" class="text-center py-16 text-slate-400 italic font-bold">
                    <div class="text-4xl mb-3 opacity-30">🏆</div>
                    <div class="text-xs uppercase tracking-widest">Belum ada game yang dipublikasikan.</div>
                  </td></tr>
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
        </div><!-- /Detail View -->

      </div><!-- /p-8 -->

      <!-- Preview Modal -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
        <div class="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
          <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-red-500 z-10 text-3xl font-black">&times;</button>
          <div class="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-widest border-b-4 border-[#FFC107]">
            <span x-text="activeProject?.type === 'MATERI' ? 'PREVIEW MATERI: ' : 'SIMULASI GAME: '"></span> <span x-text="activeProject?.title" class="text-[#FFC107]"></span>
          </div>
          <div class="p-8 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center">
            
            <!-- MATERI PREVIEW -->
            <template x-if="activeProject?.type === 'MATERI'">
              <div class="w-full flex flex-col items-center gap-8">
                <template x-if="activeProject?.materiType === 'MANUAL'">
                  <div class="w-full max-w-4xl flex flex-col gap-6">
                    <div class="flex justify-end w-full">
                       <button @click="speakAllSections()" class="bg-[#1A237E] hover:bg-indigo-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2">
                         <template x-if="isReading"><span>Jeda / Berhenti Baca Semua</span></template>
                         <template x-if="!isReading"><span>🔊 Bacakan Semua Kartu</span></template>
                       </button>
                    </div>
                    <style>
                      .flip-out { transform: rotateY(90deg); opacity: 0; }
                      .flip-in { transform: rotateY(0deg); opacity: 1; }
                      .flip-start { transform: rotateY(-90deg); opacity: 0; }
                    </style>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style="perspective: 1200px;">
                      <template x-for="(section, idx) in activeProject?.materialSections || []" :key="idx">
                        <div x-data="{ flipped: false }" class="w-full relative min-h-[350px]">
                        
                        <!-- Front of Flashcard -->
                        <div x-show="!flipped" 
                             x-transition:leave="transition-all duration-300 ease-in"
                             x-transition:leave-start="flip-in"
                             x-transition:leave-end="flip-out"
                             @click="if(idx <= unlockedIdx) { flipped = true; if(idx === unlockedIdx) unlockedIdx++; }"
                             class="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-10 md:p-16 bg-gradient-to-br from-[#1A237E] to-blue-900 text-white"
                             :class="idx > unlockedIdx ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-transform'">
                           <div class="absolute inset-0 bg-[url('/public/assets/pattern-bg.png')] opacity-10"></div>
                           
                           <!-- Locked Overlay -->
                           <div x-show="idx > unlockedIdx" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-[#FFC107] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              <span class="bg-[#1A237E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl border border-[#FFC107]/30">Buka kartu sebelumnya terlebih dahulu</span>
                           </div>

                           <div class="relative z-10 text-center w-full flex flex-col items-center h-full justify-center">
                             <span class="inline-block bg-[#FF5722] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-md" x-text="'KARTU MATERI ' + (idx + 1)"></span>
                             <h2 class="text-2xl md:text-4xl font-black text-center tracking-tight leading-tight" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                             <button x-show="idx <= unlockedIdx" class="mt-8 flex items-center justify-center gap-2 text-[#FFC107] text-sm font-bold animate-bounce bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                               Buka Kartu
                             </button>
                           </div>
                        </div>
                        
                        <!-- Back of Flashcard -->
                        <div x-show="flipped" style="display: none;" 
                             x-transition:enter="transition-all duration-300 ease-out delay-300"
                             x-transition:enter-start="flip-start"
                             x-transition:enter-end="flip-in"
                             class="w-full h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                          <div class="bg-[#1A237E] text-white px-6 py-4 flex justify-between items-center min-h-[140px] border-b-4 border-[#FFC107] gap-4">
                            <div class="flex items-center gap-3 flex-1">
                              <button @click="flipped = false" class="shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors" title="Tutup Kartu">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                              </button>
                              <h2 class="text-xl md:text-2xl font-bold leading-tight" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                            </div>
                            <!-- Speaker Button -->
                            <button @click="speakSection(idx)" class="shrink-0 bg-[#FF5722] hover:bg-[#E64A19] px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-md">
                              <template x-if="speakingIdx === idx && !isPaused">
                                 <div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Jeda</div>
                              </template>
                              <template x-if="speakingIdx === idx && isPaused">
                                 <div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg> Lanjut</div>
                              </template>
                              <template x-if="speakingIdx !== idx">
                                 <div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 19h4.586a2 2 0 001.414-.586l4.828-4.828A2 2 0 0016 12.172V7.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 009.172 1H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> Dengar</div>
                              </template>
                            </button>
                          </div>
                          <div class="p-6 md:p-10 flex-1 text-slate-700 leading-relaxed text-sm md:text-base font-medium max-w-2xl mx-auto" style="white-space: pre-wrap;" x-html="applyTooltips(section.content)"></div>
                        </div>
                      </div>
                    </template>
                    </div>
                  </div>
                </template>
                <template x-if="activeProject?.materiType !== 'MANUAL'">
                  <div class="w-full flex flex-col items-center gap-8">
                    <template x-for="content in materiContents">
                      <div class="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                        <template x-if="content.contentType === 'IMAGE'">
                          <img :src="content.fileUrl" class="w-full h-auto object-contain" />
                        </template>
                        <template x-if="content.contentType === 'PDF' || content.contentType === 'PPT'">
                          <iframe :src="content.fileUrl" class="w-full h-[70vh] border-0"></iframe>
                        </template>
                        <template x-if="content.contentType === 'VIDEO'">
                          <video :src="content.fileUrl" controls class="w-full h-auto max-h-[70vh] bg-black"></video>
                        </template>
                        <template x-if="content.contentType === 'EMBED_URL'">
                          <iframe :src="content.fileUrl" class="w-full h-[500px] border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </template>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </template>

            <!-- GAME PREVIEW -->
            <div x-show="activeProject?.type === 'GAME'" class="text-center w-full max-w-2xl space-y-6">
              <template x-if="activeProject?.gameType === 'WORD_SEARCH' && gameData">
                <div class="w-full">
                  ${WordSearchGame({ projectVar: 'activeProject', gameDataVar: 'gameData' })}
                </div>
              </template>
              <template x-if="activeProject?.gameType === 'CROSSWORD' && gameData">
                <div class="w-full">
                  ${CrosswordGame({ projectVar: 'activeProject', gameDataVar: 'gameData', isReadOnly: 'true' })}
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
    ${CrosswordGameScript()}
  `;
};
