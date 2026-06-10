import { projects, questionBank } from "../../db/schema";
import { WordSearchEditor, WordSearchEditorScript } from "./WordSearchEditor";
import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { CrosswordEditor, CrosswordEditorScript } from "./CrosswordEditor";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";
import { ProjectHeader } from "./ProjectHeader";

export const PembuatGameDashboard = ({ myProjects, publishedProjects, allUsers }: { myProjects: any[], publishedProjects: any[], allUsers: any[] }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');
  const publishedProjectsJson = JSON.stringify(publishedProjects).replace(/</g, '\\u003c');
  const allUsersJson = JSON.stringify(allUsers).replace(/</g, '\\u003c');

  return `
    <script id="pembuatProjectsData" type="application/json">${myProjectsJson}</script>
    <script id="pembuatPublishedData" type="application/json">${publishedProjectsJson}</script>
    <script id="pembuatUsersData" type="application/json">${allUsersJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pembuatDashboard', () => ({
            activeProject: null,
            questions: [],
            gameData: null,
            showPreview: false,
            showAuditLog: false,
            currentQuestionIndex: 0,
            selectedAnswer: null,
            showExplanation: false,
            isCorrect: false,
            userFTBAnswers: [],
            saveTimeout: null,
            stagingQuestions: [],
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
                        jumlahSulit: Number(jumlahSulit)
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

            getUserName(id) {
              const u = this.allUsers.find(u => u.id === id);
              return u ? u.name : '-';
            },

            filteredActiveProjects() {
              const statusMap = {
                'DRAFT':          ['DRAFT'],
                'REVIEW_PAKAR':   ['REVIEW_PAKAR'],
                'REVISI_PAKAR':   ['REVISI_PAKAR', 'ACCEPTED_PAKAR'],
                'REVIEW_KETUA':   ['REVIEW_KETUA'],
                'REVISI_KETUA':   ['REVISI_KETUA', 'UNPUBLISHED'],
              };
              const allowed = statusMap[this.activeTab] || [];
              return this.myProjects.filter(p => {
                const matchTab = allowed.includes(p.status);
                const matchSearch = !this.searchActive || p.title.toLowerCase().includes(this.searchActive.toLowerCase());
                return matchTab && matchSearch;
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
                  this.gameData = null;
                  this.showAuditLog = false;
                  if (this.activeProject.gameType === 'WORD_SEARCH') {
                    const wsRes = await fetch('/api/word-search/' + id);
                    const wsJson = await wsRes.json();
                    if (wsJson.success) this.gameData = wsJson.data;
                  } else if (this.activeProject.gameType === 'CROSSWORD') {
                    const cwRes = await fetch('/api/crossword/' + id);
                    const cwJson = await cwRes.json();
                    if (cwJson.success) this.gameData = cwJson.data;
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
              return !["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(this.activeProject.status);
            },

            updateSaveIndicator(text, classes) {
              const el = document.getElementById('saveStatus');
              if (!el) return;
              el.innerText = text;
              el.className = "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500 " + classes;
            },

            addQuestion() {
              if (this.activeProject?.gameType === 'QUIZ') {
                this.questions.push({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', difficulty: 'MUDAH', explanation: '' });
              } else if (this.activeProject?.gameType === 'FILL_THE_BLANK') {
                this.questions.push({ fullText: '', answers: [], difficulty: 'MUDAH' });
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
                  this.debouncedSave();
                } else {
                  localStorage.removeItem('project_draft_' + id);
                }
              }
            },

            downloadTemplate() {
              let header = '', dummy = '';
              if (this.activeProject.gameType === 'QUIZ') {
                header = "question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation\\n";
                dummy = "Siapa Presiden pertama RI?,Soekarno,Hatta,Soedirman,Habibie,A,MUDAH,Soekarno adalah proklamator\\n";
              } else {
                header = "fullText,word1,explanation1,word2,explanation2\\n";
                dummy = "Kalimat dengan [kata] kunci.,kata,Penjelasan kata tersebut,,\\n";
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
                  if (this.activeProject.gameType === 'QUIZ') {
                    if (cols.length < 6) continue;
                    imported.push({ question: cols[0], optionA: cols[1], optionB: cols[2], optionC: cols[3], optionD: cols[4], correctAnswer: (cols[5] || 'A').trim().toUpperCase(), difficulty: (cols[6] || 'MUDAH').trim().toUpperCase(), explanation: cols[7] || '' });
                  } else {
                    const answers = [];
                    if (cols[1] && cols[2]) answers.push({ word: cols[1], explanation: cols[2] });
                    if (cols[3] && cols[4]) answers.push({ word: cols[3], explanation: cols[4] });
                    imported.push({ fullText: cols[0], answers, difficulty: 'MUDAH' });
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
              this.debouncedSave();
            },

            previewGame() {
              if (this.activeProject?.gameType === 'WORD_SEARCH' && (!this.gameData || !this.gameData.gridData)) { alert("Data grid Word Search belum tersedia."); return; }
              if (this.activeProject?.gameType === 'CROSSWORD' && (!this.gameData || !this.gameData.clues)) { alert("Data Crossword belum tersedia."); return; }
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
                text = text.replace(regex, '<input type="text" class="ftb-input border-b-2 border-blue-800 outline-none text-center px-2 text-orange-600 bg-slate-50 rounded-t w-24 mx-1" placeholder="..." onchange="window.updateFTB(' + i + ', this.value)">');
              });
              window.updateFTB = (idx, val) => { this.userFTBAnswers[idx] = val; };
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

            async submitForReview() {
              if (this.activeProject.gameType === 'WORD_SEARCH') {
                if (!this.gameData || !this.gameData.words || this.gameData.words.length === 0) { alert("Minimal harus ada 1 kata di Word Search sebelum dikirim."); return; }
              } else if (this.activeProject.gameType === 'CROSSWORD') {
                if (!this.gameData || !this.gameData.clues || this.gameData.clues.length === 0) { alert("Minimal harus ada 1 clue di Crossword sebelum dikirim."); return; }
              } else if (this.questions.length === 0) {
                alert("Minimal harus ada 1 soal sebelum dikirim."); return;
              }
              const target = this.activeProject.status === 'REVISI_KETUA' ? 'Ketua Tim' : 'Pakar';
              if (!confirm('Kirim proyek ke ' + target + ' untuk di-review?')) return;
              const res = await fetch('/api/projects/' + this.activeProject.id + '/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statusGiven: 'SUBMIT', feedback: 'Sent for review' })
              });
              if (res.ok) window.location.reload();
              else alert("Gagal mengirim untuk review");
            }
          }));
      });
    </script>

    <div class="bg-white p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" x-data="pembuatDashboard()">
      <div class="bg-[#1A237E] p-6 border-b-4 border-[#FFC107] flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-lg md:text-xl font-bold text-white uppercase tracking-widest leading-tight" x-text="viewMode === 'all' ? 'Semua Proyek Saya' : 'Workspace Produksi Game'"></h2>
        </div>
        <div class="flex items-center gap-4">
           <span x-show="activeProject" id="saveStatus" class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500">CLOUD SYNC ACTIVE</span>
           <div class="flex gap-2" x-show="!activeProject">
             <a href="/dashboard/game" :class="viewMode === 'active' ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-white/10 text-white'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Proyek Dikerjakan</a>
             <a href="/dashboard/game?view=all" :class="viewMode === 'all' ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-white/10 text-white'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Semua Proyek Saya</a>
           </div>
        </div>
      </div>
      
      <div class="p-8">

        <!-- ======= VIEW: PROYEK DIKERJAKAN (ACTIVE) ======= -->
        <div x-show="viewMode === 'active' && !activeProject">
          <!-- Header + Search -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <h2 class="text-base md:text-lg font-semibold text-[#1A237E] uppercase tracking-wider flex items-center gap-2">
                <span class="h-5 w-1.5 bg-[#FFC107] rounded-full"></span>
                Proyek Yang Sedang Dikerjakan
              </h2>
              <p class="text-xs md:text-sm text-slate-400 font-medium mt-1">Proyek aktif yang ditugaskan kepada Anda</p>
            </div>
            <div class="relative w-full md:w-64">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" x-model="searchActive" placeholder="Cari judul proyek..." class="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:border-[#FFC107] outline-none shadow-inner">
            </div>
          </div>

          <!-- Tab Panel -->
          <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-200 mb-0">

            <!-- Tab Bar -->
            <div class="flex overflow-x-auto bg-[#1A237E] border-b-0">
              <button @click="activeTab = 'DRAFT'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="activeTab === 'DRAFT' ? 'bg-white text-yellow-600 border-yellow-400 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                📝 Draft
              </button>
              <button @click="activeTab = 'REVIEW_PAKAR'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="activeTab === 'REVIEW_PAKAR' ? 'bg-white text-blue-600 border-blue-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                🔍 Review Pakar
              </button>
              <button @click="activeTab = 'REVISI_PAKAR'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="activeTab === 'REVISI_PAKAR' ? 'bg-white text-orange-600 border-orange-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i class="bi bi-pencil-square"></i> Revisi Pakar
              </button>
              <button @click="activeTab = 'REVIEW_KETUA'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="activeTab === 'REVIEW_KETUA' ? 'bg-white text-indigo-700 border-indigo-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i class="bi bi-award"></i> Review Ketua
              </button>
              <button @click="activeTab = 'REVISI_KETUA'"
                class="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :class="activeTab === 'REVISI_KETUA' ? 'bg-white text-red-600 border-red-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                🔁 Revisi Ketua
              </button>
            </div>

            <!-- Active Projects Table -->
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
                      <div class="font-semibold text-slate-800 text-base md:text-lg leading-tight group-hover:text-[#1A237E] transition-colors" x-text="p.title"></div>
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
                      <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
                        :class="{
                          'bg-yellow-100 text-yellow-800 border border-yellow-200': p.status === 'DRAFT',
                          'bg-blue-100 text-blue-800 border border-blue-200': p.status === 'REVIEW_PAKAR',
                          'bg-orange-100 text-orange-800 border border-orange-200': p.status === 'REVISI_PAKAR',
                          'bg-green-100 text-green-800 border border-green-200': p.status === 'ACCEPTED_PAKAR',
                          'bg-indigo-100 text-indigo-800 border border-indigo-200': p.status === 'REVIEW_KETUA',
                          'bg-red-100 text-red-800 border border-red-200': p.status === 'REVISI_KETUA',
                          'bg-slate-100 text-slate-600 border border-slate-200': p.status === 'UNPUBLISHED',
                        }"
                        x-text="p.status.replace(/_/g, ' ')">
                      </span>
                    </td>
                    <td class="px-6 py-5 text-right">
                      <button @click="openProject(p.id)" class="bg-[#1A237E] text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-900 transition-all shadow-md transform hover:scale-105 uppercase tracking-widest">BUKA</button>
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
        <div x-show="viewMode === 'all' && !activeProject">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 class="text-lg font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-2">
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
                      <button @click="openProject(p.id)" class="bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-md transform hover:scale-105 uppercase tracking-widest">LIHAT DETAIL</button>
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

          <div x-show="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'" class="space-y-6 mb-10">
            <div class="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 gap-4">
              <div class="flex items-center gap-3">
                <div class="h-8 w-1.5 bg-[#1A237E] rounded-full"></div>
                <div>
                  <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest">Editor Konten</h3>
                  <p class="text-[10px] text-slate-400 font-bold">Kelola butir soal interaktif</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 justify-center">
                 <button @click="downloadTemplate()" class="text-[10px] font-black uppercase bg-white border-2 border-slate-200 px-4 py-2 rounded-lg hover:border-[#1A237E] transition-all flex items-center gap-2">
                   CSV Template
                 </button>
                 <label class="text-[10px] font-black uppercase bg-[#FFC107] text-[#1A237E] px-4 py-2 rounded-lg cursor-pointer hover:bg-[#FFD54F] transition-all flex items-center gap-2 shadow-sm">
                   Import CSV
                   <input type="file" accept=".csv" @change="importCSV" class="hidden">
                 </label>
                 <button x-show="activeProject?.gameType === 'QUIZ' || activeProject?.gameType === 'FILL_THE_BLANK'" @click="openGenerateModal = true" class="text-[10px] font-black uppercase bg-[#FF5722] text-white px-4 py-2 rounded-lg hover:bg-[#E64A19] transition-all flex items-center gap-2 shadow-md">
                   Generate Soal
                 </button>
                 <button @click="previewGame()" class="text-[10px] font-black uppercase bg-[#1A237E] text-white px-4 py-2 rounded-lg hover:bg-indigo-900 transition-all flex items-center gap-2 shadow-md">
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
                        </div>
                     </div>
                  </template>
               </div>
            </div>
          </template>

          <template x-if="isReadOnly()">
            <div class="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 font-bold border border-red-200">
               Proyek dalam status <span x-text="activeProject?.status"></span> dan bersifat Read-Only.
            </div>
          </template>

          <!-- Generate Modal -->
          <div x-show="openGenerateModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style="display: none;" x-transition>
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 class="text-lg font-bold text-[#1A237E]">Auto-Generate Soal dari Bank</h3>
                <button @click="openGenerateModal = false" class="text-slate-400 hover:text-red-500">&times;</button>
              </div>
              <div class="p-5 space-y-4">
                <p class="text-xs text-slate-500 font-bold mb-4">Pastikan Total Soal = (Mudah + Sedang + Sulit). Auto-generate akan menarik soal secara acak dari Bank Soal global.</p>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1">Total Soal</label>
                  <input type="number" min="1" x-model.number="generateData.totalSoal" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-xs font-semibold text-green-700 mb-1">Mudah</label>
                    <input type="number" min="0" x-model.number="generateData.jumlahMudah" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-yellow-700 mb-1">Sedang</label>
                    <input type="number" min="0" x-model.number="generateData.jumlahSedang" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-red-700 mb-1">Sulit</label>
                    <input type="number" min="0" x-model.number="generateData.jumlahSulit" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  </div>
                </div>
                <div class="p-3 mt-4 bg-slate-50 rounded border border-slate-200 text-xs font-bold text-center">
                  Total Terhitung: <span x-text="Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit)" :class="{'text-red-600': Number(generateData.totalSoal) !== (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit)), 'text-green-600': Number(generateData.totalSoal) === (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit))}"></span>
                </div>
              </div>
              <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button @click="openGenerateModal = false" class="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
                <button @click="submitGenerate()" :disabled="isGenerating || Number(generateData.totalSoal) !== (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit))" class="px-4 py-2 text-white bg-[#1A237E] rounded-lg hover:bg-blue-900 disabled:opacity-50 font-semibold text-sm">
                  <span x-text="isGenerating ? 'Memproses...' : 'Generate'"></span>
                </button>
              </div>
            </div>
          </div>

          <div x-show="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'" class="space-y-6">
            <template x-for="(q, idx) in questions" :key="idx">
              <div class="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 shadow-xl relative group transition-all hover:border-[#FFC107]">
                <div class="absolute -left-4 top-10 bg-[#1A237E] text-white h-10 w-10 rounded-xl flex items-center justify-center font-black shadow-lg" x-text="idx + 1"></div>
                <button x-show="!isReadOnly()" @click="removeQuestion(idx)" class="absolute -right-3 -top-3 bg-red-500 text-white h-10 w-10 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10">&times;</button>
                
                <!-- Quiz Editor -->
                <template x-if="activeProject?.gameType === 'QUIZ'">
                  <div class="space-y-8 pl-4">
                    <div>
                      <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Butir Pertanyaan</label>
                      <textarea x-model="q.question" @input="debouncedSave()" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-2xl p-6 h-32 focus:border-[#1A237E] outline-none font-bold text-xl text-[#1A237E] bg-white transition-all shadow-inner" placeholder="Tuliskan pertanyaan di sini..."></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <template x-for="opt in ['A', 'B', 'C', 'D']">
                        <div class="relative">
                          <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" x-text="'Pilihan ' + opt"></label>
                          <input type="text" x-model="q['option' + opt]" @input="debouncedSave()" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white transition-all pl-12 shadow-sm" :placeholder="'Opsi ' + opt">
                          <div class="absolute left-4 top-10 font-black text-[#1A237E]" x-text="opt + '.'"></div>
                        </div>
                      </template>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                      <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jawaban Benar</label>
                        <select x-model="q.correctAnswer" @change="debouncedSave()" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-black bg-white cursor-pointer text-[#1A237E] shadow-sm">
                          <option value="A">Opsi A</option><option value="B">Opsi B</option><option value="C">Opsi C</option><option value="D">Opsi D</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kesulitan</label>
                        <select x-model="q.difficulty" @change="debouncedSave()" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-black bg-white cursor-pointer text-[#1A237E] shadow-sm">
                          <option value="MUDAH">MUDAH (10 Poin)</option>
                          <option value="SEDANG">SEDANG (20 Poin)</option>
                          <option value="SULIT">SULIT (50 Poin)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Penjelasan Edukatif</label>
                      <textarea x-model="q.explanation" @input="debouncedSave()" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 h-24 focus:border-[#1A237E] outline-none font-medium text-slate-600 italic bg-white transition-all shadow-sm" placeholder="Berikan alasan mengapa jawaban tersebut benar..."></textarea>
                    </div>
                  </div>
                </template>

                <!-- FTB Editor -->
                <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                  <div class="space-y-6 pl-4">
                     <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex justify-between">
                           Teks Lengkap (Blok teks lalu klik 'Jadikan Blank')
                           <button x-show="!isReadOnly()" @click="makeBlank(idx)" class="bg-[#FFC107] text-[#1A237E] px-4 py-1 rounded-full hover:bg-yellow-400 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase">
                             Jadikan Blank
                           </button>
                        </label>
                        <textarea :id="'ftb-text-' + idx" x-model="q.fullText" @input="debouncedSave()" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-2xl p-6 h-40 focus:border-[#1A237E] outline-none font-bold text-xl text-[#1A237E] bg-white transition-all shadow-inner" placeholder="Tuliskan kalimat di sini..."></textarea>
                     </div>
                     <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Kata Rumpang</label>
                        <template x-for="(ans, aidx) in q.answers" :key="aidx">
                           <div class="bg-slate-50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start border border-slate-100">
                              <div class="flex-none">
                                 <div class="text-[8px] font-black text-blue-400 uppercase mb-1">KATA</div>
                                 <div class="bg-[#1A237E] text-white px-3 py-1 rounded font-black text-sm" x-text="ans.word"></div>
                              </div>
                              <div class="flex-1 w-full">
                                 <div class="text-[8px] font-black text-blue-400 uppercase mb-1">PENJELASAN</div>
                                 <input type="text" x-model="ans.explanation" @input="debouncedSave()" :disabled="isReadOnly()" class="w-full bg-white border-2 border-slate-100 rounded-lg p-2 text-xs font-bold focus:border-[#1A237E] outline-none transition-all" placeholder="Mengapa kata ini penting?">
                              </div>
                              <button x-show="!isReadOnly()" @click="q.answers.splice(aidx, 1); debouncedSave()" class="text-red-400 hover:text-red-600 pt-5 font-black">&times;</button>
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

            <button x-show="!isReadOnly()" @click="addQuestion()" class="w-full border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-slate-400 font-black uppercase tracking-[0.3em] hover:border-[#1A237E] hover:text-[#1A237E] transition-all flex flex-col items-center gap-4 group">
               <div class="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1A237E] group-hover:text-[#FFC107] transition-all transform group-hover:rotate-90">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
               </div>
               TAMBAH BUTIR SOAL BARU
            </button>

            <div x-show="!isReadOnly()" class="pt-10 flex flex-col items-center gap-3">
               <button @click="submitForReview()" class="bg-[#FF5722] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-[#E64A19] transition-all transform hover:scale-110 active:scale-95 flex items-center gap-4">
                  <span x-text="activeProject?.status === 'REVISI_KETUA' ? 'KIRIM KE KETUA TIM' : 'KIRIM KE PAKAR'"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </button>
               <p class="text-xs text-slate-400 font-bold"
                  x-text="activeProject?.status === 'REVISI_KETUA' ? '→ Proyek akan dikirim ke Ketua Tim untuk review akhir' : '→ Proyek akan dikirim ke Pakar yang ditugaskan untuk review konten'">
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
            <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-[#FF5722] z-10 text-3xl transition-colors font-black">&times;</button>
            <div class="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-[0.2em] border-b-8 border-[#FFC107] flex justify-between px-10">
              <div class="flex gap-2">
                <span class="text-white/40">SIMULASI:</span>
                <span x-text="activeProject?.title" class="text-[#FFC107]"></span>
              </div>
              <div class="flex gap-4 text-[10px]">
                <span class="bg-white/10 px-3 py-1 rounded-full text-white" x-text="activeProject?.gameType"></span>
              </div>
            </div>
            <div class="p-0 flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
               <template x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                 <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-20">
                    <button @click="prevQuestion()" x-show="currentQuestionIndex > 0" class="pointer-events-auto bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 border border-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button @click="nextQuestion()" x-show="currentQuestionIndex < questions.length - 1" class="pointer-events-auto bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 border border-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
                    </button>
                 </div>
               </template>

               <div class="text-center w-full flex-1 flex flex-col justify-center">
                  <template x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                    <div class="inline-block mx-auto bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest mt-10" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + questions.length"></div>
                  </template>
                  
                  <!-- Quiz Content -->
                  <template x-if="activeProject?.gameType === 'QUIZ'">
                    <div>
                      <h3 class="text-base md:text-lg font-bold text-[#1A237E] mb-6 leading-relaxed" x-text="questions[currentQuestionIndex]?.question"></h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <template x-for="opt in ['A', 'B', 'C', 'D']">
                           <button @click="checkAnswerQuiz(opt)" 
                              :class="{
                                'border-[#FFC107] bg-yellow-50': selectedAnswer === opt,
                                'border-green-500 bg-green-50': showExplanation && opt === questions[currentQuestionIndex].correctAnswer,
                                'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== questions[currentQuestionIndex].correctAnswer,
                                'border-slate-100 bg-white': selectedAnswer !== opt && !(showExplanation && opt === questions[currentQuestionIndex].correctAnswer)
                              }"
                              class="border-4 p-4 rounded-xl text-[#1A237E] font-bold transition-all text-left flex items-center gap-3 group disabled:cursor-default text-sm"
                              :disabled="showExplanation">
                              <span class="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold" 
                                    :class="showExplanation && opt === questions[currentQuestionIndex].correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] text-slate-400'">
                                <span x-text="opt"></span>
                              </span>
                              <span x-text="questions[currentQuestionIndex]['option' + opt]"></span>
                           </button>
                         </template>
                      </div>
                    </div>
                  </template>

                  <!-- FTB Content -->
                  <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                    <div>
                      <div class="text-2xl font-bold text-[#1A237E] mb-10 leading-relaxed bg-white p-8 rounded-3xl shadow-inner border-2 border-slate-100" 
                           x-html="renderFTB(questions[currentQuestionIndex])"></div>
                      <div class="mt-8 flex justify-center">
                        <button @click="checkAnswerFTB()" x-show="!showExplanation" class="bg-[#FF5722] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-[#E64A19] transition-all">PERIKSA JAWABAN</button>
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
                    <div class="w-full h-full flex items-center justify-center p-4 bg-[#1A237E]/5" :key="'cw-' + activeProject.id + '-' + (gameData?.updatedAt || Date.now())">
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
                          <p class="text-sm font-bold text-slate-700 italic" x-text="questions[currentQuestionIndex]?.explanation"></p>
                        </template>
                        <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                          <div class="space-y-2">
                            <template x-for="(ans, aidx) in questions[currentQuestionIndex]?.answers" :key="aidx">
                              <div class="text-xs font-bold border-l-4 pl-3" :class="userFTBAnswers[aidx]?.toLowerCase() === ans.word.toLowerCase() ? 'border-green-400' : 'border-red-400'">
                                <span class="text-[#1A237E] uppercase tracking-tighter" x-text="ans.word"></span>: 
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
  `;
};
