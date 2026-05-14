export const ProjectHeader = ({ projectVar = 'activeProject', showAuditLogVar = 'showAuditLog' }: { projectVar?: string; showAuditLogVar?: string } = {}) => {
  return `
    <div x-show="${projectVar}" class="bg-[#1A237E] rounded-[2.5rem] p-8 md:p-12 mb-10 shadow-2xl relative overflow-hidden border-b-8 border-[#FFC107]">
      <!-- Background Decorative Elements -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-[#FFC107]/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>

      <div class="relative z-10">
        <!-- Top Row: Badges & Preview Button -->
        <div class="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div class="flex flex-wrap gap-3">
            <span class="bg-[#FFC107] text-[#1A237E] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg" x-text="${projectVar}?.gameType"></span>
            <span class="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]" x-text="${projectVar}?.status.replace('_', ' ')"></span>
          </div>
          
          <button @click="previewGame()" class="bg-[#FFC107] text-[#1A237E] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all shadow-[0_8px_0_rgb(184,134,11)] active:shadow-none active:translate-y-2 flex items-center gap-3 group">
            <div class="bg-[#1A237E] text-[#FFC107] rounded-full p-1 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
            </div>
            SIMULASI GAME
          </button>
        </div>

        <!-- Middle Row: Title & Description -->
        <div class="mb-10">
          <h1 class="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight mb-4 leading-tight" x-text="${projectVar}?.title"></h1>
          <p class="text-blue-100/70 text-sm md:text-base font-medium italic leading-relaxed max-w-3xl" x-text="${projectVar}?.description"></p>
        </div>

        <!-- Bottom Row: Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-white/10">
          <!-- Instructions -->
          <div class="lg:col-span-2 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-[#FFC107]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span>
              <span class="text-xs md:text-sm font-medium text-[#FFC107] uppercase tracking-widest">Instruksi Pengerjaan</span>
            </div>
            <p class="text-white text-sm md:text-base font-medium leading-relaxed" x-text="${projectVar}?.instructions"></p>
          </div>

          <!-- PIC Info -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black border border-white/20 shadow-inner">P</div>
              <div>
                <div class="text-[10px] font-medium text-blue-300 uppercase tracking-widest mb-0.5">PIC PAKAR</div>
                <div class="text-white text-sm md:text-base font-medium uppercase tracking-tight" x-text="${projectVar}?.pakarName"></div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black border border-white/20 shadow-inner">G</div>
              <div>
                <div class="text-[10px] font-medium text-blue-300 uppercase tracking-widest mb-0.5">PIC PEMBUAT GAME</div>
                <div class="text-white text-sm md:text-base font-medium uppercase tracking-tight" x-text="${projectVar}?.pembuatName"></div>
              </div>
            </div>
          </div>

          <!-- Stats & History -->
          <div class="flex flex-col justify-between gap-4">
             <div class="flex items-center justify-between bg-[#FFC107]/10 p-4 rounded-2xl border border-[#FFC107]/20">
                <div>
                   <div class="text-[8px] font-black text-[#FFC107] uppercase tracking-widest mb-1">TOTAL SOAL</div>
                   <div class="text-2xl font-black text-white leading-none" x-text="questions.length"></div>
                </div>
                <div class="h-10 w-1 bg-[#FFC107] rounded-full opacity-30"></div>
                <div class="text-right">
                   <div class="text-[10px] font-medium text-[#FFC107] uppercase tracking-widest mb-1">REVISI TERAKHIR</div>
                   <div class="text-xs font-medium text-white" x-text="${projectVar}?.history?.length > 0 ? new Date(${projectVar}.history[0].createdAt).toLocaleDateString('id-ID') : '-'"></div>
                </div>
             </div>
             
             <button @click="${showAuditLogVar} = true" class="w-full py-3 bg-white/10 hover:bg-white text-white hover:text-[#1A237E] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/20 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                LOG AUDIT REVISI
             </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Audit Log Modal -->
    <div x-show="${showAuditLogVar}" x-cloak x-transition class="fixed inset-0 bg-[#1A237E]/60 backdrop-blur-md flex items-center justify-center z-[200] p-6">
      <div @click.away="${showAuditLogVar} = false" class="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white">
        <div class="bg-[#1A237E] p-8 text-white flex justify-between items-center border-b-8 border-[#FFC107]">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 bg-[#FFC107] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#1A237E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 class="text-xl font-black uppercase tracking-widest">History Log Audit</h3>
              <p class="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-1">Rekaman jejak revisi dan persetujuan</p>
            </div>
          </div>
          <button @click="${showAuditLogVar} = false" class="text-white/50 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar bg-slate-50">
          <template x-for="log in ${projectVar}?.history || []" :key="log.id">
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-[#1A237E] transition-all">
              <div class="absolute left-0 top-0 h-full w-2 transition-all group-hover:w-3" :class="log.statusGiven === 'ACCEPT' ? 'bg-green-500' : 'bg-orange-500'"></div>
              <div class="flex justify-between items-start mb-3">
                <div>
                  <div class="text-[10px] font-black uppercase tracking-[0.2em] mb-1" :class="log.statusGiven === 'ACCEPT' ? 'text-green-600' : 'text-orange-600'" x-text="log.statusGiven"></div>
                  <div class="text-sm font-black text-[#1A237E]" x-text="log.reviewerName"></div>
                </div>
                <div class="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full" x-text="new Date(log.createdAt).toLocaleString('id-ID')"></div>
              </div>
              <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-sm font-bold leading-relaxed" x-text="log.feedback || 'Tidak ada catatan tambahan.'"></div>
              <div class="mt-3 flex items-center gap-2">
                <span class="text-[8px] font-black text-slate-300 uppercase tracking-widest">Role Penilai:</span>
                <span class="text-[8px] font-black text-[#1A237E] bg-[#FFC107]/20 px-2 py-0.5 rounded" x-text="log.reviewerRole"></span>
              </div>
            </div>
          </template>
          
          <template x-if="!${projectVar}?.history || ${projectVar}?.history?.length === 0">
            <div class="text-center py-20">
               <div class="text-6xl mb-4 opacity-20">📜</div>
               <p class="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Belum ada rekaman log revisi untuk proyek ini.</p>
            </div>
          </template>
        </div>

        <div class="p-8 bg-white border-t border-slate-100 flex justify-center">
           <button @click="${showAuditLogVar} = false" class="bg-[#1A237E] text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-900 transition-all">TUTUP LOG</button>
        </div>
      </div>
    </div>
  `;
};
