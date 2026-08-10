export const MemberAchievements = () => {
  return `
    <div class="space-y-10" x-data="memberAchievementsData()" x-init="init()">
      
      <!-- Top Row: Badge Collection -->
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
         <h2 class="text-xl md:text-2xl font-bold text-[#1A237E] mb-6 flex items-center gap-2">
            <i class="bi bi-award-fill text-[#FFC107]"></i> Koleksi Lencana
         </h2>
         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <!-- Dynamic Badges -->
            <template x-for="badge in achievements.dynamicBadges" :key="badge.rank">
               <div class="bg-[#1A237E] text-[#FFC107] border-2 border-[#FFC107] rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform shadow-lg relative group">
                  <div class="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">RANK</div>
                  <i :class="'bi bi-' + badge.rank + '-circle-fill text-4xl drop-shadow-md mb-2'"></i>
                  <p class="text-xs font-black uppercase tracking-widest">Global Top <span x-text="badge.rank"></span></p>
               </div>
            </template>

            <!-- Milestone Badges -->
            <template x-for="badge in achievements.milestoneBadges" :key="badge.name">
               <div :class="badge.locked ? 'bg-slate-50 border border-dashed border-slate-200 text-slate-400 opacity-70 group relative cursor-help' : 'bg-[#1A237E]/5 text-emerald-600 border-2 border-emerald-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform shadow-md'">
                  <div class="flex flex-col items-center justify-center p-4 w-full h-full text-center">
                     <template x-if="badge.locked">
                        <i class="bi bi-lock-fill text-4xl text-slate-300 mb-2"></i>
                     </template>
                     <template x-if="!badge.locked">
                        <i class="bi bi-shield-check text-4xl drop-shadow-md mb-2"></i>
                     </template>
                     <p class="text-xs font-black uppercase tracking-widest leading-tight" x-text="badge.name.replace(/_/g, ' ')"></p>
                     
                     <template x-if="badge.locked">
                        <div class="absolute inset-0 bg-[#1A237E] text-white text-[10px] font-bold p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                           <span x-text="badge.description"></span>
                        </div>
                     </template>
                  </div>
               </div>
            </template>
         </div>
      </div>

      <!-- Middle Row: 5 Linear Progress Bars -->
      <div class="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
         <h2 class="text-xl md:text-2xl font-bold text-[#1A237E] mb-6 flex items-center gap-2">
            <i class="bi bi-bar-chart-line-fill text-[#FFC107]"></i> Progres Kompetensi
         </h2>
         <div class="space-y-6">
            <template x-for="prog in achievements.competencyProgress" :key="prog.category">
               <div class="space-y-2">
                  <div class="flex justify-between items-center">
                     <span class="text-sm md:text-base font-bold text-[#1A237E] uppercase tracking-wider" x-text="prog.category"></span>
                     <span class="text-xs md:text-sm font-black text-slate-400" x-text="prog.percentage + '%'"></span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-3 md:h-4 overflow-hidden">
                     <div class="bg-[#FFC107] h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" :style="'width: ' + prog.percentage + '%'">
                        <div class="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                     </div>
                  </div>
               </div>
            </template>
            <template x-if="achievements.competencyProgress.length === 0">
               <p class="text-slate-400 text-sm font-bold text-center py-4">Belum ada data progres kompetensi.</p>
            </template>
         </div>
      </div>

      <!-- Bottom Row: Datatables (Grid Bimodal) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         <!-- Game History -->
         <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <h2 class="text-lg md:text-xl font-bold text-[#1A237E] mb-4 flex items-center gap-2 border-b-2 border-slate-50 pb-4">
               <i class="bi bi-controller text-indigo-500"></i> Riwayat Game
            </h2>
            <div class="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
               <div class="space-y-3">
                  <template x-for="game in achievements.gameHistory" :key="game.date">
                     <div class="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100 group">
                        <div class="flex items-start gap-3">
                           <div class="mt-1">
                              <template x-if="game.isPassed">
                                 <i class="bi bi-check-circle-fill text-green-500 text-xl drop-shadow-sm"></i>
                              </template>
                              <template x-if="!game.isPassed">
                                 <i class="bi bi-exclamation-triangle-fill text-orange-500 text-xl drop-shadow-sm"></i>
                              </template>
                           </div>
                           <div>
                              <h4 class="text-sm md:text-base font-bold text-[#1A237E] line-clamp-1" x-text="game.title"></h4>
                              <p class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                 <span x-text="new Date(game.date).toLocaleDateString('id-ID')"></span>
                              </p>
                           </div>
                        </div>
                        <div class="flex items-center gap-4">
                           <div class="text-right">
                              <p class="text-[10px] font-black uppercase text-slate-400">Skor</p>
                              <p :class="game.isPassed ? 'text-lg font-black text-green-600' : 'text-lg font-black text-orange-600'" x-text="game.score"></p>
                           </div>
                           <button @click="window.triggerPublicGame(game.gameId)" class="p-2 md:p-3 rounded-full bg-slate-100 hover:bg-[#1A237E] text-[#1A237E] hover:text-[#FFC107] transition-colors group/btn">
                              <i class="bi bi-arrow-clockwise text-lg group-hover/btn:rotate-180 transition-transform duration-500 block"></i>
                           </button>
                        </div>
                     </div>
                  </template>
                  <template x-if="achievements.gameHistory.length === 0">
                     <div class="text-center py-10">
                        <i class="bi bi-controller text-4xl text-slate-200 mb-2"></i>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Belum ada game yang dimainkan</p>
                     </div>
                  </template>
               </div>
            </div>
         </div>

         <!-- Material History -->
         <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <h2 class="text-lg md:text-xl font-bold text-[#1A237E] mb-4 flex items-center gap-2 border-b-2 border-slate-50 pb-4">
               <i class="bi bi-book-half text-emerald-500"></i> Riwayat Materi
            </h2>
            <div class="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
               <div class="space-y-3">
                  <template x-for="mat in achievements.materialHistory" :key="mat.date">
                     <div class="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100">
                        <div class="flex items-start gap-3">
                           <div class="mt-1">
                              <i class="bi bi-journal-text text-[#1A237E] text-xl drop-shadow-sm"></i>
                           </div>
                           <div>
                              <h4 class="text-sm md:text-base font-bold text-[#1A237E] line-clamp-1" x-text="mat.title"></h4>
                              <div class="flex items-center gap-2 mt-1">
                                 <i class="bi bi-clock-history text-slate-400 text-[10px]"></i>
                                 <span class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest" x-text="mat.timeSpentMinutes + ' Menit'"></span>
                              </div>
                           </div>
                        </div>
                        <div class="text-right">
                           <template x-if="mat.isCompleted">
                              <span class="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                                 <i class="bi bi-check2-circle"></i> Tuntas
                              </span>
                           </template>
                           <template x-if="!mat.isCompleted">
                              <span class="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md italic">
                                 <i class="bi bi-eye"></i> Dibaca Sekilas
                              </span>
                           </template>
                        </div>
                     </div>
                  </template>
                  <template x-if="achievements.materialHistory.length === 0">
                     <div class="text-center py-10">
                        <i class="bi bi-journal-x text-4xl text-slate-200 mb-2"></i>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Belum ada materi yang dibaca</p>
                     </div>
                  </template>
               </div>
            </div>
         </div>

      </div>
    </div>
    
    <style>
      @keyframes shimmer {
         0% { transform: translateX(-100%); }
         100% { transform: translateX(100%); }
      }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
    </style>

    <script>
      window.memberAchievementsData = function() {
        return {
          achievements: {
            dynamicBadges: [],
            milestoneBadges: [],
            competencyProgress: [],
            gameHistory: [],
            materialHistory: []
          },
          async init() {
            try {
              const res = await fetch('/api/dashboard/achievements');
              const json = await res.json();
              if (json.success) {
                this.achievements = json.data;
              }
            } catch (e) {
              console.error('Failed to fetch achievements', e);
            }
          }
        };
      };
    </script>
  `;
};
