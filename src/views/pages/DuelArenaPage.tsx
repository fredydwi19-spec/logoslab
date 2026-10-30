export const DuelArenaPage = ({ duelId, currentUser }: { duelId: string; currentUser: any }) => {
  return `
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('duelArena', function() {
          return {
            loading: true,
            duel: null,
            error: '',
            
            init: async function() {
              try {
                const res = await fetch('/api/duels/${duelId}');
                const json = await res.json();
                if(json.success) {
                  this.duel = json.data;
                } else {
                  this.error = json.error;
                }
              } catch(e) {
                this.error = 'Gagal memuat duel';
              } finally {
                this.loading = false;
              }
            }
          }
        });
      });
    </script>
    
    <div x-data="duelArena()" class="max-w-4xl mx-auto py-12 px-6 h-full overflow-y-auto">
      <template x-if="loading">
        <div class="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">Memuat arena...</div>
      </template>
      
      <template x-if="error">
        <div class="text-center py-20">
           <div class="inline-block bg-red-100 text-red-600 px-6 py-4 rounded-2xl font-bold" x-text="error"></div>
        </div>
      </template>
      
      <template x-if="!loading && duel">
        <div class="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white">
          <div class="bg-gradient-to-r from-primary to-blue-800 p-8 text-center text-white relative overflow-hidden">
            <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            <h1 class="relative z-10 text-3xl font-black uppercase tracking-widest text-highlight drop-shadow-md">Arena Duel</h1>
            <p class="relative z-10 text-blue-100 mt-2 font-medium" x-text="duel.quizTitle"></p>
          </div>
          
          <div class="p-8 md:p-12">
            <div class="flex justify-between items-center relative">
              <!-- Challenger -->
              <div class="flex flex-col items-center w-1/3 z-10">
                <div class="relative">
                  <div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-200 overflow-hidden ring-8 ring-blue-50 shadow-2xl">
                    <template x-if="duel.challenger?.avatarUrl">
                       <img :src="duel.challenger.avatarUrl" class="w-full h-full object-cover"/>
                    </template>
                    <template x-if="!duel.challenger?.avatarUrl">
                       <div class="w-full h-full flex items-center justify-center bg-primary text-white font-black text-4xl" x-text="duel.challenger?.name.charAt(0)"></div>
                    </template>
                  </div>
                  <template x-if="duel.status === 'COMPLETED' && duel.winnerId === duel.challengerId">
                    <div class="absolute -top-6 -right-4 text-5xl md:text-6xl transform rotate-12 drop-shadow-xl filter">👑</div>
                  </template>
                </div>
                <h3 class="mt-6 font-black text-xl text-primary text-center" x-text="duel.challenger?.name"></h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Penantang</p>
                
                <template x-if="duel.status === 'COMPLETED'">
                   <div class="mt-6 text-center bg-blue-50 px-6 py-3 rounded-2xl border-2 border-blue-100">
                     <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Skor</p>
                     <p class="text-4xl font-black text-primary" x-text="duel.challengerScore"></p>
                   </div>
                </template>
              </div>
              
              <!-- VS -->
              <div class="flex flex-col items-center justify-center w-1/3 absolute left-1/2 transform -translate-x-1/2 z-20">
                <div class="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-accent to-orange-500 rounded-full flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-2xl transform -rotate-12 border-4 border-white">
                  VS
                </div>
              </div>
              
              <!-- Opponent -->
              <div class="flex flex-col items-center w-1/3 z-10">
                <template x-if="duel.opponent">
                  <div class="relative">
                    <div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-200 overflow-hidden ring-8 ring-orange-50 shadow-2xl">
                      <template x-if="duel.opponent?.avatarUrl">
                         <img :src="duel.opponent.avatarUrl" class="w-full h-full object-cover"/>
                      </template>
                      <template x-if="!duel.opponent?.avatarUrl">
                         <div class="w-full h-full flex items-center justify-center bg-accent text-white font-black text-4xl" x-text="duel.opponent?.name.charAt(0)"></div>
                      </template>
                    </div>
                    <template x-if="duel.status === 'COMPLETED' && duel.winnerId === duel.opponentId">
                      <div class="absolute -top-6 -right-4 text-5xl md:text-6xl transform rotate-12 drop-shadow-xl filter">👑</div>
                    </template>
                  </div>
                </template>
                <template x-if="!duel.opponent">
                  <div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-50 border-4 border-dashed border-slate-300 flex items-center justify-center text-4xl text-slate-300 shadow-inner">
                    ?
                  </div>
                </template>
                
                <h3 class="mt-6 font-black text-xl text-slate-800 text-center" :class="!duel.opponent ? 'opacity-50' : ''" x-text="duel.opponent ? duel.opponent.name : 'Menunggu...'"></h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lawan</p>
                
                <template x-if="duel.status === 'COMPLETED'">
                   <div class="mt-6 text-center bg-orange-50 px-6 py-3 rounded-2xl border-2 border-orange-100">
                     <p class="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Skor</p>
                     <p class="text-4xl font-black text-accent" x-text="duel.opponentScore"></p>
                   </div>
                </template>
              </div>
            </div>
            
            <div class="mt-16 text-center">
              <template x-if="duel.status === 'WAITING_OPPONENT'">
                <div>
                  <template x-if="duel.challengerId === ${currentUser?.id || 'null'}">
                    <div class="bg-blue-50 text-primary p-6 rounded-2xl border-2 border-blue-100 max-w-lg mx-auto">
                      <p class="font-bold mb-4 text-lg">Menunggu lawan untuk menerima tantanganmu!</p>
                      <button @click="navigator.clipboard.writeText(window.location.href); alert('Link disalin!')" class="bg-white border-2 border-primary text-primary px-6 py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
                        Salin Link Tantangan
                      </button>
                    </div>
                  </template>
                  <template x-if="duel.challengerId !== ${currentUser?.id || 'null'}">
                    <div>
                      <p class="text-xl font-bold text-slate-700 mb-6">Kamu ditantang oleh <span class="text-primary" x-text="duel.challenger?.name"></span>!</p>
                      ${currentUser ? `
                        <a :href="'/play/' + duel.quizId + '?duel=' + duel.id" class="inline-block bg-accent hover:bg-accent-hover text-white px-10 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                          Mulai Duel! ⚔️
                        </a>
                      ` : `
                        <a href="/login" class="inline-block bg-primary text-white px-10 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all">
                          Login untuk Menerima Duel
                        </a>
                      `}
                    </div>
                  </template>
                </div>
              </template>
              
              <template x-if="duel.status === 'COMPLETED'">
                <div class="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 max-w-xl mx-auto">
                  <h2 class="text-3xl font-black text-primary mb-4 uppercase tracking-widest">Pertandingan Selesai!</h2>
                  
                  <template x-if="duel.winnerId === ${currentUser?.id || 'null'}">
                    <p class="text-xl font-bold text-green-600">🎉 Selamat! Kamu memenangkan duel ini.</p>
                  </template>
                  <template x-if="duel.winnerId !== ${currentUser?.id || 'null'} && duel.winnerId !== null">
                    <p class="text-xl font-bold text-slate-600">Sayang sekali, <span class="text-primary" x-text="duel.winner?.name"></span> memenangkan duel ini.</p>
                  </template>
                  <template x-if="duel.winnerId === null">
                    <p class="text-xl font-bold text-orange-500">Hasilnya SERI! Pertarungan yang sengit.</p>
                  </template>
                  
                  ${currentUser ? `
                  <a href="/dashboard/duels" class="mt-8 inline-block bg-white border-2 border-slate-200 hover:border-primary hover:text-primary text-slate-600 px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all">
                    Kembali ke Hub Duel
                  </a>
                  ` : `
                  <a href="/" class="mt-8 inline-block bg-primary text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all">
                    Kembali ke Beranda
                  </a>
                  `}
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
}
