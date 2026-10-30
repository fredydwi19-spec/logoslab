import { projects, questionBank } from "../../db/schema";
import { WordSearchEditor, WordSearchEditorScript } from "./WordSearchEditor";
import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { CrosswordEditor, CrosswordEditorScript } from "./CrosswordEditor";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";
import { AdventureEditor, AdventureEditorScript } from "./AdventureEditor";
import { ProjectHeader } from "./ProjectHeader";

export const PembuatGameDashboard = ({ myProjects, publishedProjects, allUsers, analytics }: { myProjects: any[], publishedProjects: any[], allUsers: any[], analytics?: any }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');
  const publishedProjectsJson = JSON.stringify(publishedProjects).replace(/</g, '\\u003c');
  const allUsersJson = JSON.stringify(allUsers).replace(/</g, '\\u003c');
  const analyticsJson = analytics ? JSON.stringify(analytics).replace(/</g, '\\u003c') : 'null';

  return `
    <script id="pembuatProjectsData" type="application/json">${myProjectsJson}</script>
    <script id="pembuatPublishedData" type="application/json">${publishedProjectsJson}</script>
    <script id="pembuatUsersData" type="application/json">${allUsersJson}</script>
    <script id="pembuatAnalyticsData" type="application/json">${analyticsJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pembuatDashboard', () => ({
            analytics: JSON.parse(document.getElementById('pembuatAnalyticsData').textContent),
            activeProject: null,
            questions: [],
            gameData: null,
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
            saveTimeout: null,
            stagingQuestions: [],
            activeLevel: 1,
            levelCount: 1,
            menuTab: new URLSearchParams(window.location.search).get('tab') || 'dashboard',
            viewMode: new URLSearchParams(window.location.search).get('view') === 'all' ? 'all' : 'active',
            myProjects: JSON.parse(document.getElementById('pembuatProjectsData').textContent || '[]'),
            publishedProjects: JSON.parse(document.getElementById('pembuatPublishedData').textContent || '[]'),
            allUsers: JSON.parse(document.getElementById('pembuatUsersData').textContent || '[]'),
            activeTab: 'DRAFT',
            searchActive: '',
            searchPublished: '',
            openGenerateModal: false,
            generateData: { totalSoal: 10, jumlahMudah: 5, jumlahSedang: 3, jumlahSulit: 2 },
            isGenerating: false,

            async submitGenerate() {
               const { totalSoal, jumlahMudah, jumlahSedang, jumlahSulit } = this.generateData;
               if (Number(totalSoal) !== Number(jumlahMudah) + Number(jumlahSedang) + Number(jumlahSulit)) {
                  alert("Jumlah total soal harus sama dengan (Mudah + Sedang + Sulit)");
                  return;
               }
               
               this.isGenerating = true;
               try {
                  const res = await fetch('/api/bank-soal/auto-generate', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                        projectId: this.activeProject.id,
                        gameType: this.activeProject.gameType,
                        totalSoal: Number(totalSoal),
                        jumlahMudah: Number(jumlahMudah),
                        jumlahSedang: Number(jumlahSedang),
                        jumlahSulit: Number(jumlahSulit),
                        level: this.activeLevel
                     })
                  });
                  const json = await res.json();
                  if (json.success) {
                     alert(json.message);
                     this.openGenerateModal = false;
                     this.openProject(this.activeProject.id);
                  } else {
                     alert(json.error || "Gagal melakukan generate soal");
                  }
               } catch(err) {
                  alert("Terjadi kesalahan sistem saat generate soal");
               } finally {
                  this.isGenerating = false;
               }
            },

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

            applyDynamicFilter(list) {
              if (!list || !Array.isArray(list)) return [];
              if (!this.appliedFilter.key) {
                // If no filter is applied, we can still use searchActive if we want
                if (this.searchActive) {
                  return list.filter(p => p.title.toLowerCase().includes(this.searchActive.toLowerCase()));
                }
                return list;
              }
              return list.filter(p => {
                const { key, value, start, end } = this.appliedFilter;
                
                // Still allow searchActive
                if (this.searchActive && !p.title.toLowerCase().includes(this.searchActive.toLowerCase())) {
                  return false;
                }
                
                if (key === 'title_game') {
                  if (!value) return false;
                  return p.title?.toLowerCase().includes(value.toLowerCase());
                }
                if (key === 'type_game') {
                  if (!value) return false;
                  return p.gameType === value;
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

            filteredActiveProjects() {
              return this.applyDynamicFilter(this.myProjects);
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
                  const sameProject = this.activeProject?.id === json.data.id;
                  this.activeProject = json.data;
                  this.questions = json.data.questions || [];
                  if (!sameProject) { this.levelCount = 1; this.activeLevel = 1; }
                  this.syncLevels();
                  // Sedang menambah level: langsung buka level pertama yang boleh diisi
                  if (!this.isReadOnly() && this.isLevelLocked(this.activeLevel)) {
                    const firstNewLevel = (this.activeProject.publishedLevelCount || 0) + 1;
                    this.levelCount = Math.max(this.levelCount, firstNewLevel);
                    this.activeLevel = firstNewLevel;
                  }
                  this.gameData = null;
                  this.showAuditLog = false;
                  if (this.activeProject.gameType === 'WORD_SEARCH') {
                    const wsRes = await fetch('/api/word-search/' + id);
                    const wsJson = await wsRes.json();
                    if (wsJson.success) this.gameData = wsJson.data;
                    this.gameLevelCount = wsJson.levelCount || 1;
                  } else if (this.activeProject.gameType === 'CROSSWORD') {
                    const cwRes = await fetch('/api/crossword/' + id);
                    const cwJson = await cwRes.json();
                    if (cwJson.success) this.gameData = cwJson.data;
                    this.gameLevelCount = cwJson.levelCount || 1;
                  }
                  this.checkLocalRecovery(id);
                  this.updateSaveIndicator('SYNCHRONIZED', 'bg-green-100 text-green-800');
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
              this.questions = [];
              this.stagingQuestions = [];
              this.showAuditLog = false;
              this.showPreview = false;
            },

            isReadOnly() {
              if (!this.activeProject) return true;
              return !["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(this.workflowStatus(this.activeProject));
            },

            // Level yang sudah terbit tidak bisa diubah (terbit bertahap)
            isLevelLocked(level) {
              return this.activeProject?.status === 'PUBLISHED' && level <= (this.activeProject.publishedLevelCount || 0);
            },

            isQuestionLocked(q) {
              return this.isReadOnly() || this.isLevelLocked(this.levelOf(q));
            },

            async startNewLevel(p) {
              if (!confirm('Tambah level baru untuk game "' + p.title + '"? Level yang sudah terbit tetap bisa dimainkan dan dikunci; level baru harus direview Pakar dan Ketua sebelum terbit.')) return;
              const res = await fetch('/api/projects/' + p.id + '/new-level', { method: 'POST' });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) { alert(json.error || 'Gagal memulai level baru.'); return; }
              p.levelReviewStatus = 'DRAFT';
              await this.openProject(p.id);
            },

            updateSaveIndicator(text, classes) {
              const el = document.getElementById('saveStatus');
              if (!el) return;
              el.innerText = text;
              el.className = "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500 " + classes;
            },

            // --- Level soal (Quiz & Fill the Blank) ---
            levelOf(q) {
              return Number(q.level) || 1;
            },

            syncLevels() {
              const highest = Math.max(1, ...this.questions.map(q => this.levelOf(q)));
              this.levelCount = Math.max(this.levelCount, highest);
              if (this.activeLevel > this.levelCount) this.activeLevel = 1;
            },

            levelQuestionCount(level) {
              return this.questions.filter(q => this.levelOf(q) === level).length;
            },

            questionNumberInLevel(idx) {
              const level = this.levelOf(this.questions[idx]);
              return this.questions.slice(0, idx + 1).filter(q => this.levelOf(q) === level).length;
            },

            addLevel() {
              this.levelCount++;
              this.activeLevel = this.levelCount;
            },

            removeLastLevel() {
              if (this.levelCount > 1 && this.levelQuestionCount(this.levelCount) === 0) {
                this.levelCount--;
                this.activeLevel = this.levelCount;
              }
            },

            addQuestion() {
              if (this.activeProject?.gameType === 'QUIZ') {
                this.questions.push({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', difficulty: 'MUDAH', explanation: '', level: this.activeLevel });
              } else if (this.activeProject?.gameType === 'FILL_THE_BLANK') {
                this.questions.push({ fullText: '', answers: [], difficulty: 'MUDAH', level: this.activeLevel });
              }
              this.debouncedSave();
            },

            removeQuestion(idx) {
              if (confirm('Hapus soal ini?')) {
                this.questions.splice(idx, 1);
                this.debouncedSave();
              }
            },

            makeBlank(idx) {
              const textarea = document.getElementById('ftb-text-' + idx);
              if (!textarea) return;
              const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
              if (!selectedText) { alert("Silakan sorot kata atau frasa terlebih dahulu."); return; }
              if (!this.questions[idx].answers) this.questions[idx].answers = [];
              this.questions[idx].answers.push({ word: selectedText, explanation: '' });
              this.debouncedSave();
            },

            debouncedSave() {
              if (this.isReadOnly()) return;
              const localKey = 'project_draft_' + this.activeProject.id;
              localStorage.setItem(localKey, JSON.stringify({ timestamp: Date.now(), questions: this.questions }));
              this.updateSaveIndicator('LOCAL SAVED', 'bg-orange-100 text-orange-800 animate-pulse');
              clearTimeout(this.saveTimeout);
              this.saveTimeout = setTimeout(async () => {
                this.updateSaveIndicator('UPLOADING...', 'bg-blue-600 text-white animate-bounce');
                const res = await fetch('/api/projects/' + this.activeProject.id + '/questions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(this.questions)
                });
                if (res.ok) {
                  this.updateSaveIndicator('CLOUD SYNCED', 'bg-green-600 text-white');
                  localStorage.removeItem(localKey);
                } else {
                  this.updateSaveIndicator('OFFLINE / ERROR', 'bg-red-600 text-white');
                }
              }, 3000);
            },

            checkLocalRecovery(id) {
              const localData = localStorage.getItem('project_draft_' + id);
              if (localData) {
                const parsed = JSON.parse(localData);
                if (confirm('Ditemukan draf pemulihan lokal (' + new Date(parsed.timestamp).toLocaleTimeString() + '). Ingin memulihkan?')) {
                  this.questions = parsed.questions;
                  this.syncLevels();
                  this.debouncedSave();
                } else {
                  localStorage.removeItem('project_draft_' + id);
                }
              }
            },

            downloadTemplate() {
              let header = '', dummy = '';
              if (this.activeProject.gameType === 'QUIZ') {
                header = "question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation,level\\n";
                dummy = "Siapa Presiden pertama RI?,Soekarno,Hatta,Soedirman,Habibie,A,MUDAH,Soekarno adalah proklamator,1\\n";
              } else {
                header = "fullText,word1,explanation1,word2,explanation2,level\\n";
                dummy = "Kalimat dengan [kata] kunci.,kata,Penjelasan kata tersebut,,,1\\n";
              }
              const blob = new Blob([header + dummy], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = "template_soal_" + this.activeProject.gameType.toLowerCase() + ".csv";
              a.click();
            },

            importCSV(e) {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const text = event.target.result;
                const rows = text.split('\\n').slice(1);
                const imported = [];
                for (let row of rows) {
                  if (!row.trim()) continue;
                  const cols = row.split(',');
                  // Kolom level boleh kosong: soal masuk ke level yang sedang dibuka
                  const levelCol = parseInt(this.activeProject.gameType === 'QUIZ' ? cols[8] : cols[5]);
                  const level = levelCol >= 1 ? levelCol : this.activeLevel;
                  if (this.activeProject.gameType === 'QUIZ') {
                    if (cols.length < 6) continue;
                    imported.push({ question: cols[0], optionA: cols[1], optionB: cols[2], optionC: cols[3], optionD: cols[4], correctAnswer: (cols[5] || 'A').trim().toUpperCase(), difficulty: (cols[6] || 'MUDAH').trim().toUpperCase(), explanation: cols[7] || '', level });
                  } else {
                    const answers = [];
                    if (cols[1] && cols[2]) answers.push({ word: cols[1], explanation: cols[2] });
                    if (cols[3] && cols[4]) answers.push({ word: cols[3], explanation: cols[4] });
                    imported.push({ fullText: cols[0], answers, difficulty: 'MUDAH', level });
                  }
                }
                this.stagingQuestions = imported;
                e.target.value = '';
              };
              reader.readAsText(file);
            },

            commitStaging() {
              this.questions = [...this.questions, ...this.stagingQuestions];
              this.stagingQuestions = [];
              this.syncLevels();
              this.debouncedSave();
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
                text = text.replace(regex, '<input type="text" class="ftb-input border-b-2 border-blue-800 outline-none text-center px-2 text-orange-600 bg-slate-50 rounded-t w-24 mx-1" placeholder="..." onchange="window.updateFTB(' + i + ', this.value)">');
              });
              window.updateFTB = (idx, val) => { this.userFTBAnswers[idx] = val; };
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

            async submitForReview() {
              if (this.activeProject.gameType === 'WORD_SEARCH') {
                if (!this.gameData || !this.gameData.words || this.gameData.words.length === 0) { alert("Minimal harus ada 1 kata di Word Search sebelum dikirim."); return; }
              } else if (this.activeProject.gameType === 'CROSSWORD') {
                if (!this.gameData || !this.gameData.clues || this.gameData.clues.length === 0) { alert("Minimal harus ada 1 clue di Crossword sebelum dikirim."); return; }
              } else {
                for (let level = 1; level <= this.levelCount; level++) {
                  if (this.levelQuestionCount(level) === 0) {
                    this.activeLevel = level;
                    alert('Level ' + level + ' belum berisi soal. Isi soalnya atau hapus level tersebut.');
                    return;
                  }
                }
              }
              const target = this.workflowStatus(this.activeProject) === 'REVISI_KETUA' ? 'Ketua Tim' : 'Pakar';
              if (!confirm('Kirim proyek ke ' + target + ' untuk di-review?')) return;
              const res = await fetch('/api/projects/' + this.activeProject.id + '/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statusGiven: 'SUBMIT', feedback: 'Sent for review' })
              });
              if (res.ok) window.location.reload();
              else {
                const err = await res.json().catch(() => ({}));
                alert(err.error || "Gagal mengirim untuk review");
              }
            }
          }));
      });
    </script>

    <div class="bg-white p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" x-data="pembuatDashboard()">
      <div class="bg-primary p-6 border-b-4 border-highlight flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-lg md:text-xl font-bold text-white uppercase tracking-widest leading-tight" x-text="activeProject ? 'Workspace Produksi Game' : (menuTab === 'dashboard' ? 'Dashboard Analitik' : (viewMode === 'all' ? 'Semua Proyek Saya' : 'Manajemen Proyek'))"></h2>
        </div>
        <div class="flex items-center gap-4">
           <span x-show="activeProject" id="saveStatus" class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500">CLOUD SYNC ACTIVE</span>
           <div class="flex gap-2" x-show="!activeProject && menuTab === 'projects'">
           </div>
        </div>
      </div>
      
      <div class="p-8">

        <!-- ANALYTICS WIDGETS -->
        <template x-if="menuTab === 'dashboard' && !activeProject && analytics">
          <div class="space-y-6 mb-8">
            <!-- SECTION 1: PUBLISHED GAME METRICS (milik saya & seluruh platform) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Game Saya Dipublish</p>
                  <h3 class="text-4xl font-black text-highlight" x-text="analytics.globalStats.myPublishedGames"></h3>
                </div>
                <div class="text-5xl opacity-80"><i class="bi bi-controller"></i></div>
              </div>
              <div class="bg-gradient-to-r from-accent to-orange-500 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-orange-200 mb-1">Total Game Dipublish di Platform</p>
                  <h3 class="text-4xl font-black" x-text="analytics.globalStats.totalPublishedGames"></h3>
                </div>
                <div class="text-5xl opacity-80"><i class="bi bi-globe"></i></div>
              </div>
            </div>

            <!-- SECTION 2: KEY PERFORMANCE INDEX (KPI Creator) -->
            <div class="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-6">
                <span class="h-6 w-1.5 bg-primary rounded-full"></span>
                <h3 class="text-lg font-bold text-primary uppercase tracking-widest">KPI Creator</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Game Dikerjakan</p>
                  <p class="text-2xl font-black text-primary" x-text="analytics.creatorKpi.totalAssignedGames"></p>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game Sedang Dikerjakan</p>
                  <p class="text-2xl font-black text-accent" x-text="analytics.creatorKpi.activeGamesCount"></p>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Waktu Penyelesaian</p>
                  <p class="text-sm font-black text-green-600 mt-2" x-text="analytics.creatorKpi.avgCompletionTimeFormatted"></p>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Revisi per Proyek</p>
                  <p class="text-2xl font-black text-purple-600" x-text="analytics.creatorKpi.avgRevisionCount"></p>
                </div>
              </div>
              <!-- Tabel Peringkat Kecepatan Pengerjaan -->
              <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" x-data="{ sortAsc: true }">
                <div class="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                  <h4 class="text-xs font-bold text-primary uppercase tracking-widest">Peringkat Kecepatan Pengerjaan Game</h4>
                  <button @click="sortAsc = !sortAsc; analytics.creatorKpi.speedRankedProjects.reverse()" class="text-[10px] bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <i class="bi" :class="sortAsc ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up'"></i>
                    <span x-text="sortAsc ? 'Tercepat -> Terlambat' : 'Terlambat -> Tercepat'"></span>
                  </button>
                </div>
                <div class="max-h-48 overflow-y-auto">
                  <template x-if="analytics.creatorKpi.speedRankedProjects.length === 0">
                    <div class="p-6 text-center text-xs text-slate-400 font-bold italic">Belum ada proyek yang diselesaikan.</div>
                  </template>
                  <table class="w-full text-left border-collapse" x-show="analytics.creatorKpi.speedRankedProjects.length > 0">
                    <tbody>
                      <template x-for="(proj, idx) in analytics.creatorKpi.speedRankedProjects" :key="proj.id">
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

            <!-- SECTION 3: POPULARITY (game milik saya) -->
            <div>
              <!-- Top Played Games -->
              <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                  <span class="h-6 w-1.5 bg-highlight rounded-full"></span>
                  <h3 class="text-sm font-bold text-primary uppercase tracking-widest">Game Saya Paling Sering Dimainkan</h3>
                </div>
                <div class="space-y-3">
                  <template x-if="analytics.popularityStats.topPlayedGames.length === 0">
                    <div class="text-xs text-slate-400 italic">Belum ada data permainan.</div>
                  </template>
                  <template x-for="(game, i) in analytics.popularityStats.topPlayedGames" :key="i">
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
            </div>
          </div>
        </template>

        <!-- ======= VIEW: PROYEK DIKERJAKAN (ACTIVE) ======= -->
        <div x-show="menuTab === 'projects' && viewMode === 'active' && !activeProject">
          <!-- Header + Search -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <h2 class="text-base md:text-lg font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                <span class="h-5 w-1.5 bg-highlight rounded-full"></span>
                Proyek Yang Sedang Dikerjakan
              </h2>
              <p class="text-xs md:text-sm text-slate-400 font-medium mt-1">Proyek aktif yang ditugaskan kepada Anda</p>
            </div>
          </div>

          <!-- Tab Panel -->
          <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-200 mb-0">

            <!-- Dynamic Filter -->
            <div class="flex flex-wrap items-center gap-3 w-full p-4 bg-slate-50/80 border-b border-slate-200">
              <div class="flex flex-col gap-1 w-48 shrink-0">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kriteria Filter</label>
                <select x-model="filterKey" @change="filterValue=''; filterStart=''; filterEnd=''" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                  <option value="">-- Pilih Kriteria --</option>
                  <option value="title_game">Judul Game</option>
                  <option value="type_game">Jenis Game</option>
                  <option value="status">Status</option>
                  <option value="deadline">Tanggal Deadline</option>
                </select>
              </div>
              <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai Filter</label>
                
                <template x-if="filterKey === 'title_game'">
                  <input type="text" x-model="filterValue" placeholder="Ketik pencarian..." class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
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

                <template x-if="filterKey === 'status'">
                  <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-primary outline-none font-bold text-slate-700 bg-white shadow-sm">
                    <option value="">-- Pilih Status --</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="REVIEW_PAKAR">REVIEW PAKAR</option>
                    <option value="REVISI_PAKAR">REVISI PAKAR</option>
                    <option value="ACCEPTED_PAKAR">ACCEPTED PAKAR</option>
                    <option value="REVIEW_KETUA">REVIEW KETUA</option>
                    <option value="REVISI_KETUA">REVISI KETUA</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="UNPUBLISHED">UNPUBLISHED</option>
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

            <!-- Active Projects Table -->
            <p class="md:hidden px-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geser tabel ke samping <i class="bi bi-arrow-right"></i></p>
            <div class="overflow-x-auto bg-white">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr class="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                  <th class="px-6 py-4 font-black">Judul Game</th>
                  <th class="px-6 py-4 font-black">Jenis</th>
                  <th class="px-6 py-4 font-black">Deadline</th>
                  <th class="px-6 py-4 font-black">PIC Pakar</th>
                  <th class="px-6 py-4 font-black">Status</th>
                  <th class="px-6 py-4 font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-slate-600 divide-y divide-slate-50">
                <template x-for="p in filteredActiveProjects()" :key="p.id">
                  <tr class="hover:bg-blue-50/40 transition-all group">
                    <td class="px-6 py-5">
                      <div class="font-semibold text-slate-800 text-base md:text-lg leading-tight group-hover:text-primary transition-colors" x-text="p.title"></div>
                      <div class="text-[10px] text-slate-400 font-bold mt-0.5" x-text="'#G' + p.id"></div>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-black uppercase border border-slate-200" x-text="p.gameType || '-'"></span>
                    </td>
                    <td class="px-6 py-5">
                      <span :class="new Date(p.deadline) < new Date() ? 'text-red-600 font-black' : 'text-slate-700 font-bold'" x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-sm md:text-base font-medium text-slate-700" x-text="p.idPakar ? getUserName(p.idPakar) : 'Belum Ditentukan'"></span>
                    </td>
                    <td class="px-6 py-5">
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
                    <td class="px-6 py-5 align-middle">
                      <div class="flex items-center justify-end gap-2">
                        <button @click="$dispatch('open-chat-drawer', { projectId: p.id, contextType: 'GENERAL', contextTargetId: null, targetName: p.title, userRole: window.USER_ROLE })" title="Diskusi Proyek" class="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black hover:bg-indigo-200 shadow-sm transition-all uppercase tracking-widest flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" /></svg>
                        </button>
                        <button x-show="workflowStatus(p) === 'DRAFT' || workflowStatus(p) === 'UNPUBLISHED'" @click="openProject(p.id)" class="bg-primary text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-primary-dark transition-all shadow-md uppercase tracking-widest">KERJAKAN</button>
                        <button x-show="['REVISI_PAKAR', 'REVISI_KETUA'].includes(workflowStatus(p))" @click="openProject(p.id)" class="bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-md uppercase tracking-widest">PERBAIKI</button>
                        <button x-show="p.type === 'GAME' && p.status === 'PUBLISHED' && !p.levelReviewStatus" @click="startNewLevel(p)" class="bg-white text-accent border-2 border-accent px-4 py-2 rounded-xl text-xs font-black hover:bg-accent hover:text-white transition-all shadow-sm uppercase tracking-widest whitespace-nowrap">+ Tambah Level</button>
                        <button x-show="['REVIEW_PAKAR', 'REVIEW_KETUA', 'ACCEPTED_PAKAR', 'PUBLISHED'].includes(workflowStatus(p))" @click="openProject(p.id)" class="bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2 rounded-xl text-xs font-black hover:bg-slate-200 transition-all shadow-sm uppercase tracking-widest">DETAIL</button>
                      </div>
                    </td>
                  </tr>
                </template>
                <template x-if="filteredActiveProjects().length === 0">
                  <tr><td colspan="6" class="text-center py-16 text-slate-400 italic font-bold">
                    <div class="text-4xl mb-3 opacity-30">📭</div>
                    <div class="text-xs uppercase tracking-widest">Tidak ada proyek dalam kategori ini.</div>
                  </td></tr>
                </template>
              </tbody>
            </table>
            </div><!-- /overflow-x-auto -->
          </div><!-- /tab-panel -->
        </div><!-- /viewMode active -->

        <!-- ======= VIEW: SEMUA PROYEK SAYA (PUBLISHED) ======= -->
        <div x-show="menuTab === 'projects' && viewMode === 'all' && !activeProject">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 class="text-lg font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <span class="h-5 w-1.5 bg-green-500 rounded-full"></span>
                Proyek Telah Dipublikasikan
              </h2>
              <p class="text-xs text-slate-400 font-bold mt-1">Game yang telah selesai dikerjakan dan sudah live (Read-Only)</p>
            </div>
          </div>

          <!-- Search -->
          <div class="flex justify-end mb-6">
            <div class="relative w-full md:w-72">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" x-model="searchPublished" placeholder="Cari judul game..." class="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:border-green-400 outline-none shadow-inner">
            </div>
          </div>

          <!-- Published Projects Table -->
          <p class="md:hidden px-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geser tabel ke samping <i class="bi bi-arrow-right"></i></p>
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
                    <td class="px-6 py-5 align-middle">
                      <div class="flex items-center justify-end gap-2">
                        <button @click="$dispatch('open-chat-drawer', { projectId: p.id, contextType: 'GENERAL', contextTargetId: null, targetName: p.title, userRole: window.USER_ROLE })" title="Diskusi Proyek" class="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black hover:bg-indigo-200 shadow-sm transition-all uppercase tracking-widest flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" /></svg>
                        </button>
                        <button x-show="p.type === 'GAME' && !p.levelReviewStatus" @click="startNewLevel(p)" class="bg-white text-accent border-2 border-accent px-4 py-2 rounded-xl text-xs font-black hover:bg-accent hover:text-white transition-all shadow-sm uppercase tracking-widest whitespace-nowrap">+ Tambah Level</button>
                        <span x-show="p.levelReviewStatus" class="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-lg font-black uppercase whitespace-nowrap" x-text="statusLabel(p)"></span>
                        <button @click="openProject(p.id)" class="bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-md transform hover:scale-105 uppercase tracking-widest">LIHAT DETAIL</button>
                      </div>
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

        <!-- Editor View -->
        <div x-show="activeProject" style="display: none;" class="space-y-6">
          <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2">
            ← Kembali
          </button>

          ${ProjectHeader()}

          <template x-if="activeProject?.gameType === 'WORD_SEARCH'">
             <div class="mb-10">
                <div class="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                   ${WordSearchEditor({ projectVar: 'activeProject' })}
                </div>
             </div>
          </template>
          
          <template x-if="activeProject?.gameType === 'CROSSWORD'">
              <div class="mb-10">
                 <div class="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                    ${CrosswordEditor({ projectVar: 'activeProject' })}
                 </div>
              </div>
          </template>

          <template x-if="activeProject?.gameType === 'ADVENTURE'">
              <div class="mb-10">
                 <div class="bg-white p-4 md:p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                    ${AdventureEditor({ projectVar: 'activeProject' })}
                 </div>
              </div>
          </template>

          <div x-show="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD' && activeProject?.gameType !== 'ADVENTURE'" class="space-y-6 mb-10">
            <div class="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 gap-4">
              <div class="flex items-center gap-3">
                <div class="h-8 w-1.5 bg-primary rounded-full"></div>
                <div>
                  <h3 class="text-sm font-black text-primary uppercase tracking-widest">Editor Konten</h3>
                  <p class="text-[10px] text-slate-400 font-bold">Kelola butir soal interaktif</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 justify-center">
                 <button @click="downloadTemplate()" class="text-[10px] font-black uppercase bg-white border-2 border-slate-200 px-4 py-2 rounded-lg hover:border-primary transition-all flex items-center gap-2">
                   CSV Template
                 </button>
                 <label class="text-[10px] font-black uppercase bg-highlight text-primary px-4 py-2 rounded-lg cursor-pointer hover:bg-[#FFD54F] transition-all flex items-center gap-2 shadow-sm">
                   Import CSV
                   <input type="file" accept=".csv" @change="importCSV" class="hidden">
                 </label>
                 <button x-show="activeProject?.gameType === 'QUIZ' || activeProject?.gameType === 'FILL_THE_BLANK'" @click="openGenerateModal = true" class="text-[10px] font-black uppercase bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover transition-all flex items-center gap-2 shadow-md">
                   Generate Soal
                 </button>
                 <button @click="previewGame()" class="text-[10px] font-black uppercase bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all flex items-center gap-2 shadow-md">
                   Simulasi Game
                 </button>
              </div>
            </div>
          </div>

          <!-- Staging Validation UI -->
          <template x-if="stagingQuestions.length > 0">
            <div class="bg-blue-50 border-4 border-blue-200 p-8 rounded-3xl space-y-6 mb-10 shadow-xl">
               <div class="flex justify-between items-center">
                  <h4 class="text-lg font-black text-blue-900 uppercase">Validasi Import Soal (<span x-text="stagingQuestions.length"></span>)</h4>
                  <div class="flex gap-2">
                     <button @click="stagingQuestions = []" class="bg-white text-slate-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Batal</button>
                     <button @click="commitStaging()" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg transform hover:scale-105 transition-all">Konfirmasi Tambah</button>
                  </div>
               </div>
               <div class="max-h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  <template x-for="(sq, sidx) in stagingQuestions" :key="sidx">
                     <div class="bg-white p-4 rounded-xl shadow-sm text-xs border border-blue-100">
                        <p class="font-bold text-blue-900 mb-2" x-text="sq.question || sq.fullText"></p>
                        <div class="flex gap-4 opacity-60 font-black uppercase text-[8px]">
                           <span x-text="'TYPE: ' + (sq.question ? 'QUIZ' : 'FTB')"></span>
                           <span x-text="'DIFFICULTY: ' + (sq.difficulty || 'MUDAH')"></span>
                           <span x-text="'LEVEL: ' + (sq.level || activeLevel)"></span>
                        </div>
                     </div>
                  </template>
               </div>
            </div>
          </template>

          <template x-if="isReadOnly()">
            <div class="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 font-bold border border-red-200">
               Proyek dalam status <span x-text="statusLabel(activeProject)"></span> dan bersifat Read-Only.
            </div>
          </template>

          <!-- Generate Modal -->
          <div x-show="openGenerateModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style="display: none;" x-transition>
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 class="text-lg font-bold text-primary">Auto-Generate Soal dari Bank</h3>
                <button @click="openGenerateModal = false" class="text-slate-400 hover:text-red-500">&times;</button>
              </div>
              <div class="p-5 space-y-4">
                <p class="text-xs text-slate-500 font-bold mb-4">Pastikan Total Soal = (Mudah + Sedang + Sulit). Auto-generate akan menarik soal secara acak dari Bank Soal global.</p>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1">Total Soal</label>
                  <input type="number" min="1" x-model.number="generateData.totalSoal" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-highlight outline-none">
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-xs font-semibold text-green-700 mb-1">Mudah</label>
                    <input type="number" min="0" x-model.number="generateData.jumlahMudah" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-highlight outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-yellow-700 mb-1">Sedang</label>
                    <input type="number" min="0" x-model.number="generateData.jumlahSedang" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-highlight outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-red-700 mb-1">Sulit</label>
                    <input type="number" min="0" x-model.number="generateData.jumlahSulit" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-highlight outline-none">
                  </div>
                </div>
                <div class="p-3 mt-4 bg-slate-50 rounded border border-slate-200 text-xs font-bold text-center">
                  Total Terhitung: <span x-text="Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit)" :class="{'text-red-600': Number(generateData.totalSoal) !== (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit)), 'text-green-600': Number(generateData.totalSoal) === (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit))}"></span>
                </div>
              </div>
              <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button @click="openGenerateModal = false" class="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
                <button @click="submitGenerate()" :disabled="isGenerating || Number(generateData.totalSoal) !== (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit))" class="px-4 py-2 text-white bg-primary rounded-lg hover:bg-blue-900 disabled:opacity-50 font-semibold text-sm">
                  <span x-text="isGenerating ? 'Memproses...' : 'Generate'"></span>
                </button>
              </div>
            </div>
          </div>

          <div x-show="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD' && activeProject?.gameType !== 'ADVENTURE'" class="space-y-6">
            <!-- Tab Level -->
            <div class="flex flex-wrap items-center gap-2 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
              <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Level</span>
              <template x-for="level in levelCount" :key="level">
                <button type="button" @click="activeLevel = level" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="activeLevel === level ? 'bg-primary text-highlight shadow-md' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'">
                  <span x-text="'Level ' + level"></span>
                  <span class="ml-1 opacity-70" x-text="'(' + levelQuestionCount(level) + ')'"></span>
                  <i class="bi bi-lock-fill ml-1" x-show="isLevelLocked(level)" title="Sudah terbit"></i>
                </button>
              </template>
              <button type="button" x-show="!isReadOnly()" @click="addLevel()" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border-2 border-dashed border-accent text-accent hover:bg-accent hover:text-white transition-all">+ Tambah Level</button>
              <button type="button" x-show="!isReadOnly() && levelCount > 1 && activeLevel === levelCount && levelQuestionCount(levelCount) === 0" @click="removeLastLevel()" class="px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50">Hapus Level Kosong</button>
              <span class="sm:ml-auto text-[10px] text-slate-400 font-bold" x-text="'Nilai minimal lulus tiap level: ' + (activeProject?.passPercentage ?? 70) + '%'"></span>
            </div>
            <div x-show="isLevelLocked(activeLevel)" class="flex items-center gap-3 bg-green-50 border-2 border-green-200 text-green-800 p-4 rounded-2xl text-xs font-bold">
              <i class="bi bi-lock-fill text-lg"></i>
              <span x-text="'Level ' + activeLevel + ' sudah terbit dan sedang dimainkan, jadi tidak bisa diubah.' + (isReadOnly() ? '' : ' Isi soal di level baru.')"></span>
            </div>
            <div x-show="levelQuestionCount(activeLevel) === 0" class="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">
              <span x-text="'Level ' + activeLevel + ' belum berisi soal.'"></span>
            </div>

            <template x-for="(q, idx) in questions" :key="idx">
              <div x-show="levelOf(q) === activeLevel" class="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 shadow-xl relative group transition-all hover:border-highlight">
                <div class="absolute -left-4 top-10 bg-primary text-white h-10 w-10 rounded-xl flex items-center justify-center font-black shadow-lg" x-text="questionNumberInLevel(idx)"></div>
                <button x-show="!isQuestionLocked(q)" @click="removeQuestion(idx)" class="absolute -right-3 -top-3 bg-red-500 text-white h-10 w-10 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10">&times;</button>
                
                <!-- Quiz Editor -->
                <template x-if="activeProject?.gameType === 'QUIZ'">
                  <div class="space-y-8 pl-4">
                    <div>
                      <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Butir Pertanyaan</label>
                      <textarea x-model="q.question" @input="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full border-2 border-slate-100 rounded-2xl p-6 h-32 focus:border-primary outline-none font-bold text-xl text-primary bg-white transition-all shadow-inner" placeholder="Tuliskan pertanyaan di sini..."></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <template x-for="opt in ['A', 'B', 'C', 'D']">
                        <div class="relative">
                          <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" x-text="'Pilihan ' + opt"></label>
                          <input type="text" x-model="q['option' + opt]" @input="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-primary outline-none font-bold text-slate-700 bg-white transition-all pl-12 shadow-sm" :placeholder="'Opsi ' + opt">
                          <div class="absolute left-4 top-10 font-black text-primary" x-text="opt + '.'"></div>
                        </div>
                      </template>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                      <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jawaban Benar</label>
                        <select x-model="q.correctAnswer" @change="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-primary outline-none font-black bg-white cursor-pointer text-primary shadow-sm">
                          <option value="A">Opsi A</option><option value="B">Opsi B</option><option value="C">Opsi C</option><option value="D">Opsi D</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kesulitan</label>
                        <select x-model="q.difficulty" @change="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-primary outline-none font-black bg-white cursor-pointer text-primary shadow-sm">
                          <option value="MUDAH">MUDAH (10 Poin)</option>
                          <option value="SEDANG">SEDANG (20 Poin)</option>
                          <option value="SULIT">SULIT (50 Poin)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Penjelasan Edukatif</label>
                      <textarea x-model="q.explanation" @input="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full border-2 border-slate-100 rounded-xl p-4 h-24 focus:border-primary outline-none font-medium text-slate-600 italic bg-white transition-all shadow-sm" placeholder="Berikan alasan mengapa jawaban tersebut benar..."></textarea>
                    </div>
                  </div>
                </template>

                <!-- FTB Editor -->
                <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                  <div class="space-y-6 pl-4">
                     <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex justify-between">
                           Teks Lengkap (Blok teks lalu klik 'Jadikan Blank')
                           <button x-show="!isQuestionLocked(q)" @click="makeBlank(idx)" class="bg-highlight text-primary px-4 py-1 rounded-full hover:bg-yellow-400 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase">
                             Jadikan Blank
                           </button>
                        </label>
                        <textarea :id="'ftb-text-' + idx" x-model="q.fullText" @input="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full border-2 border-slate-100 rounded-2xl p-6 h-40 focus:border-primary outline-none font-bold text-xl text-primary bg-white transition-all shadow-inner" placeholder="Tuliskan kalimat di sini..."></textarea>
                     </div>
                     <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Kata Rumpang</label>
                        <template x-for="(ans, aidx) in q.answers" :key="aidx">
                           <div class="bg-slate-50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start border border-slate-100">
                              <div class="flex-none">
                                 <div class="text-[8px] font-black text-blue-400 uppercase mb-1">KATA</div>
                                 <div class="bg-primary text-white px-3 py-1 rounded font-black text-sm" x-text="ans.word"></div>
                              </div>
                              <div class="flex-1 w-full">
                                 <div class="text-[8px] font-black text-blue-400 uppercase mb-1">PENJELASAN</div>
                                 <input type="text" x-model="ans.explanation" @input="debouncedSave()" :disabled="isQuestionLocked(q)" class="w-full bg-white border-2 border-slate-100 rounded-lg p-2 text-xs font-bold focus:border-primary outline-none transition-all" placeholder="Mengapa kata ini penting?">
                              </div>
                              <button x-show="!isQuestionLocked(q)" @click="q.answers.splice(aidx, 1); debouncedSave()" class="text-red-400 hover:text-red-600 pt-5 font-black">&times;</button>
                           </div>
                        </template>
                        <template x-if="!q.answers?.length">
                           <div class="text-center py-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-100 text-slate-400 text-xs font-bold uppercase italic opacity-50">Belum ada kata rumpang.</div>
                        </template>
                     </div>
                  </div>
                </template>
              </div>
            </template>

            <button x-show="!isReadOnly() && !isLevelLocked(activeLevel)" @click="addQuestion()" class="w-full border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-slate-400 font-black uppercase tracking-[0.3em] hover:border-primary hover:text-primary transition-all flex flex-col items-center gap-4 group">
               <div class="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-highlight transition-all transform group-hover:rotate-90">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
               </div>
               <span x-text="'Tambah butir soal baru ke Level ' + activeLevel"></span>
            </button>

            <div x-show="!isReadOnly()" class="pt-10 flex flex-col items-center gap-3">
               <button @click="submitForReview()" class="bg-accent text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-accent-hover transition-all transform hover:scale-110 active:scale-95 flex items-center gap-4">
                  <span x-text="workflowStatus(activeProject) === 'REVISI_KETUA' ? 'KIRIM KE KETUA TIM' : 'KIRIM KE PAKAR'"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </button>
               <p class="text-xs text-slate-400 font-bold"
                  x-text="workflowStatus(activeProject) === 'REVISI_KETUA' ? '→ Proyek akan dikirim ke Ketua Tim untuk review akhir' : '→ Proyek akan dikirim ke Pakar yang ditugaskan untuk review konten'">
               </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Game Modal -->
      <div x-show="showPreview" 
           @open-preview.window="gameData = $event.detail; showPreview = true;"
           style="display:none;" 
           class="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] backdrop-blur-md">
         <div class="bg-white rounded-[3rem] w-full shadow-2xl overflow-hidden flex flex-col relative border-4 border-white/20 transition-all duration-500"
              :class="activeProject?.gameType === 'WORD_SEARCH' || activeProject?.gameType === 'CROSSWORD' ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl h-[85vh]'">
            <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-accent z-10 text-3xl transition-colors font-black">&times;</button>
            <div class="bg-primary p-6 text-white font-black text-center uppercase tracking-[0.2em] border-b-8 border-highlight flex justify-between px-10">
              <div class="flex gap-2">
                <span class="text-white/40">SIMULASI:</span>
                <span x-text="activeProject?.title" class="text-highlight"></span>
              </div>
              <div class="flex gap-4 text-[10px]">
                <span class="bg-white/10 px-3 py-1 rounded-full text-white" x-text="activeProject?.gameType"></span>
              </div>
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
            <div class="p-0 flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
               <template x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                 <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-20">
                    <button @click="prevQuestion()" x-show="currentQuestionIndex > 0" class="pointer-events-auto bg-white/80 hover:bg-white text-primary p-4 rounded-full shadow-xl transition-all hover:scale-110 border border-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button @click="nextQuestion()" x-show="currentQuestionIndex < previewQuestions.length - 1" class="pointer-events-auto bg-white/80 hover:bg-white text-primary p-4 rounded-full shadow-xl transition-all hover:scale-110 border border-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
                    </button>
                 </div>
               </template>

               <div class="text-center w-full flex-1 flex flex-col justify-center">
                  <template x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                    <div class="inline-block mx-auto bg-primary text-highlight px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest mt-10" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + previewQuestions.length"></div>
                  </template>
                  
                  <!-- Quiz Content -->
                  <template x-if="activeProject?.gameType === 'QUIZ'">
                    <div>
                      <h3 class="text-base md:text-lg font-bold text-primary mb-6 leading-relaxed" x-text="previewQuestions[currentQuestionIndex]?.question"></h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <template x-for="opt in ['A', 'B', 'C', 'D']">
                           <button @click="checkAnswerQuiz(opt)" 
                              :class="{
                                'border-highlight bg-yellow-50': selectedAnswer === opt,
                                'border-green-500 bg-green-50': showExplanation && opt === previewQuestions[currentQuestionIndex]?.correctAnswer,
                                'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== previewQuestions[currentQuestionIndex]?.correctAnswer,
                                'border-slate-100 bg-white': selectedAnswer !== opt && !(showExplanation && opt === previewQuestions[currentQuestionIndex]?.correctAnswer)
                              }"
                              class="border-4 p-4 rounded-xl text-primary font-bold transition-all text-left flex items-center gap-3 group disabled:cursor-default text-sm"
                              :disabled="showExplanation">
                              <span class="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold" 
                                    :class="showExplanation && opt === previewQuestions[currentQuestionIndex]?.correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-highlight text-slate-400'">
                                <span x-text="opt"></span>
                              </span>
                              <span x-text="previewQuestions[currentQuestionIndex]?.['option' + opt]"></span>
                           </button>
                         </template>
                      </div>
                    </div>
                  </template>

                  <!-- FTB Content -->
                  <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                    <div>
                      <div class="text-2xl font-bold text-primary mb-10 leading-relaxed bg-white p-8 rounded-3xl shadow-inner border-2 border-slate-100" 
                           x-html="renderFTB(previewQuestions[currentQuestionIndex])"></div>
                      <div class="mt-8 flex justify-center">
                        <button @click="checkAnswerFTB()" x-show="!showExplanation" class="bg-accent text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-accent-hover transition-all">PERIKSA JAWABAN</button>
                      </div>
                    </div>
                  </template>

                  <!-- Word Search Content -->
                  <template x-if="showPreview && activeProject?.gameType === 'WORD_SEARCH' && gameData">
                    <div class="w-full">
                       ${WordSearchGame({ projectVar: 'activeProject', gameDataVar: 'gameData' })}
                    </div>
                  </template>
                  
                  <template x-if="showPreview && activeProject?.gameType === 'CROSSWORD' && gameData">
                    <div class="w-full h-full flex items-center justify-center p-4 bg-primary/5" :key="'cw-' + activeProject.id + '-' + (gameData?.updatedAt || Date.now())">
                       ${CrosswordGame({ projectVar: 'activeProject', gameDataVar: 'gameData', isReadOnly: 'true' })}
                    </div>
                  </template>

                  <!-- Explanation Box -->
                  <div x-show="showExplanation" x-transition class="mt-8 p-6 rounded-2xl text-left border-2 border-dashed"
                       :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                     <div class="flex items-center gap-3 mb-2">
                        <template x-if="isCorrect">
                           <span class="bg-green-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <template x-if="!isCorrect">
                           <span class="bg-red-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <span class="font-black text-xs uppercase tracking-widest" :class="isCorrect ? 'text-green-800' : 'text-red-800'" x-text="isCorrect ? 'Luar Biasa!' : 'Belum Tepat!'"></span>
                     </div>
                     <div class="space-y-3">
                        <template x-if="activeProject?.gameType === 'QUIZ'">
                          <p class="text-sm font-bold text-slate-700 italic" x-text="previewQuestions[currentQuestionIndex]?.explanation"></p>
                        </template>
                        <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                          <div class="space-y-2">
                            <template x-for="(ans, aidx) in previewQuestions[currentQuestionIndex]?.answers" :key="aidx">
                              <div class="text-xs font-bold border-l-4 pl-3" :class="userFTBAnswers[aidx]?.toLowerCase() === ans.word.toLowerCase() ? 'border-green-400' : 'border-red-400'">
                                <span class="text-primary uppercase tracking-tighter" x-text="ans.word"></span>: 
                                <span class="text-slate-500 italic" x-text="ans.explanation"></span>
                              </div>
                            </template>
                          </div>
                        </template>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
    ${WordSearchEditorScript()}
    ${WordSearchGameScript()}
    ${CrosswordEditorScript()}
    ${CrosswordGameScript()}
    ${AdventureEditorScript()}
  `;
};
