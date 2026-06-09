export const KetuaTimDashboard = () => {
  return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('kpiDash', function() {
          return {
            kpiLoading: true,
            kpiError: '',
            kpi: {},
            funnel: [],
            heatmap: [],
            _chart: null,

            init: async function() {
              try {
                var res = await fetch('/api/dashboard/kpi-summary', { credentials: 'include' });
                if (!res.ok) throw new Error('HTTP ' + res.status + ' — Cek apakah Anda sudah login sebagai Ketua Tim');
                var json = await res.json();
                if (!json.success) throw new Error(json.error || 'Server error');
                var d = json.data;
                this.kpi     = d.kpiCards    || {};
                this.funnel  = d.funnelChart || [];
                this.heatmap = d.heatmap     || [];
                this.kpiLoading = false;
                var self = this;
                this.$nextTick(function() { self.drawSpider(d.spiderChart || {}); });
              } catch(e) {
                console.error('[KPI Dashboard Error]', e.message);
                this.kpiError = e.message;
                this.kpiLoading = false;
              }
            },

            drawSpider: function(sd) {
              try {
                if (typeof Chart === 'undefined') { console.warn('Chart.js not ready'); return; }
                var canvas = document.getElementById('kpiSpiderCanvas');
                if (!canvas) return;
                if (this._chart) { this._chart.destroy(); this._chart = null; }
                var labels = sd.labels || ['Content Velocity','Expert Responsiveness','User Engagement','Passing Rate','Category Coverage'];
                var data   = sd.data   || [0,0,0,0,0];
                this._chart = new Chart(canvas, {
                  type: 'radar',
                  data: {
                    labels: labels,
                    datasets: [{
                      label: 'Kinerja Platform',
                      data: data,
                      backgroundColor: 'rgba(26,35,126,0.15)',
                      borderColor: '#1A237E',
                      borderWidth: 2.5,
                      pointBackgroundColor: '#FFC107',
                      pointBorderColor: '#1A237E',
                      pointHoverBackgroundColor: '#FF5722',
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      fill: true
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 25, color: '#94a3b8', font: { size: 10 }, backdropColor: 'transparent' },
                        grid: { color: 'rgba(148,163,184,0.25)' },
                        angleLines: { color: 'rgba(148,163,184,0.3)' },
                        pointLabels: { color: '#1A237E', font: { size: 11 } }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#1A237E',
                        titleColor: '#FFC107',
                        bodyColor: '#fff',
                        padding: 10,
                        cornerRadius: 8
                      }
                    }
                  }
                });
              } catch(e) { console.error('[Spider]', e); }
            },

            funnelPct: function(val) {
              if (!this.funnel || !this.funnel.length) return 0;
              var max = this.funnel[0] ? this.funnel[0].value : 0;
              return max > 0 ? Math.round((val / max) * 100) : 0;
            },

            heatMax: function() {
              return this.heatmap.reduce(function(m, d) { return Math.max(m, d.count); }, 0);
            },

            heatColor: function(count) {
              var max = this.heatMax();
              if (max === 0 || count === 0) return '#EFF6FF';
              var r = count / max;
              if (r < 0.2) return '#DBEAFE';
              if (r < 0.4) return '#93C5FD';
              if (r < 0.6) return '#60A5FA';
              if (r < 0.8) return '#1D4ED8';
              return '#1A237E';
            },

            heatH: function(count) {
              var max = this.heatMax();
              if (max === 0) return 20;
              return Math.round((count / max) * 80) + 20;
            },

            fmtDate: function(s) {
              var days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
              var d = new Date(s);
              return days[d.getDay()] + ' ' + d.getDate();
            }
          };
        });
      });
    </script>

    <div x-data="kpiDash()" class="space-y-6">

      <!-- SKELETON -->
      <template x-if="kpiLoading">
        <div class="space-y-6">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <template x-for="i in [1,2,3,4]" :key="i">
              <div class="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-28">
                <div class="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div class="h-8 bg-slate-200 rounded w-1/3"></div>
              </div>
            </template>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-72"></div>
            <div class="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-72"></div>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-40"></div>
        </div>
      </template>

      <!-- ERROR STATE -->
      <template x-if="!kpiLoading && kpiError">
        <div class="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div class="text-4xl mb-3 text-red-500"><i class="bi bi-exclamation-triangle"></i></div>
          <h3 class="text-base font-black text-red-700 mb-2">Gagal Memuat Dashboard</h3>
          <p class="text-sm text-red-500 font-medium" x-text="kpiError"></p>
          <button @click="kpiLoading=true; kpiError=''; init()" class="mt-4 bg-[#1A237E] text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors">Coba Lagi</button>
        </div>
      </template>

      <!-- DASHBOARD CONTENT -->
      <template x-if="!kpiLoading && !kpiError">
        <div class="space-y-6">

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div class="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A237E] to-blue-400 rounded-t-2xl"></div>
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Proyek Berjalan</p>
                  <p class="text-4xl font-black text-[#1A237E] leading-none" x-text="kpi.totalActiveProjects || 0"></p>
                  <p class="text-[10px] text-slate-400 mt-2 font-medium">Aktif saat ini</p>
                </div>
                <div class="bg-[#1A237E]/10 p-3 rounded-xl group-hover:bg-[#1A237E] transition-colors">
                  <svg class="h-6 w-6 text-[#1A237E] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
              </div>
            </div>

            <div class="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5722] to-orange-300 rounded-t-2xl"></div>
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Revisi Kritis</p>
                  <p class="text-4xl font-black leading-none"
                     :class="(kpi.criticalRevisionCount || 0) > 0 ? 'text-[#FF5722]' : 'text-green-500'"
                     x-text="kpi.criticalRevisionCount || 0"></p>
                  <p class="text-[10px] text-slate-400 mt-2 font-medium">Belum direspons</p>
                </div>
                <div class="bg-orange-50 p-3 rounded-xl group-hover:bg-[#FF5722] transition-colors">
                  <svg class="h-6 w-6 text-[#FF5722] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
              </div>
            </div>

            <div class="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FFC107] to-yellow-300 rounded-t-2xl"></div>
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pengguna</p>
                  <p class="text-4xl font-black text-[#FFC107] leading-none" x-text="kpi.totalUsers || 0"></p>
                  <p class="text-[10px] text-slate-400 mt-2 font-medium">Terdaftar di platform</p>
                </div>
                <div class="bg-yellow-50 p-3 rounded-xl group-hover:bg-[#FFC107] transition-colors">
                  <svg class="h-6 w-6 text-[#FFC107] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
              </div>
            </div>

            <div class="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-300 rounded-t-2xl"></div>
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Online</p>
                  <div class="flex items-center gap-2">
                    <p class="text-4xl font-black text-emerald-500 leading-none" x-text="kpi.liveUsers || 0"></p>
                    <span class="relative flex h-3 w-3 mt-1">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-2 font-medium">15 menit terakhir</p>
                </div>
                <div class="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-500 transition-colors">
                  <svg class="h-6 w-6 text-emerald-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Spider Chart + Funnel -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div class="flex items-center gap-3 mb-4">
                <div class="h-6 w-1.5 bg-[#1A237E] rounded-full"></div>
                <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest">Indeks Performa Produksi</h3>
              </div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Spider Chart — 5 Dimensi Kinerja</p>
              <div class="relative" style="height:280px">
                <canvas id="kpiSpiderCanvas"></canvas>
              </div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div class="flex items-center gap-3 mb-4">
                <div class="h-6 w-1.5 bg-[#FF5722] rounded-full"></div>
                <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest">Alur Konversi Pengguna</h3>
              </div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Funnel — Membuka Materi ke Klaim Achievement</p>
              <div class="space-y-3">
                <template x-for="(stage, idx) in funnel" :key="idx">
                  <div class="flex items-center gap-3">
                    <div class="text-[9px] font-black uppercase text-slate-500 w-36 shrink-0 text-right leading-tight" x-text="stage.label"></div>
                    <div class="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div class="h-full rounded-full flex items-center justify-end pr-3"
                           :style="'width:' + funnelPct(stage.value) + '%;background-color:' + stage.color">
                        <span class="text-[10px] font-black text-white" x-text="stage.value"></span>
                      </div>
                    </div>
                    <div class="text-xs font-black text-slate-600 w-10 text-right" x-text="funnelPct(stage.value) + '%'"></div>
                  </div>
                </template>
                <div x-show="funnel.length === 0" class="text-center py-8 text-slate-400 text-sm italic">Belum ada data aktivitas pengguna.</div>
              </div>
            </div>
          </div>

          <!-- Heatmap -->
          <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-6 w-1.5 bg-[#FFC107] rounded-full"></div>
              <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest">Intensitas Aktivitas 7 Hari Terakhir</h3>
            </div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-5">Heatmap — Pola Aktivitas Harian</p>
            <div class="flex items-end gap-2">
              <template x-for="(day, idx) in heatmap" :key="idx">
                <div class="flex flex-col items-center gap-1 flex-1">
                  <div class="relative w-full group cursor-default">
                    <div class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1A237E] text-white text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none"
                         x-text="day.count + ' aktivitas'"></div>
                    <div class="w-full rounded-md transition-all duration-500"
                         :style="'height:' + heatH(day.count) + 'px;background-color:' + heatColor(day.count)"></div>
                  </div>
                  <div class="text-[9px] font-bold text-slate-400 text-center" x-text="fmtDate(day.date)"></div>
                  <div class="text-[9px] font-black text-[#1A237E]" x-text="day.count"></div>
                </div>
              </template>
              <div x-show="heatmap.length === 0" class="w-full text-center py-8 text-slate-400 text-sm italic">Belum ada data minggu ini.</div>
            </div>
            <div class="flex items-center gap-2 mt-4 justify-end">
              <span class="text-[9px] text-slate-400 font-bold uppercase">Rendah</span>
              <div class="flex gap-1">
                <div class="w-4 h-4 rounded" style="background:#EFF6FF"></div>
                <div class="w-4 h-4 rounded" style="background:#BFDBFE"></div>
                <div class="w-4 h-4 rounded" style="background:#60A5FA"></div>
                <div class="w-4 h-4 rounded" style="background:#1D4ED8"></div>
                <div class="w-4 h-4 rounded" style="background:#1A237E"></div>
              </div>
              <span class="text-[9px] text-slate-400 font-bold uppercase">Tinggi</span>
            </div>
          </div>

        </div>
      </template>
    </div>
  `;
};
