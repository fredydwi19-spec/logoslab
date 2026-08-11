import React, { useState, useEffect } from 'react';

export const PembuatDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation, we would fetch the summary or projects for the pembuat here
    setTimeout(() => {
      setProjects([
        { id: 1, title: 'Game Apologetika', status: 'DRAFT', type: 'GAME' },
        { id: 2, title: 'Materi Eksegesis', status: 'REVIEW_PAKAR', type: 'MATERI' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-32"></div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-32"></div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 bg-[#FFC107] rounded-full"></div>
        <h2 className="text-xl font-bold text-[#1A237E] uppercase tracking-widest">Workspace Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A237E] to-blue-400"></div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Status Workspace</h3>
          <p className="text-3xl font-black text-[#1A237E]">Aktif</p>
          <p className="text-xs text-slate-500 mt-2">Anda memiliki {projects.length} proyek dalam pengerjaan.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5722] to-orange-300"></div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Limit Soal & Poin</h3>
          <p className="text-3xl font-black text-[#FF5722]">Aman</p>
          <p className="text-xs text-slate-500 mt-2">Kapasitas pembuatan masih mencukupi.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest mb-4">Proyek Terakhir</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-slate-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-black">Judul Proyek</th>
                <th className="px-6 py-4 font-black">Tipe</th>
                <th className="px-6 py-4 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-50">
              {projects.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#1A237E]">{p.title}</td>
                  <td className="px-6 py-4"><span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold uppercase">{p.type}</span></td>
                  <td className="px-6 py-4"><span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold uppercase">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
