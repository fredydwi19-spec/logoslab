export const ReviewerElearning = () => {
  return `
    <div x-show="showElearningReviewer" style="display: none;" class="fixed inset-0 bg-slate-50 z-[100] flex flex-col h-screen overflow-hidden">
      <!-- Top Bar -->
      <div class="bg-[#1A237E] p-4 flex justify-between items-center text-white border-b-4 border-[#FFC107] shrink-0">
        <div class="flex items-center gap-4">
          <button @click="showElearningReviewer = false" class="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <span class="text-[10px] font-black bg-[#FFC107] text-[#1A237E] px-2 py-1 rounded-md uppercase tracking-widest mr-2">Mode Review</span>
            <span class="font-black text-lg uppercase tracking-widest" x-text="activeProject?.title"></span>
          </div>
        </div>
      </div>

      <!-- Split Screen Grid -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        <!-- Kolom Kiri: Reader Konten -->
        <div class="flex-[2] bg-slate-100 p-4 md:p-6 overflow-y-auto border-r border-slate-300">
          <div class="max-w-4xl mx-auto space-y-6">
            
            <template x-if="activeProject?.materiType === 'MANUAL'">
              <div class="space-y-6">
                 <template x-for="(section, idx) in activeProject?.materialSections || []" :key="idx">
                    <div class="bg-white rounded-2xl shadow-md p-6 md:p-8 border-l-4 border-[#FFC107]">
                       <h2 class="text-xl font-bold text-[#1A237E] mb-4" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                       <div class="text-slate-700 leading-relaxed font-medium text-sm md:text-base whitespace-pre-wrap" x-html="applyTooltips(section.content)"></div>
                    </div>
                 </template>
              </div>
            </template>

            <template x-if="activeProject?.materiType !== 'MANUAL'">
              <div class="space-y-6">
                <template x-for="content in materiContents">
                  <div class="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                    <template x-if="content.contentType === 'IMAGE'">
                      <img :src="content.fileUrl" class="w-full h-auto object-contain" />
                    </template>
                    <template x-if="content.contentType === 'PDF' || content.contentType === 'PPT'">
                      <iframe :src="content.fileUrl" class="w-full h-[75vh] border-0"></iframe>
                    </template>
                    <template x-if="content.contentType === 'VIDEO'">
                      <video :src="content.fileUrl" controls class="w-full h-auto bg-black"></video>
                    </template>
                    <template x-if="content.contentType === 'EMBED_URL'">
                      <iframe :src="content.fileUrl" class="w-full h-[500px] border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </template>
                  </div>
                </template>
              </div>
            </template>

          </div>
        </div>

        <!-- Kolom Kanan: Form Umpan Balik -->
        <div class="flex-1 bg-white p-6 flex flex-col overflow-y-auto shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] z-10">
          <h3 class="font-black text-[#1A237E] uppercase tracking-widest mb-6 flex items-center gap-2 text-lg">
            <span class="h-4 w-4 bg-[#FF5722] rounded-full animate-pulse"></span>
            Form Evaluasi
          </h3>

          <template x-if="['REVIEW_PAKAR', 'REVISI_PAKAR'].includes(activeProject?.status)">
            <div class="flex-1 flex flex-col">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan / Instruksi Revisi</label>
              <textarea x-model="feedback" class="w-full flex-1 min-h-[200px] border-2 border-slate-200 rounded-xl p-4 focus:border-[#1A237E] outline-none font-medium text-sm transition-all mb-6 shadow-inner resize-none bg-slate-50" placeholder="Tulis masukan di sini..."></textarea>
              
              <div class="space-y-3 mt-auto">
                <button @click="submitElearningReview('REVISI')" class="w-full bg-white border-4 border-[#FF5722] text-[#FF5722] px-4 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-md flex justify-center items-center gap-2">
                  <i class="bi bi-x-circle"></i> MINTA REVISI
                </button>
                <button @click="submitElearningReview('ACCEPT')" class="w-full bg-[#1A237E] text-[#FFC107] px-4 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-md flex justify-center items-center gap-2">
                  <i class="bi bi-check-circle"></i> SETUJUI (PUBLISH)
                </button>
              </div>
            </div>
          </template>

          <template x-if="!['REVIEW_PAKAR', 'REVISI_PAKAR'].includes(activeProject?.status)">
            <div class="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div class="text-4xl mb-4">✅</div>
              <p class="text-slate-500 font-bold text-sm leading-relaxed">
                Materi ini berstatus <span class="text-[#1A237E] uppercase font-black" x-text="activeProject?.status.replace(/_/g, ' ')"></span>.<br>Tidak ada tindakan review yang diperlukan.
              </p>
            </div>
          </template>

        </div>

      </div>
    </div>
  `;
};
