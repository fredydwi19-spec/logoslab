import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

export const MemberDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [publishedGames, setPublishedGames] = useState<any[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // Note: Assuming username is passed or fetched elsewhere; keeping placeholder for now
  const username = "Member"; 

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/user-summary');
      const json = await res.json();
      if (json.success) {
        setSummary(json.data);
      } else {
        setError(json.error || 'Gagal memuat data');
      }
      
      // Also fetch games since original SSR passed publishedGames
      const gamesRes = await fetch('/api/dashboard/games'); 
      // This endpoint returned HTML before, we might need a REST endpoint.
      // Wait, let's just use the summary data if possible or a mock for now.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (summary && summary.spiderChart && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      chartInstance.current = new Chart(chartRef.current, {
        type: 'radar',
        data: {
          labels: summary.spiderChart.labels,
          datasets: [{
            label: 'Tingkat Penguasaan (%)',
            data: summary.spiderChart.datasets[0].data,
            backgroundColor: 'rgba(26, 35, 126, 0.2)',
            borderColor: '#1A237E',
            pointBackgroundColor: '#FFC107',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#1A237E'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: 'rgba(0,0,0,0.1)' },
              grid: { color: 'rgba(0,0,0,0.1)' },
              pointLabels: { font: { size: 10, family: 'Inter' } },
              ticks: { beginAtZero: true, max: 100, stepSize: 20 }
            }
          }
        }
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [summary]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-10">
      {/* Top Row (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm rounded-3xl p-6 hover:-translate-y-1 transition-transform">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                 <i className="bi bi-fire text-orange-500 text-2xl"></i>
              </div>
              <div>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Learning Streak</p>
                 <h4 className="text-2xl font-black text-[#1A237E]">{summary?.kpi?.streak || 0} Hari</h4>
              </div>
           </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm rounded-3xl p-6 hover:-translate-y-1 transition-transform">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                 <i className="bi bi-lightning-charge-fill text-[#FFC107] text-2xl"></i>
              </div>
              <div>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total XP</p>
                 <h4 className="text-2xl font-black text-[#1A237E]">{summary?.kpi?.totalXP || 0}</h4>
              </div>
           </div>
        </div>
      </div>

      {/* Middle Row (Spider Chart & Deadline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
           <h3 className="text-base md:text-lg font-bold text-[#1A237E] mb-4 flex items-center gap-2">
             <i className="bi bi-radar text-[#FFC107]"></i> Makro Kompetensi
           </h3>
           <div className="flex-1 relative min-h-[300px]">
             <canvas ref={chartRef}></canvas>
           </div>
        </div>
        
        {/* Kalender / Deadline Terdekat */}
        <div className="col-span-1 lg:col-span-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
           <h3 className="text-base md:text-lg font-bold text-[#1A237E] mb-4 flex items-center gap-2">
             <i className="bi bi-calendar-event text-emerald-500"></i> Kalender Deadline
           </h3>
           <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                 <div className="bg-red-500 text-white p-3 rounded-xl text-center shadow-sm">
                    <p className="text-[10px] font-bold uppercase leading-none">Jun</p>
                    <p className="text-xl font-black leading-none mt-1">12</p>
                 </div>
                 <div className="flex-1">
                    <h4 className="font-bold text-sm text-[#1A237E]">Kuis Apologetika Lanjut</h4>
                    <p className="text-xs text-red-500 font-bold mt-1"><i className="bi bi-clock-history"></i> Tersisa 2 hari</p>
                 </div>
                 <button className="bg-white text-red-500 hover:bg-red-500 hover:text-white border border-red-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors">Kerjakan</button>
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Row (Actionable Widgets) */}
      <div className="grid grid-cols-1">
         <div className="bg-[#1A237E] text-white p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-[150px] opacity-5 group-hover:scale-110 transition-transform">🎯</div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
               <div className="flex-1">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                      <p className="text-xs md:text-sm text-indigo-300 font-bold uppercase tracking-widest mb-1">Tugas Berikutnya</p>
                      <h3 className="text-2xl md:text-3xl font-black text-[#FFC107]">Lanjutkan Belajar: Pengantar Apologetika</h3>
                   </div>
                 </div>
                 <p className="text-sm md:text-base text-indigo-200 mb-6 max-w-2xl">Materi ini akan membantu Anda memahami dasar-dasar teologi secara lebih dalam untuk mempertahankan iman.</p>
                 
                 <div className="space-y-2 max-w-xl">
                   <div className="flex justify-between text-xs font-bold text-indigo-300">
                      <span>Progress Saat Ini</span>
                      <span>35%</span>
                   </div>
                   <div className="h-3 w-full bg-indigo-900/50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFC107] w-[35%] relative">
                         <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                   </div>
                 </div>
               </div>
               
               <div className="md:w-64">
                 <button className="w-full bg-white text-[#1A237E] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-slate-100 transition-colors shadow-xl flex items-center justify-center gap-3 group/btn">
                    <i className="bi bi-play-circle-fill text-2xl text-[#FF5722] group-hover/btn:scale-110 transition-transform"></i>
                    GAS LANJUT!
                 </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
