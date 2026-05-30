import { WordSearchGame, WordSearchGameScript } from "./WordSearchGame";
import { WordSearchEditorScript } from "./WordSearchEditor";
import { CrosswordGame, CrosswordGameScript } from "./CrosswordGame";
import { ProjectHeader } from "./ProjectHeader";

export const KetuaTimAllProjects = ({ allProjects, pembuatGames, pembuatMateris = [], pakars = [] }: { allProjects: any[], pembuatGames: any[], pembuatMateris?: any[], pakars?: any[] }) => {
  const allProjectsJson = JSON.stringify(allProjects).replace(/</g, '\\u003c');
  const pembuatOptions = pembuatGames.map(u => `<option value="${u.id}">${u.username}</option>`).join('');
  const pembuatMateriOptions = pembuatMateris.map(u => `<option value="${u.id}">${u.username}</option>`).join('');
  const pakarOptions = pakars.map(u => `<option value="${u.id}">${u.username}</option>`).join('');

  return `
    <script id="ketuaProjectsData" type="application/json">${allProjectsJson}</script>

    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('ketuaDashboard', () => ({
          activeProject: null,
          questions: [],
          materiContents: [],
          gameData: null,
          feedback: '',
          editMode: false,
          editProjectData: null,
          showPreview: false,
          showAuditLog: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          isCorrect: false,
          userFTBAnswers: [],
          filterTypeMain: 'ALL',
          filterType: 'ALL',
          statusTab: 'ALL',
          speakingIdx: null,
          unlockedIdx: 0,
          isReading: false,
          isPaused: false,
          allProjects: JSON.parse(document.getElementById('ketuaProjectsData').textContent || '[]'),
          selectedCategories: [],
          availableCategories: [
            "Biblical Knowledge",
            "Eksegesis & Hermeneutik",
            "Biblical Theory",
            "Homiletika",
            "Apologetika"
          ],

          filteredProjects() {
            let base = this.allProjects;
            if (this.filterTypeMain !== 'ALL') {
              base = base.filter(p => p.type === this.filterTypeMain);
            }
            if (this.filterType !== 'ALL') {
              if (this.filterTypeMain === 'GAME') {
                base = base.filter(p => p.gameType === this.filterType);
              } else if (this.filterTypeMain === 'MATERI') {
                base = base.filter(p => p.materiType === this.filterType);
              }
            }
            return base;
          },

          filteredByStatus() {
            const base = this.filteredProjects();
            if (this.statusTab === 'ALL') return base;
            if (this.statusTab === 'DRAFT')         return base.filter(p => p.status === 'DRAFT');
            if (this.statusTab === 'REVIEW_PAKAR')  return base.filter(p => p.status === 'REVIEW_PAKAR');
            if (this.statusTab === 'REVISI_PAKAR')  return base.filter(p => p.status === 'REVISI_PAKAR');
            if (this.statusTab === 'ACCEPTED_PAKAR')return base.filter(p => p.status === 'ACCEPTED_PAKAR');
            if (this.statusTab === 'REVIEW_KETUA')  return base.filter(p => p.status === 'REVIEW_KETUA');
            if (this.statusTab === 'REVISI_KETUA')  return base.filter(p => p.status === 'REVISI_KETUA');
            if (this.statusTab === 'UNPUBLISHED')   return base.filter(p => p.status === 'UNPUBLISHED');
            return base;
          },

          async openProject(id) {
            try {
              const res = await fetch('/api/projects/' + id);
              const json = await res.json();
              if (json.success) {
                this.activeProject = json.data;
                this.questions = json.data.questions || [];
                this.materiContents = json.data.materiContents || [];
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

          modalType: 'GAME',

          openCreateModal(type = 'GAME') {
            this.editMode = false;
            this.editProjectData = null;
            this.modalType = type;
            this.selectedCategories = [];
            const form = document.getElementById('createGameForm');
            if (form) form.reset();
            document.getElementById('createGameModal').classList.remove('hidden');
          },

          editProject(p) {
            this.editMode = true;
            this.editProjectData = p;
            this.modalType = p.type;
            this.selectedCategories = p.category ? p.category.split(',').map(s=>s.trim()).filter(s=>s) : [];
            document.getElementById('createGameModal').classList.remove('hidden');
          },

          addCategory(val) {
            if (val && !this.selectedCategories.includes(val)) {
              this.selectedCategories.push(val);
            }
          },

          removeCategory(val) {
            this.selectedCategories = this.selectedCategories.filter(c => c !== val);
          },

          async deleteProject(id) {
            if (!confirm('Apakah Anda yakin ingin menghapus proyek ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
            const res = await fetch('/api/projects/' + id, { method: 'DELETE' });
            if (res.ok) window.location.reload();
            else {
              const json = await res.json();
              alert('Gagal menghapus proyek: ' + (json.error || 'Terjadi kesalahan'));
            }
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

          renderFTB(q) {
            if (!q || !q.fullText) return '';
            let text = q.fullText;
            const answers = q.answers || [];
            const sortedAnswers = [...answers].sort((a, b) => b.word.length - a.word.length);
            sortedAnswers.forEach((ans, i) => {
              const regex = new RegExp(ans.word, 'gi');
              text = text.replace(regex, '<input type="text" class="ftb-input border-b-2 border-blue-800 outline-none text-center px-2 text-orange-600 bg-slate-50 rounded-t w-24 mx-1" placeholder="..." onchange="window.updateKetuaFTB(' + i + ', this.value)">');
            });
            window.updateKetuaFTB = (idx, val) => { this.userFTBAnswers[idx] = val; };
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

      function closeCreateGameModal() {
        document.getElementById('createGameModal').classList.add('hidden');
      }

      window.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('createGameForm');
        if (form) {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const projectId = data.id;
            delete data.id;

              const submitData = async (finalData) => {
                const url = projectId ? '/api/projects/' + projectId : '/api/projects';
                const method = projectId ? 'PATCH' : 'POST';
                // Type is handled in form visually via modalType logic, but we need to ensure it's set
                const currentModalType = Alpine.$data(document.querySelector('[x-data="ketuaDashboard()"]')).modalType;
                finalData.type = currentModalType;
                
                const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
              });
              if (res.ok) window.location.reload();
              else {
                const err = await res.json();
                alert('Gagal memproses proyek: ' + (err.error || 'Terjadi kesalahan sistem'));
              }
            };

            const fileInput = document.getElementById('thumbnailFile');
            if (fileInput && fileInput.files.length > 0) {
              const file = fileInput.files[0];
              const reader = new FileReader();
              reader.onload = function(evt) {
                data.thumbnailUrl = evt.target.result;
                delete data.thumbnailFile;
                submitData(data);
              };
              reader.readAsDataURL(file);
            } else {
              delete data.thumbnailFile;
              submitData(data);
            }
          });
        }
      });
      // ===================== END KPI DASHBOARD COMPONENT =====================
    </script>

    <div class="space-y-8" x-data="ketuaDashboard()">
      <div class="flex items-center justify-between bg-[#1A237E] p-6 rounded-xl shadow-lg border-b-4 border-[#FFC107]">
        <div class="flex items-center gap-4">
          <img src="/public/assets/logo-logoslab.png" alt="Logos LAB" class="h-12 w-auto object-contain bg-white p-1 rounded shadow-sm" onerror="this.style.display='none'"/>
          <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">Manajemen Proyek Game</h2>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <button @click="openCreateModal('GAME')" class="bg-[#FF5722] hover:bg-[#E64A19] text-white px-4 py-3 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest">
            + TAMBAH PROYEK GAME
          </button>
          <button @click="openCreateModal('MATERI')" class="bg-[#FF5722] hover:bg-[#E64A19] text-white px-4 py-3 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest">
            + TUGASKAN MATERI
          </button>
        </div>
      </div>

      <!-- List View -->
      <div x-show="!activeProject" class="bg-white p-8 rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div class="flex items-center gap-3">
            <div class="h-8 w-2 bg-[#FFC107] rounded-full"></div>
            <h2 class="text-lg md:text-xl font-semibold text-[#1A237E]">Daftar Aktifitas Produksi</h2>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button @click="filterTypeMain = 'ALL'; filterType = 'ALL'" :class="filterTypeMain === 'ALL' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all">SEMUA PROYEK</button>
              <button @click="filterTypeMain = 'GAME'; filterType = 'ALL'" :class="filterTypeMain === 'GAME' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all">GAME</button>
              <button @click="filterTypeMain = 'MATERI'; filterType = 'ALL'" :class="filterTypeMain === 'MATERI' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all">MATERI</button>
            </div>
            <div x-show="filterTypeMain === 'GAME'" class="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              <button @click="filterType = 'ALL'" :class="filterType === 'ALL' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">SEMUA GAME</button>
              <button @click="filterType = 'QUIZ'" :class="filterType === 'QUIZ' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">QUIZ</button>
              <button @click="filterType = 'FILL_THE_BLANK'" :class="filterType === 'FILL_THE_BLANK' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">FTB</button>
              <button @click="filterType = 'WORD_SEARCH'" :class="filterType === 'WORD_SEARCH' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">WORD SEARCH</button>
              <button @click="filterType = 'CROSSWORD'" :class="filterType === 'CROSSWORD' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">CROSSWORD</button>
            </div>
            <div x-show="filterTypeMain === 'MATERI'" class="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              <button @click="filterType = 'ALL'" :class="filterType === 'ALL' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">SEMUA MATERI</button>
              <button @click="filterType = 'TEKS'" :class="filterType === 'TEKS' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">TEKS</button>
              <button @click="filterType = 'VIDEO'" :class="filterType === 'VIDEO' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">VIDEO</button>
              <button @click="filterType = 'MANUAL'" :class="filterType === 'MANUAL' ? 'bg-white text-[#1A237E] shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap">MANUAL</button>
            </div>
          </div>
        </div>

        <!-- Status Tab Panel -->
        <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <!-- Tab Bar -->
          <div class="flex overflow-x-auto bg-[#1A237E]">
            <button @click="statusTab = 'ALL'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'ALL' ? 'bg-white text-[#1A237E] border-[#FFC107] shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              🗂 Semua
            </button>
            <button @click="statusTab = 'DRAFT'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'DRAFT' ? 'bg-white text-yellow-600 border-yellow-400 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              📝 Draft
            </button>
            <button @click="statusTab = 'REVIEW_PAKAR'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'REVIEW_PAKAR' ? 'bg-white text-blue-600 border-blue-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              🔍 Review Pakar
            </button>
            <button @click="statusTab = 'REVISI_PAKAR'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'REVISI_PAKAR' ? 'bg-white text-orange-600 border-orange-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              ✏️ Revisi Pakar
            </button>
            <button @click="statusTab = 'ACCEPTED_PAKAR'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'ACCEPTED_PAKAR' ? 'bg-white text-green-600 border-green-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              ✅ Disetujui Pakar
            </button>
            <button @click="statusTab = 'REVIEW_KETUA'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'REVIEW_KETUA' ? 'bg-white text-indigo-700 border-indigo-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              👑 Review Ketua
            </button>
            <button @click="statusTab = 'REVISI_KETUA'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'REVISI_KETUA' ? 'bg-white text-red-600 border-red-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              🔁 Revisi Ketua
            </button>
            <button @click="statusTab = 'UNPUBLISHED'"
              class="flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px]"
              :class="statusTab === 'UNPUBLISHED' ? 'bg-white text-slate-600 border-slate-400 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
              📦 Unpublished
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto bg-white">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                <th class="pb-4 pt-4 px-6">No.</th>
                <th class="pb-4 pt-4 px-6">Judul Game / Materi</th>
                <th class="pb-4 pt-4 px-6">Status</th>
                <th class="pb-4 pt-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="text-slate-600">
              <template x-for="(p, index) in filteredByStatus()" :key="p.id">
                <tr class="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                  <td class="py-5 px-6 font-bold text-[#1A237E] text-sm md:text-base text-center" x-text="index + 1"></td>
                  <td class="py-5 px-6">
                    <div class="font-semibold text-slate-800 text-base md:text-lg leading-tight mb-1" x-text="p.title"></div>
                    <span class="text-[10px] bg-[#1A237E] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider" x-text="p.type === 'MATERI' ? p.materiType : p.gameType"></span>
                  </td>
                  <td class="py-5 px-6">
                    <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter"
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
                  <td class="py-5 px-6 text-right">
                    <div class="flex justify-end gap-2">
                      <template x-if="p.status === 'DRAFT' || p.status === 'REVISI_KETUA' || p.status === 'REVISI_PAKAR'">
                        <button @click="editProject(p)" class="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-600 transition-all shadow-md font-bold">Edit</button>
                      </template>
                      <button @click="deleteProject(p.id)" class="bg-red-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-red-600 transition-all shadow-md font-bold">Hapus</button>
                      <button @click="openProject(p.id)" class="bg-[#1A237E] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-900 shadow-md transition-all uppercase tracking-widest">DETAIL</button>
                    </div>
                  </td>
                </tr>
              </template>
              <template x-if="filteredByStatus().length === 0">
                <tr><td colspan="4" class="text-center py-10 text-slate-400 italic">Tidak ada proyek ditemukan.</td></tr>
              </template>
            </tbody>
          </table>
          </div><!-- /overflow-x-auto -->
        </div><!-- /tab-panel -->
      </div><!-- /list view -->


      <!-- Detail View -->
      <div x-show="activeProject" style="display: none;" class="space-y-6">
        <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 font-bold transition-colors">
          ← Kembali ke Dashboard
        </button>

        ${ProjectHeader()}

        <div class="bg-white p-8 border-2 border-slate-100 rounded-2xl shadow-xl">
          <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
            <span class="h-3 w-3 bg-[#FF5722] rounded-full animate-pulse"></span>
            Persetujuan Produksi
          </h4>
          <textarea x-model="feedback" class="w-full border-2 border-slate-100 rounded-xl p-4 h-40 focus:border-[#1A237E] outline-none font-medium transition-all mb-6" placeholder="Tuliskan catatan atau instruksi pengerjaan..."></textarea>
          <div class="flex gap-4">
            <button @click="submitReview('REVISI')" class="flex-1 bg-white border-4 border-[#FF5722] text-[#FF5722] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg">MINTA REVISI</button>
            <button @click="submitReview('ACCEPT')" class="flex-1 bg-[#1A237E] text-[#FFC107] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg">SETUJUI &amp; PUBLISH</button>
          </div>
        </div>
      </div>

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
                    <button @click="nextQuestion()" x-show="showExplanation" class="bg-[#1A237E] text-white px-6 py-2 rounded-xl font-black" x-text="currentQuestionIndex < questions.length - 1 ? 'Berikutnya →' : 'Selesai'"></button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div id="createGameModal" class="fixed inset-0 bg-[#1A237E]/40 backdrop-blur-sm hidden flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] shadow-2xl border-4 border-[#1A237E] flex flex-col overflow-hidden">
          <div class="bg-[#1A237E] p-6 text-white flex justify-between items-center border-b-4 border-[#FFC107]">
            <h3 class="font-black uppercase tracking-widest" x-text="(editMode ? 'Edit Proyek' : 'Penugasan Proyek Baru') + (modalType === 'MATERI' ? ' (Materi)' : ' (Game)')"></h3>
            <button onclick="closeCreateGameModal()" class="text-white/50 hover:text-white text-2xl">&times;</button>
          </div>
          <div class="overflow-y-auto flex-1 p-8">
            <form id="createGameForm" class="space-y-5">
              <input type="hidden" name="id" :value="editProjectData?.id">
              <div>
                <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2" x-text="modalType === 'MATERI' ? 'Judul Materi' : 'Judul Permainan'"></label>
                <input type="text" name="title" :value="editProjectData?.title" required class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold text-slate-700">
              </div>
              <div>
                <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2" x-text="modalType === 'MATERI' ? 'Deskripsi Materi' : 'Deskripsi Game'"></label>
                <textarea name="description" :value="editProjectData?.description" class="w-full border-2 border-slate-100 rounded-xl p-4 h-24 focus:border-[#1A237E] outline-none font-medium text-slate-600 resize-none"></textarea>
              </div>
              <div>
                <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Instruksi</label>
                <textarea name="instructions" :value="editProjectData?.instructions" class="w-full border-2 border-slate-100 rounded-xl p-4 h-28 focus:border-[#1A237E] outline-none font-medium text-slate-600 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div x-show="modalType === 'GAME'">
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Jenis Game</label>
                  <select name="gameType" :value="editProjectData?.gameType" :required="modalType === 'GAME'" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white">
                    <option value="QUIZ">Quiz</option>
                    <option value="FILL_THE_BLANK">Fill The Blank</option>
                    <option value="WORD_SEARCH">Word Search</option>
                    <option value="CROSSWORD">Crossword</option>
                  </select>
                </div>
                <div x-show="modalType === 'MATERI'">
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Jenis Materi</label>
                  <select name="materiType" :value="editProjectData?.materiType" :required="modalType === 'MATERI'" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white">
                    <option value="TEKS">Teks (PDF/PPT/Gambar)</option>
                    <option value="VIDEO">Video</option>
                    <option value="MANUAL">Materi Teks Manual (Sub-Bab + Glosarium)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Klasifikasi Minat</label>
                  <div class="flex flex-wrap gap-2 mb-2">
                    <template x-for="cat in selectedCategories" :key="cat">
                      <span class="bg-[#1A237E] text-white px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border border-[#FFC107]/30">
                        <span x-text="cat"></span>
                        <button type="button" @click="removeCategory(cat)" class="hover:text-[#FFC107] transition-colors focus:outline-none text-sm">&times;</button>
                      </span>
                    </template>
                  </div>
                  <select @change="addCategory($event.target.value); $event.target.value=''" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white text-slate-700">
                    <option value="">+ Tambah Minat...</option>
                    <template x-for="avail in availableCategories" :key="avail">
                      <option :value="avail" x-text="avail" x-show="!selectedCategories.includes(avail)"></option>
                    </template>
                  </select>
                  <input type="hidden" name="category" :value="selectedCategories.join(',')">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2" x-text="modalType === 'MATERI' ? 'PIC Pembuat Konten' : 'Pembuat Game'"></label>
                  <select name="idPembuat" :value="editProjectData?.idPembuat" required class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white">
                    <option value="">Pilih PIC</option>
                    <template x-if="modalType === 'GAME'">
                      <optgroup label="Pembuat Game">${pembuatOptions}</optgroup>
                    </template>
                    <template x-if="modalType === 'MATERI'">
                      <optgroup label="Pembuat Materi">${pembuatMateriOptions}</optgroup>
                    </template>
                  </select>
                </div>
                <div>
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">PIC Pakar</label>
                  <select name="idPakar" :value="editProjectData?.idPakar" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white">
                    <option value="">Pilih Pakar</option>
                    ${pakarOptions}
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                  <input type="date" name="deadline" :value="editProjectData?.deadline ? new Date(editProjectData.deadline).toISOString().split('T')[0] : ''" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold text-slate-700">
                </div>
                <div>
                  <label class="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Thumbnail (Opsional)</label>
                  <input type="file" id="thumbnailFile" name="thumbnailFile" accept="image/*" class="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1A237E] file:text-[#FFC107] hover:file:bg-indigo-900">
                </div>
              </div>
              <button type="submit" class="w-full bg-[#1A237E] text-[#FFC107] py-4 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-900 transition-all">
                <span x-text="editMode ? 'SIMPAN PERUBAHAN' : 'TUGASKAN PROYEK'"></span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    ${WordSearchEditorScript()}
    ${WordSearchGameScript()}
    ${CrosswordGameScript()}
  `;
};
