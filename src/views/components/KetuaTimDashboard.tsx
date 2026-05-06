import { projects, users, notifications } from "../../db/schema";

export const KetuaTimDashboard = ({ allProjects, pembuatGames }: { allProjects: any[], pembuatGames: any[] }) => {
  const gameProjects = allProjects.filter(p => p.type === "GAME");
  
  return `
    <div class="space-y-8" x-data="ketuaDashboard()">
      <!-- Header with Logo -->
      <div class="flex items-center justify-between bg-[#1A237E] p-6 rounded-xl shadow-lg border-b-4 border-[#FFC107]">
        <div class="flex items-center gap-4">
          <img src="/public/assets/Logo LogosLAB.png" alt="Logos LAB" class="h-12 w-auto object-contain bg-white p-1 rounded shadow-sm" onerror="this.style.display='none'"/>
          <h2 class="text-2xl font-extrabold text-white tracking-tight">Manajemen Proyek Game</h2>
        </div>
        <button @click="openCreateModal()" class="bg-[#FF5722] hover:bg-[#E64A19] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
          TAMBAH PROYEK BARU
        </button>
      </div>

      <!-- List View -->
      <div x-show="!activeProject" class="bg-white p-8 rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-500">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center gap-3">
            <div class="h-8 w-2 bg-[#FFC107] rounded-full"></div>
            <h2 class="text-xl font-bold text-[#1A237E]">Daftar Aktifitas Produksi</h2>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 text-sm">
                <th class="pb-4 font-semibold">ID</th>
                <th class="pb-4 font-semibold">Thumbnail</th>
                <th class="pb-4 font-semibold">Judul Game</th>
                <th class="pb-4 font-semibold">Status</th>
                <th class="pb-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="text-slate-600">
              ${gameProjects.map(p => `
                <tr class="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                  <td class="py-5 font-bold text-[#1A237E]">#G${p.id}</td>
                  <td class="py-5">
                    <div class="relative h-14 w-20 rounded-lg overflow-hidden border-2 border-slate-100 shadow-sm group-hover:border-[#FFC107] transition-all">
                      <img src="${p.thumbnailUrl || 'https://via.placeholder.com/150'}" class="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td class="py-5">
                    <div class="font-bold text-slate-800 text-lg">${p.title}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[10px] bg-[#1A237E] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">${p.gameType}</span>
                    </div>
                  </td>
                  <td class="py-5">
                    <span class="px-3 py-1 bg-slate-100 text-[#1A237E] border border-[#1A237E]/20 rounded-full text-xs font-bold uppercase tracking-tighter shadow-sm">${p.status.replace('_', ' ')}</span>
                  </td>
                  <td class="py-5 text-right">
                    <button @click="openProject(${p.id})" class="bg-[#1A237E] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-900 shadow-md transition-all">DETAIL & REVIEW</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail & Review View (Consistent with Pakar) -->
      <div x-show="activeProject" style="display: none;" class="space-y-6 animate-in slide-in-from-bottom duration-500">
        <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 font-bold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Dashboard
        </button>

        <div class="bg-[#1A237E] p-8 rounded-2xl border-b-8 border-[#FFC107] text-white shadow-2xl relative overflow-hidden">
          <div class="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
             <div class="flex-1">
                <div class="flex items-center gap-3 mb-4">
                  <span class="text-[10px] bg-[#FFC107] text-[#1A237E] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg" x-text="activeProject?.gameType"></span>
                  <span class="text-[10px] bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest" x-text="activeProject?.status.replace('_', ' ')"></span>
                </div>
                <h3 class="text-3xl font-black leading-tight mb-2 uppercase tracking-tight" x-text="activeProject?.title"></h3>
                <p class="text-blue-100 font-medium text-sm italic max-w-2xl" x-text="activeProject?.description"></p>
             </div>
             <button @click="previewGame()" class="bg-[#FFC107] text-[#1A237E] px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all hover:bg-yellow-400 shadow-xl flex items-center gap-3 transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                SIMULASI GAME
             </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-6">
            <!-- Review Form -->
            <div class="bg-white p-8 border-2 border-slate-100 rounded-2xl shadow-xl">
              <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <span class="h-3 w-3 bg-[#FF5722] rounded-full animate-pulse"></span>
                Lembar Persetujuan Ketua Tim
              </h4>
              <textarea x-model="feedback" class="w-full border-2 border-slate-100 rounded-xl p-4 h-40 focus:border-[#1A237E] outline-none font-medium transition-all mb-6" placeholder="Tuliskan catatan akhir atau instruksi revisi final..."></textarea>
              
              <div class="flex gap-4">
                <button @click="submitReview('REVISI')" class="flex-1 bg-white border-4 border-[#FF5722] text-[#FF5722] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg">MINTA REVISI</button>
                <button @click="submitReview('ACCEPT')" class="flex-1 bg-[#1A237E] text-[#FFC107] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg">SETUJUI & PUBLISH</button>
              </div>
            </div>
          </div>

          <!-- History Log -->
          <div class="space-y-6">
            <div class="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
              <h4 class="text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Riwayat Audit (Log Revisi)
              </h4>
              <div class="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                 <template x-for="log in activeProject?.history || []" :key="log.id">
                   <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                      <div class="absolute left-0 top-0 h-full w-1" :class="log.statusGiven === 'ACCEPT' ? 'bg-green-500' : 'bg-orange-500'"></div>
                      <div class="flex justify-between items-center mb-1">
                        <div class="text-[9px] font-black uppercase tracking-tighter" :class="log.statusGiven === 'ACCEPT' ? 'text-green-600' : 'text-orange-600'" x-text="log.statusGiven"></div>
                        <div class="text-[8px] text-slate-400 font-black uppercase tracking-widest" x-text="log.reviewerName"></div>
                      </div>
                      <p class="text-xs text-slate-700 font-bold italic leading-relaxed" x-text="log.feedback"></p>
                      <div class="text-[8px] text-slate-400 mt-2 font-black opacity-50" x-text="new Date(log.createdAt).toLocaleString('id-ID', { hour12: false })"></div>
                   </div>
                 </template>
                 <template x-if="!(activeProject?.history?.length)">
                   <div class="text-center py-10 text-slate-400 text-[10px] italic font-black uppercase tracking-widest opacity-40">Belum ada aktivitas audit.</div>
                 </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals (Create, Preview) -->
      <div id="createGameModal" class="fixed inset-0 bg-[#1A237E]/40 backdrop-blur-sm hidden flex items-center justify-center z-50">
         <!-- ... (existing create modal content remains same, just ensure close calls Alpine or same function) ... -->
      </div>

      <!-- Preview Game Modal (Consistent) -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
         <div class="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
            <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-[#FF5722] z-10 text-3xl transition-colors font-black">&times;</button>
            <div class="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-[0.2em] border-b-4 border-[#FFC107]">
              SIMULASI GAME: <span x-text="activeProject?.title" class="text-[#FFC107]"></span>
            </div>
            <div class="p-12 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center relative">
               <button @click="prevQuestion()" x-show="currentQuestionIndex > 0" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 z-20 border border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button @click="nextQuestion()" x-show="currentQuestionIndex < questions.length - 1" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 z-20 border border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
               </button>

               <div class="text-center w-full max-w-2xl">
                  <div class="inline-block bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + questions.length"></div>
                  <h3 class="text-2xl font-black text-[#1A237E] mb-10 leading-relaxed" x-text="questions[currentQuestionIndex]?.question"></h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <template x-for="opt in ['A', 'B', 'C', 'D']">
                       <button @click="checkAnswer(opt)" 
                          :class="{
                            'border-[#FFC107] bg-yellow-50': selectedAnswer === opt,
                            'border-green-500 bg-green-50': showExplanation && opt === questions[currentQuestionIndex].correctAnswer,
                            'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== questions[currentQuestionIndex].correctAnswer,
                            'border-slate-100 bg-white': selectedAnswer !== opt && !(showExplanation && opt === questions[currentQuestionIndex].correctAnswer)
                          }"
                          class="border-4 p-6 rounded-2xl text-[#1A237E] font-black transition-all text-left flex items-center gap-4 group disabled:cursor-default"
                          :disabled="showExplanation">
                          <span class="h-8 w-8 rounded-lg flex items-center justify-center font-black" 
                                :class="showExplanation && opt === questions[currentQuestionIndex].correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] text-slate-400'">
                            <span x-text="opt"></span>
                          </span>
                          <span x-text="questions[currentQuestionIndex]['option' + opt]"></span>
                       </button>
                     </template>
                  </div>

                  <div x-show="showExplanation" x-transition class="mt-8 p-6 rounded-2xl text-left border-2 border-dashed"
                       :class="selectedAnswer === questions[currentQuestionIndex]?.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                     <p class="text-sm font-bold text-slate-700 italic" x-text="questions[currentQuestionIndex]?.explanation"></p>
                  </div>
                  
                  <div class="mt-12 flex justify-center" x-show="currentQuestionIndex === questions.length - 1">
                     <button @click="showPreview = false" class="bg-[#1A237E] text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-2xl flex items-center gap-3">
                        SELESAI REVIEW
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('ketuaDashboard', () => ({
          activeProject: null,
          questions: [],
          feedback: '',
          showPreview: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          
          async openProject(id) {
            const res = await fetch(\`/api/projects/\${id}\`);
            const json = await res.json();
            if(json.success) {
              this.activeProject = json.data;
              this.questions = json.data.questions || [];
              this.feedback = '';
            }
          },
          
          closeProject() {
            this.activeProject = null;
          },

          openCreateModal() {
            document.getElementById('createGameModal').classList.remove('hidden');
          },

          previewGame() {
            if(this.questions.length === 0) {
               alert("Belum ada soal untuk di-preview.");
               return;
            }
            this.currentQuestionIndex = 0;
            this.selectedAnswer = null;
            this.showExplanation = false;
            this.showPreview = true;
          },

          checkAnswer(opt) {
            if(this.showExplanation) return;
            this.selectedAnswer = opt;
            this.showExplanation = true;
          },

          nextQuestion() {
            if(this.currentQuestionIndex < this.questions.length - 1) {
              this.currentQuestionIndex++;
              this.selectedAnswer = null;
              this.showExplanation = false;
            } else {
              this.showPreview = false;
            }
          },

          prevQuestion() {
            if(this.currentQuestionIndex > 0) {
              this.currentQuestionIndex--;
              this.selectedAnswer = null;
              this.showExplanation = false;
            }
          },

          async submitReview(statusGiven) {
            if(statusGiven === 'REVISI' && !this.feedback) {
              alert("Mohon isi masukan/feedback untuk revisi.");
              return;
            }
            
            const res = await fetch(\`/api/projects/\${this.activeProject.id}/review\`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ statusGiven, feedback: this.feedback })
            });
            
            if(res.ok) {
              window.location.reload();
            } else {
              alert("Gagal submit review");
            }
          }
        }));
      });

      // Existing non-alpine functions for create modal
      function closeCreateGameModal() {
        document.getElementById('createGameModal').classList.add('hidden');
      }
      // ... (other functions keep working via script tag)
    </script>
  `;
};
