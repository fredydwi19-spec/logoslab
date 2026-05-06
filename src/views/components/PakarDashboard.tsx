import { projects } from "../../db/schema";

export const PakarDashboard = ({ myProjects }: { myProjects: any[] }) => {
  return `
    <div class="bg-white p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" x-data="pakarDashboard()">
      <div class="bg-[#1A237E] p-6 border-b-4 border-[#FFC107] flex items-center justify-between">
        <h2 class="text-xl font-black text-white uppercase tracking-widest">Audit & Kurasi Konten</h2>
        <div class="flex items-center gap-2">
           <span class="text-[10px] font-black text-[#FFC107] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">Expert Access Enabled</span>
        </div>
      </div>
      
      <div class="p-8">
        <h2 x-show="!activeProject" class="text-lg font-bold text-[#1A237E] mb-6 flex items-center gap-2 uppercase tracking-tighter">
          <span class="h-5 w-1 bg-[#FFC107] rounded-full"></span>
          Antrean Review Proyek
        </h2>
      
      <div x-show="!activeProject" class="flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
        <div class="flex space-x-2">
          <button @click="tab = 'REVIEW'" :class="tab === 'REVIEW' ? 'bg-[#1A237E] text-white' : 'bg-white text-slate-500 border-2 border-slate-100'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm">BUTUH REVIEW</button>
          <button @click="tab = 'REVISI'" :class="tab === 'REVISI' ? 'bg-[#FF5722] text-white' : 'bg-white text-slate-500 border-2 border-slate-100'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm">DALAM REVISI</button>
          <button @click="tab = 'ACCEPT'" :class="tab === 'ACCEPT' ? 'bg-green-600 text-white' : 'bg-white text-slate-500 border-2 border-slate-100'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm">TERPUBLIKASI</button>
        </div>
        <div class="relative w-full md:w-64">
          <input type="text" x-model="search" placeholder="Cari Judul Proyek..." class="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-[#FFC107] outline-none font-bold shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute right-3 top-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <!-- List View -->
      <div x-show="!activeProject" class="overflow-x-auto">
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
            ${myProjects.map(p => `
              <tr x-show="isVisible('${p.status}', '${p.title.replace(/'/g, "\\'")}')" class="border-b border-slate-50 hover:bg-blue-50/50 transition-all group">
                <td class="py-5 font-bold text-[#1A237E]">#G${p.id}</td>
                <td class="py-5 font-black text-slate-800 text-base group-hover:text-[#1A237E] transition-colors">${p.title}</td>
                <td class="py-5">
                   <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-black uppercase tracking-wider border border-slate-200">${p.gameType}</span>
                </td>
                <td class="py-5">
                  <span class="px-3 py-1 bg-[#1A237E]/5 text-[#1A237E] border border-[#1A237E]/20 rounded-full text-[10px] font-black uppercase tracking-tighter">${p.status.replace('_', ' ')}</span>
                </td>
                <td class="py-5 text-right">
                  <button @click="openProject(${p.id})" class="bg-[#FF5722] text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-[#E64A19] transition-all shadow-md transform hover:scale-105 uppercase tracking-widest flex items-center gap-2 ml-auto">
                    AUDIT KONTEN
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Detail & Review View -->
      <div x-show="activeProject" style="display: none;" class="space-y-6">
        <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center">
          ← Kembali
        </button>

        <div class="bg-[#1A237E] p-8 rounded-2xl border-b-8 border-[#FFC107] text-white shadow-2xl relative overflow-hidden">
          <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>
          <div class="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
             <div class="flex-1">
                <div class="flex items-center gap-3 mb-4">
                  <span class="text-[10px] bg-[#FFC107] text-[#1A237E] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg" x-text="activeProject?.gameType"></span>
                  <span class="text-[10px] bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest" x-text="activeProject?.status.replace('_', ' ')"></span>
                </div>
                <h3 class="text-3xl font-black leading-tight mb-2 uppercase tracking-tight" x-text="activeProject?.title"></h3>
                <p class="text-blue-100 font-medium text-sm italic max-w-2xl" x-text="activeProject?.description"></p>
                <div class="mt-6 flex items-center gap-6">
                   <div class="flex flex-col">
                      <span class="text-[10px] text-blue-300 font-black uppercase tracking-widest">Total Soal</span>
                      <span class="text-xl font-black text-[#FFC107]" x-text="questions.length"></span>
                   </div>
                   <div class="h-10 w-px bg-white/20"></div>
                   <div class="flex flex-col">
                      <span class="text-[10px] text-blue-300 font-black uppercase tracking-widest">PIC Produksi</span>
                      <span class="text-sm font-black text-white" x-text="activeProject?.idPembuat"></span>
                   </div>
                </div>
             </div>
             <div class="flex flex-col gap-3">
                <button @click="previewGame()" class="bg-[#FFC107] text-[#1A237E] px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all hover:bg-yellow-400 shadow-xl flex items-center gap-3 transform hover:scale-105 active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  SIMULASI GAME
                </button>
             </div>
          </div>
        </div>

        <template x-if="activeProject?.status === 'REVIEW_PAKAR' || activeProject?.status === 'DRAFT' || activeProject?.status === 'REVISI_PAKAR'">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-white p-8 border-2 border-slate-100 rounded-2xl shadow-xl">
                <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <span class="h-3 w-3 bg-[#FF5722] rounded-full animate-pulse"></span>
                  Lembar Evaluasi Pakar
                </h4>
                <div class="space-y-6">
                  <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justifikasi & Feedback Edukatif</label>
                    <textarea x-model="feedback" class="w-full border-2 border-slate-100 rounded-xl p-4 h-40 focus:border-[#1A237E] outline-none font-medium transition-all shadow-inner" placeholder="Tuliskan catatan teknis atau instruksi revisi secara mendalam di sini..."></textarea>
                  </div>
                  <div class="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                     <button @click="submitReview('REVISI')" class="flex-1 bg-white border-4 border-[#FF5722] text-[#FF5722] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg active:translate-y-1">MINTA REVISI</button>
                     <button @click="submitReview('ACCEPT')" class="flex-1 bg-[#1A237E] text-[#FFC107] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-200 active:translate-y-1">VERIFIKASI & SETUJUI</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Side Log -->
            <div class="space-y-6">
              <div class="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                <h4 class="text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-4 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Riwayat Audit
                </h4>
                <div class="space-y-4 max-h-96 overflow-y-auto pr-2">
                   <template x-for="log in activeProject?.history || []" :key="log.id">
                     <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                      <div class="absolute left-0 top-0 h-full w-1" :class="log.statusGiven === 'ACCEPT' ? 'bg-green-500' : 'bg-orange-500'"></div>
                      <div class="flex justify-between items-center mb-1">
                        <div class="text-[9px] font-black uppercase tracking-tighter" :class="log.statusGiven === 'ACCEPT' ? 'text-green-600' : 'text-orange-600'" x-text="log.statusGiven"></div>
                        <div class="text-[8px] text-slate-400 font-black uppercase tracking-widest" x-text="log.reviewerName"></div>
                      </div>
                      <p class="text-xs text-slate-600 font-bold italic leading-relaxed" x-text="log.feedback"></p>
                      <div class="text-[8px] text-slate-400 mt-2 font-black opacity-50" x-text="new Date(log.createdAt).toLocaleString('id-ID', { hour12: false })"></div>
                   </div>
                   </template>
                   <template x-if="!(activeProject?.history?.length)">
                     <div class="text-center py-6 text-slate-400 text-xs italic font-medium">Belum ada riwayat audit.</div>
                   </template>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Preview Game Modal -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
         <div class="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
            <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-[#FF5722] z-10 text-3xl transition-colors font-black">&times;</button>
            <div class="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-[0.2em] border-b-4 border-[#FFC107]">
              SIMULASI GAME: <span x-text="activeProject?.title" class="text-[#FFC107]"></span>
            </div>
            <div class="p-12 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center relative">
               <!-- Navigation Arrows -->
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

                  <!-- Explanation Box -->
                  <div x-show="showExplanation" x-transition class="mt-8 p-6 rounded-2xl text-left border-2 border-dashed"
                       :class="selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                     <div class="flex items-center gap-3 mb-2">
                        <template x-if="selectedAnswer === questions[currentQuestionIndex].correctAnswer">
                           <span class="bg-green-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <template x-if="selectedAnswer !== questions[currentQuestionIndex].correctAnswer">
                           <span class="bg-red-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <span class="font-black text-xs uppercase tracking-widest" :class="selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 'text-green-800' : 'text-red-800'" x-text="selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 'Jawaban Benar!' : 'Jawaban Salah!'"></span>
                     </div>
                     <p class="text-sm font-bold text-slate-700 italic" x-text="questions[currentQuestionIndex].explanation"></p>
                  </div>

                  <div class="mt-12 flex justify-center" x-show="currentQuestionIndex === questions.length - 1">
                     <button @click="showPreview = false" class="bg-[#1A237E] text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-2xl flex items-center gap-3 transform hover:scale-110">
                        SELESAI REVIEW
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFC107]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
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
        Alpine.data('pakarDashboard', () => ({
          tab: 'REVIEW',
          search: '',
          activeProject: null,
          questions: [],
          feedback: '',
          showPreview: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          
          isVisible(status, title) {
            let show = false;
            if(this.tab === 'REVIEW') show = ['DRAFT', 'REVIEW_PAKAR'].includes(status);
            if(this.tab === 'REVISI') show = ['REVISI_PAKAR'].includes(status);
            if(this.tab === 'ACCEPT') show = ['ACCEPTED_PAKAR', 'REVIEW_KETUA', 'REVISI_KETUA', 'PUBLISHED'].includes(status);
            
            if(this.search && show) {
              show = title.toLowerCase().includes(this.search.toLowerCase());
            }
            return show;
          },
          
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
               this.currentQuestionIndex = 0;
               this.selectedAnswer = null;
               this.showExplanation = false;
               this.showPreview = false;
            }
          },

          prevQuestion() {
            if(this.currentQuestionIndex > 0) {
              this.currentQuestionIndex--;
              this.selectedAnswer = null;
              this.showExplanation = false;
            }
          }
        }));
      });
    </script>
  `;
};
