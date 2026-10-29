export const DuelHubPage = ({ username, userId }: { username: string; userId: number }) => {
  return `
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('duelHub', function() {
          return {
            loading: true,
            duels: [],
            error: '',
            
            init: async function() {
              try {
                const res = await fetch('/api/duels/my-duels', { credentials: 'include' });
                const json = await res.json();
                if(json.success) {
                  this.duels = json.data;
                } else {
                  this.error = json.error;
                }
              } catch(e) {
                this.error = 'Failed to load duels';
              } finally {
                this.loading = false;
              }
            },
            
            get waitingDuels() {
              return this.duels.filter(d => d.status === 'WAITING_OPPONENT' && d.challengerId === ${userId});
            },
            
            get historyDuels() {
              return this.duels.filter(d => d.status === 'COMPLETED' || (d.status === 'WAITING_OPPONENT' && d.opponentId === ${userId}));
            },
            
            copyLink: function(id) {
              const url = window.location.origin + '/duel/' + id;
              navigator.clipboard.writeText(url);
              alert('Link disalin: ' + url);
            }
          }
        });
      });
    </script>
    
    <div x-data="duelHub()" class="space-y-6">
      <div class="bg-gradient-to-r from-[#1A237E] to-blue-800 rounded-[2rem] p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 class="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">⚔️ Buat Tantangan Duel Baru</h2>
          <p class="text-blue-200">Mainkan game publik, selesaikan, dan tantang temanmu!</p>
        </div>
        <a href="/dashboard/games" class="bg-[#FFC107] text-[#1A237E] px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-lg whitespace-nowrap">
          Cari Kuis & Tantang
        </a>
      </div>
      
      <!-- Tabs -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Waiting -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span class="bg-orange-100 text-orange-500 h-10 w-10 flex items-center justify-center rounded-xl text-xl">⏳</span> 
            Menunggu Lawan
          </h3>
          
          <template x-if="loading">
             <div class="text-center py-8 text-slate-400 animate-pulse font-bold tracking-widest uppercase text-xs">Memuat data...</div>
          </template>
          
          <div class="space-y-4" x-show="!loading">
            <template x-for="duel in waitingDuels" :key="duel.id">
              <div class="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 flex justify-between items-center group hover:border-[#1A237E]/30 transition-colors">
                <div>
                  <p class="font-bold text-base text-[#1A237E]" x-text="duel.quizTitle"></p>
                  <p class="text-xs text-slate-500 mt-1 font-medium">Skormu: <span class="font-bold text-[#FF5722]" x-text="duel.challengerScore"></span></p>
                </div>
                <button @click="copyLink(duel.id)" class="px-4 py-2 bg-white border border-slate-200 hover:bg-[#1A237E] hover:text-white hover:border-[#1A237E] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm">
                  Salin Link
                </button>
              </div>
            </template>
            <template x-if="waitingDuels.length === 0">
               <div class="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                 Tidak ada duel yang menunggu lawan.
               </div>
            </template>
          </div>
        </div>

        <!-- History -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span class="bg-green-100 text-green-500 h-10 w-10 flex items-center justify-center rounded-xl text-xl">📜</span> 
            Riwayat Duel
          </h3>
          
          <template x-if="loading">
             <div class="text-center py-8 text-slate-400 animate-pulse font-bold tracking-widest uppercase text-xs">Memuat data...</div>
          </template>
          
          <div class="space-y-4" x-show="!loading">
            <template x-for="duel in historyDuels" :key="duel.id">
              <div class="p-5 rounded-2xl border-2 flex justify-between items-center" :class="duel.winnerId === ${userId} ? 'bg-green-50 border-green-200' : (duel.winnerId ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200')">
                <div>
                  <p class="font-bold text-base text-slate-800" x-text="duel.quizTitle"></p>
                  <p class="text-xs mt-1 font-bold tracking-widest uppercase" :class="duel.winnerId === ${userId} ? 'text-green-600' : (duel.winnerId ? 'text-red-500' : 'text-slate-500')">
                    <span x-show="duel.winnerId === ${userId}">👑 Kamu Menang!</span>
                    <span x-show="duel.winnerId !== ${userId} && duel.winnerId !== null">Kalah</span>
                    <span x-show="duel.winnerId === null">Seri!</span>
                  </p>
                </div>
                <div class="text-right">
                   <p class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Skor Kamu</p>
                   <p class="font-black text-xl" :class="duel.winnerId === ${userId} ? 'text-green-700' : 'text-slate-700'" x-text="duel.challengerId === ${userId} ? duel.challengerScore : duel.opponentScore"></p>
                </div>
              </div>
            </template>
            <template x-if="historyDuels.length === 0">
               <div class="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                 Belum ada riwayat duel.
               </div>
            </template>
          </div>
        </div>

      </div>
    </div>
  `;
}
