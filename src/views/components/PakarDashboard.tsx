import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";
import { ProjectHeader } from "./ProjectHeader";

export const PakarDashboard = ({ myProjects, publishedProjects, allUsers, analytics }: {
 myProjects: any[], publishedProjects: any[], allUsers: any[], analytics?: any }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');
  const publishedProjectsJson = JSON.stringify(publishedProjects).replace(/</g, '\\u003c');
  const allUsersJson = JSON.stringify(allUsers).replace(/</g, '\\u003c');
  const analyticsJson = analytics ? JSON.stringify(analytics).replace(/</g, '\\u003c') : 'null';

  return `
    <script id="pakarProjectsData" type="application/json">${myProjectsJson}</script>
    <script id="pakarPublishedData" type="application/json">${publishedProjectsJson}</script>
    <script id="pakarUsersData" type="application/json">${allUsersJson}</script>
    <script id="pakarAnalyticsData" type="application/json">${analyticsJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pakarDashboard', () => ({
          analytics: JSON.parse(document.getElementById('pakarAnalyticsData').textContent || 'null'),
          menuTab: new URLSearchParams(window.location.search).get('tab') || 'dashboard',
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
          previewLevel: 1,
          previewQuestions: [],
          gameLevelCount: 1,
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
          filterKey: '',
            filterValue: '',
            filterStart: '',
            filterEnd: '',
            appliedFilter: { key: '', value: '', start: '', end: '' },

            applyFilter() {
              this.appliedFilter = {
                key: this.filterKey,
                value: this.filterValue,
                start: this.filterStart,
                end: this.filterEnd
              };
            },

            resetFilter() {
              this.filterKey = '';
              this.filterValue = '';
              this.filterStart = '';
              this.filterEnd = '';
              this.appliedFilter = { key: '', value: '', start: '', end: '' };
            },

            getUniqueValues(field) {
              const src = this.allProjects || [...(this.myProjects||[]), ...(this.publishedProjects||[])];
              const vals = src.map(p => p[field]).filter(v => v);
              return [...new Set(vals)];
            },

            getPakarList() {
              if (this.allUsers) return this.allUsers.filter(u => u.role === 'PAKAR');
              if (this.pakars) return this.pakars;
              return [];
            },

            applyDynamicFilter(list) {
              if (!list || !Array.isArray(list)) return [];
              if (!this.appliedFilter.key) return list;
              return list.filter(p => {
                const { key, value, start, end } = this.appliedFilter;
                if (key === 'title_game' || key === 'title_materi') {
                  if (!value) return false;
                  return p.title?.toLowerCase().includes(value.toLowerCase());
                }
                if (key === 'type_game') {
                  if (!value) return false;
                  return p.gameType === value;
                }
                if (key === 'type_materi') {
                  if (!value) return false;
                  return p.materiType === value;
                }
                if (key === 'type_project') {
                  if (!value) return false;
                  return p.type === value;
                }
                if (key === 'pembuat') {
                  if (!value) return false;
                  return Number(p.idPembuat) === Number(value);
                }
                if (key === 'pakar') {
                  if (!value) return false;
                  return Number(p.idPakar) === Number(value);
                }
                if (key === 'status') {
                  if (!value) return false;
                  return this.workflowStatus(p) === value;
                }
                if (key === 'deadline') {
                  if (!p.deadline) return false;
                  const d = new Date(p.deadline);
                  const sd = start ? new Date(start) : null;
                  const ed = end ? new Date(end) : null;
                  if (sd && d < sd) return false;
                  if (ed && d > ed) return false;
                  return true;
                }
                return false;
              });
            },
          allProjects: JSON.parse(document.getElementById('pakarProjectsData').textContent || '[]'),
          // Status kerja: untuk game terbit yang sedang menambah level, yang dipakai adalah status level baru
          workflowStatus(p) {
            return p && p.status === 'PUBLISHED' && p.levelReviewStatus ? p.levelReviewStatus : p?.status;
          },

          statusLabel(p) {
            if (!p) return '';
            if (p.status === 'PUBLISHED' && p.levelReviewStatus) return 'LEVEL BARU: ' + p.levelReviewStatus.replace(/_/g, ' ');
            return p.status.replace(/_/g, ' ');
          },

          getUserName(id) {
            const u = this.allUsers.find(u => u.id === id);
            return u ? u.name : '-';
          },
          filteredProjects() {
            return this.applyDynamicFilter(this.allProjects);
          },
          filteredPublishedProjects() {
            return this.applyDynamicFilter(this.publishedProjects);
          },
          publishedProjects: JSON.parse(document.getElementById('pakarPublishedData').textContent || '[]'),
          allUsers: JSON.parse(document.getElementById('pakarUsersData').textContent || '[]'),


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
                  this.gameLevelCount = wsJson.levelCount || 1;
                } else if (this.activeProject.gameType === 'CROSSWORD') {
                  const cwRes = await fetch('/api/crossword/' + id);
                  const cwJson = await cwRes.json();
                  if (cwJson.success && cwJson.data) this.gameData = cwJson.data;
                  this.gameLevelCount = cwJson.levelCount || 1;
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
                  return \`<span class="relative group cursor-help font-bold text-accent border-b-2 border-dotted border-accent hover:bg-orange-50 transition-colors rounded px-1">\${match}<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-primary text-white text-xs font-normal p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 leading-relaxed pointer-events-none">\${g.definition}</span></span>\`;
                });
             });
             return html;
          },

          // --- Preview per level ---
          previewLevelCount() {
            const t = this.activeProject?.gameType;
            if (t === 'WORD_SEARCH' || t === 'CROSSWORD') return Math.max(1, this.gameLevelCount || 1);
            return Math.max(1, ...this.questions.map(q => Number(q.level) || 1));
          },

          // Level yang belum terbit pada game yang sudah terbit (sedang menambah level)
          isNewPreviewLevel(level) {
            return this.activeProject?.status === 'PUBLISHED' && level > (this.activeProject.publishedLevelCount || 0);
          },

          async selectPreviewLevel(level) {
            this.previewLevel = level;
            this.currentQuestionIndex = 0;
            this.selectedAnswer = null;
            this.showExplanation = false;
            this.isCorrect = false;
            this.userFTBAnswers = [];
            const t = this.activeProject?.gameType;
            if (t === 'WORD_SEARCH' || t === 'CROSSWORD') {
              const base = t === 'WORD_SEARCH' ? '/api/word-search/' : '/api/crossword/';
              const res = await fetch(base + this.activeProject.id + '?level=' + level);
              const json = await res.json();
              // Lepas komponen grid lama dulu agar grid level yang dipilih dimuat ulang
              this.gameData = null;
              await this.$nextTick();
              this.gameData = json.success ? json.data : null;
            } else {
              this.previewQuestions = this.questions.filter(q => (Number(q.level) || 1) === level);
            }
          },

          async previewGame() {
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

            // Game: buka di level baru jika sedang menambah level, selain itu Level 1
            const firstNewLevel = (this.activeProject.publishedLevelCount || 0) + 1;
            const startLevel = this.activeProject.status === 'PUBLISHED' && firstNewLevel <= this.previewLevelCount() ? firstNewLevel : 1;
            await this.selectPreviewLevel(startLevel);
            const isGrid = this.activeProject?.gameType === 'WORD_SEARCH' || this.activeProject?.gameType === 'CROSSWORD';
            if (isGrid ? !this.gameData : this.previewQuestions.length === 0) {
              alert('Belum ada isi game untuk di-preview.');
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
            this.isCorrect = opt === this.previewQuestions[this.currentQuestionIndex].correctAnswer;
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
            const q = this.previewQuestions[this.currentQuestionIndex];
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
            if (this.currentQuestionIndex < this.previewQuestions.length - 1) {
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

    <div class="bg-white p-0 w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" x-data="pakarDashboard()">
      <!-- Header -->
      <div class="bg-primary p-6 border-b-4 border-highlight flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-lg md:text-xl font-bold text-white uppercase tracking-widest leading-tight" x-text="activeProject ? 'Review Proyek' : (menuTab === 'dashboard' ? 'DASHBOARD ANALITIK' : 'PEMERIKSAAN & PENYELARASAN MATERI')"></h2>
        </div>
        <div class="flex items-center gap-4">
           <span x-show="activeProject" id="saveStatus" class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500">CLOUD SYNC ACTIVE</span>
        </div>
      </div>

      <div class="p-5">
        <!-- ======= VIEW: PROYEK DIKERJAKAN (ACTIVE) ======= -->
        
      <!-- ANALYTICS WIDGETS -->
      <template x-if="menuTab === 'dashboard' && !activeProject && analytics">
        <div class="space-y-6 mb-8">
          <!-- SECTION 1: GLOBAL ECOSYSTEM METRICS -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Total Proyek Game Dipublish</p>
                <h3 class="text-4xl font-black text-highlight" x-text="analytics.globalMetrics.totalPublishedGames"></h3>
              </div>
              <div class="text-5xl opacity-80"><i class="bi bi-controller"></i></div>
            </div>
            <div class="bg-gradient-to-r from-accent to-orange-500 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-orange-200 mb-1">Total Proyek Materi Dipublish</p>
                <h3 class="text-4xl font-black" x-text="analytics.globalMetrics.totalPublishedMaterials"></h3>
              </div>
              <div class="text-5xl opacity-80"><i class="bi bi-journal-text"></i></div>
            </div>
          </div>

          <!-- SECTION 2: KPI PAKAR REVIEWER -->
          <div class="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="h-6 w-1.5 bg-primary rounded-full"></span>
              <h3 class="text-lg font-bold text-primary uppercase tracking-widest">KPI Pakar Reviewer</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Proyek Ditugaskan</p>
                <p class="text-2xl font-black text-primary" x-text="analytics.reviewerKpi.totalAssignedReviews"></p>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proyek Sedang Ditinjau</p>
                <p class="text-2xl font-black text-accent" x-text="analytics.reviewerKpi.pendingReviewsCount"></p>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Waktu Review</p>
                <p class="text-sm font-black text-green-600 mt-2" x-text="analytics.reviewerKpi.avgReviewTimeFormatted"></p>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Revisi per Proyek</p>
                <p class="text-2xl font-black text-purple-600" x-text="analytics.reviewerKpi.avgRevisionPerProject"></p>
              </div>
            </div>
            <!-- Tabel Peringkat Kecepatan Review -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" x-data="{ sortAsc: true }">
              <div class="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                <h4 class="text-xs font-bold text-primary uppercase tracking-widest">Urutan Kecepatan Review</h4>
                <button @click="sortAsc = !sortAsc; analytics.reviewerKpi.speedRankedReviews.reverse()" class="text-[10px] bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <i class="bi" :class="sortAsc ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up'"></i>
                  <span x-text="sortAsc ? 'Tercepat -> Terlambat' : 'Terlambat -> Tercepat'"></span>
                </button>
              </div>
              <div class="max-h-48 overflow-y-auto">
                <template x-if="analytics.reviewerKpi.speedRankedReviews.length === 0">
                  <div class="p-6 text-center text-xs text-slate-400 font-bold italic">Belum ada proyek yang direview.</div>
                </template>
                <table class="w-full text-left border-collapse" x-show="analytics.reviewerKpi.speedRankedReviews.length > 0">
                  <tbody>
                    <template x-for="(proj, idx) in analytics.reviewerKpi.speedRankedReviews" :key="proj.id">
                      <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="p-3 pl-4">
                          <span class="w-6 h-6 inline-flex items-center justify-center rounded-full text-[10px] font-black" :class="idx === 0 && sortAsc ? 'bg-highlight text-primary' : 'bg-slate-100 text-slate-500'" x-text="idx + 1"></span>
                        </td>
                        <td class="p-3 text-sm font-semibold text-primary" x-text="proj.title"></td>
                        <td class="p-3 text-xs font-bold text-slate-500 text-right pr-4" x-text="proj.durationFormatted"></td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- SECTION 3: POPULARITY & ENGAGEMENT SHOWCASE -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Top Played Games -->
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <span class="h-6 w-1.5 bg-highlight rounded-full"></span>
                <h3 class="text-sm font-bold text-primary uppercase tracking-widest">Proyek Game Paling Sering Dimainkan</h3>
              </div>
              <div class="space-y-3">
                <template x-if="analytics.popularityMetrics.topPlayedGames.length === 0">
                  <div class="text-xs text-slate-400 italic">Belum ada data permainan.</div>
                </template>
                <template x-for="(game, i) in analytics.popularityMetrics.topPlayedGames" :key="i">
                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="flex items-center gap-3">
                      <div class="text-lg opacity-50">🎮</div>
                      <h4 class="text-sm font-semibold text-slate-700" x-text="game.title"></h4>
                    </div>
                    <div class="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full"><span x-text="game.playCount"></span>x Dimainkan</div>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Top Accessed Materials -->
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <span class="h-6 w-1.5 bg-accent rounded-full"></span>
                <h3 class="text-sm font-bold text-primary uppercase tracking-widest">Proyek Materi Paling Sering Diakses</h3>
              </div>
              <div class="space-y-3">
                <template x-if="analytics.popularityMetrics.topAccessedMaterials.length === 0">
                  <div class="text-xs text-slate-400 italic">Belum ada data materi.</div>
                </template>
                <template x-for="(mat, i) in analytics.popularityMetrics.topAccessedMaterials" :key="i">
                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="flex items-center gap-3">
                      <div class="text-lg opacity-50">📖</div>
                      <h4 class="text-sm font-semibold text-slate-700" x-text="mat.title"></h4>
                    </div>
                    <div class="text-xs font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full"><span x-text="mat.accessCount"></span>x Diakses</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>


        <!-- ======= VIEW: PROYEK DIKERJAKAN (ACTIVE) ======= -->
        <div x-show="menuTab === 'projects' && viewMode === 'active' && !activeProject">
          <!-- Header + Search -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <h2 class="text-base md:text-lg font-semibold text-primary mb-1 flex items-center gap-2 uppercase tracking-tighter">
                <span class="h-5 w-1 bg-highlight rounded-full"></span>
                Antrean Review Proyek
              </h2>
              <p class="text-xs md:text-sm text-slate-400 font-medium">Proyek yang ditugaskan kepada Anda sebagai Pakar</p>
            </div>
            
          </div>

          <!-- Tab Panel -->
          <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            
            <!-- Dynamic Filter -->
            <div class="flex flex-wrap items-center gap-3 w-full mb-6 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
              <div class="flex flex-col gap-1 w-48 shrink-0">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kriteria Filter</label>
                <select x-model="filterKey" @change="filterValue=''; filterStart=''; filterEnd=''" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                  <option value="">-- Pilih Kriteria --</option>
                  <option value="title_game">Judul Proyek</option>
                  <option value="type_project">Tipe Proyek (Game/Materi)</option>
                  <option value="type_game">Jenis Game</option>
                  <option value="type_materi">Jenis Materi</option>
                  <option value="deadline">Tanggal Deadline</option>
                  <option value="pembuat">PIC Pembuat</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai Filter</label>
                
                <template x-if="filterKey === 'title_game'">
                  <input type="text" x-model="filterValue" placeholder="Ketik pencarian..." class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                </template>

                <template x-if="filterKey === 'type_project'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Tipe --</option>
                    <option value="GAME">Game</option>
                    <option value="MATERI">Materi</option>
                  </select>
                </template>

                <template x-if="filterKey === 'type_game'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Jenis Game --</option>
                    <option value="QUIZ">QUIZ</option>
                <option value="FILL_THE_BLANK">FILL THE BLANK</option>
                <option value="WORD_SEARCH">WORD SEARCH</option>
                <option value="CROSSWORD">CROSSWORD</option>
                <option value="ADVENTURE">ADVENTURE</option>
                  </select>
                </template>

                <template x-if="filterKey === 'type_materi'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Jenis Materi --</option>
                    <option value="TEKS">TEKS</option>
                <option value="VIDEO">VIDEO</option>
                <option value="MANUAL">MANUAL</option>
                  </select>
                </template>

                <template x-if="filterKey === 'pembuat'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Pembuat --</option>
                    <template x-for="p in allUsers.filter(u => u.role.includes('PEMBUAT'))" :key="p.id">
                      <option :value="p.id" x-text="p.name || ('User ID '+p.id)"></option>
                    </template>
                  </select>
                </template>

                <template x-if="filterKey === 'status'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Status --</option>
                    <option value="REVIEW_PAKAR">REVIEW PAKAR</option>
                    <option value="REVISI_PAKAR">REVISI PAKAR</option>
                    <option value="ACCEPTED_PAKAR">ACCEPTED PAKAR</option>
                    <option value="REVIEW_KETUA">REVIEW KETUA</option>
                    <option value="REVISI_KETUA">REVISI KETUA</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </template>

                <template x-if="filterKey === 'deadline'">
                  <div class="flex gap-2">
                    <input type="date" x-model="filterStart" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <span class="self-center font-bold text-slate-400">-</span>
                    <input type="date" x-model="filterEnd" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                  </div>
                </template>

                <template x-if="!filterKey">
                  <div class="w-full border-2 border-slate-200 border-dashed rounded-lg py-2 px-3 text-sm text-slate-400 italic bg-white text-center shadow-sm">Pilih kriteria terlebih dahulu</div>
                </template>
              </div>
              
              <div class="flex gap-2 ml-auto shrink-0 self-end">
                <button @click="applyFilter()" class="bg-primary text-highlight py-2.5 px-4 text-sm font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-all uppercase tracking-widest flex items-center gap-2">
                  TERAPKAN
                </button>
                <button @click="resetFilter()" class="bg-slate-200 text-slate-700 py-2.5 px-4 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 transition-all uppercase tracking-widest">
                  RESET
                </button>
              </div>
            </div>
            <!-- Table -->
            <p class="md:hidden px-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geser tabel ke samping <i class="bi bi-arrow-right"></i></p>
            <div class="overflow-x-auto bg-white">
            <table class="w-full table-auto text-left">
              <thead class="bg-slate-50">
                <tr class="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Judul Proyek</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Jenis</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Deadline</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">PIC Pembuat</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Status</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-slate-600 divide-y divide-slate-50">
                <template x-for="p in filteredProjects()" :key="p.id">
                  <tr class="hover:bg-blue-50/40 transition-all group">
                    <td class="px-6 py-2.5">
                      <div class="font-semibold text-slate-800 text-base md:text-lg leading-tight group-hover:text-primary transition-colors" x-text="p.title"></div>
                      <div class="text-[10px] text-slate-400 font-bold mt-0.5" x-text="(p.type === 'MATERI' ? '#M' : '#G') + p.id"></div>
                    </td>
                    <td class="px-6 py-2.5">
                      <span x-show="p.type === 'GAME'" class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-black uppercase border border-slate-200" x-text="p.gameType || '-'"></span>
                      <span x-show="p.type === 'MATERI'" class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black uppercase border border-emerald-200" x-text="p.materiType || '-'"></span>
                    </td>
                    <td class="px-6 py-2.5">
                      <span class="text-slate-700 font-bold" x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td class="px-6 py-2.5">
                      <span class="text-sm md:text-base font-medium text-slate-700" x-text="getUserName(p.idPembuat)"></span>
                    </td>
                    <td class="px-6 py-2.5">
                      <span class="inline-block whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
                        :class="{
                          'bg-slate-100 text-slate-600 border border-slate-200': workflowStatus(p) === 'DRAFT',
                          'bg-blue-100 text-blue-800 border border-blue-200': workflowStatus(p) === 'REVIEW_PAKAR' || workflowStatus(p) === 'REVIEW_KETUA',
                          'bg-orange-100 text-accent-hover border border-orange-200': workflowStatus(p) === 'REVISI_PAKAR' || workflowStatus(p) === 'REVISI_KETUA',
                          'bg-highlight text-primary border border-highlight': workflowStatus(p) === 'ACCEPTED_PAKAR',
                          'bg-green-100 text-green-800 border border-green-200': workflowStatus(p) === 'PUBLISHED',
                          'bg-red-100 text-red-800 border border-red-200': workflowStatus(p) === 'UNPUBLISHED',
                        }"
                        x-text="statusLabel(p)">
                      </span>
                    </td>
                    <td class="px-6 py-2.5 align-middle">
                      <div class="flex items-center justify-end gap-2">
                        <button @click="$dispatch('open-chat-drawer', { projectId: p.id, contextType: 'GENERAL', contextTargetId: null, targetName: p.title, userRole: window.USER_ROLE })" title="Diskusi Proyek" class="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black hover:bg-indigo-200 shadow-sm transition-all uppercase tracking-widest flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" /></svg>
                        </button>
                        <button x-show="!['REVIEW_PAKAR', 'REVISI_PAKAR'].includes(workflowStatus(p))" @click="openProject(p.id)" class="bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2 rounded-xl text-xs font-black hover:bg-slate-200 transition-all shadow-sm uppercase tracking-widest">DETAIL</button>
                        <button x-show="workflowStatus(p) === 'REVIEW_PAKAR'" @click="openProject(p.id)" class="bg-primary text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-primary-dark transition-all shadow-md uppercase tracking-widest">REVIEW</button>
                        <button x-show="workflowStatus(p) === 'REVISI_PAKAR'" @click="openProject(p.id)" class="bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-md uppercase tracking-widest">LIHAT REVISI</button>
                      </div>
                    </td>
                  </tr>
                </template>
                <template x-if="filteredProjects().length === 0">
                  <tr><td colspan="6" class="text-center py-16 text-slate-400 italic font-bold">
                    <div class="text-lg mb-3 opacity-30">📭</div>
                    <div class="text-xs uppercase tracking-widest">Tidak ada proyek dalam antrean ini.</div>
                  </td></tr>
                </template>
              </tbody>
            </table>
            </div><!-- /overflow-x-auto bg-white -->
          </div><!-- /tab-panel -->
        </div><!-- /viewMode active -->

        <!-- ======= VIEW: SEMUA PROYEK SAYA (PUBLISHED) ======= -->
        <div x-show="menuTab === 'projects' && viewMode === 'all' && !activeProject">
          <div class="mb-6">
            <h2 class="text-lg font-black text-primary flex items-center gap-2 uppercase tracking-tighter">
              <span class="h-5 w-1 bg-green-500 rounded-full"></span>
              Proyek Telah Dipublikasikan
            </h2>
            <p class="text-xs text-slate-400 font-bold mt-1">Game yang sudah live dan pernah Anda review (Read-Only)</p>
          </div>

          <div class="flex justify-end mb-6">
            
          </div>

          
            <!-- Dynamic Filter -->
            <div class="flex flex-wrap items-center gap-3 w-full mb-6 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
              <div class="flex flex-col gap-1 w-48 shrink-0">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kriteria Filter</label>
                <select x-model="filterKey" @change="filterValue=''; filterStart=''; filterEnd=''" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                  <option value="">-- Pilih Kriteria --</option>
                  <option value="title_game">Judul Proyek</option>
                  <option value="type_project">Tipe Proyek (Game/Materi)</option>
                  <option value="type_game">Jenis Game</option>
                  <option value="type_materi">Jenis Materi</option>
                  <option value="deadline">Tanggal Deadline</option>
                  <option value="pembuat">PIC Pembuat</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai Filter</label>
                
                <template x-if="filterKey === 'title_game'">
                  <input type="text" x-model="filterValue" placeholder="Ketik pencarian..." class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                </template>

                <template x-if="filterKey === 'type_project'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Tipe --</option>
                    <option value="GAME">Game</option>
                    <option value="MATERI">Materi</option>
                  </select>
                </template>

                <template x-if="filterKey === 'type_game'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Jenis Game --</option>
                    <option value="QUIZ">QUIZ</option>
                    <option value="FILL_THE_BLANK">FILL THE BLANK</option>
                    <option value="WORD_SEARCH">WORD SEARCH</option>
                    <option value="CROSSWORD">CROSSWORD</option>
                    <option value="ADVENTURE">ADVENTURE</option>
                  </select>
                </template>

                <template x-if="filterKey === 'type_materi'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Jenis Materi --</option>
                    <option value="TEKS">TEKS</option>
                    <option value="VIDEO">VIDEO</option>
                    <option value="MANUAL">MANUAL</option>
                  </select>
                </template>

                <template x-if="filterKey === 'pembuat'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Pembuat --</option>
                    <template x-for="p in allUsers.filter(u => u.role.includes('PEMBUAT'))" :key="p.id">
                      <option :value="p.id" x-text="p.name || ('User ID '+p.id)"></option>
                    </template>
                  </select>
                </template>

                <template x-if="filterKey === 'status'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Status --</option>
                    <option value="REVIEW_PAKAR">REVIEW PAKAR</option>
                    <option value="REVISI_PAKAR">REVISI PAKAR</option>
                    <option value="ACCEPTED_PAKAR">ACCEPTED PAKAR</option>
                    <option value="REVIEW_KETUA">REVIEW KETUA</option>
                    <option value="REVISI_KETUA">REVISI KETUA</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </template>

                <template x-if="filterKey === 'deadline'">
                  <div class="flex gap-2">
                    <input type="date" x-model="filterStart" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <span class="self-center font-bold text-slate-400">-</span>
                    <input type="date" x-model="filterEnd" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                  </div>
                </template>

                <template x-if="!filterKey">
                  <div class="w-full border-2 border-slate-200 border-dashed rounded-lg py-2 px-3 text-sm text-slate-400 italic bg-white text-center shadow-sm">Pilih kriteria terlebih dahulu</div>
                </template>
              </div>
              
              <div class="flex gap-2 ml-auto shrink-0 self-end">
                <button @click="applyFilter()" class="bg-primary text-highlight py-2.5 px-4 text-sm font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-all uppercase tracking-widest flex items-center gap-2">
                  TERAPKAN
                </button>
                <button @click="resetFilter()" class="bg-slate-200 text-slate-700 py-2.5 px-4 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 transition-all uppercase tracking-widest">
                  RESET
                </button>
              </div>
            </div>
          <p class="md:hidden px-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geser tabel ke samping <i class="bi bi-arrow-right"></i></p>
          <div class="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
            <table class="w-full table-auto text-left">
              <thead class="bg-slate-50">
                <tr class="text-slate-400 text-xs uppercase tracking-widest">
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Judul Game</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Jenis Game</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Deadline</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black">Tanggal Publish</th>
                  <th class="p-2 text-sm.5 text-sm rounded-lg font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-slate-600 divide-y divide-slate-50">
                <template x-for="p in filteredPublishedProjects()" :key="p.id">
                  <tr class="hover:bg-green-50/40 transition-all group">
                    <td class="px-6 py-2.5">
                      <div class="font-black text-slate-800 group-hover:text-green-700 transition-colors" x-text="p.title"></div>
                      <div class="text-[10px] text-slate-400 font-bold mt-0.5" x-text="'#G' + p.id"></div>
                    </td>
                    <td class="px-6 py-2.5">
                      <span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-black uppercase border border-green-200" x-text="p.gameType || '-'"></span>
                    </td>
                    <td class="px-6 py-2.5">
                      <span class="text-slate-700 font-bold" x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td class="px-6 py-2.5">
                      <span class="text-slate-700 font-bold" x-text="p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td class="px-6 py-2.5 align-middle">
                      <div class="flex items-center justify-end gap-2">
                        <button @click="$dispatch('open-chat-drawer', { projectId: p.id, contextType: 'GENERAL', contextTargetId: null, targetName: p.title, userRole: window.USER_ROLE })" title="Diskusi Proyek" class="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black hover:bg-indigo-200 shadow-sm transition-all uppercase tracking-widest flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" /></svg>
                        </button>
                        <button @click="openProject(p.id)" class="bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2 rounded-xl text-xs font-black hover:bg-slate-200 transition-all shadow-sm uppercase tracking-widest">DETAIL</button>
                      </div>
                    </td>
                  </tr>
                </template>
                <template x-if="filteredPublishedProjects().length === 0">
                  <tr>
                    <td colspan="5" class="text-center py-16 text-slate-400 italic font-bold">
                      <div class="text-lg mb-3 opacity-30">📭</div>
                      <div class="text-xs uppercase tracking-widest">Belum ada proyek yang dipublikasikan.</div>
                    </td>
                  </tr>
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

          <template x-if="activeProject && ['REVIEW_PAKAR', 'REVISI_PAKAR'].includes(workflowStatus(activeProject))">
            <div class="bg-white p-5 border-2 border-slate-100 rounded-2xl shadow-xl">
              <h4 class="font-black text-primary uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <span class="h-3 w-3 bg-accent rounded-full animate-pulse"></span>
                Lembar Evaluasi Pakar
              </h4>
              <textarea x-model="feedback" class="w-full border-2 border-slate-100 rounded-xl p-4 h-40 focus:border-primary outline-none font-medium transition-all mb-6 shadow-inner" placeholder="Tuliskan catatan teknis atau instruksi revisi..." rows="3"></textarea>
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="submitReview('REVISI')" class="flex-1 bg-white border-4 border-accent text-accent p-2 text-sm.5 text-sm rounded-lg rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg">MINTA REVISI</button>
                <button @click="submitReview('ACCEPT')" class="flex-1 bg-primary text-highlight p-2 text-sm.5 text-sm rounded-lg rounded-xl font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg">VERIFIKASI &amp; SETUJUI</button>
              </div>
            </div>
          </template>

          <template x-if="activeProject && !['REVIEW_PAKAR','DRAFT','REVISI_PAKAR'].includes(workflowStatus(activeProject))">
            <div class="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 text-center">
              <p class="text-slate-500 font-bold text-sm">Proyek ini berstatus <span class="font-black text-primary uppercase" x-text="statusLabel(activeProject)"></span> dan tidak memerlukan tindakan.</p>
            </div>
          </template>
        </div><!-- /Detail View -->

      </div><!-- /p-5 -->

      <!-- Preview Modal -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm">
        <div class="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-primary">
          <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-red-500 z-10 text-base font-black">&times;</button>
          <div class="bg-primary p-6 text-white font-black text-center uppercase tracking-widest border-b-4 border-highlight">
            <span x-text="activeProject?.type === 'MATERI' ? 'PREVIEW MATERI: ' : 'SIMULASI GAME: '"></span> <span x-text="activeProject?.title" class="text-highlight"></span>
          </div>
          <div x-show="activeProject?.type === 'GAME' && previewLevelCount() > 1" class="flex flex-wrap items-center justify-center gap-2 bg-slate-100 px-4 py-3 border-b border-slate-200">
            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Level</span>
            <template x-for="l in previewLevelCount()" :key="l">
              <button type="button" @click="selectPreviewLevel(l)" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="previewLevel === l ? 'bg-primary text-highlight' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'">
                <span x-text="'Level ' + l"></span>
                <span x-show="isNewPreviewLevel(l)" class="ml-1 bg-accent text-white px-1.5 py-0.5 rounded text-[9px]">Baru</span>
              </button>
            </template>
          </div>
          <div class="p-5 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center">
            
            <!-- MATERI PREVIEW -->
            <template x-if="activeProject?.type === 'MATERI'">
              <div class="w-full flex flex-col items-center gap-8">
                <template x-if="activeProject?.materiType === 'MANUAL'">
                  <div class="w-full max-w-4xl flex flex-col gap-6">
                    <div class="flex justify-end w-full">
                       <button @click="speakAllSections()" class="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2">
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
                             class="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-6 md:p-16 bg-gradient-to-br from-primary to-blue-900 text-white"
                             :class="idx > unlockedIdx ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-transform'">
                           
                           <!-- Locked Overlay -->
                           <div x-show="idx > unlockedIdx" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-highlight mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              <span class="bg-primary text-white p-2 text-sm rounded-full font-bold text-sm shadow-xl border border-highlight/30">Buka kartu sebelumnya terlebih dahulu</span>
                           </div>

                           <div class="relative z-10 text-center w-full flex flex-col items-center h-full justify-center">
                             <span class="inline-block bg-accent text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-md" x-text="'KARTU MATERI ' + (idx + 1)"></span>
                             <h2 class="text-lg md:text-lg font-black text-center tracking-tight leading-tight" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                             <button x-show="idx <= unlockedIdx" class="mt-8 flex items-center justify-center gap-2 text-highlight text-sm font-bold animate-bounce bg-white/10 p-2 text-sm.5 text-sm rounded-lg rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
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
                          <div class="bg-primary text-white p-2 text-sm.5 text-sm rounded-lg flex justify-between items-center min-h-[140px] border-b-4 border-highlight gap-4">
                            <div class="flex items-center gap-3 flex-1">
                              <button @click="flipped = false" class="shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors" title="Tutup Kartu">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                              </button>
                              <h2 class="text-base md:text-lg font-bold leading-tight" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                            </div>
                            <!-- Speaker Button -->
                            <button @click="speakSection(idx)" class="shrink-0 bg-accent hover:bg-accent-hover p-2 text-sm rounded-full transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-md">
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
                          <div class="p-6 md:p-6 flex-1 text-slate-700 leading-relaxed text-sm md:text-base font-medium max-w-2xl mx-auto" style="white-space: pre-wrap;" x-html="applyTooltips(section.content)"></div>
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
              <template x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                <div>
                  <div class="inline-block bg-primary text-highlight px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + previewQuestions.length"></div>
                  <template x-if="activeProject?.gameType === 'QUIZ'">
                    <div>
                      <h3 class="text-base md:text-lg font-bold text-primary mb-6 leading-relaxed" x-text="previewQuestions[currentQuestionIndex]?.question"></h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <template x-for="opt in ['A','B','C','D']">
                          <button @click="checkAnswerQuiz(opt)"
                            :class="{
                              'border-yellow-400 bg-yellow-50': selectedAnswer === opt && !showExplanation,
                              'border-green-500 bg-green-50': showExplanation && opt === previewQuestions[currentQuestionIndex]?.correctAnswer,
                              'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== previewQuestions[currentQuestionIndex]?.correctAnswer,
                              'border-slate-100 bg-white hover:border-yellow-300': !showExplanation && selectedAnswer !== opt
                            }"
                            class="border-4 p-4 rounded-xl text-primary font-bold transition-all text-left flex items-center gap-3 text-sm"
                            :disabled="showExplanation">
                            <span class="h-8 w-8 rounded-lg flex items-center justify-center font-bold bg-slate-100 shrink-0" x-text="opt"></span>
                            <span x-text="previewQuestions[currentQuestionIndex]?.['option' + opt]"></span>
                          </button>
                        </template>
                      </div>
                    </div>
                  </template>
                  <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                    <div>
                      <div class="text-base font-bold text-primary mb-8 leading-relaxed bg-white p-6 rounded-2xl shadow-inner border-2 border-slate-100" x-html="renderFTB(previewQuestions[currentQuestionIndex])"></div>
                      <button @click="checkAnswerFTB()" x-show="!showExplanation" class="bg-accent text-white p-2 text-sm text-sm rounded-lg rounded-xl font-black uppercase tracking-widest">PERIKSA JAWABAN</button>
                    </div>
                  </template>
                  <div x-show="showExplanation" class="mt-6 p-5 rounded-2xl border-2 border-dashed text-left" :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                    <p class="font-black text-sm uppercase" :class="isCorrect ? 'text-green-700' : 'text-red-700'" x-text="isCorrect ? 'Benar!' : 'Belum Tepat!'"></p>
                    <p class="text-sm text-slate-600 mt-1 italic" x-text="previewQuestions[currentQuestionIndex]?.explanation"></p>
                  </div>
                  <div class="flex gap-4 mt-6 justify-center">
                    <button @click="prevQuestion()" x-show="currentQuestionIndex > 0" class="bg-slate-100 text-slate-700 px-6 py-2 rounded-xl font-black">← Prev</button>
                    <button @click="nextQuestion()" x-show="showExplanation" class="bg-primary text-white px-6 py-2 rounded-xl font-black" x-text="currentQuestionIndex < previewQuestions.length - 1 ? 'Berikutnya →' : 'Selesai Review'"></button>
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
