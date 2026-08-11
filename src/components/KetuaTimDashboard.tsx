import React, { useState, useEffect, useRef } from 'react';

export const KetuaTimDashboard = () => {
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState('');
  const [kpi, setKpi] = useState<any>({});
  const [funnel, setFunnel] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const init = async () => {
    setKpiLoading(true);
    setKpiError('');
    try {
      const res = await fetch('/api/dashboard/kpi-summary', { credentials: 'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — Cek apakah Anda sudah login sebagai Ketua Tim');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Server error');
      const d = json.data;
      setKpi(d.kpiCards || {});
      setFunnel(d.funnelChart || []);
      setHeatmap(d.heatmap || []);
      setKpiLoading(false);
      
      setTimeout(() => drawSpider(d.spiderChart || {}), 100);
    } catch(e: any) {
      console.error('[KPI Dashboard Error]', e.message);
      setKpiError(e.message);
      setKpiLoading(false);
    }
  };

  useEffect(() => {
    if (!(window as any).Chart) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
      script.onload = () => init();
      document.body.appendChild(script);
    } else {
      init();
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const drawSpider = (sd: any) => {
    if (!(window as any).Chart || !chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const labels = sd.labels || ['Content Velocity','Expert Responsiveness','User Engagement','Passing Rate','Category Coverage'];
    const data   = sd.data   || [0,0,0,0,0];
    
    chartInstance.current = new (window as any).Chart(chartRef.current, {
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
  };

  const funnelPct = (val: number) => {
    if (!funnel || !funnel.length) return 0;
    const max = funnel[0] ? funnel[0].value : 0;
    return max > 0 ? Math.round((val / max) * 100) : 0;
  };

  const heatMax = () => heatmap.reduce((m, d) => Math.max(m, d.count), 0);
  const heatColor = (count: number) => {
    const max = heatMax();
    if (max === 0 || count === 0) return '#EFF6FF';
    const r = count / max;
    if (r < 0.2) return '#DBEAFE';
    if (r < 0.4) return '#93C5FD';
    if (r < 0.6) return '#60A5FA';
    if (r < 0.8) return '#1D4ED8';
    return '#1A237E';
  };
  const heatH = (count: number) => {
    const max = heatMax();
    if (max === 0) return 20;
    return Math.round((count / max) * 80) + 20;
  };
  const fmtDate = (s: string) => {
    const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    const d = new Date(s);
    return days[d.getDay()] + ' ' + d.getDate();
  };

  return (
    <div className="space-y-6">
      {kpiLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-28">
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-72"></div>
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-72"></div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-40"></div>
        </div>
      )}

      {!kpiLoading && kpiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3 text-red-500"><i className="bi bi-exclamation-triangle"></i></div>
          <h3 className="text-base font-black text-red-700 mb-2">Gagal Memuat Dashboard</h3>
          <p className="text-sm text-red-500 font-medium">{kpiError}</p>
          <button onClick={init} className="mt-4 bg-[#1A237E] text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors">Coba Lagi</button>
        </div>
      )}

      {!kpiLoading && !kpiError && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A237E] to-blue-400 rounded-t-2xl"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Proyek Berjalan</p>
                  <p className="text-4xl font-black text-[#1A237E] leading-none">{kpi.totalActiveProjects || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Aktif saat ini</p>
                </div>
                <div className="bg-[#1A237E]/10 p-3 rounded-xl group-hover:bg-[#1A237E] transition-colors">
                  <svg className="h-6 w-6 text-[#1A237E] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5722] to-orange-300 rounded-t-2xl"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Revisi Kritis</p>
                  <p className={`text-4xl font-black leading-none ${(kpi.criticalRevisionCount || 0) > 0 ? 'text-[#FF5722]' : 'text-green-500'}`}>
                    {kpi.criticalRevisionCount || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Belum direspons</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl group-hover:bg-[#FF5722] transition-colors">
                  <svg className="h-6 w-6 text-[#FF5722] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FFC107] to-yellow-300 rounded-t-2xl"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pengguna</p>
                  <p className="text-4xl font-black text-[#FFC107] leading-none">{kpi.totalUsers || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Terdaftar di platform</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-xl group-hover:bg-[#FFC107] transition-colors">
                  <svg className="h-6 w-6 text-[#FFC107] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-300 rounded-t-2xl"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Online</p>
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-black text-emerald-500 leading-none">{kpi.liveUsers || 0}</p>
                    <span className="relative flex h-3 w-3 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">15 menit terakhir</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-500 transition-colors">
                  <svg className="h-6 w-6 text-emerald-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1.5 bg-[#1A237E] rounded-full"></div>
                <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest">Indeks Performa Produksi</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Spider Chart — 5 Dimensi Kinerja</p>
              <div className="relative" style={{ height: '280px' }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1.5 bg-[#FF5722] rounded-full"></div>
                <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest">Alur Konversi Pengguna</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Funnel — Membuka Materi ke Klaim Achievement</p>
              <div className="space-y-3">
                {funnel.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="text-[9px] font-black uppercase text-slate-500 w-36 shrink-0 text-right leading-tight">{stage.label}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-3"
                           style={{ width: funnelPct(stage.value) + '%', backgroundColor: stage.color }}>
                        <span className="text-[10px] font-black text-white">{stage.value}</span>
                      </div>
                    </div>
                    <div className="text-xs font-black text-slate-600 w-10 text-right">{funnelPct(stage.value)}%</div>
                  </div>
                ))}
                {funnel.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm italic">Belum ada data aktivitas pengguna.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-1.5 bg-[#FFC107] rounded-full"></div>
              <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest">Intensitas Aktivitas 7 Hari Terakhir</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-5">Heatmap — Pola Aktivitas Harian</p>
            <div className="flex items-end gap-2">
              {heatmap.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                  <div className="relative w-full group cursor-default">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1A237E] text-white text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                      {day.count} aktivitas
                    </div>
                    <div className="w-full rounded-md transition-all duration-500"
                         style={{ height: heatH(day.count) + 'px', backgroundColor: heatColor(day.count) }}></div>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 text-center">{fmtDate(day.date)}</div>
                  <div className="text-[9px] font-black text-[#1A237E]">{day.count}</div>
                </div>
              ))}
              {heatmap.length === 0 && (
                <div className="w-full text-center py-8 text-slate-400 text-sm italic">Belum ada data minggu ini.</div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Rendah</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded" style={{background:'#EFF6FF'}}></div>
                <div className="w-4 h-4 rounded" style={{background:'#BFDBFE'}}></div>
                <div className="w-4 h-4 rounded" style={{background:'#60A5FA'}}></div>
                <div className="w-4 h-4 rounded" style={{background:'#1D4ED8'}}></div>
                <div className="w-4 h-4 rounded" style={{background:'#1A237E'}}></div>
              </div>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Tinggi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
