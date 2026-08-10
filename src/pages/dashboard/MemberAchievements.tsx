import React, { useEffect, useState } from 'react';

export const MemberAchievements = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/dashboard/achievements');
        const json = await res.json();
        if (json.success) {
          setAchievements(json.data || []);
        } else {
          setError(json.error || 'Gagal memuat pencapaian');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat pencapaian...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-3">
            <span className="h-6 w-2 bg-[#FFC107] rounded-full"></span>
            Galeri Pencapaian
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-bold mt-2">Koleksi lencana dan penghargaan Anda dari berbagai aktivitas.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {achievements.length > 0 ? achievements.map((ach: any, idx: number) => (
          <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl hover:-translate-y-2 transition-all relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-[#FFC107]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-50 border-4 border-white shadow-inner flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform">
                <span className="text-4xl md:text-5xl">{ach.icon || '🎖️'}</span>
             </div>
             <h4 className="font-black text-[#1A237E] text-sm md:text-base mb-1 relative z-10">{ach.title}</h4>
             <p className="text-[10px] md:text-xs text-slate-400 font-bold leading-tight relative z-10">{ach.description}</p>
             
             {ach.date && (
               <div className="mt-4 text-[9px] font-black uppercase text-white bg-green-500 px-3 py-1 rounded-full relative z-10">
                 {new Date(ach.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
               </div>
             )}
          </div>
        )) : (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <div className="text-6xl mb-4 opacity-50">🏆</div>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs md:text-sm">Belum ada pencapaian yang diraih.</p>
             <p className="text-[10px] text-slate-400 mt-2">Selesaikan kuis dan materi untuk mengumpulkan lencana!</p>
          </div>
        )}
      </div>
    </div>
  );
};
