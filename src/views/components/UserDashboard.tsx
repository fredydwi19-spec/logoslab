export const UserDashboard = ({ username }: { username: string }) => {
  return `
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('userDashboard', function() {
          return {
            loading: true,
            error: '',
            stats: { totalPlayed: 0, completedCount: 0, totalXp: 0, dailyStreak: 0 },
            resumeProject: null,
            recommendedProjects: [],
            leaderboard: [],
            unlockedBadges: [],

            init: async function() {
              try {
                var res = await fetch('/api/user/dashboard', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load user dashboard data');
                var data = await res.json();
                this.stats = data.stats;
                this.resumeProject = data.resumeProject;
                this.recommendedProjects = data.recommendedProjects;
                this.leaderboard = data.leaderboard;
                this.unlockedBadges = data.unlockedBadges;
                this.loading = false;
              } catch (err) {
                this.error = err.message;
                this.loading = false;
              }
            },

            formatDate: function(dateStr) {
              if (!dateStr) return '';
              return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            },

            getBadgeIcon: function(type) {
              switch(type) {
                case 'MATERI_TEKS_SELESAI': return '📝';
                case 'MATERI_VIDEO_SELESAI': return '🎥';
                case 'GAME_SELESAI': return '🎮';
                default: return '🏆';
              }
            }
          }
        });
      });
    </script>

    <div x-data="userDashboard()" class="space-y-8 pb-12">
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary to-blue-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative z-10">
          <h1 class="text-3xl font-black mb-2">Halo, ${username}! 👋</h1>
          <p class="text-blue-100 font-medium">Siap melanjutkan petualangan Alkitab hari ini?</p>
        </div>
      </div>

      <!-- Loading State -->
      <template x-if="loading">
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </template>

      <template x-if="!loading && !error">
        <div class="space-y-8">
          <!-- Gamification Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Card 1 -->
            <div class="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4">
              <div class="bg-blue-100 p-3 rounded-xl text-blue-600 text-2xl">🎮</div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Dimainkan</p>
                <p class="text-xl font-black text-primary" x-text="stats.totalPlayed"></p>
              </div>
            </div>
            <!-- Card 2 -->
            <div class="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4">
              <div class="bg-emerald-100 p-3 rounded-xl text-emerald-600 text-2xl">🏆</div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Selesai</p>
                <p class="text-xl font-black text-primary" x-text="stats.completedCount"></p>
              </div>
            </div>
            <!-- Card 3 -->
            <div class="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4">
              <div class="bg-amber-100 p-3 rounded-xl text-amber-600 text-2xl">✨</div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total XP</p>
                <p class="text-xl font-black text-primary" x-text="stats.totalXp + ' XP'"></p>
              </div>
            </div>
            <!-- Card 4 -->
            <div class="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4">
              <div class="bg-orange-100 p-3 rounded-xl text-orange-600 text-2xl">🔥</div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Beruntun</p>
                <p class="text-xl font-black text-primary" x-text="stats.dailyStreak + ' Hari'"></p>
              </div>
            </div>
          </div>

          <!-- Section 2: Activity & Recommended -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: Resume Project -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 class="text-sm font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <div class="w-1.5 h-4 bg-highlight rounded-full"></div> Lanjutkan Belajar/Main
              </h3>
              
              <template x-if="resumeProject">
                <div class="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all bg-slate-50/50">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <span class="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded mb-2 inline-block" x-text="resumeProject.type"></span>
                      <h4 class="font-bold text-slate-800 text-lg line-clamp-1" x-text="resumeProject.title"></h4>
                    </div>
                  </div>
                  
                  <div class="space-y-2 mb-6">
                    <div class="flex justify-between text-xs font-bold text-slate-500">
                      <span>Progress</span>
                      <span x-text="resumeProject.scrollPercentage + '%'"></span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div class="bg-primary h-2 rounded-full transition-all duration-500" :style="'width: ' + resumeProject.scrollPercentage + '%'"></div>
                    </div>
                  </div>
                  
                  <a :href="resumeProject.type === 'GAME' ? '/play/' + resumeProject.projectId : '/materi/' + resumeProject.projectId" 
                     class="block w-full py-3 px-4 bg-primary hover:bg-blue-900 text-white font-black text-sm text-center rounded-xl transition-all shadow-md">
                    LANJUTKAN SEKARANG
                  </a>
                </div>
              </template>
              
              <template x-if="!resumeProject">
                <div class="flex flex-col items-center justify-center py-10 text-center">
                  <div class="text-4xl mb-3 text-slate-300">🎯</div>
                  <p class="text-sm font-bold text-slate-500 mb-1">Tidak ada materi yang tertunda</p>
                  <p class="text-xs text-slate-400">Ayo mulai pelajari materi baru!</p>
                </div>
              </template>
            </div>

            <!-- Right: Recommended -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 class="text-sm font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <div class="w-1.5 h-4 bg-emerald-500 rounded-full"></div> Rekomendasi Untukmu
              </h3>
              
              <div class="space-y-4">
                <template x-for="proj in recommendedProjects" :key="proj.id">
                  <div class="flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div class="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                      <template x-if="proj.thumbnailUrl">
                        <img :src="proj.thumbnailUrl" class="w-full h-full object-cover" />
                      </template>
                      <template x-if="!proj.thumbnailUrl">
                        <div class="w-full h-full flex items-center justify-center text-slate-400 text-2xl" x-text="proj.type === 'GAME' ? '🎮' : '📚'"></div>
                      </template>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-[10px] font-black uppercase text-slate-400" x-text="'#' + proj.type"></span>
                      <h4 class="font-bold text-slate-800 text-sm truncate" x-text="proj.title"></h4>
                    </div>
                    <a :href="proj.type === 'GAME' ? '/play/' + proj.id : '/materi/' + proj.id" class="px-3 py-2 bg-slate-100 hover:bg-primary hover:text-white text-primary font-black text-[10px] rounded-lg transition-colors whitespace-nowrap">
                      MAIN/BACA
                    </a>
                  </div>
                </template>
                <template x-if="recommendedProjects.length === 0">
                  <p class="text-sm text-slate-500 text-center py-4">Belum ada rekomendasi saat ini.</p>
                </template>
              </div>
            </div>
          </div>

          <!-- Section 3: Leaderboard & Achievements -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: Leaderboard -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 class="text-sm font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <div class="w-1.5 h-4 bg-accent rounded-full"></div> Top 5 Leaderboard
              </h3>
              
              <div class="space-y-3">
                <template x-for="(user, index) in leaderboard" :key="index">
                  <div class="flex items-center gap-4 p-3 rounded-xl border border-slate-50 relative overflow-hidden group hover:shadow-md transition-all"
                       :class="index === 0 ? 'bg-amber-50 border-amber-100' : index === 1 ? 'bg-slate-50' : index === 2 ? 'bg-orange-50/50' : ''">
                    <div class="w-8 font-black text-center" 
                         :class="index === 0 ? 'text-amber-500 text-xl' : index === 1 ? 'text-slate-400 text-xl' : index === 2 ? 'text-orange-400 text-xl' : 'text-slate-300'"
                         x-text="index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index+1)">
                    </div>
                    <div class="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shadow-sm shrink-0">
                      <template x-if="user.avatarUrl">
                        <img :src="user.avatarUrl" class="w-full h-full object-cover" />
                      </template>
                      <template x-if="!user.avatarUrl">
                        <div class="w-full h-full flex justify-center items-center bg-slate-300 text-slate-500 font-bold" x-text="user.name.charAt(0)"></div>
                      </template>
                    </div>
                    <div class="flex-1">
                      <h4 class="font-bold text-sm text-slate-800" x-text="user.name"></h4>
                    </div>
                    <div class="font-black text-primary text-sm" x-text="user.totalXp + ' XP'"></div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Right: Achievements -->
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <h3 class="text-sm font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <div class="w-1.5 h-4 bg-purple-500 rounded-full"></div> Koleksi Lencana
              </h3>
              
              <div class="grid grid-cols-4 gap-4">
                <template x-for="badge in unlockedBadges" :key="badge.claimedAt">
                  <div class="flex flex-col items-center group cursor-help">
                    <div class="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-300 rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform mb-2">
                      <span x-text="getBadgeIcon(badge.achievementType)"></span>
                    </div>
                    <p class="text-[9px] font-bold text-slate-500 text-center line-clamp-2" x-text="badge.achievementType.replace(/_/g, ' ')"></p>
                  </div>
                </template>
                <template x-if="unlockedBadges.length === 0">
                  <div class="col-span-4 py-8 text-center">
                    <div class="text-4xl text-slate-300 mb-2">🏅</div>
                    <p class="text-sm text-slate-400 font-medium">Belum ada lencana. Terus bermain dan belajar!</p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
};
